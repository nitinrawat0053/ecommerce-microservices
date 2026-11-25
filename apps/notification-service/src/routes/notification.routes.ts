import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import {
  authenticateUser,
  authenticateInternal,
} from "../middlewares/auth.middleware";
import {
  sendEmailRateLimiter,
  sendSmsRateLimiter,
  resendNotificationRateLimiter,
  getUserNotificationsRateLimiter,
  markNotificationReadRateLimiter,
  internalNotificationRateLimiter,
} from "../middlewares/rate-limit";

const router = Router();

// ─── User-Facing Notification Endpoints ───────────────────────────────────────

// 1. Send email notification (authenticated user)
router.post(
  "/email",
  authenticateUser,
  sendEmailRateLimiter,
  notificationController.sendEmail.bind(notificationController)
);

// 2. Send SMS notification (authenticated user)
router.post(
  "/sms",
  authenticateUser,
  sendSmsRateLimiter,
  notificationController.sendSms.bind(notificationController)
);

// 3. Resend OTP or notification with 60s cooldown
router.post(
  "/resend",
  authenticateUser,
  resendNotificationRateLimiter,
  notificationController.resendNotification.bind(notificationController)
);

// 4. Get authenticated user's notifications
router.get(
  "/",
  authenticateUser,
  getUserNotificationsRateLimiter,
  notificationController.getUserNotifications.bind(notificationController)
);

// 5. Mark notification as read (strictly user-scoped)
router.patch(
  "/:id/read",
  authenticateUser,
  markNotificationReadRateLimiter,
  notificationController.markAsRead.bind(notificationController)
);

// ─── Internal Service-to-Service Notification Endpoints ───────────────────────

// 6. Internal notification dispatch (authenticated via x-internal-secret)
router.post(
  "/internal/send",
  authenticateInternal,
  internalNotificationRateLimiter,
  notificationController.internalSend.bind(notificationController)
);

export default router;
