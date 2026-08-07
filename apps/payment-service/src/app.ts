import express from "express";
import cors from "cors";

import paymentRoutes from "./routes/payment.routes";

const app = express();

app.use(cors());
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