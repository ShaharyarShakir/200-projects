import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";
import SessionsPage from "../app/sessions/page";
import { AuthProvider } from "../lib/auth/useAuth";
import { listSessions } from "../lib/api/sessions";
import { listRepositories } from "../lib/api/repositories";
import { AgentSession } from "../lib/api/types";

vi.mock("../lib/api/sessions", () => ({
  listSessions: vi.fn(),
}));

vi.mock("../lib/api/repositories", () => ({
  listRepositories: vi.fn(),
}));

// This suite exercises the archive's data states, not the auth gate, which
// RequireAuth's own suite covers.
vi.mock("../components/auth/RequireAuth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/sessions",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockListSessions = listSessions as unknown as ReturnType<typeof vi.fn>;
const mockListRepositories = listRepositories as unknown as ReturnType<
  typeof vi.fn
>;

/** The page renders inside AppShell, whose header needs an auth context. */
function renderPage() {
  return render(
    <AuthProvider>
      <SessionsPage />
    </AuthProvider>
  );
}

const REPO_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_REPO_ID = "22222222-2222-2222-2222-222222222222";

function session(overrides: Partial<AgentSession> = {}): AgentSession {
  return {
    id: "aaaaaaaa-1111-2222-3333-444444444444",
    owner_id: "owner-1",
    repository_id: REPO_ID,
    task_prompt: "Bisect the failing assertion between v1.2.0 and HEAD",
    status: "completed",
    iteration_count: 5,
    executed_action_count: 4,
    created_at: "2026-01-01T10:00:00Z",
    started_at: "2026-01-01T10:00:01Z",
    completed_at: "2026-01-01T10:00:43Z",
    termination_reason: "finish",
    steps: [],
    prompt_tokens: 1000,
    completion_tokens: 3210,
    total_tokens: 4210,
    ...overrides,
  };
}

function page(items: AgentSession[], overrides = {}) {
  return {
    items,
    total: items.length,
    limit: 20,
    offset: 0,
    ...overrides,
  };
}

describe("SessionsPage against the real list endpoint", () => {
  beforeEach(() => {
    localStorage.clear();
    mockListSessions.mockReset();
    mockListRepositories.mockReset();
    mockListRepositories.mockResolvedValue({
      items: [
        {
          id: REPO_ID,
          github_repo_id: 1,
          full_name: "octocat/bisect-demo",
          default_branch: "main",
          clone_url: "https://example.invalid/repo.git",
          is_private: false,
          owner_id: "owner-1",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        {
          id: OTHER_REPO_ID,
          github_repo_id: 2,
          full_name: "octocat/other-service",
          default_branch: "main",
          clone_url: "https://example.invalid/other.git",
          is_private: true,
          owner_id: "owner-1",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
      total: 2,
      limit: 100,
      offset: 0,
    });
  });

  it("renders real rows returned by listSessions", async () => {
    mockListSessions.mockResolvedValue(
      page([
        session(),
        session({
          id: "bbbbbbbb-1111-2222-3333-444444444444",
          task_prompt: "Diagnose the streaming timeout recovery path",
          status: "failed",
          iteration_count: 2,
          total_tokens: 1420,
        }),
      ])
    );

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/Bisect the failing assertion/)
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Diagnose the streaming timeout recovery path/)
    ).toBeInTheDocument();

    // Real fields, not the old sample shape. Scoped to the first row because
    // both fixtures share a duration.
    const firstRow = screen
      .getByText(/Bisect the failing assertion/)
      .closest("tr") as HTMLElement;
    expect(within(firstRow).getByText("5 steps")).toBeInTheDocument();
    expect(within(firstRow).getByText("4,210")).toBeInTheDocument();
    expect(within(firstRow).getByText("42s")).toBeInTheDocument();
    expect(within(firstRow).getByText("Completed")).toBeInTheDocument();

    const secondRow = screen
      .getByText(/Diagnose the streaming timeout recovery path/)
      .closest("tr") as HTMLElement;
    expect(within(secondRow).getByText("Failed")).toBeInTheDocument();
  });

  it("shows no sample rows once the endpoint returns nothing", async () => {
    mockListSessions.mockResolvedValue(page([]));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No Sessions Yet")).toBeInTheDocument();
    });

    // Every trace of the fabricated archive must be gone.
    expect(screen.queryByText("sess-8f12a")).not.toBeInTheDocument();
    expect(screen.queryByText("sess-7e09b")).not.toBeInTheDocument();
    expect(screen.queryByText("sess-6d88c")).not.toBeInTheDocument();
    expect(screen.queryByText("sess-5c77d")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Claude 3\.7 Sonnet/)
    ).not.toBeInTheDocument();
    expect(screen.queryByText("octocat/bisect-demo", { selector: "span" }))
      .not.toBeInTheDocument();
    expect(screen.getByText("Total Runs: 0")).toBeInTheDocument();
  });

  it("distinguishes a filtered empty result from an empty archive", async () => {
    mockListSessions.mockResolvedValue(page([]));

    renderPage();
    await waitFor(() => {
      expect(screen.getByText("No Sessions Yet")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Search sessions"), {
      target: { value: "nothing" },
    });
    await waitFor(() => {
      expect(screen.getByText("No Matching Sessions Found")).toBeInTheDocument();
    });
  });

  it("re-queries the backend when the status filter changes", async () => {
    mockListSessions.mockResolvedValue(page([]));
    renderPage();
    await waitFor(() => expect(mockListSessions).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "running" },
    });

    await waitFor(() => {
      expect(mockListSessions).toHaveBeenCalledTimes(2);
    });
    expect(mockListSessions.mock.calls[1][0]).toEqual({
      limit: 20,
      status: "running",
      repository_id: undefined,
    });
  });

  it("re-queries the backend when the repository filter changes", async () => {
    mockListSessions.mockResolvedValue(page([]));
    renderPage();
    await waitFor(() => expect(mockListSessions).toHaveBeenCalledTimes(1));

    const select = await screen.findByLabelText("Filter by repository");
    await waitFor(() => {
      expect(
        within(select).getByRole("option", { name: "octocat/bisect-demo" })
      ).toBeInTheDocument();
    });
    fireEvent.change(select, { target: { value: REPO_ID } });

    await waitFor(() => {
      expect(mockListSessions).toHaveBeenCalledTimes(2);
    });
    expect(mockListSessions.mock.calls[1][0]).toEqual({
      limit: 20,
      status: undefined,
      repository_id: REPO_ID,
    });
  });

  it("filters the loaded page by prompt, session id, and repository name", async () => {
    mockListSessions.mockResolvedValue(
      page([
        session({ task_prompt: "fix the retry backoff" }),
        session({
          id: "cccccccc-9999-8888-7777-666666666666",
          repository_id: OTHER_REPO_ID,
          task_prompt: "unrelated work",
        }),
      ])
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("fix the retry backoff")).toBeInTheDocument();
    });

    const search = screen.getByLabelText("Search sessions");

    fireEvent.change(search, { target: { value: "retry" } });
    await waitFor(() => {
      expect(screen.queryByText("unrelated work")).not.toBeInTheDocument();
    });
    expect(screen.getByText("fix the retry backoff")).toBeInTheDocument();

    fireEvent.change(search, { target: { value: "ccccccc" } });
    await waitFor(() => {
      expect(screen.getByText("unrelated work")).toBeInTheDocument();
    });
    expect(screen.queryByText("fix the retry backoff")).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "other-service" } });
    await waitFor(() => {
      expect(screen.getByText("unrelated work")).toBeInTheDocument();
    });
  });

  it("resolves a repository id to its name", async () => {
    mockListSessions.mockResolvedValue(page([session()]));
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("octocat/bisect-demo", { selector: "span" })
      ).toBeInTheDocument();
    });
  });

  it("still renders the row when the repository lookup fails", async () => {
    mockListRepositories.mockRejectedValue(new Error("repos unavailable"));
    mockListSessions.mockResolvedValue(
      page([session({ repository_id: null })])
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No repository")).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Bisect the failing assertion/)
    ).toBeInTheDocument();
  });

  it("surfaces a failed load and can retry", async () => {
    mockListSessions.mockRejectedValueOnce(new Error("backend unavailable"));
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("backend unavailable")).toBeInTheDocument();
    expect(screen.queryByText("No Sessions Yet")).not.toBeInTheDocument();

    mockListSessions.mockResolvedValue(page([session()]));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Bisect the failing assertion/)
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("links each row to that session's activity feed", async () => {
    mockListSessions.mockResolvedValue(page([session()]));
    renderPage();

    const link = await screen.findByRole("link", { name: /Inspect/ });
    expect(link).toHaveAttribute(
      "href",
      `/activity?session_id=${session().id}`
    );
  });

  it("ignores a stale response for a filter the user already changed", async () => {
    let resolveStale: (value: ReturnType<typeof page>) => void = () => {};
    mockListSessions.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveStale = resolve;
        })
    );

    renderPage();

    // The user switches status while the first request is still in flight.
    mockListSessions.mockResolvedValueOnce(
      page([
        session({
          id: "running-session",
          status: "running",
          task_prompt: "row for the running filter",
        }),
      ])
    );
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "running" },
    });

    await waitFor(() => {
      expect(screen.getByText("row for the running filter")).toBeInTheDocument();
    });

    // The abandoned response lands last; it must not replace the filtered rows.
    resolveStale(page([session({ task_prompt: "stale unfiltered row" })]));
    await waitFor(() => {
      expect(
        screen.queryByText("stale unfiltered row")
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText("row for the running filter")).toBeInTheDocument();
  });

  it("shows a live region while loading", async () => {
    let resolveSlow: (value: ReturnType<typeof page>) => void = () => {};
    mockListSessions.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSlow = resolve;
        })
    );

    renderPage();

    expect(await screen.findByText("Loading sessions…")).toBeInTheDocument();

    resolveSlow(page([session()]));
    await waitFor(() => {
      expect(screen.queryByText("Loading sessions…")).not.toBeInTheDocument();
    });
  });

  it("renders every terminal and non-terminal status the backend persists", async () => {
    const statuses: AgentSession["status"][] = [
      "created",
      "running",
      "completed",
      "failed",
      "terminated",
      "timed_out",
    ];
    mockListSessions.mockResolvedValue(
      page(
        statuses.map((status, index) =>
          session({
            id: `session-${index}`,
            status,
            task_prompt: `task for ${status}`,
          })
        )
      )
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("task for timed_out")).toBeInTheDocument();
    });
    for (const status of statuses) {
      expect(screen.getByText(`task for ${status}`)).toBeInTheDocument();
      expect(
        screen.getAllByText(statusLabelFor(status)).length
      ).toBeGreaterThan(0);
    }
  });
});

function statusLabelFor(status: AgentSession["status"]): string {
  const labels: Record<AgentSession["status"], string> = {
    created: "Created",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
    terminated: "Terminated",
    timed_out: "Timed out",
  };
  return labels[status];
}
