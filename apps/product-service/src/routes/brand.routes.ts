import { Router } from "express";
import { brandController } from "../controllers/brand.controller";

const router = Router();

// Public Routes
router.get("/", brandController.getAllBrands);
router.get("/:id", brandController.getBrandById);

// ADMIN auth is enforced at the API gateway
router.post("/", brandController.createBrand);
router.put("/:id", brandController.updateBrand);
router.delete("/:id", brandController.deleteBrand);

export default router;
