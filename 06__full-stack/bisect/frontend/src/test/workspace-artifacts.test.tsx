/**
 * The workspace page is where the two artifact panels stop being placeholders
 * and start being driven by real backend reads.
 *
 * These tests pin the three behaviours that matter: fetched patch and timeline
 * data actually reach the panels, a session with no artifacts reads as "none"
 * rather than as invented content, and polling stops once the run is terminal
 * instead of continuing to re-fetch artifacts that can no longer change.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import WorkspacePage from "../app/workspace/page";
import { AuthProvider } from "../lib/auth/useAuth";
import * as repoApi from "../lib/api/repositories";
import * as sessionApi from "../lib/api/sessions";
import {
  AgentSession,
  RepositoryRead,
  SessionPatchRead,
  SessionTimelineRead,
} from "../lib/api/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/auth/RequireAuth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockRepos: RepositoryRead[] = [
  {
    id: "repo-1",
    github_repo_id: 101,
    full_name: "octocat/bisect-demo",
    default_branch: "main",
    clone_url: "https://github.com/octocat/bisect-demo.git",
    is_private: false,
    owner_id: "user-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
];

function makeSession(status: AgentSession["status"]): AgentSession {
  return {
    id: "session-abc-123",
    owner_id: "user-1",
    repository_id: null,
    task_prompt: "Diagnose failing assertion",
    status,
    iteration_count: 2,
    executed_action_count: 2,
    created_at: "2026-09-25T12:00:00Z",
    started_at: "2026-09-25T12:00:01Z",
    completed_at: null,
    termination_reason: null,
    prompt_tokens: 800,
    completion_tokens: 150,
    total_tokens: 950,
    steps: [],
  };
}

const realPatch: SessionPatchRead = {
  session_id: "session-abc-123",
  exists: true,
  is_empty: false,
  diff: [
    "diff --git a/src/calc.py b/src/calc.py",
    "index 1111111..2222222 100644",
    "--- a/src/calc.py",
    "+++ b/src/calc.py",
    "@@ -1,3 +1,3 @@",
    " def add(a, b):",
    "-    return a - b",
    "+    return a + b",
  ].join("\n"),
};

const realTimeline: SessionTimelineRead = {
  session_id: "session-abc-123",
  exists: true,
  culprit_hash: "c".repeat(40),
  commits: [
    {
      hash: "a".repeat(40),
      short_hash: "aaaaaaa",
      message: "tighten the tolerance",
      author: "octocat",
      timestamp: "2026-01-01T00:00:00+00:00",
      outcome: "good",
      test_output: "1 passed",
      duration_seconds: 1.5,
    },
    {
      hash: "c".repeat(40),
      short_hash: "ccccccc",
      message: "invert the operator",
      author: "octocat",
      timestamp: "2026-01-02T00:00:00+00:00",
      outcome: "culprit",
      test_output: "1 failed",
      duration_seconds: 2.25,
    },
  ],
};

const noPatch: SessionPatchRead = {
  session_id: "session-abc-123",
  exists: false,
  diff: "",
  is_empty: true,
};

const noTimeline: SessionTimelineRead = {
  session_id: "session-abc-123",
  exists: false,
  commits: [],
  culprit_hash: null,
};

function stubBaseApis() {
  vi.spyOn(repoApi.repositoriesApi, "getRepositories").mockResolvedValue({
    items: mockRepos,
    total: 1,
    limit: 100,
    offset: 0,
  });
  vi.spyOn(sessionApi, "getSessionEvents").mockResolvedValue({
    items: [],
    total: 0,
    limit: 100,
    after_sequence: 0,
    last_sequence: null,
  });
  vi.spyOn(sessionApi.sessionsApi, "createSession").mockResolvedValue(
    makeSession("running")
  );
}

function renderPage() {
  return render(
    <AuthProvider>
      <WorkspacePage />
    </AuthProvider>
  );
}

/** Starts a session from the form so the panels have an id to read. */
async function startSession() {
  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: "octocat/bisect-demo" })
    ).toBeInTheDocument();
  });
  fireEvent.change(
    screen.getByPlaceholderText(/Identify failing test/),
    { target: { value: "Diagnose failing assertion" } }
  );
  fireEvent.click(screen.getByRole("button", { name: /Start Task/ }));
}

describe("workspace artifact panels", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the fetched patch in the diff panel", async () => {
    stubBaseApis();
    vi.spyOn(sessionApi, "getSession").mockResolvedValue(makeSession("running"));
    vi.spyOn(sessionApi, "getSessionPatch").mockResolvedValue(realPatch);
    vi.spyOn(sessionApi, "getSessionTimeline").mockResolvedValue(noTimeline);

    renderPage();
    await startSession();

    fireEvent.click(screen.getByRole("button", { name: /Diff & Patch Review/ }));

    await waitFor(() => {
      expect(screen.getByText("src/calc.py")).toBeInTheDocument();
    });
    // The panel parses the raw diff, so the real changed line is what shows.
    expect(screen.getByText("return a + b")).toBeInTheDocument();
    expect(screen.getByText("return a - b")).toBeInTheDocument();
    expect(screen.queryByTestId("diff-unavailable")).not.toBeInTheDocument();
  });

  it("renders the fetched timeline with the culprit identified", async () => {
    stubBaseApis();
    vi.spyOn(sessionApi, "getSession").mockResolvedValue(makeSession("running"));
    vi.spyOn(sessionApi, "getSessionPatch").mockResolvedValue(noPatch);
    vi.spyOn(sessionApi, "getSessionTimeline").mockResolvedValue(realTimeline);

    renderPage();
    await startSession();

    fireEvent.click(screen.getByRole("button", { name: /Bisect Timeline/ }));

    await waitFor(() => {
      expect(screen.getByText("Breaking Commit Isolated:")).toBeInTheDocument();
    });
    // The short hash shows on the node and in the header pill.
    expect(screen.getAllByText("ccccccc").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("timeline-unavailable")).not.toBeInTheDocument();
  });

  it("reads a session with no artifacts as having none, not as empty content", async () => {
    stubBaseApis();
    vi.spyOn(sessionApi, "getSession").mockResolvedValue(makeSession("completed"));
    vi.spyOn(sessionApi, "getSessionPatch").mockResolvedValue(noPatch);
    vi.spyOn(sessionApi, "getSessionTimeline").mockResolvedValue(noTimeline);

    renderPage();
    await startSession();

    fireEvent.click(screen.getByRole("button", { name: /Bisect Timeline/ }));
    await waitFor(() => {
      expect(screen.getByTestId("timeline-unavailable")).toBeInTheDocument();
    });
    expect(
      screen.getByText("No bisect timeline for this session")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Diff & Patch Review/ }));
    await waitFor(() => {
      expect(screen.getByTestId("diff-unavailable")).toBeInTheDocument();
    });
    expect(screen.getByText("No patch for this session")).toBeInTheDocument();
  });

  it("distinguishes an empty patch from a missing one", async () => {
    stubBaseApis();
    vi.spyOn(sessionApi, "getSession").mockResolvedValue(makeSession("completed"));
    vi.spyOn(sessionApi, "getSessionPatch").mockResolvedValue({
      ...noPatch,
      exists: true,
      is_empty: true,
    });
    vi.spyOn(sessionApi, "getSessionTimeline").mockResolvedValue({
      ...noTimeline,
      exists: true,
      commits: [],
    });

    renderPage();
    await startSession();

    fireEvent.click(screen.getByRole("button", { name: /Diff & Patch Review/ }));
    await waitFor(() => {
      expect(screen.getByTestId("diff-empty")).toBeInTheDocument();
    });
    expect(screen.getByText("Nothing to review")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Bisect Timeline/ }));
    await waitFor(() => {
      expect(screen.getByTestId("timeline-empty")).toBeInTheDocument();
    });
    expect(screen.getByText("No commits were evaluated")).toBeInTheDocument();
  });

  it("stops polling artifacts once the session is terminal", async () => {
    stubBaseApis();
    // A completed run's artifacts can no longer change, so the panels must stop
    // asking rather than re-fetching on every tick forever.
    vi.spyOn(sessionApi, "getSession").mockResolvedValue(makeSession("completed"));
    const patchSpy = vi
      .spyOn(sessionApi, "getSessionPatch")
      .mockResolvedValue(realPatch);
    const timelineSpy = vi
      .spyOn(sessionApi, "getSessionTimeline")
      .mockResolvedValue(realTimeline);

    renderPage();
    await startSession();

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalled();
    });
    const callsAfterLoad = patchSpy.mock.calls.length;
    const timelineCallsAfterLoad = timelineSpy.mock.calls.length;

    // Well past the 2s poll interval, in real time.
    await new Promise((resolve) => setTimeout(resolve, 4500));

    expect(patchSpy.mock.calls.length).toBe(callsAfterLoad);
    expect(timelineSpy.mock.calls.length).toBe(timelineCallsAfterLoad);
    // Longer than the default 5s budget, since this waits out a real poll window.
  }, 20000);

  it("keeps polling artifacts while the session is still running", async () => {
    stubBaseApis();
    vi.spyOn(sessionApi, "getSession").mockResolvedValue(makeSession("running"));
    const patchSpy = vi
      .spyOn(sessionApi, "getSessionPatch")
      .mockResolvedValue(noPatch);
    vi.spyOn(sessionApi, "getSessionTimeline").mockResolvedValue(noTimeline);

    renderPage();
    await startSession();

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalled();
    });
    const callsAfterLoad = patchSpy.mock.calls.length;

    await new Promise((resolve) => setTimeout(resolve, 4500));

    // A run in progress can still produce a patch, so polling must continue.
    expect(patchSpy.mock.calls.length).toBeGreaterThan(callsAfterLoad);
    // Longer than the default 5s budget, since this waits out a real poll window.
  }, 20000);
});
