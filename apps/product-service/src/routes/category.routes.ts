import { Router } from "express";
import { categoryController } from "../controllers/category.controller";

const router = Router();

// Public Routes
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// ADMIN auth is enforced at the API gateway
router.post("/", categoryController.createCategory);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

export default router;
