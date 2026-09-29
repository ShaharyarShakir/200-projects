# Proposal

## Why

When creating or managing microVMs with `vmsan` on Linux hosts, Firecracker operations require elevated root privileges. The current adapter implementation executes `sudo env PATH=... <vmsan-path> ...` when `VMSAN_SUDO=true`. This complicates sudoers authorization because sudo executes `/usr/bin/env` rather than the `vmsan` binary directly, introduces unnecessary PATH dependencies, and risks hanging Next.js API requests if sudo prompts interactively for a password.

Refining privilege handling to directly execute `sudo -n <absolute-vmsan-path> <args...>` ensures clean sudoers policies, non-interactive fail-fast execution, and robust isolation without running the entire Next.js process as root.

## What Changes

- **Direct Privileged Binary Execution**: When `VMSAN_SUDO=true`, invoke `sudo` directly targeting the absolute resolved path to the `vmsan` binary instead of routing through `env PATH=...`.
- **Non-Interactive Sudo (`-n`)**: Pass the `-n` flag to `sudo` to prevent hanging API requests on interactive terminal password prompts when passwordless sudo is not configured.
- **Fail-Fast Privilege Error Handling**: Detect privilege escalation failures (e.g. `sudo: a password is required` or non-zero exit codes from missing sudo permissions) and return a clear, sanitized server error without exposing raw sudo stderr or sensitive host environment details to the browser.
- **Strict Command Array Integrity**: Maintain pure argument array execution with no shell evaluation (`shell: false`), preserving VM ID validation, runtime allowlists, and numeric bounds.
- **Preserve Unprivileged Mode**: When `VMSAN_SUDO` is unset or `false`, continue executing the resolved binary directly without `sudo`.
- **Documentation & Tests**: Add developer documentation detailing the exact sudoers rule required for passwordless execution of the `vmsan` binary during local development, and update unit tests to verify the new argument structure and error handling.

## Capabilities

### New Capabilities
*(None)*

### Modified Capabilities
- `vmsan-adapter`: Update command execution requirements to enforce direct execution of the absolute `vmsan` binary path with `sudo -n` when `VMSAN_SUDO=true`, eliminating the `env` intermediary and requiring non-interactive password prompt fail-fast behavior.
- `vm-api`: Ensure API error handling translates sudo privilege escalation errors into standardized, sanitized API error responses without leaking host system paths or raw sudo terminal output.

## Impact

- **Affected Code**: `src/lib/vmsan/client.ts`, `src/lib/vmsan/errors.ts`, `src/app/api/vms/helpers.ts`, and associated unit/integration tests in `src/lib/vmsan/__tests__/` and `src/app/api/vms/__tests__/`.
- **Dependencies**: No external npm dependencies added. Relies on standard Node.js `node:child_process` and `node:path`.
- **Infrastructure / Local Dev**: Developers running microVM operations locally must configure passwordless sudo for the `vmsan` binary path in `/etc/sudoers.d/vmsan`. The Next.js development server continues to run as an unprivileged user.
