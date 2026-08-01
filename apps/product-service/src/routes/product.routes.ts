import { Router } from "express";
import { productController } from "../controllers/product.controller";

const router = Router();

// Public Routes
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);

// ADMIN Routes
router.post("/", productController.createProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

router.patch("/:id/stock", productController.reduceStock);
export default router;