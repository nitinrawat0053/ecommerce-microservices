import mongoose from "mongoose";
import { config } from "@packages/config";
import { logger } from "@packages/logger";

export const connectDB = async () => {
  try {
    console.log("RabbitMQ URL:", config.RABBITMQ_URL);
    await mongoose.connect(config.MONGODB_URI, {
      // Fail fast instead of relying on driver defaults (server selection
      // 30s, socket timeout 0 = never). The API gateway caps /orders at
      // 15s, so a slow/hung Atlas connection used to stall past that and
      // surface as a 504. These extremes guarantee a DB error is raised
      // well within the gateway's budget and returns as a real 4xx/5xx.
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      maxPoolSize: 10,
    });

    logger.info("MongoDB Connected");
  } catch (error) {
    logger.error(`MongoDB Connection Failed: ${error}`);

    process.exit(1);
  }
};