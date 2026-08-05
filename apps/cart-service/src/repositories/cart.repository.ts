import { Types } from "mongoose";
import { Cart, ICart } from "../models/cart.model";

export class CartRepository {
  async createCart(userId: string) {
    return await Cart.create({
      userId,
      items: [],
    });
  }

  async findByUserId(userId: string) {
    return await Cart.findOne({ userId });
  }

  async save(cart: ICart) {
    return await cart.save();
  }

  async updateQuantity(
  userId: string,
  productId: string,
  quantity: number
) {
  return await Cart.findOneAndUpdate(
    {
      userId,
      "items.productId": productId,
    },
    {
      $set: {
        "items.$.quantity": quantity,
      },
    },
    {
      new: true,
    }
  );
}
  async removeFromCart(
  userId: string,
  productId: string
) {
  return await Cart.findOneAndUpdate(
    { userId },
    {
      $pull: {
        items: {
          productId,
        },
      },
    },
    {
      new: true,
    }
  );
}

  async increaseQuantity(
  userId: string,
  productId: string,
  quantity: number
) {
  return await Cart.findOneAndUpdate(
    {
      userId,
      "items.productId": productId,
    },
    {
      $inc: {
        "items.$.quantity": quantity,
      },
    },
    {
      new: true,
    }
  );
}
async addNewItem(
  userId: string,
  productId: string,
  quantity: number
) {
  return await Cart.findOneAndUpdate(
    {
      userId,
    },
    {
      $push: {
        items: {
          productId,
          quantity,
          addedAt: new Date(),
        },
      },
    },
    {
      new: true,
    }
  );
} 

  async deleteCart(userId: string) {
    return await Cart.findOneAndDelete({ userId });
  }
}