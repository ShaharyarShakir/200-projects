import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { LoadingSkeleton, CardSkeleton } from "../components/ui/LoadingSkeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState, ErrorBanner } from "../components/ui/ErrorState";
import { Activity } from "lucide-react";

describe("LoadingSkeleton Component", () => {
  it("renders multiple skeleton bars", () => {
    const { container } = render(<LoadingSkeleton count={3} />);
    const bars = container.querySelectorAll(".animate-pulse > div");
    expect(bars.length).toBe(3);
  });

  it("renders CardSkeleton with pulse styling", () => {
    const { container } = render(<CardSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});

describe("EmptyState Component", () => {
  it("renders title, description and icon", () => {
    render(
      <EmptyState
        title="No Sessions Available"
        description="Trigger an agent task to begin."
        icon={Activity}
      />
    );

    expect(screen.getByText("No Sessions Available")).toBeInTheDocument();
    expect(screen.getByText("Trigger an agent task to begin.")).toBeInTheDocument();
  });

  it("renders action button and triggers callback on click", () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="Empty Repo"
        description="Connect your account"
        actionLabel="Connect GitHub"
        onAction={handleAction}
      />
    );

    const button = screen.getByRole("button", { name: "Connect GitHub" });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});

describe("ErrorState & ErrorBanner Components", () => {
  it("renders ErrorState with retry button", () => {
    const handleRetry = vi.fn();
    render(
      <ErrorState
        title="Connection Failed"
        message="Backend server unreachable at localhost:8000"
        onRetry={handleRetry}
      />
    );

    expect(screen.getByText("Connection Failed")).toBeInTheDocument();
    expect(
      screen.getByText("Backend server unreachable at localhost:8000")
    ).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /Try Again/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders ErrorBanner and triggers dismiss callback", () => {
    const handleDismiss = vi.fn();
    render(
      <ErrorBanner
        message="Invalid OAuth session"
        onDismiss={handleDismiss}
      />
    );

    expect(screen.getByText("Invalid OAuth session")).toBeInTheDocument();
    const dismissBtn = screen.getByRole("button", { name: "Dismiss error" });
    fireEvent.click(dismissBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
