import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "settings110.spec.ts",
  workers: 1,
  retries: 0,
  use: { baseURL: "http://127.0.0.1:5207", headless: true },
  outputDir: "../../output/settings110/results",
  reporter: "list",
});
