import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Architectural guard: components and pages must not talk to the network
 * directly.
 *
 * Every backend call has to go through `lib/api`, which owns the base URL, auth
 * header, request timeout, and error mapping. A stray `fetch` in a component
 * would silently bypass all four, so this is checked rather than trusted.
 */

const SRC = join(process.cwd(), "src");
const SCANNED_ROOTS = ["components", "app"];

/** A call that actually performs HTTP, not a type or a mention in a comment. */
const DIRECT_HTTP_CALL =
  /(?<![.\w$])(?:await\s+|return\s+)?(?:fetch|axios)\s*\(|new\s+XMLHttpRequest\s*\(/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    if (!/\.tsx?$/.test(entry) || entry.endsWith(".d.ts")) return [];
    return [full];
  });
}

function filesUnder(root: string): string[] {
  return sourceFiles(join(SRC, root));
}

describe("no direct HTTP calls outside lib/api", () => {
  it.each(SCANNED_ROOTS)("src/%s issues no raw fetch, axios, or XHR", (root) => {
    const offenders = filesUnder(root)
      .filter((file) => DIRECT_HTTP_CALL.test(readFileSync(file, "utf-8")))
      .map((file) => file.replace(`${SRC}/`, ""));

    expect(offenders).toEqual([]);
  });

  it("keeps the timeout, auth, and error mapping in one place", () => {
    // The reason the guard above matters: these three behaviours live only in
    // client.ts, so a direct fetch would get none of them.
    const client = readFileSync(join(SRC, "lib/api/client.ts"), "utf-8");
    expect(client).toContain("AbortController");
    expect(client).toContain("Authorization");
    expect(client).toContain("statusToErrorCode");
  });

  it("routes every API module through fetchApi", () => {
    const apiFiles = sourceFiles(join(SRC, "lib/api")).filter(
      (file) => !file.endsWith("client.ts") && !file.endsWith("types.ts")
    );
    expect(apiFiles.length).toBeGreaterThan(0);

    for (const file of apiFiles) {
      expect(readFileSync(file, "utf-8"), file).toContain("fetchApi");
    }
  });
});
