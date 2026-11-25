import express from "express";
import notificationRoutes from "./routes/notification.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.set("trust proxy", 1);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "UP",
    service: "notification-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

export default app;
