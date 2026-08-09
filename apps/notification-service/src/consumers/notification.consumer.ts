import { consumeMessage } from "@packages/rabbitmq";
import {
  QUEUES,
  OrderPlacedEvent,
  PaymentSuccessEvent,
  PaymentFailedEvent,
} from "@packages/shared-types";

export async function startNotificationConsumers() {
  await consumeMessage(
    QUEUES.ORDER_PLACED,
    async (message: OrderPlacedEvent) => {
      console.log("📦 Order Placed Notification Event");
      console.log("Order ID:", message.orderId);
      console.log("User ID:", message.userId);
    }
  );

  await consumeMessage(
    QUEUES.PAYMENT_SUCCESS,
    async (message: PaymentSuccessEvent) => {
      console.log("💰 Payment Success Notification Event");
      console.log("Order ID:", message.orderId);
      console.log("User ID:", message.userId);
      console.log("Transaction ID:", message.transactionId);
    }
  );

  await consumeMessage(
    QUEUES.PAYMENT_FAILED,
    async (message: PaymentFailedEvent) => {
      console.log("❌ Payment Failed Notification Event");
      console.log("Order ID:", message.orderId);
      console.log("User ID:", message.userId);
    }
  );
}