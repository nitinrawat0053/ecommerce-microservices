import type { Request, Response, NextFunction } from "express";
import { redisClient } from "@packages/redis";

/**
 * Atomic INCR + conditional EXPIRE Lua script.
 * Shared across the microservices ecosystem.
 */
const INCR_WINDOW_SCRIPT = `
  local count = redis.call("INCR", KEYS[1])
  if count == 1 then
    redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
  end
  return count
`;

const WINDOW_1_MIN = 60;
const WINDOW_15_MIN = 15 * 60;

/** Extract client IP from x-forwarded-for or req.ip */
export const clientIp = (req: Request): string => {
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const first = Array.isArray(xff) ? xff[0] : xff.split(",")[0];
    return first.trim();
  }
  return req.ip ?? "unknown";
};

/** Caller's userId from req.user or x-user-id header */
export const userId = (req: Request): string =>
  req.user?.userId ||
  (req.headers["x-user-id"] as string | undefined)?.trim() ||
  "anonymous";

/** Normalize target email address */
export const normalizeEmail = (raw?: string): string => {
  if (!raw) return "unknown";
  return raw.trim().toLowerCase();
};

/** Normalize target phone number */
export const normalizePhone = (raw?: string): string => {
  if (!raw) return "unknown";
  return raw.trim().replace(/[\s\-\(\)\.]/g, "");
};

interface RateRule {
  key: (req: Request) => string;
  limit: number;
  windowSeconds: number;
}

export const createRedisRateLimiter = (
  rules: RateRule[],
  message: string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const rule of rules) {
        const key = rule.key(req);
        const count = (await redisClient.eval(
          INCR_WINDOW_SCRIPT,
          1,
          key,
          rule.windowSeconds.toString()
        )) as number;

        if (count > rule.limit) {
          let retryAfter = rule.windowSeconds;
          try {
            const ttl = await redisClient.ttl(key);
            if (ttl > 0) retryAfter = ttl;
          } catch {
            // keep default
          }

          res.setHeader("Retry-After", retryAfter.toString());
          res.setHeader("RateLimit-Limit", rule.limit.toString());
          res.setHeader("RateLimit-Remaining", "0");

          return res.status(429).json({
            success: false,
            message,
            retryAfter,
          });
        }
      }

      next();
    } catch (error) {
      console.error(
        "[Notification Service] Redis rate limiter error:",
        (error as Error)?.message || error
      );
      // Fail closed to prevent expensive third-party budget exhaustion (Twilio/Resend)
      return res.status(503).json({
        success: false,
        message: "Service temporarily unavailable. Please try again later.",
      });
    }
  };
};

// ─── 1. Send Email Rate Limiter ───────────────────────────────────────────────
// Mitigates email bombing, scraper abuse, and Resend API quota drain.
export const sendEmailRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:notif_email:ip:${clientIp(req)}`,
      limit: 10,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:notif_email:burst:${clientIp(req)}`,
      limit: 3,
      windowSeconds: WINDOW_1_MIN,
    },
    {
      key: (req) =>
        `rate_limit:notif_email:target:${normalizeEmail(
          req.body?.email || req.body?.recipient
        )}`,
      limit: 5,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:notif_email:user:${userId(req)}`,
      limit: 5,
      windowSeconds: WINDOW_15_MIN,
    },
  ],
  "Too many email requests. Please slow down to prevent abuse."
);

// ─── 2. Send SMS Rate Limiter ─────────────────────────────────────────────────
// Highly strict: protects against Twilio toll fraud, carrier charges, and SMS bombing.
export const sendSmsRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:notif_sms:ip:${clientIp(req)}`,
      limit: 5,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:notif_sms:burst:${clientIp(req)}`,
      limit: 2,
      windowSeconds: WINDOW_1_MIN,
    },
    {
      key: (req) =>
        `rate_limit:notif_sms:target:${normalizePhone(
          req.body?.phone || req.body?.recipient
        )}`,
      limit: 3,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:notif_sms:user:${userId(req)}`,
      limit: 3,
      windowSeconds: WINDOW_15_MIN,
    },
  ],
  "Too many SMS requests. SMS sending is strictly rate-limited for security."
);

// ─── 3. Resend OTP / Notification Rate Limiter with 60s Cooldown ──────────────
export const resendNotificationRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const target =
    normalizeEmail(req.body?.email) !== "unknown"
      ? normalizeEmail(req.body?.email)
      : normalizePhone(req.body?.phone || req.body?.recipient) !== "unknown"
      ? normalizePhone(req.body?.phone || req.body?.recipient)
      : userId(req);

  const cooldownKey = `rate_limit:notif_resend:cooldown:${target}`;
  const countKey = `rate_limit:notif_resend:count:${target}`;

  try {
    // 1. Check active cooldown
    const ttl = await redisClient.ttl(cooldownKey);
    if (ttl > 0) {
      const retryAfter = ttl;
      res.setHeader("Retry-After", retryAfter.toString());
      res.setHeader("RateLimit-Limit", "1");
      res.setHeader("RateLimit-Remaining", "0");
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another notification or OTP.",
        retryAfter,
      });
    }

    // 2. Check 15-minute quota limit (max 3 resends per target/user)
    const count = (await redisClient.eval(
      INCR_WINDOW_SCRIPT,
      1,
      countKey,
      WINDOW_15_MIN.toString()
    )) as number;

    if (count > 3) {
      const windowTtl = (await redisClient.ttl(countKey)) || WINDOW_15_MIN;
      res.setHeader("Retry-After", windowTtl.toString());
      res.setHeader("RateLimit-Limit", "3");
      res.setHeader("RateLimit-Remaining", "0");
      return res.status(429).json({
        success: false,
        message: "Too many resend attempts. Please wait 15 minutes before trying again.",
        retryAfter: windowTtl,
      });
    }

    // 3. Set cooldown key for 60 seconds
    await redisClient.set(cooldownKey, "1", "EX", 60);

    next();
  } catch (error) {
    console.error(
      "[Notification Service] Resend rate limiter error:",
      (error as Error)?.message || error
    );
    return res.status(503).json({
      success: false,
      message: "Service temporarily unavailable. Please try again later.",
    });
  }
};

// ─── 4. User Notifications Retrieval Rate Limiter ─────────────────────────────
export const getUserNotificationsRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:notif_get:user:${userId(req)}`,
      limit: 60,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:notif_get:burst:${userId(req)}`,
      limit: 15,
      windowSeconds: WINDOW_1_MIN,
    },
    {
      key: (req) => `rate_limit:notif_get:ip:${clientIp(req)}`,
      limit: 120,
      windowSeconds: WINDOW_15_MIN,
    },
  ],
  "Too many requests to fetch notifications. Please slow down."
);

// ─── 5. Mark Notification Read Rate Limiter ───────────────────────────────────
export const markNotificationReadRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:notif_read:user:${userId(req)}`,
      limit: 60,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:notif_read:burst:${userId(req)}`,
      limit: 20,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many update requests. Please slow down."
);

// ─── 6. Internal Service Notification Limiter & Deduplication ─────────────────
export const internalNotificationRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const serviceKey = (req.headers["x-service"] as string) || "internal";
  const rateKey = `rate_limit:notif_internal:${serviceKey}`;
  const dedupKeyParam =
    req.body?.eventId || req.body?.idempotencyKey || req.body?.orderId;

  try {
    // 1. Concurrency / Loop runaway protection: 300 requests / minute per internal service
    const count = (await redisClient.eval(
      INCR_WINDOW_SCRIPT,
      1,
      rateKey,
      WINDOW_1_MIN.toString()
    )) as number;

    if (count > 300) {
      return res.status(429).json({
        success: false,
        message: "Internal rate limit exceeded. Please back off.",
      });
    }

    // 2. Duplicate notification / retry abuse prevention
    if (dedupKeyParam) {
      const dedupKey = `notif_dedup:${serviceKey}:${dedupKeyParam}`;
      const acquired = await redisClient.set(dedupKey, "1", "EX", 60, "NX");
      if (!acquired) {
        return res.status(409).json({
          success: false,
          message: "Duplicate notification event ignored (already processed).",
        });
      }
    }

    next();
  } catch (error) {
    console.error(
      "[Notification Service] Internal rate limiter error:",
      (error as Error)?.message || error
    );
    // Allow internal pipeline to continue if Redis fails open, avoiding pipeline block
    next();
  }
};
