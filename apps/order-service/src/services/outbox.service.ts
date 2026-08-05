import { ClientSession } from "mongoose";
import { OutboxRepository } from "../repositories/outbox.repository";
import { publishMessage } from "@packages/rabbitmq";
import { QUEUES } from "@packages/shared-types";

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

  for (const event of events) {
    try {
      switch (event.eventType) {
        case "ORDER_CREATED":
          await publishMessage(
            QUEUES.ORDER_CREATED,
            event.payload
          );
          break;
      }

      await outboxRepository.markAsSent(
        event.id
      );
    } catch (error) {
      console.error(
        "Failed to publish outbox event",
        error
      );
    }
  }
 }
}