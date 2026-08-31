import { Category } from "../models/category.model";
import { logger } from "@packages/logger";

const DEFAULT_CATEGORIES = [
  { name: "Electronics", icon: "📱" },
  { name: "Fashion", icon: "👗" },
  { name: "Home & Kitchen", icon: "🏠" },
  { name: "Beauty", icon: "✨" },
  { name: "Sports", icon: "🏋️" },
  { name: "Books", icon: "📚" },
  { name: "Furniture", icon: "🪑" },
  { name: "Kids & Baby", icon: "👶" },
  { name: "Pet Supplies", icon: "🐾" },
  { name: "Auto", icon: "🚗" },
];

/**
 * Idempotently creates the default product categories on startup. Uses upserts so
 * existing categories are never duplicated or overwritten. This makes the default
 * categories real DB records (with `_id`s), so they can be managed (edited/deleted)
 * from the admin and super-admin Category pages instead of only existing as a
 * frontend fallback list.
 */
export async function seedDefaultCategories() {
  try {
    const operations = DEFAULT_CATEGORIES.map((c) => ({
      updateOne: {
        filter: { name: c.name.toLowerCase().trim() },
        update: { $setOnInsert: { name: c.name.toLowerCase().trim(), icon: c.icon } },
        upsert: true,
      },
    }));

    await Category.bulkWrite(operations, { ordered: false });
    logger.info("Default categories seeded successfully");
  } catch (error: any) {
    logger.error(`Categories seed failed: ${error?.message || error}`);
  }
}
