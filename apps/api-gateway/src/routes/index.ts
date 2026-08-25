import { Router } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { authenticate } from "../middlewares/auth.middleware";
import {authorize} from "../middlewares/authorize.middleware";
const router = Router();

// router.use(
//   "/auth",
//   createProxyMiddleware({
//     target: "http://localhost:3001/api/auth",
//     changeOrigin: true,
//   })
// );
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
  }
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

// Product Import (Admin) - must be before catch-all routes
router.get(
  "/products/import/template",
  authenticate,
  authorize(["ADMIN"]),
  productProxy
);
router.post(
  "/products/import/preview",
  authenticate,
  authorize(["ADMIN"]),
  productProxy
);
router.post(
  "/products/import",
  authenticate,
  authorize(["ADMIN"]),
  productProxy
);
router.post(
  "/products/upload-image",
  authenticate,
  authorize(["ADMIN"]),
  productProxy
);

// Public
router.get("/products", productProxy);
router.get("/products/:id", productProxy);

// Protected
router.post(
  "/products",
  authenticate,
  authorize(["ADMIN"]),
  productProxy
);

router.put(
  "/products/:id",
  authenticate,
  authorize(["ADMIN"]),
  productProxy
);

router.delete(
  "/products/:id",
  authenticate,
  authorize(["ADMIN"]),
  productProxy
);

export default router;