import { consumeMessage } from "@packages/rabbitmq";
import { QUEUES,OrderPlacedEvent,PaymentSuccessEvent,PaymentFailedEvent } from "@packages/shared-types";
import { NotificationService } from "../services/notification.service";

const notificationService = new NotificationService();
export async function startNotificationConsumers() {
  await consumeMessage(
    QUEUES.NOTIFICATION_ORDER_PLACED,
    async (message: OrderPlacedEvent) => {
      await notificationService.handleOrderPlaced(message);
    }
  );

  await consumeMessage(
    QUEUES.NOTIFICATION_PAYMENT_SUCCESS,
    async (message: PaymentSuccessEvent) => {
      await notificationService.handlePaymentSuccess(message);
    }
  );

  await consumeMessage(
    QUEUES.NOTIFICATION_PAYMENT_FAILED,
    async (message: PaymentFailedEvent) => {
      await notificationService.handlePaymentFailed(message);
    }
  );
}