import { razorpayProvider } from "../providers/razorpay.provider";
import { PaymentMethod, PaymentStatus, QUEUES, EVENTS, OrderStatus } from "@packages/shared-types";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@packages/errors";
import { PaymentRepository } from "../repositories/payment.repository";
import { User } from "../models/user.model";
import { OutboxService } from "./outbox.service";
import mongoose from "mongoose";
import crypto from "crypto"; // will be removed
import { config } from "@packages/config"; // will be removed
import axios from "axios";

const paymentRepository = new PaymentRepository();
const outboxService = new OutboxService();

// Helper: directly confirm order via HTTP with retry
async function confirmOrderDirectly(orderId: string, userId: string): Promise<void> {
  const orderServiceUrl = config.ORDER_SERVICE_URL || `http://localhost:${config.ORDER_SERVICE_PORT}`;
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔗 [PaymentService] Confirming order ${orderId} via Order Service at ${orderServiceUrl} (attempt ${attempt}/${maxRetries})`);
      const response = await axios.put(
        `${orderServiceUrl}/api/orders/${orderId}`,
        { status: OrderStatus.CONFIRMED },
        {
          timeout: 10000,
          headers: {
            "x-user-id": userId,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`✅ [PaymentService] Order ${orderId} confirmed successfully via HTTP (attempt ${attempt})`);
      return; // Success - exit
    } catch (error: any) {
      console.error(`❌ [PaymentService] Confirm order ${orderId} attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff: 1s, 2s)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }
  console.error(`❌ [PaymentService] All ${maxRetries} attempts to confirm order ${orderId} failed. Outbox event will handle it.`);
}

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
        session,
        mockPaymentId
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

    await outboxService.createEvent(
      EVENTS.ORDER_PLACED,
      {
        orderId,
        userId,
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
    console.log(`🔍 [PaymentService] Looking up payment for orderId: ${orderId}`);
    const payment =
      await paymentRepository.findByOrderId(orderId);

    if (!payment) {
      console.log(`⚠️ [PaymentService] Payment not found for orderId: ${orderId} (may still be processing)`);
      return null;
    }

    console.log(`✅ [PaymentService] Found payment ${payment.id} for orderId: ${orderId}, status: ${payment.status}`);
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
  console.log(`🔍 [PaymentService] verifyPayment called - razorpayOrderId: ${razorpayOrderId}, razorpayPaymentId: ${razorpayPaymentId}`);
  
  const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);

  if (!payment) {
    console.error(`❌ [PaymentService] Payment not found for razorpayOrderId: ${razorpayOrderId}`);
    throw new NotFoundError("Payment not found");
  }

  console.log(`📋 [PaymentService] Found payment ${payment.id} with status: ${payment.status}`);

  // SECURITY: finalizing a payment requires an authenticated AND phone-verified
  // user. Resolve verification from the database, never from the client.
  const user = await User.findById(payment.userId);
  if (!user) {
    throw new UnauthorizedError("User not authenticated");
  }
  if (!user.isVerified) {
    throw new ForbiddenError("Phone number not verified. Please verify your account to proceed with payment.");
  }

  if (payment.status === PaymentStatus.SUCCESS) {
    console.log(`ℹ️ [PaymentService] Payment already SUCCESS, returning existing payment`);
    return payment;
  }

  const isValid =
    razorpayProvider.verifyPaymentSignature(
      payment.razorpayOrderId!,
      razorpayPaymentId,
      razorpaySignature
    );

  if (!isValid) {
    console.error(`❌ [PaymentService] Invalid payment signature for payment ${payment.id}`);
    throw new Error("Invalid payment signature");
  }

  console.log(`✅ [PaymentService] Signature verified for payment ${payment.id}`);

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const updatedPayment =
      await paymentRepository.updateStatus(
        payment.id,
        PaymentStatus.SUCCESS,
        razorpayPaymentId,
        undefined,
        session,
        razorpayPaymentId
      );

    console.log(`💰 [PaymentService] Payment ${payment.id} updated to SUCCESS in DB`);

    await outboxService.createEvent(
      EVENTS.PAYMENT_SUCCESS,
      {
        orderId: payment.orderId,
        userId: payment.userId,
        transactionId: razorpayPaymentId,
      },
      session
    );

    console.log(`📦 [PaymentService] PAYMENT_SUCCESS event created in outbox for order ${payment.orderId}`);

    await outboxService.createEvent(
      EVENTS.ORDER_PLACED,
      {
        orderId: payment.orderId,
        userId: payment.userId,
      },
      session
    );

    console.log(`📦 [PaymentService] ORDER_PLACED event created in outbox for order ${payment.orderId}`);

    await session.commitTransaction();
    console.log(`✅ [PaymentService] Transaction committed. Payment ${payment.id} verified successfully.`);

    // Fire-and-forget: confirm order via HTTP in background (belt) - outbox is suspenders
    console.log(`🔗 [PaymentService] Starting background confirmOrderDirectly for order ${payment.orderId}`);
    confirmOrderDirectly(payment.orderId, payment.userId).catch((err) =>
      console.error(`❌ [PaymentService] Background confirmOrderDirectly failed:`, err.message)
    );

    return updatedPayment;
  } catch (error) {
    console.error(`❌ [PaymentService] verifyPayment transaction failed:`, error);
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
        session,
        razorpayPaymentId
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

      await outboxService.createEvent(
        EVENTS.ORDER_PLACED,
        {
          orderId: payment.orderId,
          userId: payment.userId,
        },
        session
      );

      await session.commitTransaction();
      console.log(`✅ [PaymentService] Webhook: Payment ${payment.id} updated to SUCCESS`);

      // Fire-and-forget: confirm order via HTTP in background (don't block webhook response)
      confirmOrderDirectly(payment.orderId, payment.userId).catch((err) =>
        console.error(`❌ [PaymentService] Background confirmOrderDirectly (webhook) failed:`, err.message)
      );
    } catch (error) {
      console.error(`❌ [PaymentService] Webhook payment.captured failed:`, error);
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
        session,
        razorpayPaymentId
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