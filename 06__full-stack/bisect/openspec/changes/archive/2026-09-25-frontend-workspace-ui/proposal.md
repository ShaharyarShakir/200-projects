# Proposal: Bisect Frontend Workspace UI

## Why

Bisect currently provides foundational backend functionality to represent and manage agent sessions, authentication, repository synchronization, and execution loops. However, these capabilities are currently only accessible via raw backend API routes and development tooling.

A frontend web interface is required to provide a visual cockpit for developers to interact with existing backend features without introducing new agent behaviors or modifying the backend domain model.

## What Changes

- **Application Shell & Layout**: Implement the primary Bisect application layout featuring top header navigation, responsive sidebar navigation, main content area, user profile/status display, and clean viewport management across desktop, laptop, and tablet screens.
- **Authentication UI Integration**: Implement GitHub OAuth authentication UI (login button, authenticated user badge, profile dropdown, logout trigger, and route protection) integrating with the existing `/api/v1/auth/github/login`, `/api/v1/auth/github/callback`, and `/api/v1/auth/me` endpoints.
- **Agent Workspace Cockpit**: Build the main workspace interface displaying workspace status, repository context, agent session lifecycle states (`created`, `running`, `completed`, `failed`, `terminated`, `timed_out`), execution parameters, and available user actions.
- **Session & State Inspector**: Provide a detailed session view presenting session identifiers, current status, token usage accounting, iteration and command counts, execution duration, and termination reasons directly from backend `AgentSession` models.
- **Activity & Event Feed**: Introduce a chronological event feed visualizing agent execution steps, shell command dispatches, file inspection results, validation checks, warnings, and errors.
- **Frontend API Client & State Management**: Create a strongly-typed API client handling REST communication, JWT session tokens, polling mechanisms for active runs, normalized error handling, loading spinners/skeletons, and comprehensive empty states.
- **Non-Goals & Out of Scope**:
  - No new agent behaviors or Claude prompt alterations.
  - No automated Git commits, branching, or PR creations from the UI (Git ownership remains strictly human).
  - No WebSocket or server-sent events (MVP relies on standard REST polling).
  - No embedded full terminal emulator or WebAssembly sandboxing.
  - No changes to existing backend domain models or database schemas.

## Capabilities

### New Capabilities
- `frontend-workspace-ui`: Provides the complete frontend application interface for Bisect, including application shell, GitHub OAuth authentication flows, agent workspace cockpit, session inspection, activity event history, and centralized API communication.

### Modified Capabilities
- None.

## Impact

- **New Codebase Directory**: Introduces `frontend/` containing a Next.js (App Router) application with TypeScript, Tailwind CSS, shadcn/ui-styled components, and pnpm package management.
- **API Contracts**: Integrates with existing backend endpoints (`/api/v1/auth/*`, `/api/v1/repositories/*`, and session schemas).
- **Tooling & Build**: Configures `pnpm`, Next.js build scripts, ESLint, TypeScript checking, and component testing (Vitest / React Testing Library).
