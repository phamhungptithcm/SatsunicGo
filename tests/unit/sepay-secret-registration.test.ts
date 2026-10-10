import { afterEach, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({ define: vi.fn() }));
vi.mock("firebase-functions/params", async (original) => {
  const sdk = await original<typeof import("firebase-functions/params")>();
  return {
    ...sdk,
    defineSecret: (name: string) => {
      h.define(name);
      return sdk.defineSecret(name);
    },
  };
});
afterEach(() => {
  vi.unstubAllEnvs();
  h.define.mockClear();
});

it.each([
  [undefined, undefined, undefined, false],
  [undefined, "satsunicgo", "satsunicgo", false],
  ["false", "demo-satsunicgo", "demo-satsunicgo", false],
  ["true", "satsunicgo", "satsunicgo", false],
  ["true", "demo-other", "demo-other", false],
  ["true", "demo-satsunicgo", "satsunicgo", false],
  ["true", "demo-satsunicgo", undefined, true],
  ["true", "demo-satsunicgo", "demo-satsunicgo", true],
] as const)(
  "registers sandbox params only for the exact demo emulator (%s, %s, %s)",
  async (emulator, project, googleProject, allowed) => {
    vi.resetModules();
    vi.stubEnv("FUNCTIONS_EMULATOR", emulator);
    vi.stubEnv("GCLOUD_PROJECT", project);
    vi.stubEnv("GOOGLE_CLOUD_PROJECT", googleProject);
    vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", undefined);
    const module = await import("../../functions/src/payments/sepay-sandbox");
    const names = allowed
      ? ["SEPAY_SANDBOX_SECRET_KEY", "SEPAY_SANDBOX_IPN_SECRET_KEY"]
      : [];
    expect(h.define.mock.calls.map(([name]) => name)).toEqual(names);
    expect(module.sepaySecrets.map((secret) => secret.name)).toEqual(names);
    if (!allowed) {
      expect(module.sepaySandboxSecret).toBeUndefined();
      expect(module.sepaySandboxIpnSecret).toBeUndefined();
      expect(module.sandboxPaymentReady()).toBe(false);
      expect(() => module.sandboxAdapter()).toThrow("SEPAY_NOT_CONFIGURED");
    }
  },
);

it.each([
  ["v1", "satsunicgo", undefined, true],
  ["v1", "satsunicgo", "127.0.0.1:18207", false],
  ["v1", "other", undefined, false],
  ["true", "satsunicgo", undefined, false],
  [undefined, "satsunicgo", undefined, false],
] as const)(
  "registers approved production-test params only for exact artifact %s/%s/%s",
  async (marker, project, emulator, allowed) => {
    vi.resetModules();
    vi.stubEnv("FUNCTIONS_EMULATOR", undefined);
    vi.stubEnv("GCLOUD_PROJECT", project);
    vi.stubEnv("GOOGLE_CLOUD_PROJECT", project);
    vi.stubEnv("FIREBASE_CONFIG", JSON.stringify({ projectId: project }));
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", emulator);
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", undefined);
    vi.stubEnv("FIREBASE_STORAGE_EMULATOR_HOST", undefined);
    vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", marker);
    const module = await import("../../functions/src/payments/sepay-sandbox");
    const names = allowed
      ? ["SEPAY_SANDBOX_SECRET_KEY", "SEPAY_SANDBOX_IPN_SECRET_KEY"]
      : [];
    expect(h.define.mock.calls.map(([name]) => name)).toEqual(names);
    expect(module.sepaySecrets.map((secret) => secret.name)).toEqual(names);
  },
);
