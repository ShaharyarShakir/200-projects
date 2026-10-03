import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server, type Socket } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GET as listFiles, POST as uploadFile, DELETE as deleteFile } from "../route";
import { GET as readFile } from "../read/route";
import { POST as mkdirDirectory } from "../mkdir/route";
import { GET as downloadFile } from "../download/route";

class FakeManager {
  readonly socketPath: string;
  private server: Server | null = null;
  private dir: string;

  constructor(private readonly respond: (request: Record<string, unknown>) => string) {
    this.dir = mkdtempSync(join(tmpdir(), "vmsan-route-files-"));
    this.socketPath = join(this.dir, "vmsan-manager.sock");
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

describe("REST API Endpoints - MicroVM File Operations", () => {
  const originalSocket = process.env.VMSAN_MANAGER_SOCKET;
  let manager: FakeManager | null = null;

  afterEach(async () => {
    await manager?.stop();
    manager = null;
    if (originalSocket !== undefined) {
      process.env.VMSAN_MANAGER_SOCKET = originalSocket;
    } else {
      delete process.env.VMSAN_MANAGER_SOCKET;
    }
  });

  async function serve(
    respond: (request: Record<string, unknown>) => string
  ): Promise<void> {
    manager = new FakeManager(respond);
    await manager.start();
    process.env.VMSAN_MANAGER_SOCKET = manager.socketPath;
  }

  describe("GET /api/vms/[id]/files (directory listing)", () => {
    it("returns 200 with directory listing", async () => {
      await serve((req) => {
        assert.equal(req.method, "vm.fs.list");
        const params = req.params as Record<string, unknown>;
        assert.equal(params.vmId, "vm-123");
        assert.equal(params.path, "/home/ubuntu");
        return JSON.stringify({
          id: req.id,
          ok: true,
          result: {
            path: "/home/ubuntu",
            entries: [
              { name: "projects", path: "/home/ubuntu/projects", type: "directory" },
              { name: "file.txt", path: "/home/ubuntu/file.txt", type: "file", size: 12 },
            ],
          },
        });
      });

      const request = new Request("http://localhost/api/vms/vm-123/files?path=/home/ubuntu");
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await listFiles(request, context);

      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.path, "/home/ubuntu");
      assert.equal(data.entries.length, 2);
    });

    it("returns 400 on invalid VM ID", async () => {
      const request = new Request("http://localhost/api/vms/bad!id/files?path=/");
      const context = { params: Promise.resolve({ id: "bad!id" }) };
      const response = await listFiles(request, context);

      assert.equal(response.status, 400);
      const data = await response.json();
      assert.equal(data.error.code, "INVALID_REQUEST");
    });

    it("returns 404 when directory does not exist", async () => {
      await serve((req) => {
        return JSON.stringify({
          id: req.id,
          ok: false,
          error: { code: "FILE_NOT_FOUND", message: "Directory not found" },
        });
      });

      const request = new Request("http://localhost/api/vms/vm-123/files?path=/missing");
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await listFiles(request, context);

      assert.equal(response.status, 404);
      const data = await response.json();
      assert.equal(data.error.code, "FILE_NOT_FOUND");
    });

    it("returns 409 when VM is not running", async () => {
      await serve((req) => {
        return JSON.stringify({
          id: req.id,
          ok: false,
          error: { code: "VM_INVALID_STATE", message: "MicroVM is stopped" },
        });
      });

      const request = new Request("http://localhost/api/vms/vm-123/files?path=/");
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await listFiles(request, context);

      assert.equal(response.status, 409);
      const data = await response.json();
      assert.equal(data.error.code, "INVALID_VM_STATE");
    });
  });

  describe("GET /api/vms/[id]/files/read (text file preview)", () => {
    it("returns 200 with text file contents", async () => {
      await serve((req) => {
        assert.equal(req.method, "vm.fs.read");
        const params = req.params as Record<string, unknown>;
        assert.equal(params.vmId, "vm-123");
        assert.equal(params.path, "/etc/hosts");
        return JSON.stringify({
          id: req.id,
          ok: true,
          result: {
            path: "/etc/hosts",
            content: "127.0.0.1 localhost",
            size: 19,
          },
        });
      });

      const request = new Request("http://localhost/api/vms/vm-123/files/read?path=/etc/hosts");
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await readFile(request, context);

      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.content, "127.0.0.1 localhost");
      assert.equal(data.size, 19);
    });

    it("returns 400 when path query param is missing", async () => {
      const request = new Request("http://localhost/api/vms/vm-123/files/read");
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await readFile(request, context);

      assert.equal(response.status, 400);
      const data = await response.json();
      assert.equal(data.error.code, "INVALID_REQUEST");
    });

    it("returns 413 when file exceeds 1 MiB preview limit", async () => {
      await serve((req) => {
        return JSON.stringify({
          id: req.id,
          ok: false,
          error: { code: "FILE_TOO_LARGE", message: "File exceeds 1 MiB limit" },
        });
      });

      const request = new Request("http://localhost/api/vms/vm-123/files/read?path=/large.bin");
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await readFile(request, context);

      assert.equal(response.status, 413);
      const data = await response.json();
      assert.equal(data.error.code, "FILE_TOO_LARGE");
    });
  });

  describe("POST /api/vms/[id]/files (file upload)", () => {
    it("returns 201 with uploaded file path and size", async () => {
      await serve((req) => {
        assert.equal(req.method, "vm.fs.write");
        const params = req.params as Record<string, unknown>;
        assert.equal(params.vmId, "vm-123");
        assert.equal(params.destDir, "/home/ubuntu");
        assert.equal(params.fileName, "app.py");
        return JSON.stringify({
          id: req.id,
          ok: true,
          result: {
            path: "/home/ubuntu/app.py",
            size: 14,
          },
        });
      });

      const body = {
        destDir: "/home/ubuntu",
        fileName: "app.py",
        contentBase64: Buffer.from("print('hello')").toString("base64"),
      };

      const request = new Request("http://localhost/api/vms/vm-123/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await uploadFile(request, context);

      assert.equal(response.status, 201);
      const data = await response.json();
      assert.equal(data.path, "/home/ubuntu/app.py");
      assert.equal(data.size, 14);
    });

    it("returns 400 when filename contains traversal", async () => {
      const body = {
        destDir: "/home/ubuntu",
        fileName: "../evil.sh",
        contentBase64: Buffer.from("echo evil").toString("base64"),
      };

      const request = new Request("http://localhost/api/vms/vm-123/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await uploadFile(request, context);

      assert.equal(response.status, 400);
      const data = await response.json();
      assert.equal(data.error.code, "INVALID_REQUEST");
    });
  });

  describe("POST /api/vms/[id]/files/mkdir (create directory)", () => {
    it("returns 201 with created directory path", async () => {
      await serve((req) => {
        assert.equal(req.method, "vm.fs.mkdir");
        const params = req.params as Record<string, unknown>;
        assert.equal(params.vmId, "vm-123");
        assert.equal(params.path, "/home/ubuntu/newdir");
        return JSON.stringify({
          id: req.id,
          ok: true,
          result: {
            path: "/home/ubuntu/newdir",
          },
        });
      });

      const request = new Request("http://localhost/api/vms/vm-123/files/mkdir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "/home/ubuntu/newdir" }),
      });
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await mkdirDirectory(request, context);

      assert.equal(response.status, 201);
      const data = await response.json();
      assert.equal(data.path, "/home/ubuntu/newdir");
    });

    it("supports parentPath and name fields", async () => {
      await serve((req) => {
        assert.equal(req.method, "vm.fs.mkdir");
        const params = req.params as Record<string, unknown>;
        assert.equal(params.path, "/home/ubuntu/projects");
        return JSON.stringify({
          id: req.id,
          ok: true,
          result: {
            path: "/home/ubuntu/projects",
          },
        });
      });

      const request = new Request("http://localhost/api/vms/vm-123/files/mkdir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentPath: "/home/ubuntu", name: "projects" }),
      });
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await mkdirDirectory(request, context);

      assert.equal(response.status, 201);
      const data = await response.json();
      assert.equal(data.path, "/home/ubuntu/projects");
    });
  });

  describe("DELETE /api/vms/[id]/files (file deletion)", () => {
    it("returns 200 with deleted confirmation", async () => {
      await serve((req) => {
        assert.equal(req.method, "vm.fs.delete");
        const params = req.params as Record<string, unknown>;
        assert.equal(params.vmId, "vm-123");
        assert.equal(params.path, "/tmp/temp.txt");
        return JSON.stringify({
          id: req.id,
          ok: true,
          result: {
            deleted: true,
            path: "/tmp/temp.txt",
          },
        });
      });

      const request = new Request("http://localhost/api/vms/vm-123/files?path=/tmp/temp.txt", {
        method: "DELETE",
      });
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await deleteFile(request, context);

      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.deleted, true);
      assert.equal(data.path, "/tmp/temp.txt");
    });

    it("returns 400 when path query parameter is missing", async () => {
      const request = new Request("http://localhost/api/vms/vm-123/files", {
        method: "DELETE",
      });
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await deleteFile(request, context);

      assert.equal(response.status, 400);
      const data = await response.json();
      assert.equal(data.error.code, "INVALID_REQUEST");
    });
  });

  describe("GET /api/vms/[id]/files/download (binary download)", () => {
    it("returns 200 streaming binary payload with attachment header", async () => {
      const fileBytes = Buffer.from("binary data 12345");
      await serve((req) => {
        assert.equal(req.method, "vm.fs.download");
        const params = req.params as Record<string, unknown>;
        assert.equal(params.vmId, "vm-123");
        assert.equal(params.path, "/bin/app");
        return JSON.stringify({
          id: req.id,
          ok: true,
          result: {
            path: "/bin/app",
            fileName: "app",
            contentBase64: fileBytes.toString("base64"),
            size: fileBytes.length,
          },
        });
      });

      const request = new Request("http://localhost/api/vms/vm-123/files/download?path=/bin/app");
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await downloadFile(request, context);

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Content-Disposition"), 'attachment; filename="app"');
      assert.equal(response.headers.get("Content-Type"), "application/octet-stream");
      const arrayBuffer = await response.arrayBuffer();
      assert.deepEqual(Buffer.from(arrayBuffer), fileBytes);
    });

    it("returns 413 when download exceeds 100 MiB limit", async () => {
      await serve((req) => {
        return JSON.stringify({
          id: req.id,
          ok: false,
          error: { code: "FILE_TOO_LARGE", message: "File exceeds 100 MiB limit" },
        });
      });

      const request = new Request("http://localhost/api/vms/vm-123/files/download?path=/large.iso");
      const context = { params: Promise.resolve({ id: "vm-123" }) };
      const response = await downloadFile(request, context);

      assert.equal(response.status, 413);
      const data = await response.json();
      assert.equal(data.error.code, "FILE_TOO_LARGE");
    });
  });
});
