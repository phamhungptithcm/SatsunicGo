import { syntheticProviderAllowed } from "../helpers/synthetic-provider-gate";
import { initializeApp, deleteApp, type App } from "firebase-admin/app";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import type { EmailDispatchResult } from "../../functions/src/email/dispatch";
import {
  customerEvent,
  customerSnapshotHash,
} from "../../functions/src/customer-notification-events";
import { emptyNotificationPreferences } from "../../packages/domain/notification-preferences";
const local = vi.hoisted(() => ({
  uid: "email-worker-fixture",
  send: vi.fn<() => Promise<EmailDispatchResult>>(async () => ({
    state: "accepted",
    attempted: true,
    providerId: "synthetic-provider-id",
  })),
}));
// Only the external transport is synthetic; real worker, consent, claim and
// reconciliation transactions run against an isolated real Firestore emulator.
vi.mock("../../functions/src/email/dispatch", async (original) => ({
  ...(await original<typeof import("../../functions/src/email/dispatch")>()),
  dispatchResend: async (
    input: Parameters<
      typeof import("../../functions/src/email/dispatch").dispatchResend
    >[0],
  ) => {
    if (input.beforeSend && !(await input.beforeSend()))
      return {
        state: "deferred",
        attempted: false,
        reason: "claim_unavailable",
        retryAt: Date.now() + 1800000,
      };
    return local.send();
  },
}));
vi.mock("firebase-functions/params", () => ({
  defineSecret: () => ({ value: () => "synthetic-not-a-credential" }),
}));
vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    getUser: async () => ({
      email: "fixture@example.invalid",
      emailVerified: true,
      disabled: false,
    }),
  }),
}));
vi.mock("../../functions/src/provider-release-gate", async (original) => ({
  ...(await original<
    typeof import("../../functions/src/provider-release-gate")
  >()),
  releaseCapabilityAllowed: syntheticProviderAllowed,
  emailProductionEnvironmentAllowed: (
    environment: Readonly<Record<string, string | undefined>>,
  ) => syntheticProviderAllowed("email", environment),
}));
let deliver: typeof import("../../functions/src/email").deliverEmail,
  command: typeof import("../../functions/src/outbox-command").outboxCommand,
  db: ReturnType<typeof getFirestore>,
  app: App;
const cutoverAt = Date.now() - 1000;
function req(data: unknown) {
  return {
    auth: {
      uid: local.uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  } as CallableRequest;
}
async function queued(id: string, occurredAt = Date.now()) {
  const event = customerEvent(
    "order_received",
    {
      ownerId: local.uid,
      entityId: id,
      orderId: id,
      entityVersion: 1,
      occurredAt,
    },
    { itemSummary: "Synthetic item", orderRef: id },
  );
  await db.doc(`orders/${id}`).set({ ownerId: local.uid, version: 1 });
  await db
    .doc(`outboxJobs/${id}`)
    .set({
      ownerId: local.uid,
      action: "catalogCheckout",
      state: "inAppDelivered",
      emailState: "queued",
      emailAttempts: 0,
      version: 0,
      createdAt: occurredAt,
      customerEvent: event,
      customerSnapshotHash: customerSnapshotHash(event),
    });
}
beforeAll(async () => {
  syntheticProviderAllowed("email", process.env);
  local.uid = `email-${randomUUID()}`;
  app = initializeApp({
    projectId: `demo-satsunicgo-email-${randomUUID().slice(0, 8)}`,
  });
  db = getFirestore();
  ({ deliverEmail: deliver } = await import("../../functions/src/email"));
  ({ outboxCommand: command } =
    await import("../../functions/src/outbox-command"));
  const prefs = emptyNotificationPreferences("fixture@example.invalid");
  prefs.topics.orderEmail = {
    requested: true,
    generation: 1,
    confirmedGeneration: 1,
  };
  await Promise.all([
    db.doc(`users/${local.uid}`).set({ locked: false }),
    db.doc(`staffAccess/${local.uid}`).set({ active: true, roles: ["OWNER"] }),
    db.doc(`notificationPreferences/${local.uid}`).set(prefs),
    db
      .doc("settings/customerNotifications")
      .set({ approved: true, emailEnabled: true, cutoverAt }),
    db
      .doc("settings/email")
      .set({
        approved: true,
        provider: "resend",
        enabled: true,
        subscriptionsEnabled: true,
        from: "contact@hunpeolabs.com",
        verifiedDomain: "hunpeolabs.com",
        cutoverAt,
        dailyAttemptLimit: 100,
        domainVerificationEvidenceId: "qa/synthetic-only",
        domainVerifiedAt: cutoverAt,
      }),
  ]);
});
it("unknown Resend outcomes need versioned reconciliation; cannot blindly retry or overwrite a resolution with a late worker", async () => {
  const id = `email021-${randomUUID()}`,
    ref = db.doc(`outboxJobs/${id}`);
  await queued(id);
  local.send.mockImplementationOnce(async () => {
    throw Error("synthetic timeout after send");
  });
  await deliver.run({ scheduleTime: new Date().toISOString() });
  expect((await ref.get()).data()).toMatchObject({
    emailState: "unknown",
    version: 2,
  });
  await expect(
    command.run(
      req({
        id,
        action: "retry",
        expectedVersion: 2,
        operationId: randomUUID(),
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await expect(
    command.run(
      req({
        id,
        action: "resolveUnknown",
        expectedVersion: 2,
        operationId: randomUUID(),
        outcome: "confirmed_not_sent",
      }),
    ),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  const resolution = {
    id,
    action: "resolveUnknown",
    expectedVersion: 2,
    operationId: randomUUID(),
    outcome: "confirmed_not_sent",
    evidence: "Synthetic provider readback, no real email",
  };
  expect(await command.run(req(resolution))).toEqual({ version: 3 });
  expect(await command.run(req(resolution))).toEqual({ version: 3 });
  await command.run(
    req({ id, action: "retry", expectedVersion: 3, operationId: randomUUID() }),
  );
  local.send.mockImplementationOnce(async () => {
    await ref.update({ emailState: "unknown", version: 6 });
    await command.run(
      req({
        id,
        action: "resolveUnknown",
        expectedVersion: 6,
        operationId: randomUUID(),
        outcome: "confirmed_not_sent",
        evidence: "Synthetic confirmed not sent",
      }),
    );
    return {
      state: "accepted",
      attempted: true,
      providerId: "synthetic-late-id",
    };
  });
  await deliver.run({ scheduleTime: new Date().toISOString() });
  expect((await ref.get()).data()).toMatchObject({
    emailState: "failed",
    version: 7,
  });
  expect(
    (
      await db
        .collection("auditEvents")
        .where("resourceId", "==", id)
        .where("action", "==", "emailLateOutcome")
        .get()
    ).size,
  ).toBe(1);
  expect(local.send).toHaveBeenCalledTimes(2);
});

it("pre-cutover jobs cannot dispatch and revoked optional consent stays suppressed", async () => {
  const before = local.send.mock.calls.length;
  const historical = `historical-${randomUUID()}`;
  await queued(historical, cutoverAt - 1);
  await deliver.run({ scheduleTime: new Date().toISOString() });
  expect(
    (await db.doc(`outboxJobs/${historical}`).get()).get("emailState"),
  ).toBe("blocked_policy");
  const revoked = `revoked-${randomUUID()}`;
  await queued(revoked);
  await db
    .doc(`notificationPreferences/${local.uid}`)
    .update({ "topics.orderEmail.requested": false });
  await deliver.run({ scheduleTime: new Date().toISOString() });
  expect((await db.doc(`outboxJobs/${revoked}`).get()).get("emailState")).toBe(
    "suppressed_preference",
  );
  expect(local.send).toHaveBeenCalledTimes(before);
});
afterAll(async () => {
  if (app) {
    for (const collection of await db.listCollections())
      await db.recursiveDelete(collection);
    await db.terminate();
    await deleteApp(app);
  }
});
