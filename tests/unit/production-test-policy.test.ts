import { afterEach, describe, expect, it, vi } from "vitest";
import {
  admitProductionTestPolicy,
  assertPurchaseExecutionEnvironment,
  productionTestArtifactEnvironmentAllowed,
  productionTestEnvironment,
  productionTestProvenance,
  readProductionTestAdmission,
} from "../../functions/src/production-test-policy";
import {
  purchaseExecutionProvenance,
  purchaseTestRecord,
} from "../../packages/domain/purchase-checkout";
import { createSandboxAdapter } from "../../functions/src/payments/sepay-sandbox";
import {
  admitSePayForm,
  sepayInvoice,
  SEPAY_MERCHANT,
} from "../../packages/domain/purchase-sepay";

const id = "00000000-0000-4000-8000-000000000001";
const now = Date.UTC(2026, 9, 10);
const policy = {
  approved: true,
  enabled: true,
  version: 1,
  effectiveFrom: now - 1,
  expiresAt: now + 600000,
  origin: "https://satsunicgo.web.app",
  provider: "sepay_sandbox",
  testerUids: ["test-owner"],
};
const env = {
  PURCHASE_PRODUCTION_TEST_ARTIFACT: "v1",
  GCLOUD_PROJECT: "satsunicgo",
  GOOGLE_CLOUD_PROJECT: "satsunicgo",
  FIREBASE_CONFIG: '{"projectId":"satsunicgo"}',
};
const provenance = {
  executionMode: "production_test" as const,
  executionPolicyVersion: 1,
  testRunId: id,
};
const db = (projectId = "satsunicgo") =>
  ({ projectId }) as unknown as FirebaseFirestore.Firestore;
function production() {
  for (const key of [
    "FUNCTIONS_EMULATOR",
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FIREBASE_STORAGE_EMULATOR_HOST",
  ])
    vi.stubEnv(key, undefined);
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
}
afterEach(() => vi.unstubAllEnvs());

describe("exact production test identity", () => {
  it("admits only the explicit artifact and actual database identity", () => {
    expect(productionTestArtifactEnvironmentAllowed(env)).toBe(true);
    production();
    expect(productionTestEnvironment(db())).toBe(true);
    expect(productionTestEnvironment(db("demo-satsunicgo"))).toBe(false);
  });
  it.each([
    ["PURCHASE_PRODUCTION_TEST_ARTIFACT", undefined],
    ["PURCHASE_PRODUCTION_TEST_ARTIFACT", "true"],
    ["GCLOUD_PROJECT", "demo-satsunicgo"],
    ["GOOGLE_CLOUD_PROJECT", "other"],
    ["FIREBASE_CONFIG", "{}"],
    ["FIREBASE_CONFIG", "null"],
    ["FIREBASE_CONFIG", "invalid"],
    ["FIREBASE_CONFIG", '{"projectId":"other"}'],
    ["FUNCTIONS_EMULATOR", "true"],
    ["FUNCTIONS_EMULATOR", "false"],
    ["FIRESTORE_EMULATOR_HOST", "127.0.0.1:18207"],
    ["FIREBASE_AUTH_EMULATOR_HOST", "localhost:19207"],
    ["FIREBASE_STORAGE_EMULATOR_HOST", "localhost:19208"],
    ["STORAGE_EMULATOR_HOST", "localhost:19208"],
    ["PUBSUB_EMULATOR_HOST", "localhost:8085"],
    ["FIREBASE_EMULATOR_HUB", "localhost:4400"],
    ["EVENTARC_EMULATOR", "localhost:9299"],
  ])("denies mismatched %s=%s", (key, value) => {
    expect(
      productionTestArtifactEnvironmentAllowed({ ...env, [key]: value }),
    ).toBe(false);
  });
});
describe("server-owned bounded activation", () => {
  it("requires approved version, current interval and allowlisted tester", () => {
    expect(admitProductionTestPolicy(policy, "test-owner", now)).toEqual(
      policy,
    );
    expect(admitProductionTestPolicy(policy, "other", now)).toBeNull();
    expect(
      admitProductionTestPolicy(policy, "test-owner", policy.expiresAt),
    ).toBeNull();
    expect(admitProductionTestPolicy(policy, "test-owner", now - 2)).toBeNull();
  });
  it.each([
    { enabled: false },
    { approved: false },
    { version: 0 },
    { version: 1.5 },
    { origin: "https://evil.invalid" },
    { provider: "payos" },
    { testerUids: [] },
    { testerUids: ["test-owner", "test-owner"] },
    { testerUids: Array.from({ length: 101 }, (_, i) => `u${i}`) },
    { extra: true },
  ])("denies invalid policy delta %j", (delta) => {
    expect(
      admitProductionTestPolicy({ ...policy, ...delta }, "test-owner", now),
    ).toBeNull();
  });
  it("does not read production policy from a different environment", async () => {
    const get = vi.fn();
    expect(
      await readProductionTestAdmission(
        {
          projectId: "other",
          doc: () => ({ get }),
        } as unknown as FirebaseFirestore.Firestore,
        "test-owner",
      ),
    ).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });
});
describe("immutable and conservative provenance", () => {
  it("creates only fully validated server provenance", () => {
    expect(
      productionTestProvenance(
        policy as Parameters<typeof productionTestProvenance>[0],
        id,
      ),
    ).toEqual(provenance);
    expect(() =>
      productionTestProvenance(
        policy as Parameters<typeof productionTestProvenance>[0],
        "untrusted",
      ),
    ).toThrow();
    expect(
      purchaseExecutionProvenance({ ...provenance, unrelated: true }),
    ).toEqual(provenance);
    expect(purchaseExecutionProvenance({ state: "paid" })).toBeNull();
  });
  it.each([
    { executionMode: "production_test" },
    { testRunId: id },
    { executionPolicyVersion: 1 },
    { ...provenance, executionMode: "live" },
    { ...provenance, executionPolicyVersion: 0 },
    { ...provenance, testRunId: "untrusted" },
    { executionMode: null },
  ])(
    "rejects partial/unknown provenance without live fallback %j",
    (record) => {
      expect(() => purchaseExecutionProvenance(record)).toThrow();
      expect(purchaseTestRecord(record)).toBe(true);
    },
  );
  it.each([
    { testMode: true },
    { provider: "sepay_sandbox" },
    { paymentProvider: "sepay_sandbox" },
  ])("fences legacy test marker %j", (record) =>
    expect(purchaseTestRecord(record)).toBe(true),
  );
  it("continues pinned reconciliation after policy-off but rejects legacy in production", () => {
    production();
    expect(
      admitProductionTestPolicy(
        { ...policy, enabled: false },
        "test-owner",
        now,
      ),
    ).toBeNull();
    expect(assertPurchaseExecutionEnvironment(provenance, db())).toEqual(
      provenance,
    );
    expect(() =>
      assertPurchaseExecutionEnvironment({ testMode: true }, db()),
    ).toThrow("PURCHASE_EXECUTION_ENVIRONMENT");
    expect(() =>
      assertPurchaseExecutionEnvironment(provenance, db("other")),
    ).toThrow();
  });
  it("keeps absent legacy mode available only in the exact demo environment", () => {
    vi.stubEnv("FUNCTIONS_EMULATOR", "true");
    vi.stubEnv("GCLOUD_PROJECT", "demo-satsunicgo");
    vi.stubEnv("FIREBASE_CONFIG", '{"projectId":"demo-satsunicgo"}');
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:18207");
    expect(
      assertPurchaseExecutionEnvironment({}, db("demo-satsunicgo")),
    ).toBeNull();
    expect(() =>
      assertPurchaseExecutionEnvironment(provenance, db("demo-satsunicgo")),
    ).toThrow();
  });
});
it("pins production test signed callbacks to the exact approved HTTPS origin", () => {
  const intent = {
    ...provenance,
    checkoutId: id,
    ownerId: "test-owner",
    invoice: sepayInvoice(id),
    merchant: SEPAY_MERCHANT as typeof SEPAY_MERCHANT,
    provider: "sepay_sandbox" as const,
    amount: 100000,
    currency: "VND" as const,
    paymentMethod: "BANK_TRANSFER" as const,
    checkoutHash: "a".repeat(64),
    createdAt: now,
    expiresAt: now + 60000,
  };
  const form = createSandboxAdapter("synthetic-unit-only-no-provider").form(
    intent,
  );
  expect(Object.fromEntries(form.fields).success_url).toBe(
    `https://satsunicgo.web.app/checkout/payment/${id}?sepay=success`,
  );
  expect(
    admitSePayForm(form, { id, total: intent.amount, ...provenance }),
  ).toEqual(form);
  expect(() => admitSePayForm(form, { id, total: intent.amount })).toThrow();
  const tampered = {
    ...form,
    fields: form.fields.map(([key, value]) => [
      key,
      key === "success_url"
        ? value.replace("satsunicgo.web.app", "evil.invalid")
        : value,
    ]),
  };
  expect(() =>
    admitSePayForm(tampered, { id, total: intent.amount, ...provenance }),
  ).toThrow();
});
