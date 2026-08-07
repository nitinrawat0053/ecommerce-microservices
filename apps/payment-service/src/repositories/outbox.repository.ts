import { ClientSession } from "mongoose";
import { OutboxModel, IOutbox } from "../models/outbox.model";

export class OutboxRepository {
  async create(
    data: Partial<IOutbox>,
    session: ClientSession
  ) {
    const [event] = await OutboxModel.create([data], {
      session,
    });

    return event;
  }

  async findPending() {
    return OutboxModel.find({
      status: "PENDING",
    });
  }

  async markAsSent(id: string) {
    return OutboxModel.findByIdAndUpdate(
      id,
      {
        status: "SENT",
      },
      {
        returnDocument: "after",
      }
    );
  }
}