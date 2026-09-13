import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Generate a cryptographically secure 6-digit OTP.
 */
export function generateOtp(): string {
  return crypto.randomInt(0, 999999).toString().padStart(6, "0");
}

/**
 * Hash an OTP with bcrypt (10 rounds).
 */
export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

/**
 * Verify a plain OTP against a bcrypt hash.
 */
export async function verifyOtp(
  otp: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}
