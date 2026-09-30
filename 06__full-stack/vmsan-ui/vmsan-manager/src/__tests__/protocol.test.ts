import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MANAGER_ERROR_CODES,
  MANAGER_METHODS,
  VALID_NETWORK_POLICIES,
  VALID_RUNTIMES,
  failure,
  isManagerFailure,
  isManagerSuccess,
  sanitizeForMessage,
  success,
  validateFrame,
  validateVmCreateParams,
  validateVmIdParams,
  type HealthRequest,
  type ListRequest,
  type ManagerRequest,
  type VmCreateRequest,
  type VmStartRequest,
  type VmStopRequest,
  type VmRemoveRequest,
} from "../protocol.js";

const MAX = 64 * 1024;

describe("manager protocol - type narrowing", () => {
  it("narrows a health request to the health variant", () => {
    const frame = validateFrame('{"id":"1","method":"health"}', MAX);
    assert.equal(frame.ok, true);
    if (!frame.ok) return;

    const request: ManagerRequest = frame.request;
    assert.equal(request.method, "health");
    assert.equal(request.id, "1");

    if (request.method === "health") {
      const health: HealthRequest = request;
      assert.equal(health.id, "1");
    }
  });

  it("narrows a list request to the list variant", () => {
    const frame = validateFrame('{"id":"2","method":"list"}', MAX);
    assert.equal(frame.ok, true);
    if (!frame.ok) return;

    const request: ManagerRequest = frame.request;
    if (request.method === "list") {
      const list: ListRequest = request;
      assert.equal(list.id, "2");
    } else {
      assert.fail("expected the list variant");
    }
  });

  it("narrows a vm.create request to the vm.create variant", () => {
    const frame = validateFrame(
      '{"id":"3","method":"vm.create","params":{"runtime":"node22","vcpus":2,"memoryMib":512}}',
      MAX
    );
    assert.equal(frame.ok, true);
    if (!frame.ok) return;

    const request: ManagerRequest = frame.request;
    if (request.method === "vm.create") {
      const create: VmCreateRequest = request;
      assert.equal(create.id, "3");
      assert.deepEqual(create.params, { runtime: "node22", vcpus: 2, memoryMib: 512 });
    } else {
      assert.fail("expected the vm.create variant");
    }
  });

  it("narrows vm.start, vm.stop, vm.remove requests to their variants", () => {
    for (const method of ["vm.start", "vm.stop", "vm.remove"] as const) {
      const frame = validateFrame(
        JSON.stringify({ id: "4", method, params: { vmId: "vm-123" } }),
        MAX
      );
      assert.equal(frame.ok, true);
      if (!frame.ok) return;

      const request: ManagerRequest = frame.request;
      assert.equal(request.method, method);
      assert.equal(request.id, "4");
      assert.deepEqual((request as VmStartRequest | VmStopRequest | VmRemoveRequest).params, {
        vmId: "vm-123",
      });
    }
  });

  it("exposes all six lifecycle methods", () => {
    assert.deepEqual([...MANAGER_METHODS], [
      "health",
      "list",
      "vm.create",
      "vm.start",
      "vm.stop",
      "vm.remove",
    ]);
  });

  it("builds the documented success and failure shapes", () => {
    assert.deepEqual(success("r1", { status: "ok" }), {
      id: "r1",
      ok: true,
      result: { status: "ok" },
    });
    assert.deepEqual(failure("r1", "INVALID_JSON", "bad"), {
      id: "r1",
      ok: false,
      error: { code: "INVALID_JSON", message: "bad" },
    });
  });

  it("discriminates success from failure", () => {
    const ok = success("r", { status: "ok" });
    const bad = failure("r", "INTERNAL_ERROR", "x");
    assert.equal(isManagerSuccess(ok), true);
    assert.equal(isManagerSuccess(bad), false);
    assert.equal(isManagerFailure(bad), true);
    assert.equal(isManagerFailure(ok), false);
  });
});

describe("manager protocol - parameter validators", () => {
  describe("validateVmCreateParams", () => {
    it("accepts undefined or null params as empty object", () => {
      assert.deepEqual(validateVmCreateParams(undefined), { ok: true, value: {} });
      assert.deepEqual(validateVmCreateParams(null), { ok: true, value: {} });
    });

    it("rejects non-object or array params", () => {
      for (const val of ["string", 123, true, []]) {
        const res = validateVmCreateParams(val);
        assert.equal(res.ok, false);
      }
    });

    it("validates vcpus bounds [1, 4]", () => {
      assert.equal(validateVmCreateParams({ vcpus: 1 }).ok, true);
      assert.equal(validateVmCreateParams({ vcpus: 4 }).ok, true);
      assert.equal(validateVmCreateParams({ vcpus: 0 }).ok, false);
      assert.equal(validateVmCreateParams({ vcpus: 5 }).ok, false);
      assert.equal(validateVmCreateParams({ vcpus: 1.5 }).ok, false);
      assert.equal(validateVmCreateParams({ vcpus: "2" }).ok, false);
      assert.equal(validateVmCreateParams({ vcpus: -1 }).ok, false);
      assert.equal(validateVmCreateParams({ vcpus: NaN }).ok, false);
      assert.equal(validateVmCreateParams({ vcpus: Infinity }).ok, false);
    });

    it("validates memoryMib bounds [64, 4096]", () => {
      assert.equal(validateVmCreateParams({ memoryMib: 64 }).ok, true);
      assert.equal(validateVmCreateParams({ memoryMib: 4096 }).ok, true);
      assert.equal(validateVmCreateParams({ memoryMib: 63 }).ok, false);
      assert.equal(validateVmCreateParams({ memoryMib: 4097 }).ok, false);
      assert.equal(validateVmCreateParams({ memoryMib: 128.5 }).ok, false);
      assert.equal(validateVmCreateParams({ memoryMib: "512" }).ok, false);
      assert.equal(validateVmCreateParams({ memoryMib: -512 }).ok, false);
    });

    it("validates diskSizeGb bounds [1, 20]", () => {
      assert.equal(validateVmCreateParams({ diskSizeGb: 1 }).ok, true);
      assert.equal(validateVmCreateParams({ diskSizeGb: 20 }).ok, true);
      assert.equal(validateVmCreateParams({ diskSizeGb: 0 }).ok, false);
      assert.equal(validateVmCreateParams({ diskSizeGb: 21 }).ok, false);
      assert.equal(validateVmCreateParams({ diskSizeGb: 2.5 }).ok, false);
      assert.equal(validateVmCreateParams({ diskSizeGb: "2" }).ok, false);
    });

    it("validates runtime against allow-list", () => {
      for (const rt of VALID_RUNTIMES) {
        const res = validateVmCreateParams({ runtime: rt });
        assert.equal(res.ok, true);
        if (res.ok) assert.equal(res.value.runtime, rt);
      }
      assert.equal(validateVmCreateParams({ runtime: "ruby" }).ok, false);
      assert.equal(validateVmCreateParams({ runtime: "" }).ok, false);
      assert.equal(validateVmCreateParams({ runtime: 123 }).ok, false);
    });

    it("validates networkPolicy against allow-list", () => {
      for (const np of VALID_NETWORK_POLICIES) {
        const res = validateVmCreateParams({ networkPolicy: np });
        assert.equal(res.ok, true);
        if (res.ok) assert.equal(res.value.networkPolicy, np);
      }
      assert.equal(validateVmCreateParams({ networkPolicy: "allow-some" }).ok, false);
      assert.equal(validateVmCreateParams({ networkPolicy: "" }).ok, false);
    });

    it("validates timeoutMs bounds [60000, 86400000]", () => {
      assert.equal(validateVmCreateParams({ timeoutMs: 60000 }).ok, true);
      assert.equal(validateVmCreateParams({ timeoutMs: 86400000 }).ok, true);
      assert.equal(validateVmCreateParams({ timeoutMs: 59999 }).ok, false);
      assert.equal(validateVmCreateParams({ timeoutMs: 86400001 }).ok, false);
      assert.equal(validateVmCreateParams({ timeoutMs: 60000.5 }).ok, false);
      assert.equal(validateVmCreateParams({ timeoutMs: "60000" }).ok, false);
    });

    it("ignores extra fields", () => {
      const res = validateVmCreateParams({
        vcpus: 2,
        memoryMib: 512,
        extraSecret: "secret",
        command: "rm -rf /",
      });
      assert.equal(res.ok, true);
      if (res.ok) {
        assert.deepEqual(res.value, { vcpus: 2, memoryMib: 512 });
      }
    });
  });

  describe("validateVmIdParams", () => {
    it("accepts valid vmId strings", () => {
      assert.deepEqual(validateVmIdParams({ vmId: "vm-123_abc" }), {
        ok: true,
        value: { vmId: "vm-123_abc" },
      });
    });

    it("rejects non-object, missing, or empty vmId", () => {
      assert.equal(validateVmIdParams(undefined).ok, false);
      assert.equal(validateVmIdParams(null).ok, false);
      assert.equal(validateVmIdParams({}).ok, false);
      assert.equal(validateVmIdParams({ vmId: "" }).ok, false);
      assert.equal(validateVmIdParams({ vmId: "   " }).ok, false);
      assert.equal(validateVmIdParams({ vmId: 123 }).ok, false);
    });

    it("rejects invalid characters in vmId", () => {
      assert.equal(validateVmIdParams({ vmId: "vm/123" }).ok, false);
      assert.equal(validateVmIdParams({ vmId: "vm;rm" }).ok, false);
      assert.equal(validateVmIdParams({ vmId: "vm$bad" }).ok, false);
      assert.equal(validateVmIdParams({ vmId: "vm 123" }).ok, false);
      assert.equal(validateVmIdParams({ vmId: "../escape" }).ok, false);
    });

    it("rejects vmId exceeding maximum length", () => {
      assert.equal(validateVmIdParams({ vmId: "a".repeat(129) }).ok, false);
      assert.equal(validateVmIdParams({ vmId: "a".repeat(128) }).ok, true);
    });
  });
});

describe("manager protocol - frame validation", () => {
  it("rejects malformed JSON with INVALID_JSON", () => {
    const frame = validateFrame("{not json", MAX);
    assert.equal(frame.ok, false);
    if (frame.ok) return;
    assert.equal(frame.code, "INVALID_JSON");
  });

  it("rejects a non-object payload with INVALID_REQUEST", () => {
    for (const raw of ['"a string"', "42", "null", "[1,2,3]", "true"]) {
      const frame = validateFrame(raw, MAX);
      assert.equal(frame.ok, false, `${raw} should be rejected`);
      if (frame.ok) continue;
      assert.equal(frame.code, "INVALID_REQUEST");
    }
  });

  it("rejects a missing id with INVALID_REQUEST", () => {
    const frame = validateFrame('{"method":"health"}', MAX);
    assert.equal(frame.ok, false);
    if (frame.ok) return;
    assert.equal(frame.code, "INVALID_REQUEST");
  });

  it("rejects a non-string id with INVALID_REQUEST", () => {
    for (const raw of ['{"id":1,"method":"list"}', '{"id":null,"method":"list"}']) {
      const frame = validateFrame(raw, MAX);
      assert.equal(frame.ok, false);
      if (frame.ok) continue;
      assert.equal(frame.code, "INVALID_REQUEST");
    }
  });

  it("rejects an empty id with INVALID_REQUEST", () => {
    const frame = validateFrame('{"id":"","method":"list"}', MAX);
    assert.equal(frame.ok, false);
    if (frame.ok) return;
    assert.equal(frame.code, "INVALID_REQUEST");
  });

  it("rejects an absent method with INVALID_REQUEST", () => {
    const frame = validateFrame('{"id":"1"}', MAX);
    assert.equal(frame.ok, false);
    if (frame.ok) return;
    assert.equal(frame.code, "INVALID_REQUEST");
  });

  it("rejects an unknown method with UNKNOWN_METHOD", () => {
    const frame = validateFrame('{"id":"1","method":"create"}', MAX);
    assert.equal(frame.ok, false);
    if (frame.ok) return;
    assert.equal(frame.code, "UNKNOWN_METHOD");
    assert.equal(frame.id, "1", "the id should be echoed so the client can correlate");
  });

  it("rejects invalid params for vm.create with VALIDATION_ERROR", () => {
    const frame = validateFrame(
      '{"id":"1","method":"vm.create","params":{"vcpus":10}}',
      MAX
    );
    assert.equal(frame.ok, false);
    if (frame.ok) return;
    assert.equal(frame.code, "VALIDATION_ERROR");
  });

  it("rejects invalid params for vm.start with VALIDATION_ERROR", () => {
    const frame = validateFrame(
      '{"id":"1","method":"vm.start","params":{"vmId":"bad/id"}}',
      MAX
    );
    assert.equal(frame.ok, false);
    if (frame.ok) return;
    assert.equal(frame.code, "VALIDATION_ERROR");
  });

  it("rejects an oversized frame with REQUEST_TOO_LARGE", () => {
    const padding = "x".repeat(70 * 1024);
    const frame = validateFrame(`{"id":"1","method":"list","pad":"${padding}"}`, MAX);
    assert.equal(frame.ok, false);
    if (frame.ok) return;
    assert.equal(frame.code, "REQUEST_TOO_LARGE");
  });

  it("accepts a frame at exactly the cap and rejects one byte more", () => {
    const empty = '{"id":"1","pad":"","method":"list"}';
    const atCap = `{"id":"1","pad":"${"x".repeat(MAX - empty.length)}","method":"list"}`;
    assert.equal(Buffer.byteLength(atCap, "utf8"), MAX);
    assert.equal(validateFrame(atCap, MAX).ok, true);

    const overCap = `${atCap} `;
    const frame = validateFrame(overCap, MAX);
    assert.equal(frame.ok, false);
    if (frame.ok) return;
    assert.equal(frame.code, "REQUEST_TOO_LARGE");
  });

  it("rejects an empty frame with INVALID_FRAME", () => {
    const frame = validateFrame("   ", MAX);
    assert.equal(frame.ok, false);
    if (frame.ok) return;
    assert.equal(frame.code, "INVALID_FRAME");
  });

  it("tolerates surrounding whitespace", () => {
    const frame = validateFrame('  {"id":"1","method":"health"}  ', MAX);
    assert.equal(frame.ok, true);
  });

  it("ignores unrecognized extra fields rather than dispatching them", () => {
    const frame = validateFrame(
      '{"id":"1","method":"health","binPath":"/tmp/evil","command":"rm -rf /"}',
      MAX
    );
    assert.equal(frame.ok, true);
    if (!frame.ok) return;
    assert.deepEqual(frame.request, { id: "1", method: "health" });
  });

  it("caps control characters echoed back in an error message", () => {
    const frame = validateFrame('{"id":"1","method":"rm -rf\\n/ #"}', MAX);
    assert.equal(frame.ok, false);
    if (frame.ok) return;
    assert.equal(frame.code, "UNKNOWN_METHOD");
    assert.equal(frame.message.includes("\n"), false);
  });
});

describe("manager protocol - error codes and message sanitization", () => {
  it("declares a closed set of error codes", () => {
    assert.deepEqual([...MANAGER_ERROR_CODES].sort(), [
      "INTERNAL_ERROR",
      "INVALID_FRAME",
      "INVALID_JSON",
      "INVALID_REQUEST",
      "REQUEST_TOO_LARGE",
      "SHUTTING_DOWN",
      "UNKNOWN_METHOD",
      "VALIDATION_ERROR",
      "VM_INVALID_STATE",
      "VM_NOT_FOUND",
      "VM_OPERATION_FAILED",
    ]);
  });

  it("strips newlines and caps length in sanitized values", () => {
    assert.equal(sanitizeForMessage("a\nb"), "a b");
    assert.equal(sanitizeForMessage("z".repeat(200)).length, 67);
    assert.equal(sanitizeForMessage("z".repeat(200)).endsWith("..."), true);
  });
});
