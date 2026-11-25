import type { Request, Response, NextFunction } from "express";
import { redisClient } from "@packages/redis";

/**
 * Atomic INCR + conditional EXPIRE Lua script.
 * Shared pattern across microservices.
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

/** Caller's userId from x-user-id header */
export const userId = (req: Request): string =>
  (req.headers["x-user-id"] as string | undefined)?.trim() || "anonymous";

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
        "[Cart Service] Redis rate limiter error:",
        (error as Error)?.message || error
      );
      return res.status(503).json({
        success: false,
        message: "Service temporarily unavailable. Please try again later.",
      });
    }
  };
};

// ─── Get Cart ─────────────────────────────────────────────────────────────────
// Generous limits so normal shopping and active browsing are never interrupted.
export const getCartRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:cart_get:ip:${clientIp(req)}`,
      limit: 120,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:cart_get:user:${userId(req)}`,
      limit: 60,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:cart_get:burst:${userId(req)}`,
      limit: 30,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many cart requests. Please slow down."
);

// ─── Cart Item Mutations (Add, Update Quantity, Remove) ───────────────────────
export const cartMutationRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:cart_mutate:ip:${clientIp(req)}`,
      limit: 60,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:cart_mutate:user:${userId(req)}`,
      limit: 40,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:cart_mutate:burst:${userId(req)}`,
      limit: 15,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many cart update attempts. Please slow down."
);

// ─── Clear Cart ───────────────────────────────────────────────────────────────
export const clearCartRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:cart_clear:ip:${clientIp(req)}`,
      limit: 30,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:cart_clear:user:${userId(req)}`,
      limit: 15,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:cart_clear:burst:${userId(req)}`,
      limit: 5,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many clear cart attempts. Please try again later."
);
