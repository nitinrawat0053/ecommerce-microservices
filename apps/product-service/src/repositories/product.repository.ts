import { Product, IProduct } from "../models/product.model";
import { ProductFilters,ProductQueryFilters } from "@packages/shared-types";

export class ProductRepository {

  async create(productData: Partial<IProduct>) {
    return await Product.create(productData);
  }

  async findAll(filters:ProductQueryFilters) {
  const { page, limit, search, category, sort, order,  minPrice, maxPrice, } = filters;
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
 
if (minPrice !== undefined || maxPrice !== undefined) {
  query.price = {};

  if (minPrice !== undefined) {
    query.price.$gte = minPrice;
  }

  if (maxPrice !== undefined) {
    query.price.$lte = maxPrice;
  }
}
  const products = await Product.find(query)
  .collation({
    locale: "en",
    strength: 2,
  })
  .sort({
    [sort!]: order,
  })
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

  async reduceStock(productId: string, quantity: number) {
  return await Product.findByIdAndUpdate(
    productId,
    {
      $inc: {
        stock: -quantity,
      },
    },
    { new: true }
  );
}

  async delete(productId: string) {
    return await Product.findByIdAndDelete(productId);
  }

}