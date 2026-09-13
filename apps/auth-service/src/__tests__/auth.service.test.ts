import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindByEmail, mockFindByPhone, mockCreate, mockDeleteById, mockSendVerificationCode, mockVerifyCode, mockHash, mockCompare, mockGenerateToken } = vi.hoisted(() => ({
  mockFindByEmail: vi.fn(),
  mockFindByPhone: vi.fn(),
  mockCreate: vi.fn(),
  mockDeleteById: vi.fn(),
  mockSendVerificationCode: vi.fn(),
  mockVerifyCode: vi.fn(),
  mockHash: vi.fn().mockResolvedValue("hashed-password"),
  mockCompare: vi.fn(),
  mockGenerateToken: vi.fn().mockReturnValue("mock-jwt-token"),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: mockHash, compare: mockCompare },
}));

vi.mock("@packages/jwt", () => ({
  generateToken: mockGenerateToken,
}));

vi.mock("../repositories/user.repository", () => ({
  UserRepository: class {
    findByEmail = mockFindByEmail;
    findByPhone = mockFindByPhone;
    create = mockCreate;
    deleteById = mockDeleteById;
  },
}));

vi.mock("../providers/twilio-verify", () => ({
  TwilioVerifyProvider: class {
    sendVerificationCode = mockSendVerificationCode;
    verifyCode = mockVerifyCode;
  },
}))

// The shared Redis client is used for rate limiting / OTP protection. Mock
// it so unit tests never dial a real Redis server.
vi.mock("@packages/redis", () => ({
  redisClient: {
    set: vi.fn().mockResolvedValue("OK"),
    get: vi.fn(),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    ttl: vi.fn().mockResolvedValue(60),
    eval: vi.fn().mockResolvedValue(1),
  },
}))

import bcrypt from "bcryptjs";
import { generateToken } from "@packages/jwt";
import { AuthService } from "../services/auth.service";
import { ConflictError, UnauthorizedError } from "@packages/errors";

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
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
      const mockUser = { _id: "user123", email: "john@example.com", password: "hashed-password", name: "John", role: "USER" };
      mockFindByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await authService.login("john@example.com", "password123");

      expect(mockFindByEmail).toHaveBeenCalledWith("john@example.com");
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashed-password");
      expect(generateToken).toHaveBeenCalledWith({ userId: "user123", role: "USER" });
      expect(result).toEqual({
        token: "mock-jwt-token",
        user: { id: "user123", name: "John", email: "john@example.com", role: "USER" },
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
});
