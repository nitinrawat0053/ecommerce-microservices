import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  verifyPhoneSchema,
} from "../auth.schema";
import { createProductSchema } from "../product.schema";
import { createOrderSchema } from "../order.schema";

describe("Auth Validation Schemas", () => {
  describe("registerSchema", () => {
    it("should accept valid registration data", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phone: "+1234567890",
      });
      expect(result.success).toBe(true);
    });

    it("should reject short name", () => {
      const result = registerSchema.safeParse({
        name: "J",
        email: "john@example.com",
        password: "password123",
        phone: "+1234567890",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "not-an-email",
        password: "password123",
        phone: "+1234567890",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "1234567",
        phone: "+1234567890",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short phone", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phone: "123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing fields", () => {
      const result = registerSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login data", () => {
      const result = loginSchema.safeParse({
        email: "john@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = loginSchema.safeParse({
        email: "bad",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const result = loginSchema.safeParse({
        email: "john@example.com",
        password: "1234567",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("verifyPhoneSchema", () => {
    it("should accept valid phone verification", () => {
      const result = verifyPhoneSchema.safeParse({
        phone: "+1234567890",
        code: "123456",
      });
      expect(result.success).toBe(true);
    });

    it("should reject code that is not 6 digits", () => {
      const result = verifyPhoneSchema.safeParse({
        phone: "+1234567890",
        code: "123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short phone", () => {
      const result = verifyPhoneSchema.safeParse({
        phone: "123",
        code: "123456",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Product Validation Schemas", () => {
  describe("createProductSchema", () => {
    it("should accept valid product data", () => {
      const result = createProductSchema.safeParse({
        name: "Test Product",
        description: "A great test product for testing",
        price: 29.99,
        stock: 100,
        category: "electronics",
      });
      expect(result.success).toBe(true);
    });

    it("should accept product with optional imageUrl", () => {
      const result = createProductSchema.safeParse({
        name: "Test Product",
        description: "A great test product for testing",
        price: 29.99,
        stock: 100,
        category: "electronics",
        imageUrl: "https://example.com/image.png",
      });
      expect(result.success).toBe(true);
    });

    it("should reject negative price", () => {
      const result = createProductSchema.safeParse({
        name: "Test Product",
        description: "A great test product for testing",
        price: -10,
        stock: 100,
        category: "electronics",
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer stock", () => {
      const result = createProductSchema.safeParse({
        name: "Test Product",
        description: "A great test product for testing",
        price: 29.99,
        stock: 10.5,
        category: "electronics",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative stock", () => {
      const result = createProductSchema.safeParse({
        name: "Test Product",
        description: "A great test product for testing",
        price: 29.99,
        stock: -5,
        category: "electronics",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short description", () => {
      const result = createProductSchema.safeParse({
        name: "Test Product",
        description: "Short",
        price: 29.99,
        stock: 100,
        category: "electronics",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid imageUrl", () => {
      const result = createProductSchema.safeParse({
        name: "Test Product",
        description: "A great test product for testing",
        price: 29.99,
        stock: 100,
        category: "electronics",
        imageUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("Order Validation Schemas", () => {
  describe("createOrderSchema", () => {
    it("should accept valid order data", () => {
      const result = createOrderSchema.safeParse({
        productId: "507f1f77bcf86cd799439011",
        quantity: 2,
        paymentMethod: "UPI",
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity", () => {
      const result = createOrderSchema.safeParse({
        productId: "507f1f77bcf86cd799439011",
        quantity: 0,
        paymentMethod: "UPI",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = createOrderSchema.safeParse({
        productId: "507f1f77bcf86cd799439011",
        quantity: -1,
        paymentMethod: "UPI",
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer quantity", () => {
      const result = createOrderSchema.safeParse({
        productId: "507f1f77bcf86cd799439011",
        quantity: 1.5,
        paymentMethod: "UPI",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty productId", () => {
      const result = createOrderSchema.safeParse({
        productId: "",
        quantity: 1,
        paymentMethod: "UPI",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid payment method", () => {
      const result = createOrderSchema.safeParse({
        productId: "507f1f77bcf86cd799439011",
        quantity: 1,
        paymentMethod: "BITCOIN",
      });
      expect(result.success).toBe(false);
    });
  });
});
