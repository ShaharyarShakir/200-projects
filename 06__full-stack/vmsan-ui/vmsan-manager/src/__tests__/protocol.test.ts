import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MANAGER_ERROR_CODES,
  MANAGER_METHODS,
  failure,
  isManagerFailure,
  isManagerSuccess,
  sanitizeForMessage,
  success,
  validateFrame,
  type HealthRequest,
  type ListRequest,
  type ManagerRequest,
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

  it("exposes exactly the two implemented methods", () => {
    assert.deepEqual([...MANAGER_METHODS], ["health", "list"]);
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
    ]);
  });

  it("strips newlines and caps length in sanitized values", () => {
    assert.equal(sanitizeForMessage("a\nb"), "a b");
    assert.equal(sanitizeForMessage("z".repeat(200)).length, 67);
    assert.equal(sanitizeForMessage("z".repeat(200)).endsWith("..."), true);
  });
});
