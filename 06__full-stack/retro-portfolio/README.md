# retro-portfolio

Personal portfolio site for **YK.DEV** — a retro terminal–inspired site covering DevOps, MLOps, full-stack, and mobile work. Built with Astro for content and routing, React for interactive UI, and Three.js for the hero scene.

## Features

- **Hero** — 3D particle background (`@react-three/fiber`), animated terminal, GSAP transitions
- **About** — Dedicated `/about` page with bio, experience, and stats
- **Blog** — MDX posts grouped by collection (`devops`, `fullstack`, `mobile`, `mlops`, `series`, plus a root `blog` collection)
- **MDX components** — Custom `Callout` and `Step` blocks for long-form posts
- **Styling** — Tailwind CSS v4 via the Vite plugin
- **SPA-style navigation** — Client-side routing wrapper for smoother page transitions

## Tech stack

| Layer        | Tools |
| ------------ | ----- |
| Framework    | [Astro](https://astro.build) 6 |
| UI           | [React](https://react.dev) 19 |
| 3D           | [Three.js](https://threejs.org), `@react-three/fiber`, `@react-three/drei` |
| Animation    | [GSAP](https://gsap.com), `@gsap/react` |
| Content      | `@astrojs/mdx`, Astro Content Collections |
| Styling      | [Tailwind CSS](https://tailwindcss.com) 4 |
| Runtime      | [Bun](https://bun.sh) (recommended) |

**Node.js** `>=22.12.0` is required (`package.json` `engines`).

## Getting started

```sh
git clone https://github.com/ShaharyarShakir/retro-portfolio.git
cd retro-portfolio
bun install
bun dev
```

Open [http://localhost:4321](http://localhost:4321).

### Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `bun dev`      | Start the dev server                 |
| `bun build`    | Production build to `./dist/`        |
| `bun preview`  | Preview the production build locally |
| `bun astro …`  | Run Astro CLI commands               |

## Project structure

```text
/
├── public/                 # Static assets (favicon, etc.)
├── src/
│   ├── components/         # React & Astro UI
│   │   ├── about/
│   │   ├── blog/
│   │   ├── common/         # Nav, Footer, RouterWrapper
│   │   ├── hero/           # HeroScene, Terminal, HeroText
│   │   └── sections/       # Hero, AboutPreview, Blog, About
│   ├── content/
│   │   └── blog/           # MDX posts by topic folder
│   ├── layouts/            # BaseLayout, BlogPostLayout
│   ├── pages/
│   │   ├── index.astro     # Home: Hero, About preview, Blog teaser
│   │   ├── about/
│   │   └── blog/           # Index + dynamic post routes
│   ├── styles/
│   │   └── global.css
│   ├── utils/
│   │   └── pillar-data.ts  # About “pillars” copy
│   ├── content.config.ts   # Blog collection schemas
│   └── content/blogCollections.ts
├── astro.config.mjs
└── package.json
```

## Blog content

Posts live under `src/content/blog/` in topic folders (`devops`, `fullstack`, `mobile`, etc.). Each post uses frontmatter validated in `src/content.config.ts`:

- `title`, `excerpt`, `date`, `tag`
- Optional: `featured`, `draft`, `readTime`, `github`

Drafts are excluded from production builds when `draft: true`. Collections are aggregated in `src/content/blogCollections.ts`.

Routes:

- `/blog` — listing with category filters
- `/blog/[collection]/[slug]` — collection-scoped posts
- `/blog/[...slug]` — catch-all for other blog paths

## Configuration

- **Astro** — `astro.config.mjs` (React + MDX integrations, Tailwind Vite plugin)
- **TypeScript** — `tsconfig.json`
- **Content** — `src/content.config.ts`

## Roadmap (in code)

The home page still has commented placeholders for future sections (Stack, Projects, Contact). Nav links already point at `#stack`, `#projects`, and `#contact` for when those ship.

## License

[MIT](LICENSE) © 2026 Shaharyar Shakir
