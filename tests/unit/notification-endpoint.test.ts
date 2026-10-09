import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { emptyNotificationPreferences } from "../../packages/domain/notification-preferences";
const h = vi.hoisted(() => ({
  read: vi.fn(),
  save: vi.fn(),
  token: vi.fn(),
  identity: vi.fn(),
  settings: vi.fn(),
  projectId: "satsunicgo",
}));
vi.mock("firebase-functions/v2/https", async (importOriginal) => ({
  ...(await importOriginal<typeof import("firebase-functions/v2/https")>()),
  onCall: (_config: unknown, handler: unknown) => handler,
}));
vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ getUser: h.identity }),
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    get projectId() {
      return h.projectId;
    },
    doc: () => ({ get: async () => ({ data: h.settings }) }),
  }),
}));
vi.mock("../../functions/src/notification-preferences-service", () => ({
  getNotificationPreferences: h.read,
  saveNotificationPreferences: h.save,
}));
vi.mock("../../functions/src/notification-token-service", () => ({
  applySubscriptionToken: h.token,
}));
import { notificationPreferences } from "../../functions/src/notification-preferences";
const call = notificationPreferences as unknown as (
  req: unknown,
) => Promise<unknown>;
const auth = {
  uid: "owner",
  token: { email_verified: true, firebase: { sign_in_provider: "google.com" } },
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("GCLOUD_PROJECT", "other-project");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", undefined);
  vi.stubEnv("FUNCTIONS_EMULATOR", undefined);
  vi.stubEnv("FIRESTORE_EMULATOR_HOST", undefined);
  vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", undefined);
  h.projectId = "satsunicgo";
  h.identity.mockResolvedValue({
    email: "owner@example.invalid",
    emailVerified: true,
    disabled: false,
  });
  h.read.mockResolvedValue(
    emptyNotificationPreferences("owner@example.invalid"),
  );
  h.settings.mockReturnValue({ enabled: true, subscriptionsEnabled: true });
  h.token.mockResolvedValue({ status: "confirmed" });
});
afterEach(() => vi.unstubAllEnvs());

function readyProduction(overrides: Record<string, unknown> = {}) {
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("FUNCTIONS_EMULATOR", "false");
  h.settings.mockReturnValue({
    approved: true,
    provider: "resend",
    enabled: true,
    subscriptionsEnabled: true,
    from: "contact@hunpeolabs.com",
    verifiedDomain: "hunpeolabs.com",
    cutoverAt: 1,
    dailyAttemptLimit: 100,
    // Synthetic receipt tests readiness parsing, not actual domain verification.
    domainVerificationEvidenceId: "qa/endpoint-domain-receipt",
    domainVerifiedAt: 1,
    ...overrides,
  });
}
test("unauthenticated and non-Google callers cannot read preferences", async () => {
  await expect(call({ data: { action: "read" } })).rejects.toMatchObject({
    code: "unauthenticated",
  });
  await expect(
    call({
      data: { action: "read" },
      auth: {
        ...auth,
        token: {
          email_verified: true,
          firebase: { sign_in_provider: "password" },
        },
      },
    }),
  ).rejects.toMatchObject({ code: "permission-denied" });
  expect(h.read).not.toHaveBeenCalled();
});
test("owner/email fields supplied by caller are rejected", async () => {
  await expect(
    call({ auth, data: { action: "read", ownerId: "victim" } }),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  expect(h.identity).not.toHaveBeenCalled();
});
test("verified current Auth identity and uid drive read; release holds cannot be bypassed with settings", async () => {
  expect(await call({ auth, data: { action: "read" } })).toMatchObject({
    email: "owner@example.invalid",
    availability: { email: false, sms: false },
  });
  expect(h.read).toHaveBeenCalledWith(
    expect.anything(),
    "owner",
    "owner@example.invalid",
  );
});
test("disabled current identity overrides stale verified session claims", async () => {
  h.identity.mockResolvedValue({
    email: "owner@example.invalid",
    emailVerified: true,
    disabled: true,
  });
  await expect(call({ auth, data: { action: "read" } })).rejects.toMatchObject({
    code: "permission-denied",
  });
  expect(h.read).not.toHaveBeenCalled();
});
test("possession token can confirm without login, and only reaches token service", async () => {
  const token = "a".repeat(64);
  expect(await call({ data: { action: "confirm", token } })).toEqual({
    status: "confirmed",
  });
  expect(h.token).toHaveBeenCalledWith(
    expect.anything(),
    token,
    "confirm",
    expect.any(Number),
    expect.any(Function),
  );
  expect(h.read).not.toHaveBeenCalled();
  expect(h.identity).not.toHaveBeenCalled();
});
test("malformed public token is rejected before service or database access", async () => {
  await expect(
    call({ data: { action: "unsubscribe", token: "../bad" } }),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  expect(h.token).not.toHaveBeenCalled();
});
test("strict ready Resend config and exact production database expose email availability without changing consent", async () => {
  readyProduction();
  expect(await call({ auth, data: { action: "read" } })).toMatchObject({
    email: "owner@example.invalid",
    availability: { email: true, sms: false },
    topics: emptyNotificationPreferences("owner@example.invalid").topics,
  });
  expect(h.save).not.toHaveBeenCalled();
  expect(h.token).not.toHaveBeenCalled();
});
test.each([
  { enabled: false },
  { subscriptionsEnabled: false },
  { domainVerificationEvidenceId: undefined },
  { provider: "smtp" },
])("unready server settings keep availability off: %j", async (overrides) => {
  readyProduction(overrides);
  expect(await call({ auth, data: { action: "read" } })).toMatchObject({
    availability: { email: false, sms: false },
  });
});
test("ready settings cannot bypass actual database project mismatch", async () => {
  readyProduction();
  h.projectId = "demo-satsunicgo";
  expect(await call({ auth, data: { action: "read" } })).toMatchObject({
    availability: { email: false, sms: false },
  });
});
test("future cutover keeps email unavailable until its activation time", async () => {
  readyProduction({ cutoverAt: Date.now() + 60_000 });
  expect(await call({ auth, data: { action: "read" } })).toMatchObject({
    availability: { email: false, sms: false },
  });
});
test.each([
  ["GOOGLE_CLOUD_PROJECT", "other-project"],
  ["FUNCTIONS_EMULATOR", "true"],
  ["FIRESTORE_EMULATOR_HOST", "127.0.0.1:18207"],
])("ready settings cannot bypass runtime fence %s", async (key, value) => {
  readyProduction();
  vi.stubEnv(key, value);
  expect(await call({ auth, data: { action: "read" } })).toMatchObject({
    availability: { email: false, sms: false },
  });
});
