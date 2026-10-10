import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Auth } from "firebase/auth";
const sdk = vi.hoisted(() => ({
  popup: vi.fn(),
  listener: vi.fn(),
  token: vi.fn(),
  capture: vi.fn(),
  pending: vi.fn(),
  wait: vi.fn(),
  clear: vi.fn(),
}));
vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: class {},
  reauthenticateWithPopup: sdk.popup,
  onAuthStateChanged: sdk.listener,
}));
vi.mock("../../src/features/auth/mfa", () => ({
  captureMfa: sdk.capture,
  pendingMfa: sdk.pending,
  waitForMfaResult: sdk.wait,
  clearMfa: sdk.clear,
}));
import { requestActionMfa } from "../../src/features/auth/ActionMfa";
const auth = {
  currentUser: { uid: "synthetic-owner", getIdTokenResult: sdk.token },
} as unknown as Auth;
const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  sdk.listener.mockReturnValue(vi.fn());
  sdk.pending.mockReturnValue(null);
  sdk.capture.mockReturnValue(false);
  sdk.token.mockResolvedValue({
    authTime: new Date().toISOString(),
    claims: { firebase: { sign_in_second_factor: "totp" } },
  });
});
afterEach(async () => {
  await vi.advanceTimersByTimeAsync(180000);
  await flush();
  vi.useRealTimers();
});
test("internal provider failure rejects promptly and releases the pending operation", async () => {
  const failure = {
    code: "auth/internal-error",
    message: "synthetic-private-provider-detail",
  };
  sdk.popup.mockRejectedValueOnce(failure).mockResolvedValueOnce({});
  const first = requestActionMfa(auth);
  let settled = false;
  const result = first.catch((error) => error);
  void result.then(() => {
    settled = true;
  });
  await flush();
  // The previous implementation remains pending until its three-minute timeout.
  expect(settled).toBe(true);
  expect(await result).toBe(failure);
  expect(sdk.token).not.toHaveBeenCalled();
  await expect(requestActionMfa(auth)).resolves.toBeUndefined();
  expect(sdk.popup).toHaveBeenCalledTimes(2);
});
test("explicit popup blocking remains pending and times out without authenticating", async () => {
  sdk.popup.mockRejectedValue({ code: "auth/popup-blocked" });
  const first = requestActionMfa(auth);
  const result = first.catch((error) => error);
  expect(requestActionMfa(auth)).toBe(first);
  await flush();
  expect(sdk.token).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(180000);
  expect((await result).message).toContain("hết hạn");
});
test("a successful Google response alone cannot replace a fresh second factor", async () => {
  sdk.popup.mockResolvedValue({});
  sdk.token.mockResolvedValue({
    authTime: new Date().toISOString(),
    claims: { firebase: {} },
  });
  await expect(requestActionMfa(auth)).rejects.toThrow("hai lớp");
});
test("MFA challenge must resolve before token verification", async () => {
  sdk.popup.mockRejectedValue({ code: "auth/multi-factor-auth-required" });
  sdk.capture.mockReturnValue(true);
  let finish!: () => void;
  sdk.wait.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const result = requestActionMfa(auth);
  await flush();
  expect(sdk.token).not.toHaveBeenCalled();
  finish();
  await expect(result).resolves.toBeUndefined();
});

test.each([-31000, 300000])(
  "rejects second-factor tokens outside the fresh window: %s",
  async (age) => {
    sdk.popup.mockResolvedValue({});
    sdk.token.mockResolvedValue({
      authTime: new Date(Date.now() - age).toISOString(),
      claims: { firebase: { sign_in_second_factor: "totp" } },
    });
    await expect(requestActionMfa(auth)).rejects.toThrow("hai lớp");
  },
);
test("identity changes cancel the pending operation without token verification", async () => {
  sdk.popup.mockImplementation(() => new Promise(() => {}));
  const first = requestActionMfa(auth);
  const check = expect(first).rejects.toMatchObject({ code: "auth/cancelled" });
  sdk.listener.mock.calls[0][1]({ uid: "different-synthetic-user" });
  await check;
  expect(sdk.token).not.toHaveBeenCalled();
});
test("late popup completion cannot authenticate a timed-out replacement flight", async () => {
  let finish!: () => void;
  sdk.popup.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const first = requestActionMfa(auth).catch((error) => error);
  await vi.advanceTimersByTimeAsync(180000);
  expect((await first).message).toContain("hết hạn");
  sdk.popup.mockResolvedValueOnce({});
  await expect(requestActionMfa(auth)).resolves.toBeUndefined();
  finish();
  await flush();
  expect(sdk.token).toHaveBeenCalledTimes(1);
});

test("malformed authTime cannot satisfy recent MFA", async () => {
  sdk.popup.mockResolvedValue({});
  sdk.token.mockResolvedValue({
    authTime: "not-a-timestamp",
    claims: { firebase: { sign_in_second_factor: "totp" } },
  });
  await expect(requestActionMfa(auth)).rejects.toThrow("hai lớp");
});
