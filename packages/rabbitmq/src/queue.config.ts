interface QueueConfig {
  durable: boolean;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
  messageTtl?: number;
}

export const QUEUE_CONFIG: Record<string, QueueConfig> = {
  "order-created": {
    durable: true,
    deadLetterExchange: "dead-letter-exchange",
  },

  "order-placed": {
    durable: true,
    deadLetterExchange: "dead-letter-exchange",
  },

  "payment-initiated": {
    durable: true,
    deadLetterExchange: "dead-letter-exchange",
  },

  "payment-success": {
    durable: true,
    deadLetterExchange: "dead-letter-exchange",
  },

  "payment-failed": {
    durable: true,
    deadLetterExchange: "dead-letter-exchange",
  },

  "notification-order-placed": {
    durable: true,
    deadLetterExchange: "dead-letter-exchange",
  },

  "notification-payment-success": {
    durable: true,
    deadLetterExchange: "dead-letter-exchange",
  },

  "notification-payment-failed": {
    durable: true,
    deadLetterExchange: "dead-letter-exchange",
  },

  // Retry queues
  "notification-order-placed-retry": {
    durable: true,
    messageTtl: 5000,
    deadLetterExchange: "",
    deadLetterRoutingKey: "notification-order-placed",
  },

  "notification-order-placed-dlq": {
    durable: true,
  },

  "notification-payment-success-retry": {
    durable: true,
    messageTtl: 5000,
    deadLetterExchange: "",
    deadLetterRoutingKey: "notification-payment-success",
  },

  "notification-payment-success-dlq": {
    durable: true,
  },

  "notification-payment-failed-retry": {
    durable: true,
    messageTtl: 5000,
    deadLetterExchange: "",
    deadLetterRoutingKey: "notification-payment-failed",
  },

  "notification-payment-failed-dlq": {
    durable: true,
  },

  "payment-initiated-retry": {
    durable: true,
    messageTtl: 5000,
    deadLetterExchange: "",
    deadLetterRoutingKey: "payment-initiated",
},

  "payment-initiated-dlq": {
    durable: true,
},
};