import { OrderPlacedEvent, PaymentSuccessEvent, PaymentFailedEvent } from "@packages/shared-types";
import { EmailProvider } from "../providers/email.provider";
import { SmsProvider } from "../providers/sms.provider";
import { WhatsAppProvider } from "../providers/whatsapp.provider";
import { UserClient } from "../clients/user.client";
import { UserService } from "./user.service";
import { notificationTemplates } from "../templates/notification.templates";

const userService = new UserService();
export class NotificationService {
  private emailProvider = new EmailProvider();
  private smsProvider = new SmsProvider();
  private whatsappProvider = new WhatsAppProvider();
  private userClient = new UserClient();

  async handleOrderPlaced(orderEvent: OrderPlacedEvent) {
    console.log("🔔 Processing ORDER_PLACED notification");

    const user = await userService.getUser(orderEvent.userId);

    const message = notificationTemplates.orderPlaced(orderEvent.orderId)

    await this.sendNotifications(
      user,
      message
    );
  }

  async handlePaymentSuccess(paymentEvent: PaymentSuccessEvent) {
    console.log(`💰 [NotificationService] Processing PAYMENT_SUCCESS notification for orderId: ${paymentEvent.orderId}, userId: ${paymentEvent.userId}`);

    let user: any;
    try {
      user = await userService.getUser(paymentEvent.userId);
      console.log(`✅ [NotificationService] Fetched user for payment success: ${user?.email || 'unknown'}`);
    } catch (userError: any) {
      console.error(`❌ [NotificationService] Failed to fetch user ${paymentEvent.userId} for payment success:`, userError.message);
      // Re-throw so retry mechanism can handle it
      throw userError;
    }

    const message = notificationTemplates.paymentSuccess(
      paymentEvent.orderId,
      paymentEvent.transactionId
    );

    console.log(`📧 [NotificationService] Sending payment success email to ${user.email}`);
    await this.sendNotifications(
      user,
      message
    );
    console.log(`✅ [NotificationService] Payment success notifications sent for order ${paymentEvent.orderId}`);
  }

  async handlePaymentFailed(paymentEvent: PaymentFailedEvent) {
    console.log("❌ Processing PAYMENT_FAILED notification");

    const user = await this.userClient.getUser(paymentEvent.userId);

    const message = notificationTemplates.paymentFailed(
      paymentEvent.orderId
    );
    await this.sendNotifications(
      user,
      message
    );
  }

  private async sendNotifications(
    user: any,
    message: string
  ) {
    console.log(`📧 [NotificationService] sendNotifications called for user: ${user?.email}, message length: ${message?.length}`);
    
    const notifications: Promise<void>[] = [];
    const prefs = user?.notificationPreferences || { email: true, sms: true, whatsapp: true };

    if (prefs.email && user?.email) {
      console.log(`📧 [NotificationService] Pushing email notification to ${user.email}`);
      notifications.push(
        this.emailProvider.send(
          user.email,
          message
        )
      );
    } else {
      console.log(`⚠️ [NotificationService] Email notification skipped - email enabled: ${prefs.email}, user email: ${user?.email}`);
    }

    if (prefs.sms && user?.phone) {
      console.log(`📱 [NotificationService] Pushing SMS notification to ${user.phone}`);
      notifications.push(
        this.smsProvider.send(
          user.phone,
          message
        )
      );
    } else {
      console.log(`⚠️ [NotificationService] SMS notification skipped - sms enabled: ${prefs.sms}, user phone: ${user?.phone}`);
    }

    if (prefs.whatsapp && user?.phone) {
      console.log(`💬 [NotificationService] Pushing WhatsApp notification to ${user.phone}`);
      notifications.push(
        this.whatsappProvider.send(
          user.phone,
          message
        )
      );
    }

    if (notifications.length === 0) {
      console.log(`⚠️ [NotificationService] No notification channels enabled for user ${user?.email}`);
      return;
    }

    console.log(`📤 [NotificationService] Sending ${notifications.length} notifications...`);
    const results = await Promise.allSettled(notifications);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ [NotificationService] Notification ${index} failed:`, result.reason);
      } else {
        console.log(`✅ [NotificationService] Notification ${index} sent successfully`);
      }
    });
    
    // Throw if ALL notifications failed
    const allFailed = results.every(r => r.status === 'rejected');
    if (allFailed && results.length > 0) {
      throw new Error('All notification channels failed');
    }
  }
}