import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Google popup-only login ownership", () => {
  beforeEach(() => vi.resetModules());
  async function setup() { return import("../../src/features/auth/google-popup-login"); }
  function deferred() {
    let resolve!: () => void, reject!: (error: unknown) => void;
    const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
  }
  it("opens synchronously within click activation, closes on success and releases listeners", async () => {
    const login = await setup(), task = deferred(), listen = vi.fn();
    const stop = login.subscribeGoogleLogin(listen);
    const popup = vi.fn(() => task.promise);
    const pending = login.googlePopupLogin(popup, () => false);
    expect(popup).toHaveBeenCalledTimes(1);
    expect(login.googleLoginSnapshot()).toEqual({ open: true, busy: true, error: "" });
    task.resolve(); await pending;
    expect(login.googleLoginSnapshot()).toEqual({ open: false, busy: false, error: "" });
    stop(); listen.mockClear(); login.dismissGoogleLogin();
    expect(listen).not.toHaveBeenCalled();
  });
  it("deduplicates across all login callers, including after overlay dismissal", async () => {
    const login = await setup(), task = deferred(), popup = vi.fn(() => task.promise);
    const first = login.googlePopupLogin(popup, () => false);
    login.dismissGoogleLogin();
    expect(login.googleLoginSnapshot()).toMatchObject({ open: false, busy: true });
    const second = login.googlePopupLogin(popup, () => false);
    expect(second).toBe(first);
    expect(popup).toHaveBeenCalledTimes(1);
    task.resolve(); await first;
  });
  it.each([
    ["auth/popup-blocked", "Cho phép cửa sổ bật lên"],
    ["auth/popup-closed-by-user", "Đã đóng cửa sổ"],
    ["auth/network-request-failed", "Kiểm tra mạng"],
    ["auth/operation-not-supported-in-this-environment", "Sao chép liên kết"],
    ["auth/unauthorized-domain", "chưa sẵn sàng"],
    ["auth/internal-error", "Hãy thử lại"],
  ])("recovers in-place from %s without leaking provider payload", async (code, text) => {
    const login = await setup();
    const popup = vi.fn().mockRejectedValue({ code, message: "PRIVATE_PROVIDER_PAYLOAD" });
    await expect(login.googlePopupLogin(popup, () => false)).rejects.toMatchObject({ code });
    expect(login.googleLoginSnapshot().error).toContain(text);
    expect(JSON.stringify(login.googleLoginSnapshot())).not.toContain("PRIVATE_PROVIDER_PAYLOAD");
    expect(login.googleLoginSnapshot()).toMatchObject({ open: true, busy: false });
    popup.mockResolvedValue(undefined);
    await login.googlePopupLogin(popup, () => false);
    expect(popup).toHaveBeenCalledTimes(2);
    expect(login.googleLoginSnapshot().open).toBe(false);
  });
  it("hands MFA to the existing challenge without treating it as provider failure", async () => {
    const login = await setup(), challenge = { code: "auth/multi-factor-auth-required" };
    const capture = vi.fn(() => true);
    await login.googlePopupLogin(() => Promise.reject(challenge), capture);
    expect(capture).toHaveBeenCalledWith(challenge);
    expect(login.googleLoginSnapshot()).toEqual({ open: false, busy: false, error: "" });
  });
  it("handles synchronous SDK failure and permits a later click", async () => {
    const login = await setup();
    await expect(login.googlePopupLogin(() => { throw null; }, () => false)).rejects.toThrow("Chưa đăng nhập được");
    await login.googlePopupLogin(() => Promise.resolve(), () => false);
    expect(login.googleLoginSnapshot().busy).toBe(false);
  });
  it("does not reopen a dismissed dialog on a late provider failure", async () => {
    const login = await setup(), task = deferred();
    const pending = login.googlePopupLogin(() => task.promise, () => false);
    login.dismissGoogleLogin(); task.reject({ code: "auth/popup-closed-by-user" });
    await expect(pending).rejects.toThrow("Đã đóng cửa sổ");
    expect(login.googleLoginSnapshot()).toMatchObject({ open: false, busy: false });
  });
  it("invalid MFA recovery cannot leave the dialog busy forever", async () => {
    const login = await setup();
    await expect(login.googlePopupLogin(() => Promise.reject({ code: "auth/multi-factor-auth-required" }), () => { throw Error("invalid challenge"); })).rejects.toThrow();
    expect(login.googleLoginSnapshot()).toMatchObject({ open: true, busy: false });
  });
});
