import app from "./app";
import { logger } from "@packages/logger";
import { config } from "@packages/config";
import {connectDB} from "./config/db";
import { connectRabbitMQ } from "@packages/rabbitmq";
import { startPaymentConsumer } from "./consumers/payment.consumer";
import { startOutboxWorker } from "./workers/outbox.worker";

const PORT = config.PAYMENT_SERVICE_PORT;

const startServer = async () => {
await connectDB();
await connectRabbitMQ();
await startPaymentConsumer();
startOutboxWorker();

app.listen(PORT, () => {
  logger.info(`Payment Service running on port ${PORT}`);
});
}
startServer();