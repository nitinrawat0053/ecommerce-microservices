import express from "express";
import userRoutes from "./routes/user.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.set("trust proxy", 1);

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "user-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/users", userRoutes);
app.use(errorHandler);

export default app;