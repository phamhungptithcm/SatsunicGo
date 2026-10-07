import { describe, expect, it, vi } from "vitest";
import type { User, TotpSecret } from "firebase/auth";
const sdk = vi.hoisted(() => ({ enroll: vi.fn(), assertion: vi.fn() }));
vi.mock("firebase/auth", () => ({
  multiFactor: () => ({ enroll: sdk.enroll }),
  TotpMultiFactorGenerator: { assertionForEnrollment: sdk.assertion },
}));
import {
  enrollTotp,
  waitForEnrollment,
  publishEnrollment,
  subscribeEnrollment,
} from "../../src/features/auth/enrollment";
const secret = {} as TotpSecret;
describe("shared MFA enrollment lifecycle", () => {
  it("prevents competing requests across User objects for the same account and releases after success", async () => {
    const first = { uid: "fixture-same-account" } as User;
    const replacement = { uid: first.uid } as User;
    let finish!: () => void;
    sdk.enroll.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const operation = enrollTotp(first, secret, "123456");
    let settled = false;
    const waiting = waitForEnrollment(replacement).then(() => {
      settled = true;
    });
    await expect(enrollTotp(replacement, secret, "654321")).rejects.toThrow(
      "ENROLLMENT_PENDING",
    );
    expect(settled).toBe(false);
    expect(sdk.enroll).toHaveBeenCalledTimes(1);
    finish();
    await operation;
    await waiting;
    sdk.enroll.mockResolvedValueOnce(undefined);
    await enrollTotp(replacement, secret, "654321");
    expect(sdk.enroll).toHaveBeenCalledTimes(2);
  });
  it("preserves provider failure for the caller while releasing the shared lock", async () => {
    const user = { uid: "fixture-failure" } as User;
    const failure = { code: "auth/network-request-failed" };
    sdk.enroll.mockRejectedValueOnce(failure);
    const operation = enrollTotp(user, secret, "123456");
    await waitForEnrollment(user);
    await expect(operation).rejects.toBe(failure);
    sdk.enroll.mockResolvedValueOnce(undefined);
    await expect(enrollTotp(user, secret, "654321")).resolves.toBeUndefined();
  });
  it("does not replay enrollment records to later views and unsubscribes", () => {
    const user = { uid: "fixture-notification" } as User;
    const first = vi.fn();
    const stop = subscribeEnrollment(first);
    publishEnrollment(user, 0);
    expect(first).not.toHaveBeenCalled();
    publishEnrollment(user, 1);
    expect(first).toHaveBeenCalledExactlyOnceWith(user, 1);
    stop();
    const next = vi.fn();
    const stopNext = subscribeEnrollment(next);
    expect(next).not.toHaveBeenCalled();
    publishEnrollment(user, 2);
    expect(first).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledExactlyOnceWith(user, 2);
    stopNext();
  });
});
