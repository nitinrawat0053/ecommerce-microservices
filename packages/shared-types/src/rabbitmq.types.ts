export const QUEUES = {
  ORDER_CREATED: "order-created",
  ORDER_PLACED: "order-placed",
  ORDER_CREATED_RETRY: "order-created-retry",
  ORDER_CREATED_DLQ: "order-created-dlq",
} as const;

export const EXCHANGES = {
  RETRY: "retry-exchange",
  DEAD_LETTER: "dead-letter-exchange",
} as const;

export const EVENTS = {
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_PLACED: "ORDER_PLACED",
} as const;