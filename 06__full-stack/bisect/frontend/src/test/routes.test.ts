import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  PUBLIC_ROUTES,
  isPublicRoute,
  safeNextPath,
  buildLoginUrl,
  DEFAULT_AUTHENTICATED_PATH,
} from "../lib/auth/routes";

describe("route manifest", () => {
  it("treats an unlisted path as protected", () => {
    // Defaulting closed means a newly added route is guarded without edits.
    expect(isPublicRoute("/workspace")).toBe(false);
    expect(isPublicRoute("/sessions")).toBe(false);
    expect(isPublicRoute("/activity")).toBe(false);
    expect(isPublicRoute("/settings")).toBe(false);
    expect(isPublicRoute("/anything/at/all")).toBe(false);
  });

  it("treats the login and callback routes as public", () => {
    expect(isPublicRoute("/")).toBe(true);
    expect(isPublicRoute("/auth/callback")).toBe(true);
  });

  it("ignores query strings and trailing slashes", () => {
    expect(isPublicRoute("/auth/callback?code=abc&state=xyz")).toBe(true);
    expect(isPublicRoute("/workspace?tab=diff")).toBe(false);
    expect(isPublicRoute("/workspace/")).toBe(false);
  });

  it("does not treat a lookalike path as the callback route", () => {
    expect(isPublicRoute("/auth/callback/evil")).toBe(false);
    expect(isPublicRoute("/auth")).toBe(false);
  });

  it("declares exactly the intended public routes", () => {
    expect([...PUBLIC_ROUTES]).toEqual(["/", "/auth/callback"]);
  });
});

describe("next redirect validation", () => {
  it("accepts an internal path", () => {
    expect(safeNextPath("/workspace")).toBe("/workspace");
    expect(safeNextPath("/sessions")).toBe("/sessions");
    expect(safeNextPath("/workspace?tab=diff")).toBe("/workspace?tab=diff");
  });

  it("rejects a protocol-relative URL that would leave the origin", () => {
    // "//evil.com" is read as a host, not a path, by the browser.
    expect(safeNextPath("//evil.com")).toBeNull();
  });

  it("rejects the backslash variant that normalizes to //", () => {
    // "/\evil.com" becomes "//evil.com" once the browser normalizes it.
    expect(safeNextPath("/\\evil.com")).toBeNull();
  });

  it("rejects absolute URLs and bare words", () => {
    expect(safeNextPath("https://evil.com")).toBeNull();
    expect(safeNextPath("evil.com")).toBeNull();
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
  });

  it("rejects empty and missing values", () => {
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath("")).toBeNull();
  });
});

describe("login URL construction", () => {
  it("encodes the return path so it survives the query string", () => {
    expect(buildLoginUrl("/workspace")).toBe("/?next=%2Fworkspace");
    expect(buildLoginUrl("/workspace?tab=diff")).toBe(
      "/?next=%2Fworkspace%3Ftab%3Ddiff"
    );
  });

  it("falls back to the bare login path for an unsafe target", () => {
    expect(buildLoginUrl("//evil.com")).toBe("/");
    expect(buildLoginUrl("/\\evil.com")).toBe("/");
    expect(buildLoginUrl(null)).toBe("/");
    expect(buildLoginUrl(undefined)).toBe("/");
  });

  it("names a real default landing page", () => {
    expect(DEFAULT_AUTHENTICATED_PATH).toBe("/workspace");
    expect(isPublicRoute(DEFAULT_AUTHENTICATED_PATH)).toBe(false);
  });
});

describe("return path storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips a recorded path", async () => {
    const { returnPathStorage } = await import("../lib/api/client");
    returnPathStorage.set("/workspace");
    expect(returnPathStorage.get()).toBe("/workspace");
    returnPathStorage.clear();
    expect(returnPathStorage.get()).toBeNull();
  });
});
