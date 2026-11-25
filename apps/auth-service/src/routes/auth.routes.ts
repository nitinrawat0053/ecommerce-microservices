import { Router } from "express";
import { NotFoundError } from "@packages/errors";
import {
  registerSchema,
  loginSchema,
  validate,
  verifyPhoneSchema,
  forgotPasswordSchema,
  resendResetOtpSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from "@packages/validation";
import { authController } from "../controllers/auth.controller";
import {
  registerRateLimiter,
  loginRateLimiter,
  verifyPhoneRateLimiter,
  resendPhoneOtpRateLimiter,
  forgotPasswordRateLimiter,
  verifyResetOtpRateLimiter,
  resendResetOtpRateLimiter,
  resetPasswordRateLimiter,
} from "../middlewares/rate-limit";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    service: "Auth Service",
    message: "Auth Service is running 🚀",
  });
});

router.get("/test-error", (req, res) => {
  throw new NotFoundError("Test user not found");
});

router.post(
  "/register",
  registerRateLimiter,
  validate(registerSchema),
  authController.register
);

// loginRateLimiter — was missing; guards against credential brute-force
router.post(
  "/login",
  loginRateLimiter,
  validate(loginSchema),
  authController.login
);

router.post(
  "/verify-phone",
  verifyPhoneRateLimiter,
  validate(verifyPhoneSchema),
  authController.verifyPhone
);

// resendPhoneOtpRateLimiter — stricter, also keys on phone number to prevent
// SMS flooding any specific phone from multiple IPs
router.post(
  "/resend-otp",
  resendPhoneOtpRateLimiter,
  authController.resendOtp
);

router.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// verifyResetOtpRateLimiter — was missing at the HTTP layer; the service layer
// per-session counter is a defence-in-depth measure, not a substitute.
router.post(
  "/verify-reset-otp",
  verifyResetOtpRateLimiter,
  validate(verifyResetOtpSchema),
  authController.verifyResetOtp
);

// Separate, stricter flow: resend the reset OTP with its own limits and a
// 60s cooldown (enforced by Redis at the service layer).
router.post(
  "/resend-reset-otp",
  resendResetOtpRateLimiter,
  validate(resendResetOtpSchema),
  authController.resendResetOtp
);

// resetPasswordRateLimiter — was missing; defends against token-stuffing
router.post(
  "/reset-password",
  resetPasswordRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;