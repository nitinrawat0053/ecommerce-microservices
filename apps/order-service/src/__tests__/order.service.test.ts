import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAxiosGet, mockOrderCreate, mockOrderFindAll, mockOrderFindById, mockOrderUpdate, mockOrderDelete, mockOutboxCreateEvent, mockCommitTransaction, mockAbortTransaction, mockEndSession, mockStartTransaction } = vi.hoisted(() => ({
  mockAxiosGet: vi.fn(),
  mockOrderCreate: vi.fn(),
  mockOrderFindAll: vi.fn(),
  mockOrderFindById: vi.fn(),
  mockOrderUpdate: vi.fn(),
  mockOrderDelete: vi.fn(),
  mockOutboxCreateEvent: vi.fn(),
  mockCommitTransaction: vi.fn(),
  mockAbortTransaction: vi.fn(),
  mockEndSession: vi.fn(),
  mockStartTransaction: vi.fn(),
}));

vi.mock("axios", () => ({ default: { get: mockAxiosGet } }));

vi.mock("mongoose", () => ({
  default: {
    startSession: vi.fn().mockResolvedValue({
      startTransaction: mockStartTransaction,
      commitTransaction: mockCommitTransaction,
      abortTransaction: mockAbortTransaction,
      endSession: mockEndSession,
    }),
  },
}));

vi.mock("../repositories/order.repository", () => ({
  OrderRepository: class {
    create = mockOrderCreate;
    findAll = mockOrderFindAll;
    findById = mockOrderFindById;
    update = mockOrderUpdate;
    delete = mockOrderDelete;
  },
}))

vi.mock("../services/outbox.service", () => ({
  OutboxService: class {
    createEvent = mockOutboxCreateEvent;
  },
}))

vi.mock("@packages/config", () => ({
  config: { PRODUCT_SERVICE_URL: "http://localhost:3003" },
}));

import { OrderService } from "../services/order.service";
import { BadRequestError, NotFoundError } from "@packages/errors";
import { OrderStatus, EVENTS } from "@packages/shared-types";

describe("OrderService", () => {
  let orderService: OrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    orderService = new OrderService();
  });

  describe("createOrder", () => {
    it("should create order and publish outbox events", async () => {
      mockAxiosGet.mockResolvedValue({ data: { data: { price: 100, stock: 50 } } });
      const mockOrder = { id: "order123", userId: "user1", productId: "prod1", quantity: 2, priceAtPurchase: 100, totalAmount: 200, status: OrderStatus.PENDING };
      mockOrderCreate.mockResolvedValue(mockOrder);

      const result = await orderService.createOrder("user1", "prod1", 2, "UPI" as any);

      expect(mockAxiosGet).toHaveBeenCalledWith("http://localhost:3003/api/products/prod1");
      expect(mockOrderCreate).toHaveBeenCalled();
      expect(mockOutboxCreateEvent).toHaveBeenCalledTimes(3);

      const calls = mockOutboxCreateEvent.mock.calls;
      expect(calls[0][0]).toBe(EVENTS.ORDER_CREATED);
      expect(calls[1][0]).toBe(EVENTS.ORDER_PLACED);
      expect(calls[2][0]).toBe(EVENTS.PAYMENT_INITIATED);
      expect(mockCommitTransaction).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it("should throw BadRequestError for zero quantity", async () => {
      await expect(orderService.createOrder("user1", "prod1", 0, "UPI" as any)).rejects.toThrow(BadRequestError);
    });

    it("should throw BadRequestError for insufficient stock", async () => {
      mockAxiosGet.mockResolvedValue({ data: { data: { price: 100, stock: 1 } } });
      await expect(orderService.createOrder("user1", "prod1", 5, "UPI" as any)).rejects.toThrow("Insufficient stock");
    });

    it("should throw BadRequestError if product not found", async () => {
      mockAxiosGet.mockRejectedValue(new Error("Not found"));
      await expect(orderService.createOrder("user1", "prod1", 1, "UPI" as any)).rejects.toThrow("Product not found");
    });

    it("should abort transaction on error", async () => {
      mockAxiosGet.mockResolvedValue({ data: { data: { price: 100, stock: 50 } } });
      mockOrderCreate.mockRejectedValue(new Error("DB error"));
      await expect(orderService.createOrder("user1", "prod1", 2, "UPI" as any)).rejects.toThrow();
      expect(mockAbortTransaction).toHaveBeenCalled();
      expect(mockEndSession).toHaveBeenCalled();
    });
  });

  describe("getOrderById", () => {
    it("should return order if found", async () => {
      mockOrderFindById.mockResolvedValue({ id: "order123", status: OrderStatus.PENDING });
      const result = await orderService.getOrderById("order123");
      expect(result.id).toBe("order123");
    });

    it("should throw NotFoundError", async () => {
      mockOrderFindById.mockResolvedValue(null);
      await expect(orderService.getOrderById("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getAllOrders", () => {
    it("should return paginated orders", async () => {
      mockOrderFindAll.mockResolvedValue({ orders: [{ id: "o1" }, { id: "o2" }], totalOrders: 2 });
      const result = await orderService.getAllOrders({ page: 1, limit: 10 });
      expect(result.orders).toHaveLength(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it("should clamp page and limit values", async () => {
      mockOrderFindAll.mockResolvedValue({ orders: [], totalOrders: 0 });
      await orderService.getAllOrders({ page: -5, limit: 0 });
      expect(mockOrderFindAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 1 }));
    });
  });

  describe("updateOrder", () => {
    it("should update and return order", async () => {
      mockOrderUpdate.mockResolvedValue({ id: "o1", status: OrderStatus.CONFIRMED });
      const result = await orderService.updateOrder("o1", { status: OrderStatus.CONFIRMED });
      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it("should throw NotFoundError", async () => {
      mockOrderUpdate.mockResolvedValue(null);
      await expect(orderService.updateOrder("nonexistent", {})).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteOrder", () => {
    it("should delete order", async () => {
      mockOrderDelete.mockResolvedValue({ id: "o1" });
      await orderService.deleteOrder("o1");
      expect(mockOrderDelete).toHaveBeenCalledWith("o1");
    });

    it("should throw NotFoundError", async () => {
      mockOrderDelete.mockResolvedValue(null);
      await expect(orderService.deleteOrder("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });
});
