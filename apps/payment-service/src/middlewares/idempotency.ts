import type { Request, Response, NextFunction } from "express";
import { redisClient } from "@packages/redis";

/**
 * Payment-verification in-flight concurrency lock.
 *
 * Prevents concurrent requests for the same `razorpayOrderId` from racing.
 * A short 10-second in-flight lock is acquired. While a verification is in flight,
 * concurrent duplicate calls are rejected with 409 Conflict.
 *
 * Once the initial verification finishes, the in-flight lock is released.
 * If the user subsequently retries or refreshes the page, the request passes through
 * to `paymentService.verifyPayment`, which gracefully returns the already-SUCCESS payment (200 OK)
 * without re-triggering outbox events or throwing an error.
 */
const IN_FLIGHT_LOCK_TTL_SECONDS = 10;

export const paymentVerifyIdempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { razorpayOrderId } = req.body ?? {};

  if (!razorpayOrderId) {
    // Missing required field — let controller/schema validation handle it
    next();
    return;
  }

  const inFlightLockKey = `lock:payment_verify:${razorpayOrderId}`;

  try {
    const acquired = await redisClient.set(
      inFlightLockKey,
      "1",
      "EX",
      IN_FLIGHT_LOCK_TTL_SECONDS,
      "NX"
    );

    if (acquired === null) {
      res.status(409).json({
        success: false,
        message:
          "Payment verification is already in progress for this order. Please wait a moment.",
      });
      return;
    }

    res.on("finish", async () => {
      try {
        await redisClient.del(inFlightLockKey);
      } catch {
        // ignore cleanup error
      }
    });

    next();
  } catch (error) {
    console.error(
      "[Payment Service] Payment verify lock error:",
      (error as Error)?.message || error
    );
    next();
  }
};
