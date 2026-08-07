import app from "./app";
import { connectDB } from "./config/db";
import { logger } from "@packages/logger";
import { config } from "@packages/config";
import { consumeOrderPlaced } from "./consumers/order.consumer";
import { connectRabbitMQ } from "@packages/rabbitmq";

const PORT = config.CART_SERVICE_PORT;

const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();
  await consumeOrderPlaced();

  app.listen(PORT, () => {
    logger.info(`Cart Service running on port ${PORT}`);
  });
};

startServer();