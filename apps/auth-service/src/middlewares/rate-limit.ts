import type { Request, Response, NextFunction } from "express";
import { redisClient } from "@packages/redis";

/**
 * Atomic INCR + conditional EXPIRE.
 *
 * The EXPIRE is only set on the first increment of a key so the window is
 * measured from the first request, and INCR round-trips atomically so
 * concurrent requests cannot race past the limit (each INCR returns a
 * unique, monotonic count).
 *
 * Keys are created with the requested window as their TTL and auto-expire,
 * so no manual cleanup is needed.
 */
const INCR_WINDOW_SCRIPT = `
  local count = redis.call("INCR", KEYS[1])
  if count == 1 then
    redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
  end
  return count
`;

/** Normalize emails before they are used in Redis keys. */
const normalizeEmail = (email: string): string =>
  (email || "").trim().toLowerCase();

/** Normalize a phone number to a safe Redis key segment. */
const normalizePhone = (phone: string): string =>
  (phone || "").trim().replace(/[^0-9+]/g, "");

const WINDOW_15_MIN = 15 * 60;
const WINDOW_10_MIN = 10 * 60;
const WINDOW_1_HOUR = 60 * 60;

interface RateRule {
  /** Redis key to increment for this request. */
  key: (req: Request) => string;
  /** Maximum allowed requests within the window. */
  limit: number;
  /** Window length in seconds (also the key TTL). */
  windowSeconds: number;
}

/**
 * Build a Redis-backed rate limiting middleware.
 *
 * Counters live in Redis (not process memory), so limits are shared across
 * instances and survive restarts. On a Redis failure we fail CLOSED with a
 * generic 503 — we never fall through to let traffic bypass a limit, and we
 * never leak Redis internals to the client.
 */
const createRedisRateLimiter = (rules: RateRule[], message: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
          const ttl = await redisClient.ttl(key);
          if (ttl > 0) retryAfter = ttl;

          res.setHeader("Retry-After", retryAfter.toString());
          res.setHeader("RateLimit-Limit", rule.limit.toString());
          res.setHeader("RateLimit-Remaining", "0");
          res.status(429).json({
            success: false,
            message,
            retryAfter,
          });
          return;
        }
      }

      next();
    } catch (error) {
      console.error(
        "[Auth Service] Redis rate limiter error:",
        (error as Error)?.message || error
      );
      res.status(503).json({
        success: false,
        message: "Service temporarily unavailable. Please try again later.",
      });
      return;
    }
  };
};

const ipKey =
  (prefix: string) =>
  (req: Request): string =>
    `rate_limit:${prefix}:ip:${req.ip}`;

const emailKey =
  (prefix: string) =>
  (req: Request): string =>
    `rate_limit:${prefix}:email:${normalizeEmail(req.body?.email)}`;

const phoneKey =
  (prefix: string) =>
  (req: Request): string =>
    `rate_limit:${prefix}:phone:${normalizePhone(req.body?.phone)}`;

// ─── Registration ─────────────────────────────────────────────────────

export const registerRateLimiter = createRedisRateLimiter(
  [{ key: ipKey("register"), limit: 5, windowSeconds: WINDOW_15_MIN }],
  "Too many registration attempts. Please try again later."
);

// ─── Login (brute-force protection) ───────────────────────────────────
//
// Two complementary rules:
//   • Per-IP:    10 attempts / 15 min  — blocks bots hammering from one IP
//   • Per-email: 10 attempts / 15 min  — blocks credential-stuffing spread
//                                        across many IPs against one account
//
// Both windows intentionally match so a lock-out is predictable for the user.

export const loginRateLimiter = createRedisRateLimiter(
  [
    { key: ipKey("login"), limit: 10, windowSeconds: WINDOW_15_MIN },
    { key: emailKey("login"), limit: 10, windowSeconds: WINDOW_15_MIN },
  ],
  "Too many login attempts. Please try again later."
);

// ─── Phone OTP verification ───────────────────────────────────────────
//
// Two complementary rules:
//   • Per-IP:    5 attempts / 10 min
//   • Per-phone: 5 attempts / 10 min  — prevents targeting a specific number

export const verifyPhoneRateLimiter = createRedisRateLimiter(
  [
    { key: ipKey("verify_phone"), limit: 5, windowSeconds: WINDOW_10_MIN },
    { key: phoneKey("verify_phone"), limit: 5, windowSeconds: WINDOW_10_MIN },
  ],
  "Too many verification attempts. Please try again later."
);

// ─── Resend OTP (phone) ───────────────────────────────────────────────
//
// Separate limiter for /resend-otp (phone verification OTP).  Stricter than
// verify-phone because each resend triggers a Twilio API call.
//   • Per-IP:    3 / 10 min
//   • Per-phone: 3 / 10 min — prevents SMS flooding a specific phone number

export const resendPhoneOtpRateLimiter = createRedisRateLimiter(
  [
    { key: ipKey("resend_phone_otp"), limit: 3, windowSeconds: WINDOW_10_MIN },
    { key: phoneKey("resend_phone_otp"), limit: 3, windowSeconds: WINDOW_10_MIN },
  ],
  "Too many OTP resend attempts. Please try again later."
);

// ─── Forgot password ──────────────────────────────────────────────────

export const forgotPasswordRateLimiter = createRedisRateLimiter(
  [
    {
      key: ipKey("forgot_password"),
      limit: 5,
      windowSeconds: WINDOW_15_MIN,
    },
    {
      key: emailKey("forgot_password"),
      limit: 3,
      windowSeconds: WINDOW_15_MIN,
    },
  ],
  "Too many password reset attempts. Please try again later."
);

// ─── Verify reset OTP ─────────────────────────────────────────────────
//
// Guards /verify-reset-otp at the HTTP layer.  The service layer also tracks
// per-session failures in Redis (up to MAX_RESET_OTP_ATTEMPTS), so this is a
// complementary defence that stops brute-force across different reset sessions.
//   • Per-IP:    10 / 15 min  — blocks automated scanners
//   • Per-email: 10 / 15 min  — matches the IP window for user predictability

export const verifyResetOtpRateLimiter = createRedisRateLimiter(
  [
    { key: ipKey("verify_reset_otp"), limit: 10, windowSeconds: WINDOW_15_MIN },
    { key: emailKey("verify_reset_otp"), limit: 10, windowSeconds: WINDOW_15_MIN },
  ],
  "Too many OTP verification attempts. Please try again later."
);

// ─── Reset password ───────────────────────────────────────────────────
//
// Protects /reset-password from token-stuffing attacks where an attacker
// submits many forged or replayed reset tokens.
//   • Per-IP: 10 / 1 hour  — generous enough for legitimate users (each call
//             consumes one valid token that was already OTP-verified), but
//             strict enough to make brute-forcing the JWT space infeasible.

export const resetPasswordRateLimiter = createRedisRateLimiter(
  [{ key: ipKey("reset_password"), limit: 10, windowSeconds: WINDOW_1_HOUR }],
  "Too many password reset attempts. Please try again later."
);

// ─── Resend reset OTP ─────────────────────────────────────────────────

export const resendResetOtpRateLimiter = createRedisRateLimiter(
  [
    { key: ipKey("resend_otp"), limit: 5, windowSeconds: WINDOW_10_MIN },
    { key: emailKey("resend_otp"), limit: 3, windowSeconds: WINDOW_10_MIN },
  ],
  "Too many OTP resend attempts. Please try again later."
);