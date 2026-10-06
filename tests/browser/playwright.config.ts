import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { artifactDirectory } from "./artifact-path";

const baseURL = process.env.SATSUNICGO_SANITY_URL;
if (baseURL !== "http://127.0.0.1:5187")
  throw Error("Browser sanity requires its isolated loopback UI at port5187");
export default defineConfig({
  testDir: ".",
  testMatch: "release-*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  expect: { timeout: 12000 },
  outputDir: `../../${artifactDirectory}/results`,
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: fileURLToPath(
          new URL(
            `../../${artifactDirectory}/browser-results.json`,
            import.meta.url,
          ),
        ),
      },
    ],
  ],
  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "off",
  },
});
