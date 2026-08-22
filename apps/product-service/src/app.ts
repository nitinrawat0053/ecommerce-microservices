import express from "express";
import productRoutes from "./routes/product.routes";
import importRoutes from "./routes/import.routes";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "product-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/products", productRoutes);
app.use("/api/products", importRoutes);

export default app;