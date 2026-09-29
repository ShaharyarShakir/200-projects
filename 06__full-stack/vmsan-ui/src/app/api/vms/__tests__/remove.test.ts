import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { DELETE } from "../[id]/route";
import { VMMetadataStore } from "@/lib/vm-metadata";

/**
 * Delete is a privileged operation with no manager RPC behind it.
 *
 * The stronger property here than "returns 501" is that nothing changes. A
 * route that reported failure after having already removed a metadata record
 * would leave the dashboard showing a VM that no longer exists and no way to
 * clean it up. So the test asserts the store file is untouched, not merely that
 * the status code is right.
 */

type ErrorBody = { error: { code: string; message: string } };

function deleteRequest(id: string): {
  request: Request;
  context: { params: Promise<{ id: string }> };
} {
  return {
    request: new Request(`http://localhost/api/vms/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
    context: { params: Promise.resolve({ id }) },
  };
}

describe("DELETE /api/vms/:id route handler", () => {
  const originalBinPath = process.env.VMSAN_BIN_PATH;
  const originalMetadataPath = process.env.VMSAN_METADATA_PATH;
  const originalSocket = process.env.VMSAN_MANAGER_SOCKET;
  let tempDir: string | null = null;

  afterEach(async () => {
    if (originalBinPath !== undefined) {
      process.env.VMSAN_BIN_PATH = originalBinPath;
    } else {
      delete process.env.VMSAN_BIN_PATH;
    }
    if (originalMetadataPath !== undefined) {
      process.env.VMSAN_METADATA_PATH = originalMetadataPath;
    } else {
      delete process.env.VMSAN_METADATA_PATH;
    }
    if (originalSocket !== undefined) {
      process.env.VMSAN_MANAGER_SOCKET = originalSocket;
    } else {
      delete process.env.VMSAN_MANAGER_SOCKET;
    }
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  it("returns 501 VM_LIFECYCLE_UNAVAILABLE for a valid ID", async () => {
    const { request, context } = deleteRequest("vm-mock1");

    const response = await DELETE(request, context);

    assert.equal(response.status, 501);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "VM_LIFECYCLE_UNAVAILABLE");
    assert.match(body.error.message, /not available over the vmsan manager/i);
  });

  it("rejects an invalid VM ID with 400 INVALID_REQUEST, ahead of the 501", async () => {
    const { request, context } = deleteRequest("bad;id");

    const response = await DELETE(request, context);

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("Invalid VM ID"));
  });

  for (const id of ["", "a".repeat(65), "vm 123", "$(whoami)", "vm-123 && whoami"]) {
    it(`rejects ${JSON.stringify(id)} as an invalid VM ID`, async () => {
      const { request, context } = deleteRequest(id);

      const response = await DELETE(request, context);

      assert.equal(response.status, 400);
      const body = (await response.json()) as ErrorBody;
      assert.equal(body.error.code, "INVALID_REQUEST");
    });
  }

  it("creates, modifies, and deletes no metadata record", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vmsan-remove-test-"));
    const storeFile = path.join(tempDir, "vms.json");
    process.env.VMSAN_METADATA_PATH = storeFile;
    // Pre-existing state, so the assertion is that a record survives rather
    // than that an empty file was never created.
    const store = new VMMetadataStore({ filePath: storeFile });
    await store.set("vm-mock1", "keep-me");
    const before = await fs.readFile(storeFile, "utf-8");

    const { request, context } = deleteRequest("vm-mock1");
    const response = await DELETE(request, context);

    assert.equal(response.status, 501);
    const after = await fs.readFile(storeFile, "utf-8");
    assert.equal(after, before, "the metadata file must be byte-identical");

    const reloaded = new VMMetadataStore({ filePath: storeFile });
    assert.equal((await reloaded.get("vm-mock1"))?.name, "keep-me");
  });

  it("invokes no vmsan command and contacts no manager", async () => {
    process.env.VMSAN_BIN_PATH = "/nonexistent/binary";
    process.env.VMSAN_MANAGER_SOCKET = "/nonexistent/vmsan-manager.sock";

    const { request, context } = deleteRequest("vm-mock1");
    const response = await DELETE(request, context);

    assert.equal(response.status, 501);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "VM_LIFECYCLE_UNAVAILABLE");
  });
});
