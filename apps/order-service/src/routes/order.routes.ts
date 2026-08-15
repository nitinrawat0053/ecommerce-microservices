import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import {validate, createOrderSchema} from "@packages/validation";
const router = Router();

// Public Routes
router.get("/", orderController.getAllOrders);
router.get("/:id", orderController.getOrderById);

// Protected Routes
router.post("/",  validate(createOrderSchema), orderController.createOrder);

// ADMIN Routes
router.put("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);

export default router;