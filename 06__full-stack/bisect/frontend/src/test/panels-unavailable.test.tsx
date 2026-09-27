import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  CommitTimelineScrubber,
  type BisectCommit,
} from "../components/workspace/CommitTimelineScrubber";
import {
  DiffReviewPanel,
  type ChangedFile,
} from "../components/workspace/DiffReviewPanel";

/**
 * The bisect timeline and patch diff are only ever drawn from real backend data.
 *
 * These panels previously filled themselves with a hardcoded sample bisect run
 * and a fabricated patch, which rendered as though they were a real reviewable
 * result. They now state which of the real cases they are in: no artifact, an
 * artifact that turned out to be empty, or a request still in flight. The
 * rendering paths are kept and covered by passing explicit data.
 */

const realCommits: BisectCommit[] = [
  {
    hash: "abc123def456",
    shortHash: "abc123d",
    message: "fix: correct timeout handling",
    author: "octocat",
    timestamp: "2026-01-01T10:00:00Z",
    outcome: "culprit",
    durationSeconds: 8.2,
    testOutput: "FAIL: test_streaming_timeout_recovery",
  },
];

const realFiles: ChangedFile[] = [
  {
    path: "backend/app/main.py",
    additions: 2,
    deletions: 1,
    status: "modified",
    diffHunks: [
      {
        header: "@@ -1,3 +1,4 @@",
        lines: [
          { type: "context", content: " app = FastAPI()", oldLineNumber: 1, newLineNumber: 1 },
          { type: "delete", content: "-old_handler()", oldLineNumber: 2 },
          { type: "add", content: "+new_handler()", newLineNumber: 2 },
        ],
      },
    ],
  },
];

describe("CommitTimelineScrubber without backend data", () => {
  it("states the session has no timeline instead of rendering a sample run", () => {
    render(<CommitTimelineScrubber />);

    expect(screen.getByTestId("timeline-unavailable")).toBeInTheDocument();
    expect(
      screen.getByText("No bisect timeline for this session")
    ).toBeInTheDocument();
  });

  it("distinguishes an empty timeline from a missing one", () => {
    render(<CommitTimelineScrubber artifactState="empty" />);

    expect(screen.getByTestId("timeline-empty")).toBeInTheDocument();
    expect(screen.getByText("No commits were evaluated")).toBeInTheDocument();
  });

  it("does not claim there is no timeline while the request is in flight", () => {
    render(<CommitTimelineScrubber artifactState="loading" />);

    expect(screen.getByTestId("timeline-loading")).toBeInTheDocument();
    // Asserting "no timeline" mid-load would state a result not yet returned.
    expect(screen.queryByTestId("timeline-unavailable")).not.toBeInTheDocument();
  });

  it("leaves no sample commits in the rendered output", () => {
    const { container } = render(<CommitTimelineScrubber />);
    const text = container.textContent ?? "";

    for (const fragment of [
      "a21e991",
      "df1f6ba",
      "0e022d4",
      "d2c62ac",
      "cbb9035",
      "48 tests passed",
      "Shaharyar",
      "HEAD: current workspace branch",
    ]) {
      expect(text).not.toContain(fragment);
    }
  });

  it("renders a real commit track when given data", () => {
    render(
      <CommitTimelineScrubber commits={realCommits} artifactState="ready" />
    );

    expect(screen.queryByTestId("timeline-unavailable")).not.toBeInTheDocument();
    // The hash appears on the node and in the inspector, so check the node.
    expect(screen.getAllByText("abc123d").length).toBeGreaterThan(0);
    expect(screen.getByText("Breaking Commit Isolated:")).toBeInTheDocument();
  });
});

describe("DiffReviewPanel without backend data", () => {
  it("states the session has no patch instead of rendering a sample patch", () => {
    render(<DiffReviewPanel />);

    expect(screen.getByTestId("diff-unavailable")).toBeInTheDocument();
    expect(
      screen.getByText("No patch for this session")
    ).toBeInTheDocument();
  });

  it("distinguishes an empty patch from a missing one", () => {
    render(<DiffReviewPanel artifactState="empty" />);

    expect(screen.getByTestId("diff-empty")).toBeInTheDocument();
    expect(screen.getByText("Nothing to review")).toBeInTheDocument();
  });

  it("does not claim there is no patch while the request is in flight", () => {
    render(<DiffReviewPanel artifactState="loading" />);

    expect(screen.getByTestId("diff-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("diff-unavailable")).not.toBeInTheDocument();
  });

  it("leaves no sample diff lines in the rendered output", () => {
    const { container } = render(<DiffReviewPanel />);
    const text = container.textContent ?? "";

    for (const fragment of [
      "runner.py",
      "test_streaming_loop.py",
      "execute_agent_loop",
      "parse_streaming_tokens",
      "ProviderTimeoutError",
    ]) {
      expect(text).not.toContain(fragment);
    }
  });

  it("renders a real diff when given data", () => {
    render(<DiffReviewPanel files={realFiles} artifactState="ready" />);

    expect(screen.queryByTestId("diff-unavailable")).not.toBeInTheDocument();
    expect(screen.getByText("backend/app/main.py")).toBeInTheDocument();
    // Diff lines render without their leading marker as separate glyphs.
    expect(screen.getByText("old_handler()")).toBeInTheDocument();
    expect(screen.getByText("new_handler()")).toBeInTheDocument();
  });
});
