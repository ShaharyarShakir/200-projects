import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { POST as createVMRoute } from "../route";
import { POST as startVMRoute } from "../[id]/start/route";
import { POST as stopVMRoute } from "../[id]/stop/route";
import { DELETE as removeVMRoute } from "../[id]/route";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_BIN_PATH = path.resolve(
  __dirname,
  "../../../../lib/vmsan/__tests__/mock-vmsan.js"
);

describe("Security tests for VM Management API routes", () => {
  const originalBinPath = process.env.VMSAN_BIN_PATH;
  const originalSudo = process.env.VMSAN_SUDO;

  beforeEach(() => {
    process.env.VMSAN_BIN_PATH = MOCK_BIN_PATH;
    process.env.VMSAN_SUDO = "false";
  });

  afterEach(() => {
    if (originalBinPath !== undefined) {
      process.env.VMSAN_BIN_PATH = originalBinPath;
    } else {
      delete process.env.VMSAN_BIN_PATH;
    }

    if (originalSudo !== undefined) {
      process.env.VMSAN_SUDO = originalSudo;
    } else {
      delete process.env.VMSAN_SUDO;
    }
  });

  const injectionIds = [
    "vm-123;whoami",
    "vm-123 && whoami",
    "vm-123 | whoami",
    "$(whoami)",
    "`whoami`",
    "../../etc/passwd",
    "vm 123",
    "vm\nwhoami",
    "vm>file",
    "vm<file",
    "vm-123' OR '1'='1",
    "",
    "a".repeat(65),
  ];

  for (const maliciousId of injectionIds) {
    it(`should reject malicious ID in start route: ${JSON.stringify(maliciousId)}`, async () => {
      const req = new Request(`http://localhost/api/vms/${encodeURIComponent(maliciousId)}/start`, {
        method: "POST",
      });
      const context = { params: Promise.resolve({ id: maliciousId }) };

      const response = await startVMRoute(req, context);
      assert.equal(response.status, 400);

      const body = (await response.json()) as { error: { code: string; message: string } };
      assert.equal(body.error.code, "INVALID_REQUEST");
      assert.ok(body.error.message.includes("Invalid VM ID"));
    });

    it(`should reject malicious ID in stop route: ${JSON.stringify(maliciousId)}`, async () => {
      const req = new Request(`http://localhost/api/vms/${encodeURIComponent(maliciousId)}/stop`, {
        method: "POST",
      });
      const context = { params: Promise.resolve({ id: maliciousId }) };

      const response = await stopVMRoute(req, context);
      assert.equal(response.status, 400);

      const body = (await response.json()) as { error: { code: string; message: string } };
      assert.equal(body.error.code, "INVALID_REQUEST");
      assert.ok(body.error.message.includes("Invalid VM ID"));
    });

    it(`should reject malicious ID in remove route: ${JSON.stringify(maliciousId)}`, async () => {
      const req = new Request(`http://localhost/api/vms/${encodeURIComponent(maliciousId)}`, {
        method: "DELETE",
      });
      const context = { params: Promise.resolve({ id: maliciousId }) };

      const response = await removeVMRoute(req, context);
      assert.equal(response.status, 400);

      const body = (await response.json()) as { error: { code: string; message: string } };
      assert.equal(body.error.code, "INVALID_REQUEST");
      assert.ok(body.error.message.includes("Invalid VM ID"));
    });
  }

  it("should strip injected command fields from create VM request body", async () => {
    const req = new Request("http://localhost/api/vms", {
      method: "POST",
      body: JSON.stringify({
        runtime: "node22",
        vcpus: 2,
        memoryMiB: 512,
        command: "rm -rf /",
        flags: ["--danger", "--privilege"],
        exec: "whoami",
        shell: "/bin/sh",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await createVMRoute(req);
    assert.equal(response.status, 201);

    const body = (await response.json()) as {
      success: boolean;
      result?: { stdout: string };
    };
    assert.equal(body.success, true);
    assert.ok(body.result?.stdout.includes("Created VM"));
  });
});
