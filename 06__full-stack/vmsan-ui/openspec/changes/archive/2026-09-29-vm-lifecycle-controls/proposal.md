# Proposal: Phase 1F — VM Lifecycle Controls

## Why

Currently, the `vmsan-ui` dashboard (Phase 1D) allows users to view microVM inventory and create new microVMs (Phase 1E), but lacks controls to manage the lifecycle of existing instances. Users cannot start stopped VMs, stop running VMs, or delete VMs from the web interface, forcing them to drop down to the CLI.

Adding lifecycle controls directly to the VM cards provides complete operational control over Firecracker microVMs from the UI, backed by the existing server-side API endpoints (`/api/vms/:id/start`, `/api/vms/:id/stop`, `/api/vms/:id`) and the vmsan adapter.

## What Changes

- **Browser API Client Extensions**: Add `startVM(id)`, `stopVM(id)`, and `deleteVM(id)` helper functions to `@/lib/api/vms` calling the existing Phase 1C REST API endpoints with standardized error handling via `ApiError`.
- **VM Card Lifecycle Actions**:
  - Add action controls to `VMCard`:
    - Running VMs display a **Stop** action.
    - Stopped VMs display a **Start** action.
    - Unknown status VMs display only a **Refresh** action (no Start/Stop).
    - **Delete** action is available for all known VM states.
- **Destructive Action Confirmation**:
  - Wrap Delete actions in an accessible confirmation dialog (`AlertDialog` / confirmation modal) to prevent accidental deletion.
  - Require explicit confirmation before issuing `DELETE /api/vms/:id`.
- **Per-VM Action State & Concurrency Protection**:
  - Scope mutation states (`starting`, `stopping`, `deleting`) to individual VMs.
  - Disable conflicting actions on the active VM while a lifecycle mutation is in flight.
  - Show contextual loading indicators (e.g., "Starting...", "Stopping...", "Deleting...").
  - Keep unaffected VM cards interactive and preserve dashboard layout without global full-page spinners.
- **Error Presentation & Recovery**:
  - Display non-blocking, user-friendly error messages on the affected VM card when a lifecycle action fails.
  - Sanitize error messages and never leak internal stack traces, paths, or shell commands.
  - Provide an optional retry trigger or clear dismiss action without locally fabricating an unconfirmed VM state.
- **Inventory Synchronization**:
  - Automatically re-fetch the latest inventory (`GET /api/vms`) following any successful lifecycle mutation.
  - Ensure the API remains the single source of truth for VM status and existence.

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `vm-dashboard`: Extend dashboard specifications with lifecycle action visibility rules, confirmation dialog for deletion, per-VM action state tracking and collision avoidance, user-safe error handling on action failure, and post-mutation inventory synchronization.

## Impact

- **Frontend Components**:
  - `src/components/vms/vm-card.tsx`: Updated to render lifecycle action buttons and handle per-VM action states.
  - `src/components/vms/vm-action-buttons.tsx` (or embedded in `vm-card.tsx`): Dedicated component for action buttons based on status.
  - `src/components/vms/delete-vm-dialog.tsx`: Confirmation dialog for destructive VM deletion.
  - `src/components/vms/vm-dashboard.tsx` & `src/components/vms/vm-list.tsx`: Pass mutation handlers and trigger background inventory refreshes.
  - `src/components/ui/alert-dialog.tsx`: Add or configure accessible dialog primitives for destructive action confirmation if needed.
- **Client API Layer**:
  - `src/lib/api/vms.ts`: Add `startVM`, `stopVM`, and `deleteVM` functions.
  - `src/lib/api/types.ts`: Add return and mutation types (`VMAction`, `LifecycleActionResponse`).
- **Dependencies & APIs**:
  - No new external runtime dependencies required (uses existing `@base-ui/react` / shadcn primitives).
  - Uses existing Phase 1C API endpoints (`POST /api/vms/:id/start`, `POST /api/vms/:id/stop`, `DELETE /api/vms/:id`).
  - No changes to server-side API routes or upstream vmsan CLI.
