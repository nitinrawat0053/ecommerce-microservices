import { NotFoundError,BadRequestError } from "@packages/errors";
import { ProductRepository } from "../repositories/product.repository";
import { ProductFilters } from "@packages/shared-types";

const productRepository = new ProductRepository();

export class ProductService {

  async createProduct(
    name: string,
    description: string,
    price: number,
    stock: number,
    category: string,
    imageUrl?: string
  ) {
    return await productRepository.create({
      name,
      description,
      price,
      stock,
      category,
      imageUrl,
    });
  }

 async getAllProducts(filters:ProductFilters) {
  let { page, limit, search, category,  sort, order, minPrice, maxPrice} = filters;

  page = Math.max(page, 1);
  limit = Math.max(limit, 1);
  limit = Math.min(limit, 100);

  if (category) {
  category = category.toLowerCase();
}

  const allowedSortFields = [
  "price",
  "name",
  "stock",
  "createdAt",
];

 if (!sort || !allowedSortFields.includes(sort)) {
  sort = "createdAt";
}

 if (!order || !["asc", "desc"].includes(order)) {
  order = "desc";
}

  const sortOrder: 1 | -1 =
  order === "asc" ? 1 : -1;

  if (minPrice !== undefined) {
  if (isNaN(minPrice)) {
    throw new BadRequestError("Invalid minPrice");  }

  if (minPrice < 0) {
    throw new BadRequestError("minPrice cannot be negative");
  }
}

if (maxPrice !== undefined) {
  if (isNaN(maxPrice)) {
    throw new BadRequestError("Invalid maxPrice");
  }

  if (maxPrice < 0) {
    throw new BadRequestError("maxPrice cannot be negative");
  }
}

if (
  minPrice !== undefined &&
  maxPrice !== undefined &&
  minPrice > maxPrice
) {
  throw new BadRequestError("minPrice cannot be greater than maxPrice");
}

  const { products, totalProducts } =
    await productRepository.findAll({page, limit, search, category, sort, order: sortOrder,minPrice,maxPrice});

  const totalPages = Math.ceil(totalProducts / limit);

  return {
    products,
    pagination: {
      currentPage: page,
      limit,
      totalProducts,
      totalPages,
    },
  };
}

  async getProductById(productId: string) {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return product;
  }
  
  async updateProduct(productId: string, productData: any) {
    const updatedProduct = await productRepository.update(
      productId,
      productData
    );

    if (!updatedProduct) {
      throw new NotFoundError("Product not found");
    }

    return updatedProduct;
  }

  async deleteProduct(productId: string) {
    const deletedProduct = await productRepository.delete(productId);

    if (!deletedProduct) {
      throw new NotFoundError("Product not found");
    }

    return deletedProduct;
  }
}