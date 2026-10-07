import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/rules/ask-pilot106.test.ts"],
    pool: "threads",
    maxWorkers: 1,
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
