import { OrderPlacedEvent, PaymentSuccessEvent, PaymentFailedEvent } from "@packages/shared-types";
import { EmailProvider } from "../providers/email.provider";
import { SmsProvider } from "../providers/sms.provider";
import { WhatsAppProvider } from "../providers/whatsapp.provider";
import { UserClient } from "../clients/user.client";
import { UserService } from "./user.service";

const userService = new UserService();
export class NotificationService {
  private emailProvider = new EmailProvider();
  private smsProvider = new SmsProvider();
  private whatsappProvider = new WhatsAppProvider();
  private userClient = new UserClient();

  async handleOrderPlaced(message: OrderPlacedEvent) {
    console.log("🔔 Processing ORDER_PLACED notification");

    const user = await userService.getUser(message.userId);

    const Message = `Your order ${message.orderId} has been placed successfully.`;

    await this.sendNotifications(
      user,
      Message
    );
  }

  async handlePaymentSuccess(event: PaymentSuccessEvent) {
    console.log("💰 Processing PAYMENT_SUCCESS notification");

    const user = await this.userClient.getUser(event.userId);

    const message =
      `Payment successful for order ${event.orderId}. ` +
      `Transaction ID: ${event.transactionId}`;

    await this.sendNotifications(
      user,
      message
    );
  }

  async handlePaymentFailed(event: PaymentFailedEvent) {
    console.log("❌ Processing PAYMENT_FAILED notification");

    const user = await this.userClient.getUser(event.userId);

    const message =
      `Payment failed for order ${event.orderId}.`;

    await this.sendNotifications(
      user,
      message
    );
  }

  private async sendNotifications(
    user: any,
    message: string
  ) {
    const notifications: Promise<void>[] = [];

    if (user.notificationPreferences.email) {
      notifications.push(
        this.emailProvider.send(
          user.email,
          message
        )
      );
    }

    if (user.notificationPreferences.sms) {
      notifications.push(
        this.smsProvider.send(
          user.phone,
          message
        )
      );
    }

    if (user.notificationPreferences.whatsapp) {
      notifications.push(
        this.whatsappProvider.send(
          user.phone,
          message
        )
      );
    }

    await Promise.all(notifications);
  }
}