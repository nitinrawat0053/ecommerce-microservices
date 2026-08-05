import { Request, Response, NextFunction } from "express";
import { CartService } from "../services/cart.service";
import { Types } from "mongoose";

const cartService = new CartService();

export class CartController {
  async addToCart(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, quantity } = req.body;
      const userId = req.headers["x-user-id"] as string;

      const cart = await cartService.addToCart(
        userId,
        productId,
        quantity
      );

      res.status(201).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers["x-user-id"] as string;

      const cart = await cartService.getCart(userId);

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateQuantity(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.headers["x-user-id"] as string;
      const productId = req.params.productId as string;
      const { quantity } = req.body;

      const cart = await cartService.updateQuantity(
        userId,
        productId,
        quantity
      );

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFromCart(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.headers["x-user-id"] as string;
      const productId = req.params.productId as string;

      const cart = await cartService.removeFromCart(
        userId,
        productId
      );

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.headers["x-user-id"] as string;

      const cart = await cartService.clearCart(userId);

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }
}