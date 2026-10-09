import { defineConfig } from "@playwright/test";
/** Shared frontend only. Real components; individual specs declare fixture mocks. */
export default defineConfig({
  testDir: ".",
  testMatch: [
    "ask-platform.spec.ts",
    "ask-chat-draft.spec.ts",
    "ask-catalog-chat.spec.ts",
    "ask109.spec.ts",
    "knowledge-approval.spec.ts",
    "profile-recovery.spec.ts",
    "membership-workspace.spec.ts",
    "ask-research-feedback.spec.ts",
    "ask-integration.spec.ts",
  ],
  workers: 1,
  retries: 0,
  use: { baseURL: "http://127.0.0.1:5207", headless: true },
  outputDir: "../../output/ask-acceptance/results",
  reporter: "list",
});
