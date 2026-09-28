import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GET } from "../route";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_BIN_PATH = path.resolve(
  __dirname,
  "../../../../lib/vmsan/__tests__/mock-vmsan.js"
);

describe("GET /api/vms route handler", () => {
  const originalBinPath = process.env.VMSAN_BIN_PATH;
  const originalSudo = process.env.VMSAN_SUDO;

  beforeEach(() => {
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

  it("should return 200 and list of VMs on success", async () => {
    process.env.VMSAN_BIN_PATH = MOCK_BIN_PATH;

    const response = await GET();
    assert.equal(response.status, 200);

    const body = (await response.json()) as { vms: unknown[] };
    assert.ok(body.vms);
    assert.equal(body.vms.length, 2);
    assert.deepEqual(body.vms[0], {
      id: "vm-mock1",
      status: "running",
      memoryMiB: 256,
      vcpus: 1,
      runtime: "base",
      age: "2m",
    });
  });

  it("should return 503 when vmsan binary fails to execute or is missing", async () => {
    process.env.VMSAN_BIN_PATH = "/nonexistent/path/to/vmsan";

    const response = await GET();
    assert.equal(response.status, 503);

    const body = (await response.json()) as {
      error: {
        code: string;
        message: string;
      };
    };
    assert.ok(body.error);
    assert.equal(body.error.code, "VMSAN_UNAVAILABLE");
    assert.ok(body.error.message.includes("vmsan executable is not available"));
  });
});
