# Proposal: Interactive Terminal (Phase 2B)

## Why

Operators inspecting microVMs on `/vms/[id]` currently lack the ability to interact with running guests directly from the web interface, requiring manual terminal or external CLI access. Providing a secure, browser-based interactive command execution terminal inside the VM detail view enables rapid debugging, inspection, and verification without compromising host isolation or granting direct host shell access.

## What Changes

- **Manager RPC Extension (`vm.exec`)**: Extend `vmsan-manager` with a typed `vm.exec` RPC method over the Unix domain socket. It validates command parameters, ensures the VM is running, connects to the guest agent via `AgentClient` over HTTP using internal guest IP and credentials, executes the command inside the Firecracker microVM sandbox, and returns sanitized execution metrics (`exitCode`, `stdout`, `stderr`, `durationMs`).
- **Unprivileged REST API (`POST /api/vms/:id/terminal`)**: Introduce a dedicated HTTP endpoint in Next.js that validates request bodies (`command`, `timeoutMs`, `workingDirectory`), checks VM ID constraints, forwards execution requests to `vmsan-manager` over the Unix socket via `VmService`, and returns structured JSON responses.
- **Interactive Terminal UI on VM Detail Page (`/vms/[id]`)**: Embed a terminal panel within the VM detail view featuring command input with a visual prompt (`$`), stdout and stderr distinction, command execution states (idle, running, disabled when stopped/shut off), keyboard-driven in-memory command history (Up/Down arrow navigation), clear output capabilities, and graceful handling for timeouts and manager unavailability.
- **Strict Host Isolation & Security Boundary**: Enforce that command execution strictly takes place inside the guest microVM via `AgentClient` and never invokes `child_process`, `exec`, `spawn`, `sudo`, or CLI processes on the host.

## Capabilities

### New Capabilities
- `vm-terminal`: Interactive web-based terminal interface for `/vms/[id]` that supports command submission, real-time output rendering, in-memory command history navigation, output clearing, and state-aware terminal controls.

### Modified Capabilities
- `vmsan-manager`: Extend the privileged daemon with `vm.exec` RPC method, request validation (command length <= 8192 chars, timeout between 1000ms and 120000ms, optional VM working directory), guest execution via `AgentClient`, and response sanitization.
- `vm-api`: Add `POST /api/vms/:id/terminal` endpoint with parameter validation, error mapping (400, 404, 409, 500, 502, 503), and integration with Next.js `VmService`.

## Impact

- **Privileged Manager (`vmsan-manager`)**:
  - `src/protocol.ts`: Adds `vm.exec` to `MANAGER_METHODS`, introduces `VmExecParams`, `VmExecRequest`, `VmExecResult`, and validation function `validateVmExecParams`.
  - `src/vmsan.ts`: Implements `execVm` helper using `AgentClient` from `vmsan` package.
  - `src/server.ts`: Dispatches `vm.exec` requests to `execVm`.
- **Web Application Client & Services (`src/lib/`)**:
  - `src/lib/vmsan-manager/protocol.ts`: Synchronizes protocol types with manager additions.
  - `src/lib/vmsan-manager/client.ts`: Adds `execVm(params)` method to `ManagerClient`.
  - `src/lib/vms/vm-service.ts`: Adds `execVm(vmId, params)` domain method with error wrapping.
  - `src/lib/api/types.ts`: Adds API request/response types for terminal execution.
  - `src/lib/api/vms.ts`: Adds `executeVmCommand(vmId, params)` client function.
- **REST Endpoints & UI (`src/app/` & `src/components/`)**:
  - `src/app/api/vms/[id]/terminal/route.ts`: New route handler for `POST /api/vms/:id/terminal`.
  - `src/components/vms/vm-terminal.tsx`: New interactive terminal component.
  - `src/components/vms/vm-detail-view.tsx`: Integrates terminal panel into the VM detail layout.
- **Documentation**: Updates `docs/api/vms.md` and Phase 2B project documentation.
