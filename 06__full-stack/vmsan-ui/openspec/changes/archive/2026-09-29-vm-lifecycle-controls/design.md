# Design: Phase 1F — VM Lifecycle Controls

## Context

Phase 1C implemented server-side lifecycle API endpoints (`POST /api/vms/:id/start`, `POST /api/vms/:id/stop`, `DELETE /api/vms/:id`), Phase 1D delivered the microVM dashboard, and Phase 1E introduced the Create VM modal. Phase 1F connects the dashboard directly to the lifecycle endpoints to enable starting, stopping, and deleting microVMs with proper confirmations, state management, and error handling.

The design relies strictly on existing infrastructure: Next.js App Router, Tailwind CSS, Base UI/shadcn dialog primitives, and the existing REST endpoints. The server API and underlying `vmsan` CLI remain the single source of truth.

## Goals / Non-Goals

**Goals:**
- Provide intuitive, status-dependent lifecycle actions directly on each VM card (Start for stopped, Stop for running, Refresh for unknown, Delete for all known states).
- Require explicit confirmation through an accessible modal dialog before executing destructive deletion requests.
- Track loading states locally on a per-VM basis, preventing concurrent or conflicting actions on the same VM while leaving other cards interactive.
- Sanitize and present actionable error messages near the affected VM when an operation fails, without crashing or mutating VM state locally.
- Synchronize dashboard inventory with the backend immediately after any successful lifecycle operation.
- Maintain testability through prop injection for API action handlers.

**Non-Goals:**
- Global state management libraries (Redux, Zustand) or polling intervals.
- Modifying the server-side API contract or executing vmsan directly on the client.
- Complex multi-step deletion confirmations or automatic cascade-stopping before deletion.
- Background task queues or WebSocket progress streams.

## Decisions

### 1. Browser API Client Extension in `@/lib/api/vms`
- **Decision**: Add `startVM(id, fetchFn)`, `stopVM(id, fetchFn)`, and `deleteVM(id, fetchFn)` functions adhering to the established error-handling pattern using `ApiError`.
- **Rationale**: Keeps all HTTP communication centralized, typed, and easily mockable via custom `fetchFn` in unit tests.
- **Alternatives Considered**: Direct `fetch` calls in React components (rejected: violates separation of concerns, duplicates error parsing).

### 2. Component Decomposition & Action Controls
- **Decision**:
  - Add `DeleteVMDialog` (`src/components/vms/delete-vm-dialog.tsx`): A specialized confirmation dialog wrapping Base UI `Dialog` components with explicit Cancel and Destructive Confirm triggers.
  - Update `VMCard` (`src/components/vms/vm-card.tsx`): Integrate a `CardFooter` containing context-aware action buttons (Stop/Delete, Start/Delete, or Refresh/Delete) and an inline error alert slot.
- **Rationale**: Isolates destructive confirmation logic while keeping `VMCard` cohesive and readable.
- **Alternatives Considered**:
  - Global dashboard delete dialog with shared target ID state (rejected: increases coupling between dashboard and cards).
  - Browser native `window.confirm()` (rejected: non-accessible, visually inconsistent with shadcn UI styling).

### 3. Per-VM Action State & Concurrency Protection
- **Decision**: Represent in-flight mutation state as `type VMAction = "starting" | "stopping" | "deleting" | null` scoped to each `VMCard` component.
- **Rationale**:
  - Prevents race conditions (e.g. clicking Stop then Delete concurrently on the same VM).
  - Avoids disabling unaffected VMs on the dashboard.
  - Avoids global loading overlays that disrupt user context.

### 4. Post-Mutation Inventory Synchronization
- **Decision**: Upon completion of any lifecycle mutation, `VMCard` calls `onSuccess` which delegates to the dashboard's `handleRefresh()` to trigger `GET /api/vms`.
- **Rationale**: The UI must never anticipate or fabricate VM states or assume deletion success without server confirmation.

### 5. Error Presentation Strategy
- **Decision**: Localize action errors within the card's state (`actionError: string | null`) and render an inline dismissible alert below the resource details with a Retry action.
- **Rationale**: Gives direct spatial context to the failure without introducing third-party toast dependencies or cluttering global dashboard banners.

## Risks / Trade-offs

- **[Risk] Rapid duplicate clicks triggering race conditions**
  → *Mitigation*: Action buttons are immediately disabled and in-flight state is set before awaiting API promises; duplicate clicks are blocked.
- **[Risk] VM deletion while running causes API conflict (HTTP 409)**
  → *Mitigation*: Catch 409 conflicts and display the sanitized error message returned by the server (e.g. "Cannot remove running VM") while preserving card state.
- **[Risk] Out-of-sync inventory if refresh fails after mutation**
  → *Mitigation*: Surface refresh error in the dashboard alert while keeping previous snapshot intact, allowing user to retry manually.
