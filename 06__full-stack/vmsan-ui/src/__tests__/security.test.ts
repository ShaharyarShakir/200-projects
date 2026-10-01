import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path, { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateVmId, validateCreateVmInput } from "@/lib/vms/validation";
import { toVmDto } from "@/lib/vms/vm-mapper";
import { toApiErrorResponse, VmValidationError } from "@/lib/vms/vm-errors";
import { POST as startVmRoute } from "@/app/api/vms/[id]/start/route";
import { POST as stopVmRoute } from "@/app/api/vms/[id]/stop/route";
import { DELETE as removeVmRoute } from "@/app/api/vms/[id]/route";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, "..");

function getAllSourceFiles(dir: string, excludeTests: boolean = true): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (excludeTests && (entry.name === "__tests__" || entry.name === "node_modules")) {
        continue;
      }
      files.push(...getAllSourceFiles(fullPath, excludeTests));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("Security: Privilege Separation & Child Process Isolation", () => {
  it("verifies no source file in src/ imports or references child_process", () => {
    // Only test files might mock or test something, but application code must never import child_process
    const appFiles = getAllSourceFiles(SRC_DIR, true).filter(
      // exclude legacy deprecated vmsan client if present (which is replaced by vmsan-manager socket client)
      (f) => !f.includes("src/lib/vmsan/client.ts")
    );

    for (const file of appFiles) {
      const content = readFileSync(file, "utf8");
      assert.equal(
        /from\s+["']child_process["']|require\(["']child_process["']\)/.test(content),
        false,
        `Forbidden child_process import found in ${file}`
      );
      assert.equal(
        /\b(spawn|exec|execSync|spawnSync|fork|execFile)\s*\(/.test(content),
        false,
        `Potential child process execution found in ${file}`
      );
    }
  });

  it("verifies Next.js API routes do not directly import privileged vmsan module", () => {
    const apiFiles = getAllSourceFiles(join(SRC_DIR, "app/api"), true);

    for (const file of apiFiles) {
      const content = readFileSync(file, "utf8");
      // Routes must not import directly from @/lib/vmsan or native vmsan runner
      assert.equal(
        /from\s+["']@\/lib\/vmsan(\/.*)?["']/.test(content),
        false,
        `Direct @/lib/vmsan import found in API route: ${file}`
      );
    }
  });

  it("verifies VM domain layer does not import privileged vmsan module", () => {
    const vmDomainFiles = getAllSourceFiles(join(SRC_DIR, "lib/vms"), true);

    for (const file of vmDomainFiles) {
      const content = readFileSync(file, "utf8");
      assert.equal(
        /from\s+["']@\/lib\/vmsan(\/.*)?["']/.test(content),
        false,
        `Direct @/lib/vmsan import found in domain layer: ${file}`
      );
    }
  });
});

describe("Security: Command Injection & Path Traversal Rejection", () => {
  const maliciousVmIds = [
    "; rm -rf /",
    "vm-1; touch /tmp/pwned",
    "vm-1 && whoami",
    "vm-1 | id",
    "$(reboot)",
    "`reboot`",
    "../../etc/passwd",
    "../../../root/.ssh/id_rsa",
    "vm id with spaces",
    "vm\nid",
    "vm\r\nid",
    "vm\0id",
    "vm>output",
    "vm<input",
    "vm' OR 1=1 --",
    'vm" OR 1=1 --',
    "vm$VAR",
    "${USER}",
    "",
    "   ",
    "a".repeat(65),
  ];

  it("rejects malicious VM IDs at the validation layer", () => {
    for (const id of maliciousVmIds) {
      assert.throws(
        () => validateVmId(id),
        VmValidationError,
        `Expected validateVmId to reject malicious ID: ${JSON.stringify(id)}`
      );
    }
  });

  it("rejects malicious VM IDs across all parameterized API routes (400)", async () => {
    for (const id of maliciousVmIds) {
      const startReq = new Request(`http://localhost/api/vms/${encodeURIComponent(id)}/start`, {
        method: "POST",
      });
      const startRes = await startVmRoute(startReq, { params: Promise.resolve({ id }) });
      assert.equal(startRes.status, 400, `Start route should return 400 for ${id}`);
      const startBody = await startRes.json();
      assert.equal(startBody.error.code, "INVALID_REQUEST");

      const stopReq = new Request(`http://localhost/api/vms/${encodeURIComponent(id)}/stop`, {
        method: "POST",
      });
      const stopRes = await stopVmRoute(stopReq, { params: Promise.resolve({ id }) });
      assert.equal(stopRes.status, 400, `Stop route should return 400 for ${id}`);
      const stopBody = await stopRes.json();
      assert.equal(stopBody.error.code, "INVALID_REQUEST");

      const removeReq = new Request(`http://localhost/api/vms/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const removeRes = await removeVmRoute(removeReq, { params: Promise.resolve({ id }) });
      assert.equal(removeRes.status, 400, `Remove route should return 400 for ${id}`);
      const removeBody = await removeRes.json();
      assert.equal(removeBody.error.code, "INVALID_REQUEST");
    }
  });

  it("strips arbitrary injection properties from VM creation body", () => {
    const dirtyPayload = {
      runtime: "node22",
      vcpus: 2,
      memoryMib: 512,
      exec: "cat /etc/shadow",
      command: "rm -rf /",
      shell: "/bin/bash",
      sudo: true,
      privileged: true,
      flags: ["--dangerous", "--root"],
      agentToken: "attacker-token-override",
    };

    const validated = validateCreateVmInput(dirtyPayload);
    assert.deepEqual(validated, {
      runtime: "node22",
      vcpus: 2,
      memoryMib: 512,
    });

    const keys = Object.keys(validated);
    assert.equal(keys.includes("exec"), false);
    assert.equal(keys.includes("command"), false);
    assert.equal(keys.includes("shell"), false);
    assert.equal(keys.includes("sudo"), false);
    assert.equal(keys.includes("privileged"), false);
    assert.equal(keys.includes("flags"), false);
    assert.equal(keys.includes("agentToken"), false);
  });
});

describe("Security: Sensitive Host Details Omission", () => {
  it("guarantees toVmDto strips all sensitive host internals", () => {
    const rawHostRecord = {
      id: "vm-secure-1",
      status: "running",
      runtime: "node22",
      vcpuCount: 2,
      memSizeMib: 512,
      diskSizeGb: 5,
      createdAt: "2026-09-30T00:00:00.000Z",
      // Sensitive fields that MUST be stripped:
      agentToken: "super-secret-agent-token-12345",
      hostTap: "tap-vmsan-123",
      tapInterface: "veth999",
      tapName: "tap-vm-1",
      pid: 98765,
      hostPath: "/var/lib/vmsan/vms/vm-secure-1",
      jailerPath: "/srv/jailer/firecracker/vm-secure-1",
      jailerRoot: "/srv/jailer",
      socketPath: "/run/vmsan-manager.sock",
      sudoersPath: "/etc/sudoers.d/vmsan",
      logPath: "/var/log/vmsan/vm-secure-1.log",
      rootfsPath: "/var/lib/vmsan/images/rootfs.ext4",
      kernelPath: "/var/lib/vmsan/images/vmlinux",
    };

    const sanitized = toVmDto(rawHostRecord);

    assert.equal(sanitized.id, "vm-secure-1");
    assert.equal(sanitized.status, "running");
    assert.equal(sanitized.runtime, "node22");
    assert.equal(sanitized.vcpus, 2);
    assert.equal(sanitized.memoryMib, 512);
    assert.equal(sanitized.diskSizeGb, 5);

    const keys = Object.keys(sanitized);
    const forbiddenKeys = [
      "agentToken",
      "hostTap",
      "tapInterface",
      "tapName",
      "pid",
      "hostPath",
      "jailerPath",
      "jailerRoot",
      "socketPath",
      "sudoersPath",
      "logPath",
      "rootfsPath",
      "kernelPath",
    ];

    for (const key of forbiddenKeys) {
      assert.equal(keys.includes(key), false, `Sensitive key '${key}' leaked in toVmDto result`);
    }
  });

  it("guarantees error responses do not leak socket paths or system details", () => {
    const leaks = [
      new Error("connect ENOENT /run/vmsan-manager.sock"),
      new Error("connect EACCES /run/user/1000/vmsan-manager.sock"),
      new Error("connect ECONNREFUSED /run/vmsan-manager.sock"),
      new Error("Failed to read from /var/lib/vmsan/vms/vm-1/config.json"),
      new Error("Socket error on /tmp/vmsan-test.sock with errno -2"),
    ];

    for (const err of leaks) {
      const { status, body } = toApiErrorResponse(err);
      assert.ok(status >= 400 && status <= 599);
      assert.equal(body.error.message.includes(".sock"), false, "Error message must not leak .sock");
      assert.equal(body.error.message.includes("/run/"), false, "Error message must not leak /run/");
      assert.equal(body.error.message.includes("/var/"), false, "Error message must not leak /var/");
      assert.equal(body.error.message.includes("/tmp/"), false, "Error message must not leak /tmp/");
      assert.equal(body.error.message.includes("ENOENT"), false, "Error message must not leak ENOENT");
      assert.equal(body.error.message.includes("EACCES"), false, "Error message must not leak EACCES");
    }
  });
});
