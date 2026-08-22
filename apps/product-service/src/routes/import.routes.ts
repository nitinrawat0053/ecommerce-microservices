import { Router } from "express";
import multer from "multer";
import { importController } from "../controllers/import.controller";

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

// Download CSV template
router.get("/import/template", importController.downloadTemplate);

// Preview CSV import (validate rows, return with errors)
router.post(
  "/import/preview",
  csvUpload.single("csv"),
  importController.preview
);

// Bulk import validated products
router.post("/import", importController.import);

// Upload single image to Cloudinary
router.post(
  "/upload-image",
  imageUpload.single("image"),
  importController.uploadImage
);

export default router;
