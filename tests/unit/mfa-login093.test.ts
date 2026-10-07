import { beforeEach, describe, expect, it, vi } from "vitest";
const sdk = vi.hoisted(() => ({ get: vi.fn(), assertion: vi.fn() }));
vi.mock("firebase/auth", () => ({
  getMultiFactorResolver: sdk.get,
  TotpMultiFactorGenerator: {
    FACTOR_ID: "totp",
    assertionForSignIn: sdk.assertion,
  },
}));
import {
  captureMfa,
  clearMfa,
  pendingMfa,
  subscribeMfa,
  verifyMfa,
} from "../../src/features/auth/mfa";
import type { Auth } from "firebase/auth";
const auth = {} as Auth;
function capture(resolveSignIn = vi.fn().mockResolvedValue({})) {
  const resolver = {
    hints: [{ uid: "fixture-factor", factorId: "totp" }],
    resolveSignIn,
  };
  sdk.get.mockReturnValue(resolver);
  captureMfa({ code: "auth/multi-factor-auth-required" }, auth);
  return resolver;
}
beforeEach(() => {
  clearMfa();
  vi.clearAllMocks();
});
describe("login MFA lifecycle", () => {
  it("notifies capture and cancellation, and unsubscribes", () => {
    const changed = vi.fn();
    const stop = subscribeMfa(changed);
    const r = capture();
    expect(pendingMfa()).toBe(r);
    clearMfa();
    expect(changed).toHaveBeenCalledTimes(2);
    stop();
    capture();
    expect(changed).toHaveBeenCalledTimes(2);
  });
  it("ignores unrelated errors and absent auth", () => {
    expect(captureMfa(null, auth)).toBe(false);
    expect(captureMfa({ code: "auth/multi-factor-auth-required" }, null)).toBe(
      false,
    );
    expect(sdk.get).not.toHaveBeenCalled();
  });
  it("rejects malformed codes and unknown factors before SDK invocation", async () => {
    const r = capture();
    await expect(verifyMfa("fixture-factor", "12")).rejects.toThrow();
    await expect(verifyMfa("other", "123456")).rejects.toThrow();
    expect(r.resolveSignIn).not.toHaveBeenCalled();
  });
  it("preserves challenge on wrong code and completes retry", async () => {
    const run = vi
      .fn()
      .mockRejectedValueOnce({ code: "auth/invalid-verification-code" })
      .mockResolvedValue({});
    const r = capture(run);
    await expect(verifyMfa("fixture-factor", "123456")).rejects.toBeDefined();
    expect(pendingMfa()).toBe(r);
    await verifyMfa("fixture-factor", "654321");
    expect(pendingMfa()).toBeNull();
  });
  it("does not erase a replacement challenge on late completion", async () => {
    let done!: () => void;
    capture(
      vi.fn(
        () =>
          new Promise<void>((resolve) => {
            done = resolve;
          }),
      ),
    );
    const first = verifyMfa("fixture-factor", "123456");
    const next = capture();
    done();
    await first;
    expect(pendingMfa()).toBe(next);
  });
  it("requires an active challenge", async () => {
    await expect(verifyMfa("fixture-factor", "123456")).rejects.toThrow(
      "NO_CHALLENGE",
    );
  });
});
