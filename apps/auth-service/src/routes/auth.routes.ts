import { Router } from "express";
import { NotFoundError } from "@packages/errors";
import { registerSchema,loginSchema,validate,verifyPhoneSchema } from "@packages/validation";
import {authController} from "../controllers/auth.controller";
import { registerRateLimiter, verifyPhoneRateLimiter } from "../middlewares/rate-limit";

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

export default router;