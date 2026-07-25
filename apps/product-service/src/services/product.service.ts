import { NotFoundError } from "@packages/errors";
import { ProductRepository } from "../repositories/product.repository";

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

  async getAllProducts() {
    return await productRepository.findAll();
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