import config from "../vitest.rules.config.ts";
export default {
  ...config,
  test: {
    ...config.test,
    include: [
      "scripts/purchase-gateway-shared.rules.test.ts",
      "tests/rules/purchase-provider.test.ts",
      "tests/rules/purchase-receipt-orphans.test.ts",
    ],
  },
};
