import { Order, IOrder } from "../models/order.model";
import { OrderFilters } from "@packages/shared-types";
import { ClientSession } from "mongoose";

export class OrderRepository {

  async create(orderData: Partial<IOrder>, session: ClientSession) {
    const [order] = await Order.create(
      [orderData],
      { session }
    );
    return order;
  }

  async findAll(filters:OrderFilters) {
  const { page, limit, status } = filters;
  const skip = (page - 1) * limit;

  const query: any = {};

  if (status) {
  query.status = status;
}
    const orders = await Order.find(query)
    .collation({
      locale: "en",
      strength: 2,
    })
    .skip(skip)
    .limit(limit);

  const totalOrders = await Order.countDocuments(query);

  return {
    orders,
    totalOrders,
  };
}

  async findById(orderId: string) {
    return await Order.findById(orderId);
  }

  async update(orderId: string, orderData: Partial<IOrder>) {
    return await Order.findByIdAndUpdate(
      orderId,
      orderData,
      { returnDocument: "after", }
    );
  }

  async delete(orderId: string) {
    return await Order.findByIdAndDelete(orderId);
  }

};