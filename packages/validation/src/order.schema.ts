import { z } from "zod";
import { PaymentMethod } from "@packages/shared-types";

export const createOrderSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),

  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),

  paymentMethod: z.nativeEnum(PaymentMethod),
});