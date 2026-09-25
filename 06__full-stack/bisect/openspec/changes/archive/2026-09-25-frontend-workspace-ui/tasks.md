# Tasks

## 1. Frontend Project Scaffolding & Setup

- [x] 1.1 Initialize Next.js (App Router) project structure under `frontend/` with TypeScript, Tailwind CSS, and lucide-react icons, and verify `pnpm install` and `pnpm build` succeed
- [x] 1.2 Configure Vitest and React Testing Library for frontend component and unit testing, and verify test runner executes cleanly with a baseline test

## 2. Type Definitions & API Client Layer

- [x] 2.1 Define TypeScript models (`SessionStatus`, `AgentSession`, `LoopStep`, `UserRead`, `RepositoryRead`, `CommandActionResult`, `InspectFileActionResult`) in `src/lib/api/types.ts` mirroring backend Pydantic schemas, and verify types compile without error
- [x] 2.2 Implement centralized API client (`src/lib/api/client.ts`, `src/lib/api/auth.ts`, `src/lib/api/repositories.ts`, `src/lib/api/sessions.ts`) with normalized error handling and 401 interceptor, and verify unit tests for API error and success flows pass

## 3. Authentication Context & Flows

- [x] 3.1 Implement `AuthContext` and `useAuth` hook managing token persistence in storage, user profile state, and logout actions, and verify unit tests pass
- [x] 3.2 Implement GitHub OAuth callback handler (`src/app/auth/callback/page.tsx`) and login view integrating with `/api/v1/auth/github/login`, and verify OAuth callback flow in tests

## 4. Application Shell & Responsive Layout

- [x] 4.1 Implement `Header`, `Sidebar`, and `AppShell` layout components with brand identity, user profile menu, and responsive drawer navigation for desktop and tablet screens, and verify layout tests pass
- [x] 4.2 Implement application routing structure connecting Workspace, Sessions, Activity, and Settings views, and verify navigation transitions render as expected

## 5. Workspace Cockpit & Status Summary

- [x] 5.1 Implement `WorkspaceHeader` with repository selector, GitHub repository sync action button, and connection status badge, and verify component interactions in tests
- [x] 5.2 Implement `StatusSummary` panel displaying Workspace, Agent Session, and Validation statuses with color-coded badges for all lifecycle states (`created`, `running`, `completed`, `failed`, `terminated`, `timed_out`), and verify status rendering in tests

## 6. Session Inspector & Activity Feed

- [x] 6.1 Implement `SessionCard` inspector displaying session ID, task prompt, iteration count, executed actions, execution duration, token usage counters, and termination reason, and verify metric rendering in tests
- [x] 6.2 Implement `ActivityFeed` component rendering a chronological timeline of `LoopStep`s, expandable command outputs (stdout/stderr), file inspection details, and error banners, and verify feed rendering and toggle behavior in tests
- [x] 6.3 Implement `useSessionPoll` hook for periodic session status polling during active `running` status with automatic halt upon terminal state, and verify polling lifecycle in tests

## 7. State Handling, Empty/Error Views & Integration Verification

- [x] 7.1 Implement `LoadingSkeleton`, `EmptyState`, and `ErrorState` components across workspace, sessions, and activity views, and verify rendering across states in tests
- [x] 7.2 Assemble the full `WorkspacePage` view connecting header, status summary, session inspector, activity feed, and polling hook, and verify end-to-end component integration tests pass
- [x] 7.3 Execute full frontend test suite and Next.js production build (`pnpm build`) to verify complete type safety, zero linter errors, and passing tests
