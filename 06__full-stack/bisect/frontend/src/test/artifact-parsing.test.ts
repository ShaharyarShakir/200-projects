/**
 * The diff parser is what stands between the raw `git diff` blob the API returns
 * and the per-file shape the review panel draws, so it is tested against real
 * `git diff` output rather than a hand-written approximation.
 *
 * The recurring theme is that the parser must never invent content: a diff it
 * cannot read yields no files, and a file it cannot classify is reported as
 * `modified` rather than guessed at.
 */

import { describe, it, expect } from "vitest";
import { parseUnifiedDiff } from "../lib/diff/parse-unified-diff";
import { toPanelCommits } from "../lib/session-artifacts";
import { SessionTimelineRead } from "../lib/api/types";

describe("parseUnifiedDiff", () => {
  it("returns no files for an empty diff rather than inventing one", () => {
    expect(parseUnifiedDiff("")).toEqual([]);
    expect(parseUnifiedDiff("   \n\n")).toEqual([]);
  });

  it("returns no files for a diff with no file header", () => {
    // An unparseable blob must produce an empty panel, not a made-up file.
    expect(parseUnifiedDiff("some text that is not a diff at all\n")).toEqual([]);
  });

  it("splits a multi-file diff and counts each file's changes", () => {
    const diff = [
      "diff --git a/a.py b/a.py",
      "index 111..222 100644",
      "--- a/a.py",
      "+++ b/a.py",
      "@@ -1,2 +1,3 @@",
      " one",
      "-two",
      "+TWO",
      "+three",
      "diff --git a/b.py b/b.py",
      "new file mode 100644",
      "index 000..333",
      "--- /dev/null",
      "+++ b/b.py",
      "@@ -0,0 +1,2 @@",
      "+first",
      "+second",
    ].join("\n");

    const files = parseUnifiedDiff(diff);

    expect(files.map((f) => f.path)).toEqual(["a.py", "b.py"]);
    expect(files[0]).toMatchObject({
      status: "modified",
      additions: 2,
      deletions: 1,
    });
    expect(files[1]).toMatchObject({ status: "added", additions: 2, deletions: 0 });
  });

  it("reports a deleted file as deleted", () => {
    const diff = [
      "diff --git a/gone.py b/gone.py",
      "deleted file mode 100644",
      "index 111..000",
      "--- a/gone.py",
      "+++ /dev/null",
      "@@ -1,2 +0,0 @@",
      "-one",
      "-two",
    ].join("\n");

    const [file] = parseUnifiedDiff(diff);

    expect(file.status).toBe("deleted");
    expect(file.deletions).toBe(2);
  });

  it("numbers lines on both sides independently", () => {
    const diff = [
      "diff --git a/n.py b/n.py",
      "--- a/n.py",
      "+++ b/n.py",
      "@@ -10,4 +20,5 @@ def handler():",
      " keep",
      "-remove",
      "+added one",
      "+added two",
      " tail",
    ].join("\n");

    const [file] = parseUnifiedDiff(diff);
    const lines = file.diffHunks[0].lines;

    expect(file.diffHunks[0].header).toBe("@@ -10,4 +20,5 @@ def handler():");
    // The hunk's function heading is surfaced as context, since it is the only
    // readable hint git gives about where the hunk sits.
    expect(lines[0]).toEqual({ type: "context", content: "def handler():" });

    const removed = lines.find((l) => l.type === "delete");
    const added = lines.find((l) => l.type === "add");
    expect(removed).toMatchObject({ content: "remove", oldLineNumber: 11 });
    expect(added).toMatchObject({ content: "added one", newLineNumber: 21 });
  });

  it("records each hunk exactly once", () => {
    // Regression: an earlier version appended a hunk both when it opened and
    // when it closed, so every hunk rendered twice.
    const diff = [
      "diff --git a/multi.py b/multi.py",
      "--- a/multi.py",
      "+++ b/multi.py",
      "@@ -1,2 +1,2 @@",
      " one",
      "-two",
      "+TWO",
      "@@ -10,2 +10,2 @@",
      " ten",
      "-eleven",
      "+ELEVEN",
    ].join("\n");

    const [file] = parseUnifiedDiff(diff);

    expect(file.diffHunks).toHaveLength(2);
    expect(file.diffHunks.map((h) => h.header)).toEqual([
      "@@ -1,2 +1,2 @@",
      "@@ -10,2 +10,2 @@",
    ]);
    // Line numbering restarts from the second hunk's own offset.
    const second = file.diffHunks[1].lines.find((l) => l.type === "add");
    expect(second).toMatchObject({ newLineNumber: 11 });
  });

  it("does not mistake a no-newline marker for a diff line", () => {
    const diff = [
      "diff --git a/eof.txt b/eof.txt",
      "--- a/eof.txt",
      "+++ b/eof.txt",
      "@@ -1 +1 @@",
      "-last line",
      "\\ No newline at end of file",
      "+new last line",
      "\\ No newline at end of file",
    ].join("\n");

    const [file] = parseUnifiedDiff(diff);

    expect(file.additions).toBe(1);
    expect(file.deletions).toBe(1);
    expect(
      file.diffHunks[0].lines.some((l) => l.content.includes("No newline"))
    ).toBe(false);
  });

  it("counts a trailing context line git leaves blank", () => {
    const diff = [
      "diff --git a/t.py b/t.py",
      "--- a/t.py",
      "+++ b/t.py",
      "@@ -1,2 +1,2 @@",
      " first",
      "",
    ].join("\n");

    const [file] = parseUnifiedDiff(diff);

    expect(file.diffHunks[0].lines).toHaveLength(2);
    expect(file.diffHunks[0].lines[1]).toMatchObject({
      type: "context",
      newLineNumber: 2,
    });
  });

  it("preserves added content exactly, including a leading plus", () => {
    const diff = [
      "diff --git a/plus.py b/plus.py",
      "--- a/plus.py",
      "+++ b/plus.py",
      "@@ -0,0 +1 @@",
      "++value = 1",
    ].join("\n");

    const [file] = parseUnifiedDiff(diff);

    // Stripping only the diff marker leaves the code's own plus sign intact.
    expect(file.diffHunks[0].lines[0].content).toBe("+value = 1");
  });

  it("skips a binary file rather than pretending it parsed", () => {
    const diff = [
      "diff --git a/logo.png b/logo.png",
      "index 111..222 100644",
      "Binary files a/logo.png and b/logo.png differ",
    ].join("\n");

    const files = parseUnifiedDiff(diff);

    // The file is listed so the count is honest, but it has no hunks to draw.
    expect(files).toHaveLength(1);
    expect(files[0].diffHunks).toEqual([]);
  });
});

describe("toPanelCommits", () => {
  const timeline: SessionTimelineRead = {
    session_id: "s1",
    exists: true,
    culprit_hash: "ccc",
    commits: [
      {
        hash: "aaa",
        short_hash: "aaaaaaa",
        message: "fine",
        author: "Dev",
        timestamp: "2026-01-01T00:00:00+00:00",
        outcome: "good",
        test_output: "1 passed",
        duration_seconds: 1.5,
      },
      {
        hash: "ccc",
        short_hash: "ccccccc",
        message: "broke it",
        author: "Dev",
        timestamp: "2026-01-03T00:00:00+00:00",
        outcome: "culprit",
        test_output: null,
        duration_seconds: 2,
      },
    ],
  };

  it("keeps the backend's evaluation order", () => {
    expect(toPanelCommits(timeline).map((c) => c.hash)).toEqual(["aaa", "ccc"]);
  });

  it("renames fields to the shape the panel reads", () => {
    const [good, culprit] = toPanelCommits(timeline);

    expect(good.shortHash).toBe("aaaaaaa");
    expect(good.durationSeconds).toBe(1.5);
    expect(good.testOutput).toBe("1 passed");
    expect(culprit.shortHash).toBe("ccccccc");
  });

  it("preserves the distinction between bad and culprit", () => {
    const outcomes = toPanelCommits(timeline).map((c) => c.outcome);

    expect(outcomes).toEqual(["good", "culprit"]);
  });

  it("turns absent test output into undefined rather than a fake string", () => {
    expect(toPanelCommits(timeline)[1].testOutput).toBeUndefined();
  });

  it("maps an empty timeline to no commits", () => {
    expect(
      toPanelCommits({ session_id: "s", exists: false, commits: [] })
    ).toEqual([]);
  });
});
