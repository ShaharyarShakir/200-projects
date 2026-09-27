import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { LandingNavbar } from "../components/landing/LandingNavbar";
import { HeroTerminal } from "../components/landing/HeroTerminal";
import { HeroSection } from "../components/landing/HeroSection";
import { MetricsBanner } from "../components/landing/MetricsBanner";
import { FeatureGrid } from "../components/landing/FeatureGrid";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { TestimonialsSection } from "../components/landing/TestimonialsSection";
import { CtaBanner } from "../components/landing/CtaBanner";
import { LandingFooter } from "../components/landing/LandingFooter";
import Home from "../app/page";
import { AuthProvider } from "../lib/auth/useAuth";
import { tokenStorage } from "../lib/api/client";
import { authApi } from "../lib/api/auth";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/",
}));

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe("Bisect Landing Page Components", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    mockReplace.mockClear();
    mockPush.mockClear();
  });

  describe("LandingNavbar", () => {
    it("renders brand logo, anchor links, and sign in CTA", () => {
      const onSignIn = vi.fn();
      renderWithAuth(<LandingNavbar onSignIn={onSignIn} />);

      expect(screen.getByText("BISect")).toBeInTheDocument();
      expect(screen.getByText("AGENT COCKPIT")).toBeInTheDocument();
      expect(screen.getByText("Features")).toBeInTheDocument();
      expect(screen.getByText("How It Works")).toBeInTheDocument();
      expect(screen.getByText("Reviews")).toBeInTheDocument();

      const signInButtons = screen.getAllByText("Sign in with GitHub");
      expect(signInButtons.length).toBeGreaterThan(0);

      fireEvent.click(signInButtons[0]);
      expect(onSignIn).toHaveBeenCalled();
    });

    it("opens and closes the mobile menu drawer", () => {
      renderWithAuth(<LandingNavbar />);
      const toggleBtn = screen.getByLabelText("Toggle mobile menu");
      fireEvent.click(toggleBtn);

      // Now mobile nav links should be in the DOM
      expect(screen.getAllByText("Features").length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("HeroTerminal & HeroSection", () => {
    it("renders hero headline, badge, and terminal window", () => {
      renderWithAuth(<HeroSection />);

      expect(
        screen.getByRole("heading", { level: 1, name: /Automate/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Groq Ultra-Fast AI & Podman Sandboxes/i)
      ).toBeInTheDocument();
    });

    it("allows switching terminal steps and approving safety gate patch", () => {
      render(<HeroTerminal />);

      // Step tabs
      const sandboxTab = screen.getByText("1. Sandbox Init");
      const bisectTab = screen.getByText("2. Automated Bisect");
      const aiTab = screen.getByText("3. Groq AI Diagnosis");
      const gateTab = screen.getByText("4. Human Safety Gate");

      expect(sandboxTab).toBeInTheDocument();
      expect(bisectTab).toBeInTheDocument();
      expect(aiTab).toBeInTheDocument();
      expect(gateTab).toBeInTheDocument();

      // Click Safety Gate tab
      fireEvent.click(gateTab);
      expect(
        screen.getByText("Human Safety Gate: Apply Diff?")
      ).toBeInTheDocument();

      // Click Approve Fix button
      const approveBtn = screen.getByText("Approve Fix");
      fireEvent.click(approveBtn);
      expect(
        screen.getByText("Patch Approved & Applied")
      ).toBeInTheDocument();
    });
  });

  describe("MetricsBanner", () => {
    it("renders all 4 quantified proof metrics", () => {
      render(<MetricsBanner />);
      expect(screen.getByText("85%")).toBeInTheDocument();
      expect(screen.getByText("< 2.0s")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();

      expect(screen.getByText("Triage Time Saved")).toBeInTheDocument();
      expect(screen.getByText("Groq Reasoning Latency")).toBeInTheDocument();
      expect(screen.getByText("Container Sandboxed")).toBeInTheDocument();
      expect(screen.getByText("Unapproved Writes")).toBeInTheDocument();
    });
  });

  describe("FeatureGrid", () => {
    it("renders 6 core capability cards", () => {
      render(<FeatureGrid />);
      expect(
        screen.getByText("Automated Git Bisect Engine")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Sub-Second Groq AI Inference")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Isolated Podman Sandboxes")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Human-in-the-Loop Safety Gate")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Live Execution Trace & Telemetry")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Visual Diff Review & Patching")
      ).toBeInTheDocument();
    });
  });

  describe("HowItWorksSection", () => {
    it("renders 3-step workflow pipeline with code preview snippets", () => {
      render(<HowItWorksSection />);
      expect(screen.getByText("01")).toBeInTheDocument();
      expect(screen.getByText("02")).toBeInTheDocument();
      expect(screen.getByText("03")).toBeInTheDocument();

      expect(
        screen.getByText("Connect Repo & Define Objective")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Sandboxed Bisect & Fast Diagnosis")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Review Diff & Approve Safety Gate")
      ).toBeInTheDocument();
    });
  });

  describe("TestimonialsSection", () => {
    it("renders developer reviews and verified proof badges", () => {
      render(<TestimonialsSection />);
      expect(screen.getByText("Marcus Chen")).toBeInTheDocument();
      expect(screen.getByText("Elena Rostova")).toBeInTheDocument();
      expect(screen.getByText("David Vance")).toBeInTheDocument();

      expect(
        screen.getByText("4.2 hrs saved / incident")
      ).toBeInTheDocument();
      expect(screen.getByText("85% faster triage")).toBeInTheDocument();
      expect(
        screen.getByText("Zero unreviewed writes")
      ).toBeInTheDocument();
    });
  });

  describe("CtaBanner & LandingFooter", () => {
    it("renders CTA headline and footer sections", () => {
      renderWithAuth(<CtaBanner />);
      expect(
        screen.getByText("Ready to eliminate manual git bisecting?")
      ).toBeInTheDocument();

      render(<LandingFooter />);
      expect(
        screen.getByText("All Systems Operational")
      ).toBeInTheDocument();
      expect(screen.getByText("Product")).toBeInTheDocument();
      expect(screen.getByText("Architecture")).toBeInTheDocument();
      expect(screen.getByText("Resources")).toBeInTheDocument();
    });
  });

  describe("Home Page Composition & Auth Flow", () => {
    it("renders landing page when user is not authenticated", async () => {
      renderWithAuth(<Home />);

      expect(
        await screen.findByRole("heading", { level: 1, name: /Automate/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText("Everything you need to debug regressions with confidence")
      ).toBeInTheDocument();
    });

    it("redirects to /workspace when user is authenticated", async () => {
      tokenStorage.setToken("fake-jwt-token");
      vi.spyOn(authApi, "getMe").mockResolvedValue({
        id: "u1",
        github_user_id: 1234,
        github_username: "octocat",
        created_at: "2026-09-25",
        updated_at: "2026-09-25",
      });

      renderWithAuth(<Home />);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/workspace");
      });
    });
  });
});
