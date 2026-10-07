import { URL } from "node:url";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "../..",
  testMatch: "product-detail080.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:5387", headless: true, trace: "off" },
  outputDir: "../../../../output/productdetail080/results",
  webServer: {
    cwd: fileURLToPath(new URL("../../../../", import.meta.url)),
    command:
      "node node_modules/vite/bin/vite.js --config tests/browser/fixtures/productdetail080/vite.config.mjs",
    url: "http://127.0.0.1:5387/tests/browser/fixtures/productdetail080/index.html",
    reuseExistingServer: false,
  },
});
