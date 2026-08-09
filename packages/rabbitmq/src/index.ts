import amqp, { Channel, ChannelModel } from "amqplib";
import { config } from "@packages/config";
import { QUEUE_CONFIG } from "./queue.config";

let connection: ChannelModel;
let channel: Channel;

// export async function connectRabbitMQ() {
//   connection = await amqp.connect(config.RABBITMQ_URL);

//   channel = await connection.createChannel();

//   await channel.assertExchange(
//     "dead-letter-exchange",
//     "direct",
//     {
//       durable: true,
//     }
//   );
//   await setupDeadLetterQueues();

//   console.log("✅ Connected to RabbitMQ");
// }
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
async function assertQueue(queue: string) {
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
      "x-dead-letter-exchange":
        queueConfig.deadLetterExchange,
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
export async function consumeMessage(
  queue: string,
  callback: (message: any) => Promise<void>
) {
  const channel = getChannel();

  await assertQueue(queue);

  channel.consume(queue, async (msg) => {
    if (!msg) return;

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

      channel.nack(msg, false, false);
    }
  });

  console.log(`👂 Listening on ${queue}`);
}

  async function setupDeadLetterQueues() {
  const deadLetterExchange = "dead-letter-exchange";

  const queues = Object.keys(QUEUE_CONFIG);

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