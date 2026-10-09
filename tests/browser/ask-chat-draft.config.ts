import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "ask-chat-draft.spec.ts",
  workers: 1,
  retries: 0,
  use: { baseURL: "http://127.0.0.1:5207", headless: true },
  outputDir: "../../output/ask-chat-draft/results",
  reporter: "list",
});
