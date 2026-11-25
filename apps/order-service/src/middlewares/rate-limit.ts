import type { Request, Response, NextFunction } from "express";
import { redisClient } from "@packages/redis";

/**
 * Atomic INCR + conditional EXPIRE (same Lua script as auth-service).
 *
 * Returns the new counter value. The EXPIRE is set only on the first
 * increment so the window is anchored to the first request, not reset
 * on every hit.
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
const WINDOW_5_MIN  =  5 * 60;
const WINDOW_15_MIN = 15 * 60;
const WINDOW_1_HOUR = 60 * 60;

// ── Key builders ──────────────────────────────────────────────────────────────

/**
 * Extract the real client IP.
 *
 * The `x-forwarded-for` header is set by the API gateway / nginx.  We
 * deliberately do NOT use req.ip here because trust-proxy configuration
 * differences between services could produce inconsistent values.  Taking
 * the first entry of XFF gives us the original client IP without depending
 * on trust-proxy being set identically everywhere.
 */
export const clientIp = (req: Request): string => {
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const first = Array.isArray(xff) ? xff[0] : xff.split(",")[0];
    return first.trim();
  }
  return req.ip ?? "unknown";
};

/** Caller's userId from the x-user-id header (injected by the API gateway). */
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
 * Rules are evaluated in order.  The first rule that is exceeded short-circuits
 * and returns 429.  On Redis failure we fail CLOSED (503) so limits are never
 * silently bypassed.
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
        "[Order Service] Redis rate limiter error:",
        (error as Error)?.message || error
      );
      return res.status(503).json({
        success: false,
        message: "Service temporarily unavailable. Please try again later.",
      });
    }
  };
};

// ─── Order Creation ───────────────────────────────────────────────────────────
//
// Three complementary rules to protect the checkout pipeline:
//
//   • Per-IP:   10 orders / 15 min  — blocks bots hammering the endpoint
//   • Per-user: 5  orders / 15 min  — tighter per-identity limit that can't
//                                     be bypassed by rotating IPs (the userId
//                                     comes from the trusted x-user-id header
//                                     injected by the API gateway, not from
//                                     client input)
//   • Per-user burst: 2 orders / 1 min — prevents rapid double-submit
//     (complements the idempotency key; together they stop both accidental and
//     intentional concurrent create calls before they reach the DB)

export const createOrderRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:order_create:ip:${clientIp(req)}`,
      limit: 10,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:order_create:user:${userId(req)}`,
      limit: 5,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:order_create:user_burst:${userId(req)}`,
      limit: 2,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many order requests. Please wait before placing another order."
);

// ─── Order Cancellation / Delete ─────────────────────────────────────────────
//
//   • Per-IP:   20 / 15 min  — broad guard
//   • Per-user: 10 / 15 min  — per-identity guard

export const cancelOrderRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:order_cancel:ip:${clientIp(req)}`,
      limit: 20,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:order_cancel:user:${userId(req)}`,
      limit: 10,
      windowSeconds: WINDOW_15_MIN,
    },
  ],
  "Too many cancellation requests. Please try again later."
);

// ─── Payment Verification ─────────────────────────────────────────────────────
//
// Protects against signature brute-forcing and duplicate verify calls.
//   • Per-IP:   10 / 15 min  — blocks automated scanners
//   • Per-user: 5  / 15 min  — per-identity guard
//   • Burst:    3  / 1 min   — prevents rapid duplicate submits

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
