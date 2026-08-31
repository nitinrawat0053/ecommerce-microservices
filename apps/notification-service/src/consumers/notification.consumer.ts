import { getChannel, consumeMessage, assertQueue } from "@packages/rabbitmq";
import { QUEUES, EXCHANGES, OrderPlacedEvent, PaymentSuccessEvent, PaymentFailedEvent } from "@packages/shared-types";
import { Channel } from "amqplib";
import { NotificationService } from "../services/notification.service";

const notificationService = new NotificationService();

const MAX_RETRIES = 3;

export async function startNotificationConsumers() {
  const channel = getChannel();

  // Make sure Dead Letter Exchange exists
  await channel.assertExchange(
    EXCHANGES.DEAD_LETTER,
    "direct",
    {
      durable: true,
    }
  );

  // Setup DLQs and retry queues
  await setupNotificationQueues(channel);

  // Consumers (retry logic handled by the shared consumeMessage helper)
  await consumeMessage(
    QUEUES.NOTIFICATION_ORDER_PLACED,
    async (event: OrderPlacedEvent) => {
      await notificationService.handleOrderPlaced(event);
      console.log("✅ ORDER_PLACED notification sent");
    },
    {
      retryQueue: QUEUES.NOTIFICATION_ORDER_PLACED_RETRY,
      maxRetries: MAX_RETRIES,
    }
  );

  await consumeMessage(
    QUEUES.NOTIFICATION_PAYMENT_SUCCESS,
    async (event: PaymentSuccessEvent) => {
      await notificationService.handlePaymentSuccess(event);
      console.log(
        `✅ PAYMENT_SUCCESS notification sent for order ${event.orderId}`
      );
    },
    {
      retryQueue: QUEUES.NOTIFICATION_PAYMENT_SUCCESS_RETRY,
      maxRetries: MAX_RETRIES,
    }
  );

  await consumeMessage(
    QUEUES.NOTIFICATION_PAYMENT_FAILED,
    async (event: PaymentFailedEvent) => {
      await notificationService.handlePaymentFailed(event);
      console.log("✅ PAYMENT_FAILED notification sent");
    },
    {
      retryQueue: QUEUES.NOTIFICATION_PAYMENT_FAILED_RETRY,
      maxRetries: MAX_RETRIES,
    }
  );
}

async function setupNotificationQueues(channel: Channel) {
  // DLQs
  await assertQueue(
    QUEUES.NOTIFICATION_ORDER_PLACED_DLQ
  );

  await channel.bindQueue(
    QUEUES.NOTIFICATION_ORDER_PLACED_DLQ,
    EXCHANGES.DEAD_LETTER,
    QUEUES.NOTIFICATION_ORDER_PLACED
  );

  await assertQueue(
    QUEUES.NOTIFICATION_PAYMENT_SUCCESS_DLQ
  );

  await channel.bindQueue(
    QUEUES.NOTIFICATION_PAYMENT_SUCCESS_DLQ,
    EXCHANGES.DEAD_LETTER,
    QUEUES.NOTIFICATION_PAYMENT_SUCCESS
  );

  await assertQueue(
    QUEUES.NOTIFICATION_PAYMENT_FAILED_DLQ
  );

  await channel.bindQueue(
    QUEUES.NOTIFICATION_PAYMENT_FAILED_DLQ,
    EXCHANGES.DEAD_LETTER,
    QUEUES.NOTIFICATION_PAYMENT_FAILED
  );

  // Retry queues
  await assertQueue(
    QUEUES.NOTIFICATION_ORDER_PLACED_RETRY
  );

  await assertQueue(
    QUEUES.NOTIFICATION_PAYMENT_SUCCESS_RETRY
  );

  await assertQueue(
    QUEUES.NOTIFICATION_PAYMENT_FAILED_RETRY
  );
}
