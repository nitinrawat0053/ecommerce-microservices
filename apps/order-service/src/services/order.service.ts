import { BadRequestError,NotFoundError } from "@packages/errors";
import { OrderStatus } from "@packages/shared-types";
import { OrderRepository } from "../repositories/order.repository";
import {config} from "@packages/config";
import { IOrder } from "../models/order.model";
import { OrderFilters } from "@packages/shared-types";
import axios from "axios";

const orderRepository = new OrderRepository();

export class OrderService {

  private async getProduct(productId: string) {
  try {
    const response = await axios.get(
      `${config.PRODUCT_SERVICE_URL}/api/products/${productId}`
    );

    return response.data.data;
  } catch {
    throw new BadRequestError("Product not found");
  }
}
  async createOrder(userId: string, productId: string, quantity: number) {

    if (quantity <= 0) {
      throw new BadRequestError("Quantity must be greater than 0");
    }

    const product = await this.getProduct(productId);

    if (quantity > product.stock) {
      throw new BadRequestError("Insufficient stock");
    }

    const priceAtPurchase = product.price;

    const totalAmount = priceAtPurchase * quantity;

    return await orderRepository.create({
      userId,
      productId,
      quantity,
      priceAtPurchase,
      totalAmount,
      status: OrderStatus.PENDING,
    });
  }

  async getOrderById(orderId: string) {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  return order;
}
  async getAllOrders(filters: OrderFilters) {
  let { page, limit, status } = filters;

  page = Math.max(page, 1);
  limit = Math.max(limit, 1);
  limit = Math.min(limit, 100);

  const { orders, totalOrders } =
    await orderRepository.findAll({
      page,
      limit,
      status,
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