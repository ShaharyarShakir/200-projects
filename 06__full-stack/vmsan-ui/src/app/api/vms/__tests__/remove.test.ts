import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DELETE } from "../[id]/route";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_BIN_PATH = path.resolve(
  __dirname,
  "../../../../lib/vmsan/__tests__/mock-vmsan.js"
);

describe("DELETE /api/vms/:id route handler", () => {
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
    delete process.env.MOCK_FAIL_SUDO;
  });

  it("should remove VM successfully with valid ID", async () => {
    const req = new Request("http://localhost/api/vms/vm-mock1", {
      method: "DELETE",
    });
    const context = { params: Promise.resolve({ id: "vm-mock1" }) };

    const response = await DELETE(req, context);
    assert.equal(response.status, 200);

    const body = (await response.json()) as { success: boolean; vmId: string };
    assert.equal(body.success, true);
    assert.equal(body.vmId, "vm-mock1");
  });

  it("should reject invalid VM ID with 400 INVALID_REQUEST", async () => {
    const req = new Request("http://localhost/api/vms/bad;id", {
      method: "DELETE",
    });
    const context = { params: Promise.resolve({ id: "bad;id" }) };

    const response = await DELETE(req, context);
    assert.equal(response.status, 400);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("Invalid VM ID"));
  });

  it("should return 503 when vmsan binary is unavailable", async () => {
    process.env.VMSAN_BIN_PATH = "/nonexistent/binary";

    const req = new Request("http://localhost/api/vms/vm-mock1", {
      method: "DELETE",
    });
    const context = { params: Promise.resolve({ id: "vm-mock1" }) };

    const response = await DELETE(req, context);
    assert.equal(response.status, 503);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "VMSAN_UNAVAILABLE");
  });

  it("should return sanitized 503 if sudo privilege escalation fails", async () => {
    process.env.MOCK_FAIL_SUDO = "true";

    const req = new Request("http://localhost/api/vms/vm-mock1", {
      method: "DELETE",
    });
    const context = { params: Promise.resolve({ id: "vm-mock1" }) };

    const response = await DELETE(req, context);
    assert.equal(response.status, 503);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "VMSAN_UNAVAILABLE");
    assert.equal(
      body.error.message,
      "vmsan requires configured privilege escalation (passwordless sudo)"
    );
  });
});
