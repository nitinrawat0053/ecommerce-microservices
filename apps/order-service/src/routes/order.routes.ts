import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { validate, createOrderSchema } from "@packages/validation";
import { createOrderRateLimiter, cancelOrderRateLimiter } from "../middlewares/rate-limit";
import { orderIdempotencyMiddleware } from "../middlewares/idempotency";

const router = Router();

// Public Routes
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);

// Protected Routes
// createOrderRateLimiter  — per-IP, per-user, and per-user burst window guards
// orderIdempotencyMiddleware — prevents double-submit via Idempotency-Key header
router.post(
  "/",
  createOrderRateLimiter,
  orderIdempotencyMiddleware,
  validate(createOrderSchema),
  orderController.createOrder
);

// ADMIN Routes
// cancelOrderRateLimiter guards update and delete (cancellation) from abuse
router.put("/:id", cancelOrderRateLimiter, orderController.updateOrder);
router.delete("/:id", cancelOrderRateLimiter, orderController.deleteOrder);

export default router;