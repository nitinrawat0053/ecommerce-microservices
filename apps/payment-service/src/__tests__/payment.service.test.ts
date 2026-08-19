import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRazorpayCreateOrder, mockRazorpayVerifySignature, mockPaymentCreate, mockPaymentFindByOrderId, mockPaymentFindById, mockPaymentFindByUserId, mockPaymentFindByRazorpayOrderId, mockPaymentUpdateStatus, mockPaymentUpdateRazorpayOrderId, mockOutboxCreateEvent, mockCommitTransaction, mockAbortTransaction, mockEndSession } = vi.hoisted(() => ({
  mockRazorpayCreateOrder: vi.fn(),
  mockRazorpayVerifySignature: vi.fn(),
  mockPaymentCreate: vi.fn(),
  mockPaymentFindByOrderId: vi.fn(),
  mockPaymentFindById: vi.fn(),
  mockPaymentFindByUserId: vi.fn(),
  mockPaymentFindByRazorpayOrderId: vi.fn(),
  mockPaymentUpdateStatus: vi.fn(),
  mockPaymentUpdateRazorpayOrderId: vi.fn(),
  mockOutboxCreateEvent: vi.fn(),
  mockCommitTransaction: vi.fn(),
  mockAbortTransaction: vi.fn(),
  mockEndSession: vi.fn(),
}));

vi.mock("../providers/razorpay.provider", () => ({
  razorpayProvider: { createOrder: mockRazorpayCreateOrder, verifyPaymentSignature: mockRazorpayVerifySignature },
}));

vi.mock("mongoose", () => ({
  default: {
    startSession: vi.fn().mockResolvedValue({
      startTransaction: vi.fn(), commitTransaction: mockCommitTransaction, abortTransaction: mockAbortTransaction, endSession: mockEndSession,
    }),
  },
}));

vi.mock("../repositories/payment.repository", () => ({
  PaymentRepository: class {
    create = mockPaymentCreate;
    findById = mockPaymentFindById;
    findByOrderId = mockPaymentFindByOrderId;
    findByUserId = mockPaymentFindByUserId;
    findByRazorpayOrderId = mockPaymentFindByRazorpayOrderId;
    updateStatus = mockPaymentUpdateStatus;
    updateRazorpayOrderId = mockPaymentUpdateRazorpayOrderId;
  },
}))

vi.mock("../services/outbox.service", () => ({
  OutboxService: class {
    createEvent = mockOutboxCreateEvent;
  },
}))

vi.mock("@packages/config", () => ({
  config: { RAZORPAY_KEY_ID: "test_key", RAZORPAY_KEY_SECRET: "test_secret", RAZORPAY_WEBHOOK_SECRET: "webhook_secret", LOAD_TEST: "" },
}));

import { PaymentService } from "../services/payment.service";
import { NotFoundError } from "@packages/errors";
import { PaymentStatus, PaymentMethod, EVENTS } from "@packages/shared-types";

describe("PaymentService", () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    vi.clearAllMocks();
    paymentService = new PaymentService();
  });

  describe("processPayment", () => {
    it("should create payment record and Razorpay order", async () => {
      mockPaymentFindByOrderId.mockResolvedValue(null);
      const mockPayment = { id: "pay1", orderId: "order1", userId: "user1", amount: 200, status: PaymentStatus.PENDING };
      mockPaymentCreate.mockResolvedValue(mockPayment);
      mockRazorpayCreateOrder.mockResolvedValue({ id: "rzp_order_123" });
      mockPaymentUpdateRazorpayOrderId.mockResolvedValue({ ...mockPayment, razorpayOrderId: "rzp_order_123" });

      const result = await paymentService.processPayment("order1", "user1", 200, PaymentMethod.UPI);

      expect(mockPaymentCreate).toHaveBeenCalled();
      expect(mockRazorpayCreateOrder).toHaveBeenCalledWith(200, "INR", "order1");
      expect(result.razorpayOrderId).toBe("rzp_order_123");
    });

    it("should skip if payment already has Razorpay order", async () => {
      const existing = { id: "pay1", razorpayOrderId: "rzp_existing", status: PaymentStatus.PENDING };
      mockPaymentFindByOrderId.mockResolvedValue(existing);
      const result = await paymentService.processPayment("order1", "user1", 200, PaymentMethod.UPI);
      expect(mockPaymentCreate).not.toHaveBeenCalled();
      expect(result).toEqual(existing);
    });
  });

  describe("getPayment", () => {
    it("should return payment if found", async () => {
      mockPaymentFindById.mockResolvedValue({ id: "pay1", status: PaymentStatus.SUCCESS });
      const result = await paymentService.getPayment("pay1");
      expect(result.id).toBe("pay1");
    });

    it("should throw NotFoundError", async () => {
      mockPaymentFindById.mockResolvedValue(null);
      await expect(paymentService.getPayment("nonexistent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getOrderPayment", () => {
    it("should return payment for order", async () => {
      mockPaymentFindByOrderId.mockResolvedValue({ id: "pay1", orderId: "order1" });
      const result = await paymentService.getOrderPayment("order1");
      expect(result.orderId).toBe("order1");
    });

    it("should throw NotFoundError", async () => {
      mockPaymentFindByOrderId.mockResolvedValue(null);
      await expect(paymentService.getOrderPayment("no-order")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getUserPayments", () => {
    it("should return all payments for user", async () => {
      mockPaymentFindByUserId.mockResolvedValue([{ id: "pay1" }, { id: "pay2" }]);
      const result = await paymentService.getUserPayments("user1");
      expect(result).toHaveLength(2);
    });
  });

  describe("verifyPayment", () => {
    it("should verify valid payment and publish success event", async () => {
      const mockPayment = { id: "pay1", orderId: "order1", userId: "user1", razorpayOrderId: "rzp_123", status: PaymentStatus.PENDING };
      mockPaymentFindByRazorpayOrderId.mockResolvedValue(mockPayment);
      mockRazorpayVerifySignature.mockReturnValue(true);
      mockPaymentUpdateStatus.mockResolvedValue({ ...mockPayment, status: PaymentStatus.SUCCESS });

      await paymentService.verifyPayment("rzp_123", "pay_456", "signature");

      expect(mockRazorpayVerifySignature).toHaveBeenCalledWith("rzp_123", "pay_456", "signature");
      expect(mockOutboxCreateEvent).toHaveBeenCalledWith(
        EVENTS.PAYMENT_SUCCESS,
        expect.objectContaining({ orderId: "order1", userId: "user1" }),
        expect.anything()
      );
    });

    it("should skip if payment already successful", async () => {
      mockPaymentFindByRazorpayOrderId.mockResolvedValue({ id: "pay1", status: PaymentStatus.SUCCESS, razorpayOrderId: "rzp_123" });
      const result = await paymentService.verifyPayment("rzp_123", "pay_456", "sig");
      expect(mockRazorpayVerifySignature).not.toHaveBeenCalled();
    });

    it("should throw for invalid signature", async () => {
      mockPaymentFindByRazorpayOrderId.mockResolvedValue({ id: "pay1", razorpayOrderId: "rzp_123", status: PaymentStatus.PENDING });
      mockRazorpayVerifySignature.mockReturnValue(false);
      await expect(paymentService.verifyPayment("rzp_123", "pay_456", "bad-sig")).rejects.toThrow("Invalid payment signature");
    });

    it("should throw NotFoundError", async () => {
      mockPaymentFindByRazorpayOrderId.mockResolvedValue(null);
      await expect(paymentService.verifyPayment("nonexistent", "pay_456", "sig")).rejects.toThrow(NotFoundError);
    });
  });

  describe("processWebhookEvent", () => {
    it("should handle payment.captured", async () => {
      const mockPayment = { id: "pay1", orderId: "order1", userId: "user1", razorpayOrderId: "rzp_123", status: PaymentStatus.PENDING };
      mockPaymentFindByRazorpayOrderId.mockResolvedValue(mockPayment);
      mockPaymentUpdateStatus.mockResolvedValue(mockPayment);

      await paymentService.processWebhookEvent({
        event: "payment.captured",
        payload: { payment: { entity: { order_id: "rzp_123", id: "pay_rzp_456" } } },
      });

      expect(mockPaymentUpdateStatus).toHaveBeenCalledWith("pay1", PaymentStatus.SUCCESS, "pay_rzp_456", undefined, expect.anything());
      expect(mockOutboxCreateEvent).toHaveBeenCalled();
    });

    it("should handle payment.failed", async () => {
      const mockPayment = { id: "pay1", orderId: "order1", userId: "user1", razorpayOrderId: "rzp_123", status: PaymentStatus.PENDING };
      mockPaymentFindByRazorpayOrderId.mockResolvedValue(mockPayment);
      mockPaymentUpdateStatus.mockResolvedValue(mockPayment);

      await paymentService.processWebhookEvent({
        event: "payment.failed",
        payload: { payment: { entity: { order_id: "rzp_123", id: "pay_rzp_789", error_description: "Insufficient funds" } } },
      });

      expect(mockPaymentUpdateStatus).toHaveBeenCalledWith("pay1", PaymentStatus.FAILED, "pay_rzp_789", "Insufficient funds", expect.anything());
    });

    it("should skip if payment already successful", async () => {
      mockPaymentFindByRazorpayOrderId.mockResolvedValue({ id: "pay1", status: PaymentStatus.SUCCESS, razorpayOrderId: "rzp_123" });
      await paymentService.processWebhookEvent({
        event: "payment.captured",
        payload: { payment: { entity: { order_id: "rzp_123", id: "pay_456" } } },
      });
      expect(mockPaymentUpdateStatus).not.toHaveBeenCalled();
    });

    it("should ignore events without payment entity", async () => {
      await paymentService.processWebhookEvent({ event: "payment.captured", payload: {} });
      expect(mockPaymentFindByRazorpayOrderId).not.toHaveBeenCalled();
    });
  });
});
