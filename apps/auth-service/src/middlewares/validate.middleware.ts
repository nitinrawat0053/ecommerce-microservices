import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { BadRequestError } from "@packages/errors";


export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");

      return next(new BadRequestError(message));
    }

    req.body = result.data;
    next();
  };
};