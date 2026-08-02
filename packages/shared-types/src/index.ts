export * from "./product.types";
export * from "./order.types";
export * from "./user.types";
export * from "./rabbitmq.types";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
