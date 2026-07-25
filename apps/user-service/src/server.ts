import app from "./app";
import { logger } from "@packages/logger";
import { config } from "@packages/config";
import {connectDB} from "./config/db";

const PORT = config.USER_SERVICE_PORT || 3002;

const startServer = async () => {
  await connectDB();
app.listen(PORT, () => {
  logger.info(`User Service running on port ${PORT}`);
});
}
startServer();