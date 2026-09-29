import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../route";

/**
 * Create is a privileged operation with no manager RPC behind it.
 *
 * Two properties matter and are easy to get backwards. The route must not run
 * any vmsan command, because doing so would need privilege the web app does not
 * have and would reintroduce the escalation this change removed. And it must
 * still validate first, so an invalid request reports the invalid request
 * rather than a blanket 501 that hides the real problem.
 */

function createRequest(body: unknown | string): Request {
  return new Request("http://localhost/api/vms", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

type ErrorBody = { error: { code: string; message: string } };

describe("POST /api/vms route handler", () => {
  const originalBinPath = process.env.VMSAN_BIN_PATH;

  afterEach(() => {
    if (originalBinPath !== undefined) {
      process.env.VMSAN_BIN_PATH = originalBinPath;
    } else {
      delete process.env.VMSAN_BIN_PATH;
    }
  });

  it("returns 501 VM_LIFECYCLE_UNAVAILABLE for valid options", async () => {
    const response = await POST(
      createRequest({ runtime: "node22", vcpus: 2, memoryMiB: 512 })
    );

    assert.equal(response.status, 501);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "VM_LIFECYCLE_UNAVAILABLE");
    assert.match(body.error.message, /not available over the vmsan manager/i);
  });

  it("returns 501 for an empty options object, which is valid", async () => {
    const response = await POST(createRequest({}));

    assert.equal(response.status, 501);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "VM_LIFECYCLE_UNAVAILABLE");
  });

  it("rejects an invalid runtime before answering 501", async () => {
    const response = await POST(createRequest({ runtime: "ruby3.2" }));

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("Invalid runtime"));
  });

  it("rejects vCPUs below 1 before answering 501", async () => {
    const response = await POST(createRequest({ vcpus: 0 }));

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("vCPUs must be an integer"));
  });

  it("rejects memory below 128 MiB before answering 501", async () => {
    const response = await POST(createRequest({ memoryMiB: 64 }));

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("memoryMiB must be an integer of at least 128"));
  });

  it("rejects a malformed body before answering 501", async () => {
    const response = await POST(createRequest("{ not-json"));

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.equal(body.error.message, "Malformed JSON payload in request body");
  });

  it("rejects an empty body before answering 501", async () => {
    const response = await POST(createRequest(""));

    assert.equal(response.status, 400);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "INVALID_REQUEST");
  });

  it("ignores unknown extra properties rather than rejecting the request", async () => {
    const response = await POST(
      createRequest({ runtime: "node22", command: "rm -rf /", flags: ["--danger"] })
    );

    assert.equal(response.status, 501);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "VM_LIFECYCLE_UNAVAILABLE");
  });

  it("invokes no vmsan command, even when a binary is configured", async () => {
    // Pointed at a path that would fail loudly if executed. A 501 rather than
    // 503 proves the binary was never spawned.
    process.env.VMSAN_BIN_PATH = "/nonexistent/binary";

    const response = await POST(createRequest({ runtime: "node22" }));

    assert.equal(response.status, 501);
    const body = (await response.json()) as ErrorBody;
    assert.equal(body.error.code, "VM_LIFECYCLE_UNAVAILABLE");
  });

  it("names no socket path, errno, or internal detail", async () => {
    const response = await POST(createRequest({ runtime: "node22" }));
    const serialized = JSON.stringify(await response.json());

    assert.equal(serialized.includes(".sock"), false);
    assert.equal(serialized.includes("/run/"), false);
    assert.equal(serialized.includes("ENOENT"), false);
  });
});
