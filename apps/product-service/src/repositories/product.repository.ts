import { Product, IProduct } from "../models/product.model";

export class ProductRepository {

  async create(productData: Partial<IProduct>) {
    return await Product.create(productData);
  }

  async findAll() {
    return await Product.find();
  }

  async findById(productId: string) {
    return await Product.findById(productId);
  }

  async update(productId: string, productData: Partial<IProduct>) {
    return await Product.findByIdAndUpdate(
      productId,
      productData,
      { new: true }
    );
  }

  async delete(productId: string) {
    return await Product.findByIdAndDelete(productId);
  }

}