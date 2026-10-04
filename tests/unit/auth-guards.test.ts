import { test, expect } from "vitest";
import { recentMfa } from "../../functions/src/auth/guards";
test("recent MFA fails closed for missing, malformed, stale or future authentication timestamps", () => {
  const now = 1700000000000,
    valid = {
      auth_time: now / 1000,
      firebase: { sign_in_second_factor: "totp" },
    };
  expect(recentMfa(valid, now)).toBe(true);
  for (const token of [
    { ...valid, auth_time: undefined },
    { ...valid, auth_time: "bad" },
    { ...valid, auth_time: now / 1000 - 300 },
    { ...valid, auth_time: now / 1000 + 31 },
    { ...valid, firebase: {} },
  ])
    expect(recentMfa(token, now)).toBe(false);
});
