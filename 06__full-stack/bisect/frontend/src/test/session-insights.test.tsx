import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SessionInsightsPanel } from "../components/workspace/SessionInsightsPanel";
import {
  deriveCurrentOperation,
  deriveLifecycle,
  deriveSessionIssues,
  deriveValidationState,
  VALIDATION_LABEL,
} from "../lib/session-insights";
import { AgentSession, SessionEvent, SessionStatus } from "../lib/api/types";

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

function renderPanel(sessionValue: AgentSession | null, events: SessionEvent[]) {
  return render(
    <SessionInsightsPanel session={sessionValue} events={events} />
  );
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

describe("deriveValidationState", () => {
  it("is not_run with no session", () => {
    expect(deriveValidationState(null, [])).toBe("not_run");
  });

  it("is validating while a run is in progress with no rejected actions", () => {
    expect(deriveValidationState(session(), [])).toBe("validating");
  });

  it("is not_run for a created session that has not started", () => {
    expect(
      deriveValidationState(
        session({ status: "created", started_at: null }),
        []
      )
    ).toBe("not_run");
  });

  it("is passed for a completed run whose events recorded no rejection", () => {
    const completed = session({
      status: "completed",
      completed_at: "2026-01-01T10:01:00Z",
    });
    const events = [
      event({ category: "system", event_type: "loop_started" }),
      event({ category: "success", event_type: "loop_completed" }),
    ];
    expect(deriveValidationState(completed, events)).toBe("passed");
  });

  it("is issues, not passed, when a completed run recorded a rejected action", () => {
    // The distinguishing case: a green status that hid a real validation problem.
    const completed = session({
      status: "completed",
      completed_at: "2026-01-01T10:01:00Z",
    });
    const events = [
      event({
        category: "validation",
        event_type: "action_validation_error",
        level: "error",
        summary: "Action failed validation",
      }),
      event({ category: "success", event_type: "loop_completed" }),
    ];
    expect(deriveValidationState(completed, events)).toBe("issues");
  });

  it("is issues while a run continues past a rejected action", () => {
    const events = [
      event({
        category: "validation",
        event_type: "action_parse_error",
        summary: "Could not parse action",
      }),
    ];
    expect(deriveValidationState(session(), events)).toBe("issues");
  });

  it.each<SessionStatus>(["failed", "terminated"])(
    "is failed for a %s run that recorded an error",
    (status) => {
      const events = [
        event({
          category: "error",
          event_type: "provider_failure",
          level: "error",
          summary: "Provider request failed",
        }),
      ];
      expect(deriveValidationState(session({ status }), events)).toBe("failed");
    }
  );

  it("is issues for a failed run whose events show no specific error", () => {
    expect(deriveValidationState(session({ status: "failed" }), [])).toBe(
      "issues"
    );
  });

  it("is failed for a timed_out run", () => {
    expect(deriveValidationState(session({ status: "timed_out" }), [])).toBe(
      "failed"
    );
  });
});

describe("deriveSessionIssues", () => {
  it("returns error and warning events, most recent first", () => {
    const events = [
      event({ category: "system", event_type: "loop_started" }),
      event({
        category: "warning",
        event_type: "max_iterations_reached",
        level: "warning",
        summary: "Reached the iteration bound",
      }),
      event({
        category: "error",
        event_type: "loop_timeout",
        level: "error",
        summary: "Run exceeded its time budget",
        payload: { error: "budget exhausted" },
      }),
    ];

    const issues = deriveSessionIssues(events);
    expect(issues).toHaveLength(2);
    expect(issues[0].eventType).toBe("loop_timeout");
    expect(issues[0].detail).toBe("budget exhausted");
    expect(issues[1].eventType).toBe("max_iterations_reached");
  });

  it("ignores categories that are not errors or warnings", () => {
    const events = [
      event({ category: "success" }),
      event({ category: "validation" }),
      event({ category: "execution" }),
    ];
    expect(deriveSessionIssues(events)).toHaveLength(0);
  });
});

describe("deriveCurrentOperation", () => {
  it("is null for a finished run", () => {
    expect(
      deriveCurrentOperation(session({ status: "completed" }), [event()])
    ).toBeNull();
  });

  it("names the command the run is executing", () => {
    const running = event({
      category: "execution",
      event_type: "action_executed",
      payload: {
        result: {
          action_type: "run_command",
          command: "pytest tests/test_core.py",
          exit_code: 0,
          stdout: "",
          stderr: "",
          duration_seconds: 1,
          timed_out: false,
        },
      },
    });
    expect(deriveCurrentOperation(session(), [running])).toBe(
      "Running: pytest tests/test_core.py"
    );
  });

  it("names the file the run is inspecting", () => {
    const inspecting = event({
      category: "execution",
      event_type: "action_dispatched",
      payload: {
        action: { action: "inspect_file", path: "tests/test_core.py" },
      },
    });
    expect(deriveCurrentOperation(session(), [inspecting])).toBe(
      "Inspecting: tests/test_core.py"
    );
  });

  it("falls back to the latest summary", () => {
    const latest = event({
      category: "agent",
      event_type: "llm_completion_received",
      summary: "Model returned a response",
    });
    expect(deriveCurrentOperation(session(), [latest])).toBe(
      "Model returned a response"
    );
  });

  it("reports waiting when no events have been recorded yet", () => {
    expect(deriveCurrentOperation(session(), [])).toBe(
      "Waiting for the first event"
    );
  });
});

describe("deriveLifecycle", () => {
  it("marks only the milestones whose events exist", () => {
    const events = [
      event({ category: "system", event_type: "loop_started" }),
      event({ category: "agent", event_type: "iteration_started" }),
    ];
    const milestones = deriveLifecycle(
      session({ iteration_count: 0, executed_action_count: 0 }),
      events
    );
    const byKey = Object.fromEntries(
      milestones.map((milestone) => [milestone.key, milestone.reached])
    );

    expect(byKey.created).toBe(true);
    expect(byKey.started).toBe(true);
    expect(byKey.iterating).toBe(true);
    expect(byKey.executed).toBe(false);
    expect(byKey.finished).toBe(false);
  });

  it("reaches the executed milestone from the persisted counter alone", () => {
    // The counter is backend data, so it is sufficient even with no events.
    const milestones = deriveLifecycle(
      session({ executed_action_count: 3 }),
      []
    );
    expect(
      milestones.find((milestone) => milestone.key === "executed")?.reached
    ).toBe(true);
  });

  it("reaches the executed milestone from an event alone", () => {
    const milestones = deriveLifecycle(
      session({ executed_action_count: 0 }),
      [event({ category: "execution", event_type: "action_executed" })]
    );
    expect(
      milestones.find((milestone) => milestone.key === "executed")?.reached
    ).toBe(true);
  });

  it("marks the run finished on any terminal status", () => {
    for (const status of ["completed", "failed", "terminated", "timed_out"] as const) {
      const milestones = deriveLifecycle(session({ status }), []);
      const finished = milestones.find((m) => m.key === "finished");
      expect(finished?.reached).toBe(true);
    }
  });
});

describe("SessionInsightsPanel", () => {
  it("renders an explicit empty state without a session", () => {
    renderPanel(null, []);
    expect(screen.getByText("No run to inspect")).toBeInTheDocument();
  });

  it("shows the derived validation state and its label", () => {
    renderPanel(
      session({ status: "completed", completed_at: "2026-01-01T10:01:00Z" }),
      [event({ category: "validation", summary: "Action failed validation" })]
    );
    expect(screen.getByText(VALIDATION_LABEL.issues)).toBeInTheDocument();
  });

  it("shows the current operation for a running session", () => {
    renderPanel(session(), [
      event({
        category: "execution",
        event_type: "action_executed",
        payload: {
          result: {
            action_type: "run_command",
            command: "pytest -q",
            exit_code: 0,
            stdout: "",
            stderr: "",
            duration_seconds: 1,
            timed_out: false,
          },
        },
      }),
    ]);
    expect(screen.getByText("Running: pytest -q")).toBeInTheDocument();
  });

  it("reports no operation in progress once the run has finished", () => {
    renderPanel(session({ status: "completed" }), []);
    expect(screen.getByText("No operation in progress")).toBeInTheDocument();
  });

  it("lists recorded errors with their payload detail", () => {
    renderPanel(session({ status: "failed" }), [
      event({
        category: "error",
        event_type: "loop_timeout",
        level: "error",
        summary: "Run exceeded its time budget",
        payload: { error: "budget exhausted" },
      }),
    ]);

    expect(screen.getByText("Run exceeded its time budget")).toBeInTheDocument();
    expect(screen.getByText("budget exhausted")).toBeInTheDocument();
  });

  it("says so when nothing went wrong", () => {
    renderPanel(session(), [event({ category: "system" })]);
    expect(
      screen.getByText("No errors or warnings recorded.")
    ).toBeInTheDocument();
  });

  it("marks the finished milestone only for a terminal status", () => {
    const { unmount } = renderPanel(session(), []);
    expect(screen.getByText("Run finished").closest("li")).toHaveAttribute(
      "data-reached",
      "false"
    );
    unmount();

    renderPanel(session({ status: "completed" }), []);
    expect(screen.getByText("Run finished").closest("li")).toHaveAttribute(
      "data-reached",
      "true"
    );
  });
});
