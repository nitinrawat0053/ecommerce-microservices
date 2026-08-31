import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers["x-user-id"] as string;
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
