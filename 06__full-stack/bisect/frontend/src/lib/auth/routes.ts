/**
 * Route manifest and redirect-target validation for client-side guards.
 *
 * This is UX protection, not a security boundary: the JWT lives in
 * localStorage, so a determined user can always reach the page. The guard
 * exists to keep unauthenticated users out of the workspace UI and to
 * preserve where they were headed so login can return them there.
 */

/** Routes reachable without a session. Everything else is protected. */
export const PUBLIC_ROUTES = ["/", "/auth/callback"] as const;

/**
 * Report whether a path is public.
 *
 * Defaults to protected: a path absent from {@link PUBLIC_ROUTES} requires
 * authentication. Defaulting closed means a newly added route is guarded
 * unless someone deliberately opts it out.
 */
export function isPublicRoute(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return PUBLIC_ROUTES.some((route) => normalized === route);
}

/**
 * Strip query and hash so `/workspace?x=1` matches the `/workspace` entry.
 */
function normalizePathname(pathname: string): string {
  const withoutHash = pathname.split("#")[0] ?? "";
  const withoutQuery = withoutHash.split("?")[0] ?? "";
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

/**
 * Validate a `next` redirect target, returning null when it is unsafe.
 *
 * A redirect target arriving from a query string is attacker-controllable, so
 * it must be a path within this app. A protocol-relative `//evil.com` or a
 * backslash variant `/\evil.com` would send the browser to another origin
 * while looking like an internal path, so both are rejected.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  // Browsers normalize a backslash to a slash, so "/\evil.com" would escape.
  if (next[1] === "\\") return null;
  return next;
}

/** Where an unauthenticated visitor is sent to start a login. */
export const LOGIN_PATH = "/";

/** Where a user lands after a successful login with no valid `next`. */
export const DEFAULT_AUTHENTICATED_PATH = "/workspace";

/**
 * Build the login URL that remembers where the visitor was headed.
 */
export function buildLoginUrl(returnPath?: string | null): string {
  const safe = safeNextPath(returnPath);
  if (!safe) return LOGIN_PATH;
  return `${LOGIN_PATH}?next=${encodeURIComponent(safe)}`;
}
