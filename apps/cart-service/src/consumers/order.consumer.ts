import { getChannel } from "@packages/rabbitmq";
import { QUEUES } from "@packages/shared-types";
import { CartService } from "../services/cart.service";

const cartService = new CartService();

export async function consumeOrderPlaced() {
  const channel = getChannel();

  await channel.assertQueue(QUEUES.ORDER_PLACED, {
    durable: true,
  });

  console.log("🛒 Order Placed Consumer Started");

  channel.consume(QUEUES.ORDER_PLACED, async (message) => {
    if (!message) return;

    try {
      const { userId } = JSON.parse(message.content.toString());

      await cartService.clearCart(userId);

      channel.ack(message);

      console.log(`✅ Cart cleared for user ${userId}`);
    } catch (error) {
      console.error("❌ Failed to clear cart", error);

      channel.nack(message, false, false);
    }
  });
}