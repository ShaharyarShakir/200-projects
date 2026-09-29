import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ADAPTER_DIR = fileURLToPath(new URL("..", import.meta.url));

/**
 * The adapter runs as the web app's own unprivileged user.
 *
 * Its only remaining job is the reads that do not need privilege. Anything
 * privileged belongs to the manager, which is a separate process with its own
 * socket. So the property worth asserting is not "the adapter is careful" but
 * "the adapter cannot escalate at all" — there is no code path from an HTTP
 * request to a privileged command.
 */
function productionFiles(dir: string = ADAPTER_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : productionFiles(path);
    }
    return /\.(ts|js)$/.test(entry.name) ? [path] : [];
  });
}

/** Strip comments so a file may explain what it deliberately does not do. */
function code(file: string): string {
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "");
}

describe("vmsan adapter - no escalation path", () => {
  it("contains no sudo reference in production source", () => {
    for (const file of productionFiles()) {
      assert.equal(
        /sudo/i.test(code(file)),
        false,
        `${file} must not reference sudo; the manager holds all privilege`
      );
    }
  });

  it("reads no VMSAN_SUDO environment variable", () => {
    for (const file of productionFiles()) {
      assert.equal(
        code(file).includes("VMSAN_SUDO"),
        false,
        `${file} must not read VMSAN_SUDO`
      );
    }
  });

  it("exposes no sudo option on the command runner", () => {
    const types = readFileSync(join(ADAPTER_DIR, "types.ts"), "utf8");
    assert.equal(/sudo\??\s*:\s*boolean/.test(types), false);
  });

  it("imports child_process only to spawn the configured binary directly", () => {
    // `spawn` is legitimate: the adapter runs `vmsan` as its own user for
    // read-only commands. What must not appear is a shell, a wrapper, or any
    // other way to become a different user.
    for (const file of productionFiles()) {
      const source = code(file);
      for (const forbidden of [
        "execSync",
        "execFile",
        "exec(",
        "shell: true",
        "doas",
        "pkexec",
        "setuid",
      ]) {
        assert.equal(
          source.includes(forbidden),
          false,
          `${file} must not use ${forbidden}`
        );
      }
      // The signature of the old escalation: wrapping args as ["-n", bin, ...].
      assert.equal(
        /\[\s*"-n"\s*,/.test(source),
        false,
        `${file} must not build a non-interactive privilege-escalation argument list`
      );
    }
  });

  it("spawns the configured binary with the arguments it was given", () => {
    const client = code(join(ADAPTER_DIR, "client.ts"));
    assert.match(client, /spawn\(/);
    // A single spawn of `binPath` with `finalArgs`: no reassignment of either
    // to a privileged wrapper.
    assert.equal(/executable\s*=\s*["']/.test(client), false, "the executable must not be reassigned to a literal");
  });
});
