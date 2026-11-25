import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import { requireAdmin } from "../middlewares/auth.middleware";
import {
  categoryReadRateLimiter,
  adminCategoryMutationRateLimiter,
} from "../middlewares/rate-limit";

const router = Router();

// Public Routes
router.get("/", categoryReadRateLimiter, categoryController.getAllCategories);
router.get("/:id", categoryReadRateLimiter, categoryController.getCategoryById);

// ADMIN Routes
router.post(
  "/",
  requireAdmin,
  adminCategoryMutationRateLimiter,
  categoryController.createCategory
);
router.put(
  "/:id",
  requireAdmin,
  adminCategoryMutationRateLimiter,
  categoryController.updateCategory
);
router.delete(
  "/:id",
  requireAdmin,
  adminCategoryMutationRateLimiter,
  categoryController.deleteCategory
);

export default router;
