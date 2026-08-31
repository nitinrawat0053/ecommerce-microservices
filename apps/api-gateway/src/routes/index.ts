import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { authenticate } from "../middlewares/auth.middleware";
import {authorize} from "../middlewares/authorize.middleware";
const router = Router();

router.use(
  "/auth",
  createProxyMiddleware({
    target: "http://localhost:3001",
    changeOrigin: true,
    proxyTimeout: 15000,
    pathRewrite: {
      "^/": "/api/auth/",
    },
  })
);

// User routes - authenticated (SUPER_ADMIN role check done in user service)
router.use(
  "/users",
  authenticate,
  createProxyMiddleware({
    target: "http://localhost:3002/api/users",
    changeOrigin: true,
    proxyTimeout: 15000,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.userId);
          proxyReq.setHeader("x-user-role", req.user.role);
        }
      },
    },
  })
);

router.use(
  "/cart",
  authenticate,
  createProxyMiddleware({
    target: "http://localhost:3005/api/cart",
    changeOrigin: true,
    proxyTimeout: 15000,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.userId);
          proxyReq.setHeader("x-user-role", req.user.role);
        }
      },
    },
  })
);

router.use(
  "/payments",
  authenticate,
  createProxyMiddleware({
    target: "http://localhost:3006/api/payments",
    changeOrigin: true,
    proxyTimeout: 15000,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.userId);
          proxyReq.setHeader("x-user-role", req.user.role);
        }
      },
    },
  })
);

router.use(
  "/orders",
  authenticate,
  createProxyMiddleware({
    target: "http://localhost:3004/api/orders",
    changeOrigin: true,
    proxyTimeout: 15000,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.userId);
          proxyReq.setHeader("x-user-role", req.user.role);
        }
      },
    },
  })
);

const productProxy = createProxyMiddleware({
  target: "http://localhost:3003",
  changeOrigin: true,
  pathRewrite: {
    "^/products": "/api/products",
  },
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
  target: "http://localhost:3003",
  changeOrigin: true,
  proxyTimeout: 15000,
  pathRewrite: {
    "^/categories": "/api/categories",
  },
});

const brandProxy = createProxyMiddleware({
  target: "http://localhost:3003",
  changeOrigin: true,
  proxyTimeout: 15000,
  pathRewrite: {
    "^/brands": "/api/brands",
  },
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
