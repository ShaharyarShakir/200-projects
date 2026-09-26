/**
 * Display helpers for persisted sessions.
 *
 * Shared by the sessions archive, the activity feed, and the workspace so a
 * status reads identically everywhere. Every function tolerates the null and
 * undefined timestamps the backend returns for a session that has not started
 * or has not finished.
 */

import { AgentSession, SessionStatus } from "./api/types";

/** How a session ends, grouped so the UI can pick one color per outcome. */
export type StatusTone = "neutral" | "active" | "success" | "danger" | "warning";

const STATUS_TONE: Record<SessionStatus, StatusTone> = {
  created: "neutral",
  running: "active",
  completed: "success",
  failed: "danger",
  terminated: "neutral",
  timed_out: "warning",
};

const STATUS_LABEL: Record<SessionStatus, string> = {
  created: "Created",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  terminated: "Terminated",
  timed_out: "Timed out",
};

export function statusTone(status: SessionStatus): StatusTone {
  return STATUS_TONE[status];
}

export function statusLabel(status: SessionStatus): string {
  return STATUS_LABEL[status] ?? status;
}

/** A session is finished once no further status transition is possible. */
export function isTerminalStatus(status: SessionStatus): boolean {
  return (
    status === "completed" ||
    status === "failed" ||
    status === "terminated" ||
    status === "timed_out"
  );
}

/**
 * Wall-clock seconds a session ran, or null while it is still in flight.
 *
 * Derived from the persisted timestamps rather than stored, so the backend stays
 * the single source of truth. A session that has completed but is missing
 * `started_at` reports null rather than a misleading zero.
 */
export function sessionDurationSeconds(session: AgentSession): number | null {
  if (!session.started_at || !session.completed_at) return null;
  const started = Date.parse(session.started_at);
  const completed = Date.parse(session.completed_at);
  if (Number.isNaN(started) || Number.isNaN(completed)) return null;
  const seconds = (completed - started) / 1000;
  return seconds >= 0 ? seconds : null;
}

/** Duration in the compact form the archive table shows, e.g. `1m 12s`. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 1) return "<1s";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  if (minutes < 60) return `${minutes}m ${remainder}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

/**
 * A short relative label such as `20m ago`.
 *
 * Deliberately not a library: the archive only needs one unit of precision, and
 * the exact timestamp stays available in the `title` attribute.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return "—";

  const deltaSeconds = Math.round((now.getTime() - timestamp) / 1000);
  if (deltaSeconds < 0) return "just now";
  if (deltaSeconds < 60) return "just now";

  const minutes = Math.floor(deltaSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(timestamp).toISOString().slice(0, 10);
}

/** An absolute timestamp for tooltips, or a dash when absent. */
export function formatAbsoluteTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return "—";
  return new Date(timestamp).toLocaleString();
}

/** A session id shortened for a dense table, keeping the unique tail visible. */
export function shortSessionId(id: string): string {
  return id.length <= 8 ? id : id.slice(0, 8);
}
