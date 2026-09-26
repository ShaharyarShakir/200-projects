/**
 * Derives what a session is doing from the events the backend recorded.
 *
 * The workspace used to infer everything from `session.status`, which cannot
 * distinguish a run that is mid-iteration from one that is stuck after a
 * rejected action, and cannot say why a run failed. The backend already labels
 * every event with a category and a level, so these helpers read that instead of
 * re-deriving an outcome from the status alone.
 */

import {
  AgentSession,
  SessionEvent,
  SessionEventCategory,
  SessionStatus,
} from "./api/types";
import { isTerminalStatus } from "./session-format";

/** Whether the run's output has been accepted, rejected, or is not known yet. */
export type ValidationState =
  | "not_run"
  | "validating"
  | "passed"
  | "issues"
  | "failed";

export const VALIDATION_LABEL: Record<ValidationState, string> = {
  not_run: "Not run",
  validating: "Validating",
  passed: "Passed",
  issues: "Completed with issues",
  failed: "Failed",
};

/** An error or warning the run recorded, with the event that carried it. */
export interface SessionIssue {
  sequence: number;
  category: SessionEventCategory;
  eventType: string;
  level: string;
  summary: string;
  detail?: string;
  createdAt: string;
}

/** A point on a session's lifecycle, derived from the events that mark it. */
export interface LifecycleMilestone {
  key: string;
  label: string;
  at: string;
  reached: boolean;
}

const ERROR_CATEGORIES: SessionEventCategory[] = ["error", "warning"];
const VALIDATION_CATEGORIES: SessionEventCategory[] = ["validation"];

/**
 * The run's validation state.
 *
 * `status` only breaks the tie: a session marked `failed` that never recorded a
 * specific error event still has to read as failed, while a `completed` run whose
 * events show rejected actions reads as "completed with issues" rather than
 * silently clean.
 */
export function deriveValidationState(
  session: AgentSession | null,
  events: SessionEvent[]
): ValidationState {
  if (!session) return "not_run";

  const hasValidationIssue = events.some((event) =>
    VALIDATION_CATEGORIES.includes(event.category)
  );
  const hasError = events.some((event) =>
    ERROR_CATEGORIES.includes(event.category)
  );

  if (session.status === "completed") {
    return hasValidationIssue ? "issues" : "passed";
  }
  if (session.status === "failed" || session.status === "terminated") {
    return hasError ? "failed" : "issues";
  }
  if (session.status === "timed_out") {
    return "failed";
  }
  if (session.status === "running") {
    return hasValidationIssue ? "issues" : "validating";
  }
  return hasValidationIssue ? "issues" : "not_run";
}

/** Errors and warnings, most recent first. */
export function deriveSessionIssues(events: SessionEvent[]): SessionIssue[] {
  return events
    .filter((event) => ERROR_CATEGORIES.includes(event.category))
    .map((event) => ({
      sequence: event.sequence,
      category: event.category,
      eventType: event.event_type,
      level: event.level,
      summary: event.summary,
      detail: event.payload?.error,
      createdAt: event.created_at,
    }))
    .reverse();
}

/** Actions the validator rejected, oldest first, so the retry pattern is visible. */
export function deriveValidationEvents(events: SessionEvent[]): SessionEvent[] {
  return events.filter((event) =>
    VALIDATION_CATEGORIES.includes(event.category)
  );
}

/**
 * A short description of what the agent is doing right now.
 *
 * Taken from the most recent event rather than assumed from the status, so a run
 * that is `running` but has stopped emitting events is described as idle instead
 * of pretending to be mid-command.
 */
export function deriveCurrentOperation(
  session: AgentSession | null,
  events: SessionEvent[]
): string | null {
  if (!session) return null;
  if (isTerminalStatus(session.status)) return null;
  if (events.length === 0) return "Waiting for the first event";

  const last = events[events.length - 1];
  const command = commandOf(last);
  if (command) return `Running: ${command}`;

  const inspectedPath = inspectedPathOf(last);
  if (inspectedPath) return `Inspecting: ${inspectedPath}`;

  return last.summary;
}

function commandOf(event: SessionEvent): string | null {
  const result = event.payload?.result;
  if (result && result.action_type === "run_command") return result.command;
  const action = event.payload?.action;
  if (action && action.action === "run_command") return action.command;
  return null;
}

function inspectedPathOf(event: SessionEvent): string | null {
  const result = event.payload?.result;
  if (result && result.action_type === "inspect_file") return result.path;
  const action = event.payload?.action;
  if (action && action.action === "inspect_file") return action.path;
  return null;
}

/**
 * The session's lifecycle, as milestones the recorded events have reached.
 *
 * Each milestone is marked reached only when an event that means it actually
 * occurred is present, so the track shows real progress rather than a guess from
 * the status.
 */
export function deriveLifecycle(
  session: AgentSession | null,
  events: SessionEvent[]
): LifecycleMilestone[] {
  const reached = (predicate: (event: SessionEvent) => boolean) =>
    events.some(predicate);

  const milestones: LifecycleMilestone[] = [
    {
      key: "created",
      label: "Session created",
      at: session?.created_at ?? "",
      reached: Boolean(session),
    },
    {
      key: "started",
      label: "Loop started",
      at:
        events.find((event) => event.event_type === "loop_started")
          ?.created_at ??
        session?.started_at ??
        "",
      reached:
        Boolean(session?.started_at) ||
        reached((event) => event.event_type === "loop_started"),
    },
    {
      key: "iterating",
      label: "First iteration",
      at:
        events.find((event) => event.event_type === "iteration_started")
          ?.created_at ?? "",
      reached:
        session !== null && session.iteration_count > 0
          ? true
          : reached((event) => event.event_type === "iteration_started"),
    },
    {
      key: "executed",
      label: "Action executed",
      at:
        events.find((event) => event.event_type === "action_executed")
          ?.created_at ?? "",
      reached:
        session !== null && session.executed_action_count > 0
          ? true
          : reached((event) => event.event_type === "action_executed"),
    },
    {
      key: "finished",
      label: "Run finished",
      at: session?.completed_at ?? "",
      reached: session !== null && isTerminalStatus(session.status),
    },
  ];

  return milestones;
}

/** True when the backend marked the run as finished, whatever the outcome. */
export function hasFinished(session: AgentSession | null): boolean {
  return session !== null && isTerminalStatus(session.status);
}

/** Statuses that mean the run stopped because of a fault rather than success. */
export function isFaultStatus(status: SessionStatus): boolean {
  return (
    status === "failed" || status === "terminated" || status === "timed_out"
  );
}
