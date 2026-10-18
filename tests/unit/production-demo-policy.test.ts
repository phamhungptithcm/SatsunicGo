import { randomUUID } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import type { CallableRequest } from "firebase-functions/v2/https";
const state = vi.hoisted(() => ({ projectId: "satsunicgo" }));
vi.mock("firebase-admin/firestore", () => ({ getFirestore: () => state }));
import {
  demoAuth,
  demoMfa,
  demoSessionSchema,
  assertDemoRecord,
} from "../../functions/src/production-demo-policy";
import {
  purchaseFinancialCollection,
  requireLivePurchaseRecord,
} from "../../functions/src/purchase-test-boundary";
import { productionTestEmailAllowed } from "../../functions/src/production-test-email-policy";
const uid = "demo-owner",
  id = randomUUID(),
  now = Date.now();
const session = {
  id,
  ownerId: uid,
  enabled: true,
  version: 1 as const,
  createdAt: now,
  expiresAt: now + 14400000,
  checkoutIds: [],
  artifact: "production-demo-v1" as const,
  revision: "test-revision",
};
const record = {
  ownerId: uid,
  provider: "production_demo",
  executionMode: "production_test",
  executionPolicyVersion: 1,
  testRunId: id,
  testMode: true,
};
function production() {
  for (const key of [
    "FUNCTIONS_EMULATOR",
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FIREBASE_STORAGE_EMULATOR_HOST",
    "STORAGE_EMULATOR_HOST",
    "PUBSUB_EMULATOR_HOST",
    "FIREBASE_EMULATOR_HUB",
    "EVENTARC_EMULATOR",
  ])
    vi.stubEnv(key, undefined);
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", "v1");
  vi.stubEnv("FIREBASE_CONFIG", '{"projectId":"satsunicgo"}');
}
const req = () =>
  ({
    app: { appId: "validated-app" },
    auth: {
      uid,
      token: {
        email_verified: true,
        auth_time: Math.floor(Date.now() / 1000),
        firebase: {
          sign_in_provider: "google.com",
          sign_in_second_factor: "totp",
        },
      },
    },
  }) as CallableRequest;
afterEach(() => vi.unstubAllEnvs());
it("requires valid production identity and App Check separately from session admission", () => {
  production();
  expect(demoAuth(req())).toBe(uid);
  const r = req();
  delete r.app;
  expect(() => demoAuth(r)).toThrow(
    expect.objectContaining({ code: "unauthenticated" }),
  );
});
it.each([
  "FUNCTIONS_EMULATOR",
  "FIRESTORE_EMULATOR_HOST",
  "FIREBASE_AUTH_EMULATOR_HOST",
  "STORAGE_EMULATOR_HOST",
  "EVENTARC_EMULATOR",
])("denies mixed production environment %s", (key) => {
  production();
  vi.stubEnv(key, "mixed");
  expect(() => demoAuth(req())).toThrow(
    expect.objectContaining({ code: "permission-denied" }),
  );
});
it.each([
  "GCLOUD_PROJECT",
  "GOOGLE_CLOUD_PROJECT",
  "PURCHASE_PRODUCTION_TEST_ARTIFACT",
  "FIREBASE_CONFIG",
])("denies unregistered identity %s", (key) => {
  production();
  vi.stubEnv(key, "invalid");
  expect(() => demoAuth(req())).toThrow();
});
it("requires Google verification and recent MFA", () => {
  production();
  const r = req();
  r.auth!.token.email_verified = false;
  expect(() => demoAuth(r)).toThrow();
  r.auth!.token.email_verified = true;
  expect(() => demoMfa(r)).not.toThrow();
  r.auth!.token.auth_time -= 301;
  expect(() => demoMfa(r)).toThrow();
});
it.each([
  { expiresAt: now + 14400001 },
  { checkoutIds: Array.from({ length: 6 }, () => randomUUID()) },
  { checkoutIds: [id, id] },
  { version: 2 },
  { artifact: "other" },
])("rejects malformed session %j", (patch) =>
  expect(demoSessionSchema.safeParse({ ...session, ...patch }).success).toBe(
    false,
  ),
);
it.each([
  { ownerId: "other" },
  { provider: "sepay_sandbox" },
  { testRunId: randomUUID() },
  { executionMode: "live" },
  { executionPolicyVersion: 2 },
  { testMode: false },
])("rejects cross-owner/provider/run/mode %j", (patch) =>
  expect(() => assertDemoRecord({ ...record, ...patch }, session)).toThrow(),
);
it("classifies simulation conservatively even without provenance and blocks live mutations", () => {
  expect(purchaseFinancialCollection({ provider: "production_demo" })).toBe(
    "purchaseTestFinancialEntries",
  );
  expect(() =>
    requireLivePurchaseRecord({ paymentProvider: "production_demo" }),
  ).toThrow();
});
it.each(["resource", "job"])(
  "blocks simulation email before any configuration read via %s",
  async (field) => {
    production();
    const db = {
      doc: vi.fn(() => {
        throw Error("MUST_NOT_READ");
      }),
    };
    expect(
      await productionTestEmailAllowed(db as never, {
        ownerId: uid,
        recipient: "test@example.invalid",
        createdAt: now,
        now,
        kind: "order",
        [field]: { ...record, paymentProvider: "production_demo" },
      }),
    ).toBe(false);
    expect(db.doc).not.toHaveBeenCalled();
  },
);
