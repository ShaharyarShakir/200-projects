# Phase 1B.2 Report — Harden the vmsan Manager (systemd deployment)

Change: `harden-vmsan-manager-systemd`
Host: `blend` — `/usr/bin/node` v26.10.0, systemd, `vmsan@0.3.0`
Status: 58/59 tasks checked. 9.13 enabled and verified except its reboot half, which the operator declined to perform; 10.x complete.

---

## 1. Deployment

| Field | Value |
|---|---|
| Manager installation path | `/opt/vmsan-manager` (70 MB, `root:root`, `0755` dirs) |
| Manager Node path | `/usr/bin/node` (v26.10.0) |
| Manager vmsan path | `/opt/vmsan-manager/node_modules/vmsan` (vmsan 0.3.0) |
| Manager entry point | `/opt/vmsan-manager/dist/index.js` |
| `VMSAN_DIR` | `/home/shaharyar/.vmsan` |
| systemd unit | `/etc/systemd/system/vmsan-manager.service`, `vmsan-manager.service` |
| Service state | `active (running)`, `enabled` (was `disabled` until 9.13) |
| Service user | `root` (deliberate — see §5) |
| Socket path | `/run/vmsan-manager.sock` |
| Socket owner/group | `root:vmsan` |
| Socket permissions | `0660` (`srw-rw----`) |
| Next.js user | `shaharyar` (uid 10002) — unprivileged |
| Group | `vmsan` (gid 942), `shaharyar` is a member in the passwd database |

The production tree is a standalone install: 61 packages, Next.js excluded, exact
`vmsan@0.3.0` pin, staged with `pnpm-lock.yaml`. The installer runs as root but
performs the build and dependency resolution as the invoking user, so no root-owned
pnpm store is created. It is idempotent — it was run three times with identical
results, and it never starts or enables the service.

**Privilege boundary (verified).** `ps` confirms the manager runs as `root`
(pid 105686) and every Next.js process runs as `shaharyar`. The application opens no
privileged resource: its only channel to the manager is the group-restricted socket.
`src/lib/vmsan/` no longer imports `child_process`; a test asserts it, and a second
test asserts the lifecycle routes never invoke the adapter.

---

## 2. Verification performed

| Check | Result |
|---|---|
| `health` over the socket | `{"id":"1","ok":true,"result":{"status":"ok"}}` |
| `list` over the socket | 2 VMs, `vm-1691d65a` (running) and `vm-c5c6c204` (creating) |
| `GET /api/vms` through the app | HTTP 200 with both VMs |
| Install tree ownership/modes | `root:root`, `0755` dirs, nothing group- or other-writable |
| Socket mode after bind | `0660`, group `vmsan` |
| Non-member refused | uid 65534 (`nobody`) → `EACCES` on both methods |
| Stale session refused | session without gid 942 → `EACCES` |
| Manager restart (9.7) | pid 96443 → 102263, VM set unchanged, nothing stopped or deleted |
| Manager killed (9.10) | `status=9/KILL` → `restart counter is at 1` → new pid, socket recreated, app back to 200 |
| Manager stopped (9.9) | `GET /api/vms` → HTTP 503 `MANAGER_UNAVAILABLE`, message `vmsan manager socket is not reachable` |
| Unit syntax | `systemd-analyze verify` clean; installed unit byte-identical to source |
| Hardening live | `ProtectSystem=strict`, `ProtectHome=read-only`, `RestrictSUIDSGID=yes`, `LockPersonality=yes`, `RestrictRealtime=yes`, `NoNewPrivileges=no` |

### Test and build gates

| Gate | Result |
|---|---|
| App tests | 335 passed, 0 failed |
| Manager tests | 113 passed, 0 failed |
| `pnpm lint` | pass |
| `pnpm typecheck` | pass (app + manager) |
| `pnpm build` | pass |
| `pnpm --filter vmsan-manager build` | pass, produces `dist/index.js` |
| `openspec validate --strict` | pass |

---

## 3. Hardening: what was kept, rejected, and why

Applied incrementally with a `list` request verified after each, per §6.4.

**`ProtectSystem=strict` — kept, with one required exception.**
It broke the service immediately: `bind()` is a write to `/run`, which `strict` makes
read-only, so startup failed with `listen EROFS … bind '/run/vmsan-manager.sock'`.
`ReadWritePaths=/run` fixes it. It cannot be narrowed to the socket file, because
`ReadWritePaths` is applied when the mount namespace is built, before the socket
exists. `/run` is a tmpfs, so the widened write access does not outlive the process.

**`ProtectHome=read-only` — kept, with one required exception, as a recorded deviation.**
This is the one place where the design was wrong twice, and both errors are corrected in
`design.md`.

*The premise was wrong.* The design assumed `list` only reads records, so
`read-only` would suffice. It does not: in vmsan 0.3.0 `FileVmStateStore.list()` calls
`ensureDir()` before reading anything, and `mkdirSecure()` then performs an
unconditional `chmodSync(dir, 0700)` whose `catch` swallows only `ENOENT`. Under a
read-only home the `EROFS` propagates and every `list` fails with `INTERNAL_ERROR`:

```
ERROR request failed code=EROFS detail="EROFS: read-only file system, chmod '/home/shaharyar/.vmsan/vms'"
```

The `ProtectHome` *value* is therefore irrelevant — `read-only`, `true`, and absent all
fail identically, because `ProtectHome=true` also makes the path unwritable.

*The remedy was also wrong.* The design directed that a directive which breaks `list`
be removed rather than worked around, on the grounds that `ReadWritePaths` over the
vmsan tree "would reopen Decision 1's problem in a harder form". Removing `ProtectHome`
reopens Decision 1 identically and strictly further, because it makes *all* of
`/home/shaharyar` writable to a root process rather than one directory inside it. Both
options grant root write access to the vmsan tree; only one also grants it to `.ssh`
and `.bashrc`. The operator chose the narrower form.

Verified under `bwrap` with a read-only bind of `/` plus that single exception — two
arms, controlled:

| Arm | `health` | `list` | write `~/.bashrc` | write `~/.ssh/x` | write `/etc/hosts` |
|---|---|---|---|---|---|
| No exception | ok | **fails, `EROFS` chmod** | denied | denied | denied |
| `+ ReadWritePaths=~/.vmsan` | ok | **ok, both VMs** | denied | denied | denied |

**`RestrictSUIDSGID`, `LockPersonality`, `RestrictRealtime` — kept.** These are
seccomp/capability directives with no `bwrap` equivalent, so they were not isolated
individually. All three are active in the live unit simultaneously with the filesystem
directives, and `health` and `list` both succeed. That is stronger evidence than
isolation-by-subtraction: if the combination passes, each element passes.

**Deliberately absent, per §6.4:** `PrivateDevices` (Firecracker needs `/dev/kvm`),
`RestrictNamespaces` (the Jailer creates namespaces), `NoNewPrivileges=true` (needs
proving against the vmsan runtime; the brief sets it `false`). No `RuntimeDirectory`,
since the socket is a direct child of `/run`.

**A measurement note, because it nearly produced a false finding.** `/proc/<pid>/status`
`Groups:` lists only *supplementary* groups. `newgrp` changes the process's **primary**
GID, so a Next.js server started under `newgrp vmsan` shows no `942` in `Groups:` and
looks unauthorized while actually holding the socket group in its effective set. The
`ls -l` group column on that process's fds, and the `connect()` succeeding, are the
reliable indicators.

---

## 4. Existing VMs

`vm-6ce50edc` from the brief **does not exist** on this host — no record, no reference
anywhere under `VMSAN_DIR`. The actual VMs are:

| ID | Reported status | vCPU | Memory | Created |
|---|---|---|---|---|
| `vm-1691d65a` | `running` | 1 | 128 MiB | 2026-09-28T06:37:52.370Z |
| `vm-c5c6c204` | `creating` | 1 | 128 MiB | 2026-09-28T06:37:40.789Z |

Both the manager and the pre-change baseline agree exactly, across restarts.

**That agreement is not evidence of liveness.** `vm-1691d65a`'s record says
`status: running` with `pid: 22187`, and pid 22187 is not running. No `firecracker` and
no `jailer` process is running on this host at all. `list` reads the record, not the
process, so it will report `running` for a VM that is not. This was true before the
change and is unchanged by it; it is recorded so nobody reads the table above as a
health check.

The dashboard renders `vm-c5c6c204` as `unknown` rather than `creating`. That is
`normalizeStatus` in `src/lib/vmsan-manager/present.ts` collapsing intermediate states
to a badge the UI has, matching the adapter's prior behaviour — not a manager or
protocol fault.

---

## 5. Security findings

### 5.1 A live `NOPASSWD` rule was present, and the design believed otherwise

**This is the most significant finding of the phase.** Task 9.5 exists to assert that no
sudoers rule exists for vmsan. It failed.

`/etc/sudoers.d/vmsan` existed — `root:root`, mode `0640`, created 2026-09-28 22:36 —
containing:

```
shaharyar ALL=(root) NOPASSWD: /home/shaharyar/.local/share/fnm/node-versions/v24.21.0/installation/lib/node_modules/vmsan/dist/bin/cli.mjs
```

The named file is `shaharyar:shaharyar` mode `0755`, and its parent directory is
`shaharyar`-owned and writable. A rule that grants root without a password on a file the
invoking user can rewrite is a root-escalation primitive by construction. It is exactly
the boundary the archived `vmsan-manager-foundation` change set out to remove; it is a
leftover of the archived `fix-vmsan-root-privilege-handling` phase, whose README
instructed creating that drop-in. The design's assertion that `/etc/sudoers.d` was
empty was false, and 10.4's planned text — "no vmsan sudoers rule existed before this
change" — is therefore not written.

**It was latent, not continuously exploited, and this is evidenced rather than assumed.**
The sudo log shows every application invocation used a *different* path:

```
COMMAND=/home/…/installation/bin/vmsan --json list   →  a password is required
```

The rule names `…/vmsan/dist/bin/cli.mjs`; the adapter invoked the `bin/vmsan` shim
resolved through `PATH`. The paths did not match, so sudo fell through to a password
prompt. That is the real reason the lifecycle routes returned 503 — not the
"`/etc/sudoers.d` is empty" reason recorded in the design, which has been corrected.

Two caveats recorded honestly:

- `sudo -l -U shaharyar` did **not** list the rule even before removal, and that is
  unexplained. It was not investigated further, because the only way to settle it is to
  restore the file and re-query the policy, which means briefly re-arming a
  passwordless root grant. The operator declined that and the ambiguity stands.
- The escalation was never exercised. Confirming it works means executing
  attacker-controlled code as root; the writability of the target and its parent
  directory is sufficient evidence and is what is relied on here.

**Resolution.** The grant was disabled by the operator during the runbook, moved to
`/root/vmsan.sudoers.bak` so the rule stops applying while the evidence is preserved.
This change removed the *caller* (the adapter's `sudo -n` spawn, the `VMSAN_SUDO`
switch, the sudo options) but deliberately did not remove the *grant* itself: deleting a
sudoers file is a privileged host modification and sudoers is an explicit non-goal here.
Post-removal, `find /etc/sudoers.d -type f` is empty and `sudo -l -U shaharyar` reports
no vmsan entry.

### 5.2 Root reads vmsan state from a user-owned directory

Accepted by Decision 1 and still true. The manager runs as `root` and reads
`/home/shaharyar/.vmsan`, which `shaharyar` owns. `~/.vmsan/bin` holds
`firecracker`, `jailer`, `vmsan-agent`, and `vmsan-nftables`, **all owned by
`shaharyar`** and writable by them.

Today this is bounded: the manager exposes only `health` and `list`, so root never
executes those binaries. `ReadWritePaths=/home/shaharyar/.vmsan` (see §3) does give root
write access inside that tree, and `chownToSudoUser()` is a no-op under systemd because
no `SUDO_UID` is set — the records kept their existing `shaharyar` ownership through
every operation in this phase, which was verified rather than assumed.

**This is the blocking precondition for the lifecycle phase:** state *and* `bin/` must
both move to a root-owned location before any RPC can execute Firecracker, or root will
execute user-writable binaries. Relocating state alone is not sufficient.

### 5.3 Group membership does not apply to an existing session

`usermod -aG` writes the passwd database but does not alter already-running processes.
The first start of this service produced `health` succeeding and `list` failing for an
apparent hardening reason, when the actual cause was a stale session. The README
documents the check as `id -nG`, not "log in again", and a manager-unavailable message
covers `EACCES` alongside `ENOENT` and `ECONNREFUSED` because the user-facing remedy is
the same in all three cases.

### 5.4 Not escalated, deliberately

- No `sudoers` file is created by the installer; the installer says so in a comment and
  a test guards the README against reintroducing `NOPASSWD` instructions. The guard was
  mutation-tested: reintroducing a drop-in rule fails it.
- No `RuntimeDirectory`, so systemd does not create or remove the socket.
- `PrivateDevices`, `RestrictNamespaces`, and `NoNewPrivileges=true` are left off.
- The manager protocol exposes `health` and `list` only. `create` returns
  `UNKNOWN_METHOD`.

---

## 6. Lifecycle regression, stated plainly

Create, start, stop, and delete no longer work through the application, by operator
decision. They now return an explicit `501 VM_LIFECYCLE_UNAVAILABLE` with a message
saying lifecycle is not available over the manager, instead of the previous opaque
`503`. Validation still runs before the 501, so a malformed VM ID is still a `400
INVALID_REQUEST`. This was already broken on this host for the reason in §5.1, so the
change replaces an unexplained failure with a stated one — it does not remove working
functionality.

### Dead code retained deliberately

`src/lib/vmsan/client.ts`'s `createVM` / `startVM` / `stopVM` / `removeVM` and the CLI
output parser are now unreachable from any route. They are kept because the unprivileged
`vmsan list` path remains useful as a fallback while the manager is being proven, and
because deleting them belongs to the lifecycle migration, which will need to rewrite
them against the manager protocol rather than discard them. Listed as remaining work in
§7.

---

## 7. Remaining issues

1. **Blocking for the lifecycle phase:** relocate vmsan state *and* `~/.vmsan/bin` to a
   root-owned location. Until both move, any lifecycle RPC would have root executing
   user-writable binaries. Also resolves §5.2.
2. **VM record integrity is not verified and is probably wrong.**
   `vm-1691d65a` claims `running` with a dead pid and no Firecracker anywhere on the
   host; `vm-c5c6c204` is stuck in `creating`. Neither was corrected, per the brief.
   `list` faithfully reports records, so it will keep reporting these.
3. **Dead adapter code** (§6) is retained on purpose and still needs removal.
4. **The `ReadWritePaths=/home/shaharyar/.vmsan` exception is coupled to a vmsan
   implementation detail.** If a future vmsan version writes outside `VMSAN_DIR`, the
   service fails visibly on start with a new `EROFS`, which is the intended failure mode
   — but it is a dependency on 0.3.0 behaviour that should be revisited on upgrade.
5. **Next.js needs two things to reach the manager:** the `vmsan` group *and*
   `VMSAN_MANAGER_SOCKET=/run/vmsan-manager.sock`. The variable is present but commented
   out in `.env.local`, so an app started without it looks for
   `/run/user/10002/vmsan-manager.sock` and returns `503 MANAGER_UNAVAILABLE`. This was
   observed directly against a pre-existing instance.
6. **The unexplained `sudo -l` result** (§5.1) remains open.
7. **`vm-6ce50edc` from the brief** does not exist; if something downstream expects it,
   that expectation is wrong.

---

## 8. Task completion summary

| Task | State |
|---|---|
| 1–8 (implementation, adapter, deployment artifacts, docs, gates) | complete |
| 9.1–9.12 | complete |
| 9.13 | **partially verified** — see below |
| 10.1–10.6 | complete |

### 9.13 — partial, and left unchecked

| Item | State |
|---|---|
| `systemctl enable vmsan-manager` | run, after 9.6–9.12 passed; symlink created at `/etc/systemd/system/multi-user.target.wants/vmsan-manager.service` |
| `systemctl is-enabled vmsan-manager` | `enabled`; `systemctl status` confirms `Loaded: … enabled; preset: disabled` |
| Survives a reboot | **unverified** |

The operator declined to reboot the host to satisfy a checklist item. The task is left
**unchecked** rather than checked on partial evidence. A real reboot will validate it
naturally. Note that a `/run` socket cannot survive a reboot on its own — the socket is
recreated by the manager on start, so what is being validated is that the unit starts
and rebinds, which is the part that matters.

---

## 9. Change containment (10.6)

This change exists **only in the working tree**. On `main`, no commits, no stashes, no
branches, no worktrees, and no Worktrunk state were created by this work.

`06__full-stack/forkdevs/` appears as untracked in `git status`, but it is pre-existing
and unrelated: it is dated 2026-09-15, two weeks before this work began, and has its own
commit history.
