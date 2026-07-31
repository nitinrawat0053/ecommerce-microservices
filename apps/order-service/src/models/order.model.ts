import mongoose, { Schema, Document } from "mongoose";
import { OrderStatus } from "@packages/shared-types";

export interface IOrder extends Document {
  userId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  totalAmount: number;
  status: OrderStatus;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: String,
      required: true,
    },

    productId: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    priceAtPurchase: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
  },
  {
    timestamps: true,
  }
);
orderSchema.index({ userId: 1 });
orderSchema.index({ productId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrder>(
  "Order",
  orderSchema
);