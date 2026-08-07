import { Payment, IPayment } from "../models/payment.model";
import { PaymentStatus } from "@packages/shared-types";
import { ClientSession } from "mongoose";

export class PaymentRepository {
  async create(
  paymentData: Partial<IPayment>,
  session: ClientSession
) {
  const [payment] = await Payment.create(
    [paymentData],
    { session }
  );

  return payment;
}

  async findById(paymentId: string) {
    return await Payment.findById(paymentId);
  }

  async findByOrderId(orderId: string) {
    return await Payment.findOne({ orderId });
  }

  async findByUserId(userId: string) {
    return await Payment.find({ userId }).sort({
      createdAt: -1,
    });
  }

  async updateStatus(
  paymentId: string,
  status: PaymentStatus,
  transactionId: string | undefined,
  failureReason: string | undefined,
  session: ClientSession
  ) {
    return await Payment.findByIdAndUpdate(
      paymentId,
      {
        status,
        transactionId,
        failureReason,
      },
      {
        session,
        returnDocument: "after",
      }
    );
  }
}