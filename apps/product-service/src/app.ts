import express from "express";
import productRoutes from "./routes/product.routes";
import importRoutes from "./routes/import.routes";
import categoryRoutes from "./routes/category.routes";
import brandRoutes from "./routes/brand.routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.set("trust proxy", 1);

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "product-service",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/products", importRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);

app.use(errorHandler);

export default app;