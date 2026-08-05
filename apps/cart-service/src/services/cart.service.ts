import { Types } from "mongoose";
import { BadRequestError, NotFoundError } from "@packages/errors";
import { CartRepository } from "../repositories/cart.repository";
import { redisClient } from "@packages/redis";

const cartRepository = new CartRepository();

export class CartService {

  async addToCart(
  userId: string,
  productId: string,
  quantity: number
) {
  if (quantity <= 0) {
    throw new BadRequestError(
      "Quantity must be greater than 0"
    );
  }

  let cart = await cartRepository.findByUserId(userId);

  if (!cart) {
    cart = await cartRepository.createCart(userId);
  }

  let updatedCart =
    await cartRepository.increaseQuantity(
      userId,
      productId,
      quantity
    );

  if (!updatedCart) {
    updatedCart =
      await cartRepository.addNewItem(
        userId,
        productId,
        quantity
      );
  }
  await redisClient.del(`cart:${userId}`);
  return updatedCart;
}
  async getCart(userId: string) {
  const cacheKey = `cart:${userId}`;

  // Check Redis
  const cachedCart = await redisClient.get(cacheKey);

  if (cachedCart) {
    console.log("✅ Cart Cache Hit");

    return JSON.parse(cachedCart);
  }

  console.log("❌ Cart Cache Miss");

  const cart = await cartRepository.findByUserId(userId);

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  // Store in Redis for 1 hour
  await redisClient.set(
    cacheKey,
    JSON.stringify(cart),
    "EX",
    3600
  );

  return cart;
}

  async updateQuantity(
  userId: string,
  productId: string,
  quantity: number
) {
  if (quantity <= 0) {
    throw new BadRequestError("Quantity must be greater than 0");
  }

  const cart = await cartRepository.updateQuantity(
    userId,
    productId,
    quantity
  );

  if (!cart) {
    throw new NotFoundError("Product not found in cart");
  }

  // Invalidate Redis cache
  await redisClient.del(`cart:${userId}`);

  return cart;
}
async removeFromCart(
  userId: string,
  productId: string
) {
  const cart = await cartRepository.removeFromCart(
    userId,
    productId
  );

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  await redisClient.del(`cart:${userId}`);

  return cart;
}

  async clearCart(userId: string) {
  const cart = await cartRepository.findByUserId(userId);

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  cart.items = [];

  await cartRepository.save(cart);
  await redisClient.del(`cart:${userId}`);

  return cart;
}
}