# AGENTS.md

## Stack

Nuxt 4 + Vue 3, Bun, Tailwind CSS v4 + DaisyUI 5, Drizzle ORM + LibSQL/Turso, Paddle (payments). See `CLAUDE.md` for full architecture.

## Commands

```bash
bun run dev            # Dev server
bun run build          # Production build
bun run lint           # ESLint (imports .nuxt/eslint.config.mjs)
bunx tsc --noEmit      # Type check — requires .nuxt/ (run dev or build first)
bun run db:push        # Push schema changes to DB
bun run db:seed        # Seed local.db
bun run test:webhook   # Webhook integration test (Paddle signature, orders, tokens, idempotency)
```

## Gotchas

- **Type check needs `.nuxt/`**: `bunx tsc --noEmit` will fail on a fresh clone. Run `bun run dev` or `bun run build` first to generate the tsconfig references.
- **Components are global**: registered via `components: [{ path: '~/components', pathPrefix: false }]` in `nuxt.config.ts` — no import needed in templates.
- **Product catalog is static**: defined in `app/shared/data/products.ts`, not from the DB. Don't add products to the database expecting them to appear on the site.
- **Slug aliasing**: `tiny-image-compressor` maps to `tiny-compressor` in `useProducts` and `apps/[slug].vue`. Preserve both paths when adding products.
- **Color mode**: `@nuxtjs/color-mode` with `classSuffix: ''` — the theme attribute is `data-theme="dark"`, not `class="dark"`.
- **Patch files**: `patch.js` / `patch.cjs` at the root are leftover one-off scripts. Delete them; make layout changes directly in the component source.
