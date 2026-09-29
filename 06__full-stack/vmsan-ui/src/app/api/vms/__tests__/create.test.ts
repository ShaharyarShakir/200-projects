import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { POST } from "../route";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_BIN_PATH = path.resolve(
  __dirname,
  "../../../../lib/vmsan/__tests__/mock-vmsan.js"
);

describe("POST /api/vms route handler", () => {
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

  it("should create VM successfully with valid options", async () => {
    const req = new Request("http://localhost/api/vms", {
      method: "POST",
      body: JSON.stringify({
        runtime: "node22",
        vcpus: 2,
        memoryMiB: 512,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    assert.equal(response.status, 201);

    const body = (await response.json()) as {
      success: boolean;
      result: { stdout: string; exitCode: number };
    };
    assert.equal(body.success, true);
    assert.ok(body.result.stdout.includes("Created VM"));
  });

  it("should create VM successfully with default / empty options object", async () => {
    const req = new Request("http://localhost/api/vms", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    assert.equal(response.status, 201);

    const body = (await response.json()) as { success: boolean };
    assert.equal(body.success, true);
  });

  it("should reject invalid runtime with 400 INVALID_REQUEST", async () => {
    const req = new Request("http://localhost/api/vms", {
      method: "POST",
      body: JSON.stringify({ runtime: "ruby3.2" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    assert.equal(response.status, 400);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("Invalid runtime"));
  });

  it("should reject vCPUs < 1 with 400 INVALID_REQUEST", async () => {
    const req = new Request("http://localhost/api/vms", {
      method: "POST",
      body: JSON.stringify({ vcpus: 0 }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    assert.equal(response.status, 400);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("vCPUs must be an integer"));
  });

  it("should reject memoryMiB < 128 with 400 INVALID_REQUEST", async () => {
    const req = new Request("http://localhost/api/vms", {
      method: "POST",
      body: JSON.stringify({ memoryMiB: 64 }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    assert.equal(response.status, 400);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(body.error.message.includes("memoryMiB must be an integer of at least 128"));
  });

  it("should reject malformed JSON with 400 INVALID_REQUEST", async () => {
    const req = new Request("http://localhost/api/vms", {
      method: "POST",
      body: "{ not-json",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    assert.equal(response.status, 400);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.equal(body.error.message, "Malformed JSON payload in request body");
  });

  it("should reject empty request body with 400 INVALID_REQUEST", async () => {
    const req = new Request("http://localhost/api/vms", {
      method: "POST",
      body: "",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    assert.equal(response.status, 400);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
  });

  it("should ignore arbitrary extra properties and succeed", async () => {
    const req = new Request("http://localhost/api/vms", {
      method: "POST",
      body: JSON.stringify({
        runtime: "node22",
        command: "rm -rf /",
        flags: ["--danger"],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    assert.equal(response.status, 201);

    const body = (await response.json()) as { success: boolean };
    assert.equal(body.success, true);
  });

  it("should return 503 if vmsan binary is missing", async () => {
    process.env.VMSAN_BIN_PATH = "/nonexistent/binary";

    const req = new Request("http://localhost/api/vms", {
      method: "POST",
      body: JSON.stringify({ runtime: "node22" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    assert.equal(response.status, 503);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "VMSAN_UNAVAILABLE");
  });

  it("should return sanitized 503 if sudo privilege escalation fails", async () => {
    process.env.MOCK_FAIL_SUDO = "true";

    const req = new Request("http://localhost/api/vms", {
      method: "POST",
      body: JSON.stringify({ runtime: "node22" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    assert.equal(response.status, 503);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "VMSAN_UNAVAILABLE");
    assert.equal(
      body.error.message,
      "vmsan requires configured privilege escalation (passwordless sudo)"
    );
  });
});
