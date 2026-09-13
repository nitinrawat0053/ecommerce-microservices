import { Router } from "express";
import { NotFoundError } from "@packages/errors";
import { registerSchema, loginSchema, validate, verifyPhoneSchema, forgotPasswordSchema, resendResetOtpSchema, verifyResetOtpSchema, resetPasswordSchema } from "@packages/validation";
import {authController} from "../controllers/auth.controller";
import { registerRateLimiter, verifyPhoneRateLimiter, forgotPasswordRateLimiter, resendResetOtpRateLimiter } from "../middlewares/rate-limit";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    service: "Auth Service",
    message: "Auth Service is running 🚀"
  });
});

router.get("/test-error", (req, res) => {
  throw new NotFoundError("Test user not found");
});

router.post("/register", 
  registerRateLimiter,
  validate(registerSchema),
  authController.register);

router.post("/login",
  validate(loginSchema),
  authController.login);

router.post("/verify-phone",
  verifyPhoneRateLimiter,
  validate(verifyPhoneSchema),
  authController.verifyPhone
);

router.post("/resend-otp",
  verifyPhoneRateLimiter,
  authController.resendOtp
);

router.post("/forgot-password",
  forgotPasswordRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post("/verify-reset-otp",
  validate(verifyResetOtpSchema),
  authController.verifyResetOtp
);

// Separate, stricter flow: resend the reset OTP with its own limits and a
// 60s cooldown (enforced by Redis at the service layer).
router.post("/resend-reset-otp",
  resendResetOtpRateLimiter,
  validate(resendResetOtpSchema),
  authController.resendResetOtp
);

router.post("/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;