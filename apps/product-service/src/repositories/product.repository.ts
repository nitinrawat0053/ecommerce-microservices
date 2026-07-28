import { Product, IProduct } from "../models/product.model";
import { ProductFilters } from "@packages/shared-types";

export class ProductRepository {

  async create(productData: Partial<IProduct>) {
    return await Product.create(productData);
  }

  async findAll(filters:ProductFilters) {
    console.log("Filters:", filters);
  const { page, limit, search, category  } = filters;
  const skip = (page - 1) * limit;

  const query: any = {};

  if (search) {
  query.name = {
    $regex: search,
    $options: "i",
  };
}
  if (category) {
  query.category = category;
}
    console.log("Query:", query);
  const products = await Product.find(query)
    .skip(skip)
    .limit(limit);

  const totalProducts = await Product.countDocuments(query);

  return {
    products,
    totalProducts,
  };
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