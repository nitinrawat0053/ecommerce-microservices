# ── Reusable multi-stage Dockerfile for all backend services ──
# Usage: docker build --build-arg SERVICE=product-service -t service-name .
#
# Builds the entire monorepo so workspace packages (@packages/*) resolve correctly,
# then copies only the required service + shared packages into a slim runtime image.

# ════════════════════════════════════════════════════════════
# Stage 1 – Builder
# ════════════════════════════════════════════════════════════
FROM node:22-alpine AS builder

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
COPY packages/jwt/package.json           packages/jwt/
COPY packages/shared-types/package.json  packages/shared-types/
COPY packages/validation/package.json    packages/validation/
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
COPY packages/jwt/       packages/jwt/
COPY packages/shared-types/ packages/shared-types/
COPY packages/validation/   packages/validation/
COPY apps/${SERVICE}/    apps/${SERVICE}/

# Copy root tsconfig base (each service's tsconfig.json extends ../../tsconfig.base.json)
COPY tsconfig.base.json ./

# Build shared packages first, then the service
RUN pnpm --filter @packages/config build && \
    pnpm --filter @packages/errors build && \
    pnpm --filter @packages/logger build && \
    pnpm --filter @packages/rabbitmq build && \
    pnpm --filter @packages/redis build && \
    pnpm --filter @packages/jwt build && \
    pnpm --filter @packages/shared-types build && \
    pnpm --filter @packages/validation build && \
    pnpm --filter @apps/${SERVICE} build

# ════════════════════════════════════════════════════════════
# Stage 2 – Production runtime
# ════════════════════════════════════════════════════════════
FROM node:22-alpine AS runner

ARG SERVICE
ENV NODE_ENV=production
ENV SERVICE=${SERVICE}
WORKDIR /app

# Copy workspace root manifests so the pnpm virtual store/layout is valid
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/tsconfig.base.json ./

# Copy the root node_modules (holds the .pnpm virtual store with all packages)
COPY --from=builder /app/node_modules ./node_modules/

# Copy the built service into its workspace path (dist + manifest + its node_modules symlinks)
COPY --from=builder /app/apps/${SERVICE}/dist          ./apps/${SERVICE}/dist/
COPY --from=builder /app/apps/${SERVICE}/package.json  ./apps/${SERVICE}/package.json
COPY --from=builder /app/apps/${SERVICE}/node_modules  ./apps/${SERVICE}/node_modules/

# Copy built shared packages into their workspace paths (dist + manifest)
COPY --from=builder /app/packages/config/dist          ./packages/config/dist/
COPY --from=builder /app/packages/config/package.json  ./packages/config/package.json
COPY --from=builder /app/packages/errors/dist          ./packages/errors/dist/
COPY --from=builder /app/packages/errors/package.json  ./packages/errors/package.json
COPY --from=builder /app/packages/logger/dist          ./packages/logger/dist/
COPY --from=builder /app/packages/logger/package.json  ./packages/logger/package.json
COPY --from=builder /app/packages/rabbitmq/dist        ./packages/rabbitmq/dist/
COPY --from=builder /app/packages/rabbitmq/package.json ./packages/rabbitmq/package.json
COPY --from=builder /app/packages/redis/dist           ./packages/redis/dist/
COPY --from=builder /app/packages/redis/package.json   ./packages/redis/package.json
COPY --from=builder /app/packages/jwt/dist             ./packages/jwt/dist/
COPY --from=builder /app/packages/jwt/package.json     ./packages/jwt/package.json
COPY --from=builder /app/packages/shared-types/dist    ./packages/shared-types/dist/
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=builder /app/packages/validation/dist      ./packages/validation/dist/
COPY --from=builder /app/packages/validation/package.json ./packages/validation/package.json

# Reinstall to fix hoisting/symlinks for the runtime layout (fast via copied .pnpm cache)
RUN corepack enable && corepack prepare pnpm@11 --activate
ENV CI=true
RUN pnpm install --prod --prefer-offline

EXPOSE 3000

CMD node apps/${SERVICE}/dist/server.js
