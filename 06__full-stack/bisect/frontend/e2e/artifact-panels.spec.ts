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

import { test, expect } from "@playwright/test";
import {
  BASE_URL as BASE,
  signIn,
  SESSION_WITH_ARTIFACTS as SESSION_ID,
  UNKNOWN_SESSION_ID,
} from "./helpers/test-env";

/** Text the panels used to fabricate before they were wired to the API. */
const INVENTED = [
  "breaking commit isolated:",
  "shaharyar",
  "48 tests passed",
  "not available yet",
  "will fill in once",
];

test.describe("artifact panels and aggregate activity over real responses", () => {
  test("a stored session opens from its link and draws both panels", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`${BASE}/workspace?session_id=${SESSION_ID}`);

    // Both artifacts come from the API for this exact session.
    await page.getByRole("button", { name: "Bisect Timeline" }).click();
    await expect(page.getByTestId("timeline-unavailable")).toHaveCount(0);
    await expect(page.getByText("Breaking Commit Isolated:")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("c3d4e5f").first()).toBeVisible();
    await expect(page.getByText("a1b2c3d").first()).toBeVisible();

    await page.getByRole("button", { name: "Diff & Patch Review" }).click();
    await expect(page.getByTestId("diff-unavailable")).toHaveCount(0);
    await expect(page.getByText("src/calc.py")).toBeVisible();
    await expect(page.getByText("tests/test_calc.py")).toBeVisible();
    await expect(page.getByText("return a + b")).toBeVisible();

    const text = (await page.locator("body").innerText()).toLowerCase();
    for (const phrase of INVENTED) {
      expect(text, `invented content rendered: ${phrase}`).not.toContain(phrase);
    }

    await page.screenshot({
      path: "e2e/screenshots/panels-populated.png",
      fullPage: true,
    });
  });

  test("a session id the account does not own is reported, not ignored", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto(`${BASE}/workspace?session_id=${UNKNOWN_SESSION_ID}`);

    await expect(
      page.getByText(/does not exist, or it belongs to another account/)
    ).toBeVisible({ timeout: 15_000 });
  });

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

    // Wait for the session to be created and active before switching tabs
    await expect(page).toHaveURL(/session_id=[0-9a-f]{32}/, { timeout: 15_000 });

    // The panels are tabbed, so open the timeline before asserting its state.
    await page.getByRole("button", { name: "Bisect Timeline" }).click();
    await expect(page.getByTestId("timeline-unavailable")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "No bisect timeline for this session" })
    ).toBeVisible({ timeout: 15_000 });

    // Switching tabs unmounts the previous panel, so assert each in turn.
    await page.getByRole("button", { name: "Diff & Patch Review" }).click();
    await expect(page.getByTestId("diff-unavailable")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "No patch for this session" })
    ).toBeVisible({ timeout: 15_000 });

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
