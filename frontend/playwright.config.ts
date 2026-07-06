import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the three critical journeys (register→checkout,
 * subscribe→recurring, rider assign→deliver).
 *
 * The suite drives the real web app against the real API, so it needs BOTH
 * servers up:
 *   - Web  → http://localhost:3000 (this config's `webServer`)
 *   - API  → NEXT_PUBLIC_API_URL (defaults to http://localhost:8000/api/v1)
 *
 * Locally `reuseExistingServer` latches onto a dev server already running on
 * :3000 (so we never `next build` while `next dev` holds `.next`). In CI the
 * workflow builds first and Playwright starts a fresh `next start`.
 */
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3000);
const BASE_URL = `http://localhost:${WEB_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // The journeys share one live database and provision each other's data
  // (an order placed in one step is delivered in the next), so run serially.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    // CI builds first and serves the production output; locally we run (or reuse)
    // a dev server so `npm run test:e2e` works with no prior `next build`.
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      PORT: String(WEB_PORT),
      NEXT_PUBLIC_API_URL:
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
    },
  },
});
