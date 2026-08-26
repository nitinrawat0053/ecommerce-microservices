import { Router } from "express";
import { userController } from "../controllers/user.controller";

const router = Router();

// Profile routes
router.get("/profile", userController.getProfile);
router.patch("/notification-preferences", userController.updateNotificationPreferences);

// Super Admin routes
router.get("/", userController.getAllUsers);
router.patch("/:userId/role", userController.updateUserRole);

export default router;
