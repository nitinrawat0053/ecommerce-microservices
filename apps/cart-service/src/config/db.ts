import mongoose from "mongoose";
import { config } from "@packages/config";
import { logger } from "@packages/logger";

export const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);

    logger.info("MongoDB Connected");
  } catch (error) {
    logger.error(`MongoDB Connection Failed", ${error}`);
    process.exit(1);
  }
};
