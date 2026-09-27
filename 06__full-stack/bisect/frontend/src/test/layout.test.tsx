import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { AppShell } from "../components/layout/AppShell";
import { AuthProvider } from "../lib/auth/useAuth";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workspace",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe("Application Shell Layout", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders brand identity and unauthenticated login action", async () => {
    renderWithAuth(<Header />);
    expect(screen.getByText("BISect")).toBeInTheDocument();
    expect(screen.getByText("Sign in with GitHub")).toBeInTheDocument();
  });

  it("renders navigation links in the sidebar", () => {
    render(<Sidebar open />);
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("toggles the drawer overlay from AppShell on tablet-size menu click", () => {
    renderWithAuth(
      <AppShell>
        <div>Workspace content</div>
      </AppShell>
    );

    expect(screen.getByText("Workspace content")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Toggle navigation"));
    expect(screen.getByLabelText("Close navigation overlay")).toBeInTheDocument();
  });
});
