import { describe, expect, it } from "vitest";
import {
  requireVerifiedGoogle,
  recentMfa,
} from "../../functions/src/auth/guards";

describe("verified Google callable guard", () => {
  const now = 1800000000000;
  const google = {
    uid: "fixture-user",
    token: {
      email_verified: true,
      firebase: { sign_in_provider: "google.com" },
    },
  };

  it("accepts a verified Google session", () => {
    expect(requireVerifiedGoogle(google)).toBe("fixture-user");
  });

  it("preserves Google sessions authenticated with a recent second factor", () => {
    const token = {
      ...google.token,
      auth_time: now / 1000 - 60,
      firebase: {
        ...google.token.firebase,
        sign_in_second_factor: "totp",
      },
    };
    expect(requireVerifiedGoogle({ ...google, token })).toBe("fixture-user");
    expect(recentMfa(token, now)).toBe(true);
    expect(recentMfa(token, now + 300000)).toBe(false);
  });

  it.each([undefined, null, { ...google, uid: "" }])(
    "rejects absent authentication",
    (auth) => expect(() => requireVerifiedGoogle(auth)).toThrow(),
  );

  it.each([false, undefined, "true", 1])(
    "rejects unverified or malformed verification claims",
    (email_verified) =>
      expect(() =>
        requireVerifiedGoogle({
          ...google,
          token: { ...google.token, email_verified },
        }),
      ).toThrow(),
  );

  it.each(["password", "anonymous", "custom", "phone", undefined])(
    "rejects a non-Google session even if a Google identity is linked",
    (sign_in_provider) =>
      expect(() =>
        requireVerifiedGoogle({
          ...google,
          token: {
            email_verified: true,
            firebase: {
              sign_in_provider,
              identities: { "google.com": ["fixture-google-id"] },
            },
          } as typeof google.token,
        }),
      ).toThrow(),
  );
});
