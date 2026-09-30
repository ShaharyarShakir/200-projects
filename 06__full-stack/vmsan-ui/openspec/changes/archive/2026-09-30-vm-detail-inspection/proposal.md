# Proposal

## Why

The current vmsan UI provides only a high-level dashboard list of microVMs, limiting operators from inspecting individual microVM runtime configurations, network summaries, and metadata in detail. Extending the application with a dedicated VM Detail and Inspection view allows users to inspect individual microVMs, manage their lifecycle, and navigate cleanly between the inventory and specific microVMs without exposing host internals or privileged subsystems.

## What Changes

- Add a dedicated VM detail page route at `/vms/[id]` presenting an overview, resource allocations (vCPUs, memory, disk), runtime details, network summary, metadata, and lifecycle controls.
- Provide clear bi-directional navigation between the dashboard and the VM detail view (`← Virtual Machines` back link and browser history support).
- Add clickable VM ID and "View Details" actions on the dashboard VM cards linking directly to `/vms/[id]` without conflicting with lifecycle action triggers.
- Extend the Next.js API with `GET /api/vms/:id` to fetch individual microVM details via the application domain `VmService` layer.
- Extend `VmService` with `getVm(id)` to retrieve, validate, and map single VM records from authoritative manager state, returning appropriate domain errors (`VmNotFoundError`, `VmValidationError`).
- Implement comprehensive UX states on the detail view including skeleton loading placeholders, safe error handling, not-found (404) recovery states, copy VM ID action, and manual refresh.
- Provide context-aware lifecycle actions (Start, Stop, Delete, Refresh) directly on the VM detail page with loading indicators and destructive action confirmation dialogs.

## Capabilities

### New Capabilities
- `vm-detail`: Dedicated web interface at `/vms/[id]` for inspecting microVM configuration, runtime status, network summary, and metadata, providing lifecycle controls, loading skeleton, error states, and not-found handling.

### Modified Capabilities
- `vm-api`: Add `GET /api/vms/:id` endpoint for fetching a single microVM by ID with strict ID validation, uniform error responses, and 404 `VM_NOT_FOUND` handling.
- `vm-dashboard`: Add navigation affordance (clickable VM ID and "View Details" link) on microVM cards to navigate to `/vms/[id]` without triggering lifecycle actions.

## Impact

- **Frontend Routes & Components**: New route `src/app/vms/[id]/page.tsx`, new detail component hierarchy under `src/components/vms/` (e.g., `vm-detail-view.tsx`, `vm-overview-card.tsx`, `vm-resources-card.tsx`, `vm-network-card.tsx`, `vm-metadata-card.tsx`, `vm-not-found.tsx`), and updates to `vm-card.tsx` and `vm-status-badge.tsx`.
- **API & Domain Layer**: Updated route `src/app/api/vms/[id]/route.ts` implementing `GET`, extended `VmService` in `src/lib/vms/vm-service.ts` with `getVm()`, and API client in `src/lib/api/vms.ts` with `getVM()`.
- **Dependencies & Architecture**: Zero new external dependencies or database additions; maintains strict privilege separation over Unix domain socket with zero host bypass.
