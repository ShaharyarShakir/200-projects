import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import WorkspacePage from "../app/workspace/page";
import SessionsPage from "../app/sessions/page";
import ActivityPage from "../app/activity/page";
import SettingsPage from "../app/settings/page";
import { AuthProvider } from "../lib/auth/useAuth";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// These suites exercise page content, not the auth gate. The guard is mocked
// open so a missing token does not blank the page; RequireAuth's own
// behaviour is covered in require-auth.test.tsx.
vi.mock("@/components/auth/RequireAuth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function renderPage(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe("Application routing views", () => {
  it("renders the workspace view", () => {
    renderPage(<WorkspacePage />);
    expect(screen.getByText("Agent Workspace")).toBeInTheDocument();
  });

  it("renders the sessions view", () => {
    renderPage(<SessionsPage />);
    expect(screen.getByRole("heading", { name: "Sessions" })).toBeInTheDocument();
  });

  it("renders the activity view", () => {
    renderPage(<ActivityPage />);
    expect(screen.getByRole("heading", { name: "Activity" })).toBeInTheDocument();
  });

  it("renders the settings view", () => {
    renderPage(<SettingsPage />);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });
});
