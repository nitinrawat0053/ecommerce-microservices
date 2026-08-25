import { ClientSession } from "mongoose";
import { OutboxRepository } from "../repositories/outbox.repository";
import { publishEvent } from "@packages/rabbitmq";
import { QUEUES, EVENTS } from "@packages/shared-types";

const outboxRepository = new OutboxRepository();

export class OutboxService {
  async createEvent(
    eventType: string,
    payload: object,
    session: ClientSession
  ) {
    return outboxRepository.create(
      {
        eventType,
        payload,
        status: "PENDING",
      },
      session
    );
  }

  async getPendingEvents() {
    return outboxRepository.findPending();
  }

  async markEventAsSent(id: string) {
    return outboxRepository.markAsSent(id);
  }

  async processPendingEvents() {
  const events = await outboxRepository.findPending();
  if (events.length > 0) {
    console.log(`📦 [PaymentOutbox] Processing ${events.length} pending events`);
  }

  for (const event of events) {
    try {
      const orderId = (event.payload as any).orderId;
      console.log(`📤 [PaymentOutbox] Processing event ${event.eventType} for order ${orderId} (id: ${event.id})`);
      
      switch (event.eventType) {
        case EVENTS.PAYMENT_SUCCESS:
          console.log(`📤 [PaymentOutbox] Publishing PAYMENT_SUCCESS event for order ${orderId}`);
          await publishEvent(
            QUEUES.PAYMENT_SUCCESS,
            event.payload
          );
          console.log(`✅ [PaymentOutbox] PAYMENT_SUCCESS event published for order ${orderId}`);
          break;

        case EVENTS.PAYMENT_FAILED:
          console.log(`📤 [PaymentOutbox] Publishing PAYMENT_FAILED event for order ${orderId}`);
          await publishEvent(
            QUEUES.PAYMENT_FAILED,
            event.payload
          );
          console.log(`✅ [PaymentOutbox] PAYMENT_FAILED event published for order ${orderId}`);
          break;

        case EVENTS.ORDER_PLACED:
          console.log(`📤 [PaymentOutbox] Publishing ORDER_PLACED event for order ${orderId}`);
          await publishEvent(
            QUEUES.ORDER_PLACED,
            event.payload
          );
          console.log(`✅ [PaymentOutbox] ORDER_PLACED event published for order ${orderId}`);
          break;

        default:
          console.log(`⚠️ [PaymentOutbox] Unknown event type: ${event.eventType}`);
      }

      await outboxRepository.markAsSent(event.id);
      console.log(`✅ [PaymentOutbox] Event ${event.id} marked as sent`);
    } catch (error: any) {
      console.error(
        `❌ [PaymentOutbox] Failed to publish outbox event ${event.id}: ${error.message}`,
        error.stack || ''
      );
    }
  }
 }
}