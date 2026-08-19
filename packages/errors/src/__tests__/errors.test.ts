import { describe, it, expect } from "vitest";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  isTemporaryError,
} from "../index";

describe("Error Classes", () => {
  describe("AppError", () => {
    it("should create an error with message and statusCode", () => {
      const error = new AppError("Something went wrong", 500);
      expect(error.message).toBe("Something went wrong");
      expect(error.statusCode).toBe(500);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe("BadRequestError", () => {
    it("should default to status 400 and message 'Bad Request'", () => {
      const error = new BadRequestError();
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Bad Request");
    });

    it("should accept a custom message", () => {
      const error = new BadRequestError("Invalid input");
      expect(error.message).toBe("Invalid input");
      expect(error.statusCode).toBe(400);
    });
  });

  describe("UnauthorizedError", () => {
    it("should default to status 401", () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Unauthorized");
    });

    it("should accept a custom message", () => {
      const error = new UnauthorizedError("Token expired");
      expect(error.message).toBe("Token expired");
    });
  });

  describe("ForbiddenError", () => {
    it("should default to status 403", () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Forbidden");
    });
  });

  describe("NotFoundError", () => {
    it("should default to status 404", () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Resource not found");
    });

    it("should accept a custom message", () => {
      const error = new NotFoundError("User not found");
      expect(error.message).toBe("User not found");
      expect(error.statusCode).toBe(404);
    });
  });

  describe("ConflictError", () => {
    it("should default to status 409", () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe("Resource already exists");
    });
  });
});

describe("isTemporaryError", () => {
  it("should return true for MongoNetworkError", () => {
    const error = new Error("MongoNetworkError: connection refused");
    expect(isTemporaryError(error)).toBe(true);
  });

  it("should return true for ECONNREFUSED", () => {
    const error = new Error("connect ECONNREFUSED 127.0.0.1:27017");
    expect(isTemporaryError(error)).toBe(true);
  });

  it("should return true for ETIMEDOUT", () => {
    const error = new Error("connect ETIMEDOUT 10.0.0.1:5672");
    expect(isTemporaryError(error)).toBe(true);
  });

  it("should return true for ECONNRESET", () => {
    const error = new Error("read ECONNRESET");
    expect(isTemporaryError(error)).toBe(true);
  });

  it("should return false for non-temporary errors", () => {
    const error = new Error("Something else went wrong");
    expect(isTemporaryError(error)).toBe(false);
  });

  it("should return false for non-Error values", () => {
    expect(isTemporaryError("string error")).toBe(false);
    expect(isTemporaryError(null)).toBe(false);
    expect(isTemporaryError(undefined)).toBe(false);
    expect(isTemporaryError(42)).toBe(false);
  });
});
