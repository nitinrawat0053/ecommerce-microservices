# 🛒 E-Commerce Microservices Platform

A scalable **e-commerce backend platform** built using a **microservices architecture** with **Node.js, TypeScript, Express.js, MongoDB, Redis, and RabbitMQ**.

The project is designed to demonstrate how a modern distributed e-commerce system can be structured using independently deployable services, asynchronous communication, centralized configuration, caching, authentication, and third-party integrations.

---

## ✨ Features

### 🔐 Authentication & Authorization

* Secure user registration and login
* JWT-based authentication
* Access and refresh token support
* Password hashing with bcrypt
* OTP verification using Twilio
* Protected routes and authentication middleware
* Role-based authorization for protected operations

### 👤 User Management

* User profile management
* User-specific data handling
* Secure service-level communication
* Centralized authentication flow

### 📦 Product & Inventory Management

* Product catalog management
* Create, update, and delete products
* Product retrieval and filtering
* Inventory management
* Redis caching for frequently accessed data
* Protected admin operations

### 🛒 Shopping Cart

* Add products to cart
* Update cart item quantities
* Remove items from cart
* Retrieve user-specific carts
* Redis integration for faster cart operations

### 📋 Order Management

* Create and manage orders
* Retrieve user order history
* Order status management
* Inventory-aware order processing
* Event-driven communication with other services

### 💳 Payment Processing

* Razorpay payment order creation
* Secure payment verification
* Separate payment lifecycle management
* Integration with the order workflow

### 🔔 Notifications

* Event-driven notifications using RabbitMQ
* Email notifications using Resend
* SMS/OTP integration using Twilio
* Decoupled notification processing

### ⚡ Performance & Scalability

* Redis caching
* Independent microservices
* Asynchronous communication with RabbitMQ
* Shared reusable packages
* Monorepo architecture with Turborepo
* Horizontally scalable service design

---

# 🏗️ Architecture Overview

The application follows a **microservices architecture** where each major business domain is handled by an independent service.

The **API Gateway** acts as the primary entry point and routes incoming requests to the appropriate microservice.

```text
                              ┌───────────────────┐
                              │    API Gateway    │
                              │ Routing & Security│
                              └─────────┬─────────┘
                                        │
          ┌───────────────┬─────────────┼─────────────┬───────────────┐
          │               │             │             │               │
          ▼               ▼             ▼             ▼               ▼

   ┌────────────┐  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
   │    Auth    │  │    User    │ │  Product   │ │    Cart    │ │   Order    │
   │  Service   │  │  Service   │ │  Service   │ │  Service   │ │  Service   │
   └─────┬──────┘  └────────────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
         │                              │              │              │
         │                              ▼              ▼              │
         │                           MongoDB         Redis             │
         │                                                              │
         └──────────────────────────────────────────────────────────────┤
                                                                        │
                                                                        ▼

                                                          ┌────────────────────┐
                                                          │  Payment Service   │
                                                          │     Razorpay       │
                                                          └─────────┬──────────┘
                                                                    │
                                                                    ▼
                                                             ┌─────────────┐
                                                             │  RabbitMQ   │
                                                             │ Message Bus │
                                                             └──────┬──────┘
                                                                    │
                                                                    ▼
                                                         ┌────────────────────┐
                                                         │ Notification Service│
                                                         │   Email / SMS       │
                                                         └────────────────────┘
```

---

# 🚀 Tech Stack

## 🟢 Backend

* **Node.js** — Runtime environment
* **TypeScript** — Type-safe development
* **Express.js** — Web framework
* **MongoDB** — Primary database
* **Mongoose** — MongoDB ODM

## ⚡ Infrastructure

* **Redis** — Caching and fast data access
* **RabbitMQ** — Asynchronous event-driven communication
* **Docker & Docker Compose** — Infrastructure containerization

## 🔐 Security

* **JWT** — Authentication and authorization
* **bcrypt** — Password hashing
* **Zod** — Request validation
* **CORS** — Cross-origin protection
* **Helmet** — Security headers
* **Rate Limiting** — API abuse protection

## 🔗 Integrations

* **Razorpay** — Payment processing
* **Twilio** — OTP and SMS services
* **Resend** — Email notifications

## 🏗️ Developer Tooling

* **pnpm Workspaces** — Monorepo package management
* **Turborepo** — Build and task orchestration
* **ESLint** — Code quality
* **Docker Compose** — Local infrastructure setup

---

# 🧩 Microservices

| Service                  | Description                              |   Port |
| ------------------------ | ---------------------------------------- | -----: |
| **API Gateway**          | Central entry point and request routing  | `3000` |
| **Auth Service**         | Authentication, JWT and OTP verification | `3001` |
| **User Service**         | User profile and account management      | `3002` |
| **Product Service**      | Product catalog and inventory management | `3003` |
| **Cart Service**         | Shopping cart operations                 | `3004` |
| **Order Service**        | Order creation and lifecycle management  | `3005` |
| **Payment Service**      | Razorpay payment processing              | `3006` |
| **Notification Service** | Email and notification processing        | `3007` |

---

# 📚 Shared Packages

The project uses reusable packages to avoid code duplication and maintain consistency across services.

| Package                  | Responsibility                            |
| ------------------------ | ----------------------------------------- |
| `@packages/config`       | Centralized environment configuration     |
| `@packages/errors`       | Custom error classes and error handling   |
| `@packages/jwt`          | JWT generation and verification           |
| `@packages/logger`       | Centralized logging utilities             |
| `@packages/rabbitmq`     | RabbitMQ connection and messaging helpers |
| `@packages/redis`        | Redis client and caching utilities        |
| `@packages/shared-types` | Shared TypeScript interfaces and types    |
| `@packages/validation`   | Zod validation schemas                    |

---

# 📁 Project Structure

```text
ecommerce-microservices/
│
├── apps/
│   │
│   ├── api-gateway/          # API Gateway
│   ├── auth-service/         # Authentication & OTP
│   ├── user-service/         # User management
│   ├── product-service/      # Products & inventory
│   ├── cart-service/         # Shopping cart
│   ├── order-service/        # Order processing
│   ├── payment-service/      # Razorpay payments
│   └── notification-service/ # Email & notifications
│
├── packages/
│   │
│   ├── config/               # Environment configuration
│   ├── errors/               # Custom errors
│   ├── jwt/                  # JWT utilities
│   ├── logger/               # Logging
│   ├── rabbitmq/             # RabbitMQ client
│   ├── redis/                # Redis client
│   ├── shared-types/         # Shared TypeScript types
│   └── validation/           # Zod validation
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

# 🛠️ Prerequisites

Before running the project, make sure you have the following installed:

* Node.js `>= 18`
* pnpm `>= 9`
* Docker
* Docker Compose
* MongoDB
* Redis

---

# 📦 Installation

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd ecommerce-microservices
```

## 2. Install Dependencies

```bash
pnpm install
```

## 3. Start Infrastructure Services

```bash
docker compose up -d
```

This starts the required infrastructure services, including:

* RabbitMQ
* Redis
* Any additional services configured in `docker-compose.yml`

## 4. Configure Environment Variables

Create the required `.env` files for each service.

Example:

```env
NODE_ENV=development
PORT=3001

MONGODB_URI=mongodb://localhost:27017/auth-db

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-super-secret-key
JWT_EXPIRY=7d

RABBITMQ_URL=amqp://admin:admin@localhost:5672
```

### Auth Service

```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Payment Service

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Notification Service

```env
RESEND_API_KEY=your_resend_api_key
```

---

# 🚀 Running the Application

### Start All Services

```bash
pnpm dev
```

### Start an Individual Service

```bash
pnpm --filter @apps/auth-service dev
```

Example:

```bash
pnpm --filter @apps/product-service dev
```

---

# 🔧 Available Scripts

```bash
# Start all services in development mode
pnpm dev

# Build all services
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint
```

### Build a Specific Service

```bash
pnpm --filter @apps/auth-service build
```

---

# 📡 API Endpoints

## 🔐 Authentication

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| `POST` | `/api/auth/register`      | Register a new user  |
| `POST` | `/api/auth/login`         | Authenticate user    |
| `POST` | `/api/auth/verify-otp`    | Verify OTP           |
| `POST` | `/api/auth/refresh-token` | Refresh access token |

## 📦 Products

| Method   | Endpoint            | Description       |
| -------- | ------------------- | ----------------- |
| `GET`    | `/api/products`     | Get all products  |
| `GET`    | `/api/products/:id` | Get product by ID |
| `POST`   | `/api/products`     | Create product    |
| `PUT`    | `/api/products/:id` | Update product    |
| `DELETE` | `/api/products/:id` | Delete product    |

## 🛒 Cart

| Method   | Endpoint              | Description      |
| -------- | --------------------- | ---------------- |
| `GET`    | `/api/cart`           | Get user cart    |
| `POST`   | `/api/cart/items`     | Add item to cart |
| `PUT`    | `/api/cart/items/:id` | Update cart item |
| `DELETE` | `/api/cart/items/:id` | Remove cart item |

## 📋 Orders

| Method | Endpoint          | Description        |
| ------ | ----------------- | ------------------ |
| `POST` | `/api/orders`     | Create a new order |
| `GET`  | `/api/orders`     | Get user orders    |
| `GET`  | `/api/orders/:id` | Get order details  |

## 💳 Payments

| Method | Endpoint               | Description                   |
| ------ | ---------------------- | ----------------------------- |
| `POST` | `/api/payments/create` | Create Razorpay payment order |
| `POST` | `/api/payments/verify` | Verify payment                |

---

# 🐳 Docker

## Start Infrastructure

```bash
docker compose up -d
```

## View Logs

```bash
docker compose logs -f
```

## Stop Infrastructure

```bash
docker compose down
```

---

# 📊 Monitoring & Debugging

### RabbitMQ Management Dashboard

```text
http://localhost:15672
```

### MongoDB

```text
mongodb://localhost:27017
```

### Redis

Use:

* Redis CLI
* RedisInsight
* Any Redis-compatible client

---

# 🎯 Key Architecture Decisions

### 🧩 Microservices

Each business domain is separated into an independent service, allowing services to evolve and scale independently.

### 📨 Event-Driven Communication

RabbitMQ is used for asynchronous communication between services where direct synchronous calls are unnecessary.

### ⚡ Redis Caching

Redis reduces unnecessary database queries and improves performance for frequently accessed data.

### 📦 Monorepo Architecture

pnpm workspaces and Turborepo manage shared packages and services in a single repository.

### 🔐 Centralized Security

Authentication, validation, error handling, and shared utilities are structured consistently across services.

---

# 🧪 Testing

The project is structured to support:

* Input validation testing
* Authentication testing
* Service-level testing
* Integration testing
* Error handling and failure scenarios

Run tests with:

```bash
pnpm test
```

---

# 🚧 Future Improvements

Some areas planned for further improvement:

* [ ] API documentation with Swagger
* [ ] Advanced product search and filtering
* [ ] AI-powered product recommendations
* [ ] Smart inventory forecasting
* [ ] Advanced analytics dashboard

---

# 👨‍💻 Author

**Nitin Singh Rawat**

Connect with me:

* GitHub: `https://github.com/nitinrawat0053`
* LinkedIn: `https://linkedin.com/in/nitin-singh-rawat-9594b228b`
* Email: `nitinrawat2040@gmail.com`

---

# 📝 License

This project is licensed under the **MIT License**.

---

<div align="center">

### ⭐ If you found this project interesting, consider giving it a star!

**Built with ❤️ using Node.js, TypeScript, and Microservices**

</div>
