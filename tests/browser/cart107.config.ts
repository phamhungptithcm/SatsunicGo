import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "cart107.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 40_000,
  expect: { timeout: 10_000 },
  outputDir: "../../output/cart107/browser",
  reporter: [
    ["list"],
    ["json", { outputFile: "output/cart107/browser-results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:5207",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
