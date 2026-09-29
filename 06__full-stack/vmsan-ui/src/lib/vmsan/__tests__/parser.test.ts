import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseVmList } from "../parser";
import { VmsanError } from "../errors";

describe("parseVmList", () => {
  it("should parse standard JSON array of VMs", () => {
    const jsonOutput = JSON.stringify([
      {
        id: "vm-6ce50edc",
        status: "running",
        memoryMiB: 512,
        vcpus: 2,
        runtime: "base",
        age: "5 minutes",
      },
      {
        id: "vm-9fa12b3c",
        status: "stopped",
        memoryMiB: 1024,
        vcpus: 4,
        runtime: "node22",
        age: "2 hours",
      },
    ]);

    const result = parseVmList(jsonOutput);
    assert.equal(result.length, 2);
    assert.deepEqual(result[0], {
      id: "vm-6ce50edc",
      status: "running",
      memoryMiB: 512,
      vcpus: 2,
      runtime: "base",
      age: "5 minutes",
    });
    assert.deepEqual(result[1], {
      id: "vm-9fa12b3c",
      status: "stopped",
      memoryMiB: 1024,
      vcpus: 4,
      runtime: "node22",
      age: "2 hours",
    });
  });

  it("should parse JSON object containing vms array", () => {
    const wrappedJson = JSON.stringify({
      vms: [
        {
          vmId: "vm-abc12345",
          state: "active",
          memory: "256MB",
          vcpu: "1",
          image: "python3.13",
          uptime: "10m",
        },
      ],
    });

    const result = parseVmList(wrappedJson);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], {
      id: "vm-abc12345",
      status: "running",
      memoryMiB: 256,
      vcpus: 1,
      runtime: "python3.13",
      age: "10m",
    });
  });

  it("should handle empty output or 'No VMs found'", () => {
    assert.deepEqual(parseVmList(""), []);
    assert.deepEqual(parseVmList("   \n  "), []);
    assert.deepEqual(parseVmList("No VMs found"), []);
    assert.deepEqual(parseVmList("[]"), []);
    assert.deepEqual(parseVmList('{"vms": []}'), []);
  });

  it("should strip ANSI color codes", () => {
    const ansiColoredJson =
      "\x1B[32m[\x1B[0m\n  {\n    \x1B[34m\"id\"\x1B[0m: \"vm-ansi123\",\n    \"status\": \"running\"\n  }\n\x1B[32m]\x1B[0m";
    const result = parseVmList(ansiColoredJson);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, "vm-ansi123");
    assert.equal(result[0].status, "running");
  });

  it("should normalize diverse status representations", () => {
    const testCases = [
      { raw: "running", expected: "running" },
      { raw: "RUNNING", expected: "running" },
      { raw: "active", expected: "running" },
      { raw: "run", expected: "running" },
      { raw: "stopped", expected: "stopped" },
      { raw: "STOPPED", expected: "stopped" },
      { raw: "inactive", expected: "stopped" },
      { raw: "stop", expected: "stopped" },
      { raw: "unknown", expected: "unknown" },
      { raw: "paused", expected: "unknown" },
      { raw: null, expected: "unknown" },
      { raw: undefined, expected: "unknown" },
    ];

    for (const { raw, expected } of testCases) {
      const json = JSON.stringify([{ id: "vm-status", status: raw }]);
      const result = parseVmList(json);
      assert.equal(result[0].status, expected);
    }
  });

  it("should parse fallback text table output", () => {
    const tableOutput = `
ID           STATUS   RUNTIME  VCPUS  MEMORY  AGE
vm-text001   running  node22   2      512     10 minutes
vm-text002   stopped  base     1      128     1 hour
`;
    const result = parseVmList(tableOutput);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, "vm-text001");
    assert.equal(result[0].status, "running");
    assert.equal(result[0].runtime, "node22");
    assert.equal(result[0].vcpus, 2);
    assert.equal(result[0].memoryMiB, 512);

    assert.equal(result[1].id, "vm-text002");
    assert.equal(result[1].status, "stopped");
    assert.equal(result[1].runtime, "base");
    assert.equal(result[1].vcpus, 1);
    assert.equal(result[1].memoryMiB, 128);
  });

  it("should throw VmsanError on malformed / unparseable output", () => {
    const malformed = "--- Error: could not connect to daemon ---\nInternal failure";
    assert.throws(
      () => parseVmList(malformed),
      (err: unknown) => {
        assert.ok(err instanceof VmsanError);
        assert.equal(err.command, "list");
        assert.ok(err.message.includes("Failed to parse"));
        return true;
      }
    );
  });
});
