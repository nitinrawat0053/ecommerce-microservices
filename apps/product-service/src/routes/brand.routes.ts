import { Router } from "express";
import { brandController } from "../controllers/brand.controller";
import { requireAdmin } from "../middlewares/auth.middleware";
import {
  categoryReadRateLimiter,
  adminCategoryMutationRateLimiter,
} from "../middlewares/rate-limit";

const router = Router();

// Public Routes
router.get("/", categoryReadRateLimiter, brandController.getAllBrands);
router.get("/:id", categoryReadRateLimiter, brandController.getBrandById);

// ADMIN Routes
router.post(
  "/",
  requireAdmin,
  adminCategoryMutationRateLimiter,
  brandController.createBrand
);
router.put(
  "/:id",
  requireAdmin,
  adminCategoryMutationRateLimiter,
  brandController.updateBrand
);
router.delete(
  "/:id",
  requireAdmin,
  adminCategoryMutationRateLimiter,
  brandController.deleteBrand
);

export default router;
