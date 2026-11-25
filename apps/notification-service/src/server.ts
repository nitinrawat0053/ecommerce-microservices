import http from "http";
import app from "./app";
import { logger } from "@packages/logger";
import { config } from "@packages/config";
import { connectRabbitMQ } from "@packages/rabbitmq";
import { startNotificationConsumers } from "./consumers/notification.consumer";

const server = http.createServer(app);

const startServer = async () => {
  await connectRabbitMQ();
  await startNotificationConsumers();

  server.listen(config.NOTIFICATION_SERVICE_PORT, () => {
    logger.info(`Notification Service listening on port ${config.NOTIFICATION_SERVICE_PORT}`);
  });
};

startServer().catch((error) => {
  logger.error("❌ Failed to start Notification Service");
  console.error(error);
  process.exit(1);
});
