import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";

const router = Router();

router.get("/:id",
  paymentController.getPayment
);

router.get("/order/:orderId",
  paymentController.getOrderPayment
);

router.get("/user/:userId",
  paymentController.getUserPayments
);

router.post("/verify",
  paymentController.verifyPayment
);

router.post("/webhook",
  paymentController.razorpayWebhook
);
export default router;