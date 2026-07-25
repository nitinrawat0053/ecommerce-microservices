import express from "express";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "user-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/users",userRoutes);

export default app;