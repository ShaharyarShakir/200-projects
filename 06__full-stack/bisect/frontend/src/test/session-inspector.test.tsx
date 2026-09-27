import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import React from "react";
import { SessionCard } from "../components/workspace/SessionCard";
import { ActivityFeed } from "../components/workspace/ActivityFeed";
import { useSessionPoll } from "../lib/hooks/useSessionPoll";
import { AgentSession, SessionEvent } from "../lib/api/types";
import * as sessionApi from "../lib/api/sessions";

const mockRunningSession: AgentSession = {
  id: "sess-12345",
  owner_id: "user-1",
  repository_id: null,
  task_prompt: "Fix failing pytest unit test in test_engine.py",
  status: "running",
  iteration_count: 2,
  executed_action_count: 2,
  created_at: "2026-09-25T10:00:00Z",
  started_at: "2026-09-25T10:00:05Z",
  completed_at: null,
  termination_reason: null,
  prompt_tokens: 1500,
  completion_tokens: 350,
  total_tokens: 1850,
  steps: [
    {
      iteration: 1,
      raw_response: "I will run pytest to identify the failing assertion.",
      execution_id: "exec-001",
      duration_seconds: 1.25,
      action: {
        action: "run_command",
        command: "pytest tests/test_engine.py",
      },
      result: {
        action_type: "run_command",
        command: "pytest tests/test_engine.py",
        exit_code: 1,
        stdout: "FAILED tests/test_engine.py::test_eval - AssertionError: expected 42 got 0",
        stderr: "",
        duration_seconds: 1.25,
        timed_out: false,
      },
    },
    {
      iteration: 2,
      raw_response: "I will inspect test_engine.py to locate the error.",
      execution_id: "exec-002",
      duration_seconds: 0.45,
      action: {
        action: "inspect_file",
        path: "tests/test_engine.py",
      },
      result: {
        action_type: "inspect_file",
        path: "tests/test_engine.py",
        exists: true,
        size_bytes: 512,
        content: "def test_eval():\n    assert engine.compute() == 42",
      },
    },
  ],
};

/** Named makeEvent to avoid colliding with the DOM `Event` global. */
function makeEvent(overrides: Partial<SessionEvent> = {}): SessionEvent {
  return {
    id: "evt-1",
    session_id: "sess-12345",
    sequence: 1,
    category: "system",
    event_type: "session_started",
    level: "info",
    summary: "Session started",
    payload: {},
    created_at: "2026-09-25T10:00:05Z",
    ...overrides,
  };
}

const CATEGORY_LABEL: Record<SessionEvent["category"], string> = {
  system: "System",
  agent: "Agent",
  execution: "Execution",
  validation: "Validation",
  success: "Success",
  warning: "Warning",
  error: "Error",
};

const mockCompletedSession: AgentSession = {
  ...mockRunningSession,
  id: "sess-completed",
  status: "completed",
  iteration_count: 3,
  executed_action_count: 3,
  completed_at: "2026-09-25T10:01:05Z",
  termination_reason: "Goal accomplished and verified with test suite.",
  steps: [
    ...mockRunningSession.steps,
    {
      iteration: 3,
      raw_response: "Finished applying fix.",
      execution_id: "exec-003",
      duration_seconds: 0.1,
      action: {
        action: "finish",
        message: "Bug in engine.compute resolved.",
        success: true,
      },
      result: {
        action_type: "finish",
        message: "Bug in engine.compute resolved.",
        success: true,
      },
    },
  ],
};

describe("SessionCard Component", () => {
  it("renders empty state when session is null", () => {
    render(<SessionCard session={null} />);
    expect(screen.getByText("No Active Session Selected")).toBeInTheDocument();
  });

  it("renders loading skeleton when isLoading is true", () => {
    const { container } = render(<SessionCard session={null} isLoading={true} />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders active session metrics correctly", () => {
    render(<SessionCard session={mockRunningSession} />);

    expect(screen.getByText("sess-12345")).toBeInTheDocument();
    expect(
      screen.getByText("Fix failing pytest unit test in test_engine.py")
    ).toBeInTheDocument();
    expect(screen.getByText("RUNNING")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBe(2); // Iteration count & Actions Executed
    expect(screen.getByText("1,850")).toBeInTheDocument(); // Total tokens
  });

  it("renders completed session with termination reason", () => {
    render(<SessionCard session={mockCompletedSession} />);

    expect(screen.getByText("COMPLETED")).toBeInTheDocument();
    expect(screen.getByText("Termination Reason:")).toBeInTheDocument();
    expect(
      screen.getByText("Goal accomplished and verified with test suite.")
    ).toBeInTheDocument();
  });
});

describe("ActivityFeed Component", () => {
  const events: SessionEvent[] = [
    {
      id: "evt-1",
      session_id: "sess-12345",
      sequence: 1,
      category: "system",
      event_type: "session_started",
      level: "info",
      summary: "Session started with max_iterations=10",
      payload: { max_iterations: 10, task_prompt: "Fix failing pytest" },
      created_at: "2026-09-25T10:00:05Z",
    },
    {
      id: "evt-2",
      session_id: "sess-12345",
      sequence: 2,
      category: "execution",
      event_type: "command_completed",
      level: "info",
      summary: "Command exited with code 1",
      payload: {
        iteration: 1,
        duration_seconds: 1.25,
        action: { action: "run_command", command: "pytest tests/test_engine.py" },
        result: {
          action_type: "run_command",
          command: "pytest tests/test_engine.py",
          exit_code: 1,
          stdout: "FAILED tests/test_engine.py::test_eval - AssertionError",
          stderr: "",
          duration_seconds: 1.25,
          timed_out: false,
        },
      },
      created_at: "2026-09-25T10:00:06Z",
    },
    {
      id: "evt-3",
      session_id: "sess-12345",
      sequence: 3,
      category: "error",
      event_type: "action_validation_failed",
      level: "error",
      summary: "Action failed schema validation",
      payload: { error: "Missing required field: command" },
      created_at: "2026-09-25T10:00:07Z",
    },
    {
      id: "evt-4",
      session_id: "sess-12345",
      sequence: 4,
      category: "execution",
      event_type: "file_inspected",
      level: "info",
      summary: "Inspected tests/test_engine.py",
      payload: {
        result: {
          action_type: "inspect_file",
          path: "tests/test_engine.py",
          exists: true,
          size_bytes: 512,
          content: "def test_eval():\n    assert engine.compute() == 42",
        },
      },
      created_at: "2026-09-25T10:00:08Z",
    },
  ];

  it("renders an empty state when no events are present", () => {
    render(<ActivityFeed events={[]} />);
    expect(screen.getByText("No Activity Recorded")).toBeInTheDocument();
  });

  it("renders a loading state while events are in flight", () => {
    const { container } = render(<ActivityFeed events={[]} isLoading />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders an error state with a retry affordance", () => {
    const onRetry = vi.fn();
    render(
      <ActivityFeed events={[]} error="Event service unavailable" onRetry={onRetry} />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Event service unavailable")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders each event by its server-assigned category and level", () => {
    render(<ActivityFeed events={events} />);

    expect(screen.getByText("Activity & Execution Feed")).toBeInTheDocument();
    expect(screen.getByText("4 events")).toBeInTheDocument();
    expect(screen.getByText("seq 1–4")).toBeInTheDocument();

    expect(screen.getByText("Session started with max_iterations=10")).toBeInTheDocument();
    expect(screen.getByText("Command exited with code 1")).toBeInTheDocument();
    expect(screen.getByText("Action failed schema validation")).toBeInTheDocument();
    expect(screen.getByText("Inspected tests/test_engine.py")).toBeInTheDocument();

    // The category badge is the machine-readable contract, not the summary text.
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getAllByText("Execution")).toHaveLength(2);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("expands an execution event to show the command result", () => {
    render(<ActivityFeed events={events} />);

    const rows = screen.getAllByRole("button", { name: /Command exited/ });
    fireEvent.click(rows[0]);

    expect(screen.getByText("Exit Code: 1")).toBeInTheDocument();
    // The raw payload viewer also contains this text, so match the formatted
    // block rather than requiring a single occurrence.
    expect(
      screen.getAllByText(/FAILED tests\/test_engine.py::test_eval/).length
    ).toBeGreaterThan(0);
  });

  it("expands an execution event to show inspected file details", () => {
    render(<ActivityFeed events={events} />);

    const rows = screen.getAllByRole("button", { name: /Inspected/ });
    fireEvent.click(rows[0]);

    expect(screen.getByText("512 bytes")).toBeInTheDocument();
    expect(screen.getAllByText(/def test_eval\(\)/).length).toBeGreaterThan(0);
  });

  it("expands an error event to show the payload error", () => {
    render(<ActivityFeed events={events} />);

    fireEvent.click(screen.getByRole("button", { name: /schema validation/ }));

    expect(screen.getByText("Execution Error")).toBeInTheDocument();
    expect(
      screen.getByText("Missing required field: command")
    ).toBeInTheDocument();
  });

  it("toggles an event row with the keyboard", () => {
    render(<ActivityFeed events={events} />);

    const row = screen.getByRole("button", { name: /Command exited/ });
    expect(row).toHaveAttribute("aria-expanded", "false");

    fireEvent.keyDown(row, { key: "Enter" });
    expect(row).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(row, { key: " " });
    expect(row).toHaveAttribute("aria-expanded", "false");
  });

  it("does not offer expansion for an event with no payload", () => {
    const payloadless: SessionEvent[] = [
      {
        id: "evt-bare",
        session_id: "sess-12345",
        sequence: 1,
        category: "system",
        event_type: "session_started",
        level: "info",
        summary: "Session started",
        payload: null,
        created_at: "2026-09-25T10:00:05Z",
      },
    ];

    render(<ActivityFeed events={payloadless} />);

    expect(screen.getByText("Session started")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders every category distinctly", () => {
    const categories: SessionEvent["category"][] = [
      "system",
      "agent",
      "execution",
      "validation",
      "success",
      "warning",
      "error",
    ];
    const oneOfEach: SessionEvent[] = categories.map((category, index) =>
      makeEvent({
        id: `evt-${category}`,
        sequence: index + 1,
        category,
        event_type: `${category}_event`,
        summary: `summary for ${category}`,
      })
    );

    render(<ActivityFeed events={oneOfEach} />);

    for (const category of categories) {
      expect(screen.getByText(`summary for ${category}`)).toBeInTheDocument();
      // A dedicated label per category, so no two read the same.
      expect(screen.getAllByText(CATEGORY_LABEL[category]).length).toBe(1);
    }
    expect(
      new Set(
        categories.map(
          (category) =>
            screen.getByText(CATEGORY_LABEL[category]).className
        )
      ).size
    ).toBe(categories.length);
  });

  it("shows no raw provider response text", () => {
    // The step-based feed exposed the model's raw completion. Events carry only
    // what the backend chose to record, so provider text cannot leak here.
    const withRawLookalike = makeEvent({
      category: "agent",
      event_type: "llm_completion_received",
      summary: "Model returned a response",
      payload: { message: "server-recorded text" },
    });

    render(<ActivityFeed events={[withRawLookalike]} />);

    expect(screen.queryByText(/View Model Response/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hide Model Response/)).not.toBeInTheDocument();
    expect(screen.queryByText(/raw_response/)).not.toBeInTheDocument();
  });

  it("reports a single event in the singular", () => {
    render(<ActivityFeed events={[events[0]]} />);
    expect(screen.getByText("1 event")).toBeInTheDocument();
  });
});

describe("useSessionPoll Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches session on initial mount and polls while running", async () => {
    const getSessionSpy = vi
      .spyOn(sessionApi, "getSession")
      .mockResolvedValueOnce(mockRunningSession)
      .mockResolvedValueOnce(mockCompletedSession);

    const { result } = renderHook(() =>
      useSessionPoll("sess-123", { intervalMs: 2000 })
    );

    // Let initial fetch resolve
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(getSessionSpy).toHaveBeenCalledWith("sess-123");
    expect(result.current.session?.status).toBe("running");

    // Advance timer by 2000ms to trigger next polling tick
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(getSessionSpy).toHaveBeenCalledTimes(2);
    expect(result.current.session?.status).toBe("completed");
  });

  it("halts polling when terminal status is reached", async () => {
    const onTerminalStatus = vi.fn();
    const getSessionSpy = vi
      .spyOn(sessionApi, "getSession")
      .mockResolvedValueOnce(mockCompletedSession);

    const { result } = renderHook(() =>
      useSessionPoll("sess-123", {
        intervalMs: 2000,
        onTerminalStatus,
      })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(getSessionSpy).toHaveBeenCalledTimes(1);
    expect(result.current.session?.status).toBe("completed");
    expect(onTerminalStatus).toHaveBeenCalledWith(mockCompletedSession);

    // Advance time further, no more calls should happen
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });

    expect(getSessionSpy).toHaveBeenCalledTimes(1);
  });

  it("discards outdated in-flight responses when polling stops", async () => {
    let resolveSlowFetch!: (value: AgentSession) => void;
    const slowPromise = new Promise<AgentSession>((resolve) => {
      resolveSlowFetch = resolve;
    });

    vi.spyOn(sessionApi, "getSession").mockImplementation(() => slowPromise);

    const { result } = renderHook(() =>
      useSessionPoll("sess-slow", { intervalMs: 2000 })
    );

    expect(result.current.isLoading).toBe(true);

    // Stop polling before slow promise resolves
    act(() => {
      result.current.stopPolling();
    });

    // Now resolve slow promise
    await act(async () => {
      resolveSlowFetch(mockRunningSession);
      await vi.advanceTimersByTimeAsync(0);
    });

    // Since polling was stopped (generation incremented), session state is not overwritten
    expect(result.current.session).toBeNull();
  });
});
