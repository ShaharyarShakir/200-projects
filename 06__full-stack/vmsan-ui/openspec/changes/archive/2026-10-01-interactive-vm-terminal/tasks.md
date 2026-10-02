# Tasks

## 1. Dependencies and Environment Setup

- [x] 1.1 Verify `@xterm/xterm`, `@xterm/addon-fit`, and `@xterm/addon-webgl` installation in `package.json`, and add `ws` / `@types/ws` dependencies if required; verify installation with `pnpm install`.

## 2. vmsan-manager Terminal Protocol and Shell Service

- [x] 2.1 Define terminal RPC interfaces and streaming protocol types in `vmsan-manager/src/protocol.ts` (`terminal.open`, `terminal.input`, `terminal.resize`, `terminal.close`, and message frame shapes); verify typecheck succeeds with `pnpm --filter vmsan-manager typecheck`.
- [x] 2.2 Implement `TerminalSessionService` in `vmsan-manager/src/terminal-service.ts` to manage active `ShellSession` instances, connect to the guest microVM agent WebSocket endpoint (`/ws/shell`), translate binary PTY frames (0x00 Data, 0x01 Resize, 0x02 Ready), support `user: "root"` for administrative execution, and handle session cleanup; verify with unit tests.
- [x] 2.3 Integrate terminal methods and streaming dispatch into `vmsan-manager/src/server.ts`, ensuring state validation (VM must be running), session cleanup on socket close, and VM stop triggers; verify with `pnpm --filter vmsan-manager test`.
- [x] 2.4 Add comprehensive unit tests in `vmsan-manager/src/__tests__/terminal.test.ts` covering terminal session creation, input forwarding, resize synchronization, closed session cleanup, and error states; verify all tests pass.

## 3. Next.js Manager Client and WebSocket Bridge

- [x] 3.1 Update Next.js manager protocol types and client methods in `src/lib/vmsan-manager/protocol.ts` and `src/lib/vmsan-manager/client.ts` to support terminal operations; verify protocol synchronization with `src/lib/vmsan-manager/__tests__/protocol-sync.test.ts`.
- [x] 3.2 Implement WebSocket terminal bridge handler at `/api/vms/[id]/terminal/ws` (or server WebSocket upgrade handler) connecting the client WebSocket to the manager Unix socket stream; verify connection and frame routing.
- [x] 3.3 Create client-side terminal WebSocket manager in `src/lib/api/terminal.ts` managing connection lifecycle, input streaming, resize debouncing, and reconnection logic; verify with unit tests.

## 4. xterm.js Frontend Components

- [x] 4.1 Implement `src/components/vms/vm-terminal-header.tsx` with compact infrastructure console header, VM ID badge, status indicator (`● Connected`, `○ Disconnected`, `● Connecting...`), and toolbar actions (Reconnect, Clear, Copy); verify component rendering and state badge display.
- [x] 4.2 Rewrite `src/components/vms/vm-terminal.tsx` as a client-side component initializing `@xterm/xterm`, `@xterm/addon-fit`, and `@xterm/addon-webgl` (with graceful fallback), binding keyboard input forwarding, ANSI output stream rendering, and `ResizeObserver` fitting; verify clean unmount and resource disposal.
- [x] 4.3 Update `src/app/vms/[id]/terminal/page.tsx` to mount the full-workspace interactive terminal inside the persistent VM console layout with sidebar; verify page renders within console layout.
- [x] 4.4 Update and add frontend component tests in `src/components/vms/__tests__/vm-terminal.test.ts` validating lifecycle states, header actions, and container mounting.

## 5. Security Audit and Verification

- [x] 5.1 Conduct security audit verifying no host command execution (`child_process`, `exec`, `spawn`, `sudo`) exists in Next.js, no `vmsan` package imports in Next.js, and no agent secrets (`agentToken`, `agentPort`, host paths) are exposed to the browser.
- [x] 5.2 Execute full test suite and typecheck (`pnpm typecheck` and `pnpm test`) to ensure all tests pass and no regressions exist across the project.
