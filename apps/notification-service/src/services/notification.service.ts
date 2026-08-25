import { OrderPlacedEvent, PaymentSuccessEvent, PaymentFailedEvent } from "@packages/shared-types";
import { EmailProvider } from "../providers/email.provider";
import { SmsProvider } from "../providers/sms.provider";
import { WhatsAppProvider } from "../providers/whatsapp.provider";
import { UserService } from "./user.service";
import { OrderClient } from "../clients/order.client";
import { ProductClient } from "../clients/product.client";
import { emailTemplates, OrderEmailData } from "../templates/email.templates";

const userService = new UserService();

export class NotificationService {
  private emailProvider = new EmailProvider();
  private smsProvider = new SmsProvider();
  private whatsappProvider = new WhatsAppProvider();
  private orderClient = new OrderClient();
  private productClient = new ProductClient();

  /**
   * Build rich email data by fetching order + product details.
   * Falls back gracefully if any fetch fails.
   */
  private async buildEmailData(
    orderId: string,
    userId: string,
    options?: { transactionId?: string }
  ): Promise<OrderEmailData> {
    // Fetch user
    let user: any;
    try {
      user = await userService.getUser(userId);
    } catch (e: any) {
      console.error(`❌ [NotificationService] Failed to fetch user ${userId}:`, e.message);
      user = { email: "", name: "Customer" };
    }

    // Fetch order details
    const order = await this.orderClient.getOrder(orderId);

    let orderItems: OrderEmailData["orderItems"] = [];
    let subtotal = 0;
    let total = 0;
    let orderNumber = orderId.slice(-8).toUpperCase();

    if (order) {
      orderNumber = order.orderId
        ? order.orderId.slice(-8).toUpperCase()
        : orderId.slice(-8).toUpperCase();
      total = order.totalAmount || 0;
      subtotal = total;

      // Fetch product details
      const product = await this.productClient.getProduct(order.productId);
      orderItems = [
        {
          productName: product?.name || "Product",
          productImage: product?.image,
          quantity: order.quantity || 1,
          price: order.priceAtPurchase || product?.price || 0,
        },
      ];
    }

    return {
      customerName: user?.name || user?.email?.split("@")[0] || "Customer",
      orderNumber,
      orderId,
      orderItems,
      subtotal,
      discount: 0,
      shipping: 0,
      tax: 0,
      total,
      paymentMethod: "Razorpay",
      frontendUrl: "http://localhost:5173",
      transactionId: options?.transactionId,
    };
  }

  async handleOrderPlaced(orderEvent: OrderPlacedEvent) {
    console.log(`🔔 [NotificationService] Processing ORDER_PLACED notification for orderId: ${orderEvent.orderId}`);

    const user = await userService.getUser(orderEvent.userId);

    // Build rich email data
    const emailData = await this.buildEmailData(orderEvent.orderId, orderEvent.userId);
    const { subject, html } = emailTemplates.orderPlaced(emailData);

    // Plain text fallback for SMS
    const smsMessage = `Your order #${emailData.orderNumber} has been placed successfully. Total: ₹${emailData.total}. View your order at ${emailData.frontendUrl}/orders/${emailData.orderId}`;

    await this.sendRichNotifications(user, subject, html, smsMessage);
  }

  async handlePaymentSuccess(paymentEvent: PaymentSuccessEvent) {
    console.log(`💰 [NotificationService] Processing PAYMENT_SUCCESS notification for orderId: ${paymentEvent.orderId}`);

    let user: any;
    try {
      user = await userService.getUser(paymentEvent.userId);
      console.log(`✅ [NotificationService] Fetched user for payment success: ${user?.email || "unknown"}`);
    } catch (userError: any) {
      console.error(`❌ [NotificationService] Failed to fetch user ${paymentEvent.userId}:`, userError.message);
      throw userError;
    }

    // Build rich email data
    const emailData = await this.buildEmailData(
      paymentEvent.orderId,
      paymentEvent.userId,
      { transactionId: paymentEvent.transactionId }
    );
    const { subject, html } = emailTemplates.paymentSuccess(emailData);

    // Plain text fallback for SMS
    const smsMessage = `Payment of ₹${emailData.total} received for order #${emailData.orderNumber}. Transaction ID: ${paymentEvent.transactionId}. View details at ${emailData.frontendUrl}/orders/${emailData.orderId}`;

    console.log(`📧 [NotificationService] Sending payment success email to ${user.email}`);
    await this.sendRichNotifications(user, subject, html, smsMessage);
    console.log(`✅ [NotificationService] Payment success notifications sent for order ${paymentEvent.orderId}`);
  }

  async handlePaymentFailed(paymentEvent: PaymentFailedEvent) {
    console.log(`❌ [NotificationService] Processing PAYMENT_FAILED notification for orderId: ${paymentEvent.orderId}`);

    const user = await userService.getUser(paymentEvent.userId);

    // Build rich email data
    const emailData = await this.buildEmailData(paymentEvent.orderId, paymentEvent.userId);
    const { subject, html } = emailTemplates.paymentFailed(emailData);

    const smsMessage = `Payment failed for order #${emailData.orderNumber}. Please try again. View details at ${emailData.frontendUrl}/orders/${emailData.orderId}`;

    await this.sendRichNotifications(user, subject, html, smsMessage);
  }

  /**
   * Send notifications with rich HTML email support.
   */
  private async sendRichNotifications(
    user: any,
    emailSubject: string,
    emailHtml: string,
    smsMessage: string
  ) {
    console.log(`📧 [NotificationService] sendRichNotifications called for user: ${user?.email}`);

    const notifications: Promise<void>[] = [];
    const prefs = user?.notificationPreferences || { email: true, sms: true, whatsapp: true };

    if (prefs.email && user?.email) {
      console.log(`📧 [NotificationService] Pushing rich email to ${user.email}`);
      notifications.push(
        this.emailProvider.send(user.email, smsMessage, emailSubject, emailHtml)
      );
    } else {
      console.log(`⚠️ [NotificationService] Email skipped — enabled: ${prefs.email}, email: ${user?.email}`);
    }

    if (prefs.sms && user?.phone) {
      console.log(`📱 [NotificationService] Pushing SMS to ${user.phone}`);
      notifications.push(
        this.smsProvider.send(user.phone, smsMessage)
      );
    } else {
      console.log(`⚠️ [NotificationService] SMS skipped — enabled: ${prefs.sms}, phone: ${user?.phone}`);
    }

    if (prefs.whatsapp && user?.phone) {
      console.log(`💬 [NotificationService] Pushing WhatsApp to ${user.phone}`);
      notifications.push(
        this.whatsappProvider.send(user.phone, smsMessage)
      );
    }

    if (notifications.length === 0) {
      console.log(`⚠️ [NotificationService] No notification channels enabled for user ${user?.email}`);
      return;
    }

    console.log(`📤 [NotificationService] Sending ${notifications.length} notifications...`);
    const results = await Promise.allSettled(notifications);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`❌ [NotificationService] Notification ${index} failed:`, result.reason);
      } else {
        console.log(`✅ [NotificationService] Notification ${index} sent successfully`);
      }
    });

    const allFailed = results.every((r) => r.status === "rejected");
    if (allFailed && results.length > 0) {
      throw new Error("All notification channels failed");
    }
  }
}

// import { OrderPlacedEvent, PaymentSuccessEvent, PaymentFailedEvent } from "@packages/shared-types";
// import { EmailProvider } from "../providers/email.provider";
// import { SmsProvider } from "../providers/sms.provider";
// import { WhatsAppProvider } from "../providers/whatsapp.provider";
// import { UserClient } from "../clients/user.client";
// import { UserService } from "./user.service";
// import { notificationTemplates } from "../templates/notification.templates";

// const userService = new UserService();
// export class NotificationService {
//   private emailProvider = new EmailProvider();
//   private smsProvider = new SmsProvider();
//   private whatsappProvider = new WhatsAppProvider();
//   private userClient = new UserClient();

//   async handleOrderPlaced(orderEvent: OrderPlacedEvent) {
//     console.log("🔔 Processing ORDER_PLACED notification");

//     const user = await userService.getUser(orderEvent.userId);

//     const message = notificationTemplates.orderPlaced(orderEvent.orderId)

//     await this.sendNotifications(
//       user,
//       message
//     );
//   }

//   async handlePaymentSuccess(paymentEvent: PaymentSuccessEvent) {
//     console.log(`💰 [NotificationService] Processing PAYMENT_SUCCESS notification for orderId: ${paymentEvent.orderId}, userId: ${paymentEvent.userId}`);

//     let user: any;
//     try {
//       user = await userService.getUser(paymentEvent.userId);
//       console.log(`✅ [NotificationService] Fetched user for payment success: ${user?.email || 'unknown'}`);
//     } catch (userError: any) {
//       console.error(`❌ [NotificationService] Failed to fetch user ${paymentEvent.userId} for payment success:`, userError.message);
//       // Re-throw so retry mechanism can handle it
//       throw userError;
//     }

//     const message = notificationTemplates.paymentSuccess(
//       paymentEvent.orderId,
//       paymentEvent.transactionId
//     );

//     console.log(`📧 [NotificationService] Sending payment success email to ${user.email}`);
//     await this.sendNotifications(
//       user,
//       message
//     );
//     console.log(`✅ [NotificationService] Payment success notifications sent for order ${paymentEvent.orderId}`);
//   }

//   async handlePaymentFailed(paymentEvent: PaymentFailedEvent) {
//     console.log("❌ Processing PAYMENT_FAILED notification");

//     const user = await this.userClient.getUser(paymentEvent.userId);

//     const message = notificationTemplates.paymentFailed(
//       paymentEvent.orderId
//     );
//     await this.sendNotifications(
//       user,
//       message
//     );
//   }

//   private async sendNotifications(
//     user: any,
//     message: string
//   ) {
//     console.log(`📧 [NotificationService] sendNotifications called for user: ${user?.email}, message length: ${message?.length}`);
    
//     const notifications: Promise<void>[] = [];
//     const prefs = user?.notificationPreferences || { email: true, sms: true, whatsapp: true };

//     if (prefs.email && user?.email) {
//       console.log(`📧 [NotificationService] Pushing email notification to ${user.email}`);
//       notifications.push(
//         this.emailProvider.send(
//           user.email,
//           message
//         )
//       );
//     } else {
//       console.log(`⚠️ [NotificationService] Email notification skipped - email enabled: ${prefs.email}, user email: ${user?.email}`);
//     }

//     if (prefs.sms && user?.phone) {
//       console.log(`📱 [NotificationService] Pushing SMS notification to ${user.phone}`);
//       notifications.push(
//         this.smsProvider.send(
//           user.phone,
//           message
//         )
//       );
//     } else {
//       console.log(`⚠️ [NotificationService] SMS notification skipped - sms enabled: ${prefs.sms}, user phone: ${user?.phone}`);
//     }

//     if (prefs.whatsapp && user?.phone) {
//       console.log(`💬 [NotificationService] Pushing WhatsApp notification to ${user.phone}`);
//       notifications.push(
//         this.whatsappProvider.send(
//           user.phone,
//           message
//         )
//       );
//     }

//     if (notifications.length === 0) {
//       console.log(`⚠️ [NotificationService] No notification channels enabled for user ${user?.email}`);
//       return;
//     }

//     console.log(`📤 [NotificationService] Sending ${notifications.length} notifications...`);
//     const results = await Promise.allSettled(notifications);
    
//     results.forEach((result, index) => {
//       if (result.status === 'rejected') {
//         console.error(`❌ [NotificationService] Notification ${index} failed:`, result.reason);
//       } else {
//         console.log(`✅ [NotificationService] Notification ${index} sent successfully`);
//       }
//     });
    
//     // Throw if ALL notifications failed
//     const allFailed = results.every(r => r.status === 'rejected');
//     if (allFailed && results.length > 0) {
//       throw new Error('All notification channels failed');
//     }
//   }
// }