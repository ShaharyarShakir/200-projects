import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../[id]/stop/route";

/**
 * Stop is a privileged operation with no manager RPC behind it.
 *
 * See `POST /api/vms/[id]/start`: validate, then report unavailable, and reach
 * neither the vmsan CLI nor the manager socket.
 */

type ErrorBody = { error: { code: string; message: string } };

function stopRequest(id: string): {
  request: Request;
  context: { params: Promise<{ id: string }> };
} {
  return {
    request: new Request(`http://localhost/api/vms/${encodeURIComponent(id)}/stop`, {
      method: "POST",
    }),
    context: { params: Promise.resolve({ id }) },
  };
}

describe("POST /api/vms/:id/stop route handler", () => {
  const originalBinPath = process.env.VMSAN_BIN_PATH;
  const originalSocket = process.env.VMSAN_MANAGER_SOCKET;

  afterEach(() => {
    if (originalBinPath !== undefined) {
      process.env.VMSAN_BIN_PATH = originalBinPath;
    } else {
      delete process.env.VMSAN_BIN_PATH;
    }
    if (originalSocket !== undefined) {
      process.env.VMSAN_MANAGER_SOCKET = originalSocket;
    } else {
      delete process.env.VMSAN_MANAGER_SOCKET;
    }
  });

  it("returns 501 VM_LIFECYCLE_UNAVAILABLE for a valid ID", async () => {
    const { request, context } = stopRequest("vm-mock1");

    const response = await POST(request, context);

    assert.equal(response.status, 501);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "VM_LIFECYCLE_UNAVAILABLE");
    assert.match(body.error.message, /not available over the vmsan manager/i);
  });

  it("rejects an invalid VM ID with 400 INVALID_REQUEST, ahead of the 501", async () => {
    const { request, context } = stopRequest("bad;id");

    const response = await POST(request, context);

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("Invalid VM ID"));
  });

  for (const id of ["", "a".repeat(65), "vm 123", "$(whoami)", "vm-123 | whoami"]) {
    it(`rejects ${JSON.stringify(id)} as an invalid VM ID`, async () => {
      const { request, context } = stopRequest(id);

      const response = await POST(request, context);

      assert.equal(response.status, 400);
      const body = (await response.json()) as ErrorBody;
      assert.equal(body.error.code, "INVALID_REQUEST");
    });
  }

  it("invokes no vmsan command and contacts no manager", async () => {
    process.env.VMSAN_BIN_PATH = "/nonexistent/binary";
    process.env.VMSAN_MANAGER_SOCKET = "/nonexistent/vmsan-manager.sock";

    const { request, context } = stopRequest("vm-mock1");
    const response = await POST(request, context);

    assert.equal(response.status, 501);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "VM_LIFECYCLE_UNAVAILABLE");
  });
});
