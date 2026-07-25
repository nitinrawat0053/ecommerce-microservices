import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

export class UserController {
  async getProfile(req: Request,res: Response,next: NextFunction) {
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
}

export const userController = new UserController();