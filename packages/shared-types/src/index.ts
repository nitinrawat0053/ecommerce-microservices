export * from "./product.types";
export * from "./order.types";
export * from "./user.types";
export * from "./rabbitmq.types";
export * from "./payment-status";
export * from "./payment-method";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
