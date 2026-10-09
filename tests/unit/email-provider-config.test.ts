import { describe, expect, test } from "vitest";
import {
  emailProviderReady,
  parseEmailProviderConfig,
} from "../../functions/src/email/provider-config";

const now = Date.UTC(2026, 9, 9, 12);
const config = {
  approved: true,
  provider: "resend",
  enabled: true,
  subscriptionsEnabled: true,
  from: "contact@hunpeolabs.com",
  verifiedDomain: "hunpeolabs.com",
  cutoverAt: now,
  dailyAttemptLimit: 100,
  domainVerificationEvidenceId: "release/domain-verification-1",
  domainVerifiedAt: now - 1,
};

describe("trusted Resend configuration", () => {
  test("verified enabled configuration is ready; limits may be reduced", () => {
    expect(emailProviderReady(parseEmailProviderConfig(config), now)).toBe(
      true,
    );
    expect(
      parseEmailProviderConfig({ ...config, dailyAttemptLimit: 1 })
        ?.dailyAttemptLimit,
    ).toBe(1);
  });
  test("disabled staging is valid but cannot send", () => {
    const staged = { ...config, enabled: false };
    delete (staged as Partial<typeof staged>).domainVerifiedAt;
    delete (staged as Partial<typeof staged>).domainVerificationEvidenceId;
    expect(parseEmailProviderConfig(staged)).not.toBeNull();
    expect(emailProviderReady(parseEmailProviderConfig(staged), now)).toBe(
      false,
    );
  });
  test.each([
    { cutoverAt: now, ready: true },
    { cutoverAt: now + 1, ready: false },
  ])("readiness honors the cutover boundary: %j", ({ cutoverAt, ready }) => {
    const parsed = parseEmailProviderConfig({ ...config, cutoverAt });
    expect(parsed).not.toBeNull();
    expect(emailProviderReady(parsed, now)).toBe(ready);
  });
  test.each([
    { approved: false },
    { provider: "smtp" },
    { enabled: "true" },
    { subscriptionsEnabled: 1 },
    { from: "contact@example.invalid" },
    { from: "Contact <contact@hunpeolabs.com>" },
    { verifiedDomain: "resend.dev" },
    { cutoverAt: -1 },
    { cutoverAt: 0 },
    { cutoverAt: 1.5 },
    { cutoverAt: Number.MAX_SAFE_INTEGER },
    { dailyAttemptLimit: 0 },
    { dailyAttemptLimit: 101 },
    { dailyAttemptLimit: 1.1 },
    { domainVerificationEvidenceId: "private@example.invalid" },
    { domainVerifiedAt: -1 },
    { host: "legacy-smtp.invalid" },
  ])("invalid settings fail closed: %j", (delta) => {
    expect(parseEmailProviderConfig({ ...config, ...delta })).toBeNull();
  });
  test.each([null, undefined, [], true, "resend", {}])(
    "missing configuration fails closed",
    (value) => {
      expect(parseEmailProviderConfig(value)).toBeNull();
    },
  );
  test("a claimed verified domain alone does not make email ready", () => {
    const {
      domainVerificationEvidenceId: _receipt,
      domainVerifiedAt: _time,
      ...unverified
    } = config;
    expect(emailProviderReady(parseEmailProviderConfig(unverified), now)).toBe(
      false,
    );
    expect(
      emailProviderReady(
        parseEmailProviderConfig({ ...config, domainVerifiedAt: now + 1 }),
        now,
      ),
    ).toBe(false);
    expect(
      emailProviderReady(parseEmailProviderConfig(config), Number.NaN),
    ).toBe(false);
  });
});
