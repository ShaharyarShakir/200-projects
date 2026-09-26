/**
 * Browser check for the artifact panels and the aggregate activity feed.
 *
 * Runs against the live dev servers, so every assertion below is the rendered
 * result of a real HTTP response rather than a fixture. The access token is
 * injected into storage instead of completing an OAuth round trip.
 *
 * Not part of `pnpm test`, which is jsdom. Run with both servers up:
 *   E2E_ACCESS_TOKEN=$(...) npx playwright test e2e/artifact-panels.spec.ts \
 *     --project=chromium
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const TOKEN = process.env.E2E_ACCESS_TOKEN || "";
const SESSION_ID = process.env.E2E_SESSION_ID || "";

/** Seeds the token `tokenStorage` reads (src/lib/api/client.ts) before boot. */
async function signIn(page: Page): Promise<void> {
  await page.addInitScript((token: string) => {
    window.localStorage.setItem("bisect_auth_token", token);
  }, TOKEN);
}

/** Text the panels used to fabricate before they were wired to the API. */
const INVENTED = [
  "breaking commit isolated:",
  "shaharyar",
  "48 tests passed",
  "not available yet",
  "will fill in once",
];

test.describe("artifact panels and aggregate activity over real responses", () => {
  test("a session with no artifacts shows explicit unavailable states", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`${BASE}/workspace`);

    // A real POST creates the session; nothing runs, so there are no artifacts.
    await page
      .getByPlaceholder(/Identify failing test/)
      .fill("browser check: confirm panels state honestly with no artifacts");
    await page.getByRole("button", { name: "Start Task" }).click();

    // The panels are tabbed, so open the timeline before asserting its state.
    await page.getByRole("button", { name: "Bisect Timeline" }).click();
    await expect(page.getByTestId("timeline-unavailable")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "No bisect timeline for this session" })
    ).toBeVisible();

    // Switching tabs unmounts the previous panel, so assert each in turn.
    await page.getByRole("button", { name: "Diff & Patch Review" }).click();
    await expect(page.getByTestId("diff-unavailable")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No patch for this session" })
    ).toBeVisible();

    // The fabricated content the panels used to invent must not be reachable.
    const text = (await page.locator("body").innerText()).toLowerCase();
    for (const phrase of INVENTED) {
      expect(text, `invented content rendered: ${phrase}`).not.toContain(phrase);
    }

    await page.screenshot({
      path: "e2e/screenshots/panels-unavailable.png",
      fullPage: true,
    });
  });

  test("activity merges every owned session and labels each row", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`${BASE}/activity`);
    await page.getByRole("button", { name: /All sessions/ }).click();

    await expect(
      page.getByRole("heading", { name: "All Sessions Activity" })
    ).toBeVisible();
    await expect(page.getByText(/represented/)).toBeVisible();

    const rows = page.locator("li");
    await expect(rows.first()).toBeVisible();

    // Each row carries a session label chip. The same prompt also appears in
    // the filter <select>, so scope to the chip inside the feed.
    const chips = page.locator('li span[title]');
    await expect(chips.first()).toBeVisible();
    expect(await chips.count()).toBeGreaterThan(1);

    // A per-session sequence range would be meaningless across sessions.
    await expect(page.getByText(/^seq \d+–\d+$/)).toHaveCount(0);

    const text = (await page.locator("body").innerText()).toLowerCase();
    for (const phrase of INVENTED) {
      expect(text, `invented content rendered: ${phrase}`).not.toContain(phrase);
    }

    await page.screenshot({
      path: "e2e/screenshots/activity-all.png",
      fullPage: true,
    });
  });

  test("a single session keeps its own sequence range", async ({ page }) => {
    await signIn(page);
    await page.goto(`${BASE}/activity`);

    // Nothing is selected by default, and the page says so rather than
    // guessing a session.
    await expect(
      page.getByRole("heading", { name: "No Session Selected" })
    ).toBeVisible();

    await page.getByRole("combobox", { name: "Select a session" }).selectOption(SESSION_ID);

    await expect(
      page.getByRole("heading", { name: "Activity & Execution Feed" })
    ).toBeVisible();

    // The per-session sequence range is meaningful here and hidden in the
    // aggregate view, which spans sessions with unrelated counters.
    await expect(page.getByText(/^seq \d+–\d+$/).first()).toBeVisible();
  });
});
