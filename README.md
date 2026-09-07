# 🛒 E-Commerce Microservices Platform

A production-style **microservices e-commerce platform** built with **Node.js, TypeScript, Express, MongoDB, Redis, and RabbitMQ**, featuring a React storefront, an API gateway, role-based auth, event-driven order/payment/notification flows, and a Razorpay-backed checkout.

This monorepo demonstrates a modern distributed system: independently deployable services, an outbox-pattern message bus, centralized configuration and error handling, caching, secure JWT + OTP authentication, and third-party integrations — all containerized with Docker Compose.

---

## ✨ Key Features

- 🏗️ **True microservices architecture** — 8 independently deployable backend services + a web storefront
- 🛡️ **API Gateway** — reverse proxy, JWT authentication, role-based authorization, header injection, JSON error handling (503/504)
- 🔐 **Authentication & authorization** — bcrypt password hashing, JWT sessions (1 day), Twilio Verify OTP phone verification, rate-limited auth routes, `USER` / `ADMIN` / `SUPER_ADMIN` roles
- 📨 **Event-driven communication** — RabbitMQ direct `event-exchange` with **outbox pattern** (transactional events, polling worker, 5s publish), retry queues + dead-letter queues
- 💳 **Real payment integration** — Razorpay orders, HMAC-SHA256 signature verification, webhook verification with `timingSafeEqual`, plus a `LOAD_TEST` **mock mode** for running the whole stack without external payments
- ⚡ **Redis caching** — product list/detail and cart caching with invalidation
- 🔔 **Rich notifications** — order-placed, payment-success, payment-failed emails (Resend, rich HTML templates), SMS (Twilio), and WhatsApp hooks, honoring per-user notification preferences
- 📦 **Product catalog** — products, categories, brands, stock management, CSV import with preview, Cloudinary image uploads
- 🛒 **Cart** — server-side cart for logged-in users, localStorage guest cart that merges on login
- 🧩 **Monorepo** — pnpm workspaces + Turborepo build orchestration, 8 shared `@packages/*` libraries

---

## 🏗️ Architecture Overview

The platform follows a **microservices architecture**, where each business domain is independently developed and deployed.

The **API Gateway** serves as the single entry point for clients, handling authentication, role-based access control, and routing requests to the appropriate service.

Services use **synchronous communication** when an immediate response is required, such as validating product pricing and stock during order creation. For background workflows, services communicate **asynchronously through RabbitMQ events**, keeping the system loosely coupled and scalable.

This architecture separates business responsibilities, improves service independence, and allows individual components to evolve and scale without affecting the entire platform.

---

## 🧩 Microservices

Default ports are overridable via environment variables (`@packages/config`).

| Service                 | Responsibility                                                                      | Default port |
| ----------------------- | ----------------------------------------------------------------------------------- | -----------: |
| **API Gateway**         | Single entry point: JWT auth, RBAC, reverse proxy, JSON proxy-error handling        | `3000`       |
| **Auth Service**        | Register / login, bcrypt hashing, JWT issuance, Twilio Verify OTP, rate limiting     | `3001`       |
| **User Service**        | User profiles, notification preferences, user listing, role management (super admin)| `3002`       |
| **Product Service**     | Products, categories, brands, inventory, CSV import, image upload, Redis caching    | `3003`       |
| **Order Service**       | Order creation (transactional + outbox), stock checks, order lifecycle management   | `3004`       |
| **Cart Service**        | Cart CRUD, Redis caching, cart clearing on `ORDER_PLACED`                            | `3005`       |
| **Payment Service**     | Razorpay order creation, payment verification, webhooks, outbox for payment events   | `3006`       |
| **Notification Service**| Consumes events → email (Resend), SMS (Twilio), WhatsApp, per-user preferences       | `3007`       |
| **Web (frontend)**      | React storefront + admin panel (served by Nginx in production)                      | `5173` (dev) |

---

## 🚀 Technology Stack

| Layer            | Technologies                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime**      | Node.js, TypeScript                                                                                                                                   |
| **Backend**      | Express 5, Mongoose (MongoDB ODM), Zod validation, custom error classes                                                                                |
| **Frontend**     | React 19, Vite, Tailwind CSS 4, React Router 7, Radix UI primitives, axios, lucide-react, recharts (admin analytics), papaparse (CSV import), sonner   |
| **Data**         | MongoDB (Atlas in production), Redis 7                                                                                                                 |
| **Messaging**    | RabbitMQ (3.13) — direct exchange, outbox worker, retry + dead-letter queues                                                                           |
| **Security**     | JWT, bcryptjs, `crypto.timingSafeEqual` (webhook verification), express-rate-limit, CORS                                                                |
| **Integrations** | Razorpay (payments), Twilio Verify (OTP) + Twilio (SMS/WhatsApp), Resend (email), Cloudinary (images)                                                   |
| **Tooling**      | pnpm workspaces, Turborepo, Docker & Docker Compose, Vitest, oxlint                                                                                    |

---

## 📊 System Architecture Diagram

```mermaid
flowchart LR
    subgraph Client["Client"]
        W["🌐 Web App (React / Vite)"]
    end

    subgraph Edge["Edge"]
        NG["nginx — SPA + /api proxy"]
        GW["🛡️ API Gateway — JWT auth, RBAC, proxy"]
    end

    subgraph Services["Backend Microservices"]
        AUTH["Auth Service"]
        USR["User Service"]
        PRD["Product Service"]
        CAT["Cart Service"]
        ORD["Order Service"]
        PAY["Payment Service"]
        NOT["Notification Service"]
    end

    subgraph Data["Data Stores"]
        MONGO[(MongoDB / Atlas)]
        REDIS[(Redis — cache)]
    end

    subgraph Bus["RabbitMQ"]
        EX{{"event-exchange (direct)"}}
    end

    subgraph External["External SaaS"]
        RZ["Razorpay"]
        TW["Twilio (OTP / SMS)"]
        RE["Resend (Email)"]
        CL["Cloudinary (Images)"]
    end

    W --> NG
    NG --> GW
    GW --> AUTH
    GW --> USR
    GW --> PRD
    GW --> CAT
    GW --> ORD
    GW --> PAY

    AUTH --> MONGO
    USR --> MONGO
    PRD --> MONGO
    CAT --> MONGO
    ORD --> MONGO
    PAY --> MONGO
    NOT --> MONGO

    PRD --> REDIS
    CAT --> REDIS

    ORD -- hears PAYMENT_SUCCESS / PAYMENT_FAILED --> EX
    PAY -- hears PAYMENT_INITIATED --> EX
    EX -->|order-created| PRD
    EX -->|order-placed| CAT
    EX -->|order-placed, payment-*| NOT

    RZ <--> PAY
    TW --> AUTH
    TW --> NOT
    RE --> NOT
    CL --> PRD
```

> The frontend talks **only** to the gateway; services reach each other through the broker. MongoDB is the source of truth, Redis is a read-through cache for products and carts.

---

## 📁 Repository Structure

```text
ecommerce-microservices/
├── apps/
│   ├── api-gateway/          # Reverse proxy, auth + RBAC middleware, route proxying
│   ├── auth-service/         # Register/login, JWT, Twilio Verify OTP
│   ├── user-service/         # Profiles, notification preferences, role management
│   ├── product-service/      # Products, categories, brands, CSV import, cloudinary upload
│   ├── cart-service/         # Cart CRUD + Redis cache + order-placed consumer
│   ├── order-service/        # Transactional order + outbox, lifecycle, payment consumers
│   ├── payment-service/      # Razorpay orders/verify/webhook + outbox
│   ├── notification-service/ # Email/SMS/WhatsApp consumers
│   └── web/                  # React storefront + admin panel (Vite)
├── packages/
│   ├── config/               # Centralized env config (@packages/config)
│   ├── errors/               # AppError, BadRequest, Unauthorized, NotFound, ...
│   ├── jwt/                  # generateToken / verifyToken (1-day expiry)
│   ├── logger/               # Shared logging
│   ├── rabbitmq/             # connect/publish/consume, queue + DLQ setup
│   ├── redis/                # Redis client
│   ├── shared-types/         # Domain models, enums, RabbitMQ queue/event constants
│   └── validation/           # Zod schemas + validate middleware
├── scripts/
│   ├── deploy.sh             # Build & deploy the whole stack on a VM
│   ├── setup-oracle-vm.sh    # One-time Oracle Cloud VM provisioning
│   └── check-health.sh       # Container status + log reporting
├── Dockerfile                # Shared multi-stage build (per-service via SERVICE arg)
├── docker-compose.yml        # Local infra (RabbitMQ)
├── docker-compose.prod.yml   # Full production stack
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## 🔀 How a Request Flows Through the System

```mermaid
sequenceDiagram
    autonumber
    actor U as User / Browser
    participant NG as nginx
    participant GW as API Gateway
    participant SV as Backend Service
    participant DB as Mongo / Redis

    U->>NG: GET /products
    NG->>GW: /api/products
    GW->>GW: JWT verify + role check (if protected)
    GW->>SV: proxy (injects x-user-id / x-user-role)
    SV->>DB: query (Redis first where cached)
    DB-->>SV: data
    SV-->>GW: JSON { success, message, data }
    GW-->>NG: response relayed
    NG-->>U: rendered response
```

Public routes (`/products`, `/categories`, `/brands`) pass straight through. Protected routes first hit the gateway's `authenticate` middleware (JWT), then `authorize` (`ADMIN`/`SUPER_ADMIN`) where required, before proxying.

---

## 🔐 Authentication Flow

1. `POST /api/auth/register` — validates input, bcrypt-hashes the password (10 rounds), creates the user, and sends an OTP via Twilio Verify.
2. `POST /api/auth/verify-phone` — the user submits the 6-digit code; Twilio Verify approves it and the account is marked `isVerified: true`.
   `POST /api/auth/resend-otp` re-sends a code.
3. `POST /api/auth/login` — bcrypt-compares the password and returns a signed JWT (`{ userId, role }`, 1-day expiry) plus the user profile.
4. The **API Gateway** verifies the `Authorization: Bearer <token>` header on every protected route and injects `x-user-id` / `x-user-role` headers for downstream services.

> **Why phone verification matters here:** the platform gates checkout behind login + a verified phone. Both `order-service` and `payment-service` re-check `isVerified` from the database server-side before creating an order or finalizing a payment — it is never trusted from the client.

---

## 📦 Product / Catalog Flow

- **Public reads** — `GET /api/products` (supports `page`, `limit`, `search`, `category`, `sort` by price/name/stock/createdAt, `order`, `minPrice`, `maxPrice`) and `GET /api/products/:id`. Responses are cached in Redis (`products:<filters>` / `product:<id>`, 5-minute TTL) and invalidated on writes.
- **Admin writes** — products, categories, and brands are created/updated/deleted by `ADMIN` / `SUPER_ADMIN` via the gateway's `authorize` middleware. Uploading an image (`POST /api/products/upload-image`) stores it on Cloudinary.
- **CSV import** — admins can download a template, preview a file (`/import/preview`), then import products in bulk (`/import`).
- **Inventory** — creating an order does a synchronous stock check against the product service; when `ORDER_CREATED` is consumed, the product service decrements stock (`reduceStock`) and invalidates the affected Redis caches.

---

## 🛒 Cart Flow

- Logged-in users get a **server-side cart** (`cart-service`, backed by Mongo + Redis key `cart:<userId>` with a 1-hour TTL). All mutating operations invalidate the cache.
- Guests get a **localStorage cart** in the browser. On login (including the in-checkout payment gate), the guest cart is merged into the server cart so nothing is lost.
- After a successful order, the frontend clears the cart, and the `ORDER_PLACED` event also clears the server cart via the cart service consumer — belt-and-suspenders.

---

## 📋 Order Creation Flow

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Web App
    participant GW as API Gateway
    participant ORD as Order Service
    participant OW as Order Outbox Worker
    participant B as RabbitMQ
    participant PRD as Product Service
    participant PAY as Payment Service
    participant RZ as Razorpay

    U->>W: Proceed to pay (login + OTP verified)
    W->>GW: POST /api/orders
    GW->>ORD: proxy (x-user-id header)
    ORD->>PRD: GET /api/products/:id (stock + price)
    ORD-->>W: 201 created order
    Note over ORD: Mongo transaction → order (PENDING)<br/>+ outbox: ORDER_CREATED, PAYMENT_INITIATED
    OW->>OW: poll pending outbox every 5s
    OW->>B: publish ORDER_CREATED
    B->>PRD: consumer → reduceStock
    OW->>B: publish PAYMENT_INITIATED
    B->>PAY: consumer → create Razorpay order
    W->>GW: GET /api/payments/order/:orderId (poll)
    GW-->>W: { razorpayOrderId }
    W->>RZ: open Razorpay checkout (client SDK)
    U->>RZ: complete payment
```

Key properties:

- ✅ **Reliability first** — the order and its outbox events are committed in **one MongoDB transaction**: either both the order and its events exist, or neither does.
- 🔁 The **outbox worker** polls pending events every 5 seconds and publishes them to RabbitMQ, so a broker hiccup at order time can't lose the events.
- 🧾 Stock is decremented asynchronously (not during the request), which keeps order latency low.
- 🔒 Orders are only creatable by authenticated, phone-verified users.

---

## 💳 Payment Flow

```mermaid
sequenceDiagram
    autonumber
    participant W as Web App
    participant PAY as Payment Service
    participant PW as Payment Outbox Worker
    participant B as RabbitMQ
    participant ORD as Order Service
    participant NOT as Notification Service
    participant CAT as Cart Service
    participant RZ as Razorpay

    W->>PAY: POST /api/payments/verify (orderId, paymentId, signature)
    PAY->>RZ: (signature already validated locally — HMAC-SHA256)
    Note over PAY: verify signature + phone-verified user
    PAY->>PAY: Mongo tx → payment SUCCESS<br/>+ outbox: PAYMENT_SUCCESS, ORDER_PLACED
    PAY-->>W: 200
    PW->>B: publish PAYMENT_SUCCESS, ORDER_PLACED
    B->>ORD: order → CONFIRMED
    B->>NOT: email/SMS notifications
    B->>CAT: clear server cart
    Note over PAY, RZ: Also handled server-side: Razorpay webhook<br/>POST /api/payments/webhook (timingSafeEqual verify)
```

How payments actually work in this repository:

- **Real mode (default: `LOAD_TEST=false`)** — the payment service consumes `PAYMENT_INITIATED`, calls `razorpay.orders.create`, and the web app opens the Razorpay **checkout.js** modal. On success the client posts `razorpay_order_id` / `razorpay_payment_id` / `razorpay_signature` to `POST /api/payments/verify`, which recomputes the HMAC-SHA256 signature server-side.
- **Mock / load-test mode (`LOAD_TEST=true`)** — Razorpay is **never called**. Orders get synthetic ids (`order_mock_…`, `pay_mock_…`), signature verification always passes, and the payment is marked success after writing the outbox events. This lets you exercise the full order → event → notification pipeline with **no Razorpay, Resend, or Twilio SMS calls** for load testing.
- **Webhooks** — `POST /api/payments/webhook` verifies the Razorpay signature with `crypto.timingSafeEqual` and handles `payment.captured` → success and `payment.failed` → failed (transaction + outbox, then a fire-and-forget HTTP confirm to order-service as a belt-and-suspenders path beside the outbox).

> Keys and webhook secrets live only in environment variables — never in the README or repository.

---

## 📨 Event-Driven Communication

The broker is a durable **direct** `event-exchange`. Producers publish with a routing key that binds to queues; each consumer binds the queues it cares about. Failed work is retried (up to 3 times) through retry queues and then dead-lettered to `*-dlq` queues with the `dead-letter-exchange`.

| Event / Routing key     | Published by (outbox)                  | Queues bound          | Consumers (effect)                                  |
| ----------------------- | -------------------------------------- | --------------------- | --------------------------------------------------- |
| `ORDER_CREATED`         | Order service                          | `order-created`       | Product service → `reduceStock`                     |
| `PAYMENT_INITIATED`     | Order service                          | `payment-initiated`   | Payment service → create Razorpay order             |
| `PAYMENT_SUCCESS`       | Payment service                        | `payment-success`, `notification-payment-success` | Order service → `CONFIRMED`; Notification service → email/SMS |
| `PAYMENT_FAILED`        | Payment service                        | `payment-failed`, `notification-payment-failed` | Order service → `CANCELLED`; Notification service → email/SMS |
| `ORDER_PLACED`          | Payment service (after successful charge) | `order-placed`, `notification-order-placed` | Cart service → clear cart; Notification service → email/SMS |

This decoupling means order-service never calls notification-service, and a payment failing doesn't crash the order request path — it simply becomes an event.

---

## ⚡ Redis Usage

| Cache key             | Written by       | TTL    | Notes                                             |
| --------------------- | ---------------- | ------ | ------------------------------------------------- |
| `products:<filters>`  | Product service  | 5 min  | JSON of filtered product pages                    |
| `product:<id>`        | Product service  | 5 min  | Single product document                           |
| `cart:<userId>`       | Cart service     | 1 hour | Serialized cart; invalidated on every mutation    |
| `products:*`, `product:*` | invalidated on product create/update/delete/stock change | — | Ensures stale catalog data isn't served |

Watermark: product, cart, order, and payment services are provisioned with `REDIS_URL` / `REDIS_HOST` + `REDIS_PORT` in production; the product and cart services are the primary caching consumers today.

---

## 🐇 RabbitMQ Usage

- **Exchanges** — `event-exchange` (direct, durable) and `dead-letter-exchange` (direct, durable) are asserted on connect by `@packages/rabbitmq`.
- **Queues** — durable, with `x-dead-letter-exchange` set; retry queues apply `x-message-ttl: 5000`. Every non-retry/non-DLQ queue gets a matching `*-dlq`.
- **Consumption** — the shared `consumeMessage` helper tracks an `x-retry-count` header; consumers that pass a `retryQueue` + `maxRetries` get automatic retries, and failures beyond that go to the DLQ (ack/no-requeue).
- **Outbox workers** — order-service and payment-service each run a 5-second interval worker (`setInterval`) that publishes pending outbox rows.
- Local management UI: `http://localhost:15672` (local compose only).

---

## 🗄️ Database Architecture

MongoDB is the system of record (Mongoose models per service, with per-service `Order`, `Outbox`, `Payment` etc.). Atlas is used for the hosted production database.

There is no service-to-service database sharing — each service owns its domain documents (the user document is read by auth/user/order/payment services for verification checks, but only auth/user write it).

| Service            | Key models                                        |
| ------------------ | ------------------------------------------------- |
| Auth / User        | `User` (name, email, password, phone, role, isVerified, notificationPreferences) |
| Product            | `Product`, `Category`, `Brand`                    |
| Cart               | `Cart` (items with productId + quantity)          |
| Order              | `Order` (status, priceAtPurchase, totalAmount), `Outbox` |
| Payment            | `Payment` (status, razorpayOrderId, transactionId, failureReason), `Outbox` |

The **outbox table** (`eventType`, `payload`, `status PENDING|SENT`) is the backbone of the event pipeline — it's written transactionally with the business change, then drained by the workers.

---

## 🌐 Frontend Overview

`apps/web` is a React 19 + Vite single-page app with Tailwind 4 and Radix UI components, talking to the gateway through an axios client (`baseURL: /api`, Bearer token from `localStorage`, automatic sign-out redirect on 401).

- **Guest / customer routes** — `/`, `/products`, `/products/:id`, `/cart`, `/orders/new`, `/orders`, `/orders/:id`, `/payments`, `/profile`, `/wishlist`, `/profile/notifications`, `/login`, `/register`, `/verify-phone`.
- **Admin / super-admin routes** — `/admin/*` (product, category, brand management with CSV import, analytics dashboard with recharts).
- Role-aware routing via `AuthContext` (`isAdmin`, `isSuperAdmin`), cart state via `CartContext` (server cart + guest cart merge), wishlist via `WishlistContext`.
- Checkout embeds the Razorpay checkout modal and applies the payment gate (login + OTP) before paying.
- The storefront ships with generated category banner images under `apps/web/public/banners/`.

---

## 💻 Local Development Setup

> The repository's `docker-compose.yml` provisions **RabbitMQ only**. For local development you also need **MongoDB** and **Redis** reachable on your machine (local installs or your own containers) — point the services at them via the root `.env`.

**1. Clone & install**

```bash
git clone <your-repository-url>
cd ecommerce-microservices
pnpm install
```

**2. Start RabbitMQ** (local infra)

```bash
docker compose up -d
```

**3. Create the root `.env`** — every service loads this single file via `@packages/config`.

```env
NODE_ENV=development
LOAD_TEST=false

# MongoDB + Redis running locally
MONGODB_URI=mongodb://localhost:27017/ecommerce
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# RabbitMQ (from docker-compose.yml)
RABBITMQ_URL=amqp://admin:admin@localhost:5672
RABBITMQ_DEFAULT_USER=admin
RABBITMQ_DEFAULT_PASS=admin

# Auth
JWT_SECRET=your-dev-secret-change-me

# Twilio Verify (required for OTP)
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxx

# Payments
RAZORPAY_KEY_ID=rzp_test_XXXX
RAZORPAY_KEY_SECRET=XXXX
```

**4. Run everything (all services + web, hot reload)**

```bash
pnpm dev          # turbo run dev — builds @packages/* then starts all apps
```

> Setting `LOAD_TEST=true` switches Razorpay, Resend, and Twilio SMS to **mock mode** (no external calls). Note: Twilio **Verify** is *not* mocked — OTP always goes through Twilio.

**Run one service at a time**

```bash
pnpm --filter @apps/order-service dev
pnpm --filter @apps/auth-service dev
```

**Useful commands**

```bash
pnpm build          # build all packages + apps (tsc)
pnpm lint           # oxlint
pnpm test           # vitest run (service unit tests)
```

---

## 🔧 Environment Variables

All configuration is centralized in `@packages/config` and read from a root `.env` (dev) or `.env.production` (deployed with Docker).

| Variable                  | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `NODE_ENV`                | `development` / `production`                     |
| `LOAD_TEST`               | `true` → mock Razorpay, Resend, Twilio SMS       |
| `API_GATEWAY_PORT` … `CART_SERVICE_PORT` | Default service ports (3000–3005) |
| `JWT_SECRET`              | Signing secret for JWT issuance                  |
| `MONGODB_URI`             | MongoDB connection string                        |
| `RABBITMQ_URL`            | `amqp://user:pass@host:5672`                     |
| `RABBITMQ_DEFAULT_USER` / `RABBITMQ_DEFAULT_PASS` | RabbitMQ credentials (compose) |
| `REDIS_URL` / `REDIS_HOST` / `REDIS_PORT` | Redis connection settings         |
| `USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, `ORDER_SERVICE_URL` | Service-to-service HTTP URLs |
| `RESEND_API_KEY`          | Email notifications                              |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`, `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_FROM` | OTP + SMS + WhatsApp |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Payments |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Product image uploads |
| `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_NAME`, `SUPER_ADMIN_PHONE` | Bootstrapped super admin |

A complete template lives in **`.env.production.example`** (copy to `.env.production` and fill in real secrets). ⚠️ **Never commit `.env.production`.**

> Note: `PAYMENT_SERVICE_PORT` / `NOTIFICATION_SERVICE_PORT` are read by config with defaults `3006` / `3007` but are not listed in `.env.production.example` — they're only documented for completeness.

---

## 🐳 Docker / Production Deployment

The production stack (`docker-compose.prod.yml`) is built to run the **entire application** — frontend, all 8 backends, Redis, and RabbitMQ — behind **two** exposed ports:

| Service     | Host port |
| ----------- | --------: |
| API Gateway | `3000`    |
| Web (nginx) | `80`      |

Backend images are built with the **shared multi-stage `Dockerfile`** parameterized by a `SERVICE` build arg (builder copies a single app's manifest + all shared packages, builds `@packages/*` then the app; the runner installs `--prod` and runs `node apps/<svc>/dist/server.js`). The web image builds `apps/web` with Vite and serves it with nginx (SPA fallback + `/api` proxied to the gateway).

```bash
# 1. Prepare production env from the template
cp .env.production.example .env.production   # then fill in real secrets

# 2. Build & start the whole stack
docker compose -f docker-compose.prod.yml up -d --build

# 3. Inspect status / logs
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

**Deploying to a fresh VM** — `scripts/setup-oracle-vm.sh` provisions the host, and `scripts/deploy.sh` (run on the VM) pulls the latest code, installs deps, ensures `.env.production` exists, builds, starts, waits for warm-up, and reports status. `scripts/check-health.sh` prints per-service container status and greps recent logs for errors.

```bash
./scripts/setup-oracle-vm.sh   # one-time VM provisioning
./scripts/deploy.sh            # build + deploy the whole stack
./scripts/check-health.sh      # quick health report
```

Deployment details, as implemented in this repository: the compose file's header targets an **Oracle Cloud Always Free ARM VM running Docker + Compose**. **MongoDB is hosted externally (Atlas)** — Redis and RabbitMQ run inside the compose stack. No CI/CD pipeline, domain, or HTTPS termination is configured in this repository.

---

## 🧪 Testing

Unit tests are written with **Vitest** and live beside the services under `src/__tests__`:

- `auth-service` — registration, login, verification service behavior
- `user-service` — user service behavior
- `product-service` — product service behavior
- `cart-service` — cart service behavior
- `order-service` — order service + outbox service
- `payment-service` — payment service behavior

```bash
pnpm test      # vitest run (discovers all *.test.ts across the workspace)
```

> The per-app `package.json` still declares `test: "echo \"No tests yet\" && exit 0"` stubs; the root `pnpm test` runs the real Vitest suite.

---

## 📡 API Overview

All endpoints are exposed through the gateway under `/api` and return the standard shape `{ success, message, data? }`.

### 🔐 Auth — `/api/auth`
| Method   | Endpoint        | Auth      | Description                     |
| -------- | --------------- | --------- | ------------------------------- |
| `GET`    | `/`             | public    | Service health/label            |
| `POST`   | `/register`     | public    | Register + send OTP (rate-limited) |
| `POST`   | `/login`        | public    | Login, returns JWT + profile    |
| `POST`   | `/verify-phone` | public    | Confirm OTP (rate-limited)      |
| `POST`   | `/resend-otp`   | public    | Resend OTP (rate-limited)       |

### 👤 Users — `/api/users`
| Method  | Endpoint                     | Auth           | Description                   |
| ------- | ---------------------------- | -------------- | ----------------------------- |
| `GET`   | `/profile`                   | Bearer         | Current user profile          |
| `PATCH` | `/notification-preferences`  | Bearer         | Toggle email / sms / whatsapp |
| `GET`   | `/`                          | Bearer (super admin role check in service) | List users |
| `PATCH` | `/:userId/role`              | Bearer         | Update a user's role          |

### 📦 Products — `/api/products`
| Method   | Endpoint            | Auth             | Description                  |
| -------- | ------------------- | ---------------- | ---------------------------- |
| `GET`    | `/`                 | public           | List + filter + paginate     |
| `GET`    | `/:id`              | public           | Get one product              |
| `POST`   | `/`                 | Admin/SuperAdmin | Create product               |
| `PUT`    | `/:id`              | Admin/SuperAdmin | Update product               |
| `DELETE` | `/:id`              | Admin/SuperAdmin | Delete product               |
| `POST`   | `/import/template`… | see below        | CSV import helpers           |

Bulk/asset routes (`/products/import/template`, `/products/import/preview`, `/products/import`, `/products/upload-image`) are `Admin/SuperAdmin` only.

### 🏷️ Categories & Brands — `/api/categories`, `/api/brands`
Public `GET /` and `GET /:id`; `POST`, `PUT /:id`, `DELETE /:id` are `Admin/SuperAdmin` only.

### 🛒 Cart — `/api/cart`
| Method   | Endpoint          | Auth   | Description            |
| -------- | ----------------- | ------ | ---------------------- |
| `POST`   | `/`               | Bearer | Add item / quantity    |
| `GET`    | `/`               | Bearer | Get cart               |
| `PATCH`  | `/:productId`     | Bearer | Update item quantity   |
| `DELETE` | `/:productId`     | Bearer | Remove an item         |
| `DELETE` | `/`               | Bearer | Clear cart             |

### 📋 Orders — `/api/orders`
| Method   | Endpoint | Auth   | Description                           |
| -------- | -------- | ------ | ------------------------------------- |
| `GET`    | `/`      | Bearer | List user's orders (filters + paging) |
| `GET`    | `/:id`   | Bearer | Order details                         |
| `POST`   | `/`      | Bearer | Create order (verified phone required)|
| `PUT`    | `/:id`   | Bearer | Update order (admin)                  |
| `DELETE` | `/:id`   | Bearer | Delete order (admin)                  |

### 💳 Payments — `/api/payments`
| Method   | Endpoint                | Auth   | Description                                    |
| -------- | ----------------------- | ------ | ---------------------------------------------- |
| `GET`    | `/:id`                  | Bearer | Payment by id                                  |
| `GET`    | `/order/:orderId`       | Bearer | Payment for an order (polled by checkout)      |
| `GET`    | `/user/:userId`         | Bearer | All payments for a user                        |
| `POST`   | `/verify`               | Bearer | Verify Razorpay signature + finalize success   |
| `POST`   | `/webhook`              | public*| Razorpay webhook (signature-verified, body-parser raw) |

> Razorpay order creation has **no public endpoint** — it's triggered internally when the payment service consumes `PAYMENT_INITIATED`.

---



## 🚀 Future Development  
 
The core e-commerce platform is in place, with the following features planned for the next stages of development: 
 
- **WhatsApp Notifications** — Extend the existing notification service with a WhatsApp provider using a production WhatsApp Business API. Order confirmation, payment updates, and delivery-related notifications will be triggered from the existing RabbitMQ event flow, keeping the notification channel independent from the order and payment services. 
 
- **Multi-Tenant SaaS** — Evolve the platform to support multiple businesses on the same infrastructure. The plan is to introduce tenant isolation across users, products, orders, carts, and other business data, with tenant-aware authentication and authorization at the API Gateway and service level. Each business will be able to manage its own catalog, customers, orders, and configuration independently. 
 
- **AI Shopping Assistant** — Add an AI-powered shopping layer on top of the existing product and catalog services. The assistant will use product data, categories, pricing, availability, and customer context to help users find relevant products, compare options, and get personalized recommendations. The assistant will interact with the existing backend through dedicated APIs rather than being tightly coupled to individual microservices.

---

## 👤 Author

**Nitin Singh Rawat** — backend & microservices engineering

- GitHub: [nitinrawat0053](https://github.com/nitinrawat0053)
- LinkedIn: [nitin-singh-rawat](https://linkedin.com/in/nitin-singh-rawat-9594b228b)
- Email: [nitinrawat2040@gmail.com](mailto:nitinrawat2040@gmail.com)

---

<div align="center">

**If you found this project interesting, consider giving it a star ⭐**

Built with Node.js, TypeScript, MongoDB, Redis, RabbitMQ and microservices ❤️

</div>