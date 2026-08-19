import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRedisGet, mockRedisSet, mockRedisDel, mockCartCreate, mockCartFindByUserId, mockCartIncreaseQuantity, mockCartAddNewItem, mockCartUpdateQuantity, mockCartRemoveFromCart, mockCartClearCart } = vi.hoisted(() => ({
  mockRedisGet: vi.fn(),
  mockRedisSet: vi.fn(),
  mockRedisDel: vi.fn(),
  mockCartCreate: vi.fn(),
  mockCartFindByUserId: vi.fn(),
  mockCartIncreaseQuantity: vi.fn(),
  mockCartAddNewItem: vi.fn(),
  mockCartUpdateQuantity: vi.fn(),
  mockCartRemoveFromCart: vi.fn(),
  mockCartClearCart: vi.fn(),
}));

vi.mock("@packages/redis", () => ({
  redisClient: { get: mockRedisGet, set: mockRedisSet, del: mockRedisDel },
}));

vi.mock("../repositories/cart.repository", () => ({
  CartRepository: class {
    createCart = mockCartCreate;
    findByUserId = mockCartFindByUserId;
    increaseQuantity = mockCartIncreaseQuantity;
    addNewItem = mockCartAddNewItem;
    updateQuantity = mockCartUpdateQuantity;
    removeFromCart = mockCartRemoveFromCart;
    clearCart = mockCartClearCart;
  },
}))

import { CartService } from "../services/cart.service";
import { BadRequestError, NotFoundError } from "@packages/errors";

describe("CartService", () => {
  let cartService: CartService;

  beforeEach(() => {
    vi.clearAllMocks();
    cartService = new CartService();
  });

  describe("addToCart", () => {
    it("should create cart if none exists and add item", async () => {
      mockCartFindByUserId.mockResolvedValue(null);
      mockCartCreate.mockResolvedValue({ userId: "user1", items: [] });
      mockCartIncreaseQuantity.mockResolvedValue(null);
      mockCartAddNewItem.mockResolvedValue({ userId: "user1", items: [{ productId: "p1", quantity: 2 }] });

      const result = await cartService.addToCart("user1", "p1", 2);

      expect(mockCartCreate).toHaveBeenCalledWith("user1");
      expect(mockRedisDel).toHaveBeenCalledWith("cart:user1");
      expect(result.items).toHaveLength(1);
    });

    it("should increase quantity if item already in cart", async () => {
      mockCartFindByUserId.mockResolvedValue({ userId: "user1", items: [{ productId: "p1", quantity: 1 }] });
      mockCartIncreaseQuantity.mockResolvedValue({ userId: "user1", items: [{ productId: "p1", quantity: 3 }] });

      const result = await cartService.addToCart("user1", "p1", 2);

      expect(mockCartIncreaseQuantity).toHaveBeenCalledWith("user1", "p1", 2);
      expect(mockCartAddNewItem).not.toHaveBeenCalled();
      expect(result.items[0].quantity).toBe(3);
    });

    it("should throw BadRequestError for zero quantity", async () => {
      await expect(cartService.addToCart("user1", "p1", 0)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError for negative quantity", async () => {
      await expect(cartService.addToCart("user1", "p1", -1)).rejects.toThrow(BadRequestError);
    });
  });

  describe("getCart", () => {
    it("should return cached cart if available", async () => {
      const cached = { userId: "user1", items: [{ productId: "p1", quantity: 2 }] };
      mockRedisGet.mockResolvedValue(JSON.stringify(cached));

      const result = await cartService.getCart("user1");
      expect(result).toEqual(cached);
      expect(mockCartFindByUserId).not.toHaveBeenCalled();
    });

    it("should fetch from DB and cache on miss", async () => {
      mockRedisGet.mockResolvedValue(null);
      const dbCart = { userId: "user1", items: [{ productId: "p1", quantity: 2 }] };
      mockCartFindByUserId.mockResolvedValue(dbCart);

      const result = await cartService.getCart("user1");
      expect(mockRedisSet).toHaveBeenCalledWith("cart:user1", JSON.stringify(dbCart), "EX", 3600);
      expect(result).toEqual(dbCart);
    });

    it("should throw NotFoundError", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockCartFindByUserId.mockResolvedValue(null);
      await expect(cartService.getCart("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateQuantity", () => {
    it("should update quantity and invalidate cache", async () => {
      mockCartUpdateQuantity.mockResolvedValue({ userId: "user1", items: [{ productId: "p1", quantity: 5 }] });
      const result = await cartService.updateQuantity("user1", "p1", 5);
      expect(mockRedisDel).toHaveBeenCalledWith("cart:user1");
      expect(result.items[0].quantity).toBe(5);
    });

    it("should throw BadRequestError for zero quantity", async () => {
      await expect(cartService.updateQuantity("user1", "p1", 0)).rejects.toThrow(BadRequestError);
    });

    it("should throw NotFoundError if product not in cart", async () => {
      mockCartUpdateQuantity.mockResolvedValue(null);
      await expect(cartService.updateQuantity("user1", "nonexistent", 5)).rejects.toThrow(NotFoundError);
    });
  });

  describe("removeFromCart", () => {
    it("should remove item and invalidate cache", async () => {
      mockCartRemoveFromCart.mockResolvedValue({ userId: "user1", items: [] });
      const result = await cartService.removeFromCart("user1", "p1");
      expect(mockRedisDel).toHaveBeenCalledWith("cart:user1");
      expect(result.items).toHaveLength(0);
    });

    it("should throw NotFoundError", async () => {
      mockCartRemoveFromCart.mockResolvedValue(null);
      await expect(cartService.removeFromCart("nonexistent", "p1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("clearCart", () => {
    it("should clear cart and invalidate cache", async () => {
      mockCartClearCart.mockResolvedValue({ userId: "user1", items: [] });
      const result = await cartService.clearCart("user1");
      expect(mockRedisDel).toHaveBeenCalledWith("cart:user1");
      expect(result.items).toHaveLength(0);
    });

    it("should return null if cart doesn't exist", async () => {
      mockCartClearCart.mockResolvedValue(null);
      const result = await cartService.clearCart("nonexistent");
      expect(result).toBeNull();
    });
  });
});
