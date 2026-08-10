import { consumeMessage } from "@packages/rabbitmq";
import { QUEUES } from "@packages/shared-types";
import { CartService } from "../services/cart.service";

const cartService = new CartService();

export async function consumeOrderPlaced() {
  await consumeMessage(
    QUEUES.ORDER_PLACED,
    async (message: {
      orderId: string;
      userId: string;
    }) => {
      await cartService.clearCart(message.userId);

      console.log(
        `✅ Cart cleared for user ${message.userId}`
      );
    }
  );

  console.log("🛒 Order Placed Consumer Started");
}
