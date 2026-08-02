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

export async function publishMessage(queue: string, message: object) {
  const channel = getChannel();

  await channel.assertQueue(queue, {
    durable: true,
  });

  channel.sendToQueue(
    queue,
    Buffer.from(JSON.stringify(message)),
    {
      persistent: true,
    }
  );

  console.log(`📤 Message sent to ${queue}`);

}