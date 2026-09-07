import { AppError, BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from "@packages/errors";
import { OrderStatus, OrderFilters, EVENTS, PaymentMethod } from "@packages/shared-types";
import { OrderRepository } from "../repositories/order.repository";
import {config} from "@packages/config";
import { IOrder } from "../models/order.model";
import { User } from "../models/user.model";
import mongoose from "mongoose";
import { OutboxService } from "./outbox.service";
import axios from "axios";

const orderRepository = new OrderRepository();
const outboxService = new OutboxService();

export class OrderService {

  private async getProduct(productId: string) {
  try {
    const response = await axios.get(
      `${config.PRODUCT_SERVICE_URL}/api/products/${productId}`,
      // Fail fast: without a timeout this call can hang indefinitely and
      // blow past the API gateway's 15s proxy budget, surfacing as a 504.
      // 5s keeps us safely under that ceiling so a stuck product lookup
      // returns a real error instead of a silent gateway timeout.
      { timeout: 5000 }
    );

    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT")) {
      throw new AppError("Product service timed out while fetching product", 502);
    }
    throw new BadRequestError("Product not found");
  }
}
async createOrder(userId: string, productId: string, quantity: number, paymentMethod:PaymentMethod) {
  // SECURITY: an order is only allowed for an authenticated AND phone-verified
  // user. Creating an order triggers PAYMENT_INITIATED -> payment-session
  // (Razorpay) creation, so this is the enforcement point. We resolve the
  // user's verification state from the database (never from the client).
  const user = await User.findById(userId);
  if (!user) {
    throw new UnauthorizedError("User not authenticated");
  }
  if (!user.isVerified) {
    throw new ForbiddenError("Phone number not verified. Please verify your account to proceed with payment.");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    if (quantity <= 0) {
      throw new BadRequestError("Quantity must be greater than 0");
    }

    const product = await this.getProduct(productId);

    if (quantity > product.stock) {
      throw new BadRequestError("Insufficient stock");
    }

    const priceAtPurchase = product.price;
    const totalAmount = priceAtPurchase * quantity;

    const order = await orderRepository.create(
      {
        userId,
        productId,
        quantity,
        priceAtPurchase,
        totalAmount,
        status: OrderStatus.PENDING,
      },
      session
    );
    console.log("Order userId:", userId);

   await outboxService.createEvent(
   EVENTS.ORDER_CREATED,
  {
    productId,
    quantity,

  },
  session
);

  await outboxService.createEvent(
  EVENTS.PAYMENT_INITIATED,
  {
    orderId: order.id,
    userId,
    amount: totalAmount,
    paymentMethod,
  },
  session
);

  await session.commitTransaction();

    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
  async getOrderById(orderId: string) {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  return order;
}
  async getAllOrders(filters: OrderFilters) {
  let { page, limit, status, sortBy, sortOrder } = filters;

  page = Math.max(page, 1);
  limit = Math.max(limit, 1);
  limit = Math.min(limit, 100);

  const { orders, totalOrders } =
    await orderRepository.findAll({
      page,
      limit,
      status,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    });

  const totalPages = Math.ceil(totalOrders / limit);

  return {
    orders,
    pagination: {
      currentPage: page,
      limit,
      totalOrders,
      totalPages,
    },
  };
}
  async updateOrder(orderId: string, orderData: Partial<IOrder>) {
  const updatedOrder = await orderRepository.update(
    orderId,
    orderData
  );

  if (!updatedOrder) {
    throw new NotFoundError("Order not found");
  }

  return updatedOrder;
}
  
  async deleteOrder(orderId: string) {
  const deletedOrder = await orderRepository.delete(orderId);

  if (!deletedOrder) {
    throw new NotFoundError("Order not found");
  }

  return deletedOrder;
 }

}