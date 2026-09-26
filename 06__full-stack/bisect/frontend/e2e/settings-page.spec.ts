import { test, expect } from "@playwright/test";
import { BASE_URL, signIn } from "./helpers/test-env";

test.describe("Settings and Configuration", () => {
  test("renders settings page with all provider and sandbox options", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE_URL}/settings`);

    await expect(
      page.getByRole("heading", { name: "Settings" })
    ).toBeVisible({ timeout: 15_000 });

    // Section 1: AI Model Providers
    await expect(
      page.getByRole("heading", { name: "AI Model Providers & Credentials" })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Anthropic API Key/)).toBeVisible();
    await expect(page.getByText(/OpenAI API Key/)).toBeVisible();
    await expect(page.getByText(/Google Gemini API Key/)).toBeVisible();
    await expect(page.getByText(/Ollama Local Endpoint/)).toBeVisible();

    // Section 2: Podman Sandbox
    await expect(
      page.getByRole("heading", { name: "Podman Sandbox & Isolation Policy" })
    ).toBeVisible();
    await expect(page.getByText("Container Image")).toBeVisible();
    await expect(page.getByText("Max Execution Timeout (Seconds)")).toBeVisible();
    await expect(page.getByText("Memory Limit (MB)")).toBeVisible();

    // Section 3: Safety Gates
    await expect(
      page.getByRole("heading", { name: /Human-in-the-Loop Approval Gates|Human-in-the-Loop Safety Gates/i })
    ).toBeVisible();
    await expect(page.getByText(/Gate Destructive Commands/)).toBeVisible();
    await expect(page.getByText(/Gate Git Push/)).toBeVisible();

    // Save button
    const saveBtn = page.getByRole("button", { name: "Save Preferences" });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Success banner feedback
    await expect(
      page.getByText("Configuration preferences updated and applied to agent runner.")
    ).toBeVisible({ timeout: 15_000 });
  });

  test("toggles API key visibility", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE_URL}/settings`);

    // Look for password input in Anthropic section
    const keyInput = page.locator('input[type="password"]').first();
    await expect(keyInput).toBeVisible({ timeout: 15_000 });

    // Click the eye icon button next to it
    const toggleBtn = keyInput.locator("..").locator("button");
    await toggleBtn.click();

    // Now it should be text input
    const textInput = page.locator('input[type="text"]').first();
    await expect(textInput).toBeVisible({ timeout: 15_000 });
  });
});
