# Design: Bisect Frontend Workspace UI

## Context

Bisect has implemented backend services for GitHub OAuth, repository synchronization, sandbox isolation, and agent session execution loops. The backend exposes REST APIs under `/api/v1/` and uses Pydantic models (`AgentSession`, `UserRead`, `RepositoryRead`, `LoopStep`). See `proposal.md` for motivation and `specs/frontend-workspace-ui/spec.md` for functional requirements.

The frontend must provide an intuitive visual cockpit that consumes these existing endpoints without altering backend contracts or automating Git operations.

## Goals / Non-Goals

**Goals:**
- Provide a responsive, modular Next.js application shell with header, sidebar, workspace canvas, and status widgets.
- Integrate GitHub OAuth flow with client-side token storage, profile hydration, and session protection.
- Build an agent workspace cockpit that displays session lifecycle status, metrics, and activity logs.
- Provide a robust API client with error normalization, loading skeletons, empty states, and polled execution updates.
- Keep the design modular so future features (real-time streaming, diff viewer, sandbox monitoring) slot in cleanly.

**Non-Goals:**
- WebSocket or WebRTC real-time transport (REST polling is used for MVP).
- Automated Git operations, commits, or branch creation.
- Arbitrary terminal emulation or interactive shell prompts.
- Modifying backend endpoints or database schemas.

## Decisions

### 1. Application Framework & Stack
- **Choice**: Next.js (App Router), TypeScript, Tailwind CSS, lucide-react icons, pnpm.
- **Rationale**: Next.js App Router provides modern routing and layout composition. Tailwind CSS enables clean styling matching a development cockpit aesthetic. TypeScript ensures strict contract validation with backend schemas.
- **Alternatives Considered**:
  - *Vite + React SPA*: Lacks built-in file routing and SSR layout helpers.
  - *Nuxt / Vue*: Project standard for full-stack cockpit applications in this repository centers on Next.js.

### 2. State Management & Polling Strategy
- **Choice**: Lightweight React Context (`AuthContext`, `WorkspaceContext`) + Custom Polling Hook (`useSessionPoll`).
- **Rationale**: The state requirements for MVP comprise user authentication, active repository selection, and the currently monitored `AgentSession`. A focused context and custom polling hook provide predictable state flow without the boilerplate of Redux or Zustand.
- **Polling Details**: When a session has `status === 'running'`, `useSessionPoll` queries the backend at 2-second intervals. When terminal status (`completed`, `failed`, `terminated`, `timed_out`) is reached, polling halts immediately.
- **Alternatives Considered**:
  - *Redux Toolkit / Zustand*: Adds unnecessary complexity for a single-session cockpit view.
  - *SWR / TanStack Query*: Good tools, but custom fetcher hooks keep dependencies lean and tailored to Bisect's specific session lifecycle.

### 3. Frontend Architecture & Modular Component Structure
- **Choice**: Clear separation of concerns organized under `src/`:
  - `src/app/`: Next.js App Router pages (`layout.tsx`, `page.tsx`, `auth/callback/page.tsx`, `workspace/page.tsx`).
  - `src/components/layout/`: `AppShell.tsx`, `Header.tsx`, `Sidebar.tsx`, `UserMenu.tsx`.
  - `src/components/workspace/`:
    - `WorkspaceHeader.tsx`: Repository selector, refresh/sync action, workspace status badge.
    - `SessionCard.tsx`: Session ID, status chip, task description, execution duration, token counters.
    - `ActivityFeed.tsx`: Chronological timeline of `LoopStep`s, command executions with collapsible output, file inspections, and errors.
    - `StatusSummary.tsx`: Tri-panel status indicator (Workspace, Agent Session, Validation).
    - `EmptyState.tsx`, `ErrorState.tsx`, `LoadingSkeleton.tsx`: Standardized UX state components.
  - `src/lib/api/`: Typed client (`client.ts`), API modules (`auth.ts`, `repositories.ts`, `sessions.ts`), and TypeScript interfaces mirroring backend schemas.
  - `src/lib/auth/`: `AuthContext.tsx`, `useAuth.ts`, token storage helpers.
- **Rationale**: Keeps components small (<150 lines), reusable, and unit-testable.

### 4. Direct Parity with Backend Models
- **Choice**: Explicit TypeScript interfaces mirroring backend schemas:
  - `SessionStatus`: `'created' | 'running' | 'completed' | 'failed' | 'terminated' | 'timed_out'`
  - `AgentSession`: Fields for `id`, `task_prompt`, `status`, `iteration_count`, `executed_action_count`, `steps`, `prompt_tokens`, `completion_tokens`, `total_tokens`, `termination_reason`, `created_at`, `started_at`, `completed_at`.
  - `LoopStep`: `iteration`, `action`, `result`, `error`, `duration_seconds`.
  - `UserRead`: `id`, `github_username`, `email`, `avatar_url`.
  - `RepositoryRead`: `id`, `github_repo_id`, `name`, `full_name`, `default_branch`, `is_private`.
- **Rationale**: Avoids impedance mismatch between backend API responses and frontend state.

## Risks / Trade-offs

- **[Risk] Rapid polling causing high backend load** → **Mitigation**: Polling runs strictly when session status is `running` and is throttled to 2 seconds. Polling stops on component unmount or terminal state transition.
- **[Risk] Massive command stdout/stderr freezing DOM** → **Mitigation**: Terminal outputs inside the Activity Feed are rendered in collapsible containers with fixed max-height scroll areas and line limits.
- **[Risk] Token expiration causing broken UI states** → **Mitigation**: Centralized HTTP client checks for 401 Unauthorized responses, clears stale authentication storage, and gracefully redirects to login.
- **[Risk] Cross-device responsiveness degradation** → **Mitigation**: Responsive CSS grid and flex layouts with collapsible drawer navigation on viewports under 1024px.
