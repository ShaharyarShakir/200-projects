import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatAge, toVm } from "../present";
import type { ManagerVm } from "../protocol";

const NOW = Date.parse("2026-09-29T12:00:00.000Z");

function managerVm(overrides: Partial<ManagerVm> = {}): ManagerVm {
  return {
    id: "vm-1691d65a",
    status: "running",
    runtime: "base",
    vcpuCount: 2,
    memSizeMib: 512,
    createdAt: "2026-09-29T10:00:00.000Z",
    snapshot: null,
    timeoutAt: null,
    tunnelHostnames: [],
    ...overrides,
  };
}

describe("manager presentation - age", () => {
  it("renders seconds, minutes, hours, and days at their boundaries", () => {
    const created = "2026-09-29T00:00:00.000Z";
    const at = (iso: string): string | null => formatAge(created, Date.parse(iso));

    assert.equal(at("2026-09-29T00:00:00.000Z"), "0s");
    assert.equal(at("2026-09-29T00:00:59.000Z"), "59s");
    assert.equal(at("2026-09-29T00:01:00.000Z"), "1m");
    assert.equal(at("2026-09-29T00:59:59.000Z"), "59m");
    assert.equal(at("2026-09-29T01:00:00.000Z"), "1h");
    assert.equal(at("2026-09-29T23:59:59.000Z"), "23h");
    assert.equal(at("2026-10-02T00:00:00.000Z"), "3d");
  });

  it("returns null for an unparseable timestamp instead of a wrong age", () => {
    assert.equal(formatAge("not-a-date", NOW), null);
    assert.equal(formatAge("", NOW), null);
  });

  it("returns null for a timestamp in the future", () => {
    assert.equal(formatAge("2027-01-01T00:00:00.000Z", NOW), null);
  });
});

describe("manager presentation - toVm", () => {
  it("maps the manager's field names onto the dashboard's", () => {
    assert.deepEqual(toVm(managerVm(), NOW), {
      id: "vm-1691d65a",
      status: "running",
      memoryMiB: 512,
      vcpus: 2,
      runtime: "base",
      age: "2h",
    });
  });

  it("normalizes only the statuses the dashboard can render", () => {
    const statusOf = (status: string): string | undefined =>
      toVm(managerVm({ status }), NOW).status;

    assert.equal(statusOf("running"), "running");
    assert.equal(statusOf("Running"), "running");
    assert.equal(statusOf("active"), "running");
    assert.equal(statusOf("stopped"), "stopped");
    assert.equal(statusOf("inactive"), "stopped");
    // Intermediate and future states are unknown, not a guess.
    assert.equal(statusOf("creating"), "unknown");
    assert.equal(statusOf("stopping"), "unknown");
    assert.equal(statusOf("crashed"), "unknown");
    assert.equal(statusOf(""), "unknown");
  });

  it("carries no field the manager did not send", () => {
    const vm = toVm(managerVm(), NOW) as Record<string, unknown>;
    assert.deepEqual(
      Object.keys(vm).sort(),
      ["age", "id", "memoryMiB", "runtime", "status", "vcpus"]
    );
  });
});
