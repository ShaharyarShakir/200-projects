import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getVMs, createVM, startVM, stopVM, deleteVM, ApiError } from "../vms";
import type { ClientVM, CreateVMRequest, LifecycleActionResponse } from "../types";

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


