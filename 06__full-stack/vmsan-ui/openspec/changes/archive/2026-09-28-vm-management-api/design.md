# Design: VM Management API (Phase 1C)

## Context

Phase 1B established the core `vmsan` adapter (`src/lib/vmsan/`) providing:
- Strongly typed execution via `runVmsan`
- Lifecycle methods: `listVMs`, `createVM`, `startVM`, `stopVM`, `removeVM`
- Strict validators: `validateVmId` (enforcing `^[a-zA-Z0-9_-]{1,64}$`), `validateCreateOptions`
- Typed error classes: `VmsanError` and `VmsanValidationError`

Phase 1C introduces the HTTP layer using Next.js App Router route handlers. The API routes serve as a secure gateway that accepts HTTP requests, validates route parameters and request bodies, invokes adapter functions, and returns structured JSON responses or standardized error schemas.

## Goals / Non-Goals

**Goals:**
- Implement Next.js App Router route handlers for VM lifecycle:
  - `GET /api/vms`: Fetch microVM list
  - `POST /api/vms`: Provision a new microVM
  - `POST /api/vms/[id]/start`: Start a microVM
  - `POST /api/vms/[id]/stop`: Stop a microVM
  - `DELETE /api/vms/[id]`: Remove a microVM
- Implement a shared HTTP error handling helper (`handleApiError`) producing consistent `{ "error": { "code": string, "message": string } }` responses mapped to HTTP status codes (400, 404, 409, 500, 503).
- Strictly sanitize and whitelist all inputs; reject malformed JSON, invalid IDs, and unauthorized parameters before invoking the adapter.
- Provide comprehensive unit and integration tests for all route handlers mocking the adapter and verifying security constraints.

**Non-Goals:**
- UI components, cards, forms, or client-side React dashboard views (deferred to Phase 1D).
- Direct child process spawning or CLI argument construction inside route handlers.
- WebSocket or interactive shell/connect terminals.
- Server-side caching or secondary database state for microVM records.

## Decisions

### Decision 1: Uniform Error Response Structure and Centralized Mapping
- **Choice**: Implement a shared `handleApiError(error: unknown)` utility that inspects errors and formats a uniform response:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable description"
    }
  }
  ```
- **Error Code & Status Mapping**:
  - `VmsanValidationError` or `SyntaxError` (JSON parse): Status `400`, Code `INVALID_REQUEST`.
  - `VmsanError` with ENOENT / binary not found / execution failure due to missing binary: Status `503`, Code `VMSAN_UNAVAILABLE`.
  - `VmsanError` with stderr indicating VM not found: Status `404`, Code `VM_NOT_FOUND`.
  - `VmsanError` with stderr indicating invalid lifecycle state (e.g. already running, already stopped, cannot remove active VM): Status `409`, Code `INVALID_VM_STATE` or `OPERATION_CONFLICT`.
  - Other `VmsanError`: Status `500`, Code `VMSAN_COMMAND_FAILED`.
  - Generic/Unexpected Errors: Status `500`, Code `INTERNAL_ERROR`.
- **Rationale**: Centralizing error mapping ensures consistent client contracts across all endpoints and eliminates leaking sensitive host information (paths, environment variables, stack traces).
- **Alternatives Considered**: Inlining `try/catch` logic into each route handler; rejected due to code duplication and risk of inconsistent status codes.

### Decision 2: Directory Layout for Next.js App Router
- **Choice**: Structure the routes as follows:
  ```text
  src/app/api/vms/
  ├── route.ts                 # GET /api/vms, POST /api/vms
  ├── helpers.ts               # Shared error handling & response helpers
  └── [id]/
      ├── route.ts             # DELETE /api/vms/:id
      ├── start/
      │   └── route.ts         # POST /api/vms/:id/start
      └── stop/
          └── route.ts         # POST /api/vms/:id/stop
  ```
- **Next.js 15/16 Params Handling**: In dynamic routes (`[id]`), route params are accessed via `await context.params` to be fully compatible with Next.js 15+ asynchronous parameter conventions:
  ```ts
  export async function POST(
    _request: Request,
    context: { params: Promise<{ id: string }> }
  ) {
    const { id } = await context.params;
    ...
  }
  ```
- **Rationale**: Follows idiomatic App Router conventions and isolates lifecycle sub-actions cleanly into sub-routes.

### Decision 3: Request Payload Sanitization & Whitelisting
- **Choice**: In `POST /api/vms`, explicitly parse the JSON body and extract only whitelisted properties (`runtime`, `vcpus`, `memoryMiB`). Any extra properties (e.g., `command`, `flags`, `exec`) are discarded. The whitelisted fields are then passed to `createVM()`, which internally runs `validateCreateOptions()`.
- **Rationale**: Prevents mass assignment or accidental execution parameter leakage, ensuring command injection vectors are blocked at both the HTTP boundary and the adapter boundary.

### Decision 4: Mutation Response Formats
- **Choice**:
  - `GET /api/vms` returns `{ "vms": VM[] }` (HTTP 200).
  - `POST /api/vms` returns `{ "success": true, "vm": { ... } }` or `{ "success": true, "stdout": ... }` (HTTP 201 or 200).
  - `POST /api/vms/[id]/start` returns `{ "success": true, "vmId": string }` (HTTP 200).
  - `POST /api/vms/[id]/stop` returns `{ "success": true, "vmId": string }` (HTTP 200).
  - `DELETE /api/vms/[id]` returns `{ "success": true, "vmId": string }` (HTTP 200).
- **Rationale**: Provides immediate confirmation of the affected VM identifier without performing redundant or slow sequential CLI listing calls unless requested.

## Risks / Trade-offs

- **[Risk] Next.js 15+ Async `params` vs synchronous `params`**: Next.js 15+ deprecates synchronous access to `params` in route handlers.
  - **Mitigation**: Type `context.params` as `Promise<{ id: string }>` and `await context.params` in all dynamic route handlers.
- **[Risk] Error message variation across different `vmsan` versions**: The adapter error parsing depends on matching stderr or exit codes.
  - **Mitigation**: Error categorization in `handleApiError` checks for common patterns ("not found", "does not exist", "already running", "active", "stopped", "ENOENT") while gracefully defaulting to `VMSAN_COMMAND_FAILED` (500) if unrecognized.
- **[Risk] Malformed or empty JSON bodies crashing `req.json()`**: Calling `req.json()` on empty bodies or malformed strings throws a `SyntaxError`.
  - **Mitigation**: Wrap body extraction in a safe parser helper and map JSON syntax errors to HTTP 400 `INVALID_REQUEST`.
