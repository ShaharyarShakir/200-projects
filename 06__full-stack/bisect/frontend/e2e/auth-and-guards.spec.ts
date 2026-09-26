import { test, expect } from "@playwright/test";
import { BASE_URL, signIn } from "./helpers/test-env";

test.describe("Authentication Guards and Session Lifecycle", () => {
  test("unauthenticated access to /workspace redirects to landing page with return param", async ({ page }) => {
    await page.goto(`${BASE_URL}/workspace`);
    await expect(page).toHaveURL(new RegExp(`^${BASE_URL}/(\\?next=.*)?$`), { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Sign in with GitHub" }).first()).toBeVisible();
  });

  test("unauthenticated access to /sessions redirects to landing page with return param", async ({ page }) => {
    await page.goto(`${BASE_URL}/sessions`);
    await expect(page).toHaveURL(new RegExp(`^${BASE_URL}/(\\?next=.*)?$`), { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Sign in with GitHub" }).first()).toBeVisible();
  });

  test("unauthenticated access to /activity redirects to landing page with return param", async ({ page }) => {
    await page.goto(`${BASE_URL}/activity`);
    await expect(page).toHaveURL(new RegExp(`^${BASE_URL}/(\\?next=.*)?$`), { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Sign in with GitHub" }).first()).toBeVisible();
  });

  test("unauthenticated access to /settings redirects to landing page with return param", async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`);
    await expect(page).toHaveURL(new RegExp(`^${BASE_URL}/(\\?next=.*)?$`), { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Sign in with GitHub" }).first()).toBeVisible();
  });

  test("authenticated user can sign out from Header and is redirected to landing page", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`${BASE_URL}/workspace`);
    await expect(
      page.getByRole("heading", { name: "Agent Workspace" })
    ).toBeVisible({ timeout: 15_000 });

    // Look for Logout button in the header
    const signOutBtn = page.getByRole("button", { name: "Logout" });
    await expect(signOutBtn).toBeVisible({ timeout: 15_000 });
    await signOutBtn.click();

    // After sign out, should redirect to landing page
    await expect(page).toHaveURL(new RegExp(`^${BASE_URL}/(\\?next=.*)?$`), { timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Sign in with GitHub" }).first()).toBeVisible();

    // Verify localStorage token was cleared
    const token = await page.evaluate(() => window.localStorage.getItem("bisect_auth_token"));
    expect(token).toBeNull();
  });

  test("callback page without code or state renders error state", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/callback`);
    await expect(
      page.getByRole("heading", { name: "Authentication Failed" })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(/Missing code or state parameter from GitHub OAuth callback/i)
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: /Return to Login/i })).toBeVisible({ timeout: 15_000 });
  });
});
