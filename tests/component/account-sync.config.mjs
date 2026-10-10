import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: [
      "tests/component/account-tracking-sync.test.ts",
      "tests/component/public-code-sync.test.ts",
    ],
    environment: "node",
    setupFiles: ["tests/component/guest-dom.setup.mjs"],
  },
});
