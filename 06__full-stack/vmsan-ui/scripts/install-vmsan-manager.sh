#!/usr/bin/env bash
#
# Install the vmsan manager as a systemd service.
#
# Run as root:   sudo bash scripts/install-vmsan-manager.sh
#
# What this does:
#   1. Builds the manager and stages a production-only install in /opt/vmsan-manager
#   2. Creates the `vmsan` group if absent and adds the invoking user to it
#   3. Installs the unit file
#
# What this deliberately does NOT do, and why:
#   - It does not touch vmsan state. The VM records under VMSAN_DIR contain
#     absolute paths and are owned by the operator; rewriting or relocating them
#     is out of scope and would break existing VMs.
#   - It does not write to /etc/sudoers.d. There is no escalation path to
#     configure: the manager holds all privilege and the web app has none.
#   - It does not modify any other system configuration.
#
# It is idempotent: re-running it converges on the same state and is safe.
#
# DO NOT `systemctl enable` the service yet. Start it, verify `health` and
# `list`, and only then enable it. An enabled service that starts on every boot
# with an unverified configuration turns a typo into an outage you did not
# choose.

set -euo pipefail

readonly MANAGER_NAME="vmsan-manager"
readonly INSTALL_DIR="/opt/vmsan-manager"
readonly UNIT_NAME="vmsan-manager.service"
readonly UNIT_SOURCE="${REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}/deploy/${UNIT_NAME}"
readonly UNIT_DEST="/etc/systemd/system/${UNIT_NAME}"
readonly SERVICE_GROUP="vmsan"
readonly SOCKET_PATH="/run/vmsan-manager.sock"
readonly SYSTEM_NODE="/usr/bin/node"

log()  { printf '\n== %s\n' "$*"; }
warn() { printf 'warning: %s\n' "$*" >&2; }
die()  { printf 'error: %s\n' "$*" >&2; exit 1; }

# The user to add to the service group. SUDO_USER is the human who ran `sudo`,
# which is the case this script is written for; INVOKING_USER overrides it for
# an operator running the script as root through some other arrangement.
INVOKING_USER="${SUDO_USER:-${INVOKING_USER:-root}}"

# Global, not a function local: the EXIT trap below is evaluated after the
# function that set it has returned, and a `local` would already be unbound.
STAGE_DIR=""

# The operator's PATH, for the unprivileged build steps.
#
# pnpm is installed per Node version by version managers, so there is no stable
# directory to hardcode: this host has it at
# ~/.local/share/fnm/node-versions/v24.21.0/installation/bin. The path is read
# from the operator's own login environment once, and the marker prefix means
# the banner that profile prints cannot be mistaken for the value.
#
# A login shell is used exactly here and nowhere else, because it is the only
# way to see the version manager's shims. The build itself runs with `bash -c`
# so the profile is not sourced again under root's authority.
operator_path() {
  local raw
  if [[ "$(id -un)" == "${INVOKING_USER}" ]]; then
    raw="$(bash -lc 'printf "VMSAN_PATH=%s\n" "$PATH"' 2>/dev/null || true)"
  else
    raw="$(sudo -u "${INVOKING_USER}" -H bash -lc 'printf "VMSAN_PATH=%s\n" "$PATH"' 2>/dev/null || true)"
  fi
  printf '%s' "${raw#*VMSAN_PATH=}" | tail -n 1
}

INVOKING_PATH="$(operator_path)"
# A profile that ends in `exec` yields no marker, and a shell with an unusual
# setup may yield no PATH at all. Either way, the operator can say where pnpm
# is instead of the install failing halfway.
if [[ -z "${INVOKING_PATH}" ]]; then
  warn "could not read ${INVOKING_USER}'s PATH; falling back to the system locations"
  warn "if pnpm is not found, re-run with VMSAN_INSTALL_PNPM=/path/to/pnpm"
  INVOKING_PATH="/usr/local/bin:/usr/bin:/bin"
fi
# The version manager's node must win, or the build silently uses a different
# Node than the developer tested with.
case ":${INVOKING_PATH}:" in
  *:/usr/bin:*) ;;
  *) INVOKING_PATH="${INVOKING_PATH}:/usr/bin" ;;
esac

# Escape hatch: an operator whose pnpm the capture cannot see names it directly
# rather than editing the script.
if [[ -n "${VMSAN_INSTALL_PNPM:-}" ]]; then
  [[ -x "${VMSAN_INSTALL_PNPM}" ]] ||
    die "VMSAN_INSTALL_PNPM is not executable: ${VMSAN_INSTALL_PNPM}"
  INVOKING_PATH="$(dirname "${VMSAN_INSTALL_PNPM}"):${INVOKING_PATH}"
fi

# Run a build command as the operator rather than as root.
#
# Everything that only reads source and writes into a build directory runs
# unprivileged. A root-run `tsc` would leave root-owned files in the operator's
# checkout, and a root-run `pnpm install` would populate root's package store
# instead of the warm one the operator already has. Only the steps that write
# under /opt or /etc need root, and those are the ones that run as root.
#
# PATH is composed explicitly rather than through `bash -l`. A login shell would
# find pnpm on its own, but it also sources the operator's profile, so anything
# in there — a banner, a hook, a stray prompt — runs twice per install under
# root's authority. The install needs pnpm, not the rest of the profile.
run_as_invoker() {
  if [[ "$(id -un)" == "${INVOKING_USER}" ]]; then
    env "PATH=${INVOKING_PATH}" bash -c "$1"
  else
    sudo -u "${INVOKING_USER}" -H env "PATH=${INVOKING_PATH}" bash -c "$1"
  fi
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    die "must be run as root: sudo bash scripts/install-vmsan-manager.sh"
  fi
}

require_system_node() {
  if [[ ! -x "${SYSTEM_NODE}" ]]; then
    die "${SYSTEM_NODE} not found; the unit's ExecStart requires the system Node"
  fi
  local version
  version="$("${SYSTEM_NODE}" --version)"
  log "system node: ${SYSTEM_NODE} (${version})"
}

# Stage the manager.
#
# The production dependency tree is resolved in a throwaway project rather than
# with `pnpm deploy`. Deploy copies the workspace's hoisted store, which pulls
# the web app's Next.js and its native binaries (about 300MB of the 412MB it
# produced) into an install that only ever needs vmsan's own closure. A
# standalone install of the manager's declared dependencies is 66MB and
# contains nothing the service does not import.
#
# vmsan is pinned to an exact version, and the lockfile pnpm writes here is kept
# beside the install, so the deployed tree is reproducible even though its
# transitive versions are resolved now rather than read from the workspace
# lockfile.
stage_manager() {
  local repo_root manager_dir
  repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  manager_dir="${repo_root}/vmsan-manager"

  [[ -d "${manager_dir}" ]] || die "manager source not found at ${manager_dir}"
  [[ -f "${repo_root}/pnpm-lock.yaml" ]] ||
    die "pnpm-lock.yaml not found; run from a complete checkout"
  command -v pnpm >/dev/null 2>&1 || die "pnpm is not on PATH; install it and re-run"

  log "building the manager as ${INVOKING_USER}"
  run_as_invoker "cd '${repo_root}' && pnpm --filter '${MANAGER_NAME}' build" ||
    die "build failed"
  [[ -f "${manager_dir}/dist/index.js" ]] || die "build did not produce dist/index.js"

  STAGE_DIR="$(mktemp -d)"
  trap 'rm -rf "${STAGE_DIR}"' EXIT
  rm -rf "${STAGE_DIR:?}/"*
  # The dependency install runs as the operator, so the staging directory has to
  # belong to them.
  chown "${INVOKING_USER}" "${STAGE_DIR}"

  # The runtime manifest: no devDependencies, no scripts, no workspace fields.
  # Scripts are dropped so nothing in the dependency tree can run install hooks
  # as root.
  python3 - "${manager_dir}/package.json" "${STAGE_DIR}/package.json" <<'PY'
import json, sys

source, target = sys.argv[1], sys.argv[2]
with open(source) as handle:
    manifest = json.load(handle)

# The declared range is copied verbatim. An exact version cannot drift; a range
# is resolved once here and then pinned by the lockfile written alongside.
runtime = {
    "name": manifest["name"],
    "version": manifest["version"],
    "private": True,
    "type": manifest.get("type", "module"),
    "dependencies": manifest.get("dependencies", {}),
}
with open(target, "w") as handle:
    json.dump(runtime, handle, indent=2)
PY

  # Written as the operator: a root-owned file here would be a root-owned file
  # in the operator's checkout.
  chown "${INVOKING_USER}" "${STAGE_DIR}/package.json"

  log "resolving the production dependency tree as ${INVOKING_USER}"
  run_as_invoker "cd '${STAGE_DIR}' && pnpm install --prod --ignore-scripts" ||
    die "dependency install failed"

  # The service must run the version this repository was developed against. A
  # silently different vmsan could read differently shaped records.
  local wanted installed
  wanted="$(grep -Eo '"vmsan": *"[^"]+"' "${manager_dir}/package.json" | head -1 |
    grep -Eo '[0-9]+\.[0-9]+\.[0-9]+')"
  installed="$(node -p "require('${STAGE_DIR}/node_modules/vmsan/package.json').version" 2>/dev/null || true)"
  [[ -n "${installed}" ]] || die "vmsan was not installed"
  [[ "${installed}" == "${wanted}" ]] ||
    die "installed vmsan ${installed} does not match the pinned ${wanted}"

  log "staging into ${INSTALL_DIR}"
  install -d -m 0755 "${INSTALL_DIR}"
  # Replaced rather than merged, so a dependency dropped in a later version
  # cannot survive an upgrade.
  rm -rf "${INSTALL_DIR}/dist" "${INSTALL_DIR}/node_modules" \
         "${INSTALL_DIR}/package.json" "${INSTALL_DIR}/pnpm-lock.yaml"
  # Plain `cp -r`, deliberately not `-L`. pnpm hard-links installed files to its
  # content-addressable store, so a recursive chown of a copied tree would
  # change the ownership of packages cached for other projects. Copying the
  # file contents breaks the link; copying the symlink farm as symlinks keeps
  # the tree self-contained without duplicating 400MB of dependency.
  cp -r "${manager_dir}/dist" "${INSTALL_DIR}/dist"
  cp -r "${STAGE_DIR}/node_modules" "${INSTALL_DIR}/node_modules"
  cp "${STAGE_DIR}/package.json" "${INSTALL_DIR}/package.json"
  cp "${STAGE_DIR}/pnpm-lock.yaml" "${INSTALL_DIR}/pnpm-lock.yaml"

  log "setting root ownership and non-writable modes"
  chown -R root:root "${INSTALL_DIR}"
  # Not user- or group-writable: the only writer is this script.
  find "${INSTALL_DIR}" -type d -exec chmod 0755 {} +
  find "${INSTALL_DIR}" -type f -exec chmod 0644 {} +
  chmod 0755 "${INSTALL_DIR}/dist/index.js"

  # A symlink resolving outside the tree would make the service depend on a
  # path that the next deploy or a prune can remove. Relative symlinks that
  # stay inside are pnpm's own layout and are expected.
  local escaping
  escaping="$(cd "${INSTALL_DIR}" && find . -type l -print0 |
    xargs -0 -r realpath -m |
    grep -v "^${INSTALL_DIR}/" || true)"
  [[ -z "${escaping}" ]] ||
    die "installed tree links outside itself: ${escaping}"
}

ensure_group() {
  if getent group "${SERVICE_GROUP}" >/dev/null; then
    log "group ${SERVICE_GROUP} already exists"
  else
    log "creating system group ${SERVICE_GROUP}"
    groupadd --system "${SERVICE_GROUP}"
  fi
}

ensure_membership() {
  local user
  user="${INVOKING_USER}"

  if ! id "${user}" >/dev/null 2>&1; then
    warn "user ${user} does not exist; skipping group membership"
    return
  fi

  if id -nG "${user}" | tr ' ' '\n' | grep -qx "${SERVICE_GROUP}"; then
    log "${user} is already a member of ${SERVICE_GROUP}"
  else
    log "adding ${user} to ${SERVICE_GROUP}"
    usermod --append --groups "${SERVICE_GROUP}" "${user}"
  fi
}

install_unit() {
  [[ -f "${UNIT_SOURCE}" ]] || die "unit file not found at ${UNIT_SOURCE}"
  # Checked rather than created: if systemd's unit directory is missing, this is
  # a system that does not look the way the unit assumes, and silently creating
  # the path would install a service nothing will ever read.
  [[ -d "$(dirname "${UNIT_DEST}")" ]] ||
    die "unit directory $(dirname "${UNIT_DEST}") does not exist"
  log "installing ${UNIT_DEST}"
  install -m 0644 -o root -g root "${UNIT_SOURCE}" "${UNIT_DEST}"
  # A malformed unit is discovered only at daemon-reload or start, which is a
  # confusing place to find a typo. `systemd-analyze` is part of systemd itself.
  if command -v systemd-analyze >/dev/null 2>&1; then
    systemd-analyze verify "${UNIT_DEST}" ||
      warn "systemd-analyze reported a problem with the unit; check the output above"
  fi
}

print_next_steps() {
  local membership
  membership="$(id -nG "${INVOKING_USER}" 2>/dev/null || printf 'unknown')"

  cat <<EOF

== Installed

  path:      ${INSTALL_DIR}
  unit:      ${UNIT_DEST}
  socket:    ${SOCKET_PATH} (mode 0660, group ${SERVICE_GROUP})
  node:      ${SYSTEM_NODE}

  group membership now: ${membership}

== Group membership does not apply to your current session

  The group was just added to the passwd database. Your existing login session,
  and anything already running as you, still has the old group set. Either start
  a new login session or re-check membership:

    id -nG ${INVOKING_USER}

  Until \`${SERVICE_GROUP}\` appears in that output, connecting to
  ${SOCKET_PATH} will fail with a permission error.

== Next steps

  1. Reload the unit:

       sudo systemctl daemon-reload

  2. Start it (not enable):

       sudo systemctl start ${UNIT_NAME}

  3. Verify. The socket must be reachable and answer both methods:

       sudo systemctl status ${UNIT_NAME}
       sudo ls -l ${SOCKET_PATH}
       sudo journalctl -u ${UNIT_NAME} -n 50 --no-pager

     From this session, after the group check above passes. This uses the same
     node the service runs, so it needs nothing installed beyond what is
     already required:

       ${SYSTEM_NODE} -e '
       const { connect } = require("node:net");
       const socket = connect(process.argv[1]);
       socket.on("connect", () =>
         socket.write(JSON.stringify({ id: "1", method: process.argv[2] }) + "\\n"));
       socket.on("data", (chunk) => { process.stdout.write(chunk); socket.end(); });
       ' ${SOCKET_PATH} health

       ${SYSTEM_NODE} -e '
       const { connect } = require("node:net");
       const socket = connect(process.argv[1]);
       socket.on("connect", () =>
         socket.write(JSON.stringify({ id: "2", method: process.argv[2] }) + "\\n"));
       socket.on("data", (chunk) => { process.stdout.write(chunk); socket.end(); });
       ' ${SOCKET_PATH} list

     health must answer {"ok":true,...}. list must answer with your VMs. If
     either fails with a permission error, the group check above has not taken
     effect yet.

  4. Only once both return ok, start the web application and confirm
     /api/vms lists your VMs. Then enable the service for boot:

       sudo systemctl enable ${UNIT_NAME}

  Do not run step 4 before step 3 succeeds. Create, start, stop, and delete
  return VM_LIFECYCLE_UNAVAILABLE in this build; the manager exposes health and
  list only.
EOF
}

main() {
  require_root
  require_system_node
  stage_manager
  ensure_group
  install_unit
  ensure_membership
  print_next_steps
}

main "$@"
