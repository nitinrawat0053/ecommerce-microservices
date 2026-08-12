import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, phone } = req.body;

      const user = await authService.register(name, email, password, phone);

      res.status(201).json({
        success: true,
        message: "Verification OTP sent to your phone",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
  async verifyPhone(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { phone, code } = req.body;

    const user = await authService.verifyPhone(
      phone,
      code
    );

    res.status(200).json({
      success: true,
      message: "Phone number verified successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
  async login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
 }
}

export const authController = new AuthController();