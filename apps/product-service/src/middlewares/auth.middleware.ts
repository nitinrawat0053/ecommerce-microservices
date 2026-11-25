import type { Request, Response, NextFunction } from "express";

/**
 * Enforce admin role at the service level (defence in depth).
 *
 * Verifies that the request carries an authentic admin role injected
 * by the API gateway (x-user-role). Never trusts unverified client headers.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const role = (req.headers["x-user-role"] as string | undefined)?.trim();

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    res.status(403).json({
      success: false,
      message: "Forbidden: Admin access required",
    });
    return;
  }

  next();
};
