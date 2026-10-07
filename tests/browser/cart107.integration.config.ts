import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/rules/cart107.test.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
