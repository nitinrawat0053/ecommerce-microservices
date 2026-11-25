import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockFindByEmail,
  mockFindByPhone,
  mockCreate,
  mockDeleteById,
  mockSendVerificationCode,
  mockVerifyCode,
  mockHash,
  mockCompare,
  mockGenerateToken,
  mockGenerateShortLivedToken,
  mockVerifyToken,
  mockRedisSet,
  mockRedisGet,
  mockRedisDel,
  mockRedisIncr,
  mockRedisExpire,
  mockRedisTtl,
  mockRedisEval,
  mockPasswordResetCreate,
  mockPasswordResetUpdateMany,
  mockPasswordResetFindOne,
  mockSendOtpEmail,
} = vi.hoisted(() => ({
  mockFindByEmail: vi.fn(),
  mockFindByPhone: vi.fn(),
  mockCreate: vi.fn(),
  mockDeleteById: vi.fn(),
  mockSendVerificationCode: vi.fn(),
  mockVerifyCode: vi.fn(),
  mockHash: vi.fn().mockResolvedValue("hashed-password"),
  mockCompare: vi.fn(),
  mockGenerateToken: vi.fn().mockReturnValue("mock-jwt-token"),
  mockGenerateShortLivedToken: vi.fn().mockReturnValue("mock-short-lived-token"),
  mockVerifyToken: vi.fn(),
  mockRedisSet: vi.fn().mockResolvedValue("OK"),
  mockRedisGet: vi.fn(),
  mockRedisDel: vi.fn().mockResolvedValue(1),
  mockRedisIncr: vi.fn().mockResolvedValue(1),
  mockRedisExpire: vi.fn().mockResolvedValue(1),
  mockRedisTtl: vi.fn().mockResolvedValue(60),
  mockRedisEval: vi.fn().mockResolvedValue(1),
  mockPasswordResetCreate: vi.fn(),
  mockPasswordResetUpdateMany: vi.fn(),
  mockPasswordResetFindOne: vi.fn(),
  mockSendOtpEmail: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: mockHash, compare: mockCompare },
}));

vi.mock("@packages/jwt", () => ({
  generateToken: mockGenerateToken,
  generateShortLivedToken: mockGenerateShortLivedToken,
  verifyToken: mockVerifyToken,
}));

vi.mock("../repositories/user.repository", () => ({
  UserRepository: class {
    findByEmail = mockFindByEmail;
    findByPhone = mockFindByPhone;
    create = mockCreate;
    deleteById = mockDeleteById;
    updatePassword = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock("../providers/twilio-verify", () => ({
  TwilioVerifyProvider: class {
    sendVerificationCode = mockSendVerificationCode;
    verifyCode = mockVerifyCode;
  },
}));

vi.mock("../providers/email.provider", () => ({
  sendOtpEmail: mockSendOtpEmail,
}));

vi.mock("../models/password-reset.model", () => ({
  PasswordReset: {
    create: mockPasswordResetCreate,
    updateMany: mockPasswordResetUpdateMany,
    findOne: mockPasswordResetFindOne,
  },
}));

// The shared Redis client is used for rate limiting / OTP protection. Mock
// it so unit tests never dial a real Redis server.
vi.mock("@packages/redis", () => ({
  redisClient: {
    set: mockRedisSet,
    get: mockRedisGet,
    del: mockRedisDel,
    incr: mockRedisIncr,
    expire: mockRedisExpire,
    ttl: mockRedisTtl,
    eval: mockRedisEval,
  },
}));

import bcrypt from "bcryptjs";
import { generateToken } from "@packages/jwt";
import { AuthService } from "../services/auth.service";
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  TooManyRequestsError,
  ServiceUnavailableError,
} from "@packages/errors";

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
    // Default: Redis SET NX succeeds → cooldown acquired (no active cooldown)
    mockRedisSet.mockResolvedValue("OK");
  });

  describe("register", () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      phone: "+1234567890",
    };

    it("should register a new user and send OTP", async () => {
      mockFindByEmail.mockResolvedValue(null);
      mockFindByPhone.mockResolvedValue(null);
      mockCreate.mockResolvedValue({
        _id: "user123",
        name: validData.name,
        email: validData.email,
        phone: validData.phone,
        isVerified: false,
      });

      const result = await authService.register(
        validData.name, validData.email, validData.password, validData.phone
      );

      expect(mockFindByEmail).toHaveBeenCalledWith(validData.email);
      expect(mockFindByPhone).toHaveBeenCalledWith(validData.phone);
      expect(bcrypt.hash).toHaveBeenCalledWith(validData.password, 10);
      expect(mockCreate).toHaveBeenCalled();
      expect(mockSendVerificationCode).toHaveBeenCalledWith(validData.phone);
      expect(result).toEqual({
        id: "user123",
        name: validData.name,
        email: validData.email,
        phone: validData.phone,
        isVerified: false,
        phoneVerified: false,
        otpSent: true,
        otpError: undefined,
      });
    });

    it("should throw ConflictError if email already exists", async () => {
      mockFindByEmail.mockResolvedValue({ _id: "existing" });

      await expect(
        authService.register(validData.name, validData.email, validData.password, validData.phone)
      ).rejects.toThrow(ConflictError);
    });

    it("should throw ConflictError if phone already exists", async () => {
      mockFindByEmail.mockResolvedValue(null);
      mockFindByPhone.mockResolvedValue({ _id: "existing" });

      await expect(
        authService.register(validData.name, validData.email, validData.password, validData.phone)
      ).rejects.toThrow(ConflictError);
    });

    it("should still register and mark OTP as not sent when OTP sending fails", async () => {
      mockFindByEmail.mockResolvedValue(null);
      mockFindByPhone.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ _id: "user123", name: validData.name, email: validData.email, phone: validData.phone, isVerified: false });
      mockSendVerificationCode.mockRejectedValue(new Error("Twilio error"));

      const result = await authService.register(
        validData.name, validData.email, validData.password, validData.phone
      );

      // Registration is not rolled back / rethrown on an OTP provider failure:
      // it returns a resolved result with otpSent=false so the OTP can be resent.
      expect(result.otpSent).toBe(false);
      expect(result.otpError).toBe("Twilio error");
      expect(mockDeleteById).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should return token for valid credentials", async () => {
      const mockUser = {
        _id: "user123",
        email: "john@example.com",
        password: "hashed-password",
        name: "John",
        role: "USER",
        phone: "+1234567890",
        isVerified: true,
      };
      mockFindByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await authService.login("john@example.com", "password123");

      expect(mockFindByEmail).toHaveBeenCalledWith("john@example.com");
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashed-password");
      expect(generateToken).toHaveBeenCalledWith({ userId: "user123", role: "USER" });
      expect(result).toEqual({
        token: "mock-jwt-token",
        user: {
          id: "user123",
          name: "John",
          email: "john@example.com",
          role: "USER",
          phone: "+1234567890",
          isVerified: true,
          phoneVerified: true,
        },
      });
    });

    it("should throw UnauthorizedError for wrong email", async () => {
      mockFindByEmail.mockResolvedValue(null);
      await expect(authService.login("wrong@example.com", "password123")).rejects.toThrow(UnauthorizedError);
    });

    it("should throw UnauthorizedError for wrong password", async () => {
      mockFindByEmail.mockResolvedValue({ _id: "user123", password: "hashed-password" });
      (bcrypt.compare as any).mockResolvedValue(false);
      await expect(authService.login("john@example.com", "wrongpassword")).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("verifyPhone", () => {
    it("should verify phone with valid OTP", async () => {
      const mockUser = { _id: "user123", phone: "+1234567890", isVerified: false, save: vi.fn(), name: "John", email: "john@example.com" };
      mockFindByPhone.mockResolvedValue(mockUser);
      mockVerifyCode.mockResolvedValue(true);

      await authService.verifyPhone("+1234567890", "123456");

      expect(mockVerifyCode).toHaveBeenCalledWith("+1234567890", "123456");
      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should throw UnauthorizedError if user not found", async () => {
      mockFindByPhone.mockResolvedValue(null);
      await expect(authService.verifyPhone("+1234567890", "123456")).rejects.toThrow(UnauthorizedError);
    });

    it("should throw ConflictError if already verified", async () => {
      mockFindByPhone.mockResolvedValue({ _id: "user123", isVerified: true });
      await expect(authService.verifyPhone("+1234567890", "123456")).rejects.toThrow("Phone number already verified");
    });

    it("should throw UnauthorizedError for invalid OTP", async () => {
      mockFindByPhone.mockResolvedValue({ _id: "user123", isVerified: false });
      mockVerifyCode.mockResolvedValue(false);
      await expect(authService.verifyPhone("+1234567890", "000000")).rejects.toThrow(UnauthorizedError);
    });
  });

  // ── forgotPassword ──────────────────────────────────────────────────────────

  describe("forgotPassword", () => {
    it("returns the standard message even when the email is not registered (anti-enumeration)", async () => {
      mockFindByEmail.mockResolvedValue(null);
      const result = await authService.forgotPassword("unknown@example.com");
      expect(result.message).toMatch(/registered/i);
    });

    it("creates a PasswordReset record and sends an OTP when user exists", async () => {
      mockFindByEmail.mockResolvedValue({ _id: "u1", email: "user@example.com" });
      mockPasswordResetUpdateMany.mockResolvedValue({});
      mockPasswordResetCreate.mockResolvedValue({});
      mockSendOtpEmail.mockResolvedValue(undefined);

      const result = await authService.forgotPassword("user@example.com");

      expect(mockPasswordResetCreate).toHaveBeenCalledOnce();
      expect(mockSendOtpEmail).toHaveBeenCalledOnce();
      expect(mockRedisSet).toHaveBeenCalledWith(
        expect.stringContaining("otp:cooldown:"),
        "1",
        "EX",
        60
      );
      expect(result.message).toBeTruthy();
    });

    it("does not set the cooldown key when email sending fails", async () => {
      mockFindByEmail.mockResolvedValue({ _id: "u1", email: "user@example.com" });
      mockPasswordResetUpdateMany.mockResolvedValue({});
      mockPasswordResetCreate.mockResolvedValue({});
      mockSendOtpEmail.mockRejectedValue(new Error("SMTP down"));

      await authService.forgotPassword("user@example.com");

      // Cooldown should not be set because the OTP was never sent
      const cooldownCalls = (mockRedisSet as ReturnType<typeof vi.fn>).mock.calls.filter(
        (c: unknown[]) => typeof c[0] === "string" && (c[0] as string).startsWith("otp:cooldown:")
      );
      expect(cooldownCalls).toHaveLength(0);
    });
  });

  // ── verifyResetOtp ──────────────────────────────────────────────────────────

  describe("verifyResetOtp", () => {
    const makeRecord = (overrides = {}) => ({
      _id: { toString: () => "record-id-1" },
      email: "user@example.com",
      otpHash: "hashed-otp",
      used: false,
      save: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    });

    it("throws BadRequestError when no active reset record exists", async () => {
      mockPasswordResetFindOne.mockReturnValue({
        sort: vi.fn().mockResolvedValue(null),
      });
      await expect(
        authService.verifyResetOtp("user@example.com", "123456")
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError for an invalid OTP and increments the failure counter", async () => {
      const record = makeRecord();
      mockPasswordResetFindOne.mockReturnValue({
        sort: vi.fn().mockResolvedValue(record),
      });
      // bcrypt.compare mock — invalid OTP
      (bcrypt.compare as any).mockResolvedValue(false);
      mockRedisIncr.mockResolvedValue(1);
      mockRedisExpire.mockResolvedValue(1);

      await expect(
        authService.verifyResetOtp("user@example.com", "000000")
      ).rejects.toThrow(BadRequestError);

      expect(mockRedisIncr).toHaveBeenCalledOnce();
    });

    it("marks the record as used and invalidates the session after MAX_RESET_OTP_ATTEMPTS failures", async () => {
      const record = makeRecord();
      mockPasswordResetFindOne.mockReturnValue({
        sort: vi.fn().mockResolvedValue(record),
      });
      (bcrypt.compare as any).mockResolvedValue(false);
      // 5th failure — hits MAX_RESET_OTP_ATTEMPTS
      mockRedisIncr.mockResolvedValue(5);

      await expect(
        authService.verifyResetOtp("user@example.com", "000000")
      ).rejects.toThrow(BadRequestError);

      expect(record.used).toBe(true);
      expect(record.save).toHaveBeenCalled();
    });

    it("returns a short-lived token and clears the failure counter on a valid OTP", async () => {
      const record = makeRecord();
      mockPasswordResetFindOne.mockReturnValue({
        sort: vi.fn().mockResolvedValue(record),
      });
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await authService.verifyResetOtp(
        "user@example.com",
        "123456"
      );

      expect(result.token).toBe("mock-short-lived-token");
      expect(mockRedisDel).toHaveBeenCalledWith(
        expect.stringContaining("otp:attempts:")
      );
      expect(record.used).toBe(true);
    });

    it("throws ServiceUnavailableError when Redis incr fails on invalid OTP", async () => {
      const record = makeRecord();
      mockPasswordResetFindOne.mockReturnValue({
        sort: vi.fn().mockResolvedValue(record),
      });
      (bcrypt.compare as any).mockResolvedValue(false);
      mockRedisIncr.mockRejectedValue(new Error("Redis down"));

      await expect(
        authService.verifyResetOtp("user@example.com", "000000")
      ).rejects.toThrow(ServiceUnavailableError);
    });
  });

  // ── resendResetOtp ──────────────────────────────────────────────────────────

  describe("resendResetOtp", () => {
    it("returns the standard message even when the email is not registered (anti-enumeration)", async () => {
      mockFindByEmail.mockResolvedValue(null);
      const result = await authService.resendResetOtp("unknown@example.com");
      expect(result.message).toBeTruthy();
    });

    it("throws TooManyRequestsError when the 60-second cooldown is active (SET NX returns null)", async () => {
      mockFindByEmail.mockResolvedValue({ _id: "u1", email: "user@example.com" });
      // SET NX returns null → key already exists → cooldown active
      mockRedisSet.mockResolvedValue(null);
      mockRedisTtl.mockResolvedValue(45);

      await expect(
        authService.resendResetOtp("user@example.com")
      ).rejects.toThrow(TooManyRequestsError);
    });

    it("sends a new OTP and creates a fresh PasswordReset record when cooldown is not active", async () => {
      mockFindByEmail.mockResolvedValue({ _id: "u1", email: "user@example.com" });
      mockRedisSet.mockResolvedValue("OK"); // cooldown not active
      mockPasswordResetUpdateMany.mockResolvedValue({});
      mockPasswordResetCreate.mockResolvedValue({});
      mockSendOtpEmail.mockResolvedValue(undefined);

      const result = await authService.resendResetOtp("user@example.com");

      expect(mockPasswordResetCreate).toHaveBeenCalledOnce();
      expect(mockSendOtpEmail).toHaveBeenCalledOnce();
      expect(result.message).toBeTruthy();
    });

    it("rolls back (deletes) the cooldown key when OTP sending fails", async () => {
      mockFindByEmail.mockResolvedValue({ _id: "u1", email: "user@example.com" });
      mockRedisSet.mockResolvedValue("OK");
      mockPasswordResetUpdateMany.mockResolvedValue({});
      mockPasswordResetCreate.mockResolvedValue({});
      mockSendOtpEmail.mockRejectedValue(new Error("SMTP error"));

      await authService.resendResetOtp("user@example.com");

      expect(mockRedisDel).toHaveBeenCalledWith(
        expect.stringContaining("otp:cooldown:")
      );
    });

    it("throws ServiceUnavailableError when Redis SET NX itself throws", async () => {
      mockFindByEmail.mockResolvedValue({ _id: "u1", email: "user@example.com" });
      mockRedisSet.mockRejectedValue(new Error("Redis down"));

      await expect(
        authService.resendResetOtp("user@example.com")
      ).rejects.toThrow(ServiceUnavailableError);
    });
  });

  // ── resetPassword ───────────────────────────────────────────────────────────

  describe("resetPassword", () => {
    it("throws BadRequestError for an invalid or expired reset token", async () => {
      mockVerifyToken.mockImplementation(() => {
        throw new Error("jwt expired");
      });
      await expect(
        authService.resetPassword("bad-token", "newpass123")
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when the token role is not 'password-reset'", async () => {
      mockVerifyToken.mockReturnValue({ userId: "reset:user@example.com", role: "USER" });
      await expect(
        authService.resetPassword("valid-but-wrong-role-token", "newpass123")
      ).rejects.toThrow(BadRequestError);
    });

    it("throws BadRequestError when no verified OTP record exists", async () => {
      mockVerifyToken.mockReturnValue({
        userId: "reset:user@example.com",
        role: "password-reset",
      });
      mockPasswordResetFindOne.mockResolvedValue(null);
      await expect(
        authService.resetPassword("valid-token", "newpass123")
      ).rejects.toThrow(BadRequestError);
    });

    it("updates the password and invalidates remaining reset records on success", async () => {
      mockVerifyToken.mockReturnValue({
        userId: "reset:user@example.com",
        role: "password-reset",
      });
      mockPasswordResetFindOne.mockResolvedValue({
        email: "user@example.com",
        used: true,
      });
      mockPasswordResetUpdateMany.mockResolvedValue({});
      (bcrypt.hash as any).mockResolvedValue("new-hashed-password");

      const result = await authService.resetPassword("valid-token", "newpass123");

      expect(bcrypt.hash).toHaveBeenCalledWith("newpass123", 10);
      expect(result.message).toMatch(/reset successfully/i);
    });
  });
});
