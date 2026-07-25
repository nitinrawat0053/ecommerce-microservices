import { Router } from "express";
import { NotFoundError } from "@packages/errors";
import { registerSchema,loginSchema } from "@packages/validation";
import {validate} from "../middlewares/validate.middleware";
import {authController} from "../controllers/auth.controller";

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
  validate(registerSchema),
  authController.register);

router.post("/login",
  validate(loginSchema),
  authController.login);

export default router;