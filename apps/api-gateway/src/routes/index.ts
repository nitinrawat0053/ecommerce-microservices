import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { authenticate } from "../middlewares/auth.middleware";
import {authorize} from "../middlewares/authorize.middleware";
const router = Router();

// Shared proxy error handler. On upstream failure/timeout, http-proxy-middleware
// otherwise ends the response with a plain HTML body (e.g. "504 Gateway Timeout").
// The frontend reads `res.data.message`, so those HTML bodies render as
// "Failed to create order: undefined". Return JSON with a real message instead.
const proxyErrorHandler = (service: string) => (err: any, _req: any, res: any) => {
  if (res.headersSent || res.writableEnded) return;
  const isDown = ["ECONNREFUSED", "ECONNRESET", "ENOTFOUND", "EHOSTUNREACH", "EAI_AGAIN"].includes(err?.code);
  const status = isDown ? 503 : 504;
  res.status(status).json({
    success: false,
    message: `${service} is ${isDown ? "unavailable" : "timed out"} (${err?.code || "proxy timeout"}). Please try again.`,
  });
};

// Resolve service URLs from env vars (Docker) or fall back to localhost (local dev)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3002";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://localhost:3003";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://localhost:3004";
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://localhost:3005";
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://localhost:3006";

router.use(
  "/auth",
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    proxyTimeout: 15000,
    pathRewrite: {
      "^/": "/api/auth/",
    },
    on: { error: proxyErrorHandler("Auth service") },
  })
);

// User routes - authenticated (SUPER_ADMIN role check done in user service)
router.use(
  "/users",
  authenticate,
  createProxyMiddleware({
    target: `${USER_SERVICE_URL}/api/users`,
    changeOrigin: true,
    proxyTimeout: 15000,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.userId);
          proxyReq.setHeader("x-user-role", req.user.role);
        }
      },
      error: proxyErrorHandler("User service"),
    },
  })
);

router.use(
  "/cart",
  authenticate,
  createProxyMiddleware({
    target: `${CART_SERVICE_URL}/api/cart`,
    changeOrigin: true,
    proxyTimeout: 15000,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.userId);
          proxyReq.setHeader("x-user-role", req.user.role);
        }
      },
      error: proxyErrorHandler("Cart service"),
    },
  })
);

router.use(
  "/payments",
  authenticate,
  createProxyMiddleware({
    target: `${PAYMENT_SERVICE_URL}/api/payments`,
    changeOrigin: true,
    proxyTimeout: 15000,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.userId);
          proxyReq.setHeader("x-user-role", req.user.role);
        }
      },
      error: proxyErrorHandler("Payment service"),
    },
  })
);

router.use(
  "/orders",
  authenticate,
  createProxyMiddleware({
    target: `${ORDER_SERVICE_URL}/api/orders`,
    changeOrigin: true,
    proxyTimeout: 15000,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.userId);
          proxyReq.setHeader("x-user-role", req.user.role);
        }
      },
      error: proxyErrorHandler("Order service"),
    },
  })
);

const productProxy = createProxyMiddleware({
  target: PRODUCT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/products": "/api/products",
  },
  on: { error: proxyErrorHandler("Product service") },
});

// Product Import (Admin + Super Admin) - must be before catch-all routes
router.get(
  "/products/import/template",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  productProxy
);
router.post(
  "/products/import/preview",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  productProxy
);
router.post(
  "/products/import",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  productProxy
);
router.post(
  "/products/upload-image",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  productProxy
);

// Public
router.get("/products", productProxy);
router.get("/products/:id", productProxy);

// Protected (Admin + Super Admin)
router.post(
  "/products",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  productProxy
);

router.put(
  "/products/:id",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  productProxy
);

router.delete(
  "/products/:id",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  productProxy
);

const categoryProxy = createProxyMiddleware({
  target: PRODUCT_SERVICE_URL,
  changeOrigin: true,
  proxyTimeout: 15000,
  pathRewrite: {
    "^/categories": "/api/categories",
  },
  on: { error: proxyErrorHandler("Product service") },
});

const brandProxy = createProxyMiddleware({
  target: PRODUCT_SERVICE_URL,
  changeOrigin: true,
  proxyTimeout: 15000,
  pathRewrite: {
    "^/brands": "/api/brands",
  },
  on: { error: proxyErrorHandler("Product service") },
});

// Categories - public reads, admin writes
router.get("/categories", categoryProxy);
router.get("/categories/:id", categoryProxy);
router.post(
  "/categories",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  categoryProxy
);
router.put(
  "/categories/:id",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  categoryProxy
);
router.delete(
  "/categories/:id",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  categoryProxy
);

// Brands - public reads, admin writes
router.get("/brands", brandProxy);
router.get("/brands/:id", brandProxy);
router.post(
  "/brands",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  brandProxy
);
router.put(
  "/brands/:id",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  brandProxy
);
router.delete(
  "/brands/:id",
  authenticate,
  authorize(["ADMIN", "SUPER_ADMIN"]),
  brandProxy
);

export default router;
