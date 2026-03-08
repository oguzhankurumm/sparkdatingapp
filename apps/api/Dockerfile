# ============================================================
# Spark API — Multi-stage Dockerfile (pnpm monorepo)
# ============================================================

# ------ Stage 1: Base with pnpm ------
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate
WORKDIR /app

# ------ Stage 2: Install dependencies ------
FROM base AS deps

# Copy workspace config files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY turbo.json ./

# Copy package.json for every workspace the API depends on
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/validators/package.json ./packages/validators/
COPY tooling/typescript/package.json ./tooling/typescript/

# Install only the deps needed by @spark/api and its workspace dependencies
RUN pnpm install --frozen-lockfile --filter @spark/api...

# ------ Stage 3: Build ------
FROM base AS build

COPY --from=deps /app ./
COPY . .

# Build workspace packages first, then the API (turbo handles order)
RUN pnpm turbo build --filter=@spark/api...

# ------ Stage 4: Production runtime ------
FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

# We only need the built output and production node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./

# Re-install production-only deps in a clean layer
RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

COPY --from=deps /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=deps /app/apps/api/package.json ./apps/api/
COPY --from=deps /app/packages/types/package.json ./packages/types/
COPY --from=deps /app/packages/validators/package.json ./packages/validators/
COPY --from=deps /app/tooling/typescript/package.json ./tooling/typescript/

RUN pnpm install --frozen-lockfile --filter @spark/api... --prod

# Copy built output into final location
COPY --from=build /app/apps/api/dist ./apps/api/dist

# Create non-root user for security
RUN addgroup --system --gid 1001 sparkapi && \
    adduser --system --uid 1001 sparkapi
USER sparkapi

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
