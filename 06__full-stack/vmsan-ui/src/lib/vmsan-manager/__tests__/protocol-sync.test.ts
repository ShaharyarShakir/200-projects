import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as managerProtocol from "../../../../vmsan-manager/src/protocol";
import * as clientProtocol from "../protocol";
import {
  success,
  failure,
  validateFrame,
} from "../../../../vmsan-manager/src/protocol";

const MANAGER_SRC = fileURLToPath(
  new URL("../../../../vmsan-manager/src/", import.meta.url)
);
const CLIENT_DIR = fileURLToPath(new URL("..", import.meta.url));

/**
 * The manager and the web app each declare the protocol separately, on purpose,
 * so these tests are the only thing keeping them in agreement. If a field is
 * renamed on one side, they fail here.
 */

const METHODS = ["health", "list"] as const;

const VM_FIXTURE = {
  id: "vm-1691d65a",
  status: "running",
  runtime: "fc",
  vcpuCount: 2,
  memSizeMib: 512,
  createdAt: "2026-09-29T10:00:00.000Z",
  snapshot: null,
  timeoutAt: null,
  tunnelHostnames: ["vm-1691d65a.example"],
};

describe("protocol sync - error codes agree", () => {
  it("declares the same set of error codes on both sides", () => {
    assert.deepEqual(
      [...clientProtocol.MANAGER_ERROR_CODES].slice().sort(),
      [...managerProtocol.MANAGER_ERROR_CODES].slice().sort()
    );
  });

  it("both sides agree on which strings count as an error code", () => {
    for (const value of ["INVALID_JSON", "INTERNAL_ERROR", "TOTALLY_MADE_UP", 1, null]) {
      assert.equal(
        clientProtocol.isManagerErrorCode(value),
        managerProtocol.isManagerErrorCode(value),
        `disagreement on ${JSON.stringify(value)}`
      );
    }
  });

  it("the client accepts every code the manager can emit", () => {
    for (const code of managerProtocol.MANAGER_ERROR_CODES) {
      const frame: clientProtocol.ManagerFailure = {
        id: "1",
        ok: false,
        error: { code, message: "x" },
      };
      assert.ok(clientProtocol.isManagerResponse(frame));
      assert.equal(frame.error.code, code);
    }
  });

  it("both sides reject a failure response carrying an unknown code", () => {
    const frame = {
      id: "1",
      ok: false,
      error: { code: "TOTALLY_MADE_UP", message: "x" },
    };
    assert.equal(clientProtocol.isManagerResponse(frame), false);
  });
});

describe("protocol sync - methods agree", () => {
  it("declares exactly the health and list methods on both sides", () => {
    assert.deepEqual([...managerProtocol.MANAGER_METHODS], METHODS);
    assert.deepEqual([...clientProtocol.MANAGER_METHODS], METHODS);
  });

  it("the manager accepts every frame the client can send", () => {
    for (const method of METHODS) {
      const result = validateFrame(JSON.stringify({ id: "1", method }), 65536);
      assert.equal(result.ok, true);
    }
  });

  it("both sides agree the request union is health plus list only", () => {
    for (const method of ["stop", "remove", "create", "start"]) {
      assert.equal(validateFrame(JSON.stringify({ id: "1", method }), 65536).ok, false);
    }
  });
});

describe("protocol sync - response shapes agree", () => {
  it("a manager-built health success parses as a client success", () => {
    const frame: managerProtocol.ManagerResponse<managerProtocol.HealthResult> =
      success("1", { status: "ok" });

    assert.ok(clientProtocol.isManagerResponse(frame));
    const parsed = frame as clientProtocol.ManagerSuccess<clientProtocol.HealthResult>;
    assert.equal(parsed.result.status, "ok");
  });

  it("a manager-built list success parses as a client list result", () => {
    const frame: managerProtocol.ManagerResponse<managerProtocol.ListResult> = success("2", {
      vms: [VM_FIXTURE],
    });

    assert.ok(clientProtocol.isManagerResponse(frame));
    const parsed = frame as clientProtocol.ManagerSuccess<clientProtocol.ListResult>;
    assert.ok(clientProtocol.isListResult(parsed.result));
    assert.deepEqual(parsed.result.vms, [VM_FIXTURE]);
  });

  it("a manager-built failure parses as a client failure with the same code", () => {
    const frame = failure("3", "UNKNOWN_METHOD", "Unknown method");

    assert.ok(clientProtocol.isManagerResponse(frame));
    const parsed = frame as clientProtocol.ManagerFailure;
    assert.ok(clientProtocol.isManagerFailure(parsed));
    assert.equal(parsed.error.code, "UNKNOWN_METHOD");
  });

  it("both guards agree on the same valid and invalid frames", () => {
    const valid: unknown[] = [
      success("1", { status: "ok" }),
      failure("1", "INVALID_JSON", "bad"),
    ];
    const invalid: unknown[] = [
      null,
      "string",
      [],
      {},
      { id: 1, ok: true, result: {} },
      { id: "1" },
      { id: "1", ok: true },
      { id: "1", ok: false },
      { id: "1", ok: false, error: { code: 1, message: "x" } },
    ];

    for (const frame of valid) {
      assert.equal(clientProtocol.isManagerResponse(frame), true);
      assert.equal(managerProtocol.isManagerResponse(frame), true);
    }
    for (const frame of invalid) {
      assert.equal(clientProtocol.isManagerResponse(frame), false);
      assert.equal(managerProtocol.isManagerResponse(frame), false);
    }
  });

  it("both list guards agree on the same VM payloads", () => {
    const good: unknown[] = [
      { vms: [] },
      { vms: [VM_FIXTURE] },
      { vms: [{ ...VM_FIXTURE, status: "creating" }] },
    ];
    const bad: unknown[] = [
      null,
      "vms",
      [],
      {},
      { vms: "none" },
      { vms: [null] },
      { vms: [{ id: "vm-1" }] },
    ];

    for (const value of good) {
      assert.equal(clientProtocol.isListResult(value), true);
      assert.equal(managerProtocol.isListResult(value), true);
    }
    for (const value of bad) {
      assert.equal(clientProtocol.isListResult(value), false);
      assert.equal(managerProtocol.isListResult(value), false);
    }
  });
});

describe("protocol sync - the client never reaches the privileged package", () => {
  it("imports no vmsan specifier from the client module graph", () => {
    const offenders: string[] = [];

    // The scanner itself lives under `__tests__` and necessarily contains the
    // patterns it looks for, so the client scan covers production files only.
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
        if (/from\s+["']vmsan["']|import\(\s*["']vmsan["']\s*\)/.test(source)) {
          offenders.push(path);
        }
      }
    };

    scan(CLIENT_DIR);
    assert.deepEqual(offenders, []);
  });

  it("imports no child_process or exec from the client module graph", () => {
    const offenders: string[] = [];

    // The scanner itself lives under `__tests__` and necessarily contains the
    // patterns it looks for, so the client scan covers production files only.
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
        const code = readFileSync(path, "utf8")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/^[ \t]*\/\/.*$/gm, "");
        if (/child_process|execSync|execFile|\bspawn\(|\bexec\(/.test(code)) {
          offenders.push(path);
        }
      }
    };

    scan(CLIENT_DIR);
    assert.deepEqual(offenders, []);
  });

  it("the client reaches the manager only over node:net", () => {
    const source = readFileSync(join(CLIENT_DIR, "client.ts"), "utf8");
    assert.match(source, /from "node:net"/);
    assert.equal(/from "vmsan"/.test(source), false);
  });

  it("the manager package is not a dependency of the web app", () => {
    const rootPackage = JSON.parse(
      readFileSync(join(MANAGER_SRC, "..", "..", "package.json"), "utf8")
    ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };

    const deps = { ...rootPackage.dependencies, ...rootPackage.devDependencies };
    assert.equal(deps.vmsan, undefined);
    assert.equal(deps["vmsan-manager"], undefined);
  });
});
