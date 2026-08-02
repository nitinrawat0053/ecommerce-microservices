import { getChannel } from "@packages/rabbitmq";
import { ProductService } from "../services/product.service";

const productService = new ProductService();

export async function consumeOrderCreated() {
    const channel = getChannel();
    await channel.assertQueue("order-created", {
    durable: true,
});
    channel.consume("order-created", async (message) => {
    if (!message) {
    return;
}
 try {
      const { productId, quantity } = JSON.parse(
        message.content.toString()
      );

      await productService.reduceStock(productId, quantity);

      channel.ack(message);

      console.log("✅ Order processed");
    } catch (error) {
       console.error("❌ Failed to process order", error);
       channel.nack(message, false, false);
    }
  });
}