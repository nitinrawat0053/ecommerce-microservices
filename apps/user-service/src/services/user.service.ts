import { NotFoundError, ForbiddenError, BadRequestError } from "@packages/errors";
import { UserRepository } from "../repositories/user.repository";

const userRepository = new UserRepository();

export class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      notificationPreferences: user.notificationPreferences,
    };
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
