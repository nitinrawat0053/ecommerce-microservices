export const QUEUE_CONFIG = {
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
} as const;