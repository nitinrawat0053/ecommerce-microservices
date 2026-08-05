import { OutboxService } from "../services/outbox.service";

const outboxService = new OutboxService();

export function startOutboxWorker() {
  setInterval(async () => {
    await outboxService.processPendingEvents();
  }, 5000);
}