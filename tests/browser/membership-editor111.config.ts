import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "membership-editor111.spec.ts",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5207", headless: true },
  outputDir: "../../output/membership111/results",
  reporter: "list",
});
