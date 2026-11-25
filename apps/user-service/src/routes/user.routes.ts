import { Router } from "express";
import { userController } from "../controllers/user.controller";
import {
  getProfileRateLimiter,
  updateProfileRateLimiter,
  changePasswordRateLimiter,
  addressRateLimiter,
} from "../middlewares/rate-limit";

const router = Router();

// Profile routes
router.get("/profile", getProfileRateLimiter, userController.getProfile);
router.put("/profile", updateProfileRateLimiter, userController.updateProfile);
router.patch("/profile", updateProfileRateLimiter, userController.updateProfile);
router.patch(
  "/notification-preferences",
  updateProfileRateLimiter,
  userController.updateNotificationPreferences
);

// Password route
router.post(
  "/change-password",
  changePasswordRateLimiter,
  userController.changePassword
);
router.put(
  "/password",
  changePasswordRateLimiter,
  userController.changePassword
);

// Address routes
router.get("/addresses", addressRateLimiter, userController.getAddresses);
router.post("/addresses", addressRateLimiter, userController.addAddress);
router.put(
  "/addresses/:addressId",
  addressRateLimiter,
  userController.updateAddress
);
router.delete(
  "/addresses/:addressId",
  addressRateLimiter,
  userController.deleteAddress
);

// Super Admin routes
router.get("/", userController.getAllUsers);
router.patch("/:userId/role", userController.updateUserRole);

export default router;
