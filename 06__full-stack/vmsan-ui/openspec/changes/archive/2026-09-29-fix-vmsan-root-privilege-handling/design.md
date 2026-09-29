# Design

## Context

See `proposal.md` for motivation.

The Next.js application interacts with `vmsan` through `src/lib/vmsan/client.ts`, which uses `node:child_process`'s `spawn` with `shell: false`. MicroVM creation and certain lifecycle actions require root privileges to configure Firecracker TAP interfaces, cgroups, and chroot environments.

Previously, `runVmsan` wrapped commands with `sudo env PATH=... <vmsan-path> <args...>` when `VMSAN_SUDO=true`. This design removes the `env` wrapper, uses direct binary execution with `sudo -n`, and introduces non-interactive fail-fast privilege escalation detection.

## Goals / Non-Goals

**Goals:**
- Execute `sudo -n <absolute-vmsan-path> <args...>` when `VMSAN_SUDO=true` or `{ sudo: true }`.
- Execute `<binPath> <args...>` directly when `VMSAN_SUDO=false` or `{ sudo: false }`.
- Preserve pure argument-array execution (`spawn(..., { shell: false })`) with strict parameter validation.
- Fail fast without blocking or waiting for terminal interaction when passwordless sudo is unconfigured.
- Sanitize error responses in the API layer to prevent leaking raw sudo terminal prompts or host system environment details.
- Provide clear documentation on configuring `/etc/sudoers.d/vmsan` for passwordless execution.

**Non-Goals:**
- Running the Next.js process (`pnpm dev` or `pnpm start`) as root.
- Creating a separate background daemon or helper service.
- Broadening sudo permissions to allow arbitrary commands or shell scripts.

## Decisions

### 1. Direct Command Construction with `sudo -n`

**Decision:**
In `src/lib/vmsan/client.ts`, when `useSudo` is true:
- Executable: `"sudo"`
- Arguments: `["-n", binPath, ...args]`

When `useSudo` is false:
- Executable: `binPath`
- Arguments: `args`

**Rationale:**
- Directly executing the target binary path simplifies sudoers matching (e.g. `%wheel ALL=(ALL) NOPASSWD: /usr/local/bin/vmsan`).
- Passing `-n` (non-interactive) causes `sudo` to exit immediately if password authentication is required, preventing Next.js API requests from hanging indefinitely.
- Eliminates shell PATH tampering and `env` intermediary security risks.

**Alternatives Considered:**
- *Using `sudo env PATH=...`*: Rejected because it requires granting sudoers permissions to `/usr/bin/env`, which enables arbitrary root execution.
- *Running Next.js as root*: Rejected for critical security reasons (unprivileged web server principle).

### 2. Privilege Failure Detection & Error Sanitization

**Decision:**
In `src/app/api/vms/helpers.ts`, update `handleApiError` to inspect `VmsanError` output for sudo non-interactive failure indicators (e.g. `password is required`, `terminal is required`, `a password is required`).

When detected, return HTTP 503 (`VMSAN_UNAVAILABLE`) with:
`"vmsan requires configured privilege escalation (passwordless sudo)"`

**Rationale:**
- Prevents raw sudo error output from reaching frontend clients.
- Provides actionable diagnostic feedback to the developer or operator.

**Alternatives Considered:**
- *Returning generic 500 error*: Less informative for local setup troubleshooting.
- *Passing through raw stderr*: Exposes internal host paths and sudo configuration details to the client.

### 3. Sudoers Configuration Specification

**Decision:**
Document the required sudoers configuration file format (e.g. `/etc/sudoers.d/vmsan`):
```text
<username> ALL=(ALL) NOPASSWD: /path/to/vmsan
```

**Rationale:**
- Constrains elevated privileges strictly to the `vmsan` executable.
- Fully compatible with `sudo -n /path/to/vmsan create ...`.

## Risks / Trade-offs

- **[Risk] Missing Sudo Configuration**: Developers running locally with `VMSAN_SUDO=true` may encounter 503 errors if `/etc/sudoers.d/vmsan` is not yet configured.
  → *Mitigation*: The error message explicitly states that passwordless sudo configuration is required, and documentation provides the exact sudoers entry.
- **[Risk] Relative Binary Paths**: If `VMSAN_BIN_PATH` is a relative name like `"vmsan"`, `sudo` will look it up in sudo's `secure_path`.
  → *Mitigation*: The adapter defaults or accepts `VMSAN_BIN_PATH`, and docs recommend setting an absolute path (e.g. `/usr/local/bin/vmsan` or a fully-qualified path).
