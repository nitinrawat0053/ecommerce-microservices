import { logger } from "@packages/logger";
import { connectRabbitMQ } from "@packages/rabbitmq";
import { startNotificationConsumers } from "./consumers/notification.consumer";

const startServer = async () => {
  await connectRabbitMQ();
  await startNotificationConsumers();

  logger.info("Notification Service started");
};

startServer().catch((error) => {
  logger.error("❌ Failed to start Notification Service");
    console.error(error);
  process.exit(1);
});