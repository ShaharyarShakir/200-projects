"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSessionPatch, getSessionTimeline } from "@/lib/api/sessions";
import { SessionPatchRead, SessionTimelineRead } from "@/lib/api/types";

interface UseSessionArtifactsOptions {
  /**
   * Keep polling for artifacts that have not arrived yet.
   *
   * Gated on the session not being terminal, so a finished run stops asking.
   * The initial load is never gated: a completed session still has artifacts
   * worth showing, so disabling polling must not hide them.
   */
  enabled?: boolean;
  intervalMs?: number;
}

const DEFAULT_INTERVAL_MS = 3000;

/** The artifact a session has not produced reads as empty, not as an error. */
const EMPTY_PATCH: SessionPatchRead = {
  session_id: "",
  exists: false,
  diff: "",
  is_empty: true,
};

const EMPTY_TIMELINE: SessionTimelineRead = {
  session_id: "",
  exists: false,
  commits: [],
  culprit_hash: null,
};

/**
 * Reads one session's patch and bisect timeline, replacing both on each poll.
 *
 * Unlike the event feed there is no cursor to append from: a session has at most
 * one patch and its timeline is replaced wholesale by a later bisect, so a
 * refetch that returns the same content is simply set again. That also means a
 * re-run bisect cannot leave stale commits on screen.
 *
 * Both requests are issued together and reported under one error, because the
 * two panels are read as a pair and a partial failure should not present as one
 * panel being genuinely empty.
 */
export function useSessionArtifacts(
  sessionId: string | null,
  options: UseSessionArtifactsOptions = {}
) {
  const { enabled = true, intervalMs = DEFAULT_INTERVAL_MS } = options;

  const [patch, setPatch] = useState<SessionPatchRead>(EMPTY_PATCH);
  const [timeline, setTimeline] = useState<SessionTimelineRead>(EMPTY_TIMELINE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  const requestIdRef = useRef<number>(0);

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setPatch(EMPTY_PATCH);
      setTimeline(EMPTY_TIMELINE);
      setError(null);
      setIsLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    Promise.all([
      getSessionPatch(sessionId),
      getSessionTimeline(sessionId),
    ])
      .then(([patchResponse, timelineResponse]) => {
        if (requestIdRef.current !== requestId) return;
        setPatch(patchResponse);
        setTimeline(timelineResponse);
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setPatch(EMPTY_PATCH);
        setTimeline(EMPTY_TIMELINE);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load session artifacts"
        );
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return;
        setIsLoading(false);
      });
  }, [sessionId, reloadToken]);

  useEffect(() => {
    if (!sessionId || !enabled || intervalMs <= 0) return;

    let cancelled = false;
    // Captured so a tick that lands after the session changed is discarded
    // rather than overwriting the new session's artifacts.
    const requestId = requestIdRef.current;

    const tick = async () => {
      try {
        const [patchResponse, timelineResponse] = await Promise.all([
          getSessionPatch(sessionId),
          getSessionTimeline(sessionId),
        ]);
        if (cancelled || requestIdRef.current !== requestId) return;
        setPatch(patchResponse);
        setTimeline(timelineResponse);
      } catch {
        // A dropped poll keeps whatever is already on screen; the next tick
        // retries rather than blanking the panels.
      }
    };

    const timer = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [sessionId, enabled, intervalMs]);

  return { patch, timeline, isLoading, error, refresh };
}
