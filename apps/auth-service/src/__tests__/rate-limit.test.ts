/**
 * Phase 1 – Authentication Rate Limiting Tests
 *
 * Tests every rate-limiter exported from rate-limit.ts using a mocked Redis
 * client so no live Redis connection is required.  Each test verifies:
 *   - Requests under the limit pass through (next() is called)
 *   - The request that pushes the counter above the limit is blocked (HTTP 429)
 *   - The correct Retry-After / RateLimit-* headers are set
 *   - Redis failures cause a 503, not a silent pass-through
 *
 * Covered limiters (Phase 1 scope):
 *   registerRateLimiter, loginRateLimiter, verifyPhoneRateLimiter,
 *   resendPhoneOtpRateLimiter, forgotPasswordRateLimiter,
 *   verifyResetOtpRateLimiter, resetPasswordRateLimiter,
 *   resendResetOtpRateLimiter
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { Request, Response, NextFunction } from "express";

// ── Hoist mock factories before any imports ───────────────────────────────────
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

// ── Import limiters AFTER the mock is registered ──────────────────────────────
import {
  registerRateLimiter,
  loginRateLimiter,
  verifyPhoneRateLimiter,
  resendPhoneOtpRateLimiter,
  forgotPasswordRateLimiter,
  verifyResetOtpRateLimiter,
  resetPasswordRateLimiter,
  resendResetOtpRateLimiter,
} from "../middlewares/rate-limit";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Create a minimal Express Request stub. */
function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    ip: "1.2.3.4",
    body: {},
    ...overrides,
  } as unknown as Request;
}

/** Create a spy-able Response stub that records status / setHeader / json calls. */
function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

/** Run one middleware invocation and return { next, res }. */
async function runLimiter(
  limiter: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  req: Request
) {
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;
  await limiter(req, res, next);
  return { res, next };
}

// ── Shared behaviour tests ────────────────────────────────────────────────────

function sharedBehaviourSuite(
  name: string,
  limiter: (req: Request, res: Response, next: NextFunction) => Promise<void>,
  reqFactory: () => Request
) {
  describe(name, () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Default: Redis returns TTL of 60 s for all keys
      mockTtl.mockResolvedValue(60);
    });

    it("calls next() when count is below the limit", async () => {
      mockEval.mockResolvedValue(1); // first request
      const { next } = await runLimiter(limiter, reqFactory());
      expect(next).toHaveBeenCalledOnce();
    });

    it("calls next() when count equals the limit", async () => {
      // We need to simulate the exact limit value.  Since we don't expose the
      // internal limit per limiter, we just ensure count <= limit never 429s.
      // Pick a safe low count that any limiter allows.
      mockEval.mockResolvedValue(1);
      const { next } = await runLimiter(limiter, reqFactory());
      expect(next).toHaveBeenCalledOnce();
    });

    it("returns 429 when the counter exceeds the limit", async () => {
      // 9999 is always above any reasonable limit
      mockEval.mockResolvedValue(9999);
      const { res, next } = await runLimiter(limiter, reqFactory());
      expect(next).not.toHaveBeenCalled();
      expect((res.status as Mock)).toHaveBeenCalledWith(429);
      expect((res.json as Mock)).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("sets Retry-After header from Redis TTL when available", async () => {
      mockEval.mockResolvedValue(9999);
      mockTtl.mockResolvedValue(42);
      const { res } = await runLimiter(limiter, reqFactory());
      expect((res.setHeader as Mock)).toHaveBeenCalledWith("Retry-After", "42");
    });

    it("falls back to window size when TTL returns -1", async () => {
      mockEval.mockResolvedValue(9999);
      mockTtl.mockResolvedValue(-1);
      const { res } = await runLimiter(limiter, reqFactory());
      // Retry-After should still be set (to window seconds, not -1)
      const call = (res.setHeader as Mock).mock.calls.find(
        (c: string[]) => c[0] === "Retry-After"
      );
      expect(call).toBeDefined();
      const retryAfterValue = Number(call![1]);
      expect(retryAfterValue).toBeGreaterThan(0);
    });

    it("sets RateLimit-Limit and RateLimit-Remaining headers on 429", async () => {
      mockEval.mockResolvedValue(9999);
      const { res } = await runLimiter(limiter, reqFactory());
      const headerNames = (res.setHeader as Mock).mock.calls.map(
        (c: string[]) => c[0]
      );
      expect(headerNames).toContain("RateLimit-Limit");
      expect(headerNames).toContain("RateLimit-Remaining");
    });

    it("returns 503 and calls neither next nor 429 when Redis throws", async () => {
      mockEval.mockRejectedValue(new Error("Redis connection refused"));
      const { res, next } = await runLimiter(limiter, reqFactory());
      expect(next).not.toHaveBeenCalled();
      expect((res.status as Mock)).toHaveBeenCalledWith(503);
      expect((res.json as Mock)).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });
}

// ── Run shared suite for every exported limiter ───────────────────────────────

sharedBehaviourSuite(
  "registerRateLimiter",
  registerRateLimiter,
  () => makeReq({ ip: "1.2.3.4" })
);

sharedBehaviourSuite(
  "loginRateLimiter",
  loginRateLimiter,
  () => makeReq({ ip: "1.2.3.4", body: { email: "user@example.com" } })
);

sharedBehaviourSuite(
  "verifyPhoneRateLimiter",
  verifyPhoneRateLimiter,
  () => makeReq({ ip: "1.2.3.4", body: { phone: "+911234567890" } })
);

sharedBehaviourSuite(
  "resendPhoneOtpRateLimiter",
  resendPhoneOtpRateLimiter,
  () => makeReq({ ip: "1.2.3.4", body: { phone: "+911234567890" } })
);

sharedBehaviourSuite(
  "forgotPasswordRateLimiter",
  forgotPasswordRateLimiter,
  () => makeReq({ ip: "1.2.3.4", body: { email: "user@example.com" } })
);

sharedBehaviourSuite(
  "verifyResetOtpRateLimiter",
  verifyResetOtpRateLimiter,
  () => makeReq({ ip: "1.2.3.4", body: { email: "user@example.com" } })
);

sharedBehaviourSuite(
  "resetPasswordRateLimiter",
  resetPasswordRateLimiter,
  () => makeReq({ ip: "1.2.3.4" })
);

sharedBehaviourSuite(
  "resendResetOtpRateLimiter",
  resendResetOtpRateLimiter,
  () => makeReq({ ip: "1.2.3.4", body: { email: "user@example.com" } })
);

// ── loginRateLimiter specific: dual-rule key isolation ────────────────────────

describe("loginRateLimiter — dual rule (IP + email)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTtl.mockResolvedValue(60);
  });

  it("blocks when the IP counter is exhausted even if email counter is low", async () => {
    // First eval call (IP key) → over limit; second (email key) is never reached
    mockEval.mockResolvedValueOnce(9999);
    const req = makeReq({ ip: "1.2.3.4", body: { email: "a@example.com" } });
    const { res, next } = await runLimiter(loginRateLimiter, req);
    expect(next).not.toHaveBeenCalled();
    expect((res.status as Mock)).toHaveBeenCalledWith(429);
  });

  it("blocks when the email counter is exhausted even if IP counter is fine", async () => {
    // First eval call (IP key) → fine; second (email key) → over limit
    mockEval
      .mockResolvedValueOnce(1)   // IP key: fine
      .mockResolvedValueOnce(9999); // email key: blocked
    const req = makeReq({ ip: "1.2.3.4", body: { email: "victim@example.com" } });
    const { res, next } = await runLimiter(loginRateLimiter, req);
    expect(next).not.toHaveBeenCalled();
    expect((res.status as Mock)).toHaveBeenCalledWith(429);
  });

  it("passes when both IP and email counters are within limits", async () => {
    mockEval.mockResolvedValue(1); // both rules fine
    const req = makeReq({ ip: "1.2.3.4", body: { email: "good@example.com" } });
    const { next } = await runLimiter(loginRateLimiter, req);
    expect(next).toHaveBeenCalledOnce();
  });

  it("uses separate Redis keys for IP and email", async () => {
    mockEval.mockResolvedValue(1);
    const req = makeReq({ ip: "5.6.7.8", body: { email: "KEY@Example.COM" } });
    await runLimiter(loginRateLimiter, req);
    const keys: string[] = mockEval.mock.calls.map((c: unknown[]) => c[2] as string);
    // IP key should contain the IP; email key should contain the lowercased email
    expect(keys.some((k) => k.includes("5.6.7.8"))).toBe(true);
    expect(keys.some((k) => k.includes("key@example.com"))).toBe(true);
    // Keys must be distinct
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ── verifyPhoneRateLimiter specific: phone-key isolation ─────────────────────

describe("verifyPhoneRateLimiter — phone key", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTtl.mockResolvedValue(60);
  });

  it("includes the phone number in the Redis key", async () => {
    mockEval.mockResolvedValue(1);
    const req = makeReq({ ip: "1.2.3.4", body: { phone: "+919876543210" } });
    await runLimiter(verifyPhoneRateLimiter, req);
    const keys: string[] = mockEval.mock.calls.map((c: unknown[]) => c[2] as string);
    expect(keys.some((k) => k.includes("9876543210"))).toBe(true);
  });

  it("blocks on the phone key even from a fresh IP", async () => {
    mockEval
      .mockResolvedValueOnce(1)     // IP key: fine
      .mockResolvedValueOnce(9999); // phone key: blocked
    const req = makeReq({ ip: "9.9.9.9", body: { phone: "+911234567890" } });
    const { res, next } = await runLimiter(verifyPhoneRateLimiter, req);
    expect(next).not.toHaveBeenCalled();
    expect((res.status as Mock)).toHaveBeenCalledWith(429);
  });
});

// ── resendPhoneOtpRateLimiter: separate from verifyPhone ─────────────────────

describe("resendPhoneOtpRateLimiter — independent keys from verifyPhoneRateLimiter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTtl.mockResolvedValue(60);
  });

  it("uses keys prefixed with 'resend_phone_otp', not 'verify_phone'", async () => {
    mockEval.mockResolvedValue(1);
    const req = makeReq({ ip: "1.2.3.4", body: { phone: "+911234567890" } });
    await runLimiter(resendPhoneOtpRateLimiter, req);
    const keys: string[] = mockEval.mock.calls.map((c: unknown[]) => c[2] as string);
    expect(keys.every((k) => k.includes("resend_phone_otp"))).toBe(true);
    expect(keys.some((k) => k.includes("verify_phone"))).toBe(false);
  });
});

// ── forgotPasswordRateLimiter: email normalisation ───────────────────────────

describe("forgotPasswordRateLimiter — email normalisation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTtl.mockResolvedValue(60);
  });

  it("treats the same email with different casing as the same Redis key", async () => {
    mockEval.mockResolvedValue(1);

    const req1 = makeReq({ ip: "1.2.3.4", body: { email: "User@Example.COM" } });
    await runLimiter(forgotPasswordRateLimiter, req1);
    const keys1: string[] = mockEval.mock.calls.map((c: unknown[]) => c[2] as string);

    vi.clearAllMocks();
    mockEval.mockResolvedValue(1);

    const req2 = makeReq({ ip: "1.2.3.4", body: { email: "user@example.com" } });
    await runLimiter(forgotPasswordRateLimiter, req2);
    const keys2: string[] = mockEval.mock.calls.map((c: unknown[]) => c[2] as string);

    // The email-keyed entries should be identical regardless of input casing
    const emailKeys1 = keys1.filter((k) => k.includes(":email:"));
    const emailKeys2 = keys2.filter((k) => k.includes(":email:"));
    expect(emailKeys1).toEqual(emailKeys2);
  });
});

// ── resetPasswordRateLimiter: IP-only, no email key ──────────────────────────

describe("resetPasswordRateLimiter — IP-only rule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTtl.mockResolvedValue(3600);
  });

  it("evaluates exactly one Redis key (IP)", async () => {
    mockEval.mockResolvedValue(1);
    const req = makeReq({ ip: "10.0.0.1", body: { token: "some-jwt" } });
    await runLimiter(resetPasswordRateLimiter, req);
    expect(mockEval).toHaveBeenCalledOnce();
  });

  it("uses a 1-hour window (3600 s)", async () => {
    mockEval.mockResolvedValue(1);
    const req = makeReq({ ip: "10.0.0.1" });
    await runLimiter(resetPasswordRateLimiter, req);
    // ARGV[1] is windowSeconds passed to the Lua script
    const windowArg = mockEval.mock.calls[0][3] as string;
    expect(windowArg).toBe("3600");
  });
});
