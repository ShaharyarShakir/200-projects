import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import path, { join } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { POST as createVMRoute } from "../route";
import { POST as startVMRoute } from "../[id]/start/route";
import { POST as stopVMRoute } from "../[id]/stop/route";
import { DELETE as removeVMRoute } from "../[id]/route";
import { handleApiError } from "../helpers";
import {
  ManagerProtocolError,
  ManagerUnavailableError,
} from "@/lib/vmsan-manager/errors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOCK_BIN_PATH = path.resolve(
  __dirname,
  "../../../../lib/vmsan/__tests__/mock-vmsan.js"
);

describe("Security tests for VM Management API routes", () => {
  const originalBinPath = process.env.VMSAN_BIN_PATH;
  const originalSocket = process.env.VMSAN_MANAGER_SOCKET;

  beforeEach(() => {
    process.env.VMSAN_BIN_PATH = MOCK_BIN_PATH;
  });

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

  const injectionIds = [
    "vm-123;whoami",
    "vm-123 && whoami",
    "vm-123 | whoami",
    "$(whoami)",
    "`whoami`",
    "../../etc/passwd",
    "vm 123",
    "vm\nwhoami",
    "vm>file",
    "vm<file",
    "vm-123' OR '1'='1",
    "",
    "a".repeat(65),
  ];

  for (const maliciousId of injectionIds) {
    it(`should reject malicious ID in start route: ${JSON.stringify(maliciousId)}`, async () => {
      const req = new Request(`http://localhost/api/vms/${encodeURIComponent(maliciousId)}/start`, {
        method: "POST",
      });
      const context = { params: Promise.resolve({ id: maliciousId }) };

      const response = await startVMRoute(req, context);
      assert.equal(response.status, 400);

      const body = (await response.json()) as { error: { code: string; message: string } };
      assert.equal(body.error.code, "INVALID_REQUEST");
      assert.ok(body.error.message.includes("Invalid VM ID"));
    });

    it(`should reject malicious ID in stop route: ${JSON.stringify(maliciousId)}`, async () => {
      const req = new Request(`http://localhost/api/vms/${encodeURIComponent(maliciousId)}/stop`, {
        method: "POST",
      });
      const context = { params: Promise.resolve({ id: maliciousId }) };

      const response = await stopVMRoute(req, context);
      assert.equal(response.status, 400);

      const body = (await response.json()) as { error: { code: string; message: string } };
      assert.equal(body.error.code, "INVALID_REQUEST");
      assert.ok(body.error.message.includes("Invalid VM ID"));
    });

    it(`should reject malicious ID in remove route: ${JSON.stringify(maliciousId)}`, async () => {
      const req = new Request(`http://localhost/api/vms/${encodeURIComponent(maliciousId)}`, {
        method: "DELETE",
      });
      const context = { params: Promise.resolve({ id: maliciousId }) };

      const response = await removeVMRoute(req, context);
      assert.equal(response.status, 400);

      const body = (await response.json()) as { error: { code: string; message: string } };
      assert.equal(body.error.code, "INVALID_REQUEST");
      assert.ok(body.error.message.includes("Invalid VM ID"));
    });
  }

  it("should ignore injected command fields in the create VM request body", async () => {
    process.env.VMSAN_MANAGER_SOCKET = join(
      path.dirname(MOCK_BIN_PATH),
      "vmsan-manager-absent.sock"
    );

    const req = new Request("http://localhost/api/vms", {
      method: "POST",
      body: JSON.stringify({
        runtime: "node22",
        vcpus: 2,
        memoryMiB: 512,
        command: "rm -rf /",
        flags: ["--danger", "--privilege"],
        exec: "whoami",
        shell: "/bin/sh",
      }),
      headers: { "Content-Type": "application/json" },
    });

    // Extra fields are stripped before the socket is opened. Pointing the
    // socket at a path that cannot work proves they were never interpreted as
    // a command: the only remaining failure is that the manager is not there.
    const response = await createVMRoute(req);
    assert.equal(response.status, 503);

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "MANAGER_UNAVAILABLE");
    assert.equal(body.error.message.includes("rm -rf"), false);
    assert.equal(body.error.message.includes("whoami"), false);
  });
});

/**
 * The property this whole change rests on: no lifecycle route can reach a
 * privileged command.
 *
 * Asserted against the source rather than only through the handlers, because
 * the handlers' 501 responses are easy to read as "nothing happens here" while
 * a future edit could reintroduce a call underneath.
 */
describe("VM lifecycle routes reach no privileged command", () => {
  const API_DIR = fileURLToPath(new URL("..", import.meta.url));

  const LIFECYCLE_ROUTES = [
    join(API_DIR, "route.ts"),
    join(API_DIR, "[id]", "route.ts"),
    join(API_DIR, "[id]", "start", "route.ts"),
    join(API_DIR, "[id]", "stop", "route.ts"),
  ];

  it("calls no vmsan command runner in any lifecycle route", () => {
    for (const file of LIFECYCLE_ROUTES) {
      const source = readFileSync(file, "utf8");
      // The routes may import `validateVmId` from the adapter: validating input
      // needs no privilege. What must not appear is a call that would run
      // vmsan, directly or through the client.
      for (const runner of ["createVM", "startVM", "stopVM", "removeVM", "listVMs", "runVmsan"]) {
        assert.equal(
          new RegExp(`\\b${runner}\\s*\\(`).test(source),
          false,
          `${file} must not call ${runner}`
        );
      }
      for (const imported of [...source.matchAll(/import\s+\{([^}]*)\}\s+from\s+["']@\/lib\/vmsan["']/g)]) {
        for (const name of (imported[1] ?? "").split(",").map((part) => part.trim())) {
          assert.equal(
            /^(validateVmId|validateCreateOptions|type\s)/.test(name) || name.length === 0,
            true,
            `${file} may only import validators from @/lib/vmsan, found ${name}`
          );
        }
      }
    }
  });

  it("imports no child_process anywhere under the API routes", () => {
    const scan = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "__tests__") {
            scan(path);
          }
          continue;
        }
        if (!/\.tsx?$/.test(entry.name)) {
          continue;
        }
        const source = readFileSync(path, "utf8");
        assert.equal(
          /child_process/.test(source),
          false,
          `${path} must not import child_process`
        );
      }
    };

    scan(API_DIR);
  });

  it("returns the same unavailable code from every lifecycle route when the manager is down", async () => {
    process.env.VMSAN_MANAGER_SOCKET = join(API_DIR, "vmsan-manager-absent.sock");

    const cases: Array<[string, () => Promise<Response>]> = [
      [
        "create",
        () => createVMRoute(new Request("http://localhost/api/vms", { method: "POST", body: "{}" })),
      ],
      [
        "start",
        () => startVMRoute(new Request("http://localhost/api/vms/vm-1/start", { method: "POST" }), {
          params: Promise.resolve({ id: "vm-1" }),
        }),
      ],
      [
        "stop",
        () => stopVMRoute(new Request("http://localhost/api/vms/vm-1/stop", { method: "POST" }), {
          params: Promise.resolve({ id: "vm-1" }),
        }),
      ],
      [
        "remove",
        () => removeVMRoute(new Request("http://localhost/api/vms/vm-1", { method: "DELETE" }), {
          params: Promise.resolve({ id: "vm-1" }),
        }),
      ],
    ];

    for (const [name, call] of cases) {
      const response = await call();
      assert.equal(response.status, 503, `${name} must answer 503`);
      const body = (await response.json()) as { error: { code: string; message: string } };
      assert.equal(body.error.code, "MANAGER_UNAVAILABLE", `${name} error code`);
      assert.equal(
        body.error.message.includes(".sock") || body.error.message.includes("/run/"),
        false,
        `${name} message names no socket path`
      );
    }
  });
});

/**
 * What the user actually reads.
 *
 * The dashboard renders `error.message` from the API response verbatim, so the
 * API's message is the entire user-facing story for these failures. These tests
 * pin the two messages an operator will see and assert they carry no host
 * detail: a socket path tells a user nothing they can act on and describes the
 * privileged boundary to anyone who can read the page.
 */
describe("the dashboard shows a controlled message, not a raw failure", () => {
  it("shows a fixed sentence when the manager is not running", async () => {
    const response = handleApiError(
      new ManagerUnavailableError("vmsan manager socket is not reachable", {
        cause: Object.assign(new Error("connect EACCES /run/vmsan-manager.sock"), {
          code: "EACCES",
        }),
      })
    );

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "MANAGER_UNAVAILABLE");
    assert.equal(body.error.message, "vmsan manager socket is not reachable");
  });

  it("shows a fixed sentence when the manager answers off-contract", async () => {
    const response = handleApiError(
      new ManagerProtocolError("vmsan manager response did not match the protocol contract")
    );

    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, "MANAGER_PROTOCOL_ERROR");
    assert.equal(body.error.message.includes(".sock"), false);
    assert.equal(body.error.message.includes("/run/"), false);
    assert.equal(body.error.message.includes("ENOENT"), false);
  });

  it("keeps the UI client's message path limited to the API's error field", () => {
    // The client builds its Error from `data.error.message` only. If it ever
    // started appending the response body or the URL, a socket path in a
    // future error would reach the page.
    const source = readFileSync(
      fileURLToPath(new URL("../../../../lib/api/vms.ts", import.meta.url)),
      "utf8"
    );
    assert.equal(/response\.url/.test(source), false, "no URL in the error path");
    assert.equal(/JSON\.stringify\(data\)/.test(source), false, "no raw body in the error");
  });
});
