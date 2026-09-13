# AI Network Landing Page

## Project

Interactive AI company landing page built with:

- React
- TypeScript
- Three.js
- React Three Fiber
- Anime.js
- CSS/Tailwind

## Development principles

- Use TypeScript.
- Prefer small, focused components.
- Avoid unnecessary abstractions.
- Keep 3D logic separate from UI logic.
- Prefer composition.
- Do not create giant components.
- Do not introduce dependencies without a reason.

## Three.js principle

We are learning Three.js while using React Three Fiber.

Agents should understand and preserve the underlying Three.js concepts.

Do not hide important Three.js behavior behind unnecessary abstractions.

## Package manager

Use pnpm.

Do not use npm or yarn.

## Git

Agents work in isolated Git worktrees managed by Worktrunk.

Never modify another agent's worktree.

## Agent ownership

### 3D Agent

Owns:

- src/three/
- src/components/network/

### UI Agent

Owns:

- src/components/ui/
- src/components/layout/

### Landing Sections Agent

Owns:

- src/components/sections/

### Integration Agent

Owns:

- App.tsx
- application composition
- integration between components

## Git Commit Policy

Agents MUST NOT create Git commits.

Agents may:

- create files
- modify files
- delete files when explicitly requested
- run tests
- run formatters
- run linters
- inspect Git status
- inspect Git diffs

Agents MUST NOT:

- run `git commit`
- run `git push`
- merge branches
- rebase branches
- reset user changes
- discard user changes
- amend existing commits

The human developer owns all Git history.

Changes should remain as uncommitted working-tree changes for human review.

The human developer may commit changes file-by-file.

Agents MUST NOT run:

git add
git commit
git push
git reset
git restore
git clean