import { consumeMessage } from "@packages/rabbitmq";
import { QUEUES, PaymentStatus, OrderStatus } from "@packages/shared-types";
import { OrderRepository } from "../repositories/order.repository";

const orderRepository = new OrderRepository();

export async function startPaymentConsumer() {
  await consumeMessage(
    QUEUES.PAYMENT_SUCCESS,
    async (message: {
      orderId: string;
      transactionId: string;
    }) => {
      console.log("💰 Payment Successful");

      await orderRepository.update( message.orderId,
        {
          status: OrderStatus.CONFIRMED,
        }
      );

      console.log("✅ Order marked as PAID");
    }
  );

  await consumeMessage(
    QUEUES.PAYMENT_FAILED,
    async (message: {
      orderId: string;
    }) => {
      console.log("❌ Payment Failed");

      await orderRepository.update(
        message.orderId,
        {
          status: OrderStatus.CANCELLED,
        }
      );

      console.log("❌ Order marked as FAILED");
    }
  );
}