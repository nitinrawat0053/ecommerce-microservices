import { razorpayProvider } from "../providers/razorpay.provider";
import { PaymentMethod, PaymentStatus, EVENTS, OrderStatus } from "@packages/shared-types";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@packages/errors";
import { PaymentRepository } from "../repositories/payment.repository";
import { User } from "../models/user.model";
import { OutboxService } from "./outbox.service";
import { redisClient } from "@packages/redis";
import mongoose from "mongoose";

const paymentRepository = new PaymentRepository();
const outboxService = new OutboxService();

export class PaymentService {

  /**
   * processPayment — called by the PAYMENT_INITIATED consumer.
   *
   * Atomically:
   *   1. Creates the payment record (or reuses an existing one)
   *   2. Creates the Razorpay order
   *   3. Persists the razorpayOrderId back onto the payment record
   *
   * All three DB writes happen inside a single Mongoose session so the
   * record is never left without a razorpayOrderId.
   */
  async processPayment(
    orderId: string,
    userId: string,
    amount: number,
    paymentMethod: PaymentMethod
  ) {
    console.log(`💳 [PaymentService] processPayment called — orderId: ${orderId}, userId: ${userId}, amount: ${amount}`);

    // --- Idempotency: if a fully-initialised payment already exists, return it ---
    const existing = await paymentRepository.findByOrderId(orderId);
    if (existing?.razorpayOrderId) {
      console.log(`ℹ️  [PaymentService] Payment already exists with razorpayOrderId for order ${orderId} — skipping`);
      return existing;
    }

    // --- Step 1: Create payment record + Razorpay order + persist razorpayOrderId
    //     all inside one atomic session so a crash cannot produce an orphaned record ---
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      let payment = existing;

      if (!payment) {
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
        console.log(`✅ [PaymentService] Payment record created: ${payment.id} for order ${orderId}`);
      }

      // Create Razorpay order (external call — outside transaction commit, but
      // failure here aborts the whole session so no orphaned record is written)
      const razorpayOrder = await razorpayProvider.createOrder(
        amount,
        "INR",
        orderId
      );
      console.log(`✅ [PaymentService] Razorpay order created: ${razorpayOrder.id} for order ${orderId}`);

      // Persist razorpayOrderId within the same session — atomic with payment creation
      const updatedPayment = await paymentRepository.updateRazorpayOrderId(
        payment.id,
        razorpayOrder.id,
        session
      );

      await session.commitTransaction();
      console.log(`✅ [PaymentService] Transaction committed — payment ${payment.id} has razorpayOrderId ${razorpayOrder.id}`);

      return updatedPayment;
    } catch (error: any) {
      await session.abortTransaction();
      console.error(`❌ [PaymentService] processPayment transaction aborted for order ${orderId}: ${error.message}`, error.stack || "");
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async getPayment(paymentId: string) {
    const payment = await paymentRepository.findById(paymentId);

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    return payment;
  }

  async getOrderPayment(orderId: string) {
    console.log(`🔍 [PaymentService] Looking up payment for orderId: ${orderId}`);
    const payment = await paymentRepository.findByOrderId(orderId);

    if (!payment) {
      console.log(`⚠️  [PaymentService] Payment not found for orderId: ${orderId} (may still be processing)`);
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
    console.log(`🔍 [PaymentService] verifyPayment — razorpayOrderId: ${razorpayOrderId}, razorpayPaymentId: ${razorpayPaymentId}`);

    const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);

    if (!payment) {
      console.error(`❌ [PaymentService] Payment not found for razorpayOrderId: ${razorpayOrderId}`);
      throw new NotFoundError("Payment not found");
    }

    console.log(`📋 [PaymentService] Found payment ${payment.id} with status: ${payment.status}`);

    // SECURITY: verify user exists and is phone-verified from DB — never trust client
    const user = await User.findById(payment.userId);
    if (!user) {
      throw new UnauthorizedError("User not authenticated");
    }
    if (!user.isVerified) {
      throw new ForbiddenError(
        "Phone number not verified. Please verify your account to proceed with payment."
      );
    }

    // Idempotency: if already SUCCESS, return early without re-processing
    if (payment.status === PaymentStatus.SUCCESS) {
      console.log(`ℹ️  [PaymentService] Payment ${payment.id} already SUCCESS — returning existing`);
      return payment;
    }

    const isValid = razorpayProvider.verifyPaymentSignature(
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

      const updatedPayment = await paymentRepository.updateStatus(
        payment.id,
        PaymentStatus.SUCCESS,
        razorpayPaymentId,
        undefined,
        session,
        razorpayPaymentId
      );

      console.log(`💰 [PaymentService] Payment ${payment.id} updated to SUCCESS`);

      await outboxService.createEvent(
        EVENTS.PAYMENT_SUCCESS,
        {
          orderId: payment.orderId,
          userId: payment.userId,
          transactionId: razorpayPaymentId,
        },
        session
      );

      console.log(`📦 [PaymentService] PAYMENT_SUCCESS event written to outbox for order ${payment.orderId}`);

      await session.commitTransaction();
      console.log(`✅ [PaymentService] verifyPayment transaction committed for payment ${payment.id}`);

      return updatedPayment;
    } catch (error: any) {
      console.error(`❌ [PaymentService] verifyPayment transaction aborted:`, error.message);
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async processWebhookEvent(event: any) {
    const eventType = event.event;

    const paymentEntity = event.payload?.payment?.entity;

    if (!paymentEntity) {
      console.warn(`⚠️  [PaymentService] Webhook event missing payment entity — skipping`);
      return;
    }

    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    if (!razorpayOrderId) {
      console.warn(`⚠️  [PaymentService] Webhook event missing razorpayOrderId — skipping`);
      return;
    }

    // Redis-backed deduplication: prevent duplicate webhook deliveries from concurrently
    // processing or re-emitting outbox events. 24-hour TTL (matches provider retry window).
    const dedupKey = `webhook:processed:${eventType}:${razorpayPaymentId}`;
    let isNewEvent = false;
    try {
      const acquired = await redisClient.set(dedupKey, "1", "EX", 24 * 60 * 60, "NX");
      if (acquired === null) {
        console.log(`ℹ️  [PaymentService] Webhook duplicate event skipped (already processed): ${dedupKey}`);
        return;
      }
      isNewEvent = true;
    } catch (redisError) {
      console.warn(
        "[Payment Service] Redis webhook dedup error (falling back to DB idempotency):",
        (redisError as Error)?.message || redisError
      );
    }

    const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);

    if (!payment) {
      console.error(
        `❌ [PaymentService] Webhook: Payment not found for Razorpay order ${razorpayOrderId} — cannot update`
      );
      if (isNewEvent) {
        try {
          await redisClient.del(dedupKey);
        } catch {}
      }
      // Throw so the webhook returns a non-2xx and Razorpay retries
      throw new NotFoundError(`Payment record not found for Razorpay order ${razorpayOrderId}`);
    }

    if (eventType === "payment.captured") {
      if (payment.status === PaymentStatus.SUCCESS) {
        console.log(`ℹ️  [PaymentService] Webhook: payment.captured for already-SUCCESS payment ${payment.id} — skipping`);
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

        await session.commitTransaction();
        console.log(`✅ [PaymentService] Webhook: Payment ${payment.id} → SUCCESS, PAYMENT_SUCCESS event queued for order ${payment.orderId}`);
      } catch (error: any) {
        if (isNewEvent) {
          try {
            await redisClient.del(dedupKey);
          } catch {}
        }
        console.error(`❌ [PaymentService] Webhook payment.captured transaction failed:`, error.message);
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }

      return;
    }

    if (eventType === "payment.failed") {
      if (payment.status === PaymentStatus.SUCCESS) {
        console.log(`ℹ️  [PaymentService] Webhook: payment.failed for already-SUCCESS payment ${payment.id} — skipping`);
        return;
      }

      const session = await mongoose.startSession();

      try {
        session.startTransaction();

        await paymentRepository.updateStatus(
          payment.id,
          PaymentStatus.FAILED,
          razorpayPaymentId,
          paymentEntity.error_description || "Payment failed",
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
        console.log(`❌ [PaymentService] Webhook: Payment ${payment.id} → FAILED for order ${payment.orderId}`);
      } catch (error: any) {
        if (isNewEvent) {
          try {
            await redisClient.del(dedupKey);
          } catch {}
        }
        console.error(`❌ [PaymentService] Webhook payment.failed transaction failed:`, error.message);
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    }
  }
}
