import { Request, Response, NextFunction } from "express";
import { ImportService } from "../services/import.service";
import { BadRequestError } from "@packages/errors";

const importService = new ImportService();

export class ImportController {
  /**
   * POST /api/products/import/preview
   * Parse CSV, validate rows, return preview with errors
   */
  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError("CSV file is required");
      }

      const rows = importService.parseCsv(req.file.buffer);
      const validated = importService.validateRows(rows);

      const validCount = validated.filter((r) => r.valid).length;
      const invalidCount = validated.filter((r) => !r.valid).length;

      res.status(200).json({
        success: true,
        data: {
          rows: validated,
          summary: {
            total: validated.length,
            valid: validCount,
            invalid: invalidCount,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products/import
   * Bulk insert validated products
   */
  async import(req: Request, res: Response, next: NextFunction) {
    try {
      const { rows } = req.body;

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new BadRequestError("Rows array is required and cannot be empty");
      }

      const validated = importService.validateRows(rows);
      const result = await importService.bulkInsert(validated);

      res.status(200).json({
        success: result.success,
        message: `Import completed: ${result.successCount} succeeded, ${result.failureCount} failed`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/products/upload-image
   * Upload single image to Cloudinary
   */
  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError("Image file is required");
      }

      const imageUrl = await importService.uploadImage(req.file);

      res.status(200).json({
        success: true,
        data: { imageUrl },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/import/template
   * Download CSV template
   */
  async downloadTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const csv =
        "name,description,price,stock,category,imageUrl\n" +
        'Samsung Galaxy S24 Ultra,"Premium smartphone with AI features",134999,50,electronics,\n' +
        'Nike Air Max 200,"Classic running shoes for men",9999,200,fashion,\n' +
        'Prestige Induction Cooktop,"1800W induction cooktop",2499,100,home & kitchen,';

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=product-import-template.csv"
      );
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}

export const importController = new ImportController();
