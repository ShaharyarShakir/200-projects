"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSessionEvents } from "@/lib/api/sessions";
import { SessionEvent } from "@/lib/api/types";

interface UseSessionEventsOptions {
  /**
   * Keep polling for new events.
   *
   * This gates the interval only, never the initial load: a session that has
   * already finished still has an event history to show, so turning polling off
   * must not discard what was already fetched.
   */
  enabled?: boolean;
  intervalMs?: number;
  limit?: number;
}

const DEFAULT_INTERVAL_MS = 3000;
const DEFAULT_LIMIT = 100;

/**
 * Reads one session's event feed, appending only what is new.
 *
 * Polls with `after_sequence` rather than refetching the whole feed, so a long
 * run does not re-transfer every event on each tick and the rendered order stays
 * stable. Switching sessions discards the previous session's events instead of
 * merging them, because interleaving two sessions' sequences would be
 * meaningless.
 */
export function useSessionEvents(
  sessionId: string | null,
  options: UseSessionEventsOptions = {}
) {
  const {
    enabled = true,
    intervalMs = DEFAULT_INTERVAL_MS,
    limit = DEFAULT_LIMIT,
  } = options;

  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  const requestIdRef = useRef<number>(0);
  // Read inside the interval callback so a tick always uses the latest sequence
  // without the interval itself being torn down on every appended event.
  const lastSequenceRef = useRef<number>(0);

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setEvents([]);
      lastSequenceRef.current = 0;
      setError(null);
      setIsLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    getSessionEvents(sessionId, { limit })
      .then((response) => {
        if (requestIdRef.current !== requestId) return;
        setEvents(response.items);
        lastSequenceRef.current =
          response.items.length > 0
            ? response.items[response.items.length - 1].sequence
            : 0;
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setEvents([]);
        setError(
          err instanceof Error ? err.message : "Failed to load session events"
        );
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return;
        setIsLoading(false);
      });
  }, [sessionId, limit, reloadToken]);

  useEffect(() => {
    if (!sessionId || !enabled || intervalMs <= 0) return;

    let cancelled = false;
    // Captured now so a tick that lands after the session changed is discarded
    // rather than appended to the new session's feed.
    const requestId = requestIdRef.current;

    const tick = async () => {
      try {
        const response = await getSessionEvents(sessionId, {
          after_sequence: lastSequenceRef.current,
          limit,
        });
        if (cancelled || requestIdRef.current !== requestId) return;
        if (response.items.length === 0) return;
        lastSequenceRef.current =
          response.items[response.items.length - 1].sequence;
        setEvents((previous) => [...previous, ...response.items]);
      } catch {
        // A dropped poll must not discard the events already on screen; the next
        // tick retries.
      }
    };

    const timer = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [sessionId, enabled, intervalMs, limit]);

  return { events, isLoading, error, refresh };
}
