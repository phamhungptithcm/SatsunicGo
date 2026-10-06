import { describe, expect, it } from "vitest";
import { membershipTerm } from "../../functions/src/membership";
const now = 1791150000000;
const plan = { name: "PLUS", periodDays: 30 };
describe("membership authoritative term", () => {
  it("starts new and expired subscriptions at server time", () => {
    expect(membershipTerm(plan, "plus", undefined, now)).toEqual({
      startsAt: now,
      endsAt: now + 30 * 86400000,
    });
    expect(
      membershipTerm(
        plan,
        "plus",
        { state: "expired", endsAt: now + 86400000 },
        now,
      ).startsAt,
    ).toBe(now);
    expect(
      membershipTerm(plan, "plus", { state: "active", endsAt: now }, now)
        .startsAt,
    ).toBe(now);
  });
  it("extends the same active plan without losing prepaid time", () => {
    const current = {
      state: "active",
      planId: "plus",
      startsAt: now - 86400000,
      endsAt: now + 86400000,
    };
    expect(membershipTerm(plan, "plus", current, now)).toEqual({
      startsAt: current.startsAt,
      endsAt: current.endsAt + 30 * 86400000,
    });
  });
  it("refuses changing the active plan without a commercial transition policy", () => {
    expect(() =>
      membershipTerm(
        plan,
        "new-plan",
        {
          state: "active",
          planId: "old-plan",
          startsAt: now,
          endsAt: now + 86400000,
        },
        now,
      ),
    ).toThrow(/đổi gói/);
    expect(() =>
      membershipTerm(
        plan,
        "plus",
        {
          state: "active",
          planSnapshot: { name: "BUSINESS" },
          startsAt: now,
          endsAt: now + 86400000,
        },
        now,
      ),
    ).toThrow(/đổi gói/);
  });
  it("supports legacy same-name snapshots and rejects corrupt periods", () => {
    expect(
      membershipTerm(
        plan,
        "plus",
        {
          state: "active",
          planSnapshot: { name: "PLUS" },
          startsAt: now,
          endsAt: now + 86400000,
        },
        now,
      ).startsAt,
    ).toBe(now);
    for (const periodDays of [0, -1, 367, 1.5, NaN, "30"])
      expect(() =>
        membershipTerm({ ...plan, periodDays }, "plus", undefined, now),
      ).toThrow();
    expect(() =>
      membershipTerm(
        plan,
        "plus",
        {
          state: "active",
          planId: "plus",
          startsAt: now + 86400001,
          endsAt: now + 86400000,
        },
        now,
      ),
    ).toThrow();
  });
});
