# Tasks

## 1. Adapter Privileged Execution Refactoring

- [x] 1.1 Update `src/lib/vmsan/client.ts` to execute `sudo` with `["-n", binPath, ...args]` when `useSudo` is enabled, eliminating `env` and PATH dependencies, and verify via unit tests.
- [x] 1.2 Update `handleApiError` in `src/app/api/vms/helpers.ts` to detect sudo password / privilege escalation failures and return sanitized HTTP 503 `VMSAN_UNAVAILABLE` responses without exposing raw sudo stderr.

## 2. Unit and Integration Test Updates

- [x] 2.1 Update `src/lib/vmsan/__tests__/client.test.ts` to assert that `useSudo: true` produces `["-n", binPath, ...args]` and that `useSudo: false` executes `binPath` directly without `sudo`.
- [x] 2.2 Add tests in `src/app/api/vms/__tests__/helpers.test.ts` and API route tests verifying that sudo non-interactive failures map to sanitized 503 error responses.

## 3. Documentation & Project Verification

- [x] 3.1 Document local development passwordless sudo configuration for `/etc/sudoers.d/vmsan` in project specifications or documentation.
- [x] 3.2 Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` to verify zero regressions across the codebase.
