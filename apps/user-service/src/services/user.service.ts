import { NotFoundError, ForbiddenError, BadRequestError, UnauthorizedError } from "@packages/errors";
import { UserRepository } from "../repositories/user.repository";
import bcrypt from "bcryptjs";

const userRepository = new UserRepository();

export class UserService {
  async getProfile(userId: string) {
    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isVerified = Boolean(user.isVerified);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified,
      phoneVerified: isVerified,
      addresses: user.addresses || [],
      notificationPreferences: user.notificationPreferences,
    };
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }

    const updated = await userRepository.updateProfile(userId, data);
    if (!updated) {
      throw new NotFoundError("User not found");
    }

    return {
      id: updated._id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      isVerified: Boolean(updated.isVerified),
    };
  }

  async changePassword(
    userId: string,
    data: { currentPassword?: string; newPassword?: string }
  ) {
    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }
    if (!data.currentPassword || !data.newPassword) {
      throw new BadRequestError("Current password and new password are required");
    }
    if (data.newPassword.length < 8) {
      throw new BadRequestError("New password must be at least 8 characters");
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestError("Current password does not match");
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await userRepository.updatePassword(userId, hashedPassword);

    return { message: "Password updated successfully" };
  }

  async getAddresses(userId: string) {
    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }
    return await userRepository.findAddresses(userId);
  }

  async addAddress(userId: string, addressData: any) {
    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }
    if (
      !addressData.street ||
      !addressData.city ||
      !addressData.state ||
      !addressData.postalCode
    ) {
      throw new BadRequestError(
        "Street, city, state, and postal code are required"
      );
    }
    const user = await userRepository.addAddress(userId, addressData);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user.addresses;
  }

  async updateAddress(userId: string, addressId: string, addressData: any) {
    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }
    const user = await userRepository.updateAddress(
      userId,
      addressId,
      addressData
    );
    if (!user) {
      throw new NotFoundError("Address or user not found");
    }
    return user.addresses;
  }

  async deleteAddress(userId: string, addressId: string) {
    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }
    const user = await userRepository.deleteAddress(userId, addressId);
    if (!user) {
      throw new NotFoundError("Address or user not found");
    }
    return user.addresses;
  }

  async getAllUsers(options: { search?: string; page?: number; limit?: number }) {
    return await userRepository.findAll(options);
  }

  async updateUserRole(requesterId: string, targetUserId: string, newRole: string) {
    const validRoles = ["USER", "ADMIN", "SUPER_ADMIN"];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestError("Invalid role. Must be USER, ADMIN, or SUPER_ADMIN");
    }

    const requester = await userRepository.findById(requesterId);
    if (!requester) {
      throw new NotFoundError("Requester not found");
    }

    if (requester.role !== "SUPER_ADMIN") {
      throw new ForbiddenError("Only Super Admin can change user roles");
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError("Target user not found");
    }

    if (targetUser.role === "SUPER_ADMIN" && newRole !== "SUPER_ADMIN") {
      throw new ForbiddenError("Cannot demote a Super Admin");
    }

    if (requesterId === targetUserId && newRole !== "SUPER_ADMIN") {
      throw new ForbiddenError("Cannot change your own role");
    }

    const updatedUser = await userRepository.updateRole(targetUserId, newRole);
    
    if (!updatedUser) {
      throw new NotFoundError("Failed to update user role");
    }

    return {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    };
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: {
      email?: boolean;
      sms?: boolean;
      whatsapp?: boolean;
    }
  ) {
    const user = await userRepository.updateNotificationPreferences(userId, preferences);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }
}

export const userService = new UserService();
