# vmsan UI

Web dashboard and management interface for microVMs powered by the `vmsan` CLI and Firecracker.

## Getting Started

### Prerequisites

- Node.js 20+
- `pnpm`
- `vmsan` CLI installed on the host system

### Environment Configuration

Create a `.env.local` file (or set environment variables in your shell):

```bash
# Path to the vmsan executable (defaults to "vmsan" in PATH if unset)
VMSAN_BIN_PATH=/usr/local/bin/vmsan

# Where the privileged manager listens. Must match the installed service.
# Unset, the client falls back to $XDG_RUNTIME_DIR/vmsan-manager.sock and then
# /run/user/$UID/vmsan-manager.sock, which is where a manager started by hand
# for development listens. The installed service uses /run/vmsan-manager.sock,
# so set this explicitly when running against it.
# VMSAN_MANAGER_SOCKET=/run/vmsan-manager.sock
```

## The vmsan Manager

MicroVM operations (TAP interfaces, cgroups, chroots) require root. Rather than
granting the web application privilege, a separate **manager** process runs as
root and exposes a Unix domain socket. The Next.js server runs as an
unprivileged user with no sudo rights at all, and talks to the manager.

**Do not run the Next.js process as root** (`sudo pnpm dev`). If the application
has root, the socket group boundary means nothing.

The manager currently exposes two methods:

| Method     | Purpose                     | Used by            |
| ---------- | --------------------------- | ------------------ |
| `vm.create`| creates a new VM                | `POST /api/vms`    |
| `vm.start` | starts a stopped VM             | `POST /api/vms/[id]/start` |
| `vm.stop`  | stops a running VM              | `POST /api/vms/[id]/stop` |
| `vm.remove`| removes a stopped VM            | `DELETE /api/vms/[id]` |

### Installing the manager

The installer is idempotent and must be run by an operator with sudo. It builds
the manager, stages a production-only install into `/opt/vmsan-manager`, creates
the `vmsan` system group if it is absent, installs the unit, and adds you to the
group.

```bash
sudo bash scripts/install-vmsan-manager.sh
```

Then reload and **start** the unit — not enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl start vmsan-manager
```

### Verifying before you enable

The service is not enabled by the installer, and should not be until you have
confirmed it works. A service that starts on every boot with an unverified
configuration turns a typo into an outage you did not choose.

```bash
sudo systemctl status vmsan-manager --no-pager
sudo ls -l /run/vmsan-manager.sock     # expect 0660, group vmsan
sudo journalctl -u vmsan-manager -n 50 --no-pager
```

### Group membership takes effect on your next login

The installer adds you to the `vmsan` group, but your **current session** still
has the old group set. Nothing about the running shell changes. Start a new login
session, or re-check membership, before concluding the socket is broken:

```bash
id -nG | tr ' ' '\n' | grep vmsan
```

Until `vmsan` appears there, connecting to the socket fails with a permission
error. This is the single most common reason the dashboard shows "manager not
reachable" immediately after installing.

Then exercise the socket using the same node the service runs, so nothing extra
needs installing:

```bash
/usr/bin/node -e '
const { connect } = require("node:net");
const socket = connect(process.argv[1]);
socket.on("connect", () =>
  socket.write(JSON.stringify({ id: "1", method: process.argv[2] }) + "\n"));
socket.on("data", (chunk) => { process.stdout.write(chunk); socket.end(); });
' /run/vmsan-manager.sock health

/usr/bin/node -e '
const { connect } = require("node:net");
const socket = connect(process.argv[1]);
socket.on("connect", () =>
  socket.write(JSON.stringify({ id: "2", method: process.argv[2] }) + "\n"));
socket.on("data", (chunk) => { process.stdout.write(chunk); socket.end(); });
' /run/vmsan-manager.sock list
```

`health` must answer `{"ok":true,...}` and `list` must return your VMs. Only
then:

```bash
sudo systemctl enable vmsan-manager
```

### No sudoers entry is needed, and none is wanted

There is deliberately **no** `/etc/sudoers.d` rule for vmsan. The manager holds
all the privilege; the web application holds none. A passwordless sudo rule for
the `vmsan` binary would hand the web server the same power the manager was
built to contain, and would defeat the socket group boundary. Do not create one,
and remove any that an earlier version of this setup may have left behind.

### Unprivileged Error Handling

If the manager is not running, `GET /api/vms` and the lifecycle routes return `MANAGER_UNAVAILABLE` (HTTP 503).
The message is deliberately fixed and never includes the socket path, an errno,
or a stack trace. Invalid parameters return `INVALID_REQUEST` without
opening the socket. Manager service failures return specific mapped codes
like `VM_NOT_FOUND` or `VM_INVALID_STATE` while isolating the host runtime data.

### Development

For development you do not need the systemd service. Start the manager by hand as
an unprivileged user, and the client will find it at
`$XDG_RUNTIME_DIR/vmsan-manager.sock`:

```bash
VMSAN_MANAGER_SOCKET_GROUP= pnpm --filter vmsan-manager start
```

Leaving `VMSAN_MANAGER_SOCKET_GROUP` empty means the socket gets no group
ownership, which is fine for a single-user dev session and impossible to
mistake for the installed configuration.

### Development Server

Run the development server as a normal (unprivileged) user:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the dashboard.

## Testing & Quality Checks

Run linting:

```bash
pnpm lint
```

Run TypeScript type checking:

```bash
pnpm typecheck
```

Run test suite:

```bash
pnpm test
```
