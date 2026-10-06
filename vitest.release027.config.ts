import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/rules/*027.test.ts"],
    setupFiles: ["tests/helpers/demo027-setup.ts"],
    fileParallelism: false,
    testTimeout: 15000,
    hookTimeout: 20000,
  },
});
