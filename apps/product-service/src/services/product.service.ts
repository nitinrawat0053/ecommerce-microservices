import { NotFoundError,BadRequestError } from "@packages/errors";
import { ProductRepository } from "../repositories/product.repository";
import { ProductFilters } from "@packages/shared-types";
import { redisClient } from "@packages/redis";

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
    const product = await productRepository.create({
      name,
      description,
      price,
      stock,
      category,
      imageUrl,
    });
  const keys = await redisClient.keys("products:*");
   if (keys.length > 0) {
   await redisClient.del(...keys);
}
   return product;
  }

 async getAllProducts(filters:ProductFilters) {
  let { page, limit, search, category,  sort, order, minPrice, maxPrice} = filters;
  const cacheKey = `products:${JSON.stringify(filters)}`;

  const cachedProducts = await redisClient.get(cacheKey);

  if (cachedProducts) {
  console.log(`✅ Cache Hit: ${cacheKey}`);
  return JSON.parse(cachedProducts);
}

  console.log(`❌ Cache Miss: ${cacheKey}`);

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

  const response = {
  products,
  pagination: {
    currentPage: page,
    limit,
    totalProducts,
    totalPages,
  },
};

  await redisClient.set(
  cacheKey,
  JSON.stringify(response),
  "EX",
  300
);

return response;
}

  async getProductById(productId: string) {
    const cacheKey = `product:${productId}`;
    const cachedProduct = await redisClient.get(cacheKey);

  if (cachedProduct) {
  console.log("✅ Cache Hit");
  return JSON.parse(cachedProduct);
}
    console.log("❌ Cache Miss");
    const product = await productRepository.findById(productId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }
    await redisClient.set(
     cacheKey,
     JSON.stringify(product.toObject()),
     "EX",
     300
);
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

  await redisClient.del(`product:${productId}`);
  const keys = await redisClient.keys("products:*");

  if (keys.length > 0) {
  await redisClient.del(...keys);
}

  return updatedProduct;
}

async deleteProduct(productId: string) {
  const deletedProduct = await productRepository.delete(productId);

  if (!deletedProduct) {
    throw new NotFoundError("Product not found");
  }

  await redisClient.del(`product:${productId}`);
  const keys = await redisClient.keys("products:*");

  if (keys.length > 0) {
  await redisClient.del(...keys);
}

  return deletedProduct;
 }
}