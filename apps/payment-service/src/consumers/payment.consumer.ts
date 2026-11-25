import { consumeMessage } from "@packages/rabbitmq";
import { PaymentMethod, QUEUES } from "@packages/shared-types";
import { PaymentService } from "../services/payment.service";
import { PaymentInitiatedEvent } from "../types/payment-event";

const paymentService = new PaymentService();

export async function startPaymentConsumer() {
  await consumeMessage(
    QUEUES.PAYMENT_INITIATED,
    async (message: PaymentInitiatedEvent) => {
      const { orderId, userId, amount, paymentMethod } = message;
      console.log(`💳 [PaymentConsumer] PAYMENT_INITIATED received — orderId: ${orderId}, userId: ${userId}, amount: ${amount}, method: ${paymentMethod}`);

      try {
        await paymentService.processPayment(
          orderId,
          userId,
          amount,
          paymentMethod as PaymentMethod
        );
        console.log(`✅ [PaymentConsumer] processPayment completed for order ${orderId}`);
      } catch (error: any) {
        console.error(`❌ [PaymentConsumer] processPayment failed for order ${orderId}: ${error.message}`, error.stack || "");
        // Re-throw so the retry/DLQ mechanism in consumeMessage handles it
        throw error;
      }
    },
    {
      retryQueue: QUEUES.PAYMENT_INITIATED_RETRY,
      maxRetries: 3,
    }
  );
}
