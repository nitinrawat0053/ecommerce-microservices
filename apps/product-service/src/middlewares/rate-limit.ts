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
        "[Product Service] Redis rate limiter error:",
        (error as Error)?.message || error
      );
      return res.status(503).json({
        success: false,
        message: "Service temporarily unavailable. Please try again later.",
      });
    }
  };
};

// ─── Public Catalog Browsing (Get All Products) ───────────────────────────────
export const getAllProductsRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:product_catalog:ip:${clientIp(req)}`,
      limit: 180,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:product_catalog:burst:${clientIp(req)}`,
      limit: 45,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many catalog requests. Please slow down."
);

// ─── Search Queries (Resource-intensive regex searches) ───────────────────────
export const productSearchRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:product_search:ip:${clientIp(req)}`,
      limit: 60,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:product_search:burst:${clientIp(req)}`,
      limit: 20,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many search queries. Please wait a moment before searching again."
);

/**
 * Route-level dispatch: applies tighter rate limit when ?search= is used,
 * while allowing generous throughput for standard category browsing.
 */
export const productQueryRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.query.search) {
    return productSearchRateLimiter(req, res, next);
  }
  return getAllProductsRateLimiter(req, res, next);
};

// ─── Get Product by ID ────────────────────────────────────────────────────────
export const getProductByIdRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:product_detail:ip:${clientIp(req)}`,
      limit: 200,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:product_detail:burst:${clientIp(req)}`,
      limit: 50,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many product detail requests. Please slow down."
);

// ─── Categories & Brands Public Reads ─────────────────────────────────────────
export const categoryReadRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:category_read:ip:${clientIp(req)}`,
      limit: 120,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:category_read:burst:${clientIp(req)}`,
      limit: 40,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many requests for category/brand filters. Please slow down."
);

// ─── Admin Product Mutations (Create, Update) ─────────────────────────────────
export const adminProductMutationRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:admin_prod_mutate:ip:${clientIp(req)}`,
      limit: 40,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:admin_prod_mutate:user:${userId(req)}`,
      limit: 30,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:admin_prod_mutate:burst:${userId(req)}`,
      limit: 10,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many product modification requests. Please wait a moment."
);

// ─── Admin Product Deletion ───────────────────────────────────────────────────
export const adminProductDeleteRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:admin_prod_del:ip:${clientIp(req)}`,
      limit: 20,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:admin_prod_del:user:${userId(req)}`,
      limit: 15,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:admin_prod_del:burst:${userId(req)}`,
      limit: 5,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many product deletion requests. Please try again later."
);

// ─── Admin Category & Brand Mutations ─────────────────────────────────────────
export const adminCategoryMutationRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:admin_cat_mutate:ip:${clientIp(req)}`,
      limit: 30,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:admin_cat_mutate:user:${userId(req)}`,
      limit: 20,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:admin_cat_mutate:burst:${userId(req)}`,
      limit: 10,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many category/brand modification requests. Please slow down."
);

// ─── Inventory Management (Stock Reduction / Update) ──────────────────────────
export const inventoryRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:inventory:ip:${clientIp(req)}`,
      limit: 60,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:inventory:burst:${clientIp(req)}`,
      limit: 20,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many inventory update attempts. Please slow down."
);

// ─── Product Import & Image Upload ────────────────────────────────────────────
export const importRateLimiter = createRedisRateLimiter(
  [
    {
      key: (req) => `rate_limit:admin_import:ip:${clientIp(req)}`,
      limit: 20,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:admin_import:user:${userId(req)}`,
      limit: 15,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: (req) => `rate_limit:admin_import:burst:${userId(req)}`,
      limit: 5,
      windowSeconds: WINDOW_1_MIN,
    },
  ],
  "Too many import/upload operations. Please wait before uploading again."
);
