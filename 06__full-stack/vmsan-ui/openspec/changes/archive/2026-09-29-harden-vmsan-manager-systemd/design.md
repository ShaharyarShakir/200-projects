# Design

## Context

See `proposal.md` for motivation. What follows are the verified facts about this host and this repository that constrain the approach.

**The manager has no deployable form.** `vmsan-manager/tsconfig.json` sets `noEmit: true` and its `start` script is `tsx src/index.ts`. There is no build output, so `/opt/vmsan-manager/dist/index.js` cannot exist until a build configuration is added. `tsx` and `typescript` are devDependencies and would not be present in a production install.

**Runtime paths, verified on this host:**

| Thing | Verified value | Owner |
|---|---|---|
| `command -v node` | `/home/shaharyar/.local/share/fnm/node-versions/v24.21.0/installation/bin/node` (v24.21.0) | `shaharyar` |
| `/usr/bin/node` | v26.10.0, 61 MB, regular executable | `root` |
| `command -v vmsan` | `…/fnm/node-versions/v24.21.0/installation/bin/vmsan` (0.3.0) | `shaharyar` |
| `npm root -g` | `…/fnm/node-versions/v24.21.0/installation/lib/node_modules` — contains `vmsan@0.3.0` | `shaharyar` |
| `/opt` | exists, no `vmsan-manager` | — |
| `/etc/sudoers.d` | **empty** — no vmsan rule exists today | — |
| `vmsan` group | does not exist | — |
| `sudo -n true` | **fails: "a password is required"** | — |
| user | `uid=10002(shaharyar) groups=10002(shaharyar),943(incus-admin),998(wheel)` | — |
| `pacman` | present; `systemd 262`; Arch Linux | — |

So a root-owned system Node already exists and the sudoers rule the old design depended on is already absent — meaning the Create/Start/Stop/Delete paths are already failing today, not merely "at risk".

**Existing vmsan state, verified:** `vmsan list` returns two VMs, `vm-1691d65a` (`running`) and `vm-c5c6c204` (`creating`), from `/home/shaharyar/.vmsan/vms/*.json` (mode `0700`, owner `shaharyar`). The brief's `vm-6ce50edc` does not exist on this host. Each state file hardcodes absolute paths into the same tree — `chrootDir: /home/shaharyar/.vmsan/jailer/firecracker/vm-1691d65a`, `apiSocket: …/run/firecracker.socket`, `kernel: /home/shaharyar/.vmsan/kernels/vmlinux-6.1`, `rootfs: /home/shaharyar/.vmsan/rootfs/ubuntu-24.04.ext4`. `vm-1691d65a`'s recorded `pid: 22187` is no longer running.

This is the decisive constraint on `VMSAN_DIR`. `vmsanPaths()` (`vmsan/dist/_chunks/paths.mjs`) resolves `$VMSAN_DIR` first, then `$SUDO_USER`'s home, then `homedir()`; and `FileVmStateStore` reads `<base>/vms/<id>.json` directly. The manager already passes `paths: config.vmsanDir` explicitly, so the *location* is settable — but the *records inside* point at `/home/shaharyan/.vmsan`. Repointing the manager at `/var/lib/vmsan` would find an empty state directory, and copying the tree without rewriting those four fields per record would leave a running VM's chroot and API socket at the old location.

**vmsan's own path helper also chowns.** `mkdirSecure()` calls `chownToSudoUser()`. Under systemd there is no `$SUDO_USER`, so `getSudoOwner()` returns nothing and the chown is skipped — vmsan does not try to hand state back to a user. Worth knowing, not a blocker.

**Codebase seams this change touches.** `ManagerConfig` (`vmsan-manager/src/config.ts`) already resolves `socketPath`, `vmsanDir`, `logLevel`, `maxRequestBytes` from env, with `VMSAN_MANAGER_SOCKET` and `VMSAN_DIR` overrides and a `/run/user/<uid>` dev default. `ManagerServer.listen()` (`server.ts`) already `chmod`s the socket to `SOCKET_MODE = 0o660` after bind, and `security.test.ts` asserts that literal against the source. `GET /api/vms` calls `listVMs()` from `@/lib/vmsan` (the CLI adapter). `src/lib/vmsan/client.ts` has the `sudo -n` branch gated on `VMSAN_SUDO`, which is set to `true` in `.env.local`. `src/lib/vmsan-manager/client.ts` resolves its socket from `XDG_RUNTIME_DIR` only — it does not read `VMSAN_MANAGER_SOCKET`.

## Goals / Non-Goals

**Goals:**
- Manager code, its dependency tree, and its interpreter are all root-owned on the deployed host.
- The manager runs as uid 0 under an init system; the web process runs as uid 10002; the only path between them is a group-gated socket.
- The privilege claim is verifiable by inspecting process ownership, not by reading documentation.
- Deployment is non-destructive: no VM record is created, moved, copied, or rewritten.
- A single privileged boundary exists in the code, so the "which path is privileged" question has one answer.

**Non-Goals:**
- Lifecycle RPCs. `health` and `list` remain the whole protocol surface.
- Moving vmsan state to `/var/lib/vmsan` (see Decision 1).
- Dropping the `vmsan` group in favour of a systemd `.socket` unit, or running the manager as a non-root user with capabilities.
- Any sudoers file, existing or new.

### Finding: a live `NOPASSWD` rule was present on the host

Discovered by operator task 9.5, which exists to assert the absence of a sudoers rule. The assertion failed, and the non-goal above is not merely a boundary this change respects — it is a boundary the host was violating.

`/etc/sudoers.d/vmsan` existed, `root:root`, mode `0640`, created 2026-09-28 22:36, containing exactly one line:

```
shaharyar ALL=(root) NOPASSWD: /home/shaharyar/.local/share/fnm/node-versions/v24.21.0/installation/lib/node_modules/vmsan/dist/bin/cli.mjs
```

The named file is `shaharyar:shaharyar` mode `0755`, and its parent directory is `shaharyar`-owned and writable. So the rule permits `shaharyar` to obtain root without a password by way of a file `shaharyar` can rewrite — the precise unsound boundary that the archived `vmsan-manager-foundation` change set out to remove and whose migration step ("Remove the `/etc/sudoers.d/vmsan` NOPASSWD rule") was never carried out. It is a leftover of the archived `fix-vmsan-root-privilege-handling` phase, whose README instructed creating that drop-in.

What this change did and did not do about it:

- This change removed the *caller*: the adapter's `sudo -n` spawn, the `VMSAN_SUDO` switch, and the sudo options are gone, so no application path invokes `sudo` any more. The escalation primitive is therefore latent rather than continuously exposed.
- This change did not remove the *grant*. Deleting a sudoers file is a privileged host modification, and the non-goal above places sudoers out of scope, so removal was not done silently inside this change. The operator disabled it explicitly during the runbook, moving the file to `/root/vmsan.sudoers.bak` so the rule stops applying while the evidence is preserved.
- The rule was never exercised, deliberately: confirming it works means running attacker-controlled code as root, which is not a verification worth performing. The writability of the target file and its parent directory is sufficient evidence and is recorded instead.

Consequences for the record: 10.4's planned statement that no vmsan sudoers rule existed before this change is false and is not written. `sudo` on this host does require a password in general, which is why the escalation is described as passwordless *for this one rule* rather than for sudo at large.
- Any git commit, worktree, or Worktrunk operation.

## Decisions

### 1. `VMSAN_DIR` stays at `/home/shaharyan/.vmsan`; relocation is deferred

The brief targets `/var/lib/vmsan`, and the user confirmed keeping the current directory. The reason is not caution for its own sake: the two existing VM records embed four absolute paths into `/home/shaharyar/.vmsan`, and one of them (`vm-1691d65a`, recorded `running`) has a live chroot and Firecracker API socket there. Repointing the manager produces a `list` result that disagrees with what `vmsan list` shows and a `start`/`stop` on that record that targets a chroot the manager no longer sees.

**Alternative rejected — relocate and rewrite the state files.** This would make `/var/lib/vmsan` authoritative immediately, and it is the right end state, but it means mutating records for a VM the brief explicitly says must remain untouched. If `vm-1691d65a` is genuinely dead (its `pid` is stale, and no Firecracker or jailer process is running on this host), the rewrite is cheap; if it is alive under a different process, it is not. That question cannot be answered from the state file alone, so it is a follow-up, not this change.

**Trade-off accepted:** a root-owned service reads state from a directory a non-root user owns, and `~/.vmsan/bin` holds `firecracker`, `jailer`, `vmsan-agent`, and `vmsan-nftables` executables owned by `shaharyar`. Since this phase exposes no lifecycle method, root never executes them, so the exposure is bounded today. It is not bounded once lifecycle RPCs land, and the follow-up that relocates state must relocate `bin/` too, or root will execute user-writable binaries. Recorded as a risk below.

### 2. `VMSAN_MANAGER_SOCKET_GROUP` + post-bind `chown`, rather than a systemd `.socket` unit

A `.socket` unit would have systemd own the socket file, its mode, and its group — a stronger guarantee, since the manager could not get it wrong. Rejected for this phase: it moves listening out of the manager process and into systemd, which changes the manager's startup path (it would receive an inherited fd rather than bind), breaks `ManagerServer.listen()`'s `prepareSocketPath` logic, and makes the `0660`-after-bind test in `security.test.ts` obsolete. That is a real refactor of the thing this phase is trying to prove works, in the same phase that must prove it.

The code approach is small: add `socketGroup?: string` to `ManagerConfig`, resolve it from `VMSAN_MANAGER_SOCKET_GROUP`, and in `listen()` after the existing `chmod`, resolve the group by name and `chown` the socket. Three properties matter and are specified:

- Order is bind → `chmod 0660` → `chown` → announce readiness, so the socket is never announced in a wider state than it ends in.
- A `chown` failure is logged and the manager does **not** fall back to a permissive mode. Failing to reach a wider audience is the safe direction; the operator sees the error in the journal.
- With no group configured, nothing is attempted and the mode stays `0660`.

`chown` needs root, which the service has. In dev (unprivileged, `$XDG_RUNTIME_DIR` socket) the group is simply not configured, so the code path is inert.

### 3. A `tsc` build to `dist/`, with `tsx` kept for development

`tsconfig.build.json` extends the existing config and overrides `noEmit: false`, `outDir: "dist"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`, `declaration: false`, and excludes `__tests__`. The existing `tsconfig.json` is untouched, so `pnpm --filter vmsan-manager typecheck` keeps behaving exactly as it does now.

One real hazard: the current source uses extensionless relative imports (`from "./config"`), which `tsx` resolves but emitted Node ESM does not. The build therefore requires `.js` extensions on relative specifiers. `tsx` accepts those too, so the same source runs both ways — but this touches every manager source file, and the existing test files import `../config` and would need the same treatment. This is called out in the tasks because it is the most likely source of a broken build.

**Alternative rejected — bundle with esbuild/tsup.** Cleaner single-file output, but adds a build dependency to the manager package, and the `security.test.ts` assertion that production source is "a set of plain files, not a bundle" encodes a preference for plain files. `tsc` matches the existing toolchain.

**Alternative rejected — ship `tsx` in production.** No source change, but the root-run service would then depend on a transpiler at runtime, which is a poor posture for the one process in this system that runs as root.

### 4. `/opt/vmsan-manager` is installed by an idempotent script the operator runs with `sudo`

`sudo` requires a password here, so the agent cannot perform the privileged steps, and it must not try. `scripts/install-vmsan-manager.sh` is committed to the repo and run by the operator as `sudo bash scripts/install-vmsan-manager.sh`.

The script builds in the repo (as the operator, unprivileged), then copies `package.json`, the lockfile, production `node_modules`, and `dist/` into `/opt/vmsan-manager`, then `chown -R root:root` and normalizes modes so no non-root user can write the tree. It installs `deploy/vmsan-manager.service` to `/etc/systemd/system/`, creates the `vmsan` system group if absent, and adds the invoking user to it (`usermod -aG vmsan "$SUDO_USER"`). Every step is guarded so a second run converges rather than duplicating. It does **not** `systemctl enable` — that is a separate, deliberate step after the service is observed working.

The vmsan data directory is deliberately not created or touched. The service points at the existing `~/.vmsan`.

**Why copy `node_modules` rather than resolve into the user's pnpm store.** pnpm's store is under the user's home, and symlinks out of `/opt` would leave the root-run service resolving modules through user-writable paths. `/opt/vmsan-manager/node_modules` must be real files owned by root. `npm ci --omit=dev` in a staging directory is the mechanism; the lockfile is copied alongside it so the install is reproducible.

### 5. `/run/vmsan-manager.sock` as a plain file, not under `RuntimeDirectory`

The brief's sketch pairs `RuntimeDirectory=vmsan-manager` with a socket at `/run/vmsan-manager.sock`, which do not relate: `RuntimeDirectory=vmsan-manager` creates `/run/vmsan-manager/` and would put the socket at `/run/vmsan-manager/vmsan-manager.sock` if the manager used the directory at all. `RuntimeDirectory` also implies `PrivateTmp`-style cleanup of the directory on stop, and its `0750` mode would put the socket inside a root-only-traversable directory — which would defeat group access unless the mode is also relaxed.

So: socket at `/run/vmsan-manager.sock` directly, `RuntimeDirectory` omitted, and `VMSAN_MANAGER_SOCKET=/run/vmsan-manager.sock` set explicitly in the unit so the path is a stated value rather than a default. `/run` itself is `root:root 0755`, so the socket is traversable by everyone and reachable only by `root` and the `vmsan` group. On stop the manager already unlinks its own socket; a stale socket after a crash is handled by the existing `prepareSocketPath` classification.

### 6. Hardening applied conservatively and verified per directive

Start with `ProtectSystem=strict` + `ProtectHome=read-only` + `RestrictSUIDSGID` + `LockPersonality` + `RestrictRealtime`, and add `PrivateTmp` only if the Jailer chroot does not depend on `/tmp` paths.

Explicitly **not** enabled, per the brief and because they plausibly break Firecracker/Jailer: `PrivateDevices` (Firecracker needs `/dev/kvm`), `RestrictNamespaces` (Jailer creates namespaces), `NoNewPrivileges=true` (the brief's sketch sets it `false`).

`ProtectHome=read-only` rather than `true`: the manager must *read* `/home/shaharyar/.vmsan` under Decision 1, and `ProtectHome=true` makes the home tree inaccessible entirely, which would break `list`.

Each directive is applied and then a `list` request is verified before the next is added. A directive that breaks the request is removed, not worked around. The end state is recorded in `phase-report.md` with the reason for each directive that was rejected — that record is the actual deliverable of this decision.

### 7. The adapter's sudo branch is deleted and the lifecycle routes are stubbed

The brief asks for both "remove the sudo path" and "do not implement create/start/stop/remove in the manager". Those together imply the dashboard's Create/Start/Stop/Delete lose their backing path. The user chose to accept that break and make it legible rather than leave it implicit.

- `src/lib/vmsan/client.ts`: the `useSudo` branch, the `VMSAN_SUDO` read, and the `sudo`/`RunVmsanOptions.sudo` options are deleted. The adapter executes the vmsan binary directly or not at all.
- `src/app/api/vms/helpers.ts`: the passwordless-sudo detection branch is deleted, and a `MANAGER_UNAVAILABLE` mapping is added for the manager client. `ManagerUnavailableError`, `ManagerProtocolError`, and `ManagerRequestError` are mapped to controlled statuses.
- `POST /api/vms`, `DELETE /api/vms/[id]`, and the `start`/`stop` routes validate their inputs first, then return `501` with code `VM_LIFECYCLE_UNAVAILABLE` and a message saying lifecycle is not yet available over the manager. Validation still runs before the stub so `INVALID_REQUEST` for a bad VM ID is still a 400 — the existing route tests assert that, and they keep passing.
- `GET /api/vms` switches to `manager.list()`.
- `.env.local` loses `VMSAN_SUDO=true`; `README.md` loses the sudoers walkthrough and gains the manager deployment and group-membership steps.

`src/lib/vmsan/` is not deleted. `createVM`/`startVM`/`stopVM`/`removeVM` and the parser stay, because the unprivileged `vmsan list` path is still the fallback while `list` over the manager is being proven, and because deleting them is the migration phase's job. The dead-code question this raises is recorded in the phase report.

Note what this does *not* cost: this change does not make the lifecycle paths any less broken than they already were, and the routes that were broken are now broken for an explicit, stated reason instead of an opaque one. **Correction from the operator runbook:** this paragraph originally claimed that `/etc/sudoers.d` was empty. It was not. See "Finding: a live NOPASSWD rule" below — the lifecycle paths were failing for a different reason than the one recorded here, and a passwordless root escalation was present on the host the whole time this change was being written.

### 8. The web client reads `VMSAN_MANAGER_SOCKET`

`src/lib/vmsan-manager/client.ts` currently resolves only from `XDG_RUNTIME_DIR`, which a `systemd`-managed Next.js process will not have set to `/run`. It gains the same override order the manager already uses: `VMSAN_MANAGER_SOCKET` → `XDG_RUNTIME_DIR` → `/run/user/<uid>`. Symmetry matters more than it looks: the manager resolves `VMSAN_MANAGER_SOCKET` and `/run/user/<uid>`, so after this change both sides resolve identically from the same two variables and the two `protocol.ts` copies stay the only deliberate duplication.

The client must never hard-code `/home/shaharyar/...`, and an unreachable socket must keep producing `ManagerUnavailableError` with the same message for `ENOENT`, `ECONNREFUSED`, and `EACCES` — the three states a stopped manager and a permission problem produce. That uniformity is what keeps the socket path out of the API response.

## Risks / Trade-offs

**[Root reads state from a user-owned directory]** → `VMSAN_DIR=/home/shaharyar/.vmsan` means uid 0 reads files uid 10002 can rewrite, and `~/.vmsan/bin/` holds `firecracker`, `jailer`, `vmsan-agent`, and `vmsan-nftables` owned by `shaharyar`. Bounded this phase because no lifecycle method exists to execute them. Recorded as the blocking precondition for the lifecycle phase: state relocation must move `bin/` as well, or root will execute user-writable binaries. Tracked in `phase-report.md` as remaining issue 1.

**[A running VM may already be dead, and `list` will not reveal it]** → `vm-1691d65a` is recorded `running` with `pid: 22187`, and that pid is gone. `list` reads the record, not the process, so both the CLI and the manager will report `running` for a VM that is not. Verification therefore compares the manager's `list` against `vmsan list` for *consistency*, and does not treat agreement as proof of liveness.

**[`ProtectSystem=strict` or `ProtectHome` breaks the manager]** → applied one directive at a time with a `list` request verified after each. `ProtectHome=true` is expected to break `list` under Decision 1 and is excluded for that reason. A rejected directive is removed and the reason recorded rather than worked around with `ReadWritePaths=` over the vmsan tree, which would reopen Decision 1's problem in a harder form.

**Correction, from the operator runbook.** This entry got the cause wrong and its remedy did not achieve the stated aim.

The cause: `ProtectHome=read-only` was believed safe because the manager only *reads* the records. It is not a read path. In vmsan 0.3.0, `FileVmStateStore.list()` calls `ensureDir()` before reading anything, and `mkdirSecure()` then performs an unconditional `chmodSync(dir, 0700)`, swallowing only `ENOENT`. Under a read-only home the `EROFS` propagates and every `list` returns `INTERNAL_ERROR`. The `ProtectHome` value is therefore irrelevant to the failure — `read-only`, `true`, and no `ProtectHome` at all all produce the same `EROFS` on the chmod, because `ProtectHome=true` also makes the path unwritable. Observed on the live service:

```
ERROR request failed code=EROFS detail="EROFS: read-only file system, chmod '/home/shaharyar/.vmsan/vms'"
```

The remedy: the original text rejected `ReadWritePaths=` over the vmsan tree to avoid reopening Decision 1, but removing `ProtectHome` reopens Decision 1 identically and strictly further, because it makes *all* of `/home/shaharyar` writable to a root process rather than one directory inside it. Both options grant root write access to the vmsan tree; only one grants it to `.ssh`, `.bashrc`, and the rest of the home. The narrower option is therefore strictly better on the axis the entry was trying to protect, and the operator chose it:

`ProtectHome=read-only` **plus** `ReadWritePaths=/home/shaharyar/.vmsan`.

Verified under `bwrap` with a read-only bind of `/` plus that single exception: `list` succeeds, and writes to `~/.bashrc`, `~/.ssh`, and `/etc/hosts` are all refused with `EROFS`. `chownToSudoUser()` is a no-op under systemd because no `SUDO_UID` is set, so the records keep their existing `shaharyar` ownership.

The residual exposure is unchanged from Decision 1: root can write inside `~/.vmsan`, including the user-owned `~/.vmsan/bin` executables. That is what makes state-plus-`bin` relocation the blocking precondition for the lifecycle phase, and it is recorded in `phase-report.md`.

**[The build breaks on extensionless relative imports]** → `tsc` emitting Node ESM will not resolve `from "./config"`. Every manager source file needs `.js` specifiers, including test files. Highest-likelihood failure in the build; the task list sequences it before anything that depends on `dist/`.

**[`vmsan` is a common group name and may already exist with other members]** → the script creates it only if absent, and does not manage its membership beyond adding the operator. On a shared host an existing `vmsan` group would already grant socket access to its members. The script reports the group's current membership rather than silently changing it.

**[Group membership needs a new login session]** → `usermod -aG` does not affect an already-running Next.js process. The next.js restart step is a hard prerequisite for the socket to be reachable, and the phase report must state that `id -nG` is the check, not a re-login in general.

**[Dropping the lifecycle paths is a user-visible regression]** → mitigated by the explicit `501` and message, and by the fact that these paths already fail on this host. Stated plainly in `phase-report.md` and the proposal rather than discovered by a user clicking Delete.

**[`.env.local` is gitignored]** → `VMSAN_SUDO=true` will not be reverted by a clean checkout; it must be removed as an explicit step, or a later developer re-introduces a setting that no longer has any effect.

## Migration Plan

No data migration. The order below is the dependency order; each step is verified before the next.

1. **Code, unprivileged.** Add socket-group config and post-bind `chown`; add `tsconfig.build.json`, the `build` script, and `.js` specifiers; extend `client.ts` with the `VMSAN_MANAGER_SOCKET` override. Gate: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and a `pnpm --filter vmsan-manager build` that produces `dist/index.js`.
2. **Adapter and routes.** Delete the sudo branch and its error mapping; stub the lifecycle routes; move `GET /api/vms` to the manager client; update `.env.local` and `README.md`. Gate: full suite green, including the existing route tests that assert `INVALID_REQUEST` before the availability response.
3. **Commit the deployment artifacts.** `scripts/install-vmsan-manager.sh` and `deploy/vmsan-manager.service`, plus the systemd path in `pnpm-workspace.yaml`'s ignored list if `dist/` needs ignoring. Nothing is applied to the host.
4. **Operator runs the install script.** `sudo bash scripts/install-vmsan-manager.sh`. Creates `/opt/vmsan-manager` (root-owned), the `vmsan` group, the user's membership, and the unit file. Does not enable the service.
5. **Operator starts the service.** `sudo systemctl daemon-reload && sudo systemctl start vmsan-manager`. Verify `systemctl status` and `journalctl -u vmsan-manager`.
6. **Verify the boundary.** `ps` shows the manager as root and Next.js as `shaharyar`; `stat` on `/opt/vmsan-manager`, `/run/vmsan-manager.sock`; confirm no sudoers file exists. A non-member user is refused the socket.
7. **Hardening pass.** Add one directive at a time, verifying `health` and `list` after each; record what was kept, what was rejected, and why.
8. **Restart and failure checks.** `systemctl restart` → `list` unchanged. `systemctl stop` → `GET /api/vms` returns the controlled manager-unavailable error. Kill the manager process → systemd restarts it. Restart Next.js as the ordinary user → it reconnects to `/run/vmsan-manager.sock`.
9. **Enable at boot.** `sudo systemctl enable vmsan-manager`, only after step 8 passes.

**Rollback.** The host changes are additive: stop and disable the service, then `rm -rf /opt/vmsan-manager` and `rm /etc/systemd/system/vmsan-manager.service && systemctl daemon-reload`. The `vmsan` group and the user's membership can be left; neither grants access on its own. The code changes revert with the working tree, which is not committed by this change. No VM state is touched at any point, so there is nothing to restore.

## Open Questions

- Whether `vm-1691d65a` is genuinely running or a stale record. Does not change this design — `list` returns records either way, and the check is "does the manager agree with the CLI", not "is the VM alive". Worth resolving before the lifecycle phase, where it decides whether relocation can rewrite records freely.
- Whether the `vmsan` group should later be replaced by a systemd `.socket` unit. Deferred; the code-side group handling this phase introduces is the same seam a socket unit would remove, so the work is not wasted either way.
