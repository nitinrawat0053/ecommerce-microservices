import type { Request, Response, NextFunction } from "express";
import { AppError } from "@packages/errors";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  console.error("[Notification Service] Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
