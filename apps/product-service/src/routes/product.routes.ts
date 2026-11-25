import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { requireAdmin } from "../middlewares/auth.middleware";
import {
  productQueryRateLimiter,
  getProductByIdRateLimiter,
  adminProductMutationRateLimiter,
  adminProductDeleteRateLimiter,
  inventoryRateLimiter,
} from "../middlewares/rate-limit";

const router = Router();

// Public Routes
router.get("/", productQueryRateLimiter, productController.getAllProducts);
router.get("/:id", getProductByIdRateLimiter, productController.getProductById);

// ADMIN Routes
router.post(
  "/",
  requireAdmin,
  adminProductMutationRateLimiter,
  productController.createProduct
);
router.put(
  "/:id",
  requireAdmin,
  adminProductMutationRateLimiter,
  productController.updateProduct
);
router.delete(
  "/:id",
  requireAdmin,
  adminProductDeleteRateLimiter,
  productController.deleteProduct
);

// Inventory Management
router.patch(
  "/:id/stock",
  requireAdmin,
  inventoryRateLimiter,
  productController.reduceStock
);

export default router;
