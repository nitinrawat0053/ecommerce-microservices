import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters"),

  price: z
    .number()
    .min(0, "Price cannot be negative"),

  stock: z
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),

  category: z
    .string()
    .min(2, "Category is required"),

  imageUrl: z
    .string()
    .url("Invalid image URL")
    .optional(),
});