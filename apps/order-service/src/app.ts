import express from "express";
import orderRoutes from "./routes/order.routes";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "order-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/orders",orderRoutes);
app.use(errorHandler);

export default app;