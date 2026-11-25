import type { Request, Response, NextFunction } from "express";
import { config } from "@packages/config";

export interface AuthenticatedUser {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authenticates user requests passed through the API gateway.
 * Gateway injects verified `x-user-id` and `x-user-role`.
 */
export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userId = (req.headers["x-user-id"] as string | undefined)?.trim();
  const role = (req.headers["x-user-role"] as string | undefined)?.trim() || "CUSTOMER";

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Unauthorized: User not authenticated",
    });
    return;
  }

  req.user = { userId, role };
  next();
};

/**
 * Authenticates internal service-to-service requests.
 * Requires a valid internal secret header (x-internal-secret) or known service key.
 * Prevents unauthorized external callers from triggering raw notification APIs.
 */
export const authenticateInternal = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const secret = (req.headers["x-internal-secret"] as string | undefined)?.trim();
  const expectedSecret =
    process.env.INTERNAL_SERVICE_SECRET || config.JWT_SECRET || "internal-secret";

  if (!secret || secret !== expectedSecret) {
    res.status(403).json({
      success: false,
      message: "Forbidden: Valid internal service secret required",
    });
    return;
  }

  next();
};
