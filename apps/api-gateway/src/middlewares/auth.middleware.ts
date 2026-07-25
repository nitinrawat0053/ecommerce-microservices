import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@packages/jwt";
import { UnauthorizedError } from "@packages/errors";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authentication token is missing or invalid");
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);

    req.user = payload;

    next();
 } catch (error) {
    throw new UnauthorizedError("Invalid or expired token");
 }
};