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

# Enable privileged execution for operations requiring root (e.g. VM creation, tap configuration)
VMSAN_SUDO=true
```

### Privileged Execution & Sudo Configuration

MicroVM operations (such as `vmsan create` for configuring network TAP interfaces, cgroups, and chroots) require root privileges on Linux.

**IMPORTANT: Do NOT run the Next.js process as root (`sudo pnpm dev`).**

The Next.js server runs as an unprivileged user. When `VMSAN_SUDO=true`, the backend adapter executes privileged commands using non-interactive sudo:

```bash
sudo -n /path/to/vmsan <args...>
```

To allow the application to execute `vmsan` without hanging on interactive password prompts, configure passwordless sudo for the exact `vmsan` binary:

1. Create a drop-in sudoers rule at `/etc/sudoers.d/vmsan`:

   ```bash
   sudo visudo -f /etc/sudoers.d/vmsan
   ```

2. Add the following rule (replace `<username>` with your local user or service account, and verify the path to `vmsan`):

   ```text
   <username> ALL=(ALL) NOPASSWD: /usr/local/bin/vmsan
   ```

3. Ensure correct file permissions:

   ```bash
   sudo chmod 0440 /etc/sudoers.d/vmsan
   ```

If passwordless sudo is not configured and `VMSAN_SUDO=true` is enabled, API endpoints will fail fast and return HTTP 503 (`VMSAN_UNAVAILABLE`) with:

> `vmsan requires configured privilege escalation (passwordless sudo)`

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
