# Proposal

## Why

Phase 1B.1 built the `vmsan-manager` process and proved its protocol, native vmsan call, and redaction — but every run was as uid 10002. The privilege split it was designed for is still unproven, and in the meantime the manager has no deployment at all: it starts with `tsx src/index.ts` out of the user's own pnpm tree, and the dashboard's real request path is still the old `sudo -n vmsan ...` CLI adapter. So the boundary is designed but not deployed, not running as root, and not the path the app actually uses. This change proves the boundary and makes it the only privileged path: root-owned code under `/opt`, a root-controlled Node runtime, a systemd unit, and a group-gated socket in `/run`, with the adapter's sudo branch deleted.

## What Changes

- **A build for the manager.** `vmsan-manager` gains `tsconfig.build.json` and a `build` script that emits plain ESM into `dist/`, so the process can be deployed as compiled JavaScript instead of run through `tsx` from the user's tree. `tsx` stays as the dev runner.
- **A root-owned installation at `/opt/vmsan-manager`.** An idempotent `scripts/install-vmsan-manager.sh` (run by the user via `sudo`, never by the agent) builds in the repo, copies only runtime artifacts into `/opt/vmsan-manager` (`package.json`, lockfile, production `node_modules`, `dist/`), and enforces `root:root` ownership and non-user-writable modes on the whole tree.
- **A root-controlled Node runtime.** The service uses an absolute system Node path (`/usr/bin/node`, verified present at v26.10.0 and root-owned). The service depends on no `fnm`, `mise`, `asdf`, shell, or dotfile.
- **A `vmsan-manager.service` systemd unit** at `/etc/systemd/system/`, running as `root:root` with `ExecStart` on the absolute Node path, `Restart=on-failure`, `VMSAN_DIR` and `VMSAN_MANAGER_SOCKET` set explicitly, and a conservative hardening set that is evaluated one directive at a time so Firecracker/Jailer keep working. `PrivateDevices`, `RestrictNamespaces`, and `NoNewPrivileges` are explicitly not enabled.
- **A group-gated socket at `/run/vmsan-manager.sock`.** The manager gains a `VMSAN_MANAGER_SOCKET_GROUP` setting and `chown`s the socket to `root:vmsan` after binding, keeping mode `0660`. A system `vmsan` group is created and the Next.js user is added to it. The Next.js user gets socket access through group membership only — never a world-writable socket, and never filesystem access to the vmsan state directory.
- **The Next.js client honors `VMSAN_MANAGER_SOCKET`.** The default socket resolution is overridable by environment, no home path is hard-coded in application code, and an unreachable socket yields the existing typed `ManagerUnavailableError` with no stack trace, errno, or socket path in the response.
- **The adapter's sudo path is removed. (BREAKING)** `src/lib/vmsan/client.ts` loses its `sudo -n` / `VMSAN_SUDO` branch, and the sudo-flavored error mapping in `src/app/api/vms/helpers.ts` is deleted. `VMSAN_SUDO=true` in `.env.local` and the sudoers instructions in `README.md` are withdrawn. `POST /api/vms`, `DELETE /api/vms/[id]`, and the `start`/`stop` routes return an explicit, controlled "lifecycle is not available over the manager yet" error instead of invoking a privileged path, because this phase exposes only `health` and `list` (per the phase-1B.2 scope). The dashboard's Create/Start/Stop/Delete actions become unavailable until a later phase adds lifecycle RPCs.
- **Verification only, no new RPCs.** `health` and `list` are exercised end-to-end through Next.js, `GET /api/vms` is pointed at the manager, and manager restart, manager stop, and Next.js restart are proven not to disturb existing VM state.

## Capabilities

### New Capabilities
- `vmsan-manager-deployment`: How the privileged manager is installed, owned, and supervised on the host — the root-owned `/opt` tree, the system Node runtime, the systemd unit and its hardening posture, the explicit `VMSAN_DIR`/socket paths, the `vmsan` group and socket ownership, the absence of any sudoers rule, and the process-level evidence that the manager is uid 0 and the web process is not.

### Modified Capabilities
- `vmsan-manager`: Adds a `VMSAN_MANAGER_SOCKET_GROUP` setting and post-bind `chown` so the socket is `root:<group>` `0660`, adds a deployable compiled `dist/` build, and adds a scenario requiring the client to read its socket path from configuration rather than a compiled-in default.
- `vmsan-adapter`: The `No In-Process Privilege Escalation` requirement is strengthened — the adapter no longer contains a sudo branch, `VMSAN_SUDO` is no longer read, and `sudo` cannot be selected through any option.
- `vm-api`: `GET /api/vms` is served by the manager over the socket; the lifecycle endpoints answer with a controlled not-available error; and the privilege-escalation error-mapping scenario is replaced by manager-unavailable mapping that leaks no socket path, errno, or stack detail.

## Impact

- **Manager code**: `vmsan-manager/src/config.ts` and `server.ts` gain socket-group configuration and post-bind `chown`; new `tsconfig.build.json`; `package.json` gains `build`. Existing protocol, validation, redaction, and shutdown behavior is unchanged.
- **Deployment artifacts** (new, all committed to the repo, none applied by the agent): `scripts/install-vmsan-manager.sh`, `deploy/vmsan-manager.service`.
- **Application code**: `src/lib/vmsan-manager/client.ts` reads its socket path from configuration; `src/app/api/vms/route.ts` switches `GET` to the manager client; `src/app/api/vms/helpers.ts` loses sudo error mapping and gains manager-unavailable mapping; `src/lib/vmsan/client.ts` loses its sudo branch.
- **Docs**: `README.md` — the NOPASSWD sudoers walkthrough is replaced by the manager deployment and group-membership instructions.
- **Dependencies**: no new runtime dependency in either project. The manager keeps `vmsan@0.3.0`; `typescript` and `tsx` remain dev-only.
- **Host state**: the script creates the `vmsan` system group, `/opt/vmsan-manager`, the systemd unit, and the user's group membership. It does **not** create, move, or modify vmsan VM state, and does not create or modify any sudoers file. `VMSAN_DIR` stays at the existing `/home/shaharyar/.vmsan` — relocation to `/var/lib/vmsan` is deferred, because each existing VM's state file hardcodes absolute `chrootDir`/`apiSocket`/`kernel`/`rootfs` paths into that tree.
- **Out of scope**: `create`/`start`/`stop`/`remove` RPCs, dashboard UI work, moving vmsan state to `/var/lib/vmsan`, dropping the `vmsan` group, and any sudoers edit.
- **Not done by this change**: no git commit, no worktree, no Worktrunk. Version control stays under human control.
