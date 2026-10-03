# Proposal

## Why

The Next.js web application currently interacts with microVM lifecycle operations through direct route handler calls to `ManagerClient`, with validation logic partially coupled to the legacy CLI adapter format (`memoryMiB` instead of `memoryMib`, missing `networkPolicy`, `diskSizeGb`, and `timeoutMs` support). 

To ensure clean layering, security isolation, and maintainability for Phase 1C, the application requires a dedicated `VmService` domain layer, a decoupled application VM domain model, centralized route validation and error mapping, consistent API response envelopes, and comprehensive API documentation—while strictly enforcing that all privileged vmsan/Firecracker interactions remain behind the Unix-socket `vmsan-manager`.

## What Changes

- **Application VM Domain Model**: Define clean application-facing types (`Vm`, `VmStatus`, `CreateVmInput`, `VmNetwork`) in `src/lib/vms/types.ts` that decouple frontend/API consumers from internal manager or vmsan state.
- **Application VM Service Layer**: Create `src/lib/vms/vm-service.ts` exposing `listVms()`, `createVm()`, `startVm()`, `stopVm()`, and `removeVm()`, acting as the single application-level abstraction over `ManagerClient`.
- **Domain Mapping & Sanitization**: Create `src/lib/vms/vm-mapper.ts` (`toVmDto`) to project manager VM records into sanitized application VM DTOs, stripping sensitive host internals (`agentToken`, TAP details, host paths, Jailer paths, PIDs).
- **Validation Layer**: Implement centralized schema/input validation in `src/lib/vms/validation.ts` for VM IDs, resource bounds (vCPUs, memory, disk), runtime options, network policies, and timeouts.
- **Error Translation Layer**: Create `src/lib/vms/vm-errors.ts` providing structured error classes and HTTP status mapping (`VALIDATION_ERROR`/`INVALID_REQUEST` -> 400, `VM_NOT_FOUND` -> 404, `VM_INVALID_STATE` -> 409, `VM_OPERATION_FAILED` -> 502, `VM_MANAGER_UNAVAILABLE` -> 503, `INTERNAL_ERROR` -> 500) without leaking stack traces or host paths.
- **HTTP API Route Handlers**: Refactor `/api/vms`, `/api/vms/[id]`, `/api/vms/[id]/start`, and `/api/vms/[id]/stop` to delegate entirely to `VmService`, returning consistent response shapes (`{ vms: [] }`, `{ vm: {} }`, `{ removed: true, vmId: string }`).
- **Browser/Client Separation**: Ensure browser and client-side components import only application domain types, never server-only manager or Node.js modules.
- **API Documentation**: Create `docs/api/vms.md` documenting all endpoints, request/response shapes, validation constraints, and error codes.
- **Comprehensive Tests**: Add service unit tests, route tests, security tests (no command execution, no vmsan imports, response sanitization), and real manager lifecycle integration tests.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `vm-api`: Update requirements to reflect the application VM domain model, service layer abstraction, extended create parameters (`diskSizeGb`, `networkPolicy`, `timeoutMs`, `memoryMib`), consistent response envelopes (`vmId` in delete response), and standardized error translation.

## Impact

- **Affected Code**: `src/lib/vms/` (new domain module), `src/app/api/vms/` (route handlers and helpers), `docs/api/vms.md` (API documentation), `src/lib/api/types.ts` (client types updated for consistency).
- **Dependencies**: No new external runtime dependencies; uses existing Node.js net/crypto and Next.js App Router abstractions.
- **Privilege Boundary**: Strictly maintains Next.js as unprivileged, communicating solely via Unix domain socket to `vmsan-manager`. No direct `vmsan` package imports or shell CLI executions.
