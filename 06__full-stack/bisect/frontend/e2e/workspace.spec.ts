import { test, expect } from "@playwright/test";
import {
  BASE_URL,
  signIn,
  SESSION_WITH_ARTIFACTS,
  SESSION_WITHOUT_ARTIFACTS,
  UNKNOWN_SESSION_ID,
} from "./helpers/test-env";

test.describe("Workspace Cockpit and Real-Time State", () => {
  test("renders workspace layout, controls, and tracker", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE_URL}/workspace`);

    await expect(
      page.getByRole("heading", { name: "Agent Workspace" })
    ).toBeVisible({ timeout: 15_000 });

    // Task input form and button
    await expect(
      page.getByPlaceholder(/Identify failing test/)
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Task" })).toBeVisible();

    // Model Selector
    await expect(page.getByText("Agent Model & Router")).toBeVisible();
    await expect(page.getByText(/Claude 3.7 Sonnet/)).toBeVisible();

    // OpenSpec Lifecycle Tracker
    await expect(page.getByText(/OpenSpec Lifecycle Progression/)).toBeVisible();
    await expect(page.getByText("Explore").first()).toBeVisible();

    // Cockpit Tabs
    await expect(page.getByRole("button", { name: "Live Execution Trace" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bisect Timeline" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Diff & Patch Review" })).toBeVisible();

    // Refresh control
    await expect(page.getByRole("button", { name: /Refresh/i })).toBeVisible();
  });

  test("creates a new session through the task input form", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE_URL}/workspace`);

    const prompt = "e2e test: reproduce failing test in auth module";
    await page.getByPlaceholder(/Identify failing test/).fill(prompt);
    await page.getByRole("button", { name: "Start Task" }).click();

    // URL should reflect the newly created session id
    await expect(page).toHaveURL(/session_id=[0-9a-f]{32}/, { timeout: 15_000 });

    // Should transition to active session view
    await expect(page.getByText(prompt).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/CREATED|RUNNING/).first()).toBeVisible();
  });

  test("opens an existing session with artifacts and switches cockpit tabs", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`${BASE_URL}/workspace?session_id=${SESSION_WITH_ARTIFACTS}`);

    // Session prompt should be loaded
    await expect(
      page.getByText("Fix the inverted add() operator and update its test").first()
    ).toBeVisible({ timeout: 15_000 });

    // 1. Activity Feed tab (Live Execution Trace)
    await page.getByRole("button", { name: "Live Execution Trace" }).click();
    await expect(page.getByText("Activity & Execution Feed")).toBeVisible({ timeout: 15_000 });

    // 2. Bisect Timeline tab
    await page.getByRole("button", { name: "Bisect Timeline" }).click();
    await expect(page.getByText("Breaking Commit Isolated:")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("c3d4e5f").first()).toBeVisible();

    // 3. Diff & Patch Review tab
    await page.getByRole("button", { name: "Diff & Patch Review" }).click();
    await expect(page.getByText("src/calc.py")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("return a + b")).toBeVisible();
  });

  test("handles unknown or unowned session id gracefully", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE_URL}/workspace?session_id=${UNKNOWN_SESSION_ID}`);

    await expect(
      page.getByText(/That session does not exist, or it belongs to another account/)
    ).toBeVisible({ timeout: 15_000 });
  });
});
