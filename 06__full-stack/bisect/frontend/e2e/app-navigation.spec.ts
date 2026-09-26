import { test, expect } from "@playwright/test";
import { BASE_URL, signIn } from "./helpers/test-env";

test.describe("Application Navigation and AppShell", () => {
  test("navigates across all main sections via sidebar", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE_URL}/workspace`);

    // 1. Initial page is Workspace
    await expect(
      page.getByRole("heading", { name: "Agent Workspace" })
    ).toBeVisible({ timeout: 15_000 });

    // 2. Navigate to Sessions
    const sessionsLink = page.getByRole("link", { name: "Sessions" });
    await sessionsLink.click();
    await expect(page).toHaveURL(`${BASE_URL}/sessions`, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Sessions" })
    ).toBeVisible({ timeout: 15_000 });

    // 3. Navigate to Activity
    const activityLink = page.getByRole("link", { name: "Activity" });
    await activityLink.click();
    await expect(page).toHaveURL(`${BASE_URL}/activity`, { timeout: 15_000 });
    await expect(
      page.getByText(/Activity & Execution Feed|All Sessions Activity|No Session Selected/)
    ).toBeVisible({ timeout: 15_000 });

    // 4. Navigate to Settings
    const settingsLink = page.getByRole("link", { name: "Settings" });
    await settingsLink.click();
    await expect(page).toHaveURL(`${BASE_URL}/settings`, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Settings" })
    ).toBeVisible({ timeout: 15_000 });

    // 5. Navigate back to Workspace
    const workspaceLink = page.getByRole("link", { name: "Workspace" });
    await workspaceLink.click();
    await expect(page).toHaveURL(`${BASE_URL}/workspace`, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Agent Workspace" })
    ).toBeVisible({ timeout: 15_000 });
  });
});
