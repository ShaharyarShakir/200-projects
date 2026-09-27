import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "../app/page";
import { AuthProvider } from "../lib/auth/useAuth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("Baseline Environment Test", () => {
  it("renders home page brand title and hero headline", () => {
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );
    expect(screen.getAllByText("BISect").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Regression Isolation/i).length).toBeGreaterThanOrEqual(1);
  });
});
