import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "products-infinite10.spec.ts",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5207",
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  outputDir: "../../output/products-infinite10/results",
  reporter: "list",
});
