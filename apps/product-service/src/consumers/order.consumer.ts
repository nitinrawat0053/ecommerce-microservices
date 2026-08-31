import { consumeMessage } from "@packages/rabbitmq";
import { ProductService } from "../services/product.service";
import { QUEUES } from "@packages/shared-types";
import { isTemporaryError } from "@packages/errors";

const productService = new ProductService();

export async function consumeOrderCreated() {
  await consumeMessage(
    QUEUES.ORDER_CREATED,
    async (payload: any) => {
      const { productId, quantity } = payload;

      await productService.reduceStock(productId, quantity);

      console.log("✅ Order processed");
    },
    {
      retryQueue: QUEUES.ORDER_CREATED_RETRY,
      maxRetries: 3,
      // Only retry transient failures; permanent ones go straight to the DLQ.
      shouldRetry: isTemporaryError,
    }
  );

  console.log("👂 Order Consumer Started");
}
