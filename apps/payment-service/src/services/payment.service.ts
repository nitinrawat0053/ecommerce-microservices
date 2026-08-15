import { razorpayProvider } from "../providers/razorpay.provider";
import { PaymentMethod, PaymentStatus, QUEUES, EVENTS } from "@packages/shared-types";
import { NotFoundError } from "@packages/errors";
import { PaymentRepository } from "../repositories/payment.repository";
import { OutboxService } from "./outbox.service";
import mongoose from "mongoose";
import crypto from "crypto"; // will be removed
import { config } from "@packages/config"; // will be removed

const paymentRepository = new PaymentRepository();
const outboxService = new OutboxService();
export class PaymentService {
   
async processPayment(
  orderId: string,
  userId: string,
  amount: number,
  paymentMethod: PaymentMethod
) {
  let payment = await paymentRepository.findByOrderId(orderId);

  // Payment already exists and Razorpay order was already created
  if (payment?.razorpayOrderId) {
    return payment;
  }

  // Create our payment record if it doesn't exist
  if (!payment) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      payment = await paymentRepository.create(
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

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Create Razorpay order
  const razorpayOrder = await razorpayProvider.createOrder(
    amount,
    "INR",
    orderId
  );

  // Save Razorpay order ID will be uncommented
  // const updatedPayment =
  //   await paymentRepository.updateRazorpayOrderId(
  //     payment.id,
  //     razorpayOrder.id
  //   );

  // return updatedPayment;
  const updatedPayment =
  await paymentRepository.updateRazorpayOrderId(
    payment.id,
    razorpayOrder.id
  );

if (config.LOAD_TEST) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const mockPaymentId = `pay_mock_${crypto.randomUUID()}`;

    const successfulPayment =
      await paymentRepository.updateStatus(
        payment.id,
        PaymentStatus.SUCCESS,
        mockPaymentId,
        undefined,
        session
      );

    await outboxService.createEvent(
      EVENTS.PAYMENT_SUCCESS,
      {
        orderId,
        userId,
        transactionId: mockPaymentId,
      },
      session
    );

    await session.commitTransaction();

    console.log("🧪 MOCK PAYMENT SUCCESS");

    return successfulPayment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

return updatedPayment;
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

  async verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  if (payment.status === PaymentStatus.SUCCESS) {
    return payment;
  }

  const isValid =
    razorpayProvider.verifyPaymentSignature(
      payment.razorpayOrderId!,
      razorpayPaymentId,
      razorpaySignature
    );

  if (!isValid) {
    throw new Error("Invalid payment signature");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const updatedPayment =
      await paymentRepository.updateStatus(
        payment.id,
        PaymentStatus.SUCCESS,
        razorpayPaymentId,
        undefined,
        session
      );

    await outboxService.createEvent(
      EVENTS.PAYMENT_SUCCESS,
      {
        orderId: payment.orderId,
        userId: payment.userId,
        transactionId: razorpayPaymentId,
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
  async processWebhookEvent(event: any) {
  const eventType = event.event;

  const paymentEntity =
    event.payload?.payment?.entity;

  if (!paymentEntity) {
    return;
  }

  const razorpayOrderId = paymentEntity.order_id;
  const razorpayPaymentId = paymentEntity.id;

  if (!razorpayOrderId) {
    return;
  }

  const payment =
    await paymentRepository.findByRazorpayOrderId(
      razorpayOrderId
    );

  if (!payment) {
    console.error(
      `Payment not found for Razorpay order ${razorpayOrderId}`
    );
    return;
  }

  if (eventType === "payment.captured") {
    if (payment.status === PaymentStatus.SUCCESS) {
      return;
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      await paymentRepository.updateStatus(
        payment.id,
        PaymentStatus.SUCCESS,
        razorpayPaymentId,
        undefined,
        session
      );

      await outboxService.createEvent(
        EVENTS.PAYMENT_SUCCESS,
        {
          orderId: payment.orderId,
          userId: payment.userId,
          transactionId: razorpayPaymentId,
        },
        session
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    return;
  }

  if (eventType === "payment.failed") {
    if (payment.status === PaymentStatus.SUCCESS) {
      return;
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      await paymentRepository.updateStatus(
        payment.id,
        PaymentStatus.FAILED,
        razorpayPaymentId,
        paymentEntity.error_description ||
          "Payment failed",
        session
      );

      await outboxService.createEvent(
        EVENTS.PAYMENT_FAILED,
        {
          orderId: payment.orderId,
          userId: payment.userId,
        },
        session
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
}