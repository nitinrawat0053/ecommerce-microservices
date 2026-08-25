import { consumeMessage } from "@packages/rabbitmq";
import { QUEUES, PaymentStatus, OrderStatus } from "@packages/shared-types";
import { OrderRepository } from "../repositories/order.repository";

const orderRepository = new OrderRepository();

export async function startPaymentConsumer() {
  console.log("👂 [OrderService] Starting payment consumer...");

  await consumeMessage(
    QUEUES.PAYMENT_SUCCESS,
    async (message: {
      orderId: string;
      userId: string;
      transactionId: string;
    }) => {
      console.log(`💰 [OrderService] PAYMENT_SUCCESS received for order ${message.orderId}, userId: ${message.userId}, transactionId: ${message.transactionId}`);

      try {
        const updated = await orderRepository.update(message.orderId,
          {
            status: OrderStatus.CONFIRMED,
          }
        );

        if (updated) {
          console.log(`✅ [OrderService] Order ${message.orderId} updated to CONFIRMED. New status: ${updated.status}`);
        } else {
          console.error(`❌ [OrderService] Order ${message.orderId} not found or update failed - returning null`);
        }
      } catch (error: any) {
        console.error(`❌ [OrderService] Failed to update order ${message.orderId}:`, error.message);
        throw error; // Re-throw so retry mechanism works
      }
    }
  );

  await consumeMessage(
    QUEUES.PAYMENT_FAILED,
    async (message: {
      orderId: string;
      userId: string;
    }) => {
      console.log(`❌ [OrderService] PAYMENT_FAILED received for order ${message.orderId}`);

      const updated = await orderRepository.update(
        message.orderId,
        {
          status: OrderStatus.CANCELLED,
        }
      );

      if (updated) {
        console.log(`❌ [OrderService] Order ${message.orderId} updated to CANCELLED`);
      } else {
        console.error(`❌ [OrderService] Order ${message.orderId} not found or update failed`);
      }
    }
  );
}