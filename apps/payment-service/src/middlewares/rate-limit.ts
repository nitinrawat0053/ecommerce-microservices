import type { Request, Response, NextFunction } from "express";
import { redisClient } from "@packages/redis";

/**
 * Atomic INCR + conditional EXPIRE (matches the pattern used in auth-service
 * and order-service).
 */
const INCR_WINDOW_SCRIPT = `
  local count = redis.call("INCR", KEYS[1])
  if count == 1 then
    redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
  end
  return count
`;

// ── Window constants ──────────────────────────────────────────────────────────

const WINDOW_1_MIN  =  1 * 60;
const WINDOW_15_MIN = 15 * 60;
const WINDOW_1_HOUR = 60 * 60;

// ── Key builders ──────────────────────────────────────────────────────────────

/**
 * Extract the real client IP from the x-forwarded-for header set by the API
 * gateway / nginx proxy. Falls back to req.ip and then "unknown".
 */
export const clientIp = (req: Request): string => {
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const first = Array.isArray(xff) ? xff[0] : xff.split(",")[0];
    return first.trim();
  }
  return req.ip ?? "unknown";
};

/** Caller's userId from the x-user-id header injected by the API gateway. */
export const userId = (req: Request): string =>
  (req.headers["x-user-id"] as string | undefined)?.trim() || "anonymous";

interface RateRule {
  key: (req: Request) => string;
  limit: number;
  windowSeconds: number;
}

/**
 * Redis-backed rate limiting middleware factory.
 *
 * Rules are evaluated in order.  On Redis failure we fail CLOSED (503) so
 * limits are never silently bypassed.
 */
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
        "[Payment Service] Redis rate limiter error:",
        (error as Error)?.message || error
      );
      return res.status(503).json({
        success: false,
        message: "Service temporarily unavailable. Please try again later.",
      });
    }
  };
};

// ─── Payment Verification ─────────────────────────────────────────────────────
//
// Guards POST /payments/verify against:
//   - Automated signature brute-forcing
//   - Duplicate verify submissions (accidental double-clicks / retries)
//
//   • Per-IP:   10 / 15 min  — blocks scanners
//   • Per-user: 5  / 15 min  — per-identity guard
//   • Burst:    3  / 1 min   — stops rapid duplicate submits

export const verifyPaymentRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:payment_verify:ip:${clientIp(req)}`,
      limit: 10,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:payment_verify:user:${userId(req)}`,
      limit: 5,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:payment_verify:user_burst:${userId(req)}`,
      limit: 3,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many payment verification attempts. Please try again later."
);

// ─── Webhook deduplication guard ──────────────────────────────────────────────
//
// Razorpay retries webhook delivery for up to 24 hours if the endpoint does
// not respond with 2xx.  During a retry storm or slow DB write, multiple
// concurrent deliveries of the same event can arrive before the first one has
// committed the status update.  The service layer already checks
// payment.status === SUCCESS before updating, but that check is a DB read and
// two concurrent webhook deliveries can both pass it before either write lands.
//
// This middleware provides a Redis SET NX guard so only ONE delivery of each
// unique webhook event ID proceeds past the middleware per dedup window.
// Subsequent deliveries within the window get 200 (not 429) so Razorpay does
// not schedule another retry.
//
// The event ID comes from the Razorpay webhook payload's `event` + the
// internal Razorpay payment entity ID.  Razorpay does not expose a stable
// per-delivery ID in the headers, so we use <event_type>:<razorpay_payment_id>
// as the dedup key — unique per event per payment.

export const webhookDeduplicationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // The raw body arrives as a Buffer (express.raw was applied upstream in
    // app.ts).  Parse it to extract the dedup key components.
    let eventType: string | undefined;
    let paymentId: string | undefined;

    try {
      const payload = JSON.parse((req.body as Buffer).toString());
      eventType = payload?.event;
      paymentId = payload?.payload?.payment?.entity?.id;
    } catch {
      // Malformed JSON — pass through; the controller will reject it properly.
      next();
      return;
    }

    // If we cannot build a meaningful dedup key, pass through.
    if (!eventType || !paymentId) {
      next();
      return;
    }

    const dedupKey = `webhook:dedup:${eventType}:${paymentId}`;
    // 24-hour window (Razorpay's max retry horizon).  SET NX returns "OK" on
    // the first call and null on subsequent calls within the window.
    const acquired = await redisClient.set(dedupKey, "1", "EX", WINDOW_1_HOUR * 24, "NX");

    if (acquired === null) {
      // Duplicate delivery — ack immediately with 200 so Razorpay stops retrying.
      console.log(`[Payment Service] Duplicate webhook event skipped: ${dedupKey}`);
      res.status(200).json({ success: true, deduplicated: true });
      return;
    }

    next();
  } catch (error) {
    // On Redis failure, pass through rather than block webhook processing.
    // A Redis outage should not cause Razorpay to retry indefinitely.
    console.error(
      "[Payment Service] Webhook deduplication Redis error:",
      (error as Error)?.message || error
    );
    next();
  }
};
