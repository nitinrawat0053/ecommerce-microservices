import axios from "axios";
import { config } from "@packages/config";

export interface ProductInfo {
  productId: string;
  name: string;
  image?: string;
  price: number;
}

export class ProductClient {
  async getProduct(productId: string): Promise<ProductInfo | null> {
    try {
      const response = await axios.get(
        `${config.PRODUCT_SERVICE_URL}/api/products/${productId}`,
        {
          headers: { "x-service": "notification-service" },
          timeout: 10000,
        }
      );
      const p = response.data?.data;
      if (!p) return null;
      return {
        productId: p._id || p.id,
        name: p.name || "Product",
        image: p.images?.[0] || p.image || undefined,
        price: p.price || 0,
      };
    } catch (error: any) {
      console.error(
        `❌ [ProductClient] Failed to fetch product ${productId}:`,
        error.message
      );
      return null;
    }
  }
}