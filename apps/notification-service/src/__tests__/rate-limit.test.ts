import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

const { mockEval, mockTtl, mockSet, mockLpush, mockLtrim, mockExpire, mockLrange, mockDel, mockRpush } =
  vi.hoisted(() => ({
    mockEval: vi.fn(),
    mockTtl: vi.fn(),
    mockSet: vi.fn(),
    mockLpush: vi.fn(),
    mockLtrim: vi.fn(),
    mockExpire: vi.fn(),
    mockLrange: vi.fn(),
    mockDel: vi.fn(),
    mockRpush: vi.fn(),
  }));

vi.mock("@packages/redis", () => ({
  redisClient: {
    eval: mockEval,
    ttl: mockTtl,
    set: mockSet,
    lpush: mockLpush,
    ltrim: mockLtrim,
    expire: mockExpire,
    lrange: mockLrange,
    del: mockDel,
    rpush: mockRpush,
  },
}));

import {
  sendEmailRateLimiter,
  sendSmsRateLimiter,
  resendNotificationRateLimiter,
  getUserNotificationsRateLimiter,
  markNotificationReadRateLimiter,
  internalNotificationRateLimiter,
} from "../middlewares/rate-limit";
import {
  authenticateUser,
  authenticateInternal,
} from "../middlewares/auth.middleware";
import { notificationRepository } from "../repositories/notification.repository";

import { config } from "@packages/config";

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    ip: "192.168.1.10",
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

describe("Notification Service — Rate Limiters, Security & RBAC Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTtl.mockResolvedValue(60);
    mockSet.mockResolvedValue("OK");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Send Email Rate Limiter & Anti-Bombing Protection
  // ─────────────────────────────────────────────────────────────────────────────
  describe("sendEmailRateLimiter", () => {
    it("calls next() when email requests are under limits", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({
        body: { email: "customer@example.com", message: "Order update" },
        headers: { "x-user-id": "usr_1" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await sendEmailRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 429 when IP sustained limit is exceeded (> 10 req / 15m)", async () => {
      mockEval.mockResolvedValueOnce(11); // IP limit exceeded
      const req = makeReq({
        body: { email: "customer@example.com", message: "Spam" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await sendEmailRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "10");
    });

    it("returns 429 when burst limit is exceeded (> 3 req / 1m)", async () => {
      mockEval
        .mockResolvedValueOnce(1) // IP sustained ok
        .mockResolvedValueOnce(4); // IP burst exceeded
      const req = makeReq({
        body: { email: "customer@example.com", message: "Burst" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await sendEmailRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "3");
    });

    it("returns 429 when target recipient is being email-bombed (> 5 req / 15m to same address)", async () => {
      mockEval
        .mockResolvedValueOnce(1) // IP sustained ok
        .mockResolvedValueOnce(1) // IP burst ok
        .mockResolvedValueOnce(6); // Target recipient exceeded
      const req = makeReq({
        body: { email: "victim@target.com", message: "Bomb" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await sendEmailRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "5");
    });

    it("fails closed with 503 on Redis failure to safeguard Resend API costs", async () => {
      mockEval.mockRejectedValue(new Error("Redis disconnected"));
      const req = makeReq({
        body: { email: "customer@example.com", message: "Test" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await sendEmailRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Send SMS Rate Limiter & Toll Fraud Protection
  // ─────────────────────────────────────────────────────────────────────────────
  describe("sendSmsRateLimiter", () => {
    it("calls next() when SMS requests are within strict limits", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({
        body: { phone: "+1234567890", message: "OTP code: 123456" },
        headers: { "x-user-id": "usr_1" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await sendSmsRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 429 when IP sustained limit is exceeded (> 5 req / 15m)", async () => {
      mockEval.mockResolvedValueOnce(6);
      const req = makeReq({
        body: { phone: "+1234567890", message: "Spam" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await sendSmsRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "5");
    });

    it("returns 429 when SMS burst limit is exceeded (> 2 req / 1m)", async () => {
      mockEval
        .mockResolvedValueOnce(1) // IP sustained ok
        .mockResolvedValueOnce(3); // IP burst exceeded
      const req = makeReq({
        body: { phone: "+1234567890", message: "Burst" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await sendSmsRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "2");
    });

    it("returns 429 when target phone is being SMS-bombed (> 3 req / 15m)", async () => {
      mockEval
        .mockResolvedValueOnce(1) // IP sustained ok
        .mockResolvedValueOnce(1) // IP burst ok
        .mockResolvedValueOnce(4); // Target phone quota exceeded
      const req = makeReq({
        body: { phone: "+1999999999", message: "Toll fraud attempt" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await sendSmsRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "3");
    });

    it("fails closed with 503 on Redis error to protect Twilio carrier costs", async () => {
      mockEval.mockRejectedValue(new Error("Redis offline"));
      const req = makeReq({
        body: { phone: "+1234567890", message: "Test" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await sendSmsRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Resend OTP / Notification Rate Limiter & 60s Cooldown
  // ─────────────────────────────────────────────────────────────────────────────
  describe("resendNotificationRateLimiter", () => {
    it("calls next() and sets 60-second cooldown on valid initial resend", async () => {
      mockTtl.mockResolvedValue(-2); // No active cooldown
      mockEval.mockResolvedValue(1); // 1st resend in window
      const req = makeReq({
        body: { email: "user@example.com" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await resendNotificationRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
      expect(mockSet).toHaveBeenCalledWith(
        "rate_limit:notif_resend:cooldown:user@example.com",
        "1",
        "EX",
        60
      );
    });

    it("returns 429 when resend is attempted within the 60s cooldown window", async () => {
      mockTtl.mockResolvedValue(45); // 45 seconds remaining on cooldown
      const req = makeReq({
        body: { email: "user@example.com" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await resendNotificationRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "45");
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("wait 60 seconds"),
        })
      );
    });

    it("returns 429 when max 3 resends per 15 minutes is exceeded", async () => {
      mockTtl
        .mockResolvedValueOnce(-2) // Cooldown expired
        .mockResolvedValueOnce(500); // 15m window TTL
      mockEval.mockResolvedValue(4); // Exceeded (limit is 3)
      const req = makeReq({
        body: { email: "user@example.com" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await resendNotificationRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Too many resend attempts"),
        })
      );
    });

    it("fails closed with 503 when Redis throws during cooldown check", async () => {
      mockTtl.mockRejectedValue(new Error("Redis down"));
      const req = makeReq({ body: { email: "user@example.com" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await resendNotificationRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. User Notifications Retrieval Rate Limiter
  // ─────────────────────────────────────────────────────────────────────────────
  describe("getUserNotificationsRateLimiter", () => {
    it("calls next() when notification fetching is under limit", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({ headers: { "x-user-id": "usr_99" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getUserNotificationsRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 429 when user sustained limit is exceeded (> 60 req / 15m)", async () => {
      mockEval.mockResolvedValueOnce(61);
      const req = makeReq({ headers: { "x-user-id": "usr_99" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await getUserNotificationsRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith("RateLimit-Limit", "60");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Mark Notification Read Rate Limiter
  // ─────────────────────────────────────────────────────────────────────────────
  describe("markNotificationReadRateLimiter", () => {
    it("calls next() when mark-as-read updates are within quota", async () => {
      mockEval.mockResolvedValue(1);
      const req = makeReq({
        headers: { "x-user-id": "usr_99" },
        params: { id: "notif_123" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await markNotificationReadRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("returns 429 when mark-as-read limit is exceeded", async () => {
      mockEval.mockResolvedValueOnce(61);
      const req = makeReq({
        headers: { "x-user-id": "usr_99" },
        params: { id: "notif_123" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await markNotificationReadRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Internal Service Notification Limiter & Deduplication
  // ─────────────────────────────────────────────────────────────────────────────
  describe("internalNotificationRateLimiter", () => {
    it("calls next() for authorized internal dispatch with new eventId", async () => {
      mockEval.mockResolvedValue(1);
      mockSet.mockResolvedValue("OK"); // Deduplication lock acquired
      const req = makeReq({
        headers: { "x-service": "order-service" },
        body: { eventId: "evt_order_created_100" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await internalNotificationRateLimiter(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("returns 409 Conflict when duplicate notification dispatch is detected (already processed)", async () => {
      mockEval.mockResolvedValue(1);
      mockSet.mockResolvedValue(null); // Key already exists in Redis (duplicate!)
      const req = makeReq({
        headers: { "x-service": "payment-service" },
        body: { eventId: "evt_payment_captured_100" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await internalNotificationRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("Duplicate notification"),
        })
      );
    });

    it("returns 429 when internal service exceeds loop rate (> 300 req / 1m)", async () => {
      mockEval.mockResolvedValue(301); // Exceeded runaway loop threshold
      const req = makeReq({
        headers: { "x-service": "order-service" },
        body: { eventId: "evt_storm" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      await internalNotificationRateLimiter(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Authentication & Authorization Middlewares
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Authentication Middlewares", () => {
    it("authenticateUser attaches user context when x-user-id header is present", () => {
      const req = makeReq({
        headers: { "x-user-id": "usr_auth_123", "x-user-role": "CUSTOMER" },
      });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      authenticateUser(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
      expect(req.user?.userId).toBe("usr_auth_123");
    });

    it("authenticateUser rejects with 401 when x-user-id is missing", () => {
      const req = makeReq();
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      authenticateUser(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Unauthorized: User not authenticated",
        })
      );
    });

    it("authenticateInternal allows request when x-internal-secret is valid", () => {
      const secret =
        process.env.INTERNAL_SERVICE_SECRET || config.JWT_SECRET || "internal-secret";
      const req = makeReq({ headers: { "x-internal-secret": secret } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      authenticateInternal(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("authenticateInternal rejects request with 403 when internal secret is missing or invalid", () => {
      const req = makeReq({ headers: { "x-internal-secret": "wrong-secret" } });
      const res = makeRes();
      const next = vi.fn() as unknown as NextFunction;

      authenticateInternal(req, res as unknown as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("internal service secret required"),
        })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. User Notification Ownership / Anti-IDOR Tests
  // ─────────────────────────────────────────────────────────────────────────────
  describe("NotificationRepository — Ownership & Anti-IDOR Isolation", () => {
    it("findByUserId queries strictly the caller's user key", async () => {
      mockLrange.mockResolvedValue([
        JSON.stringify({
          id: "notif_1",
          userId: "usr_alice",
          title: "Order Placed",
          read: false,
        }),
      ]);

      const results = await notificationRepository.findByUserId("usr_alice");
      expect(mockLrange).toHaveBeenCalledWith("notifications:user:usr_alice", 0, -1);
      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe("usr_alice");
    });

    it("markAsRead marks read when notification belongs to the authenticated user", async () => {
      const existing = {
        id: "notif_alice_1",
        userId: "usr_alice",
        title: "Payment Done",
        read: false,
        createdAt: "2026-11-22T00:00:00.000Z",
      };
      mockLrange.mockResolvedValue([JSON.stringify(existing)]);

      const updated = await notificationRepository.markAsRead("notif_alice_1", "usr_alice");
      expect(updated).not.toBeNull();
      expect(updated?.read).toBe(true);
      expect(mockDel).toHaveBeenCalledWith("notifications:user:usr_alice");
      expect(mockRpush).toHaveBeenCalled();
    });

    it("markAsRead returns null (protects against IDOR) when notification belongs to another user", async () => {
      const bobsNotification = {
        id: "notif_bob_99",
        userId: "usr_bob",
        title: "Bob's Secret",
        read: false,
        createdAt: "2026-11-22T00:00:00.000Z",
      };
      // Alice's list in Redis does not have Bob's notification
      mockLrange.mockResolvedValue([]);

      const updated = await notificationRepository.markAsRead("notif_bob_99", "usr_alice");
      expect(updated).toBeNull();
      expect(mockDel).not.toHaveBeenCalled();
    });
  });
});
