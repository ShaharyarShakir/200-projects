/**
 * The workspace could only ever show the run it had just created, so a
 * finished session's patch and timeline were unreachable once the user
 * navigated away. `?session_id=` is the path back in, and these tests pin how
 * it behaves: a well-formed id opens that session, a malformed one is ignored
 * before any request, and an id the caller does not own says so instead of
 * looking like an empty workspace.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import WorkspacePage from "../app/workspace/page";
import { AuthProvider } from "../lib/auth/useAuth";
import * as repoApi from "../lib/api/repositories";
import * as sessionApi from "../lib/api/sessions";
import { ApiClientError } from "../lib/api/client";
import {
  AgentSession,
  RepositoryRead,
  SessionPatchRead,
  SessionTimelineRead,
} from "../lib/api/types";

/** A real uuid4 hex, which is the only shape the workspace accepts. */
const SESSION_ID = "a3574f83b7ab4e6e87f4f3c41b65a619";

let mockSearch = "";
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace",
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(mockSearch),
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

function makeSession(): AgentSession {
  return {
    id: SESSION_ID,
    owner_id: "user-1",
    repository_id: null,
    task_prompt: "Fix the inverted add() operator",
    status: "completed",
    iteration_count: 2,
    executed_action_count: 2,
    created_at: "2026-09-25T12:00:00Z",
    started_at: "2026-09-25T12:00:01Z",
    completed_at: "2026-09-25T12:10:00Z",
    termination_reason: "agent_completed",
    prompt_tokens: 800,
    completion_tokens: 150,
    total_tokens: 950,
    steps: [],
  };
}

const realPatch: SessionPatchRead = {
  session_id: SESSION_ID,
  exists: true,
  is_empty: false,
  diff: [
    "diff --git a/src/calc.py b/src/calc.py",
    "--- a/src/calc.py",
    "+++ b/src/calc.py",
    "@@ -1,3 +1,3 @@",
    " def add(a, b):",
    "-    return a - b",
    "+    return a + b",
  ].join("\n"),
};

const realTimeline: SessionTimelineRead = {
  session_id: SESSION_ID,
  exists: true,
  culprit_hash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
  commits: [
    {
      hash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
      short_hash: "a1b2c3d",
      subject: "Refactor helpers",
      outcome: "good",
      evaluation_index: 0,
    },
    {
      hash: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
      short_hash: "c3d4e5f",
      subject: "Invert the operator",
      outcome: "culprit",
      evaluation_index: 1,
    },
  ],
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
}

function renderPage() {
  return render(
    <AuthProvider>
      <WorkspacePage />
    </AuthProvider>
  );
}

describe("workspace ?session_id= deep link", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockReplace.mockClear();
    mockSearch = "";
  });

  it("opens the linked session and loads its patch and timeline", async () => {
    mockSearch = `session_id=${SESSION_ID}`;
    stubBaseApis();
    const getSession = vi
      .spyOn(sessionApi, "getSession")
      .mockResolvedValue(makeSession());
    const getPatch = vi
      .spyOn(sessionApi, "getSessionPatch")
      .mockResolvedValue(realPatch);
    const getTimeline = vi
      .spyOn(sessionApi, "getSessionTimeline")
      .mockResolvedValue(realTimeline);

    renderPage();

    await waitFor(() => expect(getSession).toHaveBeenCalledWith(SESSION_ID));
    expect(getPatch).toHaveBeenCalledWith(SESSION_ID);
    expect(getTimeline).toHaveBeenCalledWith(SESSION_ID);

    // The panels are tabbed, so open each and confirm it drew the fetched
    // data rather than an unavailable state.
    fireEvent.click(await screen.findByRole("button", { name: "Bisect Timeline" }));
    await waitFor(() => {
      expect(screen.getByText("Breaking Commit Isolated:")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("timeline-unavailable")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Diff & Patch Review" }));
    await waitFor(() => {
      expect(screen.getByText("src/calc.py")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("diff-unavailable")).not.toBeInTheDocument();
  });

  it("ignores a session_id that cannot be a session id", async () => {
    mockSearch = "session_id=not-a-session-id";
    stubBaseApis();
    const getSession = vi.spyOn(sessionApi, "getSession");

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "octocat/bisect-demo" })
      ).toBeInTheDocument();
    });
    // Rejected before any request, so a junk link cannot probe the API.
    expect(getSession).not.toHaveBeenCalled();
  });

  it("reports a session the caller does not own instead of showing nothing", async () => {
    mockSearch = `session_id=${SESSION_ID}`;
    stubBaseApis();
    vi.spyOn(sessionApi, "getSession").mockRejectedValue(
      new ApiClientError("Not found", 404)
    );

    renderPage();

    expect(
      await screen.findByText(/does not exist, or it belongs to another account/)
    ).toBeInTheDocument();
  });

  it("clears the link when a bad one is dismissed", async () => {
    mockSearch = `session_id=${SESSION_ID}`;
    stubBaseApis();
    vi.spyOn(sessionApi, "getSession").mockRejectedValue(
      new ApiClientError("Not found", 404)
    );

    renderPage();

    await screen.findByText(/does not exist, or it belongs to another account/);

    // Dismissing drops the dead session instead of leaving it selected.
    fireEvent.click(screen.getByRole("button", { name: "Dismiss error" }));
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith("/workspace")
    );
  });
});
