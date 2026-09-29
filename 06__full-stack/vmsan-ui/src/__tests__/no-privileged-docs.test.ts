import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * The documentation is part of the security boundary, not decoration.
 *
 * The sudoers walkthrough this replaces was the single most dangerous line in
 * the repository: it told a reader to grant NOPASSWD root to a vmsan binary
 * installed under a user-writable path, which handed the web server everything
 * the manager was built to contain. A reader who follows the docs is as
 * exposed as a reader who finds the code.
 *
 * These tests exist because the README is edited for ordinary reasons, and
 * nothing in the compiler or the type checker would notice a privilege
 * instruction creeping back into it.
 */

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** Files a reader might follow instructions from. */
const DOCS = [
  "README.md",
  ".env.local.example",
  "CONTRIBUTING.md",
] as const;

const docs = DOCS.map((relative) => ({
  relative,
  path: path.join(ROOT, relative),
  exists: (() => {
    try {
      readFileSync(path.join(ROOT, relative));
      return true;
    } catch {
      return false;
    }
  })(),
})).filter((doc) => doc.exists);

function read(relative: string): string {
  return readFileSync(path.join(ROOT, relative), "utf8");
}

/**
 * A line that reads as an instruction, not a prohibition.
 *
 * "No sudoers entry is needed" and "do not create one" are the documentation
 * doing its job. "Create a drop-in sudoers rule" is the vulnerability. The
 * distinction is the presence of a directive verb aimed at the reader.
 */
function instructions(relative: string): string[] {
  const found: string[] = [];
  const lines = read(relative).split("\n");

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed.startsWith(">") || trimmed.startsWith("|")) {
      return;
    }

    const mention = trimmed.search(/\b(sudoers|visudo|NOPASSWD)\b/i);
    if (mention === -1) return;

    // The distinction is whether a negation governs the mention. "No sudoers
    // entry is needed, and none is wanted" and "There is deliberately no
    // /etc/sudoers.d rule" are the documentation doing its job. "Create a
    // drop-in sudoers rule at /etc/sudoers.d/vmsan" is the vulnerability.
    const before = trimmed.slice(0, mention);
    if (/\b(no|not|never|without|instead of|rather than)\b/i.test(before)) return;

    found.push(`${relative}:${index + 1}: ${trimmed}`);
  });

  return found;
}

describe("no document instructs the reader to configure passwordless sudo", () => {
  it("has documentation files to check", () => {
    // A glob that silently matches nothing would make every test below pass.
    assert.ok(docs.length > 0, "expected at least README.md to exist");
  });

  for (const doc of docs) {
    it(`${doc.relative} contains no sudoers instruction`, () => {
      assert.deepEqual(instructions(doc.relative), [], `${doc.relative} instructs sudoers setup`);
    });
  }
});

describe("no document sets VMSAN_SUDO", () => {
  for (const doc of docs) {
    it(`${doc.relative} does not set VMSAN_SUDO`, () => {
      const offending = read(doc.relative)
        .split("\n")
        .map((line, index) => ({ line, number: index + 1 }))
        .filter(({ line }) => /^[^#]*VMSAN_SUDO\s*=/.test(line))
        .map(({ line, number }) => `${doc.relative}:${number}: ${line.trim()}`);

      assert.deepEqual(offending, [], `${doc.relative} still sets VMSAN_SUDO`);
    });
  }
});

describe("no document tells the reader to run the web application as root", () => {
  // Matches the commands that would actually start the web process under sudo.
  const ROOTED_COMMANDS =
    /sudo\s+(?:-E\s+)?(?:env\s+\S+\s+)?(?:pnpm|npm|yarn|next|bunx?)\s+(?:dev|build|start|run\s+(?:dev|build|start))\b/;

  for (const doc of docs) {
    it(`${doc.relative} contains no rooted web command`, () => {
      const offending = read(doc.relative)
        .split("\n")
        .map((line, index) => ({ line: line.trim(), number: index + 1 }))
        // "Do NOT run the Next.js process as root (sudo pnpm dev)" quotes the
        // bad command inside a prohibition. That is the documentation warning
        // against it, and must be allowed.
        .filter(({ line }) => ROOTED_COMMANDS.test(line))
        .filter(({ line }) => !/\b(do not|don't|never|not)\b/i.test(line))
        .map(({ line, number }) => `${doc.relative}:${number}: ${line}`);

      assert.deepEqual(offending, [], `${doc.relative} instructs running the web app as root`);
    });
  }
});

describe("the README documents the boundary it actually has", () => {
  it("tells the reader not to run Next.js as root", () => {
    const readme = read("README.md");
    assert.match(
      readme,
      /do not run the Next\.js process as root/i,
      "README must warn against running the web process as root"
    );
  });

  it("states that no sudoers entry is wanted", () => {
    assert.match(
      read("README.md"),
      /no sudoers entry is needed, and none is wanted/i,
      "README must state the sudoers-free posture"
    );
  });

  it("documents that lifecycle operations are unavailable", () => {
    assert.match(
      read("README.md"),
      /VM_LIFECYCLE_UNAVAILABLE/,
      "README must name the code the lifecycle routes return"
    );
  });

  it("documents the group membership re-check", () => {
    const readme = read("README.md");
    assert.match(readme, /id -nG/, "README must show the group membership check");
    assert.match(
      readme,
      /new login session|current session/i,
      "README must explain that membership needs a new session to take effect"
    );
  });

  it("documents the socket environment variable", () => {
    assert.match(
      read("README.md"),
      /VMSAN_MANAGER_SOCKET/,
      "README must document VMSAN_MANAGER_SOCKET"
    );
  });

  it("does not enable the service before verification", () => {
    const readme = read("README.md");
    const enableIndex = readme.indexOf("systemctl enable");
    const verifyIndex = readme.search(/Verifying before you enable|verify/i);
    assert.ok(enableIndex > -1, "README must document enabling the service");
    assert.ok(
      verifyIndex > -1 && verifyIndex < enableIndex,
      "verification must be documented before enabling"
    );
  });
});
