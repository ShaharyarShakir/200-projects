# Proposal: VM Management API (Phase 1C)

## Why

The `vmsan-ui` application requires a complete, secure HTTP API layer to manage Firecracker microVMs from the frontend interface without granting client-side or direct browser access to host-level process spawning. While Phase 1B implemented the low-level server-side `vmsan` command adapter, currently only a basic read-only `/api/vms` route exists with non-standard error structures and without lifecycle mutation endpoints.

Building this dedicated HTTP API layer establishes a strongly typed, validated REST interface for listing, creating, starting, stopping, and deleting microVMs, enabling safe orchestration for the upcoming dashboard UI in Phase 1D.

## What Changes

- **VM Creation Endpoint (`POST /api/vms`)**: Accepts and validates runtime (`base`, `node22`, `node24`, `python3.13`), vCPUs (integer >= 1), and memoryMiB (integer >= 128) parameters, and delegates VM provisioning to the `createVM` adapter.
- **VM Start Endpoint (`POST /api/vms/[id]/start`)**: Validates the VM identifier parameter and starts the specified microVM via `startVM`.
- **VM Stop Endpoint (`POST /api/vms/[id]/stop`)**: Validates the VM identifier parameter and stops the specified microVM via `stopVM`.
- **VM Deletion Endpoint (`DELETE /api/vms/[id]`)**: Validates the VM identifier parameter and deletes/removes the specified microVM via `removeVM`.
- **Standardized Error Responses & Status Code Mapping**: Refactors the API error format across all `/api/vms` routes to `{ "error": { "code": string, "message": string } }` with proper HTTP status codes (400 for validation errors, 404 for not found, 409 for invalid state/conflicts, 500 for command failures, 503 for unavailable service) without leaking sensitive host internals or stack traces.
- **Strict Route Parameter & Body Validation**: Ensures dynamic route parameters and JSON payloads are sanitized against injection attacks and malformed data before reaching adapter functions.
- **Comprehensive API Route Tests**: Adds unit and integration tests for all route handlers mocking the adapter to verify request validation, status codes, error mappings, and command injection immunity.

## Capabilities

### Modified Capabilities
- `vm-api`: Expand the existing VM API capability beyond read-only listing to include VM creation (`POST /api/vms`), lifecycle management (`POST /api/vms/[id]/start`, `POST /api/vms/[id]/stop`), VM deletion (`DELETE /api/vms/[id]`), strict parameter validation, and standardized error schemas.

## Impact

- **Affected Endpoints**:
  - `GET /api/vms` (updated error response structure to match standard error schema)
  - `POST /api/vms` (new)
  - `POST /api/vms/[id]/start` (new)
  - `POST /api/vms/[id]/stop` (new)
  - `DELETE /api/vms/[id]` (new)
- **New/Modified Source Files**:
  - `src/app/api/vms/route.ts` (updated to support POST creation and standard error helper)
  - `src/app/api/vms/[id]/route.ts` (implements DELETE /api/vms/:id)
  - `src/app/api/vms/[id]/start/route.ts` (implements POST /api/vms/:id/start)
  - `src/app/api/vms/[id]/stop/route.ts` (implements POST /api/vms/:id/stop)
  - `src/app/api/vms/error-handler.ts` or `src/lib/vmsan/api-helpers.ts` (shared error mapping and standard response helpers)
  - `src/app/api/vms/__tests__/*` (expanded test suite)
- **Dependencies**: No new external dependencies required; utilizes existing Next.js App Router and node test runners.
