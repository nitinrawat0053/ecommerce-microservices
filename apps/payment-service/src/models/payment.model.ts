import mongoose, { Document, Schema } from "mongoose";
import { PaymentMethod, PaymentStatus } from "@packages/shared-types";

export interface IPayment extends Document {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  razorpayOrderId?: string;
  transactionId?: string;
  failureReason?: string;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: String,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "INR",
    },

    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },

    razorpayOrderId: {
     type: String,
     index: true,
    },

    transactionId: {
      type: String,
    },

    failureReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model<IPayment>(
  "Payment",
  paymentSchema
);