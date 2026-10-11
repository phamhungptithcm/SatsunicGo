import type { Firestore, Transaction } from "firebase-admin/firestore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyNotificationPreferences } from "../../packages/domain/notification-preferences";
import { productionTestEmailAllowed } from "../../functions/src/production-test-email-policy";
import {
  customerEvent,
  customerSnapshotHash,
} from "../../functions/src/customer-notification-events";
import { prepareCustomerEmail } from "../../functions/src/customer-email-job";
import { deliverEmail } from "../../functions/src/email";
import { emailRequestIdentity } from "../../functions/src/email/dispatch";
import { deliverSubscriptionJob } from "../../functions/src/subscription-delivery-service";
import { deliverSubscriptionEmail } from "../../functions/src/subscription-email";
import { subscriptionHash } from "../../functions/src/notification-preferences-service";

const mail = vi.hoisted(() => ({
  db: undefined as unknown,
  identity: vi.fn(),
  io: vi.fn(),
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => mail.db,
}));
vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ getUser: mail.identity }),
}));
vi.mock("firebase-functions/params", () => ({
  defineSecret: () => ({ value: () => "re_synthetic_not_a_real_credential" }),
}));
vi.mock("../../functions/src/email/dispatch", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../functions/src/email/dispatch")
  >()),
  dispatchResend: async (input: {
    beforeSend?: () => Promise<boolean>;
    message: unknown;
  }) => {
    if (input.beforeSend && !(await input.beforeSend()))
      return {
        state: "deferred",
        attempted: false,
        reason: "claim_unavailable",
        retryAt: Date.now() + 1000,
      };
    mail.io(input.message);
    return {
      state: "accepted",
      providerId: "00000000-0000-4000-8000-000000000099",
      attempted: true,
    };
  },
}));

const now = 1_791_591_000_000;
const uid = "tester";
const recipient = "tester@example.invalid";
const provenance = {
  executionMode: "production_test",
  executionPolicyVersion: 1,
  testRunId: "00000000-0000-4000-8000-000000000001",
  testMode: true,
};
const mode = {
  approved: true,
  enabled: true,
  version: 1,
  effectiveFrom: now - 1000,
  expiresAt: now + 1000,
  origin: "https://satsunicgo.web.app",
  provider: "sepay_sandbox",
  testerUids: [uid],
};
const policy = {
  approved: true,
  enabled: true,
  version: 1,
  cutoverAt: now - 100,
  expiresAt: now + 1000,
  testerUids: [uid],
};
const emailConfig = {
  approved: true,
  enabled: true,
  subscriptionsEnabled: true,
  provider: "resend",
  from: "contact@hunpeolabs.com",
  verifiedDomain: "hunpeolabs.com",
  domainVerificationEvidenceId: "synthetic-current-receipt",
  domainVerifiedAt: now - 100,
  cutoverAt: now - 100,
  dailyAttemptLimit: 100,
};
const resource = { ownerId: uid, ...provenance };
const job = { ownerId: uid, ...provenance };
const request = {
  ownerId: uid,
  recipient,
  createdAt: now - 10,
  now,
  kind: "order" as const,
  resource,
  job,
};
function harness(overrides: Record<string, unknown> = {}) {
  const prefs = emptyNotificationPreferences(recipient);
  prefs.topics.orderEmail = {
    requested: true,
    generation: 2,
    confirmedGeneration: 2,
  };
  const rows: Record<string, unknown> = structuredClone({
    "settings/productionTest": mode,
    "settings/productionTestEmail": policy,
    [`notificationPreferences/${uid}`]: prefs,
    ...overrides,
  });
  const reads: string[] = [];
  type Ref = { path: string; id: string };
  const hooks: {
    transactionRead?: (path: string) => void;
    beforeCommit?: (paths: string[]) => void;
  } = {};
  const transactionReads: string[][] = [];
  let retries = 0;
  const snapshot = (ref: Ref) => {
    const data = structuredClone(rows[ref.path]);
    return { ref, id: ref.id, exists: data !== undefined, data: () => data };
  };
  const doc = (path: string) => ({
    path,
    id: path.split("/").at(-1)!,
    get: async () => {
      reads.push(path);
      return snapshot(doc(path));
    },
  });
  const db = {
    projectId: "satsunicgo",
    doc,
    getAll: async (...refs: Ref[]) => refs.map(snapshot),
    collection: (path: string) => ({
      where: (field: string, _op: string, state: string) => ({
        limit: (limit: number) => ({
          get: async () => ({
            docs: Object.entries(rows)
              .filter(
                ([p, data]) =>
                  p.startsWith(`${path}/`) &&
                  (data as Record<string, unknown>)[field] === state,
              )
              .slice(0, limit)
              .map(([p]) => snapshot(doc(p))),
          }),
        }),
      }),
    }),
    runTransaction: async (body: (tx: Transaction) => Promise<unknown>) => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const readSet = new Map<string, string | undefined>();
        const snapshots = new Map<string, ReturnType<typeof snapshot>>();
        const writes: (() => void)[] = [];
        const get = async (ref: Ref) => {
          if (writes.length) throw Error("READ_AFTER_WRITE");
          const cached = snapshots.get(ref.path);
          if (cached) return cached;
          hooks.transactionRead?.(ref.path);
          const value = snapshot(ref);
          snapshots.set(ref.path, value);
          readSet.set(ref.path, JSON.stringify(value.data()));
          return value;
        };
        const tx = {
          get,
          getAll: (...refs: Ref[]) => Promise.all(refs.map(get)),
          update: (ref: Ref, value: Record<string, unknown>) =>
            writes.push(() => {
              rows[ref.path] = {
                ...(rows[ref.path] as object),
                ...structuredClone(value),
              };
            }),
          create: (ref: Ref, value: Record<string, unknown>) =>
            writes.push(() => {
              if (rows[ref.path] !== undefined) throw Error("ALREADY_EXISTS");
              rows[ref.path] = structuredClone(value);
            }),
          delete: (ref: Ref) =>
            writes.push(() => {
              delete rows[ref.path];
            }),
        } as unknown as Transaction;
        const result = await body(tx);
        const paths = [...readSet.keys()];
        transactionReads.push(paths);
        hooks.beforeCommit?.(paths);
        if (
          [...readSet].some(
            ([path, value]) => JSON.stringify(rows[path]) !== value,
          )
        ) {
          retries++;
          continue;
        }
        writes.forEach((write) => write());
        return result;
      }
      throw Error("TRANSACTION_RETRY_EXHAUSTED");
    },
  } as unknown as Firestore;
  return {
    db,
    rows,
    prefs,
    reads,
    hooks,
    transactionReads,
    retries: () => retries,
  };
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  mail.io.mockReset();
  mail.identity.mockReset().mockResolvedValue({
    email: recipient,
    emailVerified: true,
    disabled: false,
  });
  vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", "v1");
  vi.stubEnv("GCLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", "satsunicgo");
  vi.stubEnv("FIREBASE_CONFIG", JSON.stringify({ projectId: "satsunicgo" }));
  for (const key of [
    "FUNCTIONS_EMULATOR",
    "FIRESTORE_EMULATOR_HOST",
    "FIREBASE_AUTH_EMULATOR_HOST",
    "FIREBASE_STORAGE_EMULATOR_HOST",
  ])
    vi.stubEnv(key, undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("test email authorization", () => {
  it("allows only the opted-in tester and reads a bounded set", async () => {
    const h = harness();
    expect(await productionTestEmailAllowed(h.db, request)).toBe(true);
    expect(h.reads).toHaveLength(3);
  });
  it.each([
    ["missing test email policy", undefined],
    ["disabled", { ...policy, enabled: false }],
    ["unapproved", { ...policy, approved: false }],
    ["expired", { ...policy, expiresAt: now }],
    ["future cutover", { ...policy, cutoverAt: now + 1 }],
    ["different tester", { ...policy, testerUids: ["other"] }],
    ["duplicate tester", { ...policy, testerUids: [uid, uid] }],
  ])("blocks %s", async (_name, p) => {
    const h = harness({ "settings/productionTestEmail": p });
    expect(await productionTestEmailAllowed(h.db, request)).toBe(false);
  });
  it("blocks stale jobs and future jobs", async () => {
    const h = harness();
    for (const createdAt of [now - 101, now + 1, NaN])
      expect(
        await productionTestEmailAllowed(h.db, { ...request, createdAt }),
      ).toBe(false);
  });
  it("does not drain real customer jobs while test mode is active", async () => {
    expect(
      await productionTestEmailAllowed(harness().db, {
        ...request,
        resource: { ownerId: uid },
        job: { ownerId: uid },
      }),
    ).toBe(false);
  });
  it("blocks forged or mismatched immutable execution provenance", async () => {
    for (const changed of [
      { ...job, executionMode: "live" },
      { testMode: true, executionMode: "production_test" },
      { ...job, testRunId: "00000000-0000-4000-8000-000000000002" },
      { ...job, executionPolicyVersion: 2 },
      {},
    ])
      expect(
        await productionTestEmailAllowed(harness().db, {
          ...request,
          job: changed,
        }),
      ).toBe(false);
  });
  it("rejects wrong authoritative resource owner", async () => {
    expect(
      await productionTestEmailAllowed(harness().db, {
        ...request,
        resource: { ...resource, ownerId: "other" },
      }),
    ).toBe(false);
  });
  it("rechecks consent and destination rather than caching approval", async () => {
    const h = harness();
    expect(await productionTestEmailAllowed(h.db, request)).toBe(true);
    h.rows[`notificationPreferences/${uid}`] = {
      ...h.prefs,
      topics: {
        ...h.prefs.topics,
        orderEmail: {
          requested: false,
          generation: 3,
          confirmedGeneration: null,
        },
      },
    };
    expect(await productionTestEmailAllowed(h.db, request)).toBe(false);
    h.rows[`notificationPreferences/${uid}`] = h.prefs;
    expect(
      await productionTestEmailAllowed(h.db, {
        ...request,
        recipient: "changed@example.invalid",
      }),
    ).toBe(false);
  });
  it("never sends test mail outside the exact hosted test environment", async () => {
    vi.stubEnv("FIRESTORE_EMULATOR_HOST", "127.0.0.1:18207");
    expect(await productionTestEmailAllowed(harness().db, request)).toBe(false);
  });
  it("allows a tester's subscription confirmation without requiring already-active consent", async () => {
    const h = harness({
      [`notificationPreferences/${uid}`]:
        emptyNotificationPreferences(recipient),
    });
    expect(
      await productionTestEmailAllowed(h.db, {
        ...request,
        kind: "subscription",
        resource: undefined,
        job: {},
      }),
    ).toBe(true);
    // The subscription service separately verifies its pending/active generation before I/O.
    h.rows["settings/productionTestEmail"] = {
      ...policy,
      testerUids: ["other"],
    };
    expect(
      await productionTestEmailAllowed(h.db, {
        ...request,
        kind: "subscription",
      }),
    ).toBe(false);
  });
  it("preserves legacy live consent semantics when the test artifact is absent", async () => {
    vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", undefined);
    const h = harness();
    expect(
      await productionTestEmailAllowed(h.db, {
        ...request,
        resource: {},
        job: {},
      }),
    ).toBe(true);
    expect(h.reads).toEqual([]);
    expect(await productionTestEmailAllowed(h.db, request)).toBe(false);
  });
  it("stops test mail when admission is disabled without relabeling records", async () => {
    const h = harness({
      "settings/productionTest": { ...mode, enabled: false },
    });
    expect(await productionTestEmailAllowed(h.db, request)).toBe(false);
    expect(request.resource).toEqual(resource);
  });
  it.each([undefined, { ...mode, enabled: false }])(
    "does not release old live jobs when test admission is absent or disabled",
    async (value) => {
      const h = harness({ "settings/productionTest": value });
      expect(
        await productionTestEmailAllowed(h.db, {
          ...request,
          resource: { ownerId: uid },
          job: { ownerId: uid },
        }),
      ).toBe(false);
    },
  );
  it("does not promote legacy demo markers to hosted email authority", async () => {
    expect(
      await productionTestEmailAllowed(harness().db, {
        ...request,
        resource: { ownerId: uid, testMode: true },
        job: { ownerId: uid, testMode: true },
      }),
    ).toBe(false);
  });
  it("marks the actual rendered payment email only after authoritative approval", async () => {
    const event = customerEvent(
      "payment_confirmed",
      {
        ownerId: uid,
        entityId: "checkout",
        entityVersion: 1,
        occurredAt: now - 10,
      },
      { orderRef: "SG-TEST", paidAmount: 100000, paymentScope: "catalog_full" },
    );
    const h = harness({
      "settings/customerNotifications": {
        approved: true,
        emailEnabled: true,
        cutoverAt: now - 100,
      },
      "purchaseCheckouts/checkout": { ...resource, state: "paid" },
    });
    const rendered = await prepareCustomerEmail(
      h.db,
      {
        ...job,
        customerEvent: event,
        customerSnapshotHash: customerSnapshotHash(event),
      },
      now,
      recipient,
    );
    expect(rendered.subject).toMatch(/^\[Test\] /);
    expect(rendered.html).toContain("SG-TEST");
    h.rows["settings/productionTestEmail"] = { ...policy, enabled: false };
    await expect(
      prepareCustomerEmail(
        h.db,
        {
          ...job,
          customerEvent: event,
          customerSnapshotHash: customerSnapshotHash(event),
        },
        now,
        recipient,
      ),
    ).rejects.toThrow("blocked_policy");
  });
});

function customerWorkerFixture() {
  const event = customerEvent(
    "payment_confirmed",
    {
      ownerId: uid,
      entityId: "checkout",
      entityVersion: 1,
      occurredAt: now - 10,
    },
    { orderRef: "SG-TEST", paidAmount: 100000, paymentScope: "catalog_full" },
  );
  const h = harness({
    "settings/customerNotifications": {
      approved: true,
      emailEnabled: true,
      cutoverAt: now - 100,
    },
    "settings/email": emailConfig,
    "purchaseCheckouts/checkout": { ...resource, state: "paid" },
    "outboxJobs/test": {
      ...job,
      action: "verifyTransfer",
      customerEvent: event,
      customerSnapshotHash: customerSnapshotHash(event),
      createdAt: now - 10,
      emailState: "queued",
      version: 0,
    },
    "outboxJobs/unknown": {
      emailState: "unknown",
      reconciliationRequired: true,
      providerId: "keep",
    },
    "emailDispatchQuota/resend": {
      attempts: 7,
      day: "keep",
      nextAllowedAt: now,
    },
  });
  mail.db = h.db;
  return h;
}
const runWorker = () =>
  deliverEmail.run({ scheduleTime: new Date(now).toISOString() });
const row = (h: ReturnType<typeof harness>, path: string) =>
  h.rows[path] as Record<string, unknown>;

function revoke(h: ReturnType<typeof harness>, scenario: string) {
  if (scenario === "admission")
    h.rows["settings/productionTest"] = { ...mode, enabled: false };
  if (scenario === "email-policy")
    h.rows["settings/productionTestEmail"] = { ...policy, enabled: false };
  if (scenario === "tester")
    h.rows["settings/productionTestEmail"] = {
      ...policy,
      testerUids: ["other"],
    };
  if (scenario === "expiry") vi.setSystemTime(now + 1001);
  if (scenario === "consent")
    h.rows[`notificationPreferences/${uid}`] = {
      ...h.prefs,
      topics: {
        ...h.prefs.topics,
        orderEmail: {
          requested: false,
          generation: 3,
          confirmedGeneration: null,
        },
      },
    };
  if (scenario === "resource-owner")
    row(h, "purchaseCheckouts/checkout").ownerId = "other";
  if (scenario === "resource-run")
    row(h, "purchaseCheckouts/checkout").testRunId =
      "00000000-0000-4000-8000-000000000002";
  if (scenario === "config-disable") row(h, "settings/email").enabled = false;
  if (scenario === "config-subscriptions")
    row(h, "settings/email").subscriptionsEnabled = false;
  if (scenario === "config-cutover") row(h, "settings/email").cutoverAt = now;
  if (scenario === "config-from")
    row(h, "settings/email").from = "other@hunpeolabs.com";
  if (scenario === "config-quota")
    row(h, "settings/email").dailyAttemptLimit = 50;
  if (scenario === "lock")
    h.rows[`users/${uid}`] = { locked: true, marketingConsent: true };
  if (scenario === "marketing")
    h.rows[`users/${uid}`] = { marketingConsent: false };
  if (scenario === "marketing-preference") {
    const prefs = row(h, `notificationPreferences/${uid}`);
    prefs.topics = {
      ...(prefs.topics as Record<string, unknown>),
      promotionsEmail: {
        requested: false,
        generation: 2,
        confirmedGeneration: null,
      },
    };
  }
}

describe("actual customer worker authorization transaction", () => {
  it.each([
    "admission",
    "email-policy",
    "tester",
    "expiry",
    "consent",
    "resource-owner",
    "resource-run",
  ])(
    "blocks %s revoked after preflight before the attempt transaction",
    async (scenario) => {
      const h = customerWorkerFixture();
      const untouched = structuredClone([
        h.rows["outboxJobs/unknown"],
        h.rows["emailDispatchQuota/resend"],
      ]);
      let changed = false;
      h.hooks.transactionRead = (path) => {
        if (
          !changed &&
          path === "outboxJobs/test" &&
          row(h, path).providerRequestIdentity
        ) {
          changed = true;
          revoke(h, scenario);
        }
      };
      await runWorker();
      expect(changed).toBe(true);
      expect(mail.io).not.toHaveBeenCalled();
      expect(row(h, "outboxJobs/test").emailAttempts ?? 0).toBe(0);
      expect(row(h, "outboxJobs/test").emailState).toMatch(/^blocked_/);
      expect([
        h.rows["outboxJobs/unknown"],
        h.rows["emailDispatchQuota/resend"],
      ]).toEqual(untouched);
    },
  );
  it.each(["email-policy", "consent", "resource-run"])(
    "re-admits %s after a watched document changes before commit",
    async (scenario) => {
      const h = customerWorkerFixture();
      let changed = false;
      h.hooks.beforeCommit = (paths) => {
        if (!changed && paths.includes("settings/productionTestEmail")) {
          changed = true;
          revoke(h, scenario);
        }
      };
      await runWorker();
      expect(changed).toBe(true);
      expect(h.retries()).toBe(1);
      expect(mail.io).not.toHaveBeenCalled();
      expect(row(h, "outboxJobs/test").emailAttempts ?? 0).toBe(0);
    },
  );
  it("commits one authorized attempt with the policy, consent and resource in its read set", async () => {
    const h = customerWorkerFixture();
    await runWorker();
    expect(mail.io).toHaveBeenCalledOnce();
    expect(row(h, "outboxJobs/test")).toMatchObject({
      emailState: "sent",
      providerState: "accepted",
      emailAttempts: 1,
    });
    expect(
      h.transactionReads.some((paths) =>
        [
          "outboxJobs/test",
          "settings/productionTest",
          "settings/productionTestEmail",
          `notificationPreferences/${uid}`,
          "purchaseCheckouts/checkout",
          "settings/customerNotifications",
          "settings/email",
          `users/${uid}`,
        ].every((path) => paths.includes(path)),
      ),
    ).toBe(true);
  });
  it("allows a current promotional preference with the compatibility flag", async () => {
    const h = customerWorkerFixture();
    h.rows[`users/${uid}`] = { marketingConsent: true };
    row(h, "outboxJobs/test").marketing = true;
    h.rows[`notificationPreferences/${uid}`] = {
      ...h.prefs,
      topics: {
        ...h.prefs.topics,
        promotionsEmail: {
          requested: true,
          generation: 1,
          confirmedGeneration: 1,
        },
      },
    };
    await runWorker();
    expect(mail.io).toHaveBeenCalledOnce();
    expect(row(h, "outboxJobs/test")).toMatchObject({
      emailState: "sent",
      emailAttempts: 1,
    });
  });
  it("preserves optional live-order consent when it changes during attempt commit", async () => {
    vi.stubEnv("PURCHASE_PRODUCTION_TEST_ARTIFACT", undefined);
    const h = customerWorkerFixture();
    const event = customerEvent(
      "order_received",
      {
        ownerId: uid,
        entityId: "order",
        orderId: "order",
        entityVersion: 1,
        occurredAt: now - 10,
      },
      { orderRef: "SG-LIVE", itemSummary: "Áo cotton" },
    );
    h.rows["orders/order"] = { ownerId: uid, version: 1 };
    h.rows["outboxJobs/test"] = {
      ownerId: uid,
      action: "verifyTransfer",
      customerEvent: event,
      customerSnapshotHash: customerSnapshotHash(event),
      createdAt: now - 10,
      emailState: "queued",
      version: 0,
    };
    let changed = false;
    h.hooks.beforeCommit = (paths) => {
      if (!changed && paths.includes(`notificationPreferences/${uid}`)) {
        changed = true;
        revoke(h, "consent");
      }
    };
    await runWorker();
    expect(h.retries()).toBe(1);
    expect(mail.io).not.toHaveBeenCalled();
    expect(row(h, "outboxJobs/test")).toMatchObject({
      emailState: "suppressed_preference",
    });
    expect(row(h, "outboxJobs/test").emailAttempts ?? 0).toBe(0);
  });
  it.each(
    [
      "config-disable",
      "config-cutover",
      "config-from",
      "config-quota",
      "lock",
      "marketing",
      "marketing-preference",
    ].flatMap((scenario) =>
      ["before-final-read", "before-commit"].map(
        (timing) => [scenario, timing] as const,
      ),
    ),
  )(
    "blocks %s changing %s with zero provider attempts",
    async (scenario, timing) => {
      const h = customerWorkerFixture();
      h.rows[`users/${uid}`] = { marketingConsent: true };
      if (scenario === "marketing" || scenario === "marketing-preference") {
        row(h, "outboxJobs/test").marketing = true;
        h.rows[`notificationPreferences/${uid}`] = {
          ...h.prefs,
          topics: {
            ...h.prefs.topics,
            promotionsEmail: {
              requested: true,
              generation: 1,
              confirmedGeneration: 1,
            },
          },
        };
      }
      let changed = false;
      if (timing === "before-final-read")
        h.hooks.transactionRead = (path) => {
          if (
            !changed &&
            path === "outboxJobs/test" &&
            row(h, path).providerRequestIdentity
          ) {
            changed = true;
            revoke(h, scenario);
          }
        };
      else
        h.hooks.beforeCommit = (paths) => {
          if (!changed && paths.includes("settings/email")) {
            changed = true;
            revoke(h, scenario);
          }
        };
      await runWorker();
      expect(changed).toBe(true);
      expect(mail.io).not.toHaveBeenCalled();
      expect(row(h, "outboxJobs/test").emailAttempts ?? 0).toBe(0);
      expect(row(h, "outboxJobs/test").emailState).toBe(
        scenario.startsWith("config-")
          ? "queued"
          : scenario === "marketing-preference"
            ? "suppressed_preference"
            : "blocked_recipient",
      );
      if (timing === "before-commit") expect(h.retries()).toBe(1);
    },
  );
});

function subscriptionFixture() {
  const h = harness({ "settings/email": emailConfig });
  h.rows[`notificationPreferences/${uid}`] = {
    ...h.prefs,
    topics: {
      ...h.prefs.topics,
      orderEmail: { requested: true, generation: 2, confirmedGeneration: null },
    },
  };
  h.rows["notificationEmailJobs/test"] = {
    ownerId: uid,
    channel: "email",
    kind: "confirm",
    state: "queued",
    createdAt: now - 10,
    scopes: [{ topic: "orderEmail", generation: 2 }],
    destinationHash: subscriptionHash(recipient),
  };
  let identityReads = 0;
  const onFinalIdentity: { run?: () => void } = {};
  const io = vi.fn();
  const deliver = () =>
    deliverSubscriptionJob(
      h.db,
      "email",
      "test",
      "https://satsunicgo.web.app",
      now,
      {
        available: () => true,
        send: async (_channel, destination, content, _key, authorize) => {
          if (!("html" in content)) throw Error("EMAIL_CONTENT_REQUIRED");
          const from = "contact@hunpeolabs.com";
          const accepted = await authorize!(
            emailRequestIdentity({ from, to: destination, ...content }),
            from,
          );
          if (!accepted)
            return {
              state: "deferred",
              attempted: false,
              retryAt: Date.now() + 1000,
            };
          io();
          return {
            state: "accepted",
            attempted: true,
            providerId: "00000000-0000-4000-8000-000000000099",
          };
        },
      },
      async () => {
        identityReads++;
        if (identityReads === 2) onFinalIdentity.run?.();
        return { email: recipient, verified: true, disabled: false };
      },
    );
  return { ...h, deliver, io, onFinalIdentity };
}
describe("actual subscription service final admission", () => {
  it.each(["admission", "email-policy", "tester", "expiry"])(
    "blocks %s changing during the final Auth await",
    async (scenario) => {
      const h = subscriptionFixture();
      h.onFinalIdentity.run = () => revoke(h, scenario);
      expect(await h.deliver()).toBe("suppressed");
      expect(h.io).not.toHaveBeenCalled();
      expect(row(h, "notificationEmailJobs/test").providerAttempts ?? 0).toBe(
        0,
      );
    },
  );
  it("retries current policy admission before committing a subscription attempt", async () => {
    const h = subscriptionFixture();
    let changed = false;
    h.hooks.beforeCommit = (paths) => {
      if (!changed && paths.includes("settings/productionTestEmail")) {
        changed = true;
        revoke(h, "email-policy");
      }
    };
    expect(await h.deliver()).toBe("suppressed");
    expect(h.retries()).toBe(1);
    expect(h.io).not.toHaveBeenCalled();
    expect(row(h, "notificationEmailJobs/test").providerAttempts ?? 0).toBe(0);
  });
  it("preserves pending-generation confirmation while watching current policy", async () => {
    const h = subscriptionFixture();
    expect(await h.deliver()).toBe("accepted");
    expect(h.io).toHaveBeenCalledOnce();
    expect(row(h, "notificationEmailJobs/test").providerAttempts).toBe(1);
    expect(
      h.transactionReads.some((paths) =>
        [
          "notificationEmailJobs/test",
          "settings/productionTest",
          "settings/productionTestEmail",
          `notificationPreferences/${uid}`,
          `users/${uid}`,
        ].every((path) => paths.includes(path)),
      ),
    ).toBe(true);
  });
});

describe("actual subscription sender current config", () => {
  it.each(
    [
      "config-disable",
      "config-subscriptions",
      "config-cutover",
      "config-from",
      "config-quota",
    ].flatMap((scenario) =>
      ["during-auth", "before-commit"].map(
        (timing) => [scenario, timing] as const,
      ),
    ),
  )("blocks %s changing %s before provider I/O", async (scenario, timing) => {
    const h = subscriptionFixture();
    mail.db = h.db;
    let changed = false;
    if (timing === "during-auth")
      mail.identity.mockImplementation(async () => {
        if (mail.identity.mock.calls.length === 2) {
          changed = true;
          revoke(h, scenario);
        }
        return { email: recipient, emailVerified: true, disabled: false };
      });
    else
      h.hooks.beforeCommit = (paths) => {
        if (!changed && paths.includes("settings/email")) {
          changed = true;
          revoke(h, scenario);
        }
      };
    await deliverSubscriptionEmail.run({
      scheduleTime: new Date(now).toISOString(),
    });
    expect(changed).toBe(true);
    expect(mail.io).not.toHaveBeenCalled();
    expect(row(h, "notificationEmailJobs/test").providerAttempts ?? 0).toBe(0);
    expect(row(h, "notificationEmailJobs/test").state).toBe("suppressed");
    if (timing === "before-commit") expect(h.retries()).toBe(1);
  });
  it("passes the real sender config into the watched attempt transaction", async () => {
    const h = subscriptionFixture();
    mail.db = h.db;
    await deliverSubscriptionEmail.run({
      scheduleTime: new Date(now).toISOString(),
    });
    expect(mail.io).toHaveBeenCalledOnce();
    expect(row(h, "notificationEmailJobs/test")).toMatchObject({
      state: "accepted",
      providerAttempts: 1,
    });
    expect(
      h.transactionReads.some((paths) =>
        [
          "settings/email",
          "settings/productionTest",
          "settings/productionTestEmail",
          "notificationEmailJobs/test",
          `notificationPreferences/${uid}`,
          `users/${uid}`,
        ].every((path) => paths.includes(path)),
      ),
    ).toBe(true);
  });
});
