# Spark Dating App

A next-gen dating platform — TikTok Live + Bumble + Hinge.

## Tech Stack

- **Web + Admin:** Next.js 15 (App Router, RSC, Server Actions)
- **Backend:** NestJS 10 + Drizzle ORM + PostgreSQL
- **Mobile:** Expo 52 + React Native (post-web validation)
- **Monorepo:** pnpm workspaces + Turborepo

## Getting Started

```bash
# Install dependencies
pnpm install

# Start local services (PostgreSQL, Redis, MinIO)
docker compose up -d

# Start all apps in dev mode
pnpm dev

# Or start individually
pnpm turbo dev --filter=@spark/web    # http://localhost:3000
pnpm turbo dev --filter=@spark/admin  # http://localhost:3001
pnpm turbo dev --filter=@spark/api   # http://localhost:4000
```

## Project Structure

```
apps/web      — Main dating app (spark.app)
apps/admin    — Admin dashboard (admin.spark.app)
apps/api      — NestJS backend API
apps/mobile   — React Native app (placeholder)
packages/ui   — Shared component library (Atomic Design)
packages/types      — Shared TypeScript types
packages/validators — Shared Zod schemas
packages/hooks      — Shared React hooks
packages/utils      — Shared utility functions
packages/i18n       — Internationalization (EN/TR)
tooling/            — ESLint, Prettier, TypeScript configs
```
