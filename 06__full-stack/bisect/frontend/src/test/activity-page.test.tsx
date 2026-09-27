import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
} from "@testing-library/react";
import React from "react";
import ActivityPage from "../app/activity/page";
import { AuthProvider } from "../lib/auth/useAuth";
import {
  getSession,
  getSessionEvents,
  listAllSessionEvents,
  listSessions,
} from "../lib/api/sessions";
import { AgentSession, SessionEvent } from "../lib/api/types";

vi.mock("../lib/api/sessions", () => ({
  getSession: vi.fn(),
  getSessionEvents: vi.fn(),
  listAllSessionEvents: vi.fn(),
  listSessions: vi.fn(),
}));

vi.mock("@/components/auth/RequireAuth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockGetSession = getSession as unknown as ReturnType<typeof vi.fn>;
const mockGetSessionEvents = getSessionEvents as unknown as ReturnType<typeof vi.fn>;
const mockListAllSessionEvents = listAllSessionEvents as unknown as ReturnType<
  typeof vi.fn
>;
const mockListSessions = listSessions as unknown as ReturnType<typeof vi.fn>;

let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => "/activity",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => searchParams,
}));

const SESSION_ID = "11111111-aaaa-bbbb-cccc-dddddddddddd";

function renderPage() {
  return render(
    <AuthProvider>
      <ActivityPage />
    </AuthProvider>
  );
}

function session(overrides: Partial<AgentSession> = {}): AgentSession {
  return {
    id: SESSION_ID,
    owner_id: "owner-1",
    repository_id: "repo-1",
    task_prompt: "Bisect the failing assertion",
    status: "completed",
    iteration_count: 2,
    executed_action_count: 1,
    created_at: "2026-01-01T10:00:00Z",
    started_at: "2026-01-01T10:00:01Z",
    completed_at: "2026-01-01T10:00:43Z",
    termination_reason: "finish",
    steps: [],
    prompt_tokens: 100,
    completion_tokens: 200,
    total_tokens: 300,
    ...overrides,
  };
}

function event(overrides: Partial<SessionEvent> = {}): SessionEvent {
  return {
    id: "evt-1",
    session_id: SESSION_ID,
    sequence: 1,
    category: "system",
    event_type: "session_started",
    level: "info",
    summary: "Session started",
    payload: { max_iterations: 10 },
    created_at: "2026-01-01T10:00:01Z",
    ...overrides,
  };
}

function eventPage(items: SessionEvent[]) {
  return {
    items,
    total: items.length,
    limit: 100,
    after_sequence: 0,
    last_sequence: items.length > 0 ? items[items.length - 1].sequence : null,
  };
}

describe("ActivityPage follows a single session's events", () => {
  beforeEach(() => {
    localStorage.clear();
    searchParams = new URLSearchParams();
    mockGetSession.mockReset();
    mockGetSessionEvents.mockReset();
    mockListAllSessionEvents.mockReset();
    mockListSessions.mockReset();
    // The aggregate feed is read on mount, so it needs a settled value even in
    // the single-session tests to keep the page from reporting a load failure.
    mockListAllSessionEvents.mockResolvedValue(eventPage([]));
    mockListSessions.mockResolvedValue({
      items: [session(), session({ id: "other-session", task_prompt: "Other run" })],
      total: 2,
      limit: 25,
      offset: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("prompts for a session when none is selected", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No Session Selected")).toBeInTheDocument();
    });
    expect(mockGetSessionEvents).not.toHaveBeenCalled();
  });

  it("renders the selected session's events", async () => {
    searchParams = new URLSearchParams(`session_id=${SESSION_ID}`);
    mockGetSession.mockResolvedValue(session());
    mockGetSessionEvents.mockResolvedValue(
      eventPage([
        event(),
        event({
          id: "evt-2",
          sequence: 2,
          category: "execution",
          event_type: "command_completed",
          summary: "Ran pytest",
          payload: {
            iteration: 1,
            result: {
              action_type: "run_command",
              command: "pytest",
              exit_code: 0,
              stdout: "1 passed",
              stderr: "",
              duration_seconds: 2,
              timed_out: false,
            },
          },
        }),
      ])
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Session started")).toBeInTheDocument();
    });
    expect(screen.getByText("Ran pytest")).toBeInTheDocument();
    expect(screen.getByText("2 events")).toBeInTheDocument();
    expect(screen.getByText("seq 1–2")).toBeInTheDocument();
    expect(mockGetSession).toHaveBeenCalledWith(SESSION_ID);
    expect(mockGetSessionEvents).toHaveBeenCalledWith(SESSION_ID, { limit: 100 });
  });

  it("shows a loading state before the first events arrive", async () => {
    searchParams = new URLSearchParams(`session_id=${SESSION_ID}`);
    let resolveEvents: (value: ReturnType<typeof eventPage>) => void = () => {};
    mockGetSession.mockResolvedValue(session());
    mockGetSessionEvents.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveEvents = resolve;
        })
    );

    renderPage();

    expect(await screen.findByRole("status")).toBeInTheDocument();

    resolveEvents(eventPage([event()]));
    await waitFor(() => {
      expect(screen.getByText("Session started")).toBeInTheDocument();
    });
  });

  it("shows an empty state for a session with no events", async () => {
    searchParams = new URLSearchParams(`session_id=${SESSION_ID}`);
    mockGetSession.mockResolvedValue(session({ status: "created" }));
    mockGetSessionEvents.mockResolvedValue(eventPage([]));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("No Events Recorded")).toBeInTheDocument();
    });
  });

  it("shows an error state when the session cannot be loaded", async () => {
    searchParams = new URLSearchParams(`session_id=${SESSION_ID}`);
    mockGetSession.mockRejectedValue(new Error("Session not found"));
    mockGetSessionEvents.mockResolvedValue(eventPage([]));

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("Session not found")).toBeInTheDocument();
  });

  it("shows an error state when the events cannot be loaded", async () => {
    searchParams = new URLSearchParams(`session_id=${SESSION_ID}`);
    mockGetSession.mockResolvedValue(session());
    mockGetSessionEvents.mockRejectedValue(new Error("Event store offline"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("Event store offline")).toBeInTheDocument();
  });

  it("retries after an event load failure", async () => {
    searchParams = new URLSearchParams(`session_id=${SESSION_ID}`);
    mockGetSession.mockResolvedValue(session());
    mockGetSessionEvents.mockRejectedValueOnce(new Error("Event store offline"));

    renderPage();
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    mockGetSessionEvents.mockResolvedValue(eventPage([event()]));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(screen.getByText("Session started")).toBeInTheDocument();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("switches sessions from the picker and discards the previous feed", async () => {
    searchParams = new URLSearchParams(`session_id=${SESSION_ID}`);
    mockGetSession.mockResolvedValue(session());
    mockGetSessionEvents.mockResolvedValue(
      eventPage([event({ summary: "First session event" })])
    );

    renderPage();
    await waitFor(() => {
      expect(screen.getByText("First session event")).toBeInTheDocument();
    });

    mockGetSession.mockResolvedValue(session({ id: "other-session" }));
    mockGetSessionEvents.mockResolvedValue(
      eventPage([
        event({
          id: "evt-other",
          session_id: "other-session",
          summary: "Second session event",
        }),
      ])
    );

    const picker = await screen.findByLabelText("Select a session");
    await waitFor(() => {
      expect(
        within(picker).getByRole("option", { name: /Other run/ })
      ).toBeInTheDocument();
    });
    fireEvent.change(picker, { target: { value: "other-session" } });

    await waitFor(() => {
      expect(screen.getByText("Second session event")).toBeInTheDocument();
    });
    // Interleaving two runs' sequences would misrepresent both.
    expect(screen.queryByText("First session event")).not.toBeInTheDocument();
  });

  it("does not poll events for a terminal session", async () => {
    // waitFor does not advance fake timers, so the initial load is flushed by
    // advancing explicitly instead.
    vi.useFakeTimers();
    searchParams = new URLSearchParams(`session_id=${SESSION_ID}`);
    mockGetSession.mockResolvedValue(session({ status: "completed" }));
    mockGetSessionEvents.mockResolvedValue(eventPage([event()]));

    renderPage();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockGetSessionEvents).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });
    expect(mockGetSessionEvents).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Session started")).toBeInTheDocument();
  });

  it("appends new events for a running session", async () => {
    searchParams = new URLSearchParams(`session_id=${SESSION_ID}`);
    mockGetSession.mockResolvedValue(session({ status: "running" }));
    mockGetSessionEvents.mockResolvedValue(eventPage([event()]));

    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Session started")).toBeInTheDocument();
    });
    expect(screen.getByText("1 event")).toBeInTheDocument();

    // The next tick returns only what landed after the last sequence.
    mockGetSessionEvents.mockResolvedValue(
      eventPage([
        event({
          id: "evt-2",
          sequence: 2,
          category: "success",
          event_type: "session_completed",
          summary: "Session completed successfully",
        }),
      ])
    );

    await waitFor(
      () => {
        expect(
          screen.getByText("Session completed successfully")
        ).toBeInTheDocument();
      },
      { timeout: 12000 }
    );

    expect(screen.getByText("2 events")).toBeInTheDocument();
    const call = mockGetSessionEvents.mock.calls.at(-1);
    expect(call?.[1]).toEqual({ after_sequence: 1, limit: 100 });
  });

  it("shows the selected session's status and counters", async () => {
    searchParams = new URLSearchParams(`session_id=${SESSION_ID}`);
    mockGetSession.mockResolvedValue(session());
    mockGetSessionEvents.mockResolvedValue(eventPage([event()]));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });
    expect(screen.getByText("2 iterations")).toBeInTheDocument();
    expect(screen.getByText("ended: finish")).toBeInTheDocument();
  });

  it("ignores a stale event response after switching sessions", async () => {
    searchParams = new URLSearchParams(`session_id=${SESSION_ID}`);
    let resolveStale: (value: ReturnType<typeof eventPage>) => void = () => {};
    mockGetSession.mockResolvedValue(session());
    mockGetSessionEvents.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveStale = resolve;
        })
    );

    renderPage();

    mockGetSession.mockResolvedValue(session({ id: "other-session" }));
    mockGetSessionEvents.mockResolvedValue(
      eventPage([
        event({
          id: "evt-other",
          session_id: "other-session",
          summary: "Current session event",
        }),
      ])
    );
    fireEvent.change(await screen.findByLabelText("Select a session"), {
      target: { value: "other-session" },
    });

    await waitFor(() => {
      expect(screen.getByText("Current session event")).toBeInTheDocument();
    });

    resolveStale(eventPage([event({ summary: "Stale first event" })]));
    await waitFor(() => {
      expect(screen.queryByText("Stale first event")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Current session event")).toBeInTheDocument();
  });
});

const OTHER_SESSION_ID = "22222222-eeee-ffff-0000-111111111111";

function crossSessionPage(items: SessionEvent[]) {
  return {
    items,
    total: items.length,
    limit: 200,
    after_sequence: 0,
    // Null because a merged feed has no single resumable cursor.
    last_sequence: null,
  };
}

describe("ActivityPage aggregates events across the caller's sessions", () => {
  beforeEach(() => {
    localStorage.clear();
    searchParams = new URLSearchParams();
    mockGetSession.mockReset();
    mockGetSessionEvents.mockReset();
    mockListAllSessionEvents.mockReset();
    mockListSessions.mockReset();
    mockListSessions.mockResolvedValue({
      items: [
        session(),
        session({ id: OTHER_SESSION_ID, task_prompt: "Second run" }),
      ],
      total: 2,
      limit: 25,
      offset: 0,
    });
    mockGetSessionEvents.mockResolvedValue(eventPage([]));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("merges events from several sessions oldest first", async () => {
    mockListAllSessionEvents.mockResolvedValue(
      crossSessionPage([
        event({
          id: "evt-a1",
          session_id: SESSION_ID,
          sequence: 1,
          summary: "First run started",
          created_at: "2026-01-01T10:00:00Z",
        }),
        event({
          id: "evt-b1",
          session_id: OTHER_SESSION_ID,
          sequence: 1,
          summary: "Second run started",
          created_at: "2026-01-02T10:00:00Z",
        }),
        event({
          id: "evt-b2",
          session_id: OTHER_SESSION_ID,
          sequence: 2,
          summary: "Second run finished",
          created_at: "2026-01-02T10:05:00Z",
        }),
      ])
    );

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /All sessions/ }));

    await waitFor(() => {
      expect(screen.getByText("Second run finished")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole("listitem");
    const summaries = rows.map((row) => row.textContent ?? "");
    expect(summaries[0]).toContain("First run started");
    expect(summaries[2]).toContain("Second run finished");

    // Requests every owned session: no call carries a session filter.
    for (const call of mockListAllSessionEvents.mock.calls) {
      const params = call[0] as { session_id?: string };
      expect(params.session_id).toBeUndefined();
    }
  });

  it("labels every row with the session it came from", async () => {
    mockListAllSessionEvents.mockResolvedValue(
      crossSessionPage([
        event({
          id: "evt-a1",
          session_id: SESSION_ID,
          summary: "First run started",
        }),
        event({
          id: "evt-b1",
          session_id: OTHER_SESSION_ID,
          summary: "Second run started",
        }),
      ])
    );

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /All sessions/ }));

    await waitFor(() => {
      expect(screen.getByText("Second run started")).toBeInTheDocument();
    });

    // The labels come from the session list, so each row is attributable.
    const rows = screen.getAllByRole("listitem");
    expect(rows[0].textContent).toContain("11111111");
    expect(rows[1].textContent).toContain("22222222");
  });

  it("does not present the per-session sequences as one range", async () => {
    mockListAllSessionEvents.mockResolvedValue(
      crossSessionPage([
        event({ id: "evt-a3", session_id: SESSION_ID, sequence: 3 }),
        event({
          id: "evt-b1",
          session_id: OTHER_SESSION_ID,
          sequence: 1,
          summary: "Another run started",
        }),
      ])
    );

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /All sessions/ }));

    await waitFor(() => {
      expect(screen.getByText("Another run started")).toBeInTheDocument();
    });
    // "seq 3–1" would be nonsense: the counter restarts per session.
    expect(screen.queryByText(/seq 3–1/)).not.toBeInTheDocument();
  });

  it("keeps one row's expansion from toggling another's", async () => {
    // Both events are sequence 1 in different sessions, which is exactly the
    // collision a per-sequence expansion key would get wrong.
    mockListAllSessionEvents.mockResolvedValue(
      crossSessionPage([
        event({
          id: "evt-a1",
          session_id: SESSION_ID,
          sequence: 1,
          summary: "First run started",
          payload: { max_iterations: 10 },
        }),
        event({
          id: "evt-b1",
          session_id: OTHER_SESSION_ID,
          sequence: 1,
          summary: "Second run started",
          payload: { max_iterations: 20 },
        }),
      ])
    );

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /All sessions/ }));

    await waitFor(() => {
      expect(screen.getByText("Second run started")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole("listitem");
    fireEvent.click(rows[0].querySelector('[role="button"]') as HTMLElement);

    await waitFor(() => {
      expect(
        within(rows[0] as HTMLElement).getByText("View event payload")
      ).toBeInTheDocument();
    });
    expect(
      within(rows[1] as HTMLElement).queryByText("View event payload")
    ).not.toBeInTheDocument();
  });

  it("shows a loading state before the aggregate arrives", async () => {
    let resolveAggregate: (value: ReturnType<typeof crossSessionPage>) => void = () => {};
    mockListAllSessionEvents.mockReturnValue(
      new Promise((resolve) => {
        resolveAggregate = resolve as typeof resolveAggregate;
      })
    );

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /All sessions/ }));

    await waitFor(() => {
      expect(screen.getByText("Loading events…")).toBeInTheDocument();
    });

    resolveAggregate(crossSessionPage([event({ summary: "Late event" })]));
    await waitFor(() => {
      expect(screen.getByText("Late event")).toBeInTheDocument();
    });
  });

  it("shows an empty state when no session has recorded anything", async () => {
    mockListAllSessionEvents.mockResolvedValue(crossSessionPage([]));

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /All sessions/ }));

    await waitFor(() => {
      expect(
        screen.getByText("No Activity Across Sessions")
      ).toBeInTheDocument();
    });
  });

  it("shows an error with a working retry", async () => {
    mockListAllSessionEvents.mockRejectedValueOnce(
      new Error("aggregate feed unavailable")
    );

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /All sessions/ }));

    await waitFor(() => {
      expect(screen.getByText("aggregate feed unavailable")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Could not load activity")
    ).toBeInTheDocument();

    mockListAllSessionEvents.mockResolvedValue(
      crossSessionPage([event({ summary: "Recovered event" })])
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(screen.getByText("Recovered event")).toBeInTheDocument();
    });
  });

  it("switches back to a single session and narrows the request", async () => {
    mockGetSession.mockResolvedValue(session());
    mockGetSessionEvents.mockResolvedValue(
      eventPage([event({ summary: "Only this session" })])
    );
    mockListAllSessionEvents.mockResolvedValue(
      crossSessionPage([event({ id: "evt-b1", session_id: OTHER_SESSION_ID })])
    );

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /All sessions/ }));
    await waitFor(() => {
      expect(mockListAllSessionEvents).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText("Select a session"), {
      target: { value: SESSION_ID },
    });

    await waitFor(() => {
      expect(screen.getByText("Only this session")).toBeInTheDocument();
    });
    // The aggregate rows are gone, not shown alongside the single-session feed.
    expect(mockListAllSessionEvents).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("heading", { name: "All Sessions Activity" })
    ).not.toBeInTheDocument();
  });

  it("keeps the single-session mode reading only that session's feed", async () => {
    mockGetSession.mockResolvedValue(session());
    mockGetSessionEvents.mockResolvedValue(
      eventPage([event({ summary: "Session only event" })])
    );
    mockListAllSessionEvents.mockResolvedValue(crossSessionPage([]));

    searchParams = new URLSearchParams(`session_id=${SESSION_ID}`);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Session only event")).toBeInTheDocument();
    });
    // The single-session feed is still read by session id and cursor, not
    // through the aggregate route.
    expect(mockGetSessionEvents).toHaveBeenCalledWith(SESSION_ID, { limit: 100 });
  });
});
