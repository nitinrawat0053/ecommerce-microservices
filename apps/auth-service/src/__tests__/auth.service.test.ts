import { describe, it, expect, vi, beforeEach } from "vitest";

// Must use vi.hoisted() for variables used inside vi.mock factories
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

    it("should delete user if OTP sending fails", async () => {
      mockFindByEmail.mockResolvedValue(null);
      mockFindByPhone.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ _id: "user123" });
      mockSendVerificationCode.mockRejectedValue(new Error("Twilio error"));

      await expect(
        authService.register(validData.name, validData.email, validData.password, validData.phone)
      ).rejects.toThrow("Twilio error");

      expect(mockDeleteById).toHaveBeenCalledWith("user123");
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

      const result = await authService.verifyPhone("+1234567890", "123456");

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
