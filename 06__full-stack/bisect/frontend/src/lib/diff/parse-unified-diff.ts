/**
 * Parses a raw unified diff into the per-file shape the review panel renders.
 *
 * The API returns the diff exactly as `git diff` produced it, so this parser is
 * the only place the two shapes meet. It never invents content: a line the parser
 * does not understand is either skipped as diff metadata or surfaced verbatim,
 * and a diff with no recognizable file header yields no files at all rather than
 * a fabricated one.
 *
 * Kept as a pure function so the panel's data can be tested without rendering it.
 */

import { ChangedFile, DiffHunk } from "@/components/workspace/DiffReviewPanel";

/** `@@ -old,count +new,count @@ optional section heading` */
const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@ ?(.*)$/;

const FILE_HEADER = /^diff --git a\/(.*) b\/(.*)$/;

function makeFile(path: string, status: ChangedFile["status"]): ChangedFile {
  return { path, additions: 0, deletions: 0, status, diffHunks: [] };
}

/**
 * Whether a file is new, deleted, or modified, from the markers git emits.
 *
 * `/dev/null` on one side is how git spells "did not exist", so it is the only
 * evidence used; guessing from whether any line is added would misreport a
 * modification that happens to add nothing.
 */
function statusForIsNew(isNew: boolean, isDeleted: boolean): ChangedFile["status"] {
  if (isNew) return "added";
  if (isDeleted) return "deleted";
  return "modified";
}

export function parseUnifiedDiff(diff: string): ChangedFile[] {
  if (!diff.trim()) return [];

  const lines = diff.split("\n");
  const files: ChangedFile[] = [];

  let current: ChangedFile | null = null;
  let isNew = false;
  let isDeleted = false;

  let hunk: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  const closeHunk = () => {
    if (current && hunk) current.diffHunks.push(hunk);
    hunk = null;
  };

  const closeFile = () => {
    closeHunk();
    if (current) {
      current.status = statusForIsNew(isNew, isDeleted);
      files.push(current);
    }
    current = null;
    isNew = false;
    isDeleted = false;
  };

  for (const line of lines) {
    const fileMatch = FILE_HEADER.exec(line);
    if (fileMatch) {
      closeFile();
      // git quotes paths containing unusual bytes; the quotes are not part of
      // the path, so they are stripped rather than displayed as a filename.
      current = makeFile(cleanPath(fileMatch[2]), "modified");
      continue;
    }

    if (line.startsWith("new file mode")) {
      isNew = true;
      continue;
    }
    if (line.startsWith("deleted file mode")) {
      isDeleted = true;
      continue;
    }
    if (
      line.startsWith("index ") ||
      line.startsWith("old mode") ||
      line.startsWith("new mode") ||
      line.startsWith("similarity index ") ||
      line.startsWith("rename from ") ||
      line.startsWith("rename to ") ||
      line.startsWith("Binary files ") ||
      line.startsWith("GIT binary patch")
    ) {
      continue;
    }

    if (line.startsWith("--- ")) {
      if (line === "--- /dev/null") isNew = true;
      else if (line === "--- a/dev/null") isDeleted = true;
      // A `---` path is redundant with the `diff --git` header and is often an
      // abbreviated prefix, so it is deliberately not used as the filename.
      continue;
    }
    if (line.startsWith("+++ ")) {
      if (line === "+++ /dev/null") isDeleted = true;
      continue;
    }

    const hunkMatch = HUNK_HEADER.exec(line);
    if (hunkMatch) {
      // Pushed by `closeHunk`, never here: a hunk belongs to the file once the
      // parser has seen the next hunk or the end of the file, and appending on
      // open as well would add it twice.
      closeHunk();
      oldLine = Number(hunkMatch[1]);
      newLine = Number(hunkMatch[3]);
      const section = hunkMatch[5] ?? "";
      hunk = {
        header: line,
        lines: [],
      };
      if (section) {
        // The trailing text is the enclosing function or class, which is the
        // only human-readable context git offers for a hunk.
        hunk.lines.push({ type: "context", content: section });
      }
      continue;
    }

    if (!hunk) continue;

    // `\ No newline at end of file` annotates the previous line rather than
    // being one, so it is not given a line of its own.
    if (line.startsWith("\\")) continue;

    if (line.startsWith("+")) {
      hunk.lines.push({
        type: "add",
        content: line.slice(1),
        newLineNumber: newLine,
      });
      newLine += 1;
      if (current) current.additions += 1;
      continue;
    }
    if (line.startsWith("-")) {
      hunk.lines.push({
        type: "delete",
        content: line.slice(1),
        oldLineNumber: oldLine,
      });
      oldLine += 1;
      if (current) current.deletions += 1;
      continue;
    }
    if (line.startsWith(" ")) {
      hunk.lines.push({
        type: "context",
        content: line.slice(1),
        oldLineNumber: oldLine,
        newLineNumber: newLine,
      });
      oldLine += 1;
      newLine += 1;
      continue;
    }

    // An empty line inside a hunk is a context line whose leading space git
    // omits at end of file. Counting it as context keeps following line numbers
    // aligned with the real file.
    if (line === "") {
      hunk.lines.push({
        type: "context",
        content: "",
        oldLineNumber: oldLine,
        newLineNumber: newLine,
      });
      oldLine += 1;
      newLine += 1;
    }
  }

  closeFile();
  return files;
}

function cleanPath(path: string): string {
  const unquoted = path.startsWith('"') && path.endsWith('"')
    ? path.slice(1, -1)
    : path;
  return unquoted;
}
