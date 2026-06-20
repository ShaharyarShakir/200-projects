# ⚡ Skilld: The Registry for Agentic Intelligence

Skilld is a high-performance, developer-first registry and explorer for reusable procedural AI agent skills. Built on **TanStack Start** and **Firebase Data Connect** (backed by Postgres), Skilld allows developers to discover, publish, configure, and install modular capabilities for their autonomous agentic workflows.

---

## 🚀 Key Features

- **🔍 Registry Explorer**: Real-time searching and filtering of published skills via URL query states.
- **✨ Seamless Publishing**: Publish reusable capabilities with system prompts, dependency commands, and usage code examples.
- **🔐 Clerk Authentication**: Secure authentication flow with automatic server-side syncing of user profiles to Postgres.
- **📦 Firebase Data Connect**: Schema-first relational database API using PostgreSQL (via PGlite in local development).
- **⚡ Server-Side Rendering (SSR)**: Instant page loading and SEO optimization using TanStack Start's Nitro-powered server engine.
- **🎨 Modern Dark Aesthetics**: Sleek dark-mode grid UI with terminal-like preview cards, micro-animations, and glassmorphism styling powered by Tailwind CSS v4.

---

## 🛠️ Technology Stack

- **Framework**: [TanStack Start](https://tanstack.com/router/latest/docs/framework/react/start/overview) (Vite + TanStack Router + TanStack Query + Nitro Server)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS custom design systems
- **Authentication**: [Clerk](https://clerk.com/) (`@clerk/tanstack-react-start`)
- **Database**: [Firebase Data Connect](https://firebase.google.com/docs/data-connect) (Postgres-backed backend services)
- **Local DB**: [PGlite](https://pglite.dev/) (WASM PostgreSQL running locally inside the emulator)
- **Runtime & Tooling**: [Bun](https://bun.sh/) (package runner), [Biome](https://biomejs.dev/) (linting and formatting), [Vitest](https://vitest.dev/) (testing)

---

## 📂 Project Structure

```
├── .firebase/                  # Firebase CLI configuration cache
├── components.json             # Component setup metadata
├── dataconnect/                # Firebase Data Connect Configuration & Schema
│   ├── schema/
│   │   └── schema.gql          # Relational PostgreSQL GraphQL Schema
│   ├── example/
│   │   ├── connector.yaml      # Client SDK generation configuration
│   │   ├── queries.gql         # Data Connect Queries (e.g., GetSkills)
│   │   └── mutations.gql       # Data Connect Mutations (e.g., InsertSkill/InsertUser)
│   └── dataconnect.yaml        # Data Connect service configurations
├── src/                        # React Application Source
│   ├── components/             # Reusable UI Components (Navbar, SkillCard, Crosshair)
│   ├── data/                   # Initial mock data/types
│   ├── dataconnect-generated/  # Automatically generated type-safe client SDK
│   ├── integrations/           # Third-party developer configurations (PostHog, TanStack Devtools)
│   ├── lib/                    # SDK initializations (Firebase/Data Connect client wrapper)
│   ├── routes/                 # File-based TanStack routing structure
│   │   ├── __auth/             # Auth pages (Sign-in/Sign-up routes)
│   │   ├── skills/             # Skills listing and submission routes
│   │   ├── __root.tsx          # App base Shell, Clerk Provider, & User DB sync
│   │   └── index.tsx           # Home landing page with recently created skills
│   ├── styles.css              # Custom Tailwind CSS v4 styles & design tokens
│   └── start.ts                # TanStack Start entry configuration
└── package.json                # Project dependencies and workspace scripts
```

---

## 🗄️ Database Architecture

Skilld maps its relational database using the GraphQL-based schema definition under `dataconnect/schema/schema.gql`.

### Schemas

1. **`User`** (`@table(key: "clerkId")`):
   - `clerkId: String! @unique` (maps the Clerk identity securely)
   - `email: String!`
   - `username: String`
   - `imageUrl: String`

2. **`Skill`** (`@table`):
   - `id: UUID!` (Primary Key auto-generated via `uuidV4()`)
   - `author: User!` (One-to-many relationship mapping back to `User`)
   - `title: String`
   - `description: String`
   - `tags: [String]!`
   - `installCommand: String!`
   - `promptConfig: String!`
   - `usageExample: String!`
   - `createdAt: Timestamp!` (Defaults to `request.time`)

### Operations
Database queries and mutations are defined in `.gql` files under `dataconnect/example/` and compiled to a type-safe TypeScript SDK:
- **`GetSkills`**: Fetches all skills matching search terms in titles/descriptions, sorted by creation date.
- **`InsertSkill`**: Mutation triggered when publishing a skill.
- **`InsertUser`**: Mutation triggered upon successful Clerk login to sync the user profile into PostgreSQL.

---

## ⚙️ Local Development Setup

To run Skilld locally on your machine, follow these instructions.

### 1. Prerequisites
Ensure you have [Bun](https://bun.sh/) (or Node/NPM/PNPM) installed.

### 2. Setup Environment Variables
Clone the `.env.example` file to `.env.local` and fill in your Clerk and Firebase configuration values:
```bash
cp .env.example .env.local
```

Example config:
```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CLERK_SECRET_KEY=sk_test_...

# Firebase
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

### 3. Install Dependencies
```bash
bun install
```

### 4. Start the Firebase Data Connect Emulator
Run the Firebase Local Emulator Suite. This boots the Data Connect engine and launches a local WASM Postgres instance using PGlite (configured in `firebase.json`):
```bash
npx firebase emulators:start
```
*The Data Connect emulator will run on `localhost:9399`.*

### 5. Generate Data Connect client SDK
Compile schema changes and generate the local TypeScript client SDK:
```bash
npx firebase dataconnect:sdk:generate
```
*Note: The emulator automatically regenerates SDK files on schema changes.*

### 6. Run the Dev Server
Launch the TanStack Start development server:
```bash
bun run dev
```
*The application will boot at [http://localhost:3000](http://localhost:3000).*

---

## 📜 Available Scripts

- **`bun run dev`**: Starts the Vite dev server for TanStack Start at port `3000`.
- **`bun run generate-routes`**: Triggers TanStack Router CLI to generate type-safe route files (`tsr generate`).
- **`bun run build`**: Builds the SSR-optimized application bundle for production deployment.
- **`bun run preview`**: Previews the production build locally.
- **`bun run test`**: Runs unit and component tests using Vitest.
- **`bun run format`**: Formats files using Biome.
- **`bun run lint`**: Inspects files for code smell and linting issues.
- **`bun run check`**: Runs Biome formatter, linter, and imports checker.


