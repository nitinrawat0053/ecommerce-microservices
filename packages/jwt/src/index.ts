import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "@packages/config";

export interface JwtPayload {
  userId: string;
  role: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: "1d",
  });
};

/**
 * Generate a short-lived token (e.g. password reset).
 * @param expiresIn jwt-style duration, e.g. "10m"
 */
export const generateShortLivedToken = (
  payload: JwtPayload,
  expiresIn: SignOptions["expiresIn"]
): string => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
};