import config from "../vitest.rules.config.ts";
export default {
  ...config,
  test: {
    ...config.test,
    include: [
      "tests/rules/purchase-sepay.test.ts",
      "tests/rules/purchase-sepay-private.test.ts",
      "tests/rules/purchase-receipt-orphans.test.ts",
    ],
  },
};
