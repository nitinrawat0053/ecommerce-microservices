import express from "express";
import cors from "cors";
import { paymentController } from "./controllers/payment.controller";
import paymentRoutes from "./routes/payment.routes";

const app = express();

app.use(cors());

app.post("/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentController.razorpayWebhook
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "payment-service",
    status: "OK",
  });
});

app.use("/api/payments", paymentRoutes);

export default app;