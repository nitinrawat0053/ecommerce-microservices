import app from "./app";
import { logger } from "@packages/logger";
import { config } from "@packages/config";
import {connectDB} from "./config/db";

const PORT = config.PRODUCT_SERVICE_PORT || 3003;

const startServer = async () => {
  await connectDB();

 app.listen(PORT, () => {
  logger.info(`Product Service running on port ${PORT}`);
});
}
startServer();