import { afterEach, beforeEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  auth: { currentUser: { uid: "synthetic-owner" } },
  request: vi.fn(),
  callable: vi.fn(),
  progress: vi.fn(),
  notify: vi.fn(),
  mfa: vi.fn(),
}));
vi.mock("firebase/app", () => ({ initializeApp: () => ({}) }));
vi.mock("firebase/auth", () => ({
  getAuth: () => fixture.auth,
  connectAuthEmulator: vi.fn(),
  GoogleAuthProvider: class {},
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
  getRedirectResult: async () => null,
}));
vi.mock("firebase/firestore", () => ({
  getFirestore: () => ({}),
  connectFirestoreEmulator: vi.fn(),
}));
vi.mock("firebase/functions", () => ({
  getFunctions: () => ({}),
  connectFunctionsEmulator: vi.fn(),
  httpsCallable: fixture.callable,
}));
vi.mock("firebase/app-check", () => ({
  initializeAppCheck: vi.fn(),
  ReCaptchaEnterpriseProvider: class {},
}));
vi.mock("../../src/features/auth/mfa", () => ({
  captureMfa: () => false,
  clearMfa: vi.fn(),
}));
vi.mock("../../src/features/auth/auth-feedback", () => ({
  loginFeedback: vi.fn(),
  publishAuthFailure: vi.fn(),
}));
vi.mock("../../src/features/auth/ActionMfa", () => ({
  requestActionMfa: fixture.mfa,
}));
vi.mock("../../src/shared/feedback", () => ({
  notify: fixture.notify,
  withProgress: fixture.progress,
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("VITE_FIREBASE_API_KEY", "synthetic");
  vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "demo-satsunicgo");
  vi.stubEnv("VITE_FIREBASE_APP_ID", "synthetic");
  vi.stubEnv("VITE_USE_EMULATORS", "false");
  vi.stubEnv("VITE_BETA_RELEASE", "false");
  vi.stubGlobal("navigator", { onLine: true });
  vi.stubGlobal("window", { location: { pathname: "/cart" } });
  fixture.auth.currentUser = { uid: "synthetic-owner" };
  fixture.mfa.mockResolvedValue(undefined);
  fixture.progress.mockImplementation((run) => run());
  fixture.request.mockResolvedValue({ data: { saved: true } });
  fixture.callable.mockReturnValue(fixture.request);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
const rejection = () =>
  Object.assign(new Error("Giỏ chưa cập nhật. [400]"), {
    code: "functions/failed-precondition",
  });
const mfaRequired = () =>
  Object.assign(new Error("MFA required"), {
    code: "functions/failed-precondition",
    details: { reason: "RECENT_MFA_REQUIRED" },
  });

it("keeps default global mutation overlay, timeout and cloned payload", async () => {
  const { callService } = await import("../../src/shared/firebase");
  const input = { action: "merge", items: ["synthetic"] };
  expect(await callService("cartCommand", input)).toEqual({ saved: true });
  expect(fixture.progress.mock.calls[0][1]).toEqual({ overlay: true });
  expect(fixture.callable.mock.calls[0].slice(1)).toEqual([
    "cartCommand",
    { timeout: 60000 },
  ]);
  expect(fixture.request.mock.calls[0][0]).toEqual(input);
  expect(fixture.request.mock.calls[0][0]).not.toBe(input);
});
it("keeps global failure feedback for callers that do not opt in", async () => {
  fixture.request.mockRejectedValue(rejection());
  const { callService } = await import("../../src/shared/firebase");
  await expect(callService("cartCommand", {})).rejects.toMatchObject({
    message: "Giỏ chưa cập nhật.",
    code: "functions/failed-precondition",
  });
  expect(fixture.notify).toHaveBeenCalledExactlyOnceWith(
    "Giỏ chưa cập nhật.",
    "error",
  );
});
it("inline cart feedback suppresses only duplicate toast/overlay and preserves mutation errors and timeout", async () => {
  fixture.request.mockRejectedValue(rejection());
  const { callService } = await import("../../src/shared/firebase");
  await expect(callService("cartCommand", {}, "inline")).rejects.toMatchObject({
    message: "Giỏ chưa cập nhật.",
    code: "functions/failed-precondition",
  });
  expect(fixture.notify).not.toHaveBeenCalled();
  expect(fixture.progress.mock.calls[0][1]).toEqual({ overlay: false });
  expect(fixture.callable.mock.calls[0][2]).toEqual({ timeout: 60000 });
});
it("retains the existing read-only service timeout and non-overlay behavior", async () => {
  const { callService } = await import("../../src/shared/firebase");
  await callService("purchaseCheckoutSetup", {});
  expect(fixture.callable.mock.calls[0][2]).toEqual({ timeout: 15000 });
  expect(fixture.progress.mock.calls[0][1]).toEqual({ overlay: false });
});
it("inline mode still requires recent MFA and replays only after authentication", async () => {
  fixture.request
    .mockRejectedValueOnce(mfaRequired())
    .mockResolvedValueOnce({ data: { saved: true } });
  const { callService } = await import("../../src/shared/firebase");
  expect(
    await callService("cartCommand", { operationId: "synthetic" }, "inline"),
  ).toEqual({ saved: true });
  expect(fixture.mfa).toHaveBeenCalledExactlyOnceWith(fixture.auth);
  expect(fixture.request).toHaveBeenCalledTimes(2);
  expect(fixture.request.mock.calls[0][0]).toEqual(
    fixture.request.mock.calls[1][0],
  );
});
it.each(["account", "path"])(
  "inline mode prevents MFA replay after a %s change",
  async (change) => {
    fixture.request.mockRejectedValueOnce(mfaRequired());
    fixture.mfa.mockImplementationOnce(async () => {
      if (change === "account")
        fixture.auth.currentUser = { uid: "other-synthetic-owner" };
      else window.location.pathname = "/products";
    });
    const { callService } = await import("../../src/shared/firebase");
    await expect(
      callService("cartCommand", {}, "inline"),
    ).rejects.toMatchObject({ details: { reason: "ACTION_NOT_RESUMED" } });
    expect(fixture.request).toHaveBeenCalledTimes(1);
    expect(fixture.notify).not.toHaveBeenCalled();
  },
);
