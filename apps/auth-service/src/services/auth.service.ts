import bcrypt from "bcryptjs";
import { ConflictError, UnauthorizedError, BadRequestError, TooManyRequestsError, ServiceUnavailableError } from "@packages/errors";
import { UserRepository } from "../repositories/user.repository";
import { generateToken, generateShortLivedToken, verifyToken } from "@packages/jwt";
import { TwilioVerifyProvider } from "../providers/twilio-verify";
import { PasswordReset } from "../models/password-reset.model";
import { generateOtp, hashOtp, verifyOtp } from "../utils/otp";
import { sendOtpEmail } from "../providers/email.provider";
import { redisClient } from "@packages/redis";

const userRepository = new UserRepository();

// Always returned regardless of whether the email exists (anti-enumeration).
const RESET_MESSAGE =
  "If this email is registered, you will receive a verification code shortly.";

/** Normalize emails before they are used to build Redis keys. */
const normalizeEmail = (email: string): string =>
  (email || "").trim().toLowerCase();

// Failed-OTP lockout (per reset session)
const MAX_RESET_OTP_ATTEMPTS = 5;
const RESET_OTP_ATTEMPTS_TTL_SECONDS = 5 * 60; // matches the OTP expiry window

// Resend cooldown (enforced by Redis on the backend)
const RESEND_OTP_COOLDOWN_SECONDS = 60;

export class AuthService {
  private twilioVerifyProvider = new TwilioVerifyProvider();
  async register(name: string, email: string, password: string, phone: string) {
  const existingUser = await userRepository.findByEmail(email);
  const existingPhone = await userRepository.findByPhone(phone);

  if (existingUser || existingPhone) {
    throw new ConflictError("User already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepository.create({
    name,
    email,
    password: hashedPassword,
    phone,
  });

  let otpSent = false;
  let otpError = "";
  try {
    const formattedPhone = phone.startsWith("+")
      ? phone
      : `+91${phone}`;
    await this.twilioVerifyProvider.sendVerificationCode(formattedPhone);
    otpSent = true;
  } catch (error: any) {
    console.error(`[Auth Service] OTP send failed for ${phone}:`, error.message || error);
    otpError = error.message || "Failed to send OTP";
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isVerified: user.isVerified,
    otpSent,
    otpError: otpSent ? undefined : otpError,
  };
}
  async verifyPhone(phone: string, code: string) {
  const user = await userRepository.findByPhone(phone);

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  if (user.isVerified) {
    throw new ConflictError("Phone number already verified");
  }
   const formattedPhone = phone.startsWith("+")
    ? phone
    : `+91${phone}`;

  const isVerified =
    await this.twilioVerifyProvider.verifyCode(
      formattedPhone,
      code
    );

  if (!isVerified) {
    throw new UnauthorizedError("Invalid or expired OTP");
  }

  user.isVerified = true;
  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isVerified: user.isVerified,
  };
}

  async resendOtp(phone: string) {
  const user = await userRepository.findByPhone(phone);
  if (!user) {
    throw new UnauthorizedError("User not found");
  }
  if (user.isVerified) {
    throw new ConflictError("Phone number already verified");
  }
  const formattedPhone = phone.startsWith("+")
    ? phone
    : `+91${phone}`;
  await this.twilioVerifyProvider.sendVerificationCode(formattedPhone);
  return { message: "OTP resent successfully" };
}

  async login(email: string, password: string) {
    
    const user = await userRepository.findByEmail(email);
    if (!user) {
        throw new UnauthorizedError("Invalid email or password");
    }
    
    const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
);

    if (!isPasswordCorrect) {
       throw new UnauthorizedError("Invalid email or password");
    }
    const token = generateToken({
    userId: user._id.toString(),
    role: user.role,
});
    return {
        token,
        user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      phone: user.phone,
    },
   };
 }

  // ─── Forgot Password ────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);

    // Always return the same message to prevent user enumeration
    if (!user) {
      return { message: RESET_MESSAGE };
    }

    // Generate and store OTP
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    // Invalidate any previous unused resets for this email
    await PasswordReset.updateMany(
      { email, used: false },
      { used: true }
    );

    await PasswordReset.create({
      email,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // Send OTP via email
    let otpSent = false;
    try {
      await sendOtpEmail(email, otp);
      otpSent = true;
    } catch (error: any) {
      console.error(
        `[Auth Service] Failed to send password reset OTP to ${email}:`,
        error.message || error
      );
      // Don't reveal email sending failure to the client
    }

    // Start the 60s resend cooldown only once the OTP actually went out, so
    // a failed send doesn't immediately lock the user out of retrying.
    if (otpSent) {
      try {
        await redisClient.set(
          `otp:cooldown:${normalizeEmail(email)}`,
          "1",
          "EX",
          RESEND_OTP_COOLDOWN_SECONDS
        );
      } catch (error: any) {
        console.error(
          `[Auth Service] Failed to set OTP cooldown for ${email}:`,
          error?.message || error
        );
      }
    }

    return { message: RESET_MESSAGE };
  }

  async verifyResetOtp(email: string, otp: string) {
    // Find the most recent non-expired, non-used OTP
    const record = await PasswordReset.findOne({
      email,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) {
      throw new BadRequestError("Invalid or expired OTP");
    }

    // A "reset session" is the current pending reset document for the email.
    // The session changes whenever a fresh OTP is issued, which also resets
    // the failure counter — a new OTP is a fresh chance (subject to the
    // forgot/resend rate limits on how often new sessions can be created).
    const resetSessionId = record._id.toString();
    const attemptsKey = `otp:attempts:${resetSessionId}`;

    const isValid = await verifyOtp(otp, record.otpHash);
    if (!isValid) {
      let failures: number;
      try {
        // Atomic increment — concurrent requests cannot race past the limit.
        failures = await redisClient.incr(attemptsKey);
        if (failures === 1) {
          await redisClient.expire(
            attemptsKey,
            RESET_OTP_ATTEMPTS_TTL_SECONDS
          );
        }
      } catch (error: any) {
        console.error(
          "[Auth Service] OTP attempt counter error:",
          error?.message || error
        );
        throw new ServiceUnavailableError();
      }

      // Invalidate the reset session once the limit is reached: mark the
      // record used so it can no longer be verified.
      if (failures >= MAX_RESET_OTP_ATTEMPTS) {
        record.used = true;
        await record.save();
      }

      throw new BadRequestError("Invalid or expired OTP");
    }

    // Verified — clear any failure counter for this session
    try {
      await redisClient.del(attemptsKey);
    } catch (error: any) {
      console.error(
        "[Auth Service] Failed to clear OTP attempt counter:",
        error?.message || error
      );
    }

    // Mark OTP as used
    record.used = true;
    await record.save();

    // Issue a short-lived JWT for the reset step
    const token = generateShortLivedToken(
      {
        userId: `reset:${email}`,
        role: "password-reset",
      },
      "10m"
    );

    return { token };
  }

  async resendResetOtp(email: string) {
    const user = await userRepository.findByEmail(email);

    // Always return the same message to prevent user enumeration
    if (!user) {
      return { message: RESET_MESSAGE };
    }

    const cooldownKey = `otp:cooldown:${normalizeEmail(email)}`;

    // 60-second cooldown enforced by Redis. SET NX succeeds only if the key
    // is absent, so it both checks and starts the cooldown atomically.
    let cooldownAcquired: string | null;
    try {
      cooldownAcquired = await redisClient.set(
        cooldownKey,
        "1",
        "EX",
        RESEND_OTP_COOLDOWN_SECONDS,
        "NX"
      );
    } catch (error: any) {
      console.error(
        "[Auth Service] OTP cooldown check error:",
        error?.message || error
      );
      throw new ServiceUnavailableError();
    }

    if (cooldownAcquired === null) {
      let retryAfter = RESEND_OTP_COOLDOWN_SECONDS;
      try {
        const ttl = await redisClient.ttl(cooldownKey);
        if (ttl > 0) retryAfter = ttl;
      } catch {
        // keep the default
      }
      throw new TooManyRequestsError(
        "Please wait before requesting another OTP.",
        retryAfter
      );
    }

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);

    // Invalidate any previous unused resets for this email
    await PasswordReset.updateMany(
      { email, used: false },
      { used: true }
    );

    await PasswordReset.create({
      email,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // Send OTP via email
    try {
      await sendOtpEmail(email, otp);
    } catch (error: any) {
      console.error(
        `[Auth Service] Failed to resend password reset OTP to ${email}:`,
        error.message || error
      );
      // Roll back the cooldown so nothing was sent and the user can retry.
      try {
        await redisClient.del(cooldownKey);
      } catch {
        // best-effort cleanup
      }
      // Don't reveal email sending failure to the client
    }

    return { message: RESET_MESSAGE };
  }

  async resetPassword(
    token: string,
    newPassword: string
  ) {
    // Verify the reset JWT
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new BadRequestError("Invalid or expired reset token");
    }

    if (payload.role !== "password-reset") {
      throw new BadRequestError("Invalid reset token");
    }

    const email = payload.userId.replace("reset:", "");

    // Confirm that an OTP was actually verified (used record exists)
    const verifiedRecord = await PasswordReset.findOne({
      email,
      used: true,
    });

    if (!verifiedRecord) {
      throw new BadRequestError("OTP was not verified");
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(email, hashedPassword);

    // Invalidate ALL pending resets for this email
    await PasswordReset.updateMany(
      { email, used: false },
      { used: true }
    );

    return {
      message:
        "Your password has been reset successfully. Please login with your new password.",
    };
  }
}