import { Request, Response, NextFunction } from "express";
import { PaymentService } from "../services/payment.service";

const paymentService = new PaymentService();

export class PaymentController {
  async getPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const payment = await paymentService.getPayment(
        req.params.id as string
      );

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderPayment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const payment = await paymentService.getOrderPayment(
        req.params.orderId as string
      );

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserPayments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.headers["x-user-id"] as string;
      const payments = await paymentService.getUserPayments(
        req.params.userId as string
      );

      res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();