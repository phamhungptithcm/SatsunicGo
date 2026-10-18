import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: [
      "tests/integration/staff-invitations.firestore.test.ts",
      "tests/rules/staff-invitations.test.ts",
    ],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
