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
  getProfileRateLimiter,
  updateProfileRateLimiter,
  changePasswordRateLimiter,
  addressRateLimiter,
} from "../middlewares/rate-limit";

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    ip: "10.0.0.12",
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

describe("User Service — Rate Limiters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTtl.mockResolvedValue(60);
  });

  describe("getProfileRateLimiter", () => {
    it("calls next() when profile fetches are under limit", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({ headers: { "x-user-id": "usr_normal" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getProfileRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("returns 429 when profile fetch limit is exceeded", async () => {
      mockEval.mockResolvedValue(999);
      const req = makeReq({ headers: { "x-user-id": "usr_scraper" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getProfileRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("fails closed with 503 on Redis error", async () => {
      mockEval.mockRejectedValue(new Error("Redis offline"));
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getProfileRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  describe("updateProfileRateLimiter", () => {
    it("calls next() for normal profile updates", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({
        headers: { "x-user-id": "usr_normal" },
        body: { name: "New Name" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await updateProfileRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("returns 429 when update limit is exceeded", async () => {
      mockEval
        .mockResolvedValueOnce(1)   // IP ok
        .mockResolvedValueOnce(999); // User limit exceeded
      const req = makeReq({ headers: { "x-user-id": "usr_spammer" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await updateProfileRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe("changePasswordRateLimiter", () => {
    it("calls next() when password change attempts are under limit", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({
        headers: { "x-user-id": "usr_account" },
        body: { currentPassword: "OldPassword1!", newPassword: "NewPassword1!" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await changePasswordRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("blocks brute-force password guessing attempts with 429", async () => {
      mockEval
        .mockResolvedValueOnce(1)   // IP ok
        .mockResolvedValueOnce(999); // User limit exceeded
      const req = makeReq({ headers: { "x-user-id": "usr_victim" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await changePasswordRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it("blocks rapid burst attempts from same user", async () => {
      mockEval
        .mockResolvedValueOnce(1)   // IP ok
        .mockResolvedValueOnce(1)   // User 15m ok
        .mockResolvedValueOnce(999); // Burst 1m exceeded
      const req = makeReq({ headers: { "x-user-id": "usr_burst" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await changePasswordRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe("addressRateLimiter", () => {
    it("calls next() for normal address operations", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({
        headers: { "x-user-id": "usr_resident" },
        body: { street: "123 Elm St", city: "Town", state: "State", postalCode: "12345" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await addressRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("blocks address operation abuse with 429", async () => {
      mockEval.mockResolvedValue(999);
      const req = makeReq({ headers: { "x-user-id": "usr_abuser" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await addressRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });
});
