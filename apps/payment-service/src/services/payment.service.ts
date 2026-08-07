import crypto from "crypto";
import { PaymentMethod, PaymentStatus, QUEUES, EVENTS } from "@packages/shared-types";
import { publishMessage } from "@packages/rabbitmq";
import { ConflictError, NotFoundError } from "@packages/errors";
import { PaymentRepository } from "../repositories/payment.repository";
import { OutboxService } from "./outbox.service";
import mongoose from "mongoose";

const paymentRepository = new PaymentRepository();
const outboxService = new OutboxService();
export class PaymentService {
   
   async processPayment(
  orderId: string,
  userId: string,
  amount: number,
  paymentMethod: PaymentMethod
) {
  const existingPayment =
    await paymentRepository.findByOrderId(orderId);

  if (existingPayment) {
    return existingPayment;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Create Pending Payment
    const payment = await paymentRepository.create(
      {
        orderId,
        userId,
        amount,
        currency: "INR",
        paymentMethod,
        status: PaymentStatus.PENDING,
      },
      session
    );

    // Fake Gateway
    const paymentSuccessful = true;

    if (paymentSuccessful) {
      const transactionId = crypto.randomUUID();

      const updatedPayment =
        await paymentRepository.updateStatus(
          payment.id,
          PaymentStatus.SUCCESS,
          transactionId,
          undefined,
          session
        );

      await outboxService.createEvent(
        EVENTS.PAYMENT_SUCCESS,
        {
          orderId,
          transactionId,
        },
        session
      );

      await session.commitTransaction();

      return updatedPayment;
    }

    const updatedPayment =
      await paymentRepository.updateStatus(
        payment.id,
        PaymentStatus.FAILED,
        undefined,
        "Payment Failed",
        session
      );

    await outboxService.createEvent(
      EVENTS.PAYMENT_FAILED,
      {
        orderId,
      },
      session
    );

    await session.commitTransaction();

    return updatedPayment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

  async getPayment(paymentId: string) {
    const payment =
      await paymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    return payment;
  }

  async getOrderPayment(orderId: string) {
    const payment =
      await paymentRepository.findByOrderId(orderId);

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    return payment;
  }

  async getUserPayments(userId: string) {
    return paymentRepository.findByUserId(userId);
  }
}