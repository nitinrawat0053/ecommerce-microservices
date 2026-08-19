import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @packages/config before importing jwt
vi.mock("@packages/config", () => ({
  config: {
    JWT_SECRET: "test-secret-key-for-testing",
  },
}));

import { generateToken, verifyToken } from "../index";

describe("JWT Package", () => {
  describe("generateToken", () => {
    it("should generate a valid token string", () => {
      const token = generateToken({ userId: "user123", role: "USER" });
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    it("should generate different tokens for different payloads", () => {
      const token1 = generateToken({ userId: "user1", role: "USER" });
      const token2 = generateToken({ userId: "user2", role: "ADMIN" });
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifyToken", () => {
    it("should verify and decode a valid token", () => {
      const payload = { userId: "user123", role: "USER" };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe("user123");
      expect(decoded.role).toBe("USER");
    });

    it("should verify admin tokens", () => {
      const token = generateToken({ userId: "admin1", role: "ADMIN" });
      const decoded = verifyToken(token);
      expect(decoded.role).toBe("ADMIN");
    });

    it("should throw for invalid token", () => {
      expect(() => verifyToken("invalid.token.here")).toThrow();
    });

    it("should throw for token signed with wrong secret", () => {
      const jwt = require("jsonwebtoken");
      const wrongToken = jwt.sign(
        { userId: "user123", role: "USER" },
        "wrong-secret"
      );
      expect(() => verifyToken(wrongToken)).toThrow();
    });

    it("should throw for empty string", () => {
      expect(() => verifyToken("")).toThrow();
    });
  });
});
