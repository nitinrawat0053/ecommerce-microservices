import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { UnauthorizedError } from "@packages/errors";

const userService = new UserService();

const getUserId = (req: Request): string => {
  const userId = (req.headers["x-user-id"] as string | undefined)?.trim();
  if (!userId) {
    throw new UnauthorizedError("User not authenticated");
  }
  return userId;
};

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const profile = await userService.getProfile(userId);
      res.status(200).json({
        success: true,
        message: "Profile fetched successfully",
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const { name, phone } = req.body;
      const updated = await userService.updateProfile(userId, { name, phone });
      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const { currentPassword, newPassword } = req.body;
      const result = await userService.changePassword(userId, {
        currentPassword,
        newPassword,
      });
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const addresses = await userService.getAddresses(userId);
      res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  async addAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const addresses = await userService.addAddress(userId, req.body);
      res.status(201).json({
        success: true,
        message: "Address added successfully",
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const addressId = req.params.addressId as string;
      const addresses = await userService.updateAddress(userId, addressId, req.body);
      res.status(200).json({
        success: true,
        message: "Address updated successfully",
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = getUserId(req);
      const addressId = req.params.addressId as string;
      const addresses = await userService.deleteAddress(userId, addressId);
      res.status(200).json({
        success: true,
        message: "Address deleted successfully",
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.headers["x-user-role"] as string;
      if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Only Super Admin can access user management",
        });
      }
      const { search, page, limit } = req.query;
      const result = await userService.getAllUsers({
        search: search as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      });
      res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const requesterId = req.headers["x-user-id"] as string;
      const userId = req.params.userId as string;
      const { role } = req.body;
      const updatedUser = await userService.updateUserRole(requesterId, userId, role);
      res.status(200).json({
        success: true,
        message: "User role updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateNotificationPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers["x-user-id"] as string;
      const updatedUser = await userService.updateNotificationPreferences(userId, req.body);
      res.status(200).json({
        success: true,
        message: "Notification preferences updated successfully",
        data: updatedUser.notificationPreferences,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
