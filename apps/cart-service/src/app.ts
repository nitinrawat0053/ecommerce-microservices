import express from "express";
import cartRoutes from "./routes/cart.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.set("trust proxy", 1);

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "cart-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/cart", cartRoutes);
app.use(errorHandler);

export default app;