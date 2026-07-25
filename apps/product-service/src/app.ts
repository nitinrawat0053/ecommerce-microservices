import express from "express";
import productRoutes from "./routes/product.routes";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "user-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/products",productRoutes);

export default app;