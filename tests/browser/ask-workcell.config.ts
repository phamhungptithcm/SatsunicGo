import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "ask-workcell.spec.ts",
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:5207",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  outputDir: "../../output/ask-integration-4/browser",
  reporter: [
    ["list"],
    [
      "json",
      { outputFile: "../../output/ask-integration-4/browser-result.json" },
    ],
  ],
});
