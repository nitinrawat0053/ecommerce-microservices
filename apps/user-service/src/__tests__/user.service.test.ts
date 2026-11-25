import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockUserFindById,
  mockUserUpdatePreferences,
  mockUserUpdateProfile,
  mockUserUpdatePassword,
  mockUserFindAddresses,
  mockUserAddAddress,
  mockUserUpdateAddress,
  mockUserDeleteAddress,
  mockBcryptCompare,
  mockBcryptHash,
} = vi.hoisted(() => ({
  mockUserFindById: vi.fn(),
  mockUserUpdatePreferences: vi.fn(),
  mockUserUpdateProfile: vi.fn(),
  mockUserUpdatePassword: vi.fn(),
  mockUserFindAddresses: vi.fn(),
  mockUserAddAddress: vi.fn(),
  mockUserUpdateAddress: vi.fn(),
  mockUserDeleteAddress: vi.fn(),
  mockBcryptCompare: vi.fn(),
  mockBcryptHash: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: mockBcryptCompare,
    hash: mockBcryptHash,
  },
}));

vi.mock("../repositories/user.repository", () => ({
  UserRepository: class {
    findById = mockUserFindById;
    updateNotificationPreferences = mockUserUpdatePreferences;
    updateProfile = mockUserUpdateProfile;
    updatePassword = mockUserUpdatePassword;
    findAddresses = mockUserFindAddresses;
    addAddress = mockUserAddAddress;
    updateAddress = mockUserUpdateAddress;
    deleteAddress = mockUserDeleteAddress;
  },
}));

import { UserService } from "../services/user.service";
import { NotFoundError } from "@packages/errors";

describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService();
  });

  describe("getProfile", () => {
    it("should return user profile with selected fields including isVerified and phoneVerified", async () => {
      const mockUser = {
        id: "user123", name: "John Doe", email: "john@example.com",
        phone: "+1234567890", role: "USER", isVerified: true,
        notificationPreferences: { email: true, sms: true, whatsapp: false },
      };
      mockUserFindById.mockResolvedValue(mockUser);

      const result = await userService.getProfile("user123");

      expect(mockUserFindById).toHaveBeenCalledWith("user123");
      expect(result).toEqual({
        ...mockUser,
        isVerified: true,
        phoneVerified: true,
        addresses: [],
      });
    });

    it("should default isVerified and phoneVerified to false if not set", async () => {
      const mockUser = {
        id: "user123", name: "John Doe", email: "john@example.com",
        phone: "+1234567890", role: "USER",
        notificationPreferences: { email: true, sms: true, whatsapp: false },
      };
      mockUserFindById.mockResolvedValue(mockUser);

      const result = await userService.getProfile("user123");

      expect(result.isVerified).toBe(false);
      expect(result.phoneVerified).toBe(false);
      expect(result.addresses).toEqual([]);
    });

    it("should throw NotFoundError if user doesn't exist", async () => {
      mockUserFindById.mockResolvedValue(null);
      await expect(userService.getProfile("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("should not expose password in profile", async () => {
      mockUserFindById.mockResolvedValue({
        id: "user123", name: "John", email: "john@example.com",
        phone: "+123", role: "USER", password: "hashed-pw",
        isVerified: true,
        notificationPreferences: { email: true, sms: true, whatsapp: true },
      });

      const result = await userService.getProfile("user123");
      expect(result).not.toHaveProperty("password");
    });
  });

  describe("updateProfile", () => {
    it("should update and return profile fields", async () => {
      const updatedUser = {
        _id: "user123",
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "+9876543210",
        role: "USER",
        isVerified: true,
      };
      mockUserUpdateProfile.mockResolvedValue(updatedUser);

      const result = await userService.updateProfile("user123", {
        name: "Jane Doe",
        phone: "+9876543210",
      });

      expect(mockUserUpdateProfile).toHaveBeenCalledWith("user123", {
        name: "Jane Doe",
        phone: "+9876543210",
      });
      expect(result.name).toBe("Jane Doe");
      expect(result.phone).toBe("+9876543210");
    });

    it("should throw NotFoundError if user does not exist", async () => {
      mockUserUpdateProfile.mockResolvedValue(null);
      await expect(
        userService.updateProfile("nonexistent", { name: "Test" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("changePassword", () => {
    it("should verify current password and hash new password", async () => {
      const mockUser = { id: "user123", password: "old-hashed-password" };
      mockUserFindById.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue("new-hashed-password");
      mockUserUpdatePassword.mockResolvedValue(mockUser);

      const result = await userService.changePassword("user123", {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
      });

      expect(mockBcryptCompare).toHaveBeenCalledWith(
        "OldPassword123!",
        "old-hashed-password"
      );
      expect(mockBcryptHash).toHaveBeenCalledWith("NewPassword123!", 10);
      expect(mockUserUpdatePassword).toHaveBeenCalledWith(
        "user123",
        "new-hashed-password"
      );
      expect(result.message).toMatch(/updated successfully/i);
    });

    it("should reject if current password does not match", async () => {
      const mockUser = { id: "user123", password: "old-hashed-password" };
      mockUserFindById.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(
        userService.changePassword("user123", {
          currentPassword: "WrongPassword!",
          newPassword: "NewPassword123!",
        })
      ).rejects.toThrow(/does not match/i);
    });

    it("should reject if new password is too short", async () => {
      await expect(
        userService.changePassword("user123", {
          currentPassword: "OldPassword123!",
          newPassword: "short",
        })
      ).rejects.toThrow(/at least 8 characters/i);
    });
  });

  describe("address operations", () => {
    it("should get user addresses", async () => {
      const addresses = [{ street: "123 Main St", city: "City", state: "State", postalCode: "12345" }];
      mockUserFindAddresses.mockResolvedValue(addresses);

      const result = await userService.getAddresses("user123");
      expect(result).toEqual(addresses);
      expect(mockUserFindAddresses).toHaveBeenCalledWith("user123");
    });

    it("should add a new address", async () => {
      const addr = { street: "456 Oak St", city: "Town", state: "State", postalCode: "67890" };
      mockUserAddAddress.mockResolvedValue({ addresses: [addr] });

      const result = await userService.addAddress("user123", addr);
      expect(mockUserAddAddress).toHaveBeenCalledWith("user123", addr);
      expect(result).toHaveLength(1);
    });

    it("should update an existing address", async () => {
      const updated = { street: "Updated St", city: "Town", state: "State", postalCode: "67890" };
      mockUserUpdateAddress.mockResolvedValue({ addresses: [updated] });

      const result = await userService.updateAddress("user123", "addr_1", updated);
      expect(mockUserUpdateAddress).toHaveBeenCalledWith("user123", "addr_1", updated);
      expect(result![0].street).toBe("Updated St");
    });

    it("should delete an address", async () => {
      mockUserDeleteAddress.mockResolvedValue({ addresses: [] });

      const result = await userService.deleteAddress("user123", "addr_1");
      expect(mockUserDeleteAddress).toHaveBeenCalledWith("user123", "addr_1");
      expect(result).toHaveLength(0);
    });
  });

  describe("updateNotificationPreferences", () => {
    it("should update email preference", async () => {
      const mockUser = { id: "user123", notificationPreferences: { email: false, sms: true, whatsapp: true } };
      mockUserUpdatePreferences.mockResolvedValue(mockUser);

      const result = await userService.updateNotificationPreferences("user123", { email: false });
      expect(mockUserUpdatePreferences).toHaveBeenCalledWith("user123", { email: false });
      expect(result.notificationPreferences.email).toBe(false);
    });

    it("should update multiple preferences", async () => {
      const mockUser = { id: "user123", notificationPreferences: { email: false, sms: false, whatsapp: false } };
      mockUserUpdatePreferences.mockResolvedValue(mockUser);

      const result = await userService.updateNotificationPreferences("user123", { email: false, sms: false, whatsapp: false });
      expect(result.notificationPreferences).toEqual({ email: false, sms: false, whatsapp: false });
    });

    it("should throw NotFoundError", async () => {
      mockUserUpdatePreferences.mockResolvedValue(null);
      await expect(userService.updateNotificationPreferences("nonexistent", { email: false })).rejects.toThrow(NotFoundError);
    });
  });
});
