import app from "./app";
import { logger } from "@packages/logger";
import { config } from "@packages/config";

const PORT = config.API_GATEWAY_PORT;

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});