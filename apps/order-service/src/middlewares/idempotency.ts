import type { Request, Response, NextFunction } from "express";
import { redisClient } from "@packages/redis";

/**
 * Order-creation idempotency and concurrency guard.
 *
 * Provides two levels of protection:
 *
 * 1. Persistent Idempotency-Key (24-hour window):
 *    Clients can send an `Idempotency-Key` header (e.g. UUID).
 *    Subsequent requests with the same key for the same user are rejected with 409 Conflict.
 *
 * 2. In-Flight Concurrency Lock (5-second window):
 *    Even if the client does not send an Idempotency-Key, rapid accidental double-clicks
 *    or concurrent requests for the same user are prevented.
 *    Only one order creation per user can be in flight at any given millisecond.
 *    The lock is automatically released as soon as the response finishes.
 *
 * Fail-Open on Redis Errors:
 *    If Redis is unavailable, requests pass through so legitimate checkouts are
 *    never completely blocked by a cache outage.
 */
const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const IN_FLIGHT_LOCK_TTL_SECONDS = 5; // 5 seconds safety timeout

export const orderIdempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const rawUserId =
    (req.headers["x-user-id"] as string | undefined)?.trim() || "anonymous";
  const idempotencyKey =
    (req.headers["idempotency-key"] as string | undefined)?.trim();

  // 1. Persistent Idempotency-Key check
  if (idempotencyKey) {
    if (idempotencyKey.length > 128 || !/^[\w\-]+$/.test(idempotencyKey)) {
      res.status(400).json({
        success: false,
        message:
          "Invalid Idempotency-Key format. Use an alphanumeric identifier or UUID.",
      });
      return;
    }

    const dedupKey = `idempotency:order_create:${rawUserId}:${idempotencyKey}`;
    try {
      const acquired = await redisClient.set(
        dedupKey,
        "1",
        "EX",
        IDEMPOTENCY_TTL_SECONDS,
        "NX"
      );

      if (acquired === null) {
        res.status(409).json({
          success: false,
          message:
            "Duplicate order request detected. An order with this Idempotency-Key has already been submitted.",
        });
        return;
      }
    } catch (error) {
      console.error(
        "[Order Service] Idempotency Redis check error:",
        (error as Error)?.message || error
      );
    }
  }

  // 2. In-flight concurrency lock per user
  if (rawUserId !== "anonymous") {
    const inFlightLockKey = `lock:order_create:${rawUserId}`;
    try {
      const lockAcquired = await redisClient.set(
        inFlightLockKey,
        "1",
        "EX",
        IN_FLIGHT_LOCK_TTL_SECONDS,
        "NX"
      );

      if (lockAcquired === null) {
        res.status(409).json({
          success: false,
          message:
            "An order is already being processed for your account. Please wait a moment.",
        });
        return;
      }

      // Automatically release lock when response finishes
      res.on("finish", async () => {
        try {
          await redisClient.del(inFlightLockKey);
        } catch {
          // ignore cleanup errors
        }
      });
    } catch (error) {
      console.error(
        "[Order Service] In-flight lock error:",
        (error as Error)?.message || error
      );
    }
  }

  next();
};
