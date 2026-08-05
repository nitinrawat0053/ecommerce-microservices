import app from "./app";
import { logger } from "@packages/logger";
import { config } from "@packages/config";
import {connectDB} from "./config/db";
import { connectRabbitMQ } from "@packages/rabbitmq";
import { startOutboxWorker } from "./workers/outbox.worker";

const PORT = config.ORDER_SERVICE_PORT || 3004;

const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();
  startOutboxWorker();
 
  app.listen(PORT, () => {
  logger.info(`Order Service running on port ${PORT}`);
});
}
startServer();