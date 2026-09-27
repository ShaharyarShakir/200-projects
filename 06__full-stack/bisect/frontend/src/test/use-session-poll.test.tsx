import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSessionPoll } from "../lib/hooks/useSessionPoll";
import { getSession } from "../lib/api/sessions";
import { AgentSession } from "../lib/api/types";

vi.mock("../lib/api/sessions", () => ({
  getSession: vi.fn(),
}));

const mockGetSession = getSession as unknown as ReturnType<typeof vi.fn>;

function session(overrides: Partial<AgentSession> = {}): AgentSession {
  return {
    id: "sess-1",
    owner_id: "owner-1",
    repository_id: "repo-1",
    task_prompt: "fix the failing test",
    status: "running",
    iteration_count: 1,
    executed_action_count: 0,
    created_at: "2026-01-01T00:00:00Z",
    started_at: "2026-01-01T00:00:01Z",
    completed_at: null,
    termination_reason: null,
    steps: [],
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    ...overrides,
  };
}

describe("useSessionPoll", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetSession.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("loads the session on mount and clears the initial spinner", async () => {
    mockGetSession.mockResolvedValue(session());
    const { result } = renderHook(() => useSessionPoll("sess-1"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.session?.id).toBe("sess-1");
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("reports a failing initial load", async () => {
    mockGetSession.mockRejectedValue(new Error("backend is down"));
    const { result } = renderHook(() => useSessionPoll("sess-1"));

    await waitFor(() => {
      expect(result.current.error).toBe("backend is down");
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.session).toBeNull();
  });

  it("skips the initial spinner when a seed session is supplied", async () => {
    mockGetSession.mockResolvedValue(session());
    const { result } = renderHook(() =>
      useSessionPoll("sess-1", { initialSession: session() })
    );

    // The seed is already on screen, so nothing should blank it.
    expect(result.current.isLoading).toBe(false);
    expect(result.current.session?.id).toBe("sess-1");
    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });
  });

  it("refreshes in the background without blanking the visible session", async () => {
    mockGetSession.mockResolvedValue(session());
    const { result } = renderHook(() =>
      useSessionPoll("sess-1", { initialSession: session() })
    );
    await waitFor(() => expect(mockGetSession).toHaveBeenCalledTimes(1));

    // A poll arriving mid-flight must show the subtle indicator, never the
    // full-page loader, or the workspace flashes on every tick.
    let resolvePoll: (value: AgentSession) => void = () => {};
    mockGetSession.mockImplementationOnce(
      () => new Promise<AgentSession>((resolve) => {
        resolvePoll = resolve;
      })
    );
    await act(async () => {
      result.current.refresh();
    });

    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.session?.id).toBe("sess-1");

    await act(async () => {
      resolvePoll(session({ iteration_count: 2 }));
    });
    expect(result.current.session?.iteration_count).toBe(2);
    expect(result.current.isRefreshing).toBe(false);
  });

  it("polls on the configured interval and stops when a terminal status arrives", async () => {
    vi.useFakeTimers();
    const onTerminalStatus = vi.fn();
    mockGetSession.mockResolvedValue(session({ status: "completed" }));

    const { result } = renderHook(() =>
      useSessionPoll("sess-1", {
        intervalMs: 1000,
        initialSession: session(),
        onTerminalStatus,
      })
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(onTerminalStatus).toHaveBeenCalledTimes(1);
    expect(result.current.isPolling).toBe(false);

    mockGetSession.mockClear();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it("keeps polling a non-terminal session", async () => {
    vi.useFakeTimers();
    mockGetSession.mockResolvedValue(session({ status: "running" }));

    const { result } = renderHook(() =>
      useSessionPoll("sess-1", { intervalMs: 1000 })
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.isPolling).toBe(true);

    mockGetSession.mockClear();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(mockGetSession).toHaveBeenCalledTimes(3);
    expect(result.current.isPolling).toBe(true);
  });

  it("calls onTerminalStatus once per terminal transition", async () => {
    vi.useFakeTimers();
    const onTerminalStatus = vi.fn();
    mockGetSession.mockResolvedValue(session({ status: "failed" }));

    renderHook(() =>
      useSessionPoll("sess-1", { intervalMs: 1000, onTerminalStatus })
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    // A failed session also stops polling, so the callback cannot repeat.
    expect(onTerminalStatus).toHaveBeenCalledTimes(1);
  });

  it("does not poll when disabled", async () => {
    vi.useFakeTimers();
    mockGetSession.mockResolvedValue(session());

    renderHook(() => useSessionPoll("sess-1", { intervalMs: 1000, enabled: false }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it("does not poll without a session id", async () => {
    vi.useFakeTimers();
    mockGetSession.mockResolvedValue(session());

    const { result } = renderHook(() =>
      useSessionPoll(null, { intervalMs: 1000 })
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(mockGetSession).not.toHaveBeenCalled();
    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("clears the previous session when the id changes", async () => {
    mockGetSession.mockResolvedValue(session());
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useSessionPoll(id),
      { initialProps: { id: "sess-1" } }
    );
    await waitFor(() => expect(result.current.session?.id).toBe("sess-1"));

    let resolveSecond: (value: AgentSession) => void = () => {};
    mockGetSession.mockImplementationOnce(
      () => new Promise<AgentSession>((resolve) => {
        resolveSecond = resolve;
      })
    );
    rerender({ id: "sess-2" });

    // The old session must not linger under the new id, even briefly.
    expect(result.current.session).toBeNull();
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSecond(session({ id: "sess-2", task_prompt: "second task" }));
    });
    expect(result.current.session?.id).toBe("sess-2");
  });

  it("discards a late response for a session that is no longer displayed", async () => {
    let resolveSlow: (value: AgentSession) => void = () => {};
    mockGetSession.mockImplementationOnce(
      () => new Promise<AgentSession>((resolve) => {
        resolveSlow = resolve;
      })
    );

    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useSessionPoll(id),
      { initialProps: { id: "sess-1" } }
    );
    expect(result.current.isLoading).toBe(true);

    mockGetSession.mockResolvedValueOnce(session({ id: "sess-2" }));
    rerender({ id: "sess-2" });
    await waitFor(() => expect(result.current.session?.id).toBe("sess-2"));

    // The in-flight request for sess-1 finally lands. Applying it would show the
    // wrong session's data under the currently selected id.
    await act(async () => {
      resolveSlow(session({ id: "sess-1", task_prompt: "stale first task" }));
    });

    expect(result.current.session?.id).toBe("sess-2");
    expect(result.current.session?.task_prompt).not.toBe("stale first task");
  });

  it("keeps prior data visible when a background refresh fails", async () => {
    mockGetSession.mockResolvedValue(session({ iteration_count: 1 }));
    const { result } = renderHook(() =>
      useSessionPoll("sess-1", { initialSession: session() })
    );
    await waitFor(() => expect(mockGetSession).toHaveBeenCalledTimes(1));

    mockGetSession.mockRejectedValueOnce(new Error("temporary outage"));
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBe("temporary outage");
    // The user keeps reading the last good session rather than an empty panel.
    expect(result.current.session?.id).toBe("sess-1");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
  });

  it("clears a previous error on a successful refresh", async () => {
    mockGetSession.mockRejectedValueOnce(new Error("temporary outage"));
    const { result } = renderHook(() => useSessionPoll("sess-1"));
    await waitFor(() => expect(result.current.error).toBe("temporary outage"));

    mockGetSession.mockResolvedValueOnce(session());
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.session?.id).toBe("sess-1");
  });

  it("stops polling when the component unmounts", async () => {
    vi.useFakeTimers();
    mockGetSession.mockResolvedValue(session());

    const { unmount } = renderHook(() =>
      useSessionPoll("sess-1", { intervalMs: 1000 })
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const callsBeforeUnmount = mockGetSession.mock.calls.length;

    unmount();
    mockGetSession.mockClear();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(mockGetSession.mock.calls.length).toBeLessThanOrEqual(
      callsBeforeUnmount
    );
  });

  it("does not restart polling when the caller passes a new session object", async () => {
    vi.useFakeTimers();
    mockGetSession.mockResolvedValue(session());

    const { rerender } = renderHook(
      ({ seed }: { seed: AgentSession }) =>
        useSessionPoll("sess-1", { intervalMs: 1000, initialSession: seed }),
      { initialProps: { seed: session() } }
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    const callsAfterMount = mockGetSession.mock.calls.length;

    // A parent re-render with an equal-but-new object must not reset the timer
    // and refetch, or polling would never progress on a busy page.
    mockGetSession.mockClear();
    rerender({ seed: session() });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(mockGetSession.mock.calls.length).toBeLessThanOrEqual(
      callsAfterMount
    );
  });
});
