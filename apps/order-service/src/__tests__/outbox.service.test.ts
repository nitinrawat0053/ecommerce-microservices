import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPublishEvent, mockOutboxCreate, mockOutboxFindPending, mockOutboxMarkAsSent } = vi.hoisted(() => ({
  mockPublishEvent: vi.fn(),
  mockOutboxCreate: vi.fn(),
  mockOutboxFindPending: vi.fn(),
  mockOutboxMarkAsSent: vi.fn(),
}));

vi.mock("@packages/rabbitmq", () => ({
  publishEvent: mockPublishEvent,
}));

vi.mock("../repositories/outbox.repository", () => ({
  OutboxRepository: class {
    create = mockOutboxCreate;
    findPending = mockOutboxFindPending;
    markAsSent = mockOutboxMarkAsSent;
  },
}))

import { OutboxService } from "../services/outbox.service";
import { EVENTS, QUEUES } from "@packages/shared-types";

describe("OutboxService", () => {
  let outboxService: OutboxService;
  const mockSession = { startTransaction: vi.fn() } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    outboxService = new OutboxService();
  });

  describe("createEvent", () => {
    it("should create a PENDING outbox event", async () => {
      mockOutboxCreate.mockResolvedValue({ id: "evt1", eventType: EVENTS.ORDER_CREATED, status: "PENDING" });

      const result = await outboxService.createEvent(EVENTS.ORDER_CREATED, { productId: "p1" }, mockSession);

      expect(mockOutboxCreate).toHaveBeenCalledWith({ eventType: EVENTS.ORDER_CREATED, payload: { productId: "p1" }, status: "PENDING" }, mockSession);
      expect(result.status).toBe("PENDING");
    });
  });

  describe("processPendingEvents", () => {
    it("should publish ORDER_CREATED events", async () => {
      mockOutboxFindPending.mockResolvedValue([{ id: "evt1", eventType: EVENTS.ORDER_CREATED, payload: { productId: "p1" } }]);
      await outboxService.processPendingEvents();
      expect(mockPublishEvent).toHaveBeenCalledWith(QUEUES.ORDER_CREATED, { productId: "p1" });
      expect(mockOutboxMarkAsSent).toHaveBeenCalledWith("evt1");
    });

    it("should publish ORDER_PLACED events", async () => {
      mockOutboxFindPending.mockResolvedValue([{ id: "evt2", eventType: EVENTS.ORDER_PLACED, payload: { orderId: "o1", userId: "u1" } }]);
      await outboxService.processPendingEvents();
      expect(mockPublishEvent).toHaveBeenCalledWith(QUEUES.ORDER_PLACED, { orderId: "o1", userId: "u1" });
    });

    it("should publish PAYMENT_INITIATED events", async () => {
      mockOutboxFindPending.mockResolvedValue([{ id: "evt3", eventType: EVENTS.PAYMENT_INITIATED, payload: { orderId: "o1", amount: 200 } }]);
      await outboxService.processPendingEvents();
      expect(mockPublishEvent).toHaveBeenCalledWith(QUEUES.PAYMENT_INITIATED, { orderId: "o1", amount: 200 });
    });

    it("should process multiple events", async () => {
      mockOutboxFindPending.mockResolvedValue([
        { id: "evt1", eventType: EVENTS.ORDER_CREATED, payload: { productId: "p1" } },
        { id: "evt2", eventType: EVENTS.ORDER_PLACED, payload: { orderId: "o1" } },
        { id: "evt3", eventType: EVENTS.PAYMENT_INITIATED, payload: { orderId: "o1" } },
      ]);
      await outboxService.processPendingEvents();
      expect(mockPublishEvent).toHaveBeenCalledTimes(3);
      expect(mockOutboxMarkAsSent).toHaveBeenCalledTimes(3);
    });

    it("should skip unknown event types", async () => {
      mockOutboxFindPending.mockResolvedValue([{ id: "evt4", eventType: "UNKNOWN", payload: {} }]);
      await outboxService.processPendingEvents();
      expect(mockPublishEvent).not.toHaveBeenCalled();
    });

    it("should continue if one event fails", async () => {
      mockOutboxFindPending.mockResolvedValue([
        { id: "evt1", eventType: EVENTS.ORDER_CREATED, payload: { productId: "p1" } },
        { id: "evt2", eventType: EVENTS.ORDER_PLACED, payload: { orderId: "o1" } },
      ]);
      mockPublishEvent.mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce(undefined);

      await outboxService.processPendingEvents();
      expect(mockPublishEvent).toHaveBeenCalledTimes(2);
      expect(mockOutboxMarkAsSent).toHaveBeenCalledWith("evt2");
    });
  });

  describe("getPendingEvents", () => {
    it("should return pending events", async () => {
      mockOutboxFindPending.mockResolvedValue([{ id: "evt1", status: "PENDING" }]);
      const result = await outboxService.getPendingEvents();
      expect(result).toHaveLength(1);
    });
  });

  describe("markEventAsSent", () => {
    it("should mark event as sent", async () => {
      mockOutboxMarkAsSent.mockResolvedValue({ id: "evt1", status: "SENT" });
      const result = await outboxService.markEventAsSent("evt1");
      expect(result.status).toBe("SENT");
    });
  });
});
