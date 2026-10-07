import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "login105.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 30000,
  expect: { timeout: 8000 },
  outputDir: "../../output/login105/results",
  reporter: [
    ["list"],
    ["json", { outputFile: "output/login105/results.json" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:5207",
    headless: true,
    trace: "off",
    screenshot: "only-on-failure",
  },
});
