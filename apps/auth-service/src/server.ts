import app from "./app";
import {logger} from "@packages/logger";
import { config } from "@packages/config";
import {connectDB} from "./db/connectDB";

const PORT = config.AUTH_SERVICE_PORT || 3001;

const startServer = async () => {
  await connectDB();

app.listen(PORT, () => {
  logger.info(`Auth Service running on port ${PORT}`);
});
}
startServer();