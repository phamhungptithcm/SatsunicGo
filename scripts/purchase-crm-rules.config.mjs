import config from "../vitest.rules.config.ts";
export default {
  ...config,
  test: {
    ...config.test,
    include: ["tests/rules/purchase-crm-recipient.test.ts"],
  },
};
