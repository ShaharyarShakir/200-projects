import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import WorkspacePage from "../app/workspace/page";
import { AuthProvider } from "../lib/auth/useAuth";
import * as repoApi from "../lib/api/repositories";
import * as sessionApi from "../lib/api/sessions";
import { RepositoryRead, AgentSession } from "../lib/api/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// These suites exercise page content, not the auth gate. The guard is mocked
// open so a missing token does not blank the page; RequireAuth's own
// behaviour is covered in require-auth.test.tsx.
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

const mockCreatedSession: AgentSession = {
  id: "session-abc-123",
  owner_id: "user-1",
  repository_id: null,
  task_prompt: "Diagnose failing assertion in tests/test_core.py",
  status: "running",
  iteration_count: 1,
  executed_action_count: 1,
  created_at: "2026-09-25T12:00:00Z",
  started_at: "2026-09-25T12:00:01Z",
  completed_at: null,
  termination_reason: null,
  prompt_tokens: 800,
  completion_tokens: 150,
  total_tokens: 950,
  steps: [
    {
      iteration: 1,
      raw_response: "I will run pytest to capture failure logs.",
      execution_id: "exec-101",
      duration_seconds: 0.85,
      action: {
        action: "run_command",
        command: "pytest tests/test_core.py",
      },
      result: {
        action_type: "run_command",
        command: "pytest tests/test_core.py",
        exit_code: 1,
        stdout: "FAILED tests/test_core.py::test_init - AssertionError",
        stderr: "",
        duration_seconds: 0.85,
        timed_out: false,
      },
    },
  ],
};

describe("WorkspacePage Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads and renders repositories, workspace status, and empty session on mount", async () => {
    vi.spyOn(repoApi.repositoriesApi, "getRepositories").mockResolvedValueOnce({
      items: mockRepos,
      total: 1,
      limit: 100,
      offset: 0,
    });

    render(
      <AuthProvider>
        <WorkspacePage />
      </AuthProvider>
    );

    expect(
      screen.getByRole("heading", { name: "Agent Workspace" })
    ).toBeInTheDocument();
    expect(screen.getByText("Validation")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "octocat/bisect-demo" })
      ).toBeInTheDocument();
    });

    expect(screen.getByText("No Active Session Selected")).toBeInTheDocument();
    expect(screen.getByText("No Activity Recorded")).toBeInTheDocument();
  });

  it("dispatches agent task and displays session inspector & activity timeline", async () => {
    vi.spyOn(repoApi.repositoriesApi, "getRepositories").mockResolvedValueOnce({
      items: mockRepos,
      total: 1,
      limit: 100,
      offset: 0,
    });

    const createSessionSpy = vi
      .spyOn(sessionApi.sessionsApi, "createSession")
      .mockResolvedValueOnce(mockCreatedSession);

    vi.spyOn(sessionApi, "getSession").mockResolvedValue(mockCreatedSession);
    vi.spyOn(sessionApi, "getSessionEvents").mockResolvedValue({
      items: [
        {
          id: "evt-1",
          session_id: "session-abc-123",
          sequence: 1,
          category: "execution" as const,
          event_type: "command_completed",
          level: "info",
          summary: "Command pytest tests/test_core.py completed",
          payload: {
            iteration: 1,
            result: {
              action_type: "run_command" as const,
              command: "pytest tests/test_core.py",
              exit_code: 1,
              stdout: "FAILED tests/test_core.py::test_core",
              stderr: "",
              duration_seconds: 0.85,
              timed_out: false,
            },
          },
          created_at: "2026-09-25T12:00:01Z",
        },
      ],
      total: 1,
      limit: 100,
      after_sequence: 0,
      last_sequence: 1,
    });

    render(
      <AuthProvider>
        <WorkspacePage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "octocat/bisect-demo" })
      ).toBeInTheDocument();
    });

    const promptInput = screen.getByPlaceholderText(/e\.g\. Identify failing test/i);
    fireEvent.change(promptInput, {
      target: { value: "Diagnose failing assertion in tests/test_core.py" },
    });

    const startBtn = screen.getByRole("button", { name: /Start Task/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(createSessionSpy).toHaveBeenCalledWith({
        task_prompt: "Diagnose failing assertion in tests/test_core.py",
        repository_id: "repo-1",
      });
    });

    await waitFor(() => {
      expect(screen.getByText("session-abc-123")).toBeInTheDocument();
      expect(screen.getAllByText("RUNNING").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("950")).toBeInTheDocument(); // total tokens
      expect(
        screen.getByText("Command pytest tests/test_core.py completed")
      ).toBeInTheDocument();
      expect(screen.getByText("Execution")).toBeInTheDocument();
    });
  });

  it("handles repository sync action", async () => {
    vi.spyOn(repoApi.repositoriesApi, "getRepositories").mockResolvedValueOnce({
      items: [],
      total: 0,
      limit: 100,
      offset: 0,
    });

    const syncSpy = vi
      .spyOn(repoApi.repositoriesApi, "syncRepositories")
      .mockResolvedValueOnce({
        synced_count: 1,
        repositories: mockRepos,
      });

    render(
      <AuthProvider>
        <WorkspacePage />
      </AuthProvider>
    );

    const syncBtn = screen.getByRole("button", { name: /Sync Repos/i });
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalledTimes(1);
      expect(
        screen.getByRole("heading", { name: "octocat/bisect-demo" })
      ).toBeInTheDocument();
    });
  });

  it("offers the refresh control before any session exists", async () => {
    vi.spyOn(repoApi.repositoriesApi, "getRepositories").mockResolvedValueOnce({
      items: mockRepos,
      total: 1,
      limit: 100,
      offset: 0,
    });

    render(
      <AuthProvider>
        <WorkspacePage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "octocat/bisect-demo" })
      ).toBeInTheDocument();
    });

    // The control is present from first paint rather than appearing only once a
    // run exists, and it is disabled because there is nothing to refresh yet.
    const refresh = screen.getByRole("button", { name: "Refresh session" });
    expect(refresh).toBeInTheDocument();
    expect(refresh).toBeDisabled();
  });

  it("leaves prior session state visible when a manual refresh fails", async () => {
    vi.spyOn(repoApi.repositoriesApi, "getRepositories").mockResolvedValueOnce({
      items: mockRepos,
      total: 1,
      limit: 100,
      offset: 0,
    });
    vi.spyOn(sessionApi.sessionsApi, "createSession").mockResolvedValueOnce(
      mockCreatedSession
    );
    vi.spyOn(sessionApi, "getSession").mockResolvedValue(mockCreatedSession);

    render(
      <AuthProvider>
        <WorkspacePage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "octocat/bisect-demo" })
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Identify failing test/i), {
      target: { value: "Diagnose failing assertion" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Start Task/i }));

    await waitFor(() => {
      expect(screen.getByText("session-abc-123")).toBeInTheDocument();
    });

    // The next refresh fails; the session already on screen must survive.
    vi.spyOn(sessionApi, "getSession").mockRejectedValue(
      new Error("backend unreachable")
    );

    const refresh = screen.getByRole("button", { name: "Refresh session" });
    await waitFor(() => expect(refresh).toBeEnabled());
    fireEvent.click(refresh);

    await waitFor(() => {
      expect(screen.getByText(/backend unreachable/)).toBeInTheDocument();
    });
    expect(screen.getByText("session-abc-123")).toBeInTheDocument();

    // And the control stays usable so the user can try again.
    expect(refresh).toBeEnabled();
  });

  it("maps timed_out session status to failed validation in status summary", async () => {
    vi.spyOn(repoApi.repositoriesApi, "getRepositories").mockResolvedValueOnce({
      items: mockRepos,
      total: 1,
      limit: 100,
      offset: 0,
    });

    const timedOutSession: AgentSession = {
      ...mockCreatedSession,
      status: "timed_out",
    };

    vi.spyOn(sessionApi.sessionsApi, "createSession").mockResolvedValueOnce(
      timedOutSession
    );
    vi.spyOn(sessionApi, "getSession").mockResolvedValue(timedOutSession);

    render(
      <AuthProvider>
        <WorkspacePage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "octocat/bisect-demo" })
      ).toBeInTheDocument();
    });

    const promptInput = screen.getByPlaceholderText(/e\.g\. Identify failing test/i);
    fireEvent.change(promptInput, {
      target: { value: "Run long running diagnosis" },
    });

    const startBtn = screen.getByRole("button", { name: /Start Task/i });
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(screen.getByText("TIMED_OUT")).toBeInTheDocument();
      expect(screen.getByText("FAILED")).toBeInTheDocument();
    });
  });

  it("surfaces a session load error without a non-functioning dismiss button", async () => {
    vi.spyOn(repoApi.repositoriesApi, "getRepositories").mockResolvedValueOnce({
      items: mockRepos,
      total: 1,
      limit: 100,
      offset: 0,
    });

    vi.spyOn(sessionApi.sessionsApi, "createSession").mockResolvedValueOnce(
      mockCreatedSession
    );
    vi.spyOn(sessionApi, "getSession").mockRejectedValue(
      new Error("Network connection dropped")
    );

    render(
      <AuthProvider>
        <WorkspacePage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "octocat/bisect-demo" })
      ).toBeInTheDocument();
    });

    const promptInput = screen.getByPlaceholderText(/e\.g\. Identify failing test/i);
    fireEvent.change(promptInput, {
      target: { value: "Trigger session network error" },
    });

    const startBtn = screen.getByRole("button", { name: /Start Task/i });
    fireEvent.click(startBtn);

    // The poll fetches on mount, but under parallel load the rejection can
    // land after waitFor's 1s default, making this assertion flaky.
    // The session card owns the session-load failure, so it renders the error
    // state rather than a separate page banner duplicating it.
    await waitFor(
      () => {
        expect(
          screen.getByText("Could not load session")
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    expect(
      screen.getByText("Network connection dropped")
    ).toBeInTheDocument();

    // A persistent fetch failure must not offer a dismiss button that would
    // only hide the error without fixing it.
    expect(
      screen.queryByRole("button", { name: /Dismiss error/i })
    ).not.toBeInTheDocument();
  });
});
