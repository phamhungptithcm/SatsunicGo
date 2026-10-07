import process from "node:process";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "../..",
  testMatch: "request083.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:5203", headless: true, trace: "off" },
  webServer: {
    command:
      "./node_modules/.bin/vite --config tests/browser/fixtures/request083/vite.config.mjs",
    cwd: process.cwd(),
    url: "http://127.0.0.1:5203/tests/browser/fixtures/request083/index.html",
    reuseExistingServer: false,
    timeout: 30000,
  },
  outputDir: "../../../../output/request083/results",
});
