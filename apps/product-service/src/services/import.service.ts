import { BadRequestError } from "@packages/errors";
import { Product } from "../models/product.model";
import { cloudinary } from "../config/cloudinary";
import { redisClient } from "@packages/redis";
import { parse } from "csv-parse/sync";

export interface ImportRow {
  rowNumber: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageFile?: Express.Multer.File;
  imageName?: string;
}

export interface ValidatedRow extends ImportRow {
  errors: string[];
  valid: boolean;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failureCount: number;
  results: { rowNumber: number; productId?: string; error?: string }[];
}

export class ImportService {
  /**
   * Parse CSV buffer into ImportRow objects
   */
  parseCsv(csvBuffer: Buffer): ImportRow[] {
    const content = csvBuffer.toString("utf-8");

    let records: any[];
    try {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } catch (err: any) {
      throw new BadRequestError(`CSV parsing error: ${err.message}`);
    }

    if (records.length === 0) {
      throw new BadRequestError("CSV file is empty or has no valid rows");
    }

    // Validate required headers
    const requiredHeaders = ["name", "description", "price", "stock", "category"];
    const headers = Object.keys(records[0]).map((h) => h.toLowerCase().trim());
    const missing = requiredHeaders.filter(
      (h) => !headers.includes(h)
    );
    if (missing.length > 0) {
      throw new BadRequestError(
        `Missing required columns: ${missing.join(", ")}. Required columns: name, description, price, stock, category, imageUrl (optional)`
      );
    }

    return records.map((record: any, index: number) => {
      const get = (key: string) => {
        const k = Object.keys(record).find(
          (h) => h.toLowerCase().trim() === key
        );
        return k ? record[k] : "";
      };

      return {
        rowNumber: index + 2, // +2 because row 1 is header, 0-indexed
        name: get("name"),
        description: get("description"),
        price: parseFloat(get("price")) || 0,
        stock: parseInt(get("stock"), 10) || 0,
        category: get("category"),
        imageUrl: get("imageUrl") || "",
      };
    });
  }

  /**
   * Validate all rows and return with errors
   */
  validateRows(rows: ImportRow[]): ValidatedRow[] {
    const validCategories = [
      "electronics",
      "fashion",
      "home & kitchen",
      "beauty",
      "sports",
      "books",
      "furniture",
      "kids & baby",
      "pet supplies",
      "auto",
    ];

    return rows.map((row) => {
      const errors: string[] = [];

      if (!row.name || row.name.trim().length === 0) {
        errors.push("Name is required");
      } else if (row.name.length > 200) {
        errors.push("Name must be 200 characters or less");
      }

      if (!row.description || row.description.trim().length === 0) {
        errors.push("Description is required");
      } else if (row.description.length > 2000) {
        errors.push("Description must be 2000 characters or less");
      }

      if (isNaN(row.price) || row.price <= 0) {
        errors.push("Price must be a positive number");
      } else if (row.price > 9999999) {
        errors.push("Price cannot exceed 9,999,999");
      }

      if (isNaN(row.stock) || row.stock < 0) {
        errors.push("Stock must be a non-negative integer");
      }

      if (!row.category || row.category.trim().length === 0) {
        errors.push("Category is required");
      } else if (
        !validCategories.includes(row.category.toLowerCase().trim())
      ) {
        errors.push(
          `Invalid category. Must be one of: ${validCategories.join(", ")}`
        );
      }

      return {
        ...row,
        errors,
        valid: errors.length === 0,
      };
    });
  }

  /**
   * Upload a single image buffer to Cloudinary
   */
  async uploadImage(
    file: Express.Multer.File
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "products",
          resource_type: "image",
          transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            reject(
              new BadRequestError(
                `Image upload failed: ${error.message || "Unknown error"}`
              )
            );
          } else if (result) {
            resolve(result.secure_url);
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * Bulk insert validated products
   */
  async bulkInsert(
    validRows: ValidatedRow[]
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      totalRows: validRows.length,
      successCount: 0,
      failureCount: 0,
      results: [],
    };

    const validProducts = validRows.filter((r) => r.valid);

    if (validProducts.length === 0) {
      result.success = false;
      result.failureCount = validRows.length;
      result.results = validRows.map((r) => ({
        rowNumber: r.rowNumber,
        error: r.errors.join("; "),
      }));
      return result;
    }

    // Bulk insert using insertMany for efficiency
    const docs = validProducts.map((row) => ({
      name: row.name.trim(),
      description: row.description.trim(),
      price: row.price,
      stock: row.stock,
      category: row.category.toLowerCase().trim(),
      imageUrl: (row as any).imageUrl || "",
    }));

    try {
      const inserted = await Product.insertMany(docs, {
        ordered: false, // Continue inserting even if some fail
      });

      result.successCount = inserted.length;
      result.results = inserted.map((doc, i) => ({
        rowNumber: validProducts[i].rowNumber,
        productId: doc._id.toString(),
      }));
    } catch (err: any) {
      // insertMany with ordered: false throws BulkWriteError
      // but some docs may have been inserted
      if (err.insertedDocs) {
        result.successCount = err.insertedDocs.length;
        result.results = err.insertedDocs.map((doc: any, i: number) => ({
          rowNumber: validProducts[i].rowNumber,
          productId: doc._id.toString(),
        }));
      }

      // Add failed ones
      const failedCount =
        validProducts.length - result.successCount;
      result.failureCount =
        validRows.length - result.successCount;
    }

    // Add the invalid rows to results
    const invalidRows = validRows.filter((r) => !r.valid);
    for (const row of invalidRows) {
      result.results.push({
        rowNumber: row.rowNumber,
        error: row.errors.join("; "),
      });
    }

    if (result.successCount === 0) {
      result.success = false;
    }

    // Clear product cache
    const keys = await redisClient.keys("products:*");
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }

    return result;
  }
}
