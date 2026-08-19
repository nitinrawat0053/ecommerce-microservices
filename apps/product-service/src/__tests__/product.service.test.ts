import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRedisGet, mockRedisSet, mockRedisDel, mockRedisKeys, mockProductCreate, mockProductFindAll, mockProductFindById, mockProductUpdate, mockProductReduceStock, mockProductDelete } = vi.hoisted(() => ({
  mockRedisGet: vi.fn(),
  mockRedisSet: vi.fn(),
  mockRedisDel: vi.fn(),
  mockRedisKeys: vi.fn().mockResolvedValue([]),
  mockProductCreate: vi.fn(),
  mockProductFindAll: vi.fn(),
  mockProductFindById: vi.fn(),
  mockProductUpdate: vi.fn(),
  mockProductReduceStock: vi.fn(),
  mockProductDelete: vi.fn(),
}));

vi.mock("@packages/redis", () => ({
  redisClient: { get: mockRedisGet, set: mockRedisSet, del: mockRedisDel, keys: mockRedisKeys },
}));

vi.mock("../repositories/product.repository", () => ({
  ProductRepository: class {
    create = mockProductCreate;
    findAll = mockProductFindAll;
    findById = mockProductFindById;
    update = mockProductUpdate;
    reduceStock = mockProductReduceStock;
    delete = mockProductDelete;
  },
}))

import { ProductService } from "../services/product.service";
import { NotFoundError, BadRequestError } from "@packages/errors";

describe("ProductService", () => {
  let productService: ProductService;

  beforeEach(() => {
    vi.clearAllMocks();
    productService = new ProductService();
  });

  describe("createProduct", () => {
    it("should create a product and clear cache", async () => {
      const productData = { name: "Test", description: "A test product description for testing", price: 29.99, stock: 100, category: "electronics" };
      const createdProduct = { _id: "prod123", ...productData };
      mockProductCreate.mockResolvedValue(createdProduct);
      mockRedisKeys.mockResolvedValue(["products:q1", "products:q2"]);

      const result = await productService.createProduct(productData.name, productData.description, productData.price, productData.stock, productData.category);

      expect(mockProductCreate).toHaveBeenCalledWith(productData);
      expect(mockRedisKeys).toHaveBeenCalledWith("products:*");
      expect(result).toEqual(createdProduct);
    });
  });

  describe("getAllProducts", () => {
    it("should return cached products if available", async () => {
      const cachedData = { products: [{ _id: "p1", name: "Cached" }], pagination: { currentPage: 1, limit: 10, totalProducts: 1, totalPages: 1 } };
      mockRedisGet.mockResolvedValue(JSON.stringify(cachedData));

      const result = await productService.getAllProducts({ page: 1, limit: 10, sort: "createdAt", order: "desc" });

      expect(result).toEqual(cachedData);
      expect(mockProductFindAll).not.toHaveBeenCalled();
    });

    it("should fetch from DB and cache on miss", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockProductFindAll.mockResolvedValue({ products: [{ _id: "p1", name: "DB Product" }], totalProducts: 1 });

      const result = await productService.getAllProducts({ page: 1, limit: 10, sort: "createdAt", order: "desc" });

      expect(mockProductFindAll).toHaveBeenCalled();
      expect(mockRedisSet).toHaveBeenCalled();
      expect(result.products).toHaveLength(1);
    });

    it("should reject invalid minPrice", async () => {
      await expect(productService.getAllProducts({ page: 1, limit: 10, sort: "createdAt", order: "desc", minPrice: -1 })).rejects.toThrow(BadRequestError);
    });

    it("should reject minPrice > maxPrice", async () => {
      await expect(productService.getAllProducts({ page: 1, limit: 10, sort: "createdAt", order: "desc", minPrice: 100, maxPrice: 50 })).rejects.toThrow(BadRequestError);
    });
  });

  describe("getProductById", () => {
    it("should return cached product if available", async () => {
      const cached = { _id: "p1", name: "Cached" };
      mockRedisGet.mockResolvedValue(JSON.stringify(cached));
      const result = await productService.getProductById("p1");
      expect(result).toEqual(cached);
      expect(mockProductFindById).not.toHaveBeenCalled();
    });

    it("should fetch from DB on cache miss", async () => {
      mockRedisGet.mockResolvedValue(null);
      const dbProduct = { _id: "p1", name: "DB Product", toObject: () => ({ _id: "p1", name: "DB Product" }) };
      mockProductFindById.mockResolvedValue(dbProduct);
      const result = await productService.getProductById("p1");
      expect(result).toBe(dbProduct);
      expect(mockRedisSet).toHaveBeenCalled();
    });

    it("should throw NotFoundError", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockProductFindById.mockResolvedValue(null);
      await expect(productService.getProductById("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("reduceStock", () => {
    it("should reduce stock and clear cache", async () => {
      mockProductFindById.mockResolvedValue({ _id: "p1", stock: 50 });
      mockProductReduceStock.mockResolvedValue({ _id: "p1", stock: 48 });
      mockRedisKeys.mockResolvedValue(["products:q1"]);

      await productService.reduceStock("p1", 2);

      expect(mockProductReduceStock).toHaveBeenCalledWith("p1", 2);
      expect(mockRedisDel).toHaveBeenCalledWith("product:p1");
    });

    it("should throw BadRequestError for zero quantity", async () => {
      await expect(productService.reduceStock("p1", 0)).rejects.toThrow(BadRequestError);
    });

    it("should throw NotFoundError if product doesn't exist", async () => {
      mockProductFindById.mockResolvedValue(null);
      await expect(productService.reduceStock("nonexistent", 1)).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateProduct", () => {
    it("should update and clear cache", async () => {
      mockProductUpdate.mockResolvedValue({ _id: "p1", name: "Updated" });
      mockRedisKeys.mockResolvedValue(["products:q1"]);
      const result = await productService.updateProduct("p1", { name: "Updated" });
      expect(result.name).toBe("Updated");
    });

    it("should throw NotFoundError", async () => {
      mockProductUpdate.mockResolvedValue(null);
      await expect(productService.updateProduct("nonexistent", {})).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteProduct", () => {
    it("should delete and clear cache", async () => {
      mockProductDelete.mockResolvedValue({ _id: "p1" });
      mockRedisKeys.mockResolvedValue(["products:q1"]);
      await productService.deleteProduct("p1");
      expect(mockProductDelete).toHaveBeenCalledWith("p1");
    });

    it("should throw NotFoundError", async () => {
      mockProductDelete.mockResolvedValue(null);
      await expect(productService.deleteProduct("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });
});
