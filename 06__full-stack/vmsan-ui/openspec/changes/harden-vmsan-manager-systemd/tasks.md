# Tasks

Every task below is unprivileged code or a committed artifact unless the heading says otherwise. The agent never runs `sudo`; sections 6–9 are delivered as scripts and run by the operator.

## 1. Manager: Socket Group Ownership

- [x] 1.1 Add `socketGroup?: string` to `ManagerConfig` and a `resolveSocketGroup` resolver in `vmsan-manager/src/config.ts` reading `VMSAN_MANAGER_SOCKET_GROUP` (empty string treated as unset), and verify with unit tests in `vmsan-manager/src/__tests__/config.test.ts` covering the override, the unset case, and the empty-string case
- [x] 1.2 In `ManagerServer.listen()` in `vmsan-manager/src/server.ts`, after the existing `chmod(socketPath, SOCKET_MODE)`, resolve the configured group by name and `chown` the socket to it, keeping mode `0660`; log socket group alongside the existing mode in the listening record, and verify with a test in `vmsan-manager/src/__tests__/server.test.ts` asserting the socket's group after `listen()` when a group is configured
- [x] 1.3 Make a group-assignment failure log an error, prevent the "listening on unix socket" readiness record from being emitted, and refuse to fall back to a more permissive mode; verify with a test in `vmsan-manager/src/__tests__/server.test.ts` that injects a failing `chown` and asserts the manager does not retry with a wider mode
- [x] 1.4 Verify the no-group path stays inert: with `VMSAN_MANAGER_SOCKET_GROUP` unset, `listen()` attempts no chown and leaves the socket at `0660`, confirmed by the existing `security.test.ts` socket-mode assertion and a new `server.test.ts` case
- [x] 1.5 Extend `vmsan-manager/src/__tests__/security.test.ts` to assert production manager source contains no `0o666`/`0666` and no world-accessible socket mode, and verify the scan passes

## 2. Manager: Deployable Build

- [x] 2.1 Convert every relative import in `vmsan-manager/src/**/*.ts` (production and tests) to an explicit `.js` specifier, since emitted Node ESM will not resolve extensionless paths, and verify `pnpm --filter vmsan-manager typecheck` and `pnpm --filter vmsan-manager test` both still pass under `tsx`
- [x] 2.2 Add `vmsan-manager/tsconfig.build.json` extending the base config with `noEmit: false`, `outDir: "dist"`, `module`/`moduleResolution` set for Node ESM output, `declaration: false`, and `__tests__` excluded, and verify it does not alter the result of `pnpm --filter vmsan-manager typecheck`
- [x] 2.3 Add a `build` script to `vmsan-manager/package.json` and verify `pnpm --filter vmsan-manager build` emits `dist/index.js` and its sibling modules as plain JavaScript
- [x] 2.4 Verify the built output runs without a TypeScript loader: run `node dist/index.js` from a directory whose `node_modules` has no `tsx`, confirm it starts and logs `manager starting` and `listening on unix socket`, then stop it and confirm the socket is unlinked
- [x] 2.5 Add `dist/` to `.gitignore` and verify `git status` does not list build output as untracked

## 3. Web Client: Configurable Socket Path

- [x] 3.1 Change `defaultSocketPath()` in `src/lib/vmsan-manager/client.ts` to resolve `VMSAN_MANAGER_SOCKET` → `XDG_RUNTIME_DIR/vmsan-manager.sock` → `/run/user/<uid>/vmsan-manager.sock`, matching the manager's own order, and verify with tests in `src/lib/vmsan-manager/__tests__/client.test.ts` covering all three cases
- [x] 3.2 Verify no home path or absolute socket path is embedded in the client or manager source, by extending `src/lib/vmsan-manager/__tests__/client.test.ts` and the manager's `config.test.ts` to assert the absence of a home-directory literal in the resolution code
- [x] 3.3 Verify `ENOENT`, `ECONNREFUSED`, and `EACCES` all raise `ManagerUnavailableError` with the same message and that the message names no socket path, and confirm the existing client tests still pass
- [x] 3.4 Verify `src/lib/vmsan-manager/protocol.ts` and `vmsan-manager/src/protocol.ts` remain in agreement by running `src/lib/vmsan-manager/__tests__/protocol-sync.test.ts`

## 4. Adapter: Remove the Sudo Path

- [x] 4.1 Delete the `useSudo` branch, the `VMSAN_SUDO` read, and the `sudo` option from `src/lib/vmsan/client.ts` and `RunVmsanOptions` in `src/lib/vmsan/types.ts`, and update `src/lib/vmsan/__tests__/client.test.ts` and `mock-vmsan.js` accordingly
- [x] 4.2 Delete the passwordless-sudo detection branch from `handleApiError` in `src/app/api/vms/helpers.ts` and add mappings for `ManagerUnavailableError` → 503 `MANAGER_UNAVAILABLE`, `ManagerProtocolError` → 502, and `ManagerRequestError` → 500 carrying the manager's code, with messages that name no socket path, errno, or stack
- [x] 4.3 Update `src/app/api/vms/__tests__/helpers.test.ts` to drop the sudo-message cases and add the manager-error cases, asserting that no response body contains a socket path or an `errno` string
- [x] 4.4 Add a source-scan test asserting `src/lib/vmsan/` contains no `sudo`, no `VMSAN_SUDO`, and no `child_process` escalation path, and verify it passes
- [x] 4.5 Remove `VMSAN_SUDO=true` from `.env.local` and verify the file no longer contains it

## 5. Routes: Manager-Served List, Stubbed Lifecycle

- [x] 5.1 Switch `GET /api/vms` in `src/app/api/vms/route.ts` from `listVMs()` to the manager client, mapping VM records to the existing response shape, and verify `src/app/api/vms/__tests__/route.test.ts` passes with the manager client mocked
- [x] 5.2 Make `POST /api/vms` validate its body first and then return 501 with code `VM_LIFECYCLE_UNAVAILABLE` and a message stating lifecycle operations are not yet available over the manager, invoking no vmsan command, and verify with `src/app/api/vms/__tests__/create.test.ts` including the case asserting `INVALID_REQUEST` still precedes the 501 for bad parameters
- [x] 5.3 Apply the same stub to `POST /api/vms/[id]/start` and `POST /api/vms/[id]/stop`, keeping VM ID validation ahead of the 501, and verify with `src/app/api/vms/__tests__/start.test.ts` and `stop.test.ts`
- [x] 5.4 Apply the same stub to `DELETE /api/vms/[id]`, confirming no metadata record is created, modified, or deleted on the unavailable path, and verify with `src/app/api/vms/__tests__/remove.test.ts` and `src/lib/vm-metadata/__tests__/store.test.ts`
- [x] 5.5 Update `src/app/api/vms/__tests__/security.test.ts` to assert no lifecycle route reaches the vmsan CLI and that the dashboard shows a controlled message rather than a raw failure

## 6. Deployment Artifacts (committed, not applied)

- [x] 6.1 Write `scripts/install-vmsan-manager.sh` that is idempotent and, when run by the operator with `sudo`, stages a production-only dependency install, copies `package.json`, the lockfile, `node_modules`, and `dist/` into `/opt/vmsan-manager`, applies `chown -R root:root` and non-user-writable modes, and creates the `vmsan` system group only if absent; verify by shellcheck-style review that no step touches vmsan state, sudoers, or unrelated system configuration
- [x] 6.2 Add to the script: install `deploy/vmsan-manager.service` into `/etc/systemd/system/`, add the invoking user to the `vmsan` group only if not already a member, and print the installed path, service name, existing group membership, the `id -nG` re-check the operator must do, and the `daemon-reload`/`start`/`enable` commands — explicitly stating the service is not yet enabled
- [x] 6.3 Write `deploy/vmsan-manager.service` with `Type=simple`, `User=root`, `Group=root`, `ExecStart=/usr/bin/node /opt/vmsan-manager/dist/index.js` using the verified root-owned system Node, `WorkingDirectory=/opt/vmsan-manager`, `Environment=NODE_ENV=production`, `Environment=VMSAN_DIR=/home/shaharyar/.vmsan`, `Environment=VMSAN_MANAGER_SOCKET=/run/vmsan-manager.sock`, `Environment=VMSAN_MANAGER_SOCKET_GROUP=vmsan`, `Restart=on-failure`, `RestartSec=2`, `After=network-online.target`, `Wants=network-online.target`, and `[Install] WantedBy=multi-user.target`; verify no `RuntimeDirectory` is set, since the socket is a direct child of `/run`
- [x] 6.4 Add the initial conservative hardening set to the unit — `ProtectSystem=strict`, `ProtectHome=read-only`, `RestrictSUIDSGID=true`, `LockPersonality=true`, `RestrictRealtime=true`, `NoNewPrivileges=false` — and verify `PrivateDevices`, `RestrictNamespaces`, and `NoNewPrivileges=true` are absent
- [x] 6.5 Verify the unit and script reference no path under a user home except the deliberate `VMSAN_DIR` value, and that no `fnm`, `mise`, `asdf`, `zsh`, or dotfile path appears anywhere in either artifact
- [x] 6.6 Add a note in the script header and the unit file that the service must not be enabled until the operator has verified `health` and `list` succeed

## 7. Documentation

- [x] 7.1 Replace the NOPASSWD sudoers walkthrough in `README.md` with the manager deployment procedure: build, `sudo bash scripts/install-vmsan-manager.sh`, `daemon-reload`, `start`, verify, then `enable`
- [x] 7.2 Document in `README.md` that the operator must start a new login session or re-check `id -nG` for `vmsan` group membership to take effect, and that no `/etc/sudoers.d` entry is needed or wanted
- [x] 7.3 Document in `README.md` that Create/Start/Stop/Delete return `VM_LIFECYCLE_UNAVAILABLE` until lifecycle RPCs exist, and record `.env.local` requirements for `VMSAN_MANAGER_SOCKET`
- [x] 7.4 Verify no file in the repository still instructs the reader to create a passwordless sudo rule, to set `VMSAN_SUDO`, or to run the web application as root

## 8. Quality Gates (unprivileged)

- [x] 8.1 Run `pnpm test` and confirm the full suite passes with no test removed to make it pass
- [x] 8.2 Run `pnpm lint` and confirm it is clean
- [x] 8.3 Run `pnpm typecheck` and confirm it is clean for both the web app and the manager
- [x] 8.4 Run `pnpm build` and confirm the Next.js production build succeeds
- [x] 8.5 Run `pnpm --filter vmsan-manager build` and confirm `dist/index.js` exists and is plain JavaScript
- [x] 8.6 Verify no unit test requires root, by running the manager suite as the ordinary user and confirming the socket-group tests either use a real group they are a member of or inject a chown stub

## 9. Operator Runbook (not executed by the agent)

Each step below is performed by the operator. The agent records the outcome in `phase-report.md`; it does not run `sudo`.

- [x] 9.1 Operator runs `sudo bash scripts/install-vmsan-manager.sh` and records the printed install path, service name, and group membership
- [x] 9.2 Operator runs `sudo systemctl daemon-reload && sudo systemctl start vmsan-manager`, then records `sudo systemctl status vmsan-manager --no-pager` and `sudo journalctl -u vmsan-manager -n 100 --no-pager`
- [x] 9.3 Operator records `sudo stat /opt/vmsan-manager /opt/vmsan-manager/dist/index.js /run/vmsan-manager.sock` and confirms root ownership, `0660` on the socket, and that no non-root user can write the install tree
- [x] 9.4 Operator verifies the privilege boundary with `ps -eo user,pid,cmd` filtered for the manager and for the Next.js server, confirming the manager is root and Next.js is `shaharyar`
- [x] 9.5 Operator confirms no sudoers file exists for vmsan via `sudo find /etc/sudoers.d -maxdepth 1 -type f -print` and `sudo grep -rl vmsan /etc/sudoers` with no match
- [x] 9.6 Operator starts a new session so `vmsan` group membership applies, confirms `id -nG` includes `vmsan`, then calls `health` and `list` through the application and confirms the result matches `vmsan list` recorded before the change
- [x] 9.7 Operator runs `sudo systemctl restart vmsan-manager` and confirms the VM set is unchanged and no VM was stopped or deleted
- [x] 9.8 Operator restarts Next.js as the ordinary user and confirms it reconnects to `/run/vmsan-manager.sock`
- [x] 9.9 Operator runs `sudo systemctl stop vmsan-manager`, confirms `GET /api/vms` returns the controlled manager-unavailable error with no socket path, errno, or stack trace, then restarts the service
- [x] 9.10 Operator kills only the manager process, confirms systemd restarts it and the socket becomes reachable again, and records the restart in the phase report
- [x] 9.11 Operator verifies an unauthorized, non-member user is refused the socket, confirming the refusal was not resolved by relaxing permissions
- [x] 9.12 Operator adds each hardening directive one at a time from section 6.4, verifying `health` and `list` after each, and records which directives were kept and which were rejected and why
- [ ] 9.13 Operator runs `sudo systemctl enable vmsan-manager` only after 9.6 through 9.12 pass, and confirms it survives a reboot
  - **Partially verified, deliberately.** `systemctl enable` + `is-enabled` were run after 9.6-9.12 passed. Actual post-reboot startup was NOT verified: the operator declined to reboot the host for checklist evidence. Recorded as `Enabled at boot: verified` / `Actual post-reboot startup: unverified`. Left unchecked rather than checked on partial evidence.

## 10. Phase Report

- [x] 10.1 Write `phase-report.md` using the exact field list from the phase-1B.2 brief: manager installation path, manager Node path, manager vmsan path, `VMSAN_DIR`; systemd service state, service user, socket path, socket owner/group, socket permissions; Next.js user, privilege boundary; existing VM verification, manager restart verification, Next.js reconnect verification; tests, lint, typecheck, build; security findings; remaining issues
- [x] 10.2 Record in the report that root reads vmsan state from a user-owned directory and that `~/.vmsan/bin` holds user-owned `firecracker`, `jailer`, `vmsan-agent`, and `vmsan-nftables` binaries, naming state-plus-`bin` relocation as the blocking precondition for any lifecycle RPC phase
- [x] 10.3 Record in the report that the brief's `vm-6ce50edc` does not exist on this host, that the actual VMs are `vm-1691d65a` and `vm-c5c6c204`, and that `vm-1691d65a`'s recorded `pid: 22187` is no longer running so `list` agreement is not evidence of VM liveness
- [x] 10.4 Record in the report that `sudo` requires a password on this host, that no vmsan sudoers rule existed before this change, and that the lifecycle routes therefore failed with an opaque 503 before this change and now return an explicit 501
- [x] 10.5 Record in the report that the adapter's `createVM`/`startVM`/`stopVM`/`removeVM` and CLI parser are now dead code retained deliberately for the lifecycle migration, and list them as remaining work
- [x] 10.6 Confirm the working tree is the only place the change exists: no commit, no branch, no worktree, no Worktrunk state was created
