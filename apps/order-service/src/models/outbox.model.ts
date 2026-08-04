import mongoose, { Schema, Document } from "mongoose";

export interface IOutbox extends Document {
  eventType: string;
  payload: object;
  status: "PENDING" | "SENT";
}

const outboxSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

export const OutboxModel = mongoose.model<IOutbox>(
  "Outbox",
  outboxSchema
);