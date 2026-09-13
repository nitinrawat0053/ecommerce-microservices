import type { Request, Response, NextFunction } from "express";
import { redisClient } from "@packages/redis";

/**
 * Atomic INCR + conditional EXPIRE.
 *
 * The EXPIRE is only set on the first increment of a key so the window is
 * measured from the first request, and INCR round-trips atomically so
 * concurrent requests cannot race past the limit (each INCR returns a
 * unique, monotonic count).
 *
 * Keys are created with the requested window as their TTL and auto-expire,
 * so no manual cleanup is needed.
 */
const INCR_WINDOW_SCRIPT = `
  local count = redis.call("INCR", KEYS[1])
  if count == 1 then
    redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
  end
  return count
`;

/** Normalize emails before they are used in Redis keys. */
const normalizeEmail = (email: string): string =>
  (email || "").trim().toLowerCase();

const WINDOW_15_MIN = 15 * 60;
const WINDOW_10_MIN = 10 * 60;

interface RateRule {
  /** Redis key to increment for this request. */
  key: (req: Request) => string;
  /** Maximum allowed requests within the window. */
  limit: number;
  /** Window length in seconds (also the key TTL). */
  windowSeconds: number;
}

/**
 * Build a Redis-backed rate limiting middleware.
 *
 * Counters live in Redis (not process memory), so limits are shared across
 * instances and survive restarts. On a Redis failure we fail CLOSED with a
 * generic 503 — we never fall through to let traffic bypass a limit, and we
 * never leak Redis internals to the client.
 */
const createRedisRateLimiter = (rules: RateRule[], message: string) => {
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
          const ttl = await redisClient.ttl(key);
          if (ttl > 0) retryAfter = ttl;

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
        "[Auth Service] Redis rate limiter error:",
        (error as Error)?.message || error
      );
      return res.status(503).json({
        success: false,
        message: "Service temporarily unavailable. Please try again later.",
      });
    }
  };
};

const ipKey =
  (prefix: string) =>
  (req: Request): string =>
    `rate_limit:${prefix}:ip:${req.ip}`;

const emailKey =
  (prefix: string) =>
  (req: Request): string =>
    `rate_limit:${prefix}:email:${normalizeEmail(req.body?.email)}`;

// ─── Existing limits, migrated to Redis (behavior unchanged) ──────────

export const registerRateLimiter = createRedisRateLimiter(
  [{ key: ipKey("register"), limit: 5, windowSeconds: WINDOW_15_MIN }],
  "Too many registration attempts. Please try again later."
);

export const verifyPhoneRateLimiter = createRedisRateLimiter(
  [{ key: ipKey("verify_phone"), limit: 5, windowSeconds: WINDOW_10_MIN }],
  "Too many verification attempts. Please try again later."
);

// ─── Forgot password ──────────────────────────────────────────────────

export const forgotPasswordRateLimiter = createRedisRateLimiter(
  [
    {
      key: ipKey("forgot_password"),
      limit: 5,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: emailKey("forgot_password"),
      limit: 3,
      windowSeconds: WINDOW_15_MIN,
    },
  ],
  "Too many password reset attempts. Please try again later."
);

// ─── Resend reset OTP ─────────────────────────────────────────────

export const resendResetOtpRateLimiter = createRedisRateLimiter(
  [
    { key: ipKey("resend_otp"), limit: 5, windowSeconds: WINDOW_10_MIN },
    { key: emailKey("resend_otp"), limit: 3, windowSeconds: WINDOW_10_MIN },
  ],
  "Too many OTP resend attempts. Please try again later."
);