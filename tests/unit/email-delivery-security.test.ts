import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ResendMessage } from "../../functions/src/email/resend";
import type { EmailDispatchResult } from "../../functions/src/email/dispatch";
type DispatchInput = Parameters<
  typeof import("../../functions/src/email/dispatch").dispatchResend
>[0];
const now = 1_791_554_400_000;
const providerId = "00000000-0000-4000-8000-000000000001";
const fixture = vi.hoisted(() => ({
  projectId: "satsunicgo",
  firestoreAccess: vi.fn(),
  secretAccess: vi.fn(),
  authAccess: vi.fn(),
  identity: vi.fn<
    () => Promise<{
      email?: string;
      emailVerified: boolean;
      disabled: boolean;
    }>
  >(),
  dispatch: vi.fn<(input: DispatchInput) => Promise<EmailDispatchResult>>(),
  beforeDispatch: vi.fn<(input: DispatchInput) => Promise<void>>(),
  afterUpdate: vi.fn<(path: string, fields: Record<string, unknown>) => void>(),
  transactionRead: vi.fn<(path: string) => void>(),
  rows: new Map<string, Record<string, unknown>>(),
  readFailures: new Set<string>(),
  send: vi.fn<(message: ResendMessage) => Promise<EmailDispatchResult>>(),
}));
vi.mock("../../functions/src/email/dispatch", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../functions/src/email/dispatch")
  >()),
  dispatchResend: (input: DispatchInput) => fixture.dispatch(input),
}));
vi.mock("firebase-functions/params", () => ({
  defineSecret: () => ({
    value: () => {
      fixture.secretAccess();
      return "re_synthetic_not_a_real_credential";
    },
  }),
}));
vi.mock("firebase-admin/auth", () => ({
  getAuth: () => {
    fixture.authAccess();
    return { getUser: fixture.identity };
  },
}));
vi.mock("firebase-admin/firestore", () => {
  function doc(path: string) {
    if (!path || path.split("/").length % 2 || path.split("/").some((p) => !p))
      throw Error("Invalid document path");
    return {
      path,
      id: path.split("/").at(-1),
      get: async () => snapshot(path),
    };
  }
  function snapshot(path: string) {
    if (fixture.readFailures.has(path)) throw Error("SERVICE_UNAVAILABLE");
    const data = structuredClone(fixture.rows.get(path));
    return {
      exists: data !== undefined,
      ref: doc(path),
      id: path.split("/").at(-1),
      data: () => data,
    };
  }
  const db = {
    get projectId() {
      return fixture.projectId;
    },
    doc,
    collection: (path: string) => ({
      doc: () => doc(`${path}/audit-${fixture.rows.size}`),
      where: (field: string, _op: string, state: string) => ({
        limit: (limit: number) => ({
          get: async () => ({
            docs: [...fixture.rows]
              .filter(
                ([p, d]) => p.startsWith(`${path}/`) && d[field] === state,
              )
              .slice(0, limit)
              .map(([p]) => snapshot(p)),
          }),
        }),
      }),
    }),
    runTransaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        get: async (ref: { path: string }) => {
          fixture.transactionRead(ref.path);
          return snapshot(ref.path);
        },
        update: (ref: { path: string }, data: Record<string, unknown>) => {
          fixture.rows.set(ref.path, {
            ...fixture.rows.get(ref.path),
            ...data,
          });
          fixture.afterUpdate(ref.path, data);
        },
        create: (ref: { path: string }, data: Record<string, unknown>) => {
          if (fixture.rows.has(ref.path)) throw Error("ALREADY_EXISTS");
          fixture.rows.set(ref.path, data);
        },
      }),
  };
  return {
    getFirestore: () => {
      fixture.firestoreAccess();
      return db;
    },
  };
});
import { deliverEmail } from "../../functions/src/email";
import { emailRequestIdentity } from "../../functions/src/email/dispatch";
import {
  customerEvent,
  customerSnapshotHash,
} from "../../functions/src/customer-notification-events";
const paymentEvent = customerEvent(
  "payment_confirmed",
  {
    ownerId: "owner",
    entityId: "order",
    orderId: "order",
    entityVersion: 1,
    occurredAt: now,
  },
  { orderRef: "order", paidAmount: 100, paymentScope: "legacy_payment" },
);
const paymentFields = {
  customerEvent: paymentEvent,
  customerSnapshotHash: customerSnapshotHash(paymentEvent),
};
function queued(id = "job", extra: Record<string, unknown> = {}) {
  fixture.rows.set(`outboxJobs/${id}`, {
    ownerId: "owner",
    action: "verifyTransfer",
    ...paymentFields,
    emailState: "queued",
    version: 0,
    ...extra,
  });
}
function update(path: string, fields: Record<string, unknown>) {
  fixture.rows.set(path, { ...fixture.rows.get(path), ...fields });
}
const run = () =>
  deliverEmail.run({ scheduleTime: new Date(now).toISOString() });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  for (const name of [
    "FUNCTIONS_EMULATOR",
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
    "GOOGLE_CLOUD_PROJECT",
  ])
    vi.stubEnv(name, undefined);
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  fixture.projectId = "satsunicgo";
  fixture.firestoreAccess.mockClear();
  fixture.secretAccess.mockReset();
  fixture.authAccess.mockClear();

  fixture.rows.clear();
  fixture.readFailures.clear();
  fixture.afterUpdate.mockReset();
  fixture.transactionRead.mockReset();
  fixture.identity.mockReset().mockResolvedValue({
    email: "fixture@example.invalid",
    emailVerified: true,
    disabled: false,
  });
  fixture.send
    .mockReset()
    .mockResolvedValue({ state: "accepted", providerId, attempted: true });
  fixture.beforeDispatch.mockReset().mockResolvedValue(undefined);
  fixture.dispatch.mockReset().mockImplementation(async (input) => {
    await fixture.beforeDispatch(input);
    try {
      if (input.beforeSend && !(await input.beforeSend()))
        return {
          state: "deferred",
          attempted: false,
          reason: "claim_unavailable",
          retryAt: now + 1800000,
        };
    } catch {
      return {
        state: "deferred",
        attempted: false,
        reason: "quota_unavailable",
        retryAt: now + 1800000,
      };
    }
    return fixture.send(input.message);
  });
  fixture.rows.set("settings/customerNotifications", {
    approved: true,
    emailEnabled: true,
    cutoverAt: now - 1,
  });
  fixture.rows.set("orders/order", { ownerId: "owner", version: 1 });
  fixture.rows.set("notificationPreferences/owner", {
    schemaVersion: 1,
    version: 1,
    email: "fixture@example.invalid",
    phone: "",
    topics: {
      orderEmail: { requested: true, generation: 1, confirmedGeneration: 1 },
      promotionsEmail: {
        requested: false,
        generation: 0,
        confirmedGeneration: null,
      },
      orderSms: { requested: false, generation: 0, confirmedGeneration: null },
    },
    updatedAt: now,
  });
  fixture.rows.set("settings/email", {
    approved: true,
    provider: "resend",
    enabled: true,
    subscriptionsEnabled: true,
    from: "contact@hunpeolabs.com",
    verifiedDomain: "hunpeolabs.com",
    domainVerificationEvidenceId: "qa-authenticated-receipt",
    domainVerifiedAt: now - 10,
    cutoverAt: now - 1,
    dailyAttemptLimit: 100,
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});
it.each(["", "nested/id", "nested/id/valid", undefined])(
  "invalid invoice document ID %s does not starve later queued email",
  async (documentId) => {
    fixture.rows.set("outboxJobs/bad", {
      ownerId: "owner",
      action: "invoiceIssued",
      createdAt: now,
      documentId,
      emailState: "queued",
      version: 0,
    });
    fixture.rows.set("outboxJobs/good", {
      ownerId: "owner",
      action: "verifyTransfer",
      ...paymentFields,
      emailState: "queued",
      version: 0,
    });
    await deliverEmail.run({ scheduleTime: new Date().toISOString() });
    expect(fixture.rows.get("outboxJobs/bad")).toMatchObject({
      emailState: "blocked_document",
      version: 1,
    });
    expect(fixture.rows.get("outboxJobs/good")).toMatchObject({
      emailState: "sent",
      version: 2,
    });
    expect(fixture.send).toHaveBeenCalledTimes(1);
  },
);
it("provider uncertainty persists reconciliation-required and never resends automatically", async () => {
  fixture.rows.set("outboxJobs/job", {
    ownerId: "owner",
    action: "verifyTransfer",
    ...paymentFields,
    emailState: "queued",
    version: 0,
  });
  fixture.send.mockResolvedValueOnce({
    state: "unknown",
    reason: "provider_unknown",
    attempted: true,
  });
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.rows.get("outboxJobs/job")).toMatchObject({
    emailState: "unknown",
    reconciliationRequired: true,
    version: 2,
  });
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.send).toHaveBeenCalledTimes(1);
});
it("a current issued invoice with matching owner and number still sends", async () => {
  fixture.rows.set("outboxJobs/invoice", {
    ownerId: "owner",
    action: "invoiceIssued",
    createdAt: now,
    documentId: "invoice-123",
    documentNumber: "SG-20261005",
    emailState: "queued",
    version: 0,
  });
  fixture.rows.set("salesDocuments/invoice-123", {
    state: "issued",
    ownerId: "owner",
    issueNumber: "SG-20261005",
  });
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.rows.get("outboxJobs/invoice")).toMatchObject({
    emailState: "sent",
    version: 2,
  });
  expect(fixture.send).toHaveBeenCalledTimes(1);
});
it("abandoned sending claims require reconciliation and are not resent", async () => {
  fixture.rows.set("outboxJobs/abandoned", {
    ownerId: "owner",
    emailState: "sending",
    version: 4,
    claimedAt: Date.now() - 1000000,
  });
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.rows.get("outboxJobs/abandoned")).toMatchObject({
    emailState: "unknown",
    reconciliationRequired: true,
    version: 5,
  });
  expect(fixture.send).not.toHaveBeenCalled();
});
it("late provider outcome cannot overwrite a reconciled job", async () => {
  fixture.rows.set("outboxJobs/late", {
    ownerId: "owner",
    action: "verifyTransfer",
    ...paymentFields,
    emailState: "queued",
    version: 0,
  });
  fixture.send.mockImplementationOnce(async () => {
    fixture.rows.set("outboxJobs/late", {
      ownerId: "owner",
      emailState: "failed",
      version: 3,
    });
    return { state: "accepted", providerId, attempted: true };
  });
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.rows.get("outboxJobs/late")).toMatchObject({
    emailState: "failed",
    version: 3,
  });
});

it("actual runtime eligibility denies before every port despite enabled config and queued work", async () => {
  vi.stubEnv("GCLOUD_PROJECT", "demo-satsunicgo");
  fixture.rows.set("outboxJobs/held", {
    ownerId: "owner",
    action: "catalogCheckout",
    emailState: "queued",
    version: 0,
  });
  const before = structuredClone([...fixture.rows.entries()]);
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.firestoreAccess).not.toHaveBeenCalled();
  expect(fixture.secretAccess).not.toHaveBeenCalled();
  expect(fixture.authAccess).not.toHaveBeenCalled();
  expect(fixture.dispatch).not.toHaveBeenCalled();
  expect(fixture.send).not.toHaveBeenCalled();

  expect([...fixture.rows.entries()]).toEqual(before);
});

it("legacy backlog never sends merely because transport settings are enabled", async () => {
  fixture.rows.set("outboxJobs/legacy", {
    ownerId: "owner",
    action: "catalogCheckout",
    emailState: "queued",
  });
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.send).not.toHaveBeenCalled();
  expect(fixture.rows.get("outboxJobs/legacy")?.emailState).toBe(
    "blocked_policy",
  );
});
it("recipient/content mutation or expired provider window requires reconciliation", async () => {
  for (const [id, extra] of Object.entries({
    recipient: { recipientHash: "changed" },
    content: { contentHash: "changed" },
    window: { firstClaimedAt: Date.now() - 86400001 },
  })) {
    fixture.rows.set(`outboxJobs/${id}`, {
      ownerId: "owner",
      action: "verifyTransfer",
      ...paymentFields,
      emailState: "queued",
      ...extra,
    });
  }
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.send).not.toHaveBeenCalled();
  for (const id of ["recipient", "content", "window"])
    expect(fixture.rows.get(`outboxJobs/${id}`)).toMatchObject({
      emailState: "unknown",
      reconciliationRequired: true,
    });
});
it("typed sending rechecks policy and pins HTML and recipient before provider acceptance", async () => {
  fixture.rows.set("outboxJobs/typed", {
    ownerId: "owner",
    action: "verifyTransfer",
    ...paymentFields,
    emailState: "queued",
  });
  fixture.send.mockImplementationOnce(async (message) => {
    expect(fixture.rows.get("outboxJobs/typed")?.recipientHash).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(fixture.rows.get("outboxJobs/typed")?.contentHash).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(message.html).toContain("Đã xác nhận thanh toán");
    expect(fixture.rows.get("outboxJobs/typed")?.providerRequestIdentity).toBe(
      emailRequestIdentity(message),
    );
    expect(fixture.rows.get("outboxJobs/typed")?.providerFrom).toBe(
      "contact@hunpeolabs.com",
    );
    expect(fixture.rows.get("outboxJobs/typed")?.emailAttempts).toBe(1);
    expect(fixture.dispatch.mock.calls[0][0].stableJobKey).toBe(
      "customer/typed",
    );
    return { state: "accepted", providerId, attempted: true };
  });
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.rows.get("outboxJobs/typed")).toMatchObject({
    emailState: "sent",
    providerState: "accepted",
    providerId,
    emailAcceptedAt: now,
  });
  expect(fixture.rows.get("outboxJobs/typed")).not.toHaveProperty(
    "deliveredAt",
  );
});

it("preflight dependency failure records a known unsent failure without calling the provider", async () => {
  fixture.readFailures.add("settings/customerNotifications");
  fixture.rows.set("outboxJobs/preflight", {
    ownerId: "owner",
    action: "verifyTransfer",
    ...paymentFields,
    emailState: "queued",
  });
  await deliverEmail.run({ scheduleTime: new Date().toISOString() });
  expect(fixture.send).not.toHaveBeenCalled();
  expect(fixture.rows.get("outboxJobs/preflight")).toMatchObject({
    emailState: "failed",
    failureStage: "preflight",
  });
});

it.each([
  { enabled: false },
  { provider: "smtp" },
  { approved: false },
  { domainVerificationEvidenceId: undefined },
  { domainVerifiedAt: undefined },
  { domainVerifiedAt: now + 1 },
  { verifiedDomain: "other.invalid" },
  { host: "legacy.invalid" },
])(
  "unready server configuration %j denies before provider, quota and claim",
  async (config) => {
    queued();
    update("settings/email", config);
    const before = structuredClone([...fixture.rows]);
    await run();
    expect(fixture.dispatch).not.toHaveBeenCalled();
    expect(fixture.secretAccess).not.toHaveBeenCalled();
    expect(fixture.authAccess).not.toHaveBeenCalled();
    expect([...fixture.rows]).toEqual(before);
  },
);
it.each([undefined, "demo-satsunicgo", "other-project"])(
  "actual database %s cannot dispatch with a production environment",
  async (projectId) => {
    fixture.projectId = projectId as string;
    queued();
    await run();
    expect(fixture.dispatch).not.toHaveBeenCalled();
    expect(fixture.secretAccess).not.toHaveBeenCalled();
    expect(fixture.authAccess).not.toHaveBeenCalled();
    expect(fixture.rows.get("outboxJobs/job")?.emailState).toBe("queued");
  },
);
it.each(["typed", "invoice"])(
  "does not drain pre-cutover %s queued jobs",
  async (kind) => {
    queued(
      "old",
      kind === "typed"
        ? { customerEvent: { ...paymentEvent, occurredAt: now - 2 } }
        : {
            action: "invoiceIssued",
            customerEvent: undefined,
            createdAt: now - 2,
            documentId: "invoice",
          },
    );
    await run();
    expect(fixture.rows.get("outboxJobs/old")?.emailState).toBe(
      "blocked_policy",
    );
    expect(fixture.dispatch).not.toHaveBeenCalled();
  },
);
it.each([
  { providerFrom: "previous@example.invalid" },
  { providerRequestIdentity: "a".repeat(64) },
])("previous immutable provider request %j cannot be reused", async (extra) => {
  queued("drift", extra);
  await run();
  expect(fixture.rows.get("outboxJobs/drift")).toMatchObject({
    emailState: "unknown",
    reconciliationRequired: true,
  });
  expect(fixture.dispatch).not.toHaveBeenCalled();
});
it.each(["daily_limit", "rate_limit", "quota_unavailable"] as const)(
  "%s defers known-unsent work without burning a send attempt",
  async (reason) => {
    queued("quota", { emailAttempts: 1 });
    fixture.dispatch.mockResolvedValueOnce({
      state: "deferred",
      attempted: false,
      reason,
      retryAt: now + 1_800_000,
    });
    await run();
    expect(fixture.rows.get("outboxJobs/quota")).toMatchObject({
      emailState: "queued",
      emailAttempts: 1,
      emailRetryAt: now + 1_800_000,
    });
    expect(fixture.send).not.toHaveBeenCalled();
    await run();
    expect(fixture.dispatch).toHaveBeenCalledTimes(1);
  },
);
it("explicit provider rejection is terminal and distinct from unknown or accepted", async () => {
  queued();
  fixture.send.mockResolvedValueOnce({
    state: "rejected",
    reason: "provider_rejected",
    attempted: true,
  });
  await run();
  expect(fixture.rows.get("outboxJobs/job")).toMatchObject({
    emailState: "rejected",
    providerState: "rejected",
    failureStage: "provider",
    emailAttempts: 1,
  });
  expect(fixture.rows.get("outboxJobs/job")).not.toHaveProperty("providerId");
  await run();
  expect(fixture.send).toHaveBeenCalledTimes(1);
});
it.each(["auth/user-not-found", "auth/invalid-uid"])(
  "permanent identity failure %s retires the job without I/O",
  async (code) => {
    queued();
    fixture.identity.mockRejectedValueOnce({ code });
    await run();
    expect(fixture.rows.get("outboxJobs/job")?.emailState).toBe(
      "blocked_recipient",
    );
    expect(fixture.dispatch).not.toHaveBeenCalled();
  },
);
it("transient identity outage remains known-unsent and retries after its delay", async () => {
  queued("auth", { emailAttempts: 1 });
  fixture.identity.mockRejectedValueOnce({ code: "auth/internal-error" });
  await run();
  expect(fixture.rows.get("outboxJobs/auth")).toMatchObject({
    emailState: "queued",
    failureStage: "preflight",
    emailAttempts: 1,
    emailRetryAt: now + 1_800_000,
  });
  expect(fixture.dispatch).not.toHaveBeenCalled();
  await run();
  expect(fixture.identity).toHaveBeenCalledTimes(1);
  vi.setSystemTime(now + 1_800_001);
  await run();
  expect(fixture.send).toHaveBeenCalledTimes(1);
  expect(fixture.rows.get("outboxJobs/auth")).toMatchObject({
    emailState: "sent",
    emailAttempts: 2,
  });
});
it("an exhausted first batch is retired so the next batch can reach healthy work", async () => {
  for (let i = 0; i < 20; i++) queued(`exhausted-${i}`, { emailAttempts: 3 });
  queued("healthy");
  await run();
  expect(fixture.send).not.toHaveBeenCalled();
  for (let i = 0; i < 20; i++)
    expect(fixture.rows.get(`outboxJobs/exhausted-${i}`)).toMatchObject({
      emailState: "failed",
      failureStage: "attempts_exhausted",
      emailAttempts: 3,
    });
  await run();
  expect(fixture.send).toHaveBeenCalledTimes(1);
  expect(fixture.rows.get("outboxJobs/healthy")?.emailState).toBe("sent");
});
it.each([
  { email: undefined, emailVerified: true, disabled: false },
  { email: "fixture@example.invalid", emailVerified: false, disabled: false },
  { email: "fixture@example.invalid", emailVerified: true, disabled: true },
])(
  "current ineligible Auth identity %j is blocked before dispatch",
  async (identity) => {
    queued();
    fixture.identity.mockResolvedValue(identity);
    await run();
    expect(fixture.rows.get("outboxJobs/job")?.emailState).toBe(
      "blocked_recipient",
    );
    expect(fixture.dispatch).not.toHaveBeenCalled();
  },
);
it.each(["claim", "recipient", "owner", "policy", "config", "event"])(
  "final %s mutation prevents provider I/O and attempt increment",
  async (change) => {
    queued();
    fixture.beforeDispatch.mockImplementationOnce(async () => {
      if (change === "claim")
        update("outboxJobs/job", {
          claimId: "another-claim",
          emailState: "unknown",
        });
      if (change === "recipient")
        fixture.identity.mockResolvedValue({
          email: "changed@example.invalid",
          emailVerified: true,
          disabled: false,
        });
      if (change === "owner")
        update("orders/order", { ownerId: "another-owner" });
      if (change === "policy")
        update("settings/customerNotifications", { emailEnabled: false });
      if (change === "config") update("settings/email", { enabled: false });
      if (change === "event")
        update("outboxJobs/job", {
          customerEvent: {
            ...paymentEvent,
            payload: { ...paymentEvent.payload, paidAmount: 200 },
          },
        });
    });
    await run();
    expect(fixture.send).not.toHaveBeenCalled();
    expect(fixture.rows.get("outboxJobs/job")?.emailAttempts ?? 0).toBe(0);
    if (change === "claim")
      expect(fixture.rows.get("outboxJobs/job")?.emailState).toBe("unknown");
    if (["recipient", "owner"].includes(change))
      expect(fixture.rows.get("outboxJobs/job")?.emailState).toBe(
        "blocked_recipient",
      );
    if (change === "policy")
      expect(fixture.rows.get("outboxJobs/job")?.emailState).toBe(
        "blocked_policy",
      );
  },
);
it("revoked optional consent at the dispatch boundary suppresses the current request", async () => {
  const event = customerEvent(
    "order_received",
    {
      ownerId: "owner",
      entityId: "order",
      orderId: "order",
      entityVersion: 1,
      occurredAt: now,
    },
    { orderRef: "order", itemSummary: "Áo cotton, cỡ M" },
  );
  queued("optional", {
    customerEvent: event,
    customerSnapshotHash: customerSnapshotHash(event),
  });
  fixture.beforeDispatch.mockImplementationOnce(async () => {
    const preferences = structuredClone(
      fixture.rows.get("notificationPreferences/owner")!,
    );
    preferences.topics = {
      ...(preferences.topics as Record<string, unknown>),
      orderEmail: {
        requested: false,
        generation: 2,
        confirmedGeneration: null,
      },
    };
    fixture.rows.set("notificationPreferences/owner", preferences);
  });
  await run();
  expect(fixture.rows.get("outboxJobs/optional")?.emailState).toBe(
    "suppressed_preference",
  );
  expect(fixture.send).not.toHaveBeenCalled();
  expect(fixture.rows.get("outboxJobs/optional")?.emailAttempts ?? 0).toBe(0);
});

it("an invoice dependency outage remains known-unsent and does not abort later healthy jobs", async () => {
  queued("invoice", {
    action: "invoiceIssued",
    customerEvent: undefined,
    customerSnapshotHash: undefined,
    createdAt: now,
    documentId: "invoice-123",
    documentNumber: "SG-20261005",
  });
  fixture.readFailures.add("salesDocuments/invoice-123");
  queued("healthy");
  await expect(run()).resolves.toBeUndefined();
  expect(fixture.rows.get("outboxJobs/invoice")).toMatchObject({
    emailState: "failed",
    failureStage: "preflight",
  });
  expect(fixture.rows.get("outboxJobs/invoice")?.emailAttempts ?? 0).toBe(0);
  expect(fixture.rows.get("outboxJobs/healthy")?.emailState).toBe("sent");
  expect(fixture.send).toHaveBeenCalledTimes(1);
});

it.each([
  { action: "invoiceIssued" },
  { marketing: true },
  { providerFrom: "changed@example.invalid" },
  { recipientHash: "changed" },
  { contentHash: "changed" },
])(
  "changed durable dispatch semantics %j fails the final claim fence",
  async (change) => {
    queued();
    fixture.beforeDispatch.mockImplementationOnce(async () => {
      update("outboxJobs/job", change);
    });
    await run();
    expect(fixture.send).not.toHaveBeenCalled();
    expect(fixture.rows.get("outboxJobs/job")?.emailAttempts ?? 0).toBe(0);
  },
);

it.each([{ documentId: "another-invoice" }, { documentNumber: "SG-CHANGED" }])(
  "changed durable invoice target %j cannot reuse the pinned message",
  async (change) => {
    queued("invoice", {
      action: "invoiceIssued",
      customerEvent: undefined,
      customerSnapshotHash: undefined,
      createdAt: now,
      documentId: "invoice-123",
      documentNumber: "SG-20261005",
    });
    fixture.rows.set("salesDocuments/invoice-123", {
      state: "issued",
      ownerId: "owner",
      issueNumber: "SG-20261005",
    });
    fixture.beforeDispatch.mockImplementationOnce(async () => {
      update("outboxJobs/invoice", change);
    });
    await run();
    expect(fixture.send).not.toHaveBeenCalled();
    expect(fixture.rows.get("outboxJobs/invoice")?.emailAttempts ?? 0).toBe(0);
  },
);

it("crossing the provider idempotency window during reservation cannot start I/O", async () => {
  queued("window-boundary", { firstClaimedAt: now - 86_400_000 + 500 });
  fixture.beforeDispatch.mockImplementationOnce(async () => {
    vi.setSystemTime(now + 1_000);
  });
  await run();
  expect(fixture.send.mock.calls).toHaveLength(0);
  expect(
    fixture.rows.get("outboxJobs/window-boundary")?.emailAttempts ?? 0,
  ).toBe(0);
  expect(fixture.rows.get("outboxJobs/window-boundary")).toMatchObject({
    emailState: "unknown",
    reconciliationRequired: true,
  });
});

it("consent dependency failure after pin is known-unsent and does not abort a later healthy job", async () => {
  const event = customerEvent(
    "order_received",
    {
      ownerId: "owner",
      entityId: "order",
      orderId: "order",
      entityVersion: 1,
      occurredAt: now,
    },
    { orderRef: "order", itemSummary: "Áo cotton, cỡ M" },
  );
  queued("consent-outage", {
    customerEvent: event,
    customerSnapshotHash: customerSnapshotHash(event),
  });
  queued("healthy");
  fixture.afterUpdate.mockImplementation((path, fields) => {
    if (path === "outboxJobs/consent-outage" && fields.providerRequestIdentity)
      fixture.readFailures.add("notificationPreferences/owner");
  });
  await expect(run()).resolves.toBeUndefined();
  expect(fixture.rows.get("outboxJobs/consent-outage")).toMatchObject({
    emailState: "failed",
    failureStage: "preflight",
  });
  expect(
    fixture.rows.get("outboxJobs/consent-outage")?.emailAttempts ?? 0,
  ).toBe(0);
  expect(fixture.rows.get("outboxJobs/healthy")?.emailState).toBe("sent");
  expect(fixture.dispatch.mock.calls).toHaveLength(1);
  expect(fixture.dispatch.mock.calls[0][0].stableJobKey).toBe(
    "customer/healthy",
  );
  expect(fixture.send.mock.calls).toHaveLength(1);
});

it("secret accessor failure before dispatch is known-unsent and does not abort a later healthy job", async () => {
  queued("secret-outage");
  queued("healthy");
  fixture.secretAccess.mockImplementationOnce(() => {
    throw Error("SECRET_UNAVAILABLE");
  });
  await expect(run()).resolves.toBeUndefined();
  expect(fixture.rows.get("outboxJobs/secret-outage")).toMatchObject({
    emailState: "failed",
    failureStage: "preflight",
  });
  expect(fixture.rows.get("outboxJobs/secret-outage")?.emailAttempts ?? 0).toBe(
    0,
  );
  expect(fixture.rows.get("outboxJobs/healthy")?.emailState).toBe("sent");
  expect(fixture.dispatch.mock.calls).toHaveLength(1);
  expect(fixture.dispatch.mock.calls[0][0].stableJobKey).toBe(
    "customer/healthy",
  );
  expect(fixture.send.mock.calls).toHaveLength(1);
});

it.each(["claim", "pin"])(
  "a %s transaction read outage stays known-unsent while the batch continues",
  async (stage) => {
    queued("read-outage");
    queued("healthy");
    let injected = false;
    fixture.transactionRead.mockImplementation((path) => {
      if (path !== "outboxJobs/read-outage" || injected) return;
      const row = fixture.rows.get(path);
      const atStage =
        stage === "claim"
          ? row?.emailState === "queued"
          : row?.emailState === "sending" &&
            row.providerRequestIdentity === undefined;
      if (atStage) {
        injected = true;
        throw Error("TRANSACTION_READ_UNAVAILABLE");
      }
    });
    await expect(run()).resolves.toBeUndefined();
    expect(injected).toBe(true);
    expect(fixture.rows.get("outboxJobs/read-outage")).toMatchObject({
      emailState: "failed",
      failureStage: "preflight",
    });
    expect(fixture.rows.get("outboxJobs/read-outage")?.emailAttempts ?? 0).toBe(
      0,
    );
    expect(fixture.rows.get("outboxJobs/healthy")?.emailState).toBe("sent");
    expect(fixture.dispatch.mock.calls).toHaveLength(1);
    expect(fixture.dispatch.mock.calls[0][0].stableJobKey).toBe(
      "customer/healthy",
    );
    expect(fixture.send.mock.calls).toHaveLength(1);
  },
);

it("outcome persistence failure after provider acceptance never queues a replay and does not stop later work", async () => {
  queued("accepted-write-outage");
  queued("healthy");
  let accepted = false,
    injected = false;
  fixture.send.mockImplementation(async (message) => {
    if (message.to === "fixture@example.invalid") accepted = true;
    return { state: "accepted", attempted: true, providerId };
  });
  fixture.transactionRead.mockImplementation((path) => {
    if (path === "outboxJobs/accepted-write-outage" && accepted && !injected) {
      injected = true;
      throw Error("OUTCOME_WRITE_UNAVAILABLE");
    }
  });
  await expect(run()).resolves.toBeUndefined();
  expect(injected).toBe(true);
  expect(
    fixture.rows.get("outboxJobs/accepted-write-outage")?.emailAttempts,
  ).toBe(1);
  expect(["sent", "unknown"]).toContain(
    fixture.rows.get("outboxJobs/accepted-write-outage")?.emailState,
  );
  if (
    fixture.rows.get("outboxJobs/accepted-write-outage")?.emailState ===
    "unknown"
  )
    expect(
      fixture.rows.get("outboxJobs/accepted-write-outage")
        ?.reconciliationRequired,
    ).toBe(true);
  expect(fixture.rows.get("outboxJobs/healthy")?.emailState).toBe("sent");
  expect(fixture.send.mock.calls).toHaveLength(2);
  await run();
  expect(fixture.send.mock.calls).toHaveLength(2);
});

it("a lower live daily attempt limit invalidates the prior dispatch snapshot before I/O", async () => {
  queued("lower-limit");
  fixture.beforeDispatch.mockImplementationOnce(async () => {
    update("settings/email", { dailyAttemptLimit: 1 });
  });
  await run();
  expect(fixture.send.mock.calls).toHaveLength(0);
  expect(fixture.rows.get("outboxJobs/lower-limit")?.emailAttempts ?? 0).toBe(
    0,
  );
  expect(fixture.rows.get("outboxJobs/lower-limit")?.emailState).toBe("queued");
});

it("claim recovery cannot replace another worker's terminal job after a failed read", async () => {
  queued("claim-race");
  queued("healthy");
  let injected = false;
  fixture.transactionRead.mockImplementation((path) => {
    if (path === "outboxJobs/claim-race" && !injected) {
      injected = true;
      update(path, {
        emailState: "sent",
        version: 20,
        providerState: "accepted",
        providerId,
      });
      throw Error("TRANSACTION_READ_UNAVAILABLE");
    }
  });
  await expect(run()).resolves.toBeUndefined();
  expect(fixture.rows.get("outboxJobs/claim-race")).toMatchObject({
    emailState: "sent",
    version: 20,
    providerState: "accepted",
    providerId,
  });
  expect(fixture.rows.get("outboxJobs/healthy")?.emailState).toBe("sent");
  expect(fixture.send.mock.calls).toHaveLength(1);
});

it("outcome recovery cannot overwrite a concurrent terminal resolution after provider I/O", async () => {
  queued("resolution-race");
  queued("healthy");
  let accepted = false,
    injected = false;
  fixture.send.mockImplementation(async () => {
    accepted = true;
    return { state: "accepted", attempted: true, providerId };
  });
  fixture.transactionRead.mockImplementation((path) => {
    if (path === "outboxJobs/resolution-race" && accepted && !injected) {
      injected = true;
      update(path, {
        emailState: "failed",
        version: 20,
        claimId: "resolved-elsewhere",
      });
      throw Error("OUTCOME_WRITE_UNAVAILABLE");
    }
  });
  await expect(run()).resolves.toBeUndefined();
  expect(fixture.rows.get("outboxJobs/resolution-race")).toMatchObject({
    emailState: "failed",
    version: 20,
    claimId: "resolved-elsewhere",
  });
  expect(fixture.rows.get("outboxJobs/healthy")?.emailState).toBe("sent");
  expect(fixture.send.mock.calls).toHaveLength(2);
  await run();
  expect(fixture.send.mock.calls).toHaveLength(2);
});
