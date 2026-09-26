import { fetchApi } from "./client";
import {
  AgentSession,
  SessionEventListResponse,
  SessionListResponse,
  SessionPatchRead,
  SessionStatus,
  SessionTimelineRead,
} from "./types";

export interface CreateSessionRequest {
  task_prompt: string;
  repository_id?: string;
}

export interface ListSessionsParams {
  limit?: number;
  offset?: number;
  status?: SessionStatus | "";
  repository_id?: string;
}

export interface GetSessionEventsParams {
  after_sequence?: number;
  limit?: number;
}

/**
 * Builds a query string, omitting empty values.
 *
 * Sending `status=` for an unset filter would be a real request for the empty
 * status and match nothing, so unset filters are dropped rather than serialized.
 */
function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function listSessions(
  params: ListSessionsParams = {}
): Promise<SessionListResponse> {
  const query = toQuery({
    limit: params.limit,
    offset: params.offset,
    status: params.status,
    repository_id: params.repository_id,
  });
  return fetchApi<SessionListResponse>(`/api/v1/sessions${query}`, {
    method: "GET",
  });
}

export async function getSession(sessionId: string): Promise<AgentSession> {
  return fetchApi<AgentSession>(`/api/v1/sessions/${sessionId}`, {
    method: "GET",
  });
}

export async function getSessionEvents(
  sessionId: string,
  params: GetSessionEventsParams = {}
): Promise<SessionEventListResponse> {
  const query = toQuery({
    after_sequence: params.after_sequence,
    limit: params.limit,
  });
  return fetchApi<SessionEventListResponse>(
    `/api/v1/sessions/${sessionId}/events${query}`,
    { method: "GET" }
  );
}

export async function createSession(
  request: CreateSessionRequest
): Promise<AgentSession> {
  return fetchApi<AgentSession>("/api/v1/sessions", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getSessionPatch(
  sessionId: string
): Promise<SessionPatchRead> {
  return fetchApi<SessionPatchRead>(`/api/v1/sessions/${sessionId}/patch`, {
    method: "GET",
  });
}

export async function getSessionTimeline(
  sessionId: string
): Promise<SessionTimelineRead> {
  return fetchApi<SessionTimelineRead>(`/api/v1/sessions/${sessionId}/timeline`, {
    method: "GET",
  });
}

export interface ListAllEventsParams {
  /** Narrows to a single owned session; omit for every session the caller owns. */
  session_id?: string;
  after_sequence?: number;
  limit?: number;
}

/**
 * Read events across every session the caller owns.
 *
 * Passing `session_id` narrows the query to that one session, which is how the
 * activity view's single-session mode reuses this read instead of calling a
 * second endpoint. Omitting it merges the events into one chronological feed,
 * with each event still naming the session it came from.
 */
export async function listAllSessionEvents(
  params: ListAllEventsParams = {}
): Promise<SessionEventListResponse> {
  const query = toQuery({
    session_id: params.session_id,
    after_sequence: params.after_sequence,
    limit: params.limit,
  });
  return fetchApi<SessionEventListResponse>(
    `/api/v1/sessions/events${query}`,
    { method: "GET" }
  );
}

export const sessionsApi = {
  listSessions,
  getSession,
  getSessionEvents,
  getSessionPatch,
  getSessionTimeline,
  listAllSessionEvents,
  createSession,
};
