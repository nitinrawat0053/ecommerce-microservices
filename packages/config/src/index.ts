import dotenv from "dotenv";
import path from "path";

// Load the root .env file
dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
});

export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",

  API_GATEWAY_PORT: Number(process.env.API_GATEWAY_PORT) || 3000,
  AUTH_SERVICE_PORT: Number(process.env.AUTH_SERVICE_PORT) || 3001,
  USER_SERVICE_PORT: Number(process.env.USER_SERVICE_PORT) || 3002,
  PRODUCT_SERVICE_PORT: Number(process.env.PRODUCT_SERVICE_PORT) || 3003,

  JWT_SECRET: process.env.JWT_SECRET,
  PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL,
  MONGODB_URI: process.env.MONGODB_URI,

  REDIS_URL: process.env.REDIS_URL || "",
}