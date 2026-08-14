import { Request, Response, NextFunction } from "express";
import { PaymentService } from "../services/payment.service";
import { razorpayProvider } from "../providers/razorpay.provider";

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

  async verifyPayment(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const payment =
      await paymentService.verifyPayment(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

  async razorpayWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("🔔 Razorpay Webhook Received");
  try {
    const signature =
      req.headers["x-razorpay-signature"] as string;

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay signature",
      });
    }

    const rawBody = req.body as Buffer;

    const isValid =
      razorpayProvider.verifyWebhookSignature(
        rawBody,
        signature
      );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }
    console.log("✅ Razorpay Webhook Signature Verified");

    await paymentService.processWebhookEvent(
      JSON.parse(rawBody.toString())
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
}
}

export const paymentController = new PaymentController();