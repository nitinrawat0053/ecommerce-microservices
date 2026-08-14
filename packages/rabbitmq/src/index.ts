import amqp, { Channel, ChannelModel } from "amqplib";
import { config } from "@packages/config";
import { QUEUE_CONFIG } from "./queue.config";

let connection: ChannelModel;
let channel: Channel;

export async function connectRabbitMQ() {
  let retries = 5;

  while (retries > 0) {
    try {
      console.log(
        `🔌 Connecting to RabbitMQ... (${retries} attempts left)`
      );
       console.log("RabbitMQ URL:",config.RABBITMQ_URL);

      connection = await amqp.connect(
        config.RABBITMQ_URL
      );

      channel = await connection.createChannel();

      await channel.assertExchange(
        "event-exchange",
        "direct",
       {
         durable: true,
       }
      );
      await setupEventQueues();

      await channel.assertExchange(
        "dead-letter-exchange",
        "direct",
        {
          durable: true,
        }
      );

      await setupDeadLetterQueues();

      console.log("✅ Connected to RabbitMQ");

      return;
    } catch (error) {
      retries--;

      console.error(
        "❌ RabbitMQ connection failed:",
        error
      );

      if (retries === 0) {
        throw error;
      }

      console.log(
        "⏳ Retrying RabbitMQ connection in 3 seconds..."
      );

      await new Promise((resolve) =>
        setTimeout(resolve, 3000)
      );
    }
  }
}
export function getChannel() {
  if (!channel) {
    throw new Error("RabbitMQ is not connected");
  }

  return channel;
}
export async function assertQueue(queue: string) {
  const queueConfig =
    QUEUE_CONFIG[queue as keyof typeof QUEUE_CONFIG];

  if (!queueConfig) {
    throw new Error(
      `RabbitMQ queue configuration not found: ${queue}`
    );
  }

  await channel.assertQueue(queue, {
    durable: queueConfig.durable,

    arguments: {
      ...(queueConfig.messageTtl !== undefined && {
        "x-message-ttl": queueConfig.messageTtl,
      }),

      ...(queueConfig.deadLetterExchange !== undefined && {
        "x-dead-letter-exchange":
          queueConfig.deadLetterExchange,
      }),

      ...(queueConfig.deadLetterRoutingKey && {
        "x-dead-letter-routing-key":
          queueConfig.deadLetterRoutingKey,
      }),
    },
  });
}

export async function publishMessage(
  queue: string,
  message: object,
  headers: Record<string, any> = {}
) {
  const channel = getChannel();

  await assertQueue(queue);

  channel.sendToQueue(
    queue,
    Buffer.from(JSON.stringify(message)),
    {
      persistent: true,
      headers,
    }
  );

  console.log(`📤 Message sent to ${queue}`);
}

export async function publishEvent(
  routingKey: string,
  message: object
) {
  const channel = getChannel();

  channel.publish(
    "event-exchange",
    routingKey,
    Buffer.from(JSON.stringify(message)),
    {
      persistent: true,
    }
  );

  console.log(`📤 Event published: ${routingKey}`);
}

export async function consumeMessage(
  queue: string,
  callback: (message: any) => Promise<void>,
  options?: {
    retryQueue?: string;
    maxRetries?: number;
  }
) {
  const channel = getChannel();

  await assertQueue(queue);

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    const retryCount =
      msg.properties.headers?.["x-retry-count"] ?? 0;

    try {
      const content = JSON.parse(
        msg.content.toString()
      );

      await callback(content);

      channel.ack(msg);

    } catch (error) {
      console.error(
        `❌ Error consuming ${queue}:`,
        error
      );

      // Retry if retry queue is configured
      if (
        options?.retryQueue &&
        retryCount < (options.maxRetries ?? 3)
      ) {
        const nextRetryCount = retryCount + 1;

        await publishMessage(
          options.retryQueue,
          JSON.parse(msg.content.toString()),
          {
            "x-retry-count": nextRetryCount,
          }
        );

        channel.ack(msg);

        console.log(
          `🔄 ${queue} retry ${nextRetryCount}/${options.maxRetries ?? 3}`
        );

        return;
      }

      // Maximum retries reached
      console.log(
        `💀 ${queue} failed after ${retryCount} retries. Moving to DLQ`
      );

      channel.nack(msg, false, false);
    }
  });

  console.log(`👂 Listening on ${queue}`);
}
  async function setupEventQueues() {
  const bindings = [
    {
      queue: "order-placed",
      routingKey: "order-placed",
    },
    {
      queue: "order-created",
      routingKey: "order-created",
    },
    {
      queue: "payment-success",
      routingKey: "payment-success",
    },
    {
      queue: "payment-initiated",
      routingKey: "payment-initiated",
    },
    {
      queue: "payment-failed",
      routingKey: "payment-failed",
    },
    {
      queue: "notification-payment-success",
      routingKey: "payment-success",
    },
    {
      queue: "notification-order-placed",
      routingKey: "order-placed",
    },
    {
      queue: "notification-payment-failed",
      routingKey: "payment-failed",
    },
  ];

  for (const binding of bindings) {
    await assertQueue(binding.queue);

    await channel.bindQueue(
      binding.queue,
      "event-exchange",
      binding.routingKey
    );
  }
}  

async function setupDeadLetterQueues() {
  const deadLetterExchange = "dead-letter-exchange";

  const queues = Object.keys(QUEUE_CONFIG).filter(
    (queue) =>
      !queue.endsWith("-retry") &&
      !queue.endsWith("-dlq")
  );

  for (const queue of queues) {
    const dlq = `${queue}-dlq`;

    await channel.assertQueue(dlq, {
      durable: true,
    });

    await channel.bindQueue(
      dlq,
      deadLetterExchange,
      queue
    );
  }
}
//   async function setupDeadLetterQueues() {
//   const deadLetterExchange = "dead-letter-exchange";

//   const queues = Object.keys(QUEUE_CONFIG);

//   for (const queue of queues) {
//     const dlq = `${queue}-dlq`;

//     await channel.assertQueue(dlq, {
//       durable: true,
//     });

//     await channel.bindQueue(
//       dlq,
//       deadLetterExchange,
//       queue
//     );
//   }
// }