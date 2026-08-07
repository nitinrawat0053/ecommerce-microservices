import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";

const router = Router();

router.get(
  "/:id",
  paymentController.getPayment
);

router.get(
  "/order/:orderId",
  paymentController.getOrderPayment
);

router.get(
  "/user/:userId",
  paymentController.getUserPayments
);

export default router;