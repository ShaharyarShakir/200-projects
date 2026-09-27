import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  AgentModelSelector,
} from "../components/workspace/AgentModelSelector";
import {
  OpenSpecLifecycleTracker,
} from "../components/workspace/OpenSpecLifecycleTracker";
import {
  CommitTimelineScrubber,
  BisectCommit,
} from "../components/workspace/CommitTimelineScrubber";
import {
  DiffReviewPanel,
  ChangedFile,
} from "../components/workspace/DiffReviewPanel";
import {
  HumanApprovalGate,
  PendingApprovalRequest,
} from "../components/workspace/HumanApprovalGate";

describe("Bisect Workbench Component Suite", () => {
  /* -------------------------------------------------------------------------- */
  /* AgentModelSelector                                                         */
  /* -------------------------------------------------------------------------- */
  describe("AgentModelSelector Component", () => {
    it("renders the currently selected model name and context window", () => {
      const handleSelect = vi.fn();
      render(
        <AgentModelSelector
          selectedModelId="claude-3-7-sonnet"
          onSelectModel={handleSelect}
        />
      );

      expect(screen.getByText("Claude 3.7 Sonnet")).toBeInTheDocument();
      expect(screen.getByText("(Anthropic)")).toBeInTheDocument();
      expect(screen.getByText("200k tokens ctx")).toBeInTheDocument();
    });

    it("opens the dropdown menu and allows choosing a different model", () => {
      const handleSelect = vi.fn();
      render(
        <AgentModelSelector
          selectedModelId="claude-3-7-sonnet"
          onSelectModel={handleSelect}
        />
      );

      const triggerBtn = screen.getByRole("button", { name: /Select AI Model/i });
      fireEvent.click(triggerBtn);

      expect(screen.getByText("GPT-4o (Codex)")).toBeInTheDocument();
      expect(screen.getByText("Llama 3.3 (Ollama)")).toBeInTheDocument();

      const gptOption = screen.getByText("GPT-4o (Codex)");
      fireEvent.click(gptOption);

      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: "gpt-4o", provider: "OpenAI" })
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /* OpenSpecLifecycleTracker                                                   */
  /* -------------------------------------------------------------------------- */
  describe("OpenSpecLifecycleTracker Component", () => {
    it("renders all 5 OpenSpec phases and highlights the active stage", () => {
      render(
        <OpenSpecLifecycleTracker
          currentPhase="implement"
          completedPhases={["explore", "propose"]}
        />
      );

      expect(screen.getByText("Explore")).toBeInTheDocument();
      expect(screen.getByText("Propose")).toBeInTheDocument();
      expect(screen.getByText("Implement")).toBeInTheDocument();
      expect(screen.getByText("Verify")).toBeInTheDocument();
      expect(screen.getByText("Archive")).toBeInTheDocument();

      expect(screen.getByText(/Stage 3 of 5/i)).toBeInTheDocument();
      expect(screen.getByText("Active Phase")).toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* CommitTimelineScrubber                                                     */
  /* -------------------------------------------------------------------------- */
  describe("CommitTimelineScrubber Component", () => {
    const mockCommits: BisectCommit[] = [
      {
        hash: "commit-11111",
        shortHash: "1111111",
        message: "Initial clean commit",
        author: "Shaharyar",
        timestamp: "1 hour ago",
        outcome: "good",
        durationSeconds: 10,
        testOutput: "PASS: all tests green",
      },
      {
        hash: "commit-22222",
        shortHash: "2222222",
        message: "Introduce subtle timeout bug",
        author: "Alex",
        timestamp: "30 mins ago",
        outcome: "culprit",
        durationSeconds: 5,
        testOutput: "FAIL: AssertionError in test_runner.py",
      },
      {
        hash: "commit-33333",
        shortHash: "3333333",
        message: "HEAD commit",
        author: "Shaharyar",
        timestamp: "5 mins ago",
        outcome: "bad",
        durationSeconds: 5,
        testOutput: "FAIL: AssertionError in test_runner.py",
      },
    ];

    it("renders commit nodes and highlights the culprit commit alert", () => {
      const handleSelect = vi.fn();
      render(
        <CommitTimelineScrubber
          commits={mockCommits}
          onSelectCommit={handleSelect}
        />
      );

      expect(
        screen.getByText("Breaking Commit Isolated:")
      ).toBeInTheDocument();
      expect(screen.getAllByText("2222222").length).toBeGreaterThanOrEqual(1);

      const commit1Node = screen.getByRole("button", {
        name: "Commit 1111111: good",
      });
      fireEvent.click(commit1Node);

      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({ hash: "commit-11111" })
      );
      expect(screen.getByText("commit commit-11111")).toBeInTheDocument();
      expect(screen.getByText("Initial clean commit")).toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* DiffReviewPanel                                                            */
  /* -------------------------------------------------------------------------- */
  describe("DiffReviewPanel Component", () => {
    const mockFiles: ChangedFile[] = [
      {
        path: "src/engine.py",
        additions: 4,
        deletions: 1,
        status: "modified",
        diffHunks: [
          {
            header: "@@ -10,3 +10,6 @@",
            lines: [
              { type: "context", content: " import sys", oldLineNumber: 10, newLineNumber: 10 },
              { type: "delete", content: "-timeout = 10", oldLineNumber: 11 },
              { type: "add", content: "+# Wrapped with timeout recovery", newLineNumber: 11 },
              { type: "add", content: "+timeout = 30", newLineNumber: 12 },
            ],
          },
        ],
      },
    ];

    it("renders changed file paths, diff hunks, and handles action triggers", () => {
      const handleAccept = vi.fn();
      const handleReject = vi.fn();
      const handleValidate = vi.fn();

      render(
        <DiffReviewPanel
          files={mockFiles}
          onAcceptPatch={handleAccept}
          onRejectPatch={handleReject}
          onRunValidation={handleValidate}
        />
      );

      expect(screen.getByText("src/engine.py")).toBeInTheDocument();
      expect(screen.getByText("+4 additions")).toBeInTheDocument();
      expect(screen.getByText("-1 deletions")).toBeInTheDocument();
      expect(screen.getByText(/Wrapped with timeout recovery/i)).toBeInTheDocument();

      const validateBtn = screen.getByRole("button", { name: /Run Tests/i });
      fireEvent.click(validateBtn);
      expect(handleValidate).toHaveBeenCalledTimes(1);

      const acceptBtn = screen.getByRole("button", { name: /Accept & Apply Patch/i });
      fireEvent.click(acceptBtn);
      expect(handleAccept).toHaveBeenCalledTimes(1);

      const discardBtn = screen.getByRole("button", { name: /Discard Patch/i });
      fireEvent.click(discardBtn);
      expect(handleReject).toHaveBeenCalledTimes(1);
    });

    it("toggles between Unified and Split diff view modes", () => {
      render(<DiffReviewPanel files={mockFiles} />);

      const splitBtn = screen.getByRole("button", { name: /Split/i });
      fireEvent.click(splitBtn);
      expect(splitBtn).toHaveClass("bg-slate-800");

      const unifiedBtn = screen.getByRole("button", { name: /Unified/i });
      fireEvent.click(unifiedBtn);
      expect(unifiedBtn).toHaveClass("bg-slate-800");
    });
  });

  /* -------------------------------------------------------------------------- */
  /* HumanApprovalGate                                                          */
  /* -------------------------------------------------------------------------- */
  describe("HumanApprovalGate Component", () => {
    const mockRequest: PendingApprovalRequest = {
      id: "req-99",
      command: "rm -rf build/ cache/",
      reason: "Clean corrupted cache directory before executing clean rebuild",
      riskLevel: "critical",
      affectedFiles: ["build/", "cache/"],
      workdir: "/app/bisect",
      timestamp: "Just now",
    };

    it("renders approval dialog with command, rationale, and risk tag", () => {
      const handleApprove = vi.fn();
      const handleReject = vi.fn();

      render(
        <HumanApprovalGate
          request={mockRequest}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      );

      expect(
        screen.getByText("Human-in-the-Loop Safety Gate")
      ).toBeInTheDocument();
      expect(screen.getByText(/critical Risk Operation/i)).toBeInTheDocument();
      expect(screen.getByText("$ rm -rf build/ cache/")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Clean corrupted cache directory before executing clean rebuild"
        )
      ).toBeInTheDocument();
    });

    it("handles click approval and rejection triggers", () => {
      const handleApprove = vi.fn();
      const handleReject = vi.fn();

      render(
        <HumanApprovalGate
          request={mockRequest}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      );

      const approveBtn = screen.getByRole("button", {
        name: /Approve & Resume Execution/i,
      });
      fireEvent.click(approveBtn);
      expect(handleApprove).toHaveBeenCalledWith("req-99");

      const rejectBtn = screen.getByRole("button", {
        name: /Reject & Intercept/i,
      });
      fireEvent.click(rejectBtn);

      const reasonInput = screen.getByPlaceholderText(/e\.g\. Do not delete files/i);
      fireEvent.change(reasonInput, { target: { value: "Keep the build folder" } });

      const confirmRejectBtn = screen.getByRole("button", {
        name: /Confirm Rejection/i,
      });
      fireEvent.click(confirmRejectBtn);

      expect(handleReject).toHaveBeenCalledWith("req-99", "Keep the build folder");
    });

    it("listens to keyboard hotkeys 'A' for approval", () => {
      const handleApprove = vi.fn();
      const handleReject = vi.fn();

      render(
        <HumanApprovalGate
          request={mockRequest}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      );

      fireEvent.keyDown(window, { key: "a" });
      expect(handleApprove).toHaveBeenCalledWith("req-99");
    });
  });
});
