# Proposal

## Why

The `vmsan-ui` application requires a robust, secure, and strongly-typed server-side bridge to communicate with the existing `vmsan` Firecracker microVM CLI on the host. Direct shell execution or string interpolation in web route handlers introduces command injection vulnerabilities and inconsistent error handling. Building a dedicated command adapter with strict input validation, structured output parsing, explicit privilege boundary handling, and a test API endpoint provides the foundational infrastructure layer needed before developing any UI components.

## What Changes

- Create a typed `vmsan` module under `src/lib/vmsan/` with:
  - `types.ts`: Normalized VM models (`VM`, `VMStatus`), creation options (`CreateVMOptions`), command execution types, and execution options.
  - `errors.ts`: Typed `VmsanError` class encapsulating command details, arguments, exit codes, stdout, and stderr without leaking sensitive environment information.
  - `parser.ts`: JSON parser for `vmsan --json list` output with safe fallbacks and status normalization.
  - `client.ts`: Server-only command execution runner using `child_process.spawn` with argument arrays (no shell interpolation), input validation for VM IDs and resource parameters, and high-level lifecycle functions (`listVMs`, `createVM`, `startVM`, `stopVM`, `removeVM`).
- Create `src/app/api/vms/route.ts` implementing `GET /api/vms` to verify adapter integration by returning structured JSON with active microVMs.
- Add comprehensive automated unit tests covering command building, argument validation, JSON parsing, error transformation, and API route responses.
- Add `typecheck` and `test` scripts in `package.json` to facilitate quality verification.

## Capabilities

### New Capabilities
- `vmsan-adapter`: Core server-side adapter library providing safe, typed command execution, input validation, output parsing, and lifecycle operations (`list`, `create`, `start`, `stop`, `remove`) against the `vmsan` CLI.
- `vm-api`: Next.js REST API route (`GET /api/vms`) serving microVM listing data from the server-side `vmsan` adapter with structured error handling.

### Modified Capabilities
*(None - this is the initial adapter implementation)*

## Impact

- **Code additions**: `src/lib/vmsan/` module (`types.ts`, `errors.ts`, `parser.ts`, `client.ts`) and API route `src/app/api/vms/route.ts`.
- **Scripts & Dependencies**: Adds `test` and `typecheck` scripts to `package.json`. No external runtime dependencies required (uses Node.js native `child_process` and native `node:test` runner).
- **Security & Privilege Model**: Rejects all shell interpolation, validates VM IDs against allowed patterns, enforces resource bounds, and documents elevated privileges requirements without handling passwords.
