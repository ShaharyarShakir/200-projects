# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm lint` | Run ESLint over the project |
| `pnpm preview` | Preview the production build |

Use **pnpm** — npm and yarn are not supported.

## Tech Stack

- **React 19** + **TypeScript** (strict, `verbatimModuleSyntax`)
- **Vite 8** with `@vitejs/plugin-react` + `@rolldown/plugin-babel` (Babel-based React Compiler preset)
- **Three.js** + **React Three Fiber** for 3D scenes
- **Anime.js** for animations
- **ESLint 10** with React Hooks, React Refresh, and TypeScript ESLint

## Architecture

```
src/
├── main.tsx            # Entry point — StrictMode + root render
├── App.tsx             # Composition root — integrates 3D scenes and UI
├── index.css           # Global styles (full-width/height on html/body/#root)
├── components/
│   └── Hero.tsx        # Landing section UI component
├── scenes/
│   └── AgentNetwork.ts # Three.js / R3F scene logic (agent network visualization)
└── animations/
    └── hero.ts         # Anime.js animation logic for the hero section
```

**Separation of concerns**: 3D scene logic lives in `src/scenes/`, animation logic in `src/animations/`, and UI in `src/components/`. Keep these layers separate — do not mix Three.js or Anime.js internals into UI components.

## Development Principles

From `Agents.md`:

- Use TypeScript.
- Prefer small, focused components. Avoid unnecessary abstractions.
- Prefer composition. Do not create giant components.
- Do not introduce dependencies without a reason.
- Keep 3D logic separate from UI logic.
- Preserve underlying Three.js concepts — do not hide important Three.js behavior behind unnecessary abstractions.

## Agent Ownership

Agents work in isolated Git worktrees. Do not modify files owned by another agent unless the task requires integration work.

| Agent | Owns |
|---|---|
| **3D Agent** | `src/three/`, `src/components/network/` |
| **UI Agent** | `src/components/ui/`, `src/components/layout/` |
| **Landing Sections Agent** | `src/components/sections/` |
| **Integration Agent** | `App.tsx`, application composition, integration between components |
