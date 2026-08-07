import { consumeMessage } from "@packages/rabbitmq";
import { EVENTS, PaymentMethod, QUEUES } from "@packages/shared-types";
import { PaymentService } from "../services/payment.service";
import {PaymentInitiatedEvent} from "../types/payment-event";
const paymentService = new PaymentService();

export async function startPaymentConsumer() {
  await consumeMessage(
    QUEUES.PAYMENT_INITIATED,
    async (message:PaymentInitiatedEvent) => {
      console.log("💳 Payment Initiated");

      const { orderId, userId, amount, paymentMethod } = message;

      await paymentService.processPayment(
        orderId,
        userId,
        amount,
        paymentMethod as PaymentMethod
      );

      console.log("✅ Payment Processed");
    }
  );
}