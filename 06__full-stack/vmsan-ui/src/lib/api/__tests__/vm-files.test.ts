import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  listVmFiles,
  readVmFile,
  uploadVmFile,
  createVmDirectory,
  deleteVmFile,
  downloadVmFile,
} from "../vm-files";
import { ApiError } from "../vms";
import type {
  VmFileListResult,
  VmFileReadResult,
  VmFileWriteResult,
  VmFileMkdirResult,
  VmFileDeleteResult,
  UploadVmFileRequest,
  CreateVmDirectoryRequest,
} from "../types";

describe("client api - listVmFiles", () => {
  it("successfully fetches directory listing", async () => {
    const mockResult: VmFileListResult = {
      path: "/home/ubuntu",
      entries: [
        { name: "projects", path: "/home/ubuntu/projects", type: "directory" },
        { name: "app.py", path: "/home/ubuntu/app.py", type: "file", size: 1024 },
      ],
    };

    const mockFetch = (async (input: RequestInfo | URL) => {
      assert.equal(input, "/api/vms/vm-123/files?path=%2Fhome%2Fubuntu");
      return new Response(JSON.stringify(mockResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await listVmFiles("vm-123", "/home/ubuntu", mockFetch);
    assert.deepEqual(result, mockResult);
  });

  it("handles 404 Not Found error", async () => {
    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "FILE_NOT_FOUND",
            message: "Directory '/not/exist' not found",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await listVmFiles("vm-123", "/not/exist", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 404);
        assert.equal(err.code, "FILE_NOT_FOUND");
        assert.equal(err.message, "Directory '/not/exist' not found");
        return true;
      }
    );
  });

  it("handles network failure cleanly", async () => {
    const mockFetch = (async () => {
      throw new Error("Network error");
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await listVmFiles("vm-123", "/", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.code, "NETWORK_ERROR");
        return true;
      }
    );
  });
});

describe("client api - readVmFile", () => {
  it("successfully reads file contents", async () => {
    const mockResult: VmFileReadResult = {
      path: "/etc/hosts",
      content: "127.0.0.1 localhost\n",
      size: 20,
    };

    const mockFetch = (async (input: RequestInfo | URL) => {
      assert.equal(input, "/api/vms/vm-123/files/read?path=%2Fetc%2Fhosts");
      return new Response(JSON.stringify(mockResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await readVmFile("vm-123", "/etc/hosts", mockFetch);
    assert.deepEqual(result, mockResult);
  });

  it("handles 413 File Too Large error", async () => {
    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "FILE_TOO_LARGE",
            message: "File exceeds 1 MiB preview limit",
          },
        }),
        {
          status: 413,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await readVmFile("vm-123", "/large.bin", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 413);
        assert.equal(err.code, "FILE_TOO_LARGE");
        return true;
      }
    );
  });
});

describe("client api - uploadVmFile", () => {
  it("successfully uploads a file", async () => {
    const req: UploadVmFileRequest = {
      destDir: "/tmp",
      fileName: "test.txt",
      contentBase64: Buffer.from("hello").toString("base64"),
    };

    const mockResult: VmFileWriteResult = {
      path: "/tmp/test.txt",
      size: 5,
    };

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(input, "/api/vms/vm-123/files");
      assert.equal(init?.method, "POST");
      assert.equal(init?.body, JSON.stringify(req));
      return new Response(JSON.stringify(mockResult), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await uploadVmFile("vm-123", req, mockFetch);
    assert.deepEqual(result, mockResult);
  });
});

describe("client api - createVmDirectory", () => {
  it("successfully creates a directory", async () => {
    const req: CreateVmDirectoryRequest = {
      path: "/home/ubuntu/newdir",
    };

    const mockResult: VmFileMkdirResult = {
      path: "/home/ubuntu/newdir",
    };

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(input, "/api/vms/vm-123/files/mkdir");
      assert.equal(init?.method, "POST");
      assert.equal(init?.body, JSON.stringify(req));
      return new Response(JSON.stringify(mockResult), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await createVmDirectory("vm-123", req, mockFetch);
    assert.deepEqual(result, mockResult);
  });
});

describe("client api - deleteVmFile", () => {
  it("successfully deletes a file", async () => {
    const mockResult: VmFileDeleteResult = {
      deleted: true,
      path: "/tmp/temp.txt",
    };

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(input, "/api/vms/vm-123/files?path=%2Ftmp%2Ftemp.txt");
      assert.equal(init?.method, "DELETE");
      return new Response(JSON.stringify(mockResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await deleteVmFile("vm-123", "/tmp/temp.txt", mockFetch);
    assert.deepEqual(result, mockResult);
  });
});

describe("client api - downloadVmFile", () => {
  it("successfully downloads a binary blob", async () => {
    const fileBytes = new Uint8Array([1, 2, 3, 4]);

    const mockFetch = (async (input: RequestInfo | URL) => {
      assert.equal(input, "/api/vms/vm-123/files/download?path=%2Fbin%2Fapp");
      return new Response(fileBytes, {
        status: 200,
        headers: {
          "Content-Disposition": 'attachment; filename="app"',
          "Content-Type": "application/octet-stream",
        },
      });
    }) as typeof fetch;

    const blob = await downloadVmFile("vm-123", "/bin/app", mockFetch);
    const arrayBuffer = await blob.arrayBuffer();
    assert.deepEqual(new Uint8Array(arrayBuffer), fileBytes);
  });

  it("throws ApiError on download error response", async () => {
    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "FILE_TOO_LARGE",
            message: "File exceeds 100 MiB download limit",
          },
        }),
        {
          status: 413,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await downloadVmFile("vm-123", "/huge.iso", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 413);
        assert.equal(err.code, "FILE_TOO_LARGE");
        return true;
      }
    );
  });
});
