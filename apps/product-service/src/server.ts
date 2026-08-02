import app from "./app";
import { logger } from "@packages/logger";
import { config } from "@packages/config";
import {connectDB} from "./config/db";
import { connectRabbitMQ } from "@packages/rabbitmq";
import { consumeOrderCreated } from "./consumers/order.consumer";

const PORT = config.PRODUCT_SERVICE_PORT;

const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();
  await consumeOrderCreated();

 app.listen(PORT, () => {
  logger.info(`Product Service running on port ${PORT}`);
});
}
startServer();