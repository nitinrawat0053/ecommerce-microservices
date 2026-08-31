import http from "http";
import { logger } from "@packages/logger";
import { config } from "@packages/config";
import { connectRabbitMQ } from "@packages/rabbitmq";
import { startNotificationConsumers } from "./consumers/notification.consumer";

// Minimal HTTP server so the notification service is reachable/health-checkable
// even though it is a consumer-only service.
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "UP",
        service: "notification-service",
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ success: false, message: "Not found" }));
});

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