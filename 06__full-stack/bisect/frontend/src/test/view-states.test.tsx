import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SessionCard } from "../components/workspace/SessionCard";
import { ActivityFeed } from "../components/workspace/ActivityFeed";
import { SessionInsightsPanel } from "../components/workspace/SessionInsightsPanel";
import { WorkspaceHeader } from "../components/workspace/WorkspaceHeader";
import { AgentSession, RepositoryRead, SessionEvent } from "../lib/api/types";

/**
 * Task 6.5: every one of these four views must have a real loading, empty,
 * error, and success state. A view that renders nothing for three of those
 * cases is indistinguishable from one that is broken, and "empty" is not the
 * same as "still loading".
 *
 * Also covers the in-flight rule: a request for *different* parameters must
 * clear prior data rather than showing the previous session's numbers under a
 * new session's heading, while a *failed refresh* of the same parameters holds
 * the last known data and says so.
 */

function session(overrides: Partial<AgentSession> = {}): AgentSession {
  return {
    id: "sess-1",
    owner_id: "owner-1",
    repository_id: "repo-1",
    task_prompt: "Fix the failing test",
    status: "running",
    iteration_count: 2,
    executed_action_count: 1,
    created_at: "2026-01-01T10:00:00Z",
    started_at: "2026-01-01T10:00:01Z",
    completed_at: null,
    termination_reason: null,
    steps: [],
    prompt_tokens: 10,
    completion_tokens: 20,
    total_tokens: 30,
    ...overrides,
  };
}

let sequence = 0;

function event(overrides: Partial<SessionEvent> = {}): SessionEvent {
  sequence += 1;
  return {
    id: `evt-${sequence}`,
    session_id: "sess-1",
    sequence,
    category: "system",
    event_type: "loop_started",
    level: "info",
    summary: "Loop started",
    payload: {},
    created_at: "2026-01-01T10:00:01Z",
    ...overrides,
  };
}

function repo(overrides: Partial<RepositoryRead> = {}): RepositoryRead {
  return {
    id: "repo-1",
    github_repo_id: 4242,
    owner_id: "owner-1",
    full_name: "acme/widgets",
    default_branch: "main",
    clone_url: "https://github.com/acme/widgets.git",
    is_private: false,
    created_at: "2026-01-01T09:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...overrides,
  };
}

describe("6.5 session inspector states", () => {
  it("loading state is distinguishable from empty", () => {
    const { rerender } = render(<SessionCard session={null} isLoading />);

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(
      screen.queryByText(/no active session/i)
    ).not.toBeInTheDocument();

    rerender(<SessionCard session={null} isLoading={false} />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText(/no active session/i)).toBeInTheDocument();
  });

  it("empty state names the missing session", () => {
    render(<SessionCard session={null} isLoading={false} />);

    expect(screen.getByText(/no active session/i)).toBeInTheDocument();
  });

  it("error state offers a retry", () => {
    const onRetry = vi.fn();
    render(
      <SessionCard
        session={null}
        isLoading={false}
        error="Not found"
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Not found");
    screen.getByRole("button", { name: /try again/i }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("success state shows the session's real values", () => {
    render(
      <SessionCard session={session({ task_prompt: "Repair the runner" })} />
    );

    expect(screen.getByText("Session Inspector")).toBeInTheDocument();
    expect(screen.getByText("Repair the runner")).toBeInTheDocument();
  });

  it("holds prior data on a failed refresh but never presents it as fresh", () => {
    render(
      <SessionCard
        session={session()}
        error="Gateway timeout"
        onRetry={() => {}}
      />
    );

    // The session survives...
    expect(screen.getByText(/2 iterations|iteration/i)).toBeInTheDocument();
    // ...and the failure is visible alongside it.
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Gateway timeout");
    expect(alert).toHaveTextContent(/last known session/i);
  });

  it("clears prior data when a different session is requested", () => {
    const { rerender } = render(<SessionCard session={session()} />);
    expect(screen.getByText("Fix the failing test")).toBeInTheDocument();

    // New parameters, still loading: the old session's prompt must be gone.
    rerender(<SessionCard session={null} isLoading />);
    expect(screen.queryByText("Fix the failing test")).not.toBeInTheDocument();
  });
});

describe("6.5 activity feed states", () => {
  it("loading state is distinguishable from empty", () => {
    const { rerender } = render(<ActivityFeed events={[]} isLoading />);

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(
      screen.queryByText(/no activity recorded/i)
    ).not.toBeInTheDocument();

    rerender(<ActivityFeed events={[]} isLoading={false} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText(/no activity recorded/i)).toBeInTheDocument();
  });

  it("empty state says there are no events yet", () => {
    render(<ActivityFeed events={[]} />);
    expect(screen.getByText(/no activity recorded/i)).toBeInTheDocument();
  });

  it("error state surfaces the message", () => {
    render(<ActivityFeed events={[]} error="Event stream unavailable" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Event stream unavailable"
    );
  });

  it("success state renders the events", () => {
    render(<ActivityFeed events={[event({ summary: "Validation passed" })]} />);
    expect(screen.getByText("Validation passed")).toBeInTheDocument();
  });

  it("clears prior events when a different session is requested", () => {
    const { rerender } = render(
      <ActivityFeed events={[event({ summary: "Old session event" })]} />
    );
    expect(screen.getByText("Old session event")).toBeInTheDocument();

    rerender(<ActivityFeed events={[]} isLoading />);
    expect(screen.queryByText("Old session event")).not.toBeInTheDocument();
  });
});

describe("6.5 validation panel states", () => {
  it("loading state is distinguishable from empty", () => {
    const { rerender } = render(
      <SessionInsightsPanel session={null} events={[]} isLoading />
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText(/no run to inspect/i)).not.toBeInTheDocument();

    rerender(<SessionInsightsPanel session={null} events={[]} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText(/no run to inspect/i)).toBeInTheDocument();
  });

  it("empty state prompts the user to start a task", () => {
    render(<SessionInsightsPanel session={null} events={[]} />);
    expect(screen.getByText(/no run to inspect/i)).toBeInTheDocument();
  });

  it("error state surfaces the message", () => {
    render(
      <SessionInsightsPanel session={null} events={[]} error="Session missing" />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Session missing");
  });

  it("success state derives validation from real events", () => {
    render(
      <SessionInsightsPanel
        session={session()}
        events={[event({ category: "validation", event_type: "test_run", summary: "12 passed" })]}
      />
    );

    expect(screen.getByText(/validation/i)).toBeInTheDocument();
    expect(screen.getByText("12 passed")).toBeInTheDocument();
  });

  it("clears prior insight when a different session is requested", () => {
    const { rerender } = render(
      <SessionInsightsPanel
        session={session()}
        events={[event({ category: "validation", summary: "Old validation" })]}
      />
    );
    expect(screen.getByText("Old validation")).toBeInTheDocument();

    rerender(<SessionInsightsPanel session={null} events={[]} isLoading />);
    expect(screen.queryByText("Old validation")).not.toBeInTheDocument();
  });
});

describe("6.5 repository selector states", () => {
  it("loading state is distinguishable from empty", () => {
    const { rerender } = render(
      <WorkspaceHeader
        repositories={[]}
        selectedRepo={null}
        onSelectRepo={() => {}}
        onSyncRepos={async () => {}}
        isLoading
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(/loading repositories/i);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(
      <WorkspaceHeader
        repositories={[]}
        selectedRepo={null}
        onSelectRepo={() => {}}
        onSyncRepos={async () => {}}
      />
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText(/no repositories connected/i)).toBeInTheDocument();
  });

  it("empty state tells the user to sync", () => {
    render(
      <WorkspaceHeader
        repositories={[]}
        selectedRepo={null}
        onSelectRepo={() => {}}
        onSyncRepos={async () => {}}
      />
    );

    expect(screen.getByText(/no repositories connected/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Repository Selector")
    ).not.toBeInTheDocument();
  });

  it("error state shows the message inline", () => {
    render(
      <WorkspaceHeader
        repositories={[]}
        selectedRepo={null}
        onSelectRepo={() => {}}
        onSyncRepos={async () => {}}
        error="GitHub token rejected"
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent("GitHub token rejected");
    expect(screen.getByText(/could not load repositories/i)).toBeInTheDocument();
  });

  it("success state offers a real select with the repository", () => {
    render(
      <WorkspaceHeader
        repositories={[repo()]}
        selectedRepo={repo()}
        onSelectRepo={() => {}}
        onSyncRepos={async () => {}}
      />
    );

    const select = screen.getByLabelText("Repository Selector");
    expect(select).toBeInTheDocument();
    expect(
      within(select).getByRole("option", { name: "acme/widgets" })
    ).toBeInTheDocument();
    expect(screen.getByText("Public Repository")).toBeInTheDocument();
  });

  it("keeps a working selector when an error is present with cached repositories", () => {
    render(
      <WorkspaceHeader
        repositories={[repo()]}
        selectedRepo={repo()}
        onSelectRepo={() => {}}
        onSyncRepos={async () => {}}
        error="Could not reach GitHub"
      />
    );

    // The alert is present...
    expect(screen.getByRole("alert")).toBeInTheDocument();
    // ...but the user can still pick from what is already loaded.
    expect(screen.getByLabelText("Repository Selector")).toBeInTheDocument();
  });
});
