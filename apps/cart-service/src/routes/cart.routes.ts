import { Router } from "express";
import { CartController } from "../controllers/cart.controller";

const router = Router();
const cartController = new CartController();

router.post("/", cartController.addToCart);

router.get("/", cartController.getCart);

router.patch("/:productId", cartController.updateQuantity);

router.delete("/:productId", cartController.removeFromCart);

router.delete("/", cartController.clearCart);

export default router;