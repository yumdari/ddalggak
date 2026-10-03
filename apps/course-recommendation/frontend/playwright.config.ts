import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", timeout: 90_000, expect: { timeout: 15_000 }, fullyParallel: false, retries: 0,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000", trace: "retain-on-failure", launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } }],
});
