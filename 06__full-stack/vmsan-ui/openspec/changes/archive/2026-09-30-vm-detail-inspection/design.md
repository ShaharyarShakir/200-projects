# Design

## Context

The vmsan UI follows a strict privilege-separated architecture where browser client components communicate exclusively with Next.js App Router API endpoints over HTTP. These API endpoints delegate to domain services (`VmService`), which interact with the privileged `vmsan-manager` daemon via JSON-RPC over a Unix domain socket (`/run/vmsan-manager.sock`).

The current application implements `/api/vms` (GET for list, POST for create) and `/api/vms/:id` (DELETE for remove) alongside lifecycle endpoints (`/api/vms/:id/start`, `/api/vms/:id/stop`). Phase 2A introduces single VM inspection at `/vms/[id]` and `GET /api/vms/:id`.

## Goals / Non-Goals

**Goals:**
- Provide a responsive, accessible VM detail inspection page at `/vms/[id]` with overview, resources, network summary, metadata, and lifecycle controls.
- Implement `GET /api/vms/:id` on the server route and `getVm(id)` in `VmService`.
- Provide client API helper `getVM(id)` in `src/lib/api/vms.ts`.
- Support skeleton loading, dedicated 404 Not Found handling, and error recovery states with retry.
- Enable smooth navigation from dashboard VM cards to `/vms/[id]` with a clear `← Virtual Machines` back action.
- Ensure strict null-safety and sanitization across all resource, network, and error displays.

**Non-Goals:**
- No terminal, PTY, or `exec` execution.
- No file upload or download.
- No snapshot management.
- No network policy modification or published port configuration.
- No database storage or persistent custom naming.
- No authentication or live WebSocket streams.

## Decisions

### 1. Single VM Retrieval via VmService and Manager Client
- **Decision**: In `VmService.getVm(id)`, validate the VM ID parameter using `validateVmId(id)` and query the manager's `list()` RPC. Search for the matching VM by ID, mapping the result via `toVmDto()`. If not found, throw `VmNotFoundError(id)`.
- **Rationale**: The manager's `list()` RPC already returns full microVM metadata and configurations directly from the manager process in memory over the local Unix domain socket. This eliminates the need for redundant manager protocol additions while guaranteeing 100% data consistency between list and detail projections.
- **Alternative considered**: Adding a dedicated `vm.get` RPC to `ManagerServer` and `protocol.ts`. Rejected as unnecessary complexity since `list()` is lightweight, fast, and authoritative.

### 2. Client-Side Interactive Data Management for `/vms/[id]`
- **Decision**: Build `/vms/[id]` as an interactive client component hierarchy managed by `VmDetailView`.
- **Rationale**: The detail page requires dynamic state management for lifecycle operations (Start, Stop, Delete), in-flight action state locking, copy-to-clipboard interactions, manual refresh, and in-place error retries without causing full-page reloads.
- **Alternative considered**: Next.js Server Components fetching directly from `VmService`. Rejected because interactive lifecycle actions, mutation locks, and modal confirmation states require client-side React state, and keeping API calls through `/api/vms/:id` maintains unified security boundary testing.

### 3. Modular Component Architecture
- **Decision**: Break down the VM detail view into focused components under `src/components/vms/`:
  - `VmDetailView`: Main controller managing fetch, refresh, mutation locks, and error state.
  - `VmOverviewCard`: Header displaying VM ID, copy button, status badge, runtime, and primary actions.
  - `VmResourcesCard`: Displaying vCPUs, memory (MiB), and disk allocation with null-safe fallbacks.
  - `VmNetworkCard`: Displaying policy, IP address, and published ports.
  - `VmMetadataCard`: Displaying creation timestamp, human-readable age, and runtime environment.
  - `VmDetailSkeleton`: Layout skeleton for loading state.
  - `VmNotFound`: Dedicated 404 state with explanation and dashboard return link.
  - `VmDetailError`: Safe error banner with retry trigger.
- **Rationale**: Improves maintainability, testability, and separation of presentation concerns.

### 4. Reusing Lifecycle Mutation Patterns
- **Decision**: Leverage the existing client lifecycle API helpers (`startVM`, `stopVM`, `deleteVM`) and confirmation dialog pattern (`DeleteConfirmDialog`) in the detail view. Upon successful deletion, redirect the user to `/` with a clean transition.
- **Rationale**: Guarantees identical error handling, loading states, and confirmation safety between the dashboard and detail views.

## Risks / Trade-offs

- **[Risk: Stale VM state after lifecycle action]** → *Mitigation*: Re-fetch the VM detail state from `/api/vms/:id` immediately following any successful lifecycle mutation.
- **[Risk: Conflicting concurrent operations]** → *Mitigation*: Lock all action triggers on the detail page while any action is in-flight (`actionInProgress` state).
- **[Risk: Ambiguous error states when VM does not exist]** → *Mitigation*: The API endpoint returns standard 404 status with `VM_NOT_FOUND`, allowing the frontend to differentiate between a missing VM (`VmNotFound`) and general network/server errors (`VmDetailError`).
- **[Risk: Accidental navigation when clicking lifecycle buttons on dashboard cards]** → *Mitigation*: Stop event propagation on button clicks within `VmCard` or position navigation triggers explicitly as dedicated link anchors.
