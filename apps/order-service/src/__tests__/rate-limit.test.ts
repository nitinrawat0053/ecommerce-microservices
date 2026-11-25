import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
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

import {
  createOrderRateLimiter,
  cancelOrderRateLimiter,
} from "../middlewares/rate-limit";
import { orderIdempotencyMiddleware } from "../middlewares/idempotency";

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    ip: "192.168.1.10",
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

describe("Order Service — Rate Limiters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTtl.mockResolvedValue(60);
    mockSet.mockResolvedValue("OK");
    mockDel.mockResolvedValue(1);
  });

  describe("createOrderRateLimiter", () => {
    it("calls next() when all counters are under their limits", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({
        headers: { "x-user-id": "usr_123" },
      });
      const res = makeRes() as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      await createOrderRateLimiter(req, res, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("returns 429 when IP limit is exceeded", async () => {
      // First rule is IP limit
      mockEval.mockResolvedValueOnce(999);
      const req = makeReq({
        headers: { "x-user-id": "usr_123" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await createOrderRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("returns 429 when user limit is exceeded even if IP is under limit", async () => {
      mockEval
        .mockResolvedValueOnce(1)   // IP rule passes
        .mockResolvedValueOnce(999); // User rule exceeded
      const req = makeReq({
        headers: { "x-user-id": "usr_abuser" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await createOrderRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it("returns 429 when user burst limit is exceeded", async () => {
      mockEval
        .mockResolvedValueOnce(1)   // IP rule passes
        .mockResolvedValueOnce(1)   // User 15m rule passes
        .mockResolvedValueOnce(999); // User 1m burst rule exceeded
      const req = makeReq({
        headers: { "x-user-id": "usr_burst" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await createOrderRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it("sets Retry-After and RateLimit headers on 429", async () => {
      mockEval.mockResolvedValue(999);
      mockTtl.mockResolvedValue(45);
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await createOrderRateLimiter(req, res as unknown as Response, next);
      expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "45");
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Remaining", "0");
    });

    it("fails closed with 503 when Redis throws", async () => {
      mockEval.mockRejectedValue(new Error("Redis offline"));
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await createOrderRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  describe("cancelOrderRateLimiter", () => {
    it("calls next() when cancellation count is under limit", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({ headers: { "x-user-id": "usr_1" } });
      const res = makeRes() as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      await cancelOrderRateLimiter(req, res, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("returns 429 when cancellation limit is exceeded", async () => {
      mockEval.mockResolvedValue(999);
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await cancelOrderRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });
});

describe("Order Service — Idempotency & In-Flight Concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockResolvedValue("OK");
    mockDel.mockResolvedValue(1);
  });

  it("calls next() and acquires lock when no previous request exists", async () => {
    const req = makeReq({
      headers: { "x-user-id": "usr_100", "idempotency-key": "uuid-12345" },
    });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await orderIdempotencyMiddleware(req, res as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledWith(
      expect.stringContaining("idempotency:order_create:usr_100:uuid-12345"),
      "1",
      "EX",
      86400,
      "NX"
    );
  });

  it("returns 409 Conflict when duplicate Idempotency-Key is submitted", async () => {
    // mockSet returns null for duplicate SET NX
    mockSet.mockResolvedValueOnce(null);
    const req = makeReq({
      headers: { "x-user-id": "usr_100", "idempotency-key": "uuid-duplicate" },
    });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await orderIdempotencyMiddleware(req, res as unknown as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it("returns 400 Bad Request for malformed Idempotency-Key", async () => {
    const req = makeReq({
      headers: { "idempotency-key": "bad key with spaces; DROP TABLE" },
    });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await orderIdempotencyMiddleware(req, res as unknown as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 409 Conflict when concurrent in-flight request is already running", async () => {
    // In-flight lock returns null
    mockSet.mockResolvedValueOnce(null);
    const req = makeReq({
      headers: { "x-user-id": "usr_concurrent" },
    });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await orderIdempotencyMiddleware(req, res as unknown as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/already being processed/i),
      })
    );
  });

  it("releases in-flight lock when response finishes", async () => {
    const req = makeReq({
      headers: { "x-user-id": "usr_releaser" },
    });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await orderIdempotencyMiddleware(req, res as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();

    res._triggerFinish();
    expect(mockDel).toHaveBeenCalledWith(
      expect.stringContaining("lock:order_create:usr_releaser")
    );
  });

  it("fails open and allows checkout if Redis set throws", async () => {
    mockSet.mockRejectedValue(new Error("Redis down"));
    const req = makeReq({
      headers: { "x-user-id": "usr_fallback" },
    });
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await orderIdempotencyMiddleware(req, res as unknown as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
