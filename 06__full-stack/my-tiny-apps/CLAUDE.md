# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

My Tiny Apps is a Nuxt 4 + Vue 3 full-stack application for selling indie software (one-time purchases, no subscriptions). The stack is: **Nuxt 4, Vue 3, Drizzle ORM, LibSQL/Turso, Tailwind CSS v4, DaisyUI 5, Bun**.

## Commands

- **Dev server:** `bun run dev` (or `nuxt dev`)
- **Build:** `bun run build` (or `nuxt build`)
- **Generate static:** `bun run generate` (or `nuxt generate`)
- **Preview production:** `bun run preview` (or `nuxt preview`)
- **Lint:** `bun run lint` (uses `@nuxt/eslint`; ESLint config lives in `eslint.config.mjs` and imports `.nuxt/eslint.config.mjs`)
- **Type check:** `bunx tsc --noEmit` (tsconfig uses project references into `.nuxt/`)
- **Database migrate:** `bun run db:migrate` — or `bun run db:push` / `bun run db:generate` (drizzle-kit, schema: `server/db/schema.ts`)
- **Seed DB:** `bun run db:seed` (runs `server/db/seed.ts`)
- **Webhook tests:** `bun run test:webhook` (runs `scripts/test-webhook.ts` — verifies Paddle signature logic, product service, order service, token service, and webhook idempotency against local.db)

## Architecture

### Frontend (Nuxt app — `app/`)

- **Pages** (`app/pages/`): `index.vue` (home), `apps/index.vue` (catalog), `apps/[slug].vue` (product detail), plus `privacy.vue`, `support.vue`, `terms.vue`, `error.vue`.
- **Components** are grouped by domain under `app/components/`: `layout/` (AppNavbar, AppFooter), `products/` (ProductCard, ProductFeatures, ProductScreenshots), `ui/` (AppLogo, Container, ThemeToggle). Components are registered globally (no import needed) via `components: [{ path: '~/components', pathPrefix: false }]` in `nuxt.config.ts`.
- **Composables** (`app/composables/`): `useProducts` (reads from `app/shared/data/products.ts`, exposes `getProduct`, `featuredProduct`, `availableProducts`, `comingSoonProducts`), `usePaddle` (loads Paddle.js, opens checkout overlay), `useClipboard`.
- **Shared types/data**: `app/shared/types/` (Product, FaqItem) and `app/shared/data/` (products catalog, faqs). The product catalog is a static TypeScript array, **not** fetched from the database.
- **Styling**: Tailwind CSS v4 + DaisyUI 5. Theme tokens (colors, radii) are defined in `app/assets/css/main.css` via `@plugin "daisyui/theme"`. Light/dark mode handled by `@nuxtjs/color-mode`.

### Backend (Nuxt server — `server/`)

- **API routes** (`server/api/`): `webhooks/paddle.post.ts` is the Paddle webhook receiver. Server API uses `defineEventHandler`, `useRuntimeConfig`, `readRawBody`, etc.
- **Services** (`server/services/`): modular single-responsibility services consumed by the webhook handler:
  - `webhook.service.ts` — idempotency check + audit logging (`isEventProcessed`, `recordWebhookEvent`)
  - `product.service.ts` — `findProductByPaddleInfo`, `getFirstActiveProduct`
  - `order.service.ts` — `generateOrderNumber`, `createOrder`
  - `token.service.ts` — `createDownloadToken` (SHA-256 hash, 30-day expiry)
- **Database**: Drizzle ORM + LibSQL client (`@libsql/client`). Schema in `server/db/schema.ts` with tables for `products`, `orders`, `webhookEvents`, `downloadTokens`. Connection in `server/db/index.ts` (uses `TURSO_DATABASE_URL` or falls back to `file:local.db`).
- **Utilities** (`server/utils/`): `paddleWebhook.ts` — HMAC-SHA256 signature verification and a test-signature helper.

### Environment Variables

Copy `.env.example` to `.env` and fill in. Key vars: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_CLIENT_TOKEN`, `PADDLE_ENVIRONMENT` (sandbox/production), `PADDLE_PRODUCT_ID`, `PADDLE_PRICE_ID`. Paddle config is in `nuxt.config.ts` `runtimeConfig` (server-side keys) and `runtimeConfig.public` (client-side token).

### Testing the Webhook Flow

Run `bun run test:webhook` — it: (1) verifies Paddle signature generation/validation, (2) ensures a `tiny-compressor` product exists in local.db, (3) tests `findProductByPaddleInfo`, (4) simulates a `transaction.paid` webhook by creating an order + download token and records the event, (5) confirms idempotency by re-checking the same `eventId`.

## Key Patterns

- **Product slug aliasing**: `tiny-image-compressor` maps to `tiny-compressor` (see `useProducts`, `apps/[slug].vue`). Keep both paths working when adding new products.
- **Paddle checkout**: called client-side via `usePaddle` `openCheckout(priceId)`; server-side order creation happens only inside the verified webhook handler.
- **Idempotency**: every incoming webhook `event_id` is checked against `webhookEvents` before processing; duplicates return `{ received: true, status: 'already_processed' }`.
- **Download tokens**: generated as `crypto.randomBytes(32).base64url`, stored as SHA-256 hash; the raw token is returned once to the caller.
