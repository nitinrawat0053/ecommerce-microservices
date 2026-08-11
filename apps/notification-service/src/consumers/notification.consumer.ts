import { getChannel, assertQueue, publishMessage } from "@packages/rabbitmq";
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

  // Setup DLQs
  await setupNotificationDLQs(channel);

  // Start consumers
  await consumeOrderPlaced(channel);
  await consumePaymentSuccess(channel);
  await consumePaymentFailed(channel);
}

async function setupNotificationDLQs(channel: Channel) {
  // ORDER PLACED DLQ
  await assertQueue(
    QUEUES.NOTIFICATION_ORDER_PLACED_DLQ
  );

  await channel.bindQueue(
    QUEUES.NOTIFICATION_ORDER_PLACED_DLQ,
    EXCHANGES.DEAD_LETTER,
    QUEUES.NOTIFICATION_ORDER_PLACED
  );

  // PAYMENT SUCCESS DLQ
  await assertQueue(
    QUEUES.NOTIFICATION_PAYMENT_SUCCESS_DLQ
  );

  await channel.bindQueue(
    QUEUES.NOTIFICATION_PAYMENT_SUCCESS_DLQ,
    EXCHANGES.DEAD_LETTER,
    QUEUES.NOTIFICATION_PAYMENT_SUCCESS
  );

  // PAYMENT FAILED DLQ
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

async function consumeOrderPlaced(channel: Channel) {
  await assertQueue(QUEUES.NOTIFICATION_ORDER_PLACED);

  console.log(
    "👂 Listening on notification-order-placed"
  );

  await channel.consume(
    QUEUES.NOTIFICATION_ORDER_PLACED,
    async (message: any) => {
      if (!message) return;

      const event: OrderPlacedEvent = JSON.parse(
        message.content.toString()
      );

      const retryCount =
        message.properties.headers?.["x-retry-count"] ?? 0;

      try {
        console.log(
          `🔔 Processing ORDER_PLACED notification (attempt ${
            retryCount + 1
          })`
        );

        await notificationService.handleOrderPlaced(event);

        channel.ack(message);

        console.log(
          "✅ ORDER_PLACED notification sent"
        );
      } catch (error) {
        console.error(
          "❌ ORDER_PLACED notification failed",
          error
        );

        if (retryCount < MAX_RETRIES) {
          await publishMessage(
            QUEUES.NOTIFICATION_ORDER_PLACED_RETRY,
            event,
            {
              "x-retry-count": retryCount + 1,
            }
          );

          channel.ack(message);

          console.log(
            `🔄 ORDER_PLACED retry ${
              retryCount + 1
            }/${MAX_RETRIES}`
          );
        } else {
          console.log(
            "💀 ORDER_PLACED notification moved to DLQ"
          );

          channel.nack(message, false, false);
        }
      }
    }
  );
}

async function consumePaymentSuccess(channel: Channel) {
  await assertQueue(QUEUES.NOTIFICATION_PAYMENT_SUCCESS);

  console.log(
    "👂 Listening on notification-payment-success"
  );

  await channel.consume(
    QUEUES.NOTIFICATION_PAYMENT_SUCCESS,
    async (message: any) => {
      if (!message) return;

      const event: PaymentSuccessEvent = JSON.parse(
        message.content.toString()
      );

      const retryCount =
        message.properties.headers?.["x-retry-count"] ?? 0;

      try {
        console.log(
          `💰 Processing PAYMENT_SUCCESS notification (attempt ${
            retryCount + 1
          })`
        );

        await notificationService.handlePaymentSuccess(event);

        channel.ack(message);

        console.log(
          "✅ PAYMENT_SUCCESS notification sent"
        );
      } catch (error) {
        console.error(
          "❌ PAYMENT_SUCCESS notification failed",
          error
        );

        if (retryCount < MAX_RETRIES) {
          await publishMessage(
            QUEUES.NOTIFICATION_PAYMENT_SUCCESS_RETRY,
            event,
            {
              "x-retry-count": retryCount + 1,
            }
          );

          channel.ack(message);

          console.log(
            `🔄 PAYMENT_SUCCESS retry ${
              retryCount + 1
            }/${MAX_RETRIES}`
          );
        } else {
          console.log(
            "💀 PAYMENT_SUCCESS notification moved to DLQ"
          );

          channel.nack(message, false, false);
        }
      }
    }
  );
}

async function consumePaymentFailed(channel: Channel) {
  await assertQueue(QUEUES.NOTIFICATION_PAYMENT_FAILED);

  console.log(
    "👂 Listening on notification-payment-failed"
  );

  await channel.consume(
    QUEUES.NOTIFICATION_PAYMENT_FAILED,
    async (message: any) => {
      if (!message) return;

      const event: PaymentFailedEvent = JSON.parse(
        message.content.toString()
      );

      const retryCount =
        message.properties.headers?.["x-retry-count"] ?? 0;

      try {
        console.log(
          `❌ Processing PAYMENT_FAILED notification (attempt ${
            retryCount + 1
          })`
        );

        await notificationService.handlePaymentFailed(event);

        channel.ack(message);

        console.log(
          "✅ PAYMENT_FAILED notification sent"
        );
      } catch (error) {
        console.error(
          "❌ PAYMENT_FAILED notification failed",
          error
        );

        if (retryCount < MAX_RETRIES) {
          await publishMessage(
            QUEUES.NOTIFICATION_PAYMENT_FAILED_RETRY,
            event,
            {
              "x-retry-count": retryCount + 1,
            }
          );

          channel.ack(message);

          console.log(
            `🔄 PAYMENT_FAILED retry ${
              retryCount + 1
            }/${MAX_RETRIES}`
          );
        } else {
          console.log(
            "💀 PAYMENT_FAILED notification moved to DLQ"
          );

          channel.nack(message, false, false);
        }
      }
    }
  );
}

// import { consumeMessage } from "@packages/rabbitmq";
// import { QUEUES,OrderPlacedEvent,PaymentSuccessEvent,PaymentFailedEvent } from "@packages/shared-types";
// import { NotificationService } from "../services/notification.service";

// const notificationService = new NotificationService();
// export async function startNotificationConsumers() {
//   await consumeMessage(
//     QUEUES.NOTIFICATION_ORDER_PLACED,
//     async (message: OrderPlacedEvent) => {
//       await notificationService.handleOrderPlaced(message);
//     }
//   );

//   await consumeMessage(
//     QUEUES.NOTIFICATION_PAYMENT_SUCCESS,
//     async (message: PaymentSuccessEvent) => {
//       await notificationService.handlePaymentSuccess(message);
//     }
//   );

//   await consumeMessage(
//     QUEUES.NOTIFICATION_PAYMENT_FAILED,
//     async (message: PaymentFailedEvent) => {
//       await notificationService.handlePaymentFailed(message);
//     }
//   );
// }