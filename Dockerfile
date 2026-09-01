# ── Reusable multi-stage Dockerfile for all backend services ──
# Usage: docker build --build-arg SERVICE=product-service -t service-name .
#
# Builds the entire monorepo so workspace packages (@packages/*) resolve correctly,
# then copies only the required service + shared packages into a slim runtime image.

# ════════════════════════════════════════════════════════════
# Stage 1 – Builder
# ════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder

ARG SERVICE

RUN apk add --no-cache python3 make g++   # node-gyp may need native build tools

WORKDIR /app

# Copy pnpm lockfile & workspace config first (layer caching)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy only package.json files of workspace packages & the target service
# so `pnpm install` can resolve the workspace graph without copying all source.
COPY packages/config/package.json        packages/config/
COPY packages/errors/package.json        packages/errors/
COPY packages/logger/package.json        packages/logger/
COPY packages/rabbitmq/package.json      packages/rabbitmq/
COPY packages/redis/package.json         packages/redis/
COPY apps/${SERVICE}/package.json        apps/${SERVICE}/

# Install pnpm globally, then install deps (frozen lockfile)
RUN corepack enable && corepack prepare pnpm@11 --activate
RUN pnpm install --frozen-lockfile

# Copy the full source of shared packages + the target service
COPY packages/config/    packages/config/
COPY packages/errors/    packages/errors/
COPY packages/logger/    packages/logger/
COPY packages/rabbitmq/  packages/rabbitmq/
COPY packages/redis/     packages/redis/
COPY apps/${SERVICE}/    apps/${SERVICE}/

# Copy root tsconfig (needed for project references)
COPY tsconfig.json ./

# Build shared packages first, then the service
RUN pnpm --filter @packages/config build && \
    pnpm --filter @packages/errors build && \
    pnpm --filter @packages/logger build && \
    pnpm --filter @packages/rabbitmq build && \
    pnpm --filter @packages/redis build && \
    pnpm --filter @apps/${SERVICE} build

# ════════════════════════════════════════════════════════════
# Stage 2 – Production runtime
# ════════════════════════════════════════════════════════════
FROM node:20-alpine AS runner

ARG SERVICE
ENV NODE_ENV=production
WORKDIR /app

# Copy the built service
COPY --from=builder /app/apps/${SERVICE}/dist          ./dist/
COPY --from=builder /app/apps/${SERVICE}/package.json  ./

# Copy built shared packages that the service imports at runtime
COPY --from=builder /app/packages/config/dist   ./packages/config/dist/
COPY --from=builder /app/packages/config/package.json ./packages/config/package.json
COPY --from=builder /app/packages/errors/dist   ./packages/errors/dist/
COPY --from=builder /app/packages/errors/package.json ./packages/errors/package.json
COPY --from=builder /app/packages/logger/dist   ./packages/logger/dist/
COPY --from=builder /app/packages/logger/package.json ./packages/logger/package.json
COPY --from=builder /app/packages/rabbitmq/dist  ./packages/rabbitmq/dist/
COPY --from=builder /app/packages/rabbitmq/package.json ./packages/rabbitmq/package.json
COPY --from=builder /app/packages/redis/dist    ./packages/redis/dist/
COPY --from=builder /app/packages/redis/package.json ./packages/redis/package.json

# Install only production dependencies (no devDependencies)
RUN corepack enable && corepack prepare pnpm@11 --activate
RUN pnpm install --frozen-lockfile --prod

EXPOSE 3000

CMD ["node", "dist/server.js"]
