import { Router } from "express";
import multer from "multer";
import { importController } from "../controllers/import.controller";
import { requireAdmin } from "../middlewares/auth.middleware";
import {
  categoryReadRateLimiter,
  importRateLimiter,
} from "../middlewares/rate-limit";

const router = Router();

// Multer config for CSV files
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.originalname.endsWith(".csv") ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

// Multer config for image files
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Download CSV template (Admin read)
router.get(
  "/import/template",
  requireAdmin,
  categoryReadRateLimiter,
  importController.downloadTemplate
);

// Preview CSV import (Admin write with import rate limiting before file parsing)
router.post(
  "/import/preview",
  requireAdmin,
  importRateLimiter,
  csvUpload.single("csv"),
  importController.preview
);

// Bulk import validated products (Admin write)
router.post(
  "/import",
  requireAdmin,
  importRateLimiter,
  importController.import
);

// Upload single image to Cloudinary (Admin write with import rate limiting before file parsing)
router.post(
  "/upload-image",
  requireAdmin,
  importRateLimiter,
  imageUpload.single("image"),
  importController.uploadImage
);

export default router;
