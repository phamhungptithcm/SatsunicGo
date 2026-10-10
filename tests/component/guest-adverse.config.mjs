import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/component/guest-tracking-adverse.test.ts"],
    environment: "node",
    setupFiles: ["tests/component/guest-dom.setup.mjs"],
    testTimeout: 10000,
  },
});
