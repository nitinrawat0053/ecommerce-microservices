import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import {
  getCartRateLimiter,
  cartMutationRateLimiter,
  clearCartRateLimiter,
} from "../middlewares/rate-limit";

const router = Router();
const cartController = new CartController();

router.post("/", cartMutationRateLimiter, cartController.addToCart);

router.get("/", getCartRateLimiter, cartController.getCart);

router.patch("/:productId", cartMutationRateLimiter, cartController.updateQuantity);

router.delete("/:productId", cartMutationRateLimiter, cartController.removeFromCart);

router.delete("/", clearCartRateLimiter, cartController.clearCart);

export default router;