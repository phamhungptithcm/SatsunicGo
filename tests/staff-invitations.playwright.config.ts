import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./browser",
  testMatch: "staff-invitations.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 45000,
  expect: { timeout: 10000 },
  outputDir: "../test-results/staff-invitations",
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5207",
    browserName: "chromium",
    timezoneId: "Asia/Ho_Chi_Minh",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "off",
  },
});
