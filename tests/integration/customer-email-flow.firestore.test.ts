import { randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { describe, expect, test, vi } from "vitest";
import { emptyNotificationPreferences } from "../../packages/domain/notification-preferences";
import {
  customerEvent,
  customerEventFields,
} from "../../functions/src/customer-notification-events";
import { projectCustomerNotification } from "../../functions/src/customer-notification-delivery";
import { deliverEmail } from "../../functions/src/email";

// The actual worker, renderer, policy, transactions and adapter run. Only runtime
// eligibility, Auth/secret ports and outbound HTTP are replaced in this fixture.
const fixture = vi.hoisted(() => ({
  db: undefined as Firestore | undefined,
  raw: undefined as Firestore | undefined,
  quotaPath: "",
  enabled: false,
  request: vi.fn<typeof fetch>(),
}));
vi.mock("firebase-admin/firestore", async (original) => {
  const actual = await original<typeof import("firebase-admin/firestore")>();
  return {
    ...actual,
    getFirestore: (...args: Parameters<typeof actual.getFirestore>) =>
      args.length ? actual.getFirestore(...args) : fixture.db,
  };
});
vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    getUser: async () => ({
      email: "flow@example.invalid",
      emailVerified: true,
      disabled: false,
    }),
  }),
}));
vi.mock("firebase-functions/params", () => ({
  defineSecret: () => ({
    value: () => "re_synthetic_fixture_only_123456",
  }),
}));
vi.mock("../../functions/src/provider-release-gate", async (original) => ({
  ...(await original<
    typeof import("../../functions/src/provider-release-gate")
  >()),
  emailProductionEnvironmentAllowed: () => fixture.enabled,
  releaseCapabilityAllowed: () => fixture.enabled,
}));
vi.mock("../../functions/src/email/dispatch", async (original) => {
  const actual =
    await original<typeof import("../../functions/src/email/dispatch")>();
  return {
    ...actual,
    dispatchResend: (input: Parameters<typeof actual.dispatchResend>[0]) =>
      actual.dispatchResend({
        ...input,
        db: fixture.raw!,
        quotaRef: fixture.raw!.doc(fixture.quotaPath),
        request: fixture.request,
      }),
  };
});

describe.skipIf(process.env.RUN_CUSTOMER_EMAIL_FLOW_TESTS !== "1")(
  "customer event to Resend adapter on scoped demo Firestore",
  () => {
    test.each(["accepted", "revoked", "unknown", "disabled"] as const)(
      "%s preserves inbox, policy and durable send semantics",
      async (scenario) => {
        if (
          process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
          process.env.GCLOUD_PROJECT !== "demo-satsunicgo"
        )
          throw Error("EXACT_DEMO_EMULATOR_REQUIRED");
        const app = initializeApp(
          { projectId: "demo-satsunicgo" },
          `email-flow-${randomUUID()}`,
        );
        const raw = getFirestore(app);
        const root = `qaCustomerEmailFlows/${randomUUID()}`;
        // Every worker collection/config read is scoped. Never scan real outbox
        // jobs or change shared settings, Auth users or emulator rules.
        const db = {
          projectId: "demo-satsunicgo",
          doc: (path: string) => raw.doc(`${root}/${path}`),
          collection: (path: string) => raw.collection(`${root}/${path}`),
          runTransaction: raw.runTransaction.bind(raw),
        } as unknown as Firestore;
        fixture.db = db;
        fixture.raw = raw;
        fixture.quotaPath = `emailDispatchQuota/qa-${randomUUID()}`;
        fixture.enabled = scenario !== "disabled";
        fixture.request.mockReset().mockImplementation(async () => {
          if (scenario === "unknown") throw Error("SYNTHETIC_CONNECTION_LOSS");
          return new Response(
            JSON.stringify({ id: "00000000-0000-4000-8000-000000000001" }),
            { status: 200 },
          );
        });
        const now = Date.now(),
          cutoverAt = now - 1000;
        const event =
          scenario === "revoked"
            ? customerEvent(
                "order_delivered",
                {
                  ownerId: "owner",
                  entityId: "order",
                  orderId: "order",
                  entityVersion: 1,
                  occurredAt: now,
                },
                { orderRef: "SG-FLOW" },
              )
            : customerEvent(
                "payment_confirmed",
                {
                  ownerId: "owner",
                  entityId: "order",
                  orderId: "order",
                  entityVersion: 1,
                  occurredAt: now,
                },
                {
                  orderRef: "SG-FLOW",
                  paidAmount: 1000,
                  paymentScope: "catalog_full",
                },
              );
        const ref = db.doc(`outboxJobs/${event.eventId}`);
        const inbox = db.doc(`notifications/${event.eventId}`);
        try {
          await db.doc("settings/email").set({
            approved: true,
            provider: "resend",
            enabled: true,
            subscriptionsEnabled: true,
            from: "contact@hunpeolabs.com",
            verifiedDomain: "hunpeolabs.com",
            cutoverAt,
            dailyAttemptLimit: 100,
            domainVerificationEvidenceId: "qa/synthetic",
            domainVerifiedAt: cutoverAt,
          });
          await db
            .doc("settings/customerNotifications")
            .set({ approved: true, emailEnabled: true, cutoverAt });
          await db.doc("users/owner").set({ locked: false });
          const preferences = emptyNotificationPreferences(
            "flow@example.invalid",
          );
          if (scenario === "revoked")
            preferences.topics.orderEmail = {
              requested: true,
              generation: 1,
              confirmedGeneration: 1,
            };
          await db.doc("notificationPreferences/owner").set(preferences);
          // Business fact and its event commit atomically; no provider I/O in this transaction.
          await db.runTransaction(async (tx) => {
            tx.create(db.doc("orders/order"), { ownerId: "owner", version: 1 });
            tx.create(ref, {
              ownerId: "owner",
              orderId: "order",
              action: "verifyTransfer",
              state: "queued",
              createdAt: now,
              ...customerEventFields(() => event),
            });
          });
          expect(fixture.request).not.toHaveBeenCalled();
          const projected = await Promise.all(
            Array.from({ length: 8 }, () =>
              projectCustomerNotification(db, event.eventId, Date.now()),
            ),
          );
          expect(projected.filter(Boolean)).toHaveLength(1);
          expect((await inbox.get()).data()).toMatchObject({
            ownerId: "owner",
            read: false,
            templateId: event.templateId,
            targetPath:
              scenario === "revoked" ? "/account/orders/order" : "/account",
          });
          if (scenario === "revoked") {
            // Withdrawal after enqueue must be observed by the actual worker.
            preferences.topics.orderEmail = {
              requested: false,
              generation: 2,
              confirmedGeneration: 1,
            };
            await db.doc("notificationPreferences/owner").set(preferences);
          }
          await deliverEmail.run({ scheduleTime: new Date().toISOString() });
          const state = (await ref.get()).data()!;
          if (scenario === "disabled") {
            expect(state.emailState).toBe("blocked_external");
            expect(fixture.request).not.toHaveBeenCalled();
          } else if (scenario === "revoked") {
            expect(state.emailState).toBe("suppressed_preference");
            expect(fixture.request).not.toHaveBeenCalled();
          } else {
            expect(fixture.request).toHaveBeenCalledOnce();
            const [url, options] = fixture.request.mock.calls[0];
            expect(url).toBe("https://api.resend.com/emails");
            const body = JSON.parse(options!.body as string);
            expect(body.to).toBe("flow@example.invalid");
            expect(body.html).toContain("Đã xác nhận thanh toán");
            expect(body.html).toContain(
              'href="https://satsunicgo.web.app/account"',
            );
            expect(
              (options!.headers as Record<string, string>)["Idempotency-Key"],
            ).toMatch(/^satsunicgo-email-v1\/[a-f0-9]{64}$/);
            expect(state.providerRequestIdentity).toMatch(/^[a-f0-9]{64}$/);
            expect(state.emailAttempts).toBe(1);
            expect(state.emailState).toBe(
              scenario === "accepted" ? "sent" : "unknown",
            );
            if (scenario === "accepted")
              expect(state.providerState).toBe("accepted");
            else expect(state.reconciliationRequired).toBe(true);
            // Provider acceptance is distinct from inbox delivery.
            expect(state).not.toHaveProperty("emailDeliveredAt");
            await deliverEmail.run({ scheduleTime: new Date().toISOString() });
            expect(fixture.request).toHaveBeenCalledOnce();
          }
        } finally {
          fixture.enabled = false;
          await raw.recursiveDelete(raw.doc(root));
          await raw.doc(fixture.quotaPath).delete();
          expect((await raw.collection(`${root}/outboxJobs`).get()).empty).toBe(
            true,
          );
          expect((await raw.doc(fixture.quotaPath).get()).exists).toBe(false);
          await raw.terminate();
          await deleteApp(app);
        }
      },
      30_000,
    );
  },
);
