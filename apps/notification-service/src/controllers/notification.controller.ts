import type { Request, Response, NextFunction } from "express";
import { BadRequestError, NotFoundError } from "@packages/errors";
import { EmailProvider } from "../providers/email.provider";
import { SmsProvider } from "../providers/sms.provider";
import { notificationRepository } from "../repositories/notification.repository";

export class NotificationController {
  private emailProvider = new EmailProvider();
  private smsProvider = new SmsProvider();

  /**
   * Send Email Notification
   */
  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const email = (req.body?.email || req.body?.recipient)?.trim();
      const message = req.body?.message?.trim();
      const subject = req.body?.subject?.trim() || "E-commerce Notification";
      const html = req.body?.html;

      if (!email || !message) {
        throw new BadRequestError("Email recipient and message are required");
      }

      await this.emailProvider.send(email, message, subject, html);

      // Record in-app notification for authenticated user if applicable
      const userId = req.user?.userId;
      if (userId) {
        await notificationRepository.create({
          userId,
          type: "EMAIL",
          title: subject,
          message,
          recipient: email,
        });
      }

      res.status(200).json({
        success: true,
        message: "Email notification sent successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send SMS Notification
   */
  async sendSms(req: Request, res: Response, next: NextFunction) {
    try {
      const phone = (req.body?.phone || req.body?.recipient)?.trim();
      const message = req.body?.message?.trim();

      if (!phone || !message) {
        throw new BadRequestError("Phone number and message are required");
      }

      await this.smsProvider.send(phone, message);

      const userId = req.user?.userId;
      if (userId) {
        await notificationRepository.create({
          userId,
          type: "SMS",
          title: "SMS Notification",
          message,
          recipient: phone,
        });
      }

      res.status(200).json({
        success: true,
        message: "SMS notification sent successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend OTP or Notification
   */
  async resendNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const recipient = (req.body?.recipient || req.body?.email || req.body?.phone)?.trim();
      const type = (req.body?.type || "EMAIL").toUpperCase();
      const message = req.body?.message?.trim() || "Your verification code has been resent.";
      const subject = req.body?.subject || "Resent Notification";

      if (!recipient) {
        throw new BadRequestError("Recipient address or phone number is required");
      }

      if (type === "SMS") {
        await this.smsProvider.send(recipient, message);
      } else {
        await this.emailProvider.send(recipient, message, subject);
      }

      res.status(200).json({
        success: true,
        message: "Notification resent successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get authenticated user's notifications.
   * Strictly enforces caller userId from authenticated token.
   */
  async getUserNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const notifications = await notificationRepository.findByUserId(userId);

      res.status(200).json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a notification as read.
   * Scoped strictly to authenticated user's own notifications (Anti-IDOR).
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const notificationId = req.params.id;

      if (!notificationId) {
        throw new BadRequestError("Notification ID is required");
      }

      const updated = await notificationRepository.markAsRead(
        notificationId,
        userId
      );

      if (!updated) {
        throw new NotFoundError(
          "Notification not found or access denied"
        );
      }

      res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Internal service-to-service notification dispatcher.
   */
  async internalSend(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, recipient, message, subject, userId } = req.body;

      if (!recipient || !message) {
        throw new BadRequestError("Recipient and message are required");
      }

      if (type === "SMS") {
        await this.smsProvider.send(recipient, message);
      } else {
        await this.emailProvider.send(recipient, message, subject);
      }

      if (userId) {
        await notificationRepository.create({
          userId,
          type: type === "SMS" ? "SMS" : "EMAIL",
          title: subject || "System Notification",
          message,
          recipient,
        });
      }

      res.status(200).json({
        success: true,
        message: "Internal notification dispatched successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
