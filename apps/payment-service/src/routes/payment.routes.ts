import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { verifyPaymentRateLimiter } from "../middlewares/rate-limit";
import { paymentVerifyIdempotencyMiddleware } from "../middlewares/idempotency";

const router = Router();

// IMPORTANT: specific sub-paths must be registered BEFORE the /:id wildcard.
// Express matches routes in declaration order; "/:id" would shadow "/order/:orderId"
// and "/user/:userId" because the literal segments "order" and "user" are valid :id values.

router.get("/order/:orderId",
  paymentController.getOrderPayment
);

router.get("/user/:userId",
  paymentController.getUserPayments
);

// verifyPaymentRateLimiter  — prevents signature brute-forcing and duplicate submits
// paymentVerifyIdempotencyMiddleware — Redis SET NX guard against concurrent duplicates
router.post("/verify",
  verifyPaymentRateLimiter,
  paymentVerifyIdempotencyMiddleware,
  paymentController.verifyPayment
);

// Webhook: NO user rate limiter — Razorpay is a trusted provider, not a user.
// Deduplication is applied in app.ts (before JSON parsing) via the
// webhookDeduplicationMiddleware so duplicate events are ack'd with 200
// without hitting the DB.
router.post("/webhook",
  paymentController.razorpayWebhook
);

// Generic /:id wildcard must come LAST so it cannot shadow the routes above.
router.get("/:id",
  paymentController.getPayment
);

export default router;