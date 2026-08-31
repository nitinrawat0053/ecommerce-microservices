import express from "express";
import productRoutes from "./routes/product.routes";
import importRoutes from "./routes/import.routes";
import categoryRoutes from "./routes/category.routes";
import brandRoutes from "./routes/brand.routes";

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
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);

export default app;