"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AgentSession, SessionStatus } from "@/lib/api/types";
import { getSession } from "@/lib/api/sessions";

interface UseSessionPollOptions {
  intervalMs?: number;
  enabled?: boolean;
  initialSession?: AgentSession | null;
  onTerminalStatus?: (session: AgentSession) => void;
}

const TERMINAL_STATUSES: SessionStatus[] = [
  "completed",
  "failed",
  "terminated",
  "timed_out",
];

/**
 * Why a fetch is happening, which decides which spinner the caller sees.
 *
 * `initial` has nothing to show yet, `background` is an interval tick over data
 * that is already on screen, and `manual` is a user action that behaves like
 * `initial` when there is nothing on screen and like `background` otherwise.
 */
type FetchMode = "initial" | "background" | "manual";

export function useSessionPoll(
  sessionId: string | null,
  options: UseSessionPollOptions = {}
) {
  const {
    intervalMs = 2000,
    enabled = true,
    initialSession = null,
    onTerminalStatus,
  } = options;

  const [session, setSession] = useState<AgentSession | null>(initialSession);
  const [isLoading, setIsLoading] = useState<boolean>(!initialSession && !!sessionId);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const generationRef = useRef<number>(0);
  const sessionRef = useRef<AgentSession | null>(initialSession);
  const onTerminalStatusRef = useRef(onTerminalStatus);
  onTerminalStatusRef.current = onTerminalStatus;

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    generationRef.current += 1;
    setIsPolling(false);
  }, []);

  const fetchSession = useCallback(
    async (mode: FetchMode = "background") => {
      if (!sessionId || !enabled) return;

      const currentGen = generationRef.current;

      // isLoading is for "there is nothing to show yet"; isRefreshing is for
      // "what is on screen is stale but still valid". Collapsing the two would
      // blank the workspace on every poll.
      const showSpinner =
        mode === "initial" || (mode === "manual" && sessionRef.current === null);
      if (showSpinner) {
        setIsLoading(true);
        setIsRefreshing(false);
      } else {
        setIsRefreshing(true);
      }

      let settledCurrentGen = false;
      try {
        const data = await getSession(sessionId);
        if (generationRef.current !== currentGen) return;
        settledCurrentGen = true;

        setSession(data);
        sessionRef.current = data;
        setError(null);

        if (TERMINAL_STATUSES.includes(data.status)) {
          stopPolling();
          if (onTerminalStatusRef.current) {
            onTerminalStatusRef.current(data);
          }
        }
      } catch (err: unknown) {
        if (generationRef.current !== currentGen) return;
        settledCurrentGen = true;
        const errorMsg =
          err instanceof Error ? err.message : "Failed to fetch session";
        // Prior data is deliberately left in place: a failed refresh should not
        // erase what the user was already looking at.
        setError(errorMsg);
      } finally {
        if (generationRef.current === currentGen && settledCurrentGen) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [sessionId, enabled, stopPolling]
  );

  useEffect(() => {
    if (!sessionId || !enabled) {
      stopPolling();
      if (!sessionId) {
        setSession(null);
        sessionRef.current = null;
        setError(null);
      }
      return;
    }

    // Drop the previous session before fetching the new one. Without this the
    // workspace would keep rendering the old session's steps and status under
    // the new session's id, which reads as current data but is not: a pending
    // fetch for a different session must never be shown as the current one.
    const seeded = initialSession?.id === sessionId ? initialSession : null;
    setSession(seeded);
    sessionRef.current = seeded;
    setError(null);
    setIsLoading(seeded === null);
    setIsRefreshing(false);

    fetchSession(seeded === null ? "initial" : "background");

    setIsPolling(true);
    timerRef.current = setInterval(() => {
      fetchSession("background");
    }, intervalMs);

    return () => {
      stopPolling();
    };
    // initialSession is intentionally excluded: it is a seed value, and
    // depending on it would restart polling every time a caller re-renders with
    // a freshly fetched session object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, enabled, intervalMs, fetchSession, stopPolling]);

  const refresh = useCallback(async () => {
    await fetchSession("manual");
  }, [fetchSession]);

  return {
    session,
    isLoading,
    isRefreshing,
    error,
    isPolling,
    refresh,
    stopPolling,
  };
}
