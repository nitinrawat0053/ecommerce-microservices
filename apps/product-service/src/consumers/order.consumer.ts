import { getChannel, publishMessage } from "@packages/rabbitmq";
import { ProductService } from "../services/product.service";
import { QUEUES, EXCHANGES } from "@packages/shared-types";
import { isTemporaryError } from "@packages/errors";

const productService = new ProductService();

export async function consumeOrderCreated() {
  const channel = getChannel();

  // Dead Letter Exchange
  await channel.assertExchange(EXCHANGES.DEAD_LETTER, "direct", {
    durable: true,
  });

  // Retry Exchange (will be used later)
  await channel.assertExchange(EXCHANGES.RETRY, "direct", {
    durable: true,
  });

  // Dead Letter Queue
  await channel.assertQueue(QUEUES.ORDER_CREATED_DLQ, {
    durable: true,
  });

  // Retry Queue
  await channel.assertQueue(QUEUES.ORDER_CREATED_RETRY, {
    durable: true,
    messageTtl: 5000,
    deadLetterExchange: "",
    deadLetterRoutingKey: QUEUES.ORDER_CREATED,
  });

  // Bind DLQ
  await channel.bindQueue(
    QUEUES.ORDER_CREATED_DLQ,
    EXCHANGES.DEAD_LETTER,
    QUEUES.ORDER_CREATED
  );

  // Original Queue
  await channel.assertQueue(QUEUES.ORDER_CREATED, {
    durable: true,
    deadLetterExchange: EXCHANGES.DEAD_LETTER,
    deadLetterRoutingKey: QUEUES.ORDER_CREATED,
  });

  console.log("👂 Order Consumer Started");

  channel.consume(QUEUES.ORDER_CREATED, async (message) => {
    if (!message) return;

    console.log("📩 Message Received");

    const payload = JSON.parse(message.content.toString());
    const retryCount =
    message.properties.headers?.["x-retry-count"] ?? 0;

    try {
      const { productId, quantity } = payload;

      await productService.reduceStock(productId, quantity);

      channel.ack(message);

      console.log("✅ Order processed");
    } catch (error) {
      console.error(error);

      if (isTemporaryError(error) && retryCount < 3) {
        payload.retryCount = retryCount + 1;

        await publishMessage(
          QUEUES.ORDER_CREATED_RETRY,
          payload,
          {
           "x-retry-count": retryCount + 1,
          }
        );

        channel.ack(message);

        console.log(
          `🔄 Retry ${payload.retryCount}/3`
        );
      } else {
        console.log("💀 Message moved to DLQ");

        channel.nack(message, false, false);
      }
    }
  });
}