import { test, expect } from "@playwright/test";
import { BASE_URL, signIn } from "./helpers/test-env";

test.describe("Sessions History and Management", () => {
  test("lists user sessions with filtering and search", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE_URL}/sessions`);

    await expect(
      page.getByRole("heading", { name: "Sessions" })
    ).toBeVisible({ timeout: 15_000 });

    // Search bar and controls
    const searchInput = page.getByPlaceholder(/Search by prompt/i);
    await expect(searchInput).toBeVisible();
    await expect(page.getByRole("combobox").first()).toBeVisible();

    // Verify session rows are loaded
    await expect(
      page.getByText("Fix the inverted add() operator and update its test").first()
    ).toBeVisible({ timeout: 15_000 });

    // Test Search Filter
    await searchInput.fill("inverted add");
    await expect(
      page.getByText("Fix the inverted add() operator and update its test").first()
    ).toBeVisible({ timeout: 15_000 });

    // Clearing search
    await searchInput.fill("");

    // Test Reload Button
    const reloadBtn = page.getByRole("button", { name: /Reload/i });
    await expect(reloadBtn).toBeVisible();
    await reloadBtn.click();
  });

  test("clicking a session navigates to the workspace with that session active", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`${BASE_URL}/sessions`);

    // Locate the row for the target session
    const sessionRow = page.locator("tr", {
      hasText: "Fix the inverted add() operator and update its test",
    });
    await expect(sessionRow).toBeVisible({ timeout: 15_000 });

    // Click on its Workspace link
    const workspaceLink = sessionRow.getByRole("link", { name: "Workspace" });
    await expect(workspaceLink).toBeVisible();
    await workspaceLink.click();

    // Should navigate to /workspace?session_id=...
    await expect(page).toHaveURL(/\/workspace\?session_id=[0-9a-f]{32}/, {
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "Agent Workspace" })
    ).toBeVisible({ timeout: 15_000 });
  });
});
