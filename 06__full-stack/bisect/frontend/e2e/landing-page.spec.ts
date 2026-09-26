import { test, expect } from "@playwright/test";
import { BASE_URL, signIn } from "./helpers/test-env";

test.describe("Landing Page & Public Flow", () => {
  test("unauthenticated visitor sees full landing page sections", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Brand and Navigation
    await expect(page.getByRole("link", { name: /BISect/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Sign in with GitHub" }).first()).toBeVisible();

    // Hero Section
    await expect(
      page.getByRole("heading", { name: /Automate.*Regression Isolation/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "See How It Works" })).toBeVisible();

    // Interactive Terminal simulator
    await expect(page.getByText("bisect-cockpit ~ session-8f2a1b9")).toBeVisible();

    // Metrics Banner
    await expect(page.getByText("85%", { exact: true })).toBeVisible();
    await expect(page.getByText("Triage Time Saved")).toBeVisible();
    await expect(page.getByText("100%", { exact: true })).toBeVisible();
    await expect(page.getByText("Container Sandboxed").first()).toBeVisible();

    // Feature Grid
    await expect(
      page.getByRole("heading", { name: "Everything you need to debug regressions with confidence" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Automated Git Bisect Engine" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Sub-Second Groq AI Inference" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Isolated Podman Sandboxes" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Human-in-the-Loop Safety Gate" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Live Execution Trace & Telemetry" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Visual Diff Review & Patching" })
    ).toBeVisible();

    // How It Works
    await expect(
      page.getByRole("heading", { name: "From broken test to verified patch in three steps" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Connect Repo & Define Objective" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sandboxed Bisect & Fast Diagnosis" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Review Diff & Approve Safety Gate" })).toBeVisible();

    // Testimonials / Social Proof
    await expect(
      page.getByRole("heading", { name: "Trusted by engineers who care about speed and safety" })
    ).toBeVisible();
    await expect(page.getByText("Marcus Chen")).toBeVisible();

    // CTA Banner
    await expect(
      page.getByRole("heading", { name: "Ready to eliminate manual git bisecting?" })
    ).toBeVisible();

    // Footer
    await expect(page.getByText(/Developer cockpit for automated Git bisect regression localization/i)).toBeVisible();
  });

  test("authenticated visitor on root is redirected to /workspace", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE_URL}/`);

    // Should automatically redirect to /workspace
    await expect(page).toHaveURL(`${BASE_URL}/workspace`, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Agent Workspace" })
    ).toBeVisible();
  });
});
