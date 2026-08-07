import { PaymentMethod } from "@packages/shared-types";

export interface PaymentInitiatedEvent {
  orderId: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
}