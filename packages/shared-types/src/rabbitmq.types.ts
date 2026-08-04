export const QUEUES = {
  ORDER_CREATED: "order-created",
  ORDER_CREATED_RETRY: "order-created-retry",
  ORDER_CREATED_DLQ: "order-created-dlq",
} as const;

export const EXCHANGES = {
  RETRY: "retry-exchange",
  DEAD_LETTER: "dead-letter-exchange",
} as const;