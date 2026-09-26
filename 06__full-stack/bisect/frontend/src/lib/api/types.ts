/**
 * Frontend TypeScript contracts mirroring Bisect backend Pydantic models.
 */

export type SessionStatus =
  | "created"
  | "running"
  | "completed"
  | "failed"
  | "terminated"
  | "timed_out";

export type ActionName = "run_command" | "inspect_file" | "finish";

export interface RunCommandAction {
  action: "run_command";
  command: string;
  timeout_seconds?: number | null;
  workdir?: string | null;
}

export interface InspectFileAction {
  action: "inspect_file";
  path: string;
  max_bytes?: number | null;
}

export interface FinishAction {
  action: "finish";
  message?: string;
  success?: boolean;
}

export type AgentAction = RunCommandAction | InspectFileAction | FinishAction;

export interface CommandActionResult {
  action_type: "run_command";
  command: string;
  exit_code: number;
  stdout: string;
  stderr: string;
  duration_seconds: number;
  timed_out: boolean;
}

export interface InspectFileActionResult {
  action_type: "inspect_file";
  path: string;
  exists: boolean;
  content?: string | null;
  size_bytes?: number | null;
  error?: string | null;
}

export interface FinishActionResult {
  action_type: "finish";
  message: string;
  success: boolean;
}

export interface ActionErrorResult {
  action_type: "error";
  error: string;
  details?: Record<string, unknown> | null;
}

export type ActionResult =
  | CommandActionResult
  | InspectFileActionResult
  | FinishActionResult
  | ActionErrorResult;

export interface LoopStep {
  iteration: number;
  raw_response: string;
  execution_id?: string | null;
  action?: AgentAction | Record<string, unknown> | null;
  result?: ActionResult | Record<string, unknown> | null;
  error?: string | null;
  duration_seconds: number;
}

export interface AgentSession {
  id: string;
  owner_id: string;
  repository_id?: string | null;
  task_prompt: string;
  status: SessionStatus;
  iteration_count: number;
  executed_action_count: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  termination_reason?: string | null;
  steps: LoopStep[];
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface SessionListResponse {
  items: AgentSession[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * The closed set of categories the backend assigns to an event.
 *
 * The backend derives the category from what happened and never accepts one from
 * a caller, so the UI can branch exhaustively on this union. A new category on
 * the server should be a compile error here rather than a silent fallthrough.
 */
export type SessionEventCategory =
  | "system"
  | "agent"
  | "execution"
  | "validation"
  | "success"
  | "warning"
  | "error";

export const SESSION_EVENT_CATEGORIES: readonly SessionEventCategory[] = [
  "system",
  "agent",
  "execution",
  "validation",
  "success",
  "warning",
  "error",
] as const;

/**
 * The fields the agent loop puts in an event's payload.
 *
 * Declared field by field rather than as an open record, so reading a key that
 * the loop never emits is a compile error instead of `undefined` at runtime.
 * Which fields are present depends on `event_type`; all are optional because no
 * single event carries all of them.
 */
export interface SessionEventPayload {
  iteration?: number;
  commands_executed?: number;
  duration_seconds?: number;
  task_prompt?: string;
  max_iterations?: number;
  max_commands?: number;
  max_duration_seconds?: number;
  elapsed_seconds?: number;
  provider?: string;
  error?: string;
  message?: string;
  status?: string;
  success?: boolean;
  final_message?: string;
  consecutive_errors?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  total_duration_seconds?: number;
  repository_id?: string | null;
  action?: AgentAction;
  result?: ActionResult;
}

export interface SessionEvent {
  id: string;
  session_id: string;
  sequence: number;
  category: SessionEventCategory;
  event_type: string;
  /** Log severity of the occurrence, distinct from its category. */
  level: string;
  summary: string;
  payload?: SessionEventPayload | null;
  created_at: string;
}

export interface SessionPatchRead {
  session_id: string;
  /** False when the session produced no patch at all, as distinct from an empty one. */
  exists: boolean;
  /** The unified diff verbatim, for the frontend to parse. Never synthesized. */
  diff: string;
  is_empty: boolean;
}

/**
 * The outcome of one bisect evaluation.
 *
 * `culprit` is kept separate from `bad` because the first bad commit is the one
 * the search proved, which is a stronger claim than a commit that merely tested
 * bad. Collapsing them would misreport an unproven candidate as a conclusion.
 */
export type BisectOutcome = "good" | "bad" | "culprit";

export interface BisectCommitRead {
  hash: string;
  short_hash: string;
  message: string;
  author: string;
  timestamp: string;
  outcome: BisectOutcome;
  test_output?: string | null;
  duration_seconds: number;
}

export interface SessionTimelineRead {
  session_id: string;
  exists: boolean;
  /** In the order the search evaluated commits, assigned by the backend. */
  commits: BisectCommitRead[];
  /** Null when the search did not isolate a culprit, which is a normal outcome. */
  culprit_hash?: string | null;
}

export interface SessionEventListResponse {
  items: SessionEvent[];
  total: number;
  limit: number;
  after_sequence: number;
  last_sequence?: number | null;
}

export interface UserRead {
  id: string;
  github_user_id: number;
  github_username: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserRead;
}

export interface RepositoryRead {
  id: string;
  github_repo_id: number;
  full_name: string;
  default_branch: string;
  clone_url: string;
  is_private: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface RepositoryListResponse {
  items: RepositoryRead[];
  total: number;
  limit: number;
  offset: number;
}

export interface RepositorySyncResponse {
  synced_count: number;
  repositories: RepositoryRead[];
}

/**
 * The error envelope every failing backend response carries.
 *
 * `code` is the backend's exception class name, or "ValidationError" /
 * "HTTPError" for framework-raised failures. Callers should branch on a mapped
 * error code rather than on the `detail` text, which is written for humans and
 * can change.
 */
export interface ApiErrorDetail {
  detail: string;
  code: string;
}
