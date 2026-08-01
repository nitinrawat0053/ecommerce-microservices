import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";

const productService = new ProductService();
export class ProductController {
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        name,
        description,
        price,
        stock,
        category,
        imageUrl,
      } = req.body;

      const product = await productService.createProduct(
        name,
        description,
        price,
        stock,
        category,
        imageUrl
      );

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
  
async getAllProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const sort = req.query.sort as string;
    const order = req.query.order as "asc" | "desc";
    const minPrice =
     req.query.minPrice !== undefined
    ? Number(req.query.minPrice)
    : undefined;

    const maxPrice =
     req.query.maxPrice !== undefined
    ? Number(req.query.maxPrice)
    : undefined;

    const result = await productService.getAllProducts({page,limit,search,category,sort,order,minPrice,maxPrice});

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getProductById(req.params.id as string);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async reduceStock(req: Request, res: Response, next: NextFunction) {
  try {
    const { quantity } = req.body;

    const product = await productService.reduceStock(
      req.params.id as string,
      quantity
    );

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
}
  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.updateProduct(
        req.params.id as string,
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.deleteProduct(req.params.id as string);

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();