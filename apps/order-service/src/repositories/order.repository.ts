import { Order, IOrder } from "../models/order.model";
import { OrderFilters } from "@packages/shared-types";

export class OrderRepository {

  async create(orderData: Partial<IOrder>) {
    return await Order.create(orderData);
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
      { new: true }
    );
  }

  async delete(orderId: string) {
    return await Order.findByIdAndDelete(orderId);
  }

};