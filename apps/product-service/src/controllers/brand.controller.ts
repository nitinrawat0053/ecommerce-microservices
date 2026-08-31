import { Request, Response, NextFunction } from "express";
import { BrandService } from "../services/brand.service";

const brandService = new BrandService();

export class BrandController {
  async createBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, logo } = req.body;

      const brand = await brandService.createBrand(name, description, logo);

      res.status(201).json({
        success: true,
        message: "Brand created successfully",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllBrands(req: Request, res: Response, next: NextFunction) {
    try {
      const brands = await brandService.getAllBrands();

      res.status(200).json({
        success: true,
        data: brands,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBrandById(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await brandService.getBrandById(req.params.id as string);

      res.status(200).json({
        success: true,
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBrand(req: Request, res: Response, next: NextFunction) {
    try {
      const brand = await brandService.updateBrand(
        req.params.id as string,
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Brand updated successfully",
        data: brand,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBrand(req: Request, res: Response, next: NextFunction) {
    try {
      await brandService.deleteBrand(req.params.id as string);

      res.status(200).json({
        success: true,
        message: "Brand deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const brandController = new BrandController();
