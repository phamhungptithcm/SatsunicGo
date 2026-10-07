import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "../..",
  testMatch: "notifications079.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:5198", headless: true, trace: "off" },
  outputDir: "../../../../output/notifications079/results",
});
