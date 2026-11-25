import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

const { mockEval, mockTtl, mockSet, mockDel } = vi.hoisted(() => ({
  mockEval: vi.fn(),
  mockTtl: vi.fn(),
  mockSet: vi.fn(),
  mockDel: vi.fn(),
}));

vi.mock("@packages/redis", () => ({
  redisClient: {
    eval: mockEval,
    ttl: mockTtl,
    set: mockSet,
    del: mockDel,
  },
}));

import { verifyPaymentRateLimiter } from "../middlewares/rate-limit";
import { paymentVerifyIdempotencyMiddleware } from "../middlewares/idempotency";

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    ip: "10.0.0.5",
    headers: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

function makeRes() {
  const finishCallbacks: (() => void)[] = [];
  const res = {
    status: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    on: vi.fn((event: string, cb: () => void) => {
      if (event === "finish") finishCallbacks.push(cb);
    }),
    _triggerFinish: () => {
      for (const cb of finishCallbacks) cb();
    },
  };
  return res;
}

describe("Payment Service — Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTtl.mockResolvedValue(60);
    mockSet.mockResolvedValue("OK");
    mockDel.mockResolvedValue(1);
  });

  describe("verifyPaymentRateLimiter", () => {
    it("calls next() when verification counts are within limit", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({
        headers: { "x-user-id": "usr_buyer" },
        body: { razorpayOrderId: "order_123" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await verifyPaymentRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("returns 429 when IP limit is exceeded", async () => {
      mockEval.mockResolvedValueOnce(999);
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await verifyPaymentRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("returns 429 when user limit is exceeded", async () => {
      mockEval
        .mockResolvedValueOnce(1)   // IP rule ok
        .mockResolvedValueOnce(999); // User rule exceeded
      const req = makeReq({ headers: { "x-user-id": "usr_spam" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await verifyPaymentRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it("returns 429 when burst limit is exceeded", async () => {
      mockEval
        .mockResolvedValueOnce(1)   // IP rule ok
        .mockResolvedValueOnce(1)   // User rule ok
        .mockResolvedValueOnce(999); // Burst rule exceeded
      const req = makeReq({ headers: { "x-user-id": "usr_burst" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await verifyPaymentRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it("fails closed with 503 when Redis throws", async () => {
      mockEval.mockRejectedValue(new Error("Redis disconnected"));
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await verifyPaymentRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  describe("paymentVerifyIdempotencyMiddleware", () => {
    it("calls next() and acquires in-flight lock for new verification", async () => {
      mockSet.mockResolvedValue("OK");
      const req = makeReq({
        body: { razorpayOrderId: "rzp_order_abc" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await paymentVerifyIdempotencyMiddleware(
        req,
        res as unknown as Response,
        next
      );
      expect(next).toHaveBeenCalledOnce();
      expect(mockSet).toHaveBeenCalledWith(
        "lock:payment_verify:rzp_order_abc",
        "1",
        "EX",
        10,
        "NX"
      );
    });

    it("returns 409 Conflict when concurrent verification is in progress", async () => {
      mockSet.mockResolvedValueOnce(null);
      const req = makeReq({
        body: { razorpayOrderId: "rzp_order_concurrent" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await paymentVerifyIdempotencyMiddleware(
        req,
        res as unknown as Response,
        next
      );
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/already in progress/i),
        })
      );
    });

    it("releases in-flight lock on response finish", async () => {
      mockSet.mockResolvedValue("OK");
      const req = makeReq({
        body: { razorpayOrderId: "rzp_order_finish" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await paymentVerifyIdempotencyMiddleware(
        req,
        res as unknown as Response,
        next
      );
      expect(next).toHaveBeenCalledOnce();

      res._triggerFinish();
      expect(mockDel).toHaveBeenCalledWith(
        "lock:payment_verify:rzp_order_finish"
      );
    });

    it("fails open if Redis set throws", async () => {
      mockSet.mockRejectedValue(new Error("Redis error"));
      const req = makeReq({
        body: { razorpayOrderId: "rzp_order_err" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await paymentVerifyIdempotencyMiddleware(
        req,
        res as unknown as Response,
        next
      );
      expect(next).toHaveBeenCalledOnce();
    });
  });
});
