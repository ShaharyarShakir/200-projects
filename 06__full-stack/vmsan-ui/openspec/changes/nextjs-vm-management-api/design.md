# Design

## Context

The Next.js application requires a clean, maintainable HTTP API for microVM lifecycle management while strictly maintaining the security privilege boundary where Next.js runs unprivileged and communicates solely via Unix domain socket with the privileged `vmsan-manager` daemon. 

Prior to Phase 1C, route handlers partially invoked `ManagerClient` directly with ad-hoc validation and presentation mapping. Phase 1C introduces a structured domain layer (`src/lib/vms/`) separating application domain models, input validation, error translation, and presentation mapping from both the HTTP transport and the Unix socket RPC client.

## Goals / Non-Goals

**Goals:**
- Provide a dedicated, decoupled application domain model (`Vm`, `VmStatus`, `VmNetwork`, `CreateVmInput`) in `src/lib/vms/types.ts`.
- Encapsulate all microVM business operations within `VmService` (`src/lib/vms/vm-service.ts`) as the single abstraction over `ManagerClient`.
- Enforce strict, centralized schema validation for route parameters and request payloads in `src/lib/vms/validation.ts`.
- Sanitize all outbound DTOs in `src/lib/vms/vm-mapper.ts` to ensure no host paths, tokens, PIDs, TAP interfaces, or Jailer internals are ever returned to the client.
- Translate manager protocol and validation errors into uniform, safe HTTP responses in `src/lib/vms/vm-errors.ts`.
- Update Next.js App Router route handlers (`/api/vms`, `/api/vms/[id]`, `/api/vms/[id]/start`, `/api/vms/[id]/stop`) to follow consistent response envelopes (`{ vms }`, `{ vm }`, `{ removed, vmId }`).
- Provide complete API documentation in `docs/api/vms.md`.
- Establish comprehensive unit, security, and lifecycle integration tests.

**Non-Goals:**
- Direct vmsan imports or CLI invocations from Next.js (strictly prohibited).
- Sudoers rules or root privilege escalation from the Next.js process.
- Database persistence or ORM integration (the manager daemon remains the authoritative state source).
- Implementing UI components or dashboard views (deferred to Phase 1D).
- Complex custom network routing or bridge orchestration beyond safe metadata representation.

## Decisions

### 1. Dedicated `VmService` Domain Layer
- **Choice**: Implement `VmService` in `src/lib/vms/vm-service.ts` exposing `listVms()`, `createVm(input)`, `startVm(id)`, `stopVm(id)`, and `removeVm(id)`.
- **Rationale**: Decouples Next.js App Router handlers from the low-level Unix socket protocol. Route handlers become thin controllers responsible only for HTTP request parsing and response rendering.
- **Alternatives Considered**: Direct calls from route handlers to `ManagerClient`. Rejected because it fragments validation, DTO mapping, and error translation across multiple route files.

### 2. Clean Application Domain Model vs. Internal State
- **Choice**: Define application types in `src/lib/vms/types.ts`:
  ```ts
  export type VmStatus = "creating" | "running" | "stopped" | "stopping" | "starting" | "error" | "unknown";

  export interface VmNetwork {
    policy?: "allow-all" | "deny-all" | "custom";
    address?: string;
    publishedPorts?: number[];
  }

  export interface Vm {
    id: string;
    runtime: string;
    status: VmStatus;
    vcpus: number;
    memoryMib: number;
    diskSizeGb: number;
    createdAt?: string;
    network?: VmNetwork;
  }

  export interface CreateVmInput {
    vcpus?: number;
    memoryMib?: number;
    diskSizeGb?: number;
    runtime?: "base" | "node22" | "node24" | "python3.13";
    networkPolicy?: "allow-all" | "deny-all" | "custom";
    timeoutMs?: number;
  }
  ```
- **Rationale**: Shields frontend clients and API consumers from internal manager protocol changes (`memSizeMib` vs `memoryMib`, raw timestamp formats, or internal snapshot references).
- **Alternatives Considered**: Re-exporting `ManagerVm` directly. Rejected because it leaks manager implementation details and couples the API schema to the daemon's internal RPC types.

### 3. Response Sanitization and DTO Mapping (`vm-mapper.ts`)
- **Choice**: Implement `toVmDto(managerVm: ManagerVm): Vm` in `src/lib/vms/vm-mapper.ts` that explicitly constructs the `Vm` DTO by picking allow-listed fields and formatting status.
- **Rationale**: Guarantees sensitive internals (`agentToken`, host filesystem paths, Jailer paths, PIDs, host TAP names) are stripped before reaching the HTTP layer.
- **Alternatives Considered**: Relying on the manager daemon to sanitize all fields. While the manager already performs projection, defense-in-depth in the application layer ensures accidental field additions in the daemon never leak to the browser.

### 4. Centralized Validation and Injection Defense (`validation.ts`)
- **Choice**: Validate VM IDs with regex `^[a-zA-Z0-9_-]{1,64}$` and validate `CreateVmInput` with strict range checks (vcpus: 1-32 integer, memoryMib: 64-32768 integer, diskSizeGb: 1-500 integer, runtime: enum, networkPolicy: enum, timeoutMs: non-negative integer). Disallow or strip unknown keys.
- **Rationale**: Prevents command injection sequences (`;`, `&&`, `$()`, `../`), type confusion, and invalid resource allocation before any Unix socket communication occurs.
- **Alternatives Considered**: Relying on JSON schema validator libraries like Zod. Kept lightweight with zero-dependency TypeScript validation functions matching existing project conventions.

### 5. Uniform Error Translation Hierarchy (`vm-errors.ts`)
- **Choice**: Define structured error classes:
  - `VmError` (base class)
  - `VmValidationError` -> HTTP 400 (`INVALID_REQUEST` / `VALIDATION_ERROR`)
  - `VmNotFoundError` -> HTTP 404 (`VM_NOT_FOUND`)
  - `VmInvalidStateError` -> HTTP 409 (`INVALID_VM_STATE`)
  - `VmManagerUnavailableError` -> HTTP 503 (`MANAGER_UNAVAILABLE`)
  - `VmOperationFailedError` -> HTTP 502 / 500 (`VM_OPERATION_FAILED` / `VMSAN_COMMAND_FAILED`)
- **Rationale**: Centralizes HTTP status mapping and ensures error responses match `{ "error": { "code": string, "message": string } }` without exposing socket paths or stack traces.

### 6. Consistent Route Response Envelopes
- **Choice**:
  - `GET /api/vms`: `{ "vms": Vm[] }` (200)
  - `POST /api/vms`: `{ "vm": Vm }` (201)
  - `POST /api/vms/:id/start`: `{ "vm": Vm }` (200)
  - `POST /api/vms/:id/stop`: `{ "vm": Vm }` (200)
  - `DELETE /api/vms/:id`: `{ "removed": true, "vmId": string }` (200)
- **Rationale**: Provides consistent top-level object envelopes across all endpoints and ensures delete returns the deleted ID under `vmId`.

## Risks / Trade-offs

- **[Risk]** Parameter naming discrepancy between legacy `memoryMiB` and standard `memoryMib`.
  → **Mitigation**: Support both `memoryMib` and `memoryMiB` in the validation layer for backward compatibility during `CreateVmInput` normalization, standardizing outbound DTOs to `memoryMib`.
- **[Risk]** Socket path discovery mismatch across developer and production environments.
  → **Mitigation**: Continue utilizing `defaultSocketPath()` checking `VMSAN_MANAGER_SOCKET`, `XDG_RUNTIME_DIR`, and `/run/user/<uid>/vmsan-manager.sock`.
- **[Risk]** Leaking internal error information during socket failures.
  → **Mitigation**: Catch all socket exceptions in `VmService` and map them to `VmManagerUnavailableError` with generic, sanitized messages.

## Migration Plan

1. Create `src/lib/vms/types.ts`, `src/lib/vms/validation.ts`, `src/lib/vms/vm-errors.ts`, `src/lib/vms/vm-mapper.ts`, and `src/lib/vms/vm-service.ts`.
2. Update route handlers in `src/app/api/vms/` to use `VmService` and error mappers.
3. Update `src/lib/api/types.ts` to export domain types for frontend components.
4. Add documentation in `docs/api/vms.md`.
5. Update and expand tests in `src/lib/vms/__tests__/` and `src/app/api/vms/__tests__/`.
