import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server, type Socket } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { DELETE } from "../[id]/route";
import { VMMetadataStore } from "@/lib/vm-metadata";

/**
 * Delete is a privileged operation and goes through the manager socket.
 *
 * The stronger property here than "returns 200" is that a rejected or failed
 * removal leaves local metadata untouched. A route that reported failure after
 * having already removed a metadata record would leave the dashboard showing a
 * VM that no longer exists and no way to clean it up.
 */

class FakeManager {
  readonly socketPath: string;
  private server: Server | null = null;
  private dir: string;
  readonly received: string[] = [];

  constructor(private readonly respond: (request: Record<string, unknown>) => string) {
    this.dir = mkdtempSync(path.join(os.tmpdir(), "vmsan-remove-"));
    this.socketPath = path.join(this.dir, "vmsan-manager.sock");
  }

  async start(): Promise<void> {
    this.server = createServer((socket: Socket) => {
      let buffer = "";
      socket.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        const newline = buffer.indexOf("\n");
        if (newline === -1) {
          return;
        }
        const line = buffer.slice(0, newline);
        this.received.push(line);
        buffer = buffer.slice(newline + 1);
        let response: string;
        try {
          response = this.respond(JSON.parse(line) as Record<string, unknown>);
        } catch {
          response = "";
        }
        if (response.length > 0) {
          socket.write(`${response}\n`);
        } else {
          socket.end();
        }
      });
      socket.on("error", () => undefined);
    });
    await new Promise<void>((resolve) => {
      this.server?.listen(this.socketPath, resolve);
    });
  }

  async stop(): Promise<void> {
    const server = this.server;
    this.server = null;
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
    rmSync(this.dir, { recursive: true, force: true });
  }
}

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
  let manager: FakeManager | null = null;

  afterEach(async () => {
    await manager?.stop();
    manager = null;
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

  async function serve(
    respond: (request: Record<string, unknown>) => string
  ): Promise<FakeManager> {
    manager = new FakeManager(respond);
    await manager.start();
    process.env.VMSAN_MANAGER_SOCKET = manager.socketPath;
    return manager;
  }

  it("returns 200 with removed confirmation", async () => {
    const fake = await serve((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: { removed: true, vmId: "vm-mock1" },
      })
    );

    const { request, context } = deleteRequest("vm-mock1");
    const response = await DELETE(request, context);

    assert.equal(response.status, 200);
    const body = (await response.json()) as { removed: boolean; id: string };
    assert.equal(body.removed, true);
    assert.equal(body.id, "vm-mock1");

    const frame = JSON.parse(fake.received[0] ?? "{}") as {
      method: string;
      params: { vmId: string };
    };
    assert.equal(frame.method, "vm.remove");
    assert.equal(frame.params.vmId, "vm-mock1");
  });

  it("rejects an invalid VM ID with 400 INVALID_REQUEST, without contacting the manager", async () => {
    process.env.VMSAN_MANAGER_SOCKET = path.join(os.tmpdir(), "vmsan-manager-absent.sock");

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

  it("returns 404 VM_NOT_FOUND when the manager cannot find the VM", async () => {
    await serve((request) =>
      JSON.stringify({
        id: request.id,
        ok: false,
        error: { code: "VM_NOT_FOUND", message: "VM not found: vm-missing" },
      })
    );

    const { request, context } = deleteRequest("vm-missing");
    const response = await DELETE(request, context);

    assert.equal(response.status, 404);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "VM_NOT_FOUND");
  });

  it("returns 409 INVALID_VM_STATE when the VM is still running", async () => {
    await serve((request) =>
      JSON.stringify({
        id: request.id,
        ok: false,
        error: { code: "VM_INVALID_STATE", message: "cannot remove a running VM" },
      })
    );

    const { request, context } = deleteRequest("vm-mock1");
    const response = await DELETE(request, context);

    assert.equal(response.status, 409);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_VM_STATE");
  });

  it("creates, modifies, and deletes no metadata record on a rejected removal", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vmsan-remove-test-"));
    const storeFile = path.join(tempDir, "vms.json");
    process.env.VMSAN_METADATA_PATH = storeFile;
    const store = new VMMetadataStore({ filePath: storeFile });
    await store.set("vm-mock1", "keep-me");
    const before = await fs.readFile(storeFile, "utf-8");

    await serve((request) =>
      JSON.stringify({
        id: request.id,
        ok: false,
        error: { code: "VM_INVALID_STATE", message: "cannot remove a running VM" },
      })
    );

    const { request, context } = deleteRequest("vm-mock1");
    const response = await DELETE(request, context);

    assert.equal(response.status, 409);
    const after = await fs.readFile(storeFile, "utf-8");
    assert.equal(after, before, "the metadata file must be byte-identical");

    const reloaded = new VMMetadataStore({ filePath: storeFile });
    assert.equal((await reloaded.get("vm-mock1"))?.name, "keep-me");
  });

  it("returns 503 MANAGER_UNAVAILABLE when no manager is listening", async () => {
    process.env.VMSAN_MANAGER_SOCKET = path.join(os.tmpdir(), "vmsan-manager-absent.sock");

    const { request, context } = deleteRequest("vm-mock1");
    const response = await DELETE(request, context);

    assert.equal(response.status, 503);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "MANAGER_UNAVAILABLE");
  });

  it("invokes no vmsan command", async () => {
    process.env.VMSAN_BIN_PATH = "/nonexistent/binary";
    await serve((request) =>
      JSON.stringify({
        id: request.id,
        ok: true,
        result: { removed: true, vmId: "vm-mock1" },
      })
    );

    const { request, context } = deleteRequest("vm-mock1");
    const response = await DELETE(request, context);

    assert.equal(response.status, 200);
  });
});
