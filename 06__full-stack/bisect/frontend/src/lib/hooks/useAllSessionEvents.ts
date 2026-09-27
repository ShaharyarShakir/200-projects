"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listAllSessionEvents } from "@/lib/api/sessions";
import { SessionEvent } from "@/lib/api/types";

interface UseAllSessionEventsOptions {
  intervalMs?: number;
}

const DEFAULT_INTERVAL_MS = 5000;
const DEFAULT_LIMIT = 200;

/**
 * Reads events across every session the caller owns.
 *
 * There is no cursor to append from here: `sequence` is a per-session counter,
 * so two events from different sessions can share one, and the backend reports
 * no last sequence for a combined feed. Each poll therefore replaces the list,
 * which is also the correct way to surface a session that finished while the
 * page was open.
 *
 * Unlike the single-session feed this polls unconditionally. A merged feed can
 * include a run that is still going, and the page cannot know which without
 * reading every session, so stopping on a stale status would leave the view
 * silently out of date.
 */
export function useAllSessionEvents(options: UseAllSessionEventsOptions = {}) {
  const { intervalMs = DEFAULT_INTERVAL_MS } = options;

  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState<number>(0);

  const requestIdRef = useRef<number>(0);

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    listAllSessionEvents({ limit: DEFAULT_LIMIT })
      .then((response) => {
        if (requestIdRef.current !== requestId) return;
        // The backend already returns these oldest-first across sessions, so the
        // order is taken rather than re-derived from per-session sequences.
        setEvents(response.items);
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setEvents([]);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load activity across sessions"
        );
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return;
        setIsLoading(false);
      });
  }, [reloadToken]);

  useEffect(() => {
    if (intervalMs <= 0) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const response = await listAllSessionEvents({ limit: DEFAULT_LIMIT });
        if (cancelled) return;
        setEvents(response.items);
      } catch {
        // A dropped poll keeps the events already on screen; the next tick
        // retries rather than blanking the feed.
      }
    };

    const timer = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [intervalMs]);

  return { events, isLoading, error, refresh };
}
