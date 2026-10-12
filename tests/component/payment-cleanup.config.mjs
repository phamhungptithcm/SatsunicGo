import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/component/payment-cleanup.test.ts"],
    environment: "node",
    setupFiles: ["tests/component/guest-dom.setup.mjs"],
  },
});
