import express from "express";
import orderRoutes from "./routes/order.routes";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

// Trust the first proxy hop so req.ip reflects the real client IP address
// behind reverse proxies / API gateway rather than the internal loopback.
app.set("trust proxy", 1);

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