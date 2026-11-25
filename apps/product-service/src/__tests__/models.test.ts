import { describe, it, expect } from "vitest";
import { Brand } from "../models/brand.model";
import { Category } from "../models/category.model";

describe("Product Service - Model Indexing & Constraints", () => {
  describe("Brand Model", () => {
    it("should preserve unique constraint on name field", () => {
      const namePath = Brand.schema.path("name") as any;
      expect(namePath).toBeDefined();
      expect(namePath.options.unique).toBe(true);
      expect(namePath.options.required).toBe(true);
      expect(namePath.options.lowercase).toBe(true);
      expect(namePath.options.trim).toBe(true);
    });

    it("should have exactly one index on name and no duplicate index declarations", () => {
      const indexes = Brand.schema.indexes() as [Record<string, number>, Record<string, any>][];
      const nameIndexes = indexes.filter(([fields]) => "name" in fields);

      // Exactly 1 index on `name`
      expect(nameIndexes).toHaveLength(1);

      // The single index must be the unique index
      const [fields, options] = nameIndexes[0];
      expect(fields).toEqual({ name: 1 });
      expect(options.unique).toBe(true);
    });
  });

  describe("Category Model", () => {
    it("should preserve unique constraint on name field", () => {
      const namePath = Category.schema.path("name") as any;
      expect(namePath).toBeDefined();
      expect(namePath.options.unique).toBe(true);
      expect(namePath.options.required).toBe(true);
      expect(namePath.options.lowercase).toBe(true);
      expect(namePath.options.trim).toBe(true);
    });

    it("should have exactly one index on name and no duplicate index declarations", () => {
      const indexes = Category.schema.indexes() as [Record<string, number>, Record<string, any>][];
      const nameIndexes = indexes.filter(([fields]) => "name" in fields);

      // Exactly 1 index on `name`
      expect(nameIndexes).toHaveLength(1);

      // The single index must be the unique index
      const [fields, options] = nameIndexes[0];
      expect(fields).toEqual({ name: 1 });
      expect(options.unique).toBe(true);
    });
  });
});
