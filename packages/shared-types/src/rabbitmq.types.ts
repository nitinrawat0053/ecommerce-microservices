export const QUEUES = {
  ORDER_CREATED: "order-created",
  ORDER_PLACED: "order-placed",
  ORDER_CREATED_RETRY: "order-created-retry",
  ORDER_CREATED_DLQ: "order-created-dlq",
  
  PAYMENT_INITIATED:"payment-initiated",
  PAYMENT_SUCCESS:"payment-success",
  PAYMENT_FAILED:"payment-failed",

  NOTIFICATION_ORDER_PLACED: "notification-order-placed",
  NOTIFICATION_PAYMENT_SUCCESS: "notification-payment-success",
  NOTIFICATION_PAYMENT_FAILED: "notification-payment-failed",
} as const;

export const EXCHANGES = {
  RETRY: "retry-exchange",
  DEAD_LETTER: "dead-letter-exchange",
  EVENTS: "event-exchange",
} as const;

export const EVENTS = {
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_PLACED: "ORDER_PLACED",
  PAYMENT_INITIATED:"payment-initiated",
  PAYMENT_SUCCESS:"payment-success",
  PAYMENT_FAILED:"payment-failed",
} as const;

export interface OrderPlacedEvent {
  orderId: string;
  userId: string;
}

export interface PaymentSuccessEvent {
  orderId: string;
  userId: string;
  transactionId: string;
}

export interface PaymentFailedEvent {
  orderId: string;
  userId: string;
}