# Design: Phase 1D — vmsan Dashboard UI

## Context

The backend command adapter (`src/lib/vmsan/*`) and REST API (`src/app/api/vms`) are established. The browser UI needs to consume `GET /api/vms` and present the microVM inventory clearly, cleanly, and securely.

Key architectural boundaries:
- The browser must communicate exclusively with `/api/vms`.
- `src/lib/vmsan/*` is server-side infrastructure and must never be imported into client components.
- The UI must handle all states: initial loading, data presentation, manual refresh, empty inventory, and network/server errors.

## Goals / Non-Goals

**Goals:**
- Provide a clean, desktop-first, responsive dashboard displaying all microVMs.
- Display VM status (Running, Stopped, Unknown) with accessible visual badges (text + indicator).
- Display VM resource details (vCPUs, Memory, Runtime, Age) with robust null-safety (`—` fallback).
- Calculate and display total VM count.
- Support manual refresh with loading indicators and concurrency protection.
- Support initial loading skeletons using shadcn `Skeleton`.
- Support empty state and error state with user-safe messaging and retry capability.
- Encapsulate browser-side API communication in `src/lib/api/vms.ts`.

**Non-Goals:**
- Lifecycle action buttons (Start, Stop, Delete, Create) — deferred to Phase 2.
- Terminal / console / WebSocket integration.
- Automatic polling or background timer refresh.
- Incus or Agent Workspace integrations.
- Modifying backend `/api/vms` or `src/lib/vmsan/*`.

## Decisions

### 1. Client-Side API Helper (`src/lib/api/vms.ts`)
- **Decision**: Create a dedicated client-side API module `src/lib/api/vms.ts` with `getVMs()` and client-safe TypeScript interfaces (`ClientVM`, `ClientVMStatus`, `ApiError`).
- **Rationale**: Isolates `fetch` calls, standardizes error parsing, and strictly prevents client components from importing `src/lib/vmsan/types.ts` or backend modules.
- **Alternatives Considered**: Direct `fetch("/api/vms")` inside components — rejected because it duplicates error-handling logic and scatters endpoints.

### 2. Component Hierarchy and Organization
- **Structure**:
  ```text
  src/
  ├── app/
  │   └── page.tsx                     # Top-level page rendering VMDashboard
  ├── components/
  │   └── vms/
  │       ├── vm-dashboard.tsx         # State orchestration, header, refresh trigger
  │       ├── vm-list.tsx              # Grid container for VM cards or skeletons
  │       ├── vm-card.tsx              # Individual VM resource card
  │       ├── vm-status-badge.tsx      # Accessible status indicator
  │       ├── vm-empty-state.tsx       # Zero-VM state display
  │       └── vm-error-state.tsx       # Error banner with Retry action
  └── lib/
      ├── api/
      │   ├── vms.ts                   # Client-side GET /api/vms fetcher
      │   └── types.ts                 # Client-safe VM & API response types
      └── utils/
          └── formatters.ts            # Null-safe value & memory formatters
  ```
- **Rationale**: Keeps components modular, easily testable in isolation, and ready for future phase expansions (adding action buttons inside `vm-card.tsx`).

### 3. Card-Based Layout vs. Table Layout
- **Decision**: Implement a card-based grid layout (1 column on mobile, 2 on tablet, 3–4 on desktop).
- **Rationale**: Card layouts provide a clear visual hierarchy for microVM status and resource tiles, and provide natural placement for future controls (Start, Stop, Console) without requiring table redesign.

### 4. Null-Safe Formatting (`src/lib/utils/formatters.ts`)
- **Decision**: Centralize formatting helpers:
  - `formatValue(val: string | number | null | undefined): string` returns `—` for empty/null/undefined/NaN.
  - `formatMemory(memoryMiB: number | null | undefined): string` returns `128 MiB` or `—`.
  - `formatVmCount(count: number): string` returns `"0 VMs"`, `"1 VM"`, or `"N VMs"`.
- **Rationale**: Guarantees consistent fallback rendering across all card fields and prevents UI rendering bugs.

### 5. Refresh & Loading Lifecycle
- **Initial Load**: `isLoading = true`, render skeleton cards.
- **Manual Refresh**: `isRefreshing = true`, spin Refresh button icon, disable button to prevent concurrent requests, keep existing VM cards visible to prevent UI flashing.
- **Error Handling**: On failure, if data is absent, show `VMErrorState` with Retry button. If refresh fails with existing data, display a transient error notice while retaining the previous list.

## Risks / Trade-offs

- **[Risk] UI Flashing during refresh** → **Mitigation**: Distinguish between `isLoading` (initial fetch, renders skeletons) and `isRefreshing` (manual refresh, keeps cards mounted and disables the refresh button).
- **[Risk] Server-side code leaked to client bundle** → **Mitigation**: Strict import boundary; `src/lib/api/*` has no dependency on `src/lib/vmsan/*`.
- **[Risk] Malformed or null fields in API response** → **Mitigation**: Strict formatter utilities with unit tests covering `null`, `undefined`, `NaN`, and empty strings.
