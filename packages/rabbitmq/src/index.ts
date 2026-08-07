import amqp, { Channel, ChannelModel  } from "amqplib";
import { config } from "@packages/config";

let connection: ChannelModel;
let channel: Channel;

export async function connectRabbitMQ() {
  connection = await amqp.connect(config.RABBITMQ_URL);

  channel = await connection.createChannel();

  console.log("✅ Connected to RabbitMQ");
}

export function getChannel() {
  if (!channel) {
    throw new Error("RabbitMQ is not connected");
  }

  return channel;
}

export async function publishMessage(queue: string, message: object,  headers: Record<string, any> = {}) {
  const channel = getChannel();

  await channel.assertQueue(queue, {
    durable: true,
  });

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

  await channel.assertQueue(queue, {
    durable: true,
  });

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const content = JSON.parse(msg.content.toString());

      await callback(content);

      channel.ack(msg);
    } catch (error) {
      console.error(`❌ Error consuming ${queue}:`, error);

      channel.nack(msg, false, false);
    }
  });

  console.log(`👂 Listening on ${queue}`);
}