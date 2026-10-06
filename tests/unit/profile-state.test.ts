import { describe, expect, it } from "vitest";
import {
  initialProfileRead,
  profileReadReducer,
  type ProfileReadAction,
} from "../../src/features/profile/profile-state";
const profile = {
  displayName: "Fixture",
  businessName: "Private business",
  marketingConsent: true,
};
describe("Profile private snapshot recovery", () => {
  it("clears private values on known lock and ignores every late callback until explicit retry", () => {
    let loaded = profileReadReducer(initialProfileRead("a"), {
      type: "profile",
      uid: "a",
      profile,
      version: 7,
    });
    loaded = profileReadReducer(loaded, {
      type: "addresses",
      uid: "a",
      addresses: [
        { id: "private", recipient: "Private", address: "Private address" },
      ],
    });
    const locked = profileReadReducer(loaded, { type: "locked", uid: "a" });
    expect(locked).toMatchObject({
      locked: true,
      profileReady: false,
      addressesReady: false,
      addresses: [],
      profile: { displayName: "", businessName: "", marketingConsent: false },
    });
    expect(locked.version).toBeUndefined();
    expect(locked.profileError).toContain("Tài khoản đang bị khóa");
    const late: ProfileReadAction[] = [
      { type: "profile", uid: "a", profile, version: 7 },
      {
        type: "addresses",
        uid: "a",
        addresses: [{ id: "late", recipient: "Late", address: "Late address" }],
      },
      { type: "edit", uid: "a", profile },
      { type: "profile-error", uid: "a" },
      { type: "addresses-error", uid: "a" },
    ];
    for (const action of late)
      expect(profileReadReducer(locked, action)).toBe(locked);
    const retry = profileReadReducer(locked, { type: "reset", uid: "a" });
    expect(retry).toMatchObject({
      locked: false,
      profileReady: false,
      addressesReady: false,
    });
    const recovered = profileReadReducer(retry, {
      type: "profile",
      uid: "a",
      profile: { ...profile, marketingConsent: false },
      version: 8,
    });
    expect(recovered).toMatchObject({
      profileReady: true,
      version: 8,
      profile: { marketingConsent: false },
    });
    expect(
      profileReadReducer(initialProfileRead("b"), { type: "locked", uid: "a" }),
    ).toEqual(initialProfileRead("b"));
  });
  it("clears private fields, consent and expected version when profile access fails", () => {
    const loaded = profileReadReducer(initialProfileRead("a"), {
      type: "profile",
      uid: "a",
      profile,
      version: 7,
    });
    const failed = profileReadReducer(loaded, {
      type: "profile-error",
      uid: "a",
    });
    expect(failed.profile).toEqual({
      displayName: "",
      businessName: "",
      marketingConsent: false,
    });
    expect(failed.version).toBeUndefined();
    expect(failed.profileReady).toBe(false);
    expect(failed.profileError).toBeTruthy();
  });
  it("removes previously displayed recipient addresses on snapshot failure", () => {
    const loaded = profileReadReducer(initialProfileRead("a"), {
      type: "addresses",
      uid: "a",
      addresses: [
        { id: "1", recipient: "Private", address: "Private address" },
      ],
    });
    expect(
      profileReadReducer(loaded, { type: "addresses-error", uid: "a" }),
    ).toMatchObject({ addresses: [], addressesReady: false });
  });
  it("ignores departed-account callbacks and prevents edits before a valid snapshot", () => {
    const b = initialProfileRead("b");
    expect(
      profileReadReducer(b, { type: "profile", uid: "a", profile, version: 7 }),
    ).toBe(b);
    expect(profileReadReducer(b, { type: "edit", uid: "b", profile })).toBe(b);
  });
  it("resets all private state on account change and restores only authoritative consent", () => {
    const loaded = profileReadReducer(initialProfileRead("a"), {
      type: "profile",
      uid: "a",
      profile,
      version: 7,
    });
    const reset = profileReadReducer(loaded, { type: "reset", uid: "b" });
    expect(reset.profileReady).toBe(false);
    expect(reset.profile.marketingConsent).toBe(false);
    const recovered = profileReadReducer(reset, {
      type: "profile",
      uid: "b",
      profile: { ...profile, marketingConsent: false },
      version: 2,
    });
    expect(recovered.profileReady).toBe(true);
    expect(recovered.profile.marketingConsent).toBe(false);
    expect(recovered.profileError).toBe("");
  });
});
