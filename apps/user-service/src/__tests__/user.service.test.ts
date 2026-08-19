import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUserFindById, mockUserUpdatePreferences } = vi.hoisted(() => ({
  mockUserFindById: vi.fn(),
  mockUserUpdatePreferences: vi.fn(),
}));

vi.mock("../repositories/user.repository", () => ({
  UserRepository: class {
    findById = mockUserFindById;
    updateNotificationPreferences = mockUserUpdatePreferences;
  },
}))

import { UserService } from "../services/user.service";
import { NotFoundError } from "@packages/errors";

describe("UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService();
  });

  describe("getProfile", () => {
    it("should return user profile with selected fields", async () => {
      const mockUser = {
        id: "user123", name: "John Doe", email: "john@example.com",
        phone: "+1234567890", role: "USER",
        notificationPreferences: { email: true, sms: true, whatsapp: false },
      };
      mockUserFindById.mockResolvedValue(mockUser);

      const result = await userService.getProfile("user123");

      expect(mockUserFindById).toHaveBeenCalledWith("user123");
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundError if user doesn't exist", async () => {
      mockUserFindById.mockResolvedValue(null);
      await expect(userService.getProfile("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("should not expose password in profile", async () => {
      mockUserFindById.mockResolvedValue({
        id: "user123", name: "John", email: "john@example.com",
        phone: "+123", role: "USER", password: "hashed-pw",
        notificationPreferences: { email: true, sms: true, whatsapp: true },
      });

      const result = await userService.getProfile("user123");
      expect(result).not.toHaveProperty("password");
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
