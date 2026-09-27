/**
 * Decoders that narrow a captured backend response to the TypeScript contracts.
 *
 * A JSON import widens `"running"` to `string` and `"system"` to `string`, so
 * assigning the raw fixture to a contract with a union-typed field does not
 * compile and proves nothing. Taking `unknown` and returning the contract makes
 * the check real in both directions: the return type forces the contracts to
 * accept what the backend actually sent, and a decoder that throws forces them
 * to keep matching.
 *
 * Every read goes through a narrowing helper, so a missing or wrongly typed
 * field fails loudly here instead of becoming `undefined` in a component.
 */

import {
  AgentSession,
  BisectCommitRead,
  BisectOutcome,
  SessionEvent,
  SessionEventCategory,
  SessionEventListResponse,
  SessionListResponse,
  SessionPatchRead,
  SessionTimelineRead,
} from "../../lib/api/types";

export class FixtureDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FixtureDecodeError";
  }
}

function fail(path: string, expectation: string, actual: unknown): never {
  throw new FixtureDecodeError(
    `${path}: expected ${expectation}, got ${JSON.stringify(actual)}`
  );
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "an object", value);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, "an array", value);
  return value;
}

function str(value: unknown, path: string): string {
  if (typeof value !== "string") fail(path, "a string", value);
  return value;
}

function optionalStr(value: unknown, path: string): string | null {
  if (value === null || value === undefined) return null;
  return str(value, path);
}

function num(value: unknown, path: string): number {
  if (typeof value !== "number") fail(path, "a number", value);
  return value;
}

function bool(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") fail(path, "a boolean", value);
  return value;
}

function optionalNum(value: unknown, path: string): number | null {
  if (value === null || value === undefined) return null;
  return num(value, path);
}

const SESSION_STATUSES = [
  "created",
  "running",
  "completed",
  "failed",
  "terminated",
  "timed_out",
] as const;

function sessionStatus(value: unknown, path: string): AgentSession["status"] {
  const text = str(value, path);
  const match = SESSION_STATUSES.find((status) => status === text);
  if (!match) {
    fail(path, `one of ${SESSION_STATUSES.join(" | ")}`, value);
  }
  return match;
}

const EVENT_CATEGORIES = [
  "system",
  "agent",
  "execution",
  "validation",
  "success",
  "warning",
  "error",
] as const;

function eventCategory(value: unknown, path: string): SessionEventCategory {
  const text = str(value, path);
  const match = EVENT_CATEGORIES.find((category) => category === text);
  if (!match) {
    fail(path, `one of ${EVENT_CATEGORIES.join(" | ")}`, value);
  }
  return match;
}

/**
 * Decode a loop step.
 *
 * `action` and `result` stay loosely typed on purpose: the backend stores the
 * agent's raw unvalidated output there when validation fails, so no closed union
 * would be truthful. Every other field is checked.
 */
function decodeStep(value: unknown, path: string): AgentSession["steps"][number] {
  const record = asRecord(value, path);
  const action = record.action;
  const result = record.result;
  return {
    iteration: num(record.iteration, `${path}.iteration`),
    raw_response: str(record.raw_response, `${path}.raw_response`),
    execution_id: optionalStr(record.execution_id, `${path}.execution_id`),
    action:
      typeof action === "object" && action !== null
        ? (action as AgentSession["steps"][number]["action"])
        : null,
    result:
      typeof result === "object" && result !== null
        ? (result as AgentSession["steps"][number]["result"])
        : null,
    error: optionalStr(record.error, `${path}.error`),
    duration_seconds: num(record.duration_seconds, `${path}.duration_seconds`),
  };
}

export function decodeSession(value: unknown, path = "session"): AgentSession {
  const record = asRecord(value, path);
  return {
    id: str(record.id, `${path}.id`),
    owner_id: str(record.owner_id, `${path}.owner_id`),
    repository_id: optionalStr(record.repository_id, `${path}.repository_id`),
    task_prompt: str(record.task_prompt, `${path}.task_prompt`),
    status: sessionStatus(record.status, `${path}.status`),
    iteration_count: num(record.iteration_count, `${path}.iteration_count`),
    executed_action_count: num(
      record.executed_action_count,
      `${path}.executed_action_count`
    ),
    created_at: str(record.created_at, `${path}.created_at`),
    started_at: optionalStr(record.started_at, `${path}.started_at`),
    completed_at: optionalStr(record.completed_at, `${path}.completed_at`),
    termination_reason: optionalStr(
      record.termination_reason,
      `${path}.termination_reason`
    ),
    steps: asArray(record.steps, `${path}.steps`).map((step, index) =>
      decodeStep(step, `${path}.steps[${index}]`)
    ),
    prompt_tokens: num(record.prompt_tokens, `${path}.prompt_tokens`),
    completion_tokens: num(record.completion_tokens, `${path}.completion_tokens`),
    total_tokens: num(record.total_tokens, `${path}.total_tokens`),
  };
}

export function decodeSessionList(
  value: unknown,
  path = "session_list"
): SessionListResponse {
  const record = asRecord(value, path);
  return {
    items: asArray(record.items, `${path}.items`).map((item, index) =>
      decodeSession(item, `${path}.items[${index}]`)
    ),
    total: num(record.total, `${path}.total`),
    limit: num(record.limit, `${path}.limit`),
    offset: num(record.offset, `${path}.offset`),
  };
}

function decodeEvent(value: unknown, path: string): SessionEvent {
  const record = asRecord(value, path);
  const payload = record.payload;
  return {
    id: str(record.id, `${path}.id`),
    session_id: str(record.session_id, `${path}.session_id`),
    sequence: num(record.sequence, `${path}.sequence`),
    category: eventCategory(record.category, `${path}.category`),
    event_type: str(record.event_type, `${path}.event_type`),
    level: str(record.level, `${path}.level`),
    summary: str(record.summary, `${path}.summary`),
    payload:
      typeof payload === "object" && payload !== null
        ? (payload as SessionEvent["payload"])
        : null,
    created_at: str(record.created_at, `${path}.created_at`),
  };
}

export function decodeEventList(
  value: unknown,
  path = "event_list"
): SessionEventListResponse {
  const record = asRecord(value, path);
  return {
    items: asArray(record.items, `${path}.items`).map((item, index) =>
      decodeEvent(item, `${path}.items[${index}]`)
    ),
    total: num(record.total, `${path}.total`),
    limit: num(record.limit, `${path}.limit`),
    after_sequence: num(record.after_sequence, `${path}.after_sequence`),
    last_sequence: optionalNum(record.last_sequence, `${path}.last_sequence`),
  };
}

/**
 * Decode the cross-session event feed.
 *
 * The same shape as a single session's feed, so it reuses `decodeEventList`; only
 * the reported path differs, so a failure points at the right part of the
 * fixture.
 */
export function decodeCrossSessionEventList(
  value: unknown,
  path = "cross_session_event_list"
): SessionEventListResponse {
  return decodeEventList(value, path);
}

export function decodePatch(
  value: unknown,
  path = "patch"
): SessionPatchRead {
  const record = asRecord(value, path);
  return {
    session_id: str(record.session_id, `${path}.session_id`),
    exists: bool(record.exists, `${path}.exists`),
    diff: str(record.diff, `${path}.diff`),
    is_empty: bool(record.is_empty, `${path}.is_empty`),
  };
}

const BISECT_OUTCOMES = ["good", "bad", "culprit"] as const;

function bisectOutcome(value: unknown, path: string): BisectOutcome {
  const text = str(value, path);
  const match = BISECT_OUTCOMES.find((outcome) => outcome === text);
  if (!match) {
    fail(path, `one of ${BISECT_OUTCOMES.join(" | ")}`, value);
  }
  return match;
}

function decodeBisectCommit(value: unknown, path: string): BisectCommitRead {
  const record = asRecord(value, path);
  return {
    hash: str(record.hash, `${path}.hash`),
    short_hash: str(record.short_hash, `${path}.short_hash`),
    message: str(record.message, `${path}.message`),
    author: str(record.author, `${path}.author`),
    timestamp: str(record.timestamp, `${path}.timestamp`),
    outcome: bisectOutcome(record.outcome, `${path}.outcome`),
    test_output: optionalStr(record.test_output, `${path}.test_output`),
    duration_seconds: num(record.duration_seconds, `${path}.duration_seconds`),
  };
}

export function decodeTimeline(
  value: unknown,
  path = "timeline"
): SessionTimelineRead {
  const record = asRecord(value, path);
  return {
    session_id: str(record.session_id, `${path}.session_id`),
    exists: bool(record.exists, `${path}.exists`),
    commits: asArray(record.commits, `${path}.commits`).map((commit, index) =>
      decodeBisectCommit(commit, `${path}.commits[${index}]`)
    ),
    culprit_hash: optionalStr(record.culprit_hash, `${path}.culprit_hash`),
  };
}
