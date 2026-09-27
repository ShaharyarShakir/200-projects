import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { WorkspaceHeader } from "../components/workspace/WorkspaceHeader";
import { StatusSummary } from "../components/workspace/StatusSummary";
import { VALIDATION_LABEL } from "../lib/session-insights";
import { RepositoryRead, SessionStatus } from "../lib/api/types";

const mockRepos: RepositoryRead[] = [
  {
    id: "repo-1",
    github_repo_id: 101,
    full_name: "octocat/Hello-World",
    default_branch: "main",
    clone_url: "https://github.com/octocat/Hello-World.git",
    is_private: false,
    owner_id: "user-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "repo-2",
    github_repo_id: 102,
    full_name: "octocat/Secret-Repo",
    default_branch: "develop",
    clone_url: "https://github.com/octocat/Secret-Repo.git",
    is_private: true,
    owner_id: "user-1",
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  },
];

describe("WorkspaceHeader Component", () => {
  it("renders empty repository prompt when no repo is selected", () => {
    render(
      <WorkspaceHeader
        repositories={[]}
        selectedRepo={null}
        onSelectRepo={vi.fn()}
        onSyncRepos={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText("Select Repository")).toBeInTheDocument();
    expect(
      screen.getByText("No repositories connected. Sync to import your GitHub repositories.")
    ).toBeInTheDocument();
  });

  it("renders selected repository details", () => {
    render(
      <WorkspaceHeader
        repositories={mockRepos}
        selectedRepo={mockRepos[0]}
        onSelectRepo={vi.fn()}
        onSyncRepos={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(
      screen.getByRole("heading", { name: "octocat/Hello-World" })
    ).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText("Public Repository")).toBeInTheDocument();
  });

  it("renders private repository badge correctly", () => {
    render(
      <WorkspaceHeader
        repositories={mockRepos}
        selectedRepo={mockRepos[1]}
        onSelectRepo={vi.fn()}
        onSyncRepos={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(
      screen.getByRole("heading", { name: "octocat/Secret-Repo" })
    ).toBeInTheDocument();
    expect(screen.getByText("develop")).toBeInTheDocument();
    expect(screen.getByText("Private Repository")).toBeInTheDocument();
  });

  it("calls onSelectRepo when a repo is chosen from the selector", () => {
    const handleSelect = vi.fn();
    render(
      <WorkspaceHeader
        repositories={mockRepos}
        selectedRepo={mockRepos[0]}
        onSelectRepo={handleSelect}
        onSyncRepos={vi.fn().mockResolvedValue(undefined)}
      />
    );

    const select = screen.getByRole("combobox", { name: "Repository Selector" });
    fireEvent.change(select, { target: { value: "repo-2" } });

    expect(handleSelect).toHaveBeenCalledWith(mockRepos[1]);
  });

  it("triggers repository sync when clicking Sync Repos button", async () => {
    const handleSync = vi.fn().mockResolvedValue(undefined);
    render(
      <WorkspaceHeader
        repositories={mockRepos}
        selectedRepo={mockRepos[0]}
        onSelectRepo={vi.fn()}
        onSyncRepos={handleSync}
      />
    );

    const syncButton = screen.getByRole("button", { name: /Sync Repos/i });
    fireEvent.click(syncButton);

    expect(handleSync).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText("Synced")).toBeInTheDocument();
    });
  });
});

describe("StatusSummary Component", () => {
  it("renders default status states", () => {
    render(<StatusSummary />);

    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Operational")).toBeInTheDocument();

    expect(screen.getByText("Agent Session")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
    expect(screen.getByText("NONE")).toBeInTheDocument();

    expect(screen.getByText("Validation")).toBeInTheDocument();
    // The label comes from VALIDATION_LABEL so the badge and the insights panel
    // cannot word the same state differently.
    expect(screen.getByText(VALIDATION_LABEL.not_run)).toBeInTheDocument();
    expect(screen.getByText("NOT RUN")).toBeInTheDocument();
  });

  const sessionStatuses: { status: SessionStatus; label: string; badge: string }[] = [
    { status: "created", label: "Created (Idle)", badge: "CREATED" },
    { status: "running", label: "Running", badge: "RUNNING" },
    { status: "completed", label: "Completed", badge: "COMPLETED" },
    { status: "failed", label: "Failed", badge: "FAILED" },
    { status: "terminated", label: "Terminated", badge: "TERMINATED" },
    { status: "timed_out", label: "Timed Out", badge: "TIMED_OUT" },
  ];

  sessionStatuses.forEach(({ status, label, badge }) => {
    it(`renders session lifecycle state: ${status}`, () => {
      render(<StatusSummary sessionStatus={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(badge)).toBeInTheDocument();
    });
  });

  it("renders validation passed status", () => {
    render(<StatusSummary validationStatus="passed" />);
    expect(screen.getByText("Passed")).toBeInTheDocument();
    expect(screen.getByText("PASSED")).toBeInTheDocument();
  });

  it("renders validation failed status", () => {
    render(<StatusSummary validationStatus="failed" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("FAILED")).toBeInTheDocument();
  });
});
