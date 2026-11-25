import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

const { mockEval, mockTtl } = vi.hoisted(() => ({
  mockEval: vi.fn(),
  mockTtl: vi.fn(),
}));

vi.mock("@packages/redis", () => ({
  redisClient: {
    eval: mockEval,
    ttl: mockTtl,
  },
}));

import {
  getAllProductsRateLimiter,
  productSearchRateLimiter,
  productQueryRateLimiter,
  getProductByIdRateLimiter,
  categoryReadRateLimiter,
  adminProductMutationRateLimiter,
  adminProductDeleteRateLimiter,
  adminCategoryMutationRateLimiter,
  inventoryRateLimiter,
  importRateLimiter,
} from "../middlewares/rate-limit";
import { requireAdmin } from "../middlewares/auth.middleware";

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    ip: "10.0.0.1",
    headers: {},
    query: {},
    body: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

describe("Product Service — Rate Limiters & RBAC Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTtl.mockResolvedValue(60);
  });

  describe("getAllProductsRateLimiter", () => {
    it("calls next() when requests are within limits", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getAllProductsRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 429 and rate limit headers when sustained limit is exceeded", async () => {
      mockEval.mockResolvedValue(181);
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getAllProductsRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "180");
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Remaining", "0");
      expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "60");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          retryAfter: 60,
        })
      );
    });

    it("returns 429 when burst limit is exceeded", async () => {
      mockEval
        .mockResolvedValueOnce(1) // sustained check ok
        .mockResolvedValueOnce(46); // burst check exceeded (> 45)
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getAllProductsRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "45");
    });

    it("fails closed with 503 on Redis error", async () => {
      mockEval.mockRejectedValue(new Error("Redis connection offline"));
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getAllProductsRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });

  describe("productSearchRateLimiter & productQueryRateLimiter", () => {
    it("productQueryRateLimiter routes to productSearchRateLimiter when search query param is present", async () => {
      mockEval.mockResolvedValue(61); // exceeds search limit (60)
      const req = makeReq({ query: { search: "laptop" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await productQueryRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "60");
    });

    it("productQueryRateLimiter routes to getAllProductsRateLimiter when search query is empty", async () => {
      mockEval.mockResolvedValue(181); // exceeds catalog limit (180)
      const req = makeReq({ query: { page: "1", limit: "10" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await productQueryRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "180");
    });

    it("productSearchRateLimiter returns 429 when search limit is exceeded", async () => {
      mockEval.mockResolvedValue(61);
      const req = makeReq({ query: { search: "expensive shoes" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await productSearchRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "60");
    });

    it("productSearchRateLimiter calls next() when search is under limit", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({ query: { search: "phones" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await productSearchRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe("getProductByIdRateLimiter", () => {
    it("calls next() when product detail fetches are under limit", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({ params: { id: "p123" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getProductByIdRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("returns 429 when limit is exceeded", async () => {
      mockEval.mockResolvedValue(201);
      const req = makeReq({ params: { id: "p123" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getProductByIdRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "200");
    });
  });

  describe("categoryReadRateLimiter", () => {
    it("calls next() when category/brand reads are within limit", async () => {
      mockEval.mockResolvedValue(5);
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await categoryReadRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("returns 429 when category read limit is exceeded", async () => {
      mockEval.mockResolvedValue(121);
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await categoryReadRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "120");
    });
  });

  describe("adminProductMutationRateLimiter", () => {
    it("allows product mutation when under limit", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({
        headers: { "x-user-id": "admin_1", "x-user-role": "ADMIN" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await adminProductMutationRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("blocks product mutation when admin user quota is exceeded", async () => {
      mockEval
        .mockResolvedValueOnce(1) // IP sustained ok
        .mockResolvedValueOnce(31); // User quota exceeded (> 30)
      const req = makeReq({
        headers: { "x-user-id": "admin_1", "x-user-role": "ADMIN" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await adminProductMutationRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "30");
    });

    it("blocks product mutation when IP quota is exceeded", async () => {
      mockEval.mockResolvedValueOnce(41); // IP quota exceeded (> 40)
      const req = makeReq({
        headers: { "x-user-id": "admin_1", "x-user-role": "ADMIN" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await adminProductMutationRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "40");
    });
  });

  describe("adminProductDeleteRateLimiter", () => {
    it("allows delete when under strict limit", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({
        headers: { "x-user-id": "admin_super", "x-user-role": "SUPER_ADMIN" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await adminProductDeleteRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("blocks delete with 429 when admin user quota is exceeded", async () => {
      mockEval
        .mockResolvedValueOnce(1) // IP ok
        .mockResolvedValueOnce(16); // User quota exceeded (> 15)
      const req = makeReq({
        headers: { "x-user-id": "admin_super", "x-user-role": "SUPER_ADMIN" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await adminProductDeleteRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "15");
    });
  });

  describe("adminCategoryMutationRateLimiter", () => {
    it("allows category creation/update under quota", async () => {
      mockEval.mockResolvedValue(2);
      const req = makeReq({
        headers: { "x-user-id": "admin_cat", "x-user-role": "ADMIN" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await adminCategoryMutationRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("blocks category mutations when limit is exceeded", async () => {
      mockEval.mockResolvedValue(35);
      const req = makeReq({
        headers: { "x-user-id": "admin_cat", "x-user-role": "ADMIN" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await adminCategoryMutationRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe("inventoryRateLimiter", () => {
    it("allows stock updates within limits", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({ params: { id: "p100" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await inventoryRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("blocks stock updates when burst limit is exceeded", async () => {
      mockEval
        .mockResolvedValueOnce(1) // sustained IP ok (limit 60)
        .mockResolvedValueOnce(21); // burst IP exceeded (> 20)
      const req = makeReq({ params: { id: "p100" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await inventoryRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "20");
    });
  });

  describe("importRateLimiter", () => {
    it("allows CSV/image import under limit", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({
        headers: { "x-user-id": "admin_bulk", "x-user-role": "ADMIN" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await importRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("blocks import operations when limit is exceeded", async () => {
      mockEval
        .mockResolvedValueOnce(1) // IP sustained ok
        .mockResolvedValueOnce(16); // User quota exceeded (> 15)
      const req = makeReq({
        headers: { "x-user-id": "admin_bulk", "x-user-role": "ADMIN" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await importRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "15");
    });
  });

  describe("requireAdmin Middleware", () => {
    it("allows request when x-user-role is ADMIN", () => {
      const req = makeReq({ headers: { "x-user-role": "ADMIN" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      requireAdmin(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("allows request when x-user-role is SUPER_ADMIN", () => {
      const req = makeReq({ headers: { "x-user-role": "SUPER_ADMIN" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      requireAdmin(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("rejects request with 403 when x-user-role header is missing", () => {
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      requireAdmin(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Forbidden: Admin access required",
        })
      );
    });

    it("rejects request with 403 when x-user-role is CUSTOMER", () => {
      const req = makeReq({ headers: { "x-user-role": "CUSTOMER" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      requireAdmin(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
