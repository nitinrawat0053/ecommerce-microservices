import axios from "axios";
import { config } from "@packages/config";

export interface OrderEmailDetails {
  orderId: string;
  userId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  totalAmount: number;
  status: string;
  createdAt?: string;
}

export class OrderClient {
  async getOrder(orderId: string): Promise<OrderEmailDetails | null> {
    try {
      const response = await axios.get(
        `${config.ORDER_SERVICE_URL}/api/orders/${orderId}`,
        {
          headers: { "x-service": "notification-service" },
          timeout: 10000,
        }
      );
      return response.data?.data || null;
    } catch (error: any) {
      console.error(
        `❌ [OrderClient] Failed to fetch order ${orderId}:`,
        error.message
      );
      return null;
    }
  }
}