import { Router } from "express";
import { userController } from "../controllers/user.controller";

const router = Router();

router.get("/profile", userController.getProfile);
router.patch("/notification-preferences", userController.updateNotificationPreferences);

export default router;