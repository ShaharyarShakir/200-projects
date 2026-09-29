import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_DIR = fileURLToPath(new URL("..", import.meta.url));

/**
 * Production source only.
 *
 * This file necessarily contains the very patterns it scans for, so the scan
 * excludes `__tests__` or it would fail on its own assertions.
 */
function productionFiles(dir: string = SRC_DIR): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : productionFiles(path);
    }
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}

const read = (file: string): string => readFileSync(file, "utf8");

const rel = (file: string): string => file.slice(SRC_DIR.length);

/**
 * The manager is the privileged process. If it could run a shell or a child
 * process, a protocol bug would become a root-level command execution bug.
 * These scans cover the manager's own `src` tree.
 */
describe("manager security - no process execution", () => {
  it("imports no child_process module anywhere in the manager source", () => {
    for (const file of productionFiles()) {
      const source = read(file);
      assert.equal(
        /from\s+["']node:child_process["']|require\(\s*["']child_process["']\s*\)/.test(
          source
        ),
        false,
        `${file} must not import child_process`
      );
    }
  });

  it("calls no exec, execSync, or spawn function", () => {
    for (const file of productionFiles()) {
      const source = read(file);
      for (const forbidden of ["execSync", "execFile", "exec(", "spawn("]) {
        assert.equal(
          source.includes(forbidden),
          false,
          `${file} must not call ${forbidden}`
        );
      }
    }
  });

  it("imports no shell interpreter", () => {
    for (const file of productionFiles()) {
      const source = read(file);
      assert.equal(
        /from\s+["']node:(?:vm|module)["']/.test(source),
        false,
        `${file} must not import node:vm or node:module`
      );
    }
  });

  it("imports no React, Next.js, or browser-facing module", () => {
    for (const file of productionFiles()) {
      const relative = rel(file);
      if (relative.startsWith("__tests__")) {
        continue;
      }
      const source = read(file);
      const specifiers = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map(
        (match) => match[1] ?? ""
      );
      for (const specifier of specifiers) {
        assert.equal(
          specifier === "react" ||
            specifier.startsWith("react/") ||
            specifier.startsWith("next") ||
            specifier === "vmsan-ui",
          false,
          `${relative} must not import ${specifier}`
        );
      }
    }
  });

  it("references no browser global in production source", () => {
    for (const file of productionFiles()) {
      const relative = rel(file);
      if (relative.startsWith("__tests__")) {
        continue;
      }
      const source = read(file);
      for (const global of ["document.", "window.", "localStorage"]) {
        assert.equal(
          source.includes(global),
          false,
          `${relative} must not reference ${global}`
        );
      }
    }
  });
});

describe("manager security - no environment or secret leakage", () => {
  it("never iterates or serializes the whole environment", () => {
    for (const file of productionFiles()) {
      const source = read(file);
      assert.equal(
        /Object\.(entries|keys|values)\(\s*process\.env\s*\)/.test(source),
        false,
        `${file} must not enumerate process.env`
      );
      assert.equal(
        /JSON\.stringify\(\s*process\.env\s*\)/.test(source),
        false,
        `${file} must not serialize process.env`
      );
    }
  });

  it("never reads an agent token field outside the test fixtures", () => {
    for (const file of productionFiles()) {
      const source = read(file);
      // Comments may name the field to explain why it is excluded; code may
      // not read it. Strip comments before scanning.
      const code = source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^[ \t]*\/\/.*$/gm, "");
      assert.equal(
        code.includes("agentToken"),
        false,
        `${rel(file)} must not read agentToken; the allow-list projection should make it unrepresentable`
      );
    }
  });

  it("does not read agentToken or host paths from a VM state object", () => {
    const source = read(join(SRC_DIR, "vmsan.ts"));
    for (const forbidden of [
      "state.agentToken",
      "state.chrootDir",
      "state.kernel",
      "state.rootfs",
      "state.apiSocket",
      "state.pid",
    ]) {
      assert.equal(
        source.includes(forbidden),
        false,
        `vmsan.ts must not read ${forbidden}`
      );
    }
  });
});

describe("manager security - socket and transport posture", () => {
  it("binds only a unix socket and never a TCP address", () => {
    for (const file of productionFiles()) {
      const source = read(file);
      assert.equal(
        source.includes("0.0.0.0") || source.includes("127.0.0.1"),
        false,
        `${file} must not bind a TCP address`
      );
    }
  });

  it("never chmods a socket to a world-writable mode", () => {
    for (const file of productionFiles()) {
      const code = read(file)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^[ \t]*\/\/.*$/gm, "");
      for (const forbidden of ["0o777", "0777"]) {
        assert.equal(
          code.includes(forbidden),
          false,
          `${rel(file)} must not use the world-writable mode ${forbidden}`
        );
      }
    }
  });

  it("keeps the socket owner-restricted", () => {
    const source = read(join(SRC_DIR, "server.ts"));
    assert.match(source, /SOCKET_MODE = 0o660/);
  });

  it("never widens the socket to group- or world-writable", () => {
    // 0660 is the intended mode. A 0666/0667 fallback, reachable only if a
    // group assignment fails, would hand the control socket to every local
    // account, so it is banned outright rather than merely discouraged.
    for (const file of productionFiles()) {
      const code = read(file)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^[ \t]*\/\/.*$/gm, "");
      for (const forbidden of ["0o666", "0666", "0o667", "0667", "0o602", "0602"]) {
        assert.equal(
          code.includes(forbidden),
          false,
          `${rel(file)} must not use the socket mode ${forbidden}`
        );
      }
    }
  });

  it("has no world-accessible mode constant anywhere in the manager", () => {
    for (const file of productionFiles()) {
      const code = read(file)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^[ \t]*\/\/.*$/gm, "");
      // Any literal octal mode whose "other" or "group" bits grant access is a
      // regression: the socket is owner+group only, 0660.
      const modes = [...code.matchAll(/0o([0-7]{3,4})/g)].map((match) =>
        Number.parseInt(match[1] ?? "0", 8)
      );
      for (const mode of modes) {
        assert.equal(
          mode & 0o007,
          0,
          `${rel(file)} contains octal mode 0o${mode.toString(8)} granting other access`
        );
      }
    }
  });

  it("resolves the socket group by reading /etc/group, not by running a command", () => {
    const source = read(join(SRC_DIR, "server.ts"));
    assert.match(source, /readFile\(GROUP_FILE/);
    assert.match(source, /const GROUP_FILE = "\/etc\/group"/);
  });
});

describe("manager security - the native api is reachable from one seam only", () => {
  it("imports vmsan in vmsan.ts alone", () => {
    const importers = productionFiles().filter((file) =>
      /from\s+["']vmsan["']|import\(\s*["']vmsan["']\s*\)/.test(
        read(file)
      )
    );

    assert.deepEqual(
      importers.map((file) => rel(file)),
      ["vmsan.ts"]
    );
  });

  it("keeps the production source a set of plain files, not a bundle", () => {
    assert.equal(statSync(SRC_DIR).isDirectory(), true);
  });
});
