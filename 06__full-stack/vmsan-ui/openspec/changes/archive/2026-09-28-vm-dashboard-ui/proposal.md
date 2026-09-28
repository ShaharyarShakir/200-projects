# Proposal: Phase 1D — vmsan Dashboard UI

## Why

Phase 1A established the Next.js/Tailwind/shadcn foundation, Phase 1B implemented the server-side `vmsan` CLI adapter, and Phase 1C exposed the RESTful `/api/vms` endpoints. However, users currently have no visual interface to view or monitor their Firecracker microVMs.

Phase 1D provides the first usable web UI dashboard for `vmsan-ui`, enabling users to inspect running and stopped microVMs, monitor resource allocations (vCPUs, memory, runtime), trigger manual data refreshes, and understand loading, empty, and error states cleanly in a responsive desktop-first layout.

## What Changes

- **Client API Layer**: Create `src/lib/api/vms.ts` encapsulating client-side HTTP interactions with `GET /api/vms`, ensuring strict client-server boundary separation from `src/lib/vmsan/*`.
- **Status Badge Component**: Implement `src/components/vms/vm-status-badge.tsx` rendering accessible status badges ("running" -> Running, "stopped" -> Stopped, "unknown" -> Unknown) using both color indicators and semantic text.
- **VM Card Component**: Implement `src/components/vms/vm-card.tsx` to render individual microVM cards displaying ID, status, runtime, vCPUs, memory (MiB), and age with safe fallback formatting (`—` for missing/null/undefined/NaN values).
- **Empty & Error State Components**: Implement `src/components/vms/vm-empty-state.tsx` and `src/components/vms/vm-error-state.tsx` for zero-state guidance and sanitized error handling with a retry trigger.
- **VM List & Loading Skeleton**: Implement `src/components/vms/vm-list.tsx` and loading skeleton cards using shadcn `Skeleton` to maintain layout stability during initial loading.
- **VM Dashboard Main Component**: Implement `src/components/vms/vm-dashboard.tsx` coordinating state management (loading, refreshing, error, data), header with total VM count calculation, and manual refresh controls.
- **Dashboard Page Integration**: Update `src/app/page.tsx` to render the VM dashboard.
- **Unit & Integration Tests**: Add comprehensive tests covering rendering, status handling, null-safety, count calculation, refresh/retry flows, empty states, and error handling.

## Capabilities

### New Capabilities
- `vm-dashboard`: Web UI dashboard for visualizing Firecracker microVM inventory, resource allocations, operational status, and handling loading, refresh, empty, and error states over the `/api/vms` endpoint.

### Modified Capabilities
<!-- None. Existing vm-api and vmsan-adapter requirements remain unchanged. -->

## Impact

- **Frontend Routes**: `src/app/page.tsx` updated from template placeholder to active dashboard.
- **Component Hierarchy**: New modular components under `src/components/vms/`.
- **API Client**: New client-side API helper in `src/lib/api/vms.ts` sharing client-safe types.
- **Dependencies**: Reuses existing shadcn/ui components (`card`, `badge`, `button`, `skeleton`), `lucide-react` icons, Tailwind CSS, and Node/tsx test runner.
- **Architecture**: Enforces zero server-side leaks (`src/lib/vmsan/*` is never imported into client components).
