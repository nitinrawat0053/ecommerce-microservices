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
  getCartRateLimiter,
  cartMutationRateLimiter,
  clearCartRateLimiter,
} from "../middlewares/rate-limit";

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    ip: "192.168.1.50",
    headers: {},
    body: {},
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

describe("Cart Service — Rate Limiters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTtl.mockResolvedValue(60);
  });

  describe("getCartRateLimiter", () => {
    it("calls next() when requests are within limits", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({ headers: { "x-user-id": "usr_shopper" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getCartRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("returns 429 when IP limit is exceeded", async () => {
      mockEval.mockResolvedValueOnce(999);
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getCartRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("returns 429 when user limit is exceeded", async () => {
      mockEval
        .mockResolvedValueOnce(1)   // IP ok
        .mockResolvedValueOnce(999); // User limit exceeded
      const req = makeReq({ headers: { "x-user-id": "usr_heavy" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getCartRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it("returns 429 when user burst limit is exceeded", async () => {
      mockEval
        .mockResolvedValueOnce(1)   // IP ok
        .mockResolvedValueOnce(1)   // User 15m ok
        .mockResolvedValueOnce(999); // User 1m burst exceeded
      const req = makeReq({ headers: { "x-user-id": "usr_burst" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getCartRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it("sets Retry-After, RateLimit-Limit, and RateLimit-Remaining headers", async () => {
      mockEval.mockResolvedValue(999);
      mockTtl.mockResolvedValue(40);
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getCartRateLimiter(req, res as unknown as Response, next);
      expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "40");
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Remaining", "0");
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "120");
    });

    it("fails closed with 503 on Redis error", async () => {
      mockEval.mockRejectedValue(new Error("Redis down"));
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getCartRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  describe("cartMutationRateLimiter", () => {
    it("calls next() for normal add/update/remove item requests", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({
        headers: { "x-user-id": "usr_shopper" },
        body: { productId: "prod_1", quantity: 2 },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await cartMutationRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("blocks rapid automated additions with 429", async () => {
      mockEval
        .mockResolvedValueOnce(1)   // IP ok
        .mockResolvedValueOnce(1)   // User 15m ok
        .mockResolvedValueOnce(999); // Burst exceeded
      const req = makeReq({ headers: { "x-user-id": "usr_bot" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await cartMutationRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe("clearCartRateLimiter", () => {
    it("calls next() when clear attempts are under limit", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({ headers: { "x-user-id": "usr_shopper" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await clearCartRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("blocks repeated clear cart attempts with 429", async () => {
      mockEval.mockResolvedValue(999);
      const req = makeReq({ headers: { "x-user-id": "usr_shopper" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await clearCartRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });
});
