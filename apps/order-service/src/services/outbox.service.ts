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
      console.log(`📦 [OrderOutbox] Processing ${events.length} pending events`);
    }

    for (const event of events) {
      try {
        const orderId = (event.payload as any).orderId;
        console.log(`📤 [OrderOutbox] Publishing ${event.eventType} for order ${orderId} (id: ${event.id})`);

        switch (event.eventType) {
          case EVENTS.ORDER_CREATED:
            await publishEvent(
              QUEUES.ORDER_CREATED,
              event.payload
            );
            break;

          case EVENTS.ORDER_PLACED:
            await publishEvent(
              QUEUES.ORDER_PLACED,
              event.payload
            );
            break;

          case EVENTS.PAYMENT_INITIATED:
            await publishEvent(
              QUEUES.PAYMENT_INITIATED,
              event.payload
            );
            break;

          default:
            console.warn(`⚠️  [OrderOutbox] Unknown event type: ${event.eventType} — skipping`);
        }

        await outboxRepository.markAsSent(event.id);
        console.log(`✅ [OrderOutbox] Event ${event.id} (${event.eventType}) published and marked SENT`);
      } catch (error: any) {
        console.error(
          `❌ [OrderOutbox] Failed to publish event ${event.id} (${event.eventType}): ${error.message}`,
          error.stack || ""
        );
        // Do NOT rethrow — keep processing remaining events; this one stays PENDING
        // and will be retried on the next polling cycle
      }
    }
  }
}
