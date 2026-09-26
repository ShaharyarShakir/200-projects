import { type Page } from "@playwright/test";

export const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
export const DEFAULT_TOKEN =
  process.env.E2E_ACCESS_TOKEN ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNjExYTdhOS05ODQ0LTQ0MzMtOTlhYy1kYzA2MzJmNzJmZjkiLCJpYXQiOjE3OTA0Mjk5OTEsImV4cCI6MTc5MTAzNDc5MX0.0YHkYGLJ-OOjk7m8yB9bJyksz0v8yQM03YrtU4z5JIk";
export const SESSION_WITH_ARTIFACTS =
  process.env.E2E_SESSION_ID || "4944bd68f2b943dab717a7ac6cb265fe";
export const SESSION_WITHOUT_ARTIFACTS = "73250704219e4060b1afc9084a2e6dc3";
export const UNKNOWN_SESSION_ID = "00000000000000000000000000000000";

export async function signIn(page: Page, token = DEFAULT_TOKEN): Promise<void> {
  await page.addInitScript((t: string) => {
    window.localStorage.setItem("bisect_auth_token", t);
  }, token);
}

export async function clearAuth(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.removeItem("bisect_auth_token");
  });
}
