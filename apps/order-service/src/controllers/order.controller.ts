import { Request, Response, NextFunction } from "express";
import { OrderService } from "../services/order.service";
import { OrderStatus } from "@packages/shared-types";

const orderService = new OrderService();
export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("x-user-id:", req.headers["x-user-id"]);
      const userId = req.headers["x-user-id"] as string;
      const {
        productId,
        quantity
      } = req.body;

      const order = await orderService.createOrder(
        userId,
        productId,
        quantity
      );

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
  
async getAllOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = req.query.status as OrderStatus;
    const result = await orderService.getAllOrders({page,limit,status});

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}
  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
    
      const order = await orderService.getOrderById(req.params.id as string);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.updateOrder(req.params.id as string, req.body);

      res.status(200).json({
        success: true,
        message: "Order updated successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      await orderService.deleteOrder(req.params.id as string);

      res.status(200).json({
        success: true,
        message: "Order deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();