/**
 * POSIX-only path utilities for microVM filesystem operations.
 *
 * All path manipulations operate in the guest virtual filesystem namespace.
 * These utilities never invoke host `path.resolve` or reference host working directories.
 */

const CONTROL_CHARS_REGEX = /[\x00-\x1f\x7f]/;

/**
 * Normalize an absolute POSIX path for the microVM filesystem.
 *
 * Resolves '.' and '..' segments logically within the virtual hierarchy.
 * Clamps traversal to the root ('/') so attempts like '/../../../etc' resolve safely to '/etc'.
 */
export function normalizeVmPath(rawPath: string): string {
  const trimmed = rawPath.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }

  // Ensure leading slash
  const absolute = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const parts = absolute.split("/").filter((part) => part.length > 0 && part !== ".");

  const stack: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      stack.pop();
    } else {
      stack.push(part);
    }
  }

  return `/${stack.join("/")}`;
}

/**
 * Validate that a given string is a usable, safe microVM path.
 */
export function validateVmPath(
  rawPath: unknown
): { ok: true; path: string } | { ok: false; message: string } {
  if (typeof rawPath !== "string") {
    return { ok: false, message: 'Path must be a string' };
  }

  const trimmed = rawPath.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: 'Path cannot be empty' };
  }

  if (CONTROL_CHARS_REGEX.test(trimmed)) {
    return { ok: false, message: 'Path contains invalid control characters' };
  }

  if (Buffer.byteLength(trimmed, "utf8") > 4096) {
    return { ok: false, message: 'Path exceeds maximum length of 4096 bytes' };
  }

  const normalized = normalizeVmPath(trimmed);
  return { ok: true, path: normalized };
}

/**
 * Validate that a given string represents exactly one filename/entry name.
 *
 * Rejects path separators ('/'), traversal entries ('.' or '..'), null bytes, and control characters.
 */
export function validateVmFilename(
  rawName: unknown
): { ok: true; filename: string } | { ok: false; message: string } {
  if (typeof rawName !== "string") {
    return { ok: false, message: 'Filename must be a string' };
  }

  const trimmed = rawName.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: 'Filename cannot be empty' };
  }

  if (CONTROL_CHARS_REGEX.test(trimmed)) {
    return { ok: false, message: 'Filename contains invalid control characters' };
  }

  if (trimmed.includes("/") || trimmed.includes("\\")) {
    return { ok: false, message: 'Filename cannot contain path separators (/ or \\)' };
  }

  if (trimmed === "." || trimmed === "..") {
    return { ok: false, message: 'Filename cannot be "." or ".."' };
  }

  if (Buffer.byteLength(trimmed, "utf8") > 255) {
    return { ok: false, message: 'Filename exceeds maximum length of 255 bytes' };
  }

  return { ok: true, filename: trimmed };
}

/**
 * Safely join a base directory and a sub-path within the microVM filesystem namespace.
 */
export function joinVmPath(basePath: string, subPath: string): string {
  const normalizedBase = normalizeVmPath(basePath);
  const cleanSub = subPath.startsWith("/") ? subPath.slice(1) : subPath;
  const combined = normalizedBase === "/" ? `/${cleanSub}` : `${normalizedBase}/${cleanSub}`;
  return normalizeVmPath(combined);
}
