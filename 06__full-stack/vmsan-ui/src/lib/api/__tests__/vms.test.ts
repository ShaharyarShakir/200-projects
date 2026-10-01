import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getVMs, getVM, createVM, startVM, stopVM, deleteVM, executeVmCommand, ApiError } from "../vms";
import type { ClientVM, CreateVMRequest, LifecycleActionResponse, ExecuteVmCommandRequest, ExecuteVmCommandResult } from "../types";

describe("client api - getVMs", () => {
  it("successfully fetches and returns VMs array", async () => {
    const mockVMs: ClientVM[] = [
      {
        id: "vm-1",
        name: "node-dev",
        vmsanId: "vm-1",
        status: "running",
        memoryMiB: 256,
        vcpus: 2,
        runtime: "base",
        age: "10m",
      },
      {
        id: "vm-2",
        name: "vm-2",
        vmsanId: "vm-2",
        status: "stopped",
        memoryMiB: null,
        vcpus: null,
        runtime: null,
        age: null,
      },
    ];

    const mockFetch = (async (input: RequestInfo | URL) => {
      assert.equal(input, "/api/vms");
      return new Response(JSON.stringify({ vms: mockVMs }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await getVMs(mockFetch);
    assert.deepEqual(result, mockVMs);
  });

  it("handles empty VM list", async () => {
    const mockFetch = (async () => {
      return new Response(JSON.stringify({ vms: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await getVMs(mockFetch);
    assert.deepEqual(result, []);
  });

  it("parses structured error response on HTTP error", async () => {
    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "VMSAN_UNAVAILABLE",
            message: "vmsan binary is not installed or accessible on host system.",
          },
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await getVMs(mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 503);
        assert.equal(err.code, "VMSAN_UNAVAILABLE");
        assert.equal(
          err.message,
          "vmsan binary is not installed or accessible on host system."
        );
        return true;
      }
    );
  });

  it("handles non-JSON error response gracefully", async () => {
    const mockFetch = (async () => {
      return new Response("Internal Server Error (Gateway)", {
        status: 502,
        headers: { "Content-Type": "text/plain" },
      });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await getVMs(mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 502);
        assert.equal(err.code, "UNKNOWN_ERROR");
        assert.equal(err.message, "Request failed with status 502");
        return true;
      }
    );
  });

  it("handles network failure cleanly", async () => {
    const mockFetch = (async () => {
      throw new Error("Failed to connect");
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await getVMs(mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.code, "NETWORK_ERROR");
        assert.equal(err.message, "Failed to connect");
        return true;
      }
    );
  });
});

describe("client api - getVM", () => {
  it("successfully fetches single VM by ID", async () => {
    const mockVM: ClientVM = {
      id: "vm-1691d65a",
      name: "vm-1691d65a",
      status: "running",
      memoryMiB: 512,
      vcpus: 2,
      diskSizeGb: 1,
      runtime: "node22",
      createdAt: "2026-09-29T10:00:00.000Z",
      age: "1d",
      network: {
        policy: "allow-all",
        address: "172.16.0.2",
        publishedPorts: [8080],
      },
    };

    const mockFetch = (async (input: RequestInfo | URL) => {
      assert.equal(input, "/api/vms/vm-1691d65a");
      return new Response(JSON.stringify({ vm: mockVM }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await getVM("vm-1691d65a", mockFetch);
    assert.deepEqual(result, mockVM);
  });

  it("encodes VM ID in URL properly", async () => {
    const mockVM: ClientVM = {
      id: "vm/test",
      status: "stopped",
      memoryMiB: 256,
      vcpus: 1,
      runtime: "base",
      age: "5m",
    };

    const mockFetch = (async (input: RequestInfo | URL) => {
      assert.equal(input, "/api/vms/vm%2Ftest");
      return new Response(JSON.stringify({ vm: mockVM }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await getVM("vm/test", mockFetch);
    assert.deepEqual(result, mockVM);
  });

  it("parses structured error response on 404 Not Found", async () => {
    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "VM_NOT_FOUND",
            message: "VM 'vm-not-found' not found",
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
        await getVM("vm-not-found", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 404);
        assert.equal(err.code, "VM_NOT_FOUND");
        assert.equal(err.message, "VM 'vm-not-found' not found");
        return true;
      }
    );
  });

  it("handles non-JSON error response gracefully", async () => {
    const mockFetch = (async () => {
      return new Response("Service Unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await getVM("vm-1", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 503);
        assert.equal(err.code, "UNKNOWN_ERROR");
        assert.equal(err.message, "Request failed with status 503");
        return true;
      }
    );
  });

  it("handles network failure cleanly", async () => {
    const mockFetch = (async () => {
      throw new Error("Network unreachable");
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await getVM("vm-1", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.code, "NETWORK_ERROR");
        assert.equal(err.message, "Network unreachable");
        return true;
      }
    );
  });

  it("throws on missing vm property in 200 response", async () => {
    const mockFetch = (async () => {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await getVM("vm-1", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.code, "INVALID_RESPONSE");
        return true;
      }
    );
  });
});

describe("client api - createVM", () => {
  it("successfully creates VM with valid options", async () => {
    const requestPayload: CreateVMRequest = {
      name: "node-dev",
      runtime: "base",
      vcpus: 2,
      memoryMiB: 256,
    };

    const mockResponseData = {
      success: true,
      result: {
        stdout: "Created VM vm-new-123",
        stderr: "",
        exitCode: 0,
      },
    };

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(input, "/api/vms");
      assert.equal(init?.method, "POST");
      assert.deepEqual(init?.headers, {
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      assert.equal(init?.body, JSON.stringify(requestPayload));

      return new Response(JSON.stringify(mockResponseData), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await createVM(requestPayload, mockFetch);
    assert.deepEqual(result, mockResponseData);
  });

  it("parses structured error response on 400 Bad Request", async () => {
    const requestPayload: CreateVMRequest = {
      name: "invalid name with space",
      runtime: "base",
      vcpus: 0,
      memoryMiB: 64,
    };

    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_REQUEST",
            message: "vcpus must be an integer >= 1",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await createVM(requestPayload, mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 400);
        assert.equal(err.code, "INVALID_REQUEST");
        assert.equal(err.message, "vcpus must be an integer >= 1");
        return true;
      }
    );
  });

  it("parses structured error response on 503 Service Unavailable", async () => {
    const requestPayload: CreateVMRequest = {
      name: "node-22-vm",
      runtime: "node22",
      vcpus: 1,
      memoryMiB: 128,
    };

    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "VMSAN_UNAVAILABLE",
            message: "vmsan binary is not installed or accessible on host system.",
          },
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await createVM(requestPayload, mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 503);
        assert.equal(err.code, "VMSAN_UNAVAILABLE");
        assert.equal(
          err.message,
          "vmsan binary is not installed or accessible on host system."
        );
        return true;
      }
    );
  });

  it("handles non-JSON error response gracefully", async () => {
    const requestPayload: CreateVMRequest = {
      name: "py-sandbox",
      runtime: "python3.13",
      vcpus: 1,
      memoryMiB: 128,
    };

    const mockFetch = (async () => {
      return new Response("Bad Gateway", {
        status: 502,
        headers: { "Content-Type": "text/plain" },
      });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await createVM(requestPayload, mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 502);
        assert.equal(err.code, "UNKNOWN_ERROR");
        assert.equal(err.message, "Request failed with status 502");
        return true;
      }
    );
  });

  it("handles network failure cleanly", async () => {
    const requestPayload: CreateVMRequest = {
      name: "base-vm",
      runtime: "base",
      vcpus: 1,
      memoryMiB: 128,
    };

    const mockFetch = (async () => {
      throw new Error("Connection timed out");
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await createVM(requestPayload, mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.code, "NETWORK_ERROR");
        assert.equal(err.message, "Connection timed out");
        return true;
      }
    );
  });
});

describe("client api - startVM", () => {
  it("successfully starts a VM", async () => {
    const mockResponse: LifecycleActionResponse = {
      success: true,
      vmId: "vm-123",
    };

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(input, "/api/vms/vm-123/start");
      assert.equal(init?.method, "POST");
      assert.deepEqual(init?.headers, { Accept: "application/json" });
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await startVM("vm-123", mockFetch);
    assert.deepEqual(result, mockResponse);
  });

  it("parses structured error response on 404 Not Found", async () => {
    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "VM_NOT_FOUND",
            message: "VM with ID vm-999 not found",
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
        await startVM("vm-999", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 404);
        assert.equal(err.code, "VM_NOT_FOUND");
        assert.equal(err.message, "VM with ID vm-999 not found");
        return true;
      }
    );
  });

  it("handles network failure cleanly", async () => {
    const mockFetch = (async () => {
      throw new Error("Network unreachable");
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await startVM("vm-123", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.code, "NETWORK_ERROR");
        assert.equal(err.message, "Network unreachable");
        return true;
      }
    );
  });
});

describe("client api - stopVM", () => {
  it("successfully stops a VM", async () => {
    const mockResponse: LifecycleActionResponse = {
      success: true,
      vmId: "vm-123",
    };

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(input, "/api/vms/vm-123/stop");
      assert.equal(init?.method, "POST");
      assert.deepEqual(init?.headers, { Accept: "application/json" });
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await stopVM("vm-123", mockFetch);
    assert.deepEqual(result, mockResponse);
  });

  it("parses structured error response on 409 Conflict", async () => {
    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "VM_CONFLICT",
            message: "VM is not running",
          },
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await stopVM("vm-123", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 409);
        assert.equal(err.code, "VM_CONFLICT");
        assert.equal(err.message, "VM is not running");
        return true;
      }
    );
  });

  it("handles network failure cleanly", async () => {
    const mockFetch = (async () => {
      throw new Error("Connection reset");
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await stopVM("vm-123", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.code, "NETWORK_ERROR");
        assert.equal(err.message, "Connection reset");
        return true;
      }
    );
  });
});

describe("client api - deleteVM", () => {
  it("successfully deletes a VM", async () => {
    const mockResponse: LifecycleActionResponse = {
      success: true,
      vmId: "vm-123",
    };

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(input, "/api/vms/vm-123");
      assert.equal(init?.method, "DELETE");
      assert.deepEqual(init?.headers, { Accept: "application/json" });
      return new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await deleteVM("vm-123", mockFetch);
    assert.deepEqual(result, mockResponse);
  });

  it("parses structured error response on 409 Conflict when deleting running VM", async () => {
    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "VM_CONFLICT",
            message: "Cannot remove running VM",
          },
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await deleteVM("vm-123", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 409);
        assert.equal(err.code, "VM_CONFLICT");
        assert.equal(err.message, "Cannot remove running VM");
        return true;
      }
    );
  });

  it("handles non-JSON error response gracefully", async () => {
    const mockFetch = (async () => {
      return new Response("Service Unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await deleteVM("vm-123", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 503);
        assert.equal(err.code, "UNKNOWN_ERROR");
        assert.equal(err.message, "Request failed with status 503");
        return true;
      }
    );
  });

  it("handles network failure cleanly", async () => {
    const mockFetch = (async () => {
      throw new Error("DNS lookup failed");
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await deleteVM("vm-123", mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.code, "NETWORK_ERROR");
        assert.equal(err.message, "DNS lookup failed");
        return true;
      }
    );
  });
});

describe("client api - executeVmCommand", () => {
  it("successfully executes a command in a running VM", async () => {
    const mockRequest: ExecuteVmCommandRequest = {
      command: "uname -a",
      timeoutMs: 15000,
      workingDirectory: "/home/ubuntu",
    };

    const mockResult: ExecuteVmCommandResult = {
      exitCode: 0,
      stdout: "Linux microvm 6.1.0\n",
      stderr: "",
      durationMs: 42,
    };

    const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(input, "/api/vms/vm-123/terminal");
      assert.equal(init?.method, "POST");
      assert.deepEqual(init?.headers, {
        "Content-Type": "application/json",
        Accept: "application/json",
      });
      assert.equal(init?.body, JSON.stringify(mockRequest));
      return new Response(JSON.stringify({ data: mockResult }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await executeVmCommand("vm-123", mockRequest, mockFetch);
    assert.deepEqual(result, mockResult);
  });

  it("encodes VM ID in URL properly", async () => {
    const mockRequest: ExecuteVmCommandRequest = {
      command: "echo test",
    };

    const mockResult: ExecuteVmCommandResult = {
      exitCode: 0,
      stdout: "test\n",
      stderr: "",
    };

    const mockFetch = (async (input: RequestInfo | URL) => {
      assert.equal(input, "/api/vms/vm%2Ftest/terminal");
      return new Response(JSON.stringify({ data: mockResult }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await executeVmCommand("vm/test", mockRequest, mockFetch);
    assert.deepEqual(result, mockResult);
  });

  it("parses structured error response on 400 Validation Error", async () => {
    const mockRequest: ExecuteVmCommandRequest = {
      command: "",
    };

    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Command cannot be empty",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await executeVmCommand("vm-123", mockRequest, mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 400);
        assert.equal(err.code, "VALIDATION_ERROR");
        assert.equal(err.message, "Command cannot be empty");
        return true;
      }
    );
  });

  it("parses structured error response on 404 Not Found", async () => {
    const mockRequest: ExecuteVmCommandRequest = {
      command: "uptime",
    };

    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "VM_NOT_FOUND",
            message: "VM 'vm-999' not found",
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
        await executeVmCommand("vm-999", mockRequest, mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 404);
        assert.equal(err.code, "VM_NOT_FOUND");
        assert.equal(err.message, "VM 'vm-999' not found");
        return true;
      }
    );
  });

  it("parses structured error response on 409 Invalid VM State", async () => {
    const mockRequest: ExecuteVmCommandRequest = {
      command: "uptime",
    };

    const mockFetch = (async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_VM_STATE",
            message: "VM is not running",
          },
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await executeVmCommand("vm-123", mockRequest, mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 409);
        assert.equal(err.code, "INVALID_VM_STATE");
        assert.equal(err.message, "VM is not running");
        return true;
      }
    );
  });

  it("handles non-JSON error response gracefully", async () => {
    const mockRequest: ExecuteVmCommandRequest = {
      command: "uptime",
    };

    const mockFetch = (async () => {
      return new Response("Service Unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await executeVmCommand("vm-123", mockRequest, mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 503);
        assert.equal(err.code, "UNKNOWN_ERROR");
        assert.equal(err.message, "Request failed with status 503");
        return true;
      }
    );
  });

  it("handles network failure cleanly", async () => {
    const mockRequest: ExecuteVmCommandRequest = {
      command: "uptime",
    };

    const mockFetch = (async () => {
      throw new Error("Failed to fetch");
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await executeVmCommand("vm-123", mockRequest, mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 0);
        assert.equal(err.code, "NETWORK_ERROR");
        assert.equal(err.message, "Failed to fetch");
        return true;
      }
    );
  });

  it("throws on missing data property in 200 response", async () => {
    const mockRequest: ExecuteVmCommandRequest = {
      command: "uptime",
    };

    const mockFetch = (async () => {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await executeVmCommand("vm-123", mockRequest, mockFetch);
      },
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.code, "INVALID_RESPONSE");
        return true;
      }
    );
  });
});


