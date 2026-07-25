import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "@packages/errors";

export const authorize = (roles: string[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      throw new ForbiddenError("Access denied");
    }

    next();
  };
};