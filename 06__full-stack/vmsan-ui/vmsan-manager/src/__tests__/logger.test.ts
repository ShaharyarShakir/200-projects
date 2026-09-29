import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createLogger, describeError, formatFields, MAX_ERROR_DETAIL } from "../logger.js";
import type { LogSink } from "../logger.js";

function collect(): { lines: string[]; sink: LogSink } {
  const lines: string[] = [];
  return { lines, sink: (line) => lines.push(line) };
}

describe("manager logger - level filtering", () => {
  it("emits records at or above the configured level", () => {
    const { lines, sink } = collect();
    const logger = createLogger("warn", sink);

    logger.error("boom", { code: "X" });
    logger.warn("careful");

    assert.equal(lines.length, 2);
    assert.equal(lines[0], "ERROR boom code=X");
    assert.equal(lines[1], "WARN careful");
  });

  it("suppresses records below the configured level", () => {
    const { lines, sink } = collect();
    const logger = createLogger("warn", sink);

    logger.info("should not appear");
    logger.debug("should not appear either");

    assert.deepEqual(lines, []);
  });

  it("emits debug records only at debug level", () => {
    const { lines, sink } = collect();
    const logger = createLogger("debug", sink);

    logger.debug("detail", { method: "list", id: "req-1" });

    assert.deepEqual(lines, ["DEBUG detail id=req-1 method=list"]);
  });

  it("reports the configured level", () => {
    assert.equal(createLogger("info", () => {}).level, "info");
  });
});

describe("manager logger - record formatting", () => {
  it("sorts fields for stable output", () => {
    const { lines, sink } = collect();
    createLogger("info", sink).info("request", { id: "r1", method: "list" });
    assert.deepEqual(lines, ["INFO request id=r1 method=list"]);
  });

  it("keeps a record on a single line when a value contains newlines", () => {
    const { lines, sink } = collect();
    createLogger("info", sink).info("msg", { detail: "a\nb\nc" });
    assert.equal(lines.length, 1);
    assert.equal(lines[0], 'INFO msg detail="a b c"');
  });

  it("renders null and undefined as a placeholder", () => {
    const { lines, sink } = collect();
    createLogger("info", sink).info("msg", { a: null, b: undefined });
    assert.deepEqual(lines, ["INFO msg a=- b=-"]);
  });

  it("quotes values containing whitespace so fields stay unambiguous", () => {
    const { lines, sink } = collect();
    createLogger("info", sink).info("msg", { detail: "two words" });
    assert.deepEqual(lines, ['INFO msg detail="two words"']);
  });

  it("leaves slash-separated paths unquoted", () => {
    const { lines, sink } = collect();
    createLogger("info", sink).info("msg", { path: "/run/user/1000/x.sock" });
    assert.deepEqual(lines, ["INFO msg path=/run/user/1000/x.sock"]);
  });
});

describe("manager logger - no secret or environment leakage", () => {
  it("has no access to the environment", () => {
    const { lines, sink } = collect();
    const logger = createLogger("debug", sink);

    logger.info("manager starting");

    for (const [key, value] of Object.entries(process.env)) {
      if (value && value.length > 3) {
        assert.equal(
          lines.some((line) => line.includes(`${key}=`)),
          false,
          `log line must not contain environment variable ${key}`
        );
      }
    }
  });

  it("writes only what the caller passes", () => {
    const { lines, sink } = collect();
    const logger = createLogger("debug", sink);

    logger.info("vmsan service initialized");

    assert.deepEqual(lines, ["INFO vmsan service initialized"]);
  });
});

describe("manager logger - error description", () => {
  it("keeps the error name and adds the errno code", () => {
    const error = new Error("listen EACCES: permission denied");
    (error as NodeJS.ErrnoException).code = "EACCES";

    const fields = describeError(error);

    assert.equal(fields.reason, "Error");
    assert.equal(fields.code, "EACCES");
    assert.equal(fields.detail, "listen EACCES: permission denied");
  });

  it("omits the code when there is none", () => {
    const fields = describeError(new Error("something broke"));
    assert.equal(fields.code, undefined);
  });

  it("never includes a stack", () => {
    const line = formatFields(describeError(new Error("boom")));
    assert.equal(line.includes("at "), false);
    assert.equal(
      line.includes("logger.test.ts"),
      false,
      "the stack names this test file and must not be logged"
    );
  });

  it("redacts a long token-like run from the message", () => {
    const token = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8";
    const fields = describeError(new Error(`failed with agentToken ${token}`));

    assert.equal(formatFields(fields).includes(token), false);
    assert.match(String(fields.detail), /\[redacted\]/);
  });

  it("caps a very long message", () => {
    const fields = describeError(new Error("word ".repeat(120)));
    assert.equal(String(fields.detail).length <= MAX_ERROR_DETAIL + 3, true);
    assert.match(String(fields.detail), /\.\.\.$/);
  });

  it("handles a thrown non-Error without inventing a reason", () => {
    const fields = describeError("just a string");
    assert.equal(fields.reason, "string");
    assert.equal(fields.detail, undefined);
  });

  it("keeps the described error on a single stderr line", () => {
    const { lines, sink } = collect();
    const error = new Error("first\nsecond");
    createLogger("error", sink).error("manager failed to start", describeError(error));

    assert.equal(lines.length, 1);
    assert.equal((lines[0] ?? "").includes("\n"), false);
  });
});
