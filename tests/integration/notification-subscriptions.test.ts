import { randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { describe, expect, test } from "vitest";
import {
  saveNotificationPreferences,
  subscriptionHash,
} from "../../functions/src/notification-preferences-service";
import {
  deliverSubscriptionJob,
  type SubscriptionSender,
} from "../../functions/src/subscription-delivery-service";
import { applySubscriptionToken } from "../../functions/src/notification-token-service";
const enabled = process.env.RUN_NOTIFICATION_EMULATOR_TESTS === "1";
describe.skipIf(!enabled)(
  "notification subscription transactions on shared demo emulator",
  () => {
    test("concurrent replay, confirmation, scoped opt-out and stale-token rejection", async () => {
      if (
        process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
        process.env.GCLOUD_PROJECT !== "demo-satsunicgo"
      )
        throw Error("DEMO_EMULATOR_REQUIRED");
      const app = initializeApp(
          { projectId: "demo-satsunicgo" },
          `notification-${randomUUID()}`,
        ),
        db = getFirestore(app);
      const uid = `notification-test-${randomUUID()}`,
        email = `${uid}@example.invalid`,
        identity = async () => ({ email, verified: true, disabled: false }),
        now = Date.now();
      const selected = {
          orderEmail: true,
          promotionsEmail: true,
          orderSms: false,
        },
        operationId = randomUUID();
      const command = {
        action: "save" as const,
        operationId,
        expectedVersion: 0,
        selected,
        phone: "",
        source: "profile" as const,
      };
      const sent: string[] = [];
      const sender: SubscriptionSender = {
        available: () => true,
        send: async (_channel, _recipient, content) => {
          sent.push(content.text);
          return "accepted";
        },
      };
      try {
        await db
          .doc(`users/${uid}`)
          .set({ locked: false, version: 0, marketingConsent: false });
        const saves = await Promise.all(
          Array.from({ length: 8 }, () =>
            saveNotificationPreferences(db, uid, email, command, now),
          ),
        );
        expect(saves.every((s) => s.version === 1)).toBe(true);
        const jobs = await db
          .collection("notificationEmailJobs")
          .where("ownerId", "==", uid)
          .get();
        expect(jobs.size).toBe(1);
        await Promise.all(
          [0, 1, 2].map(() =>
            deliverSubscriptionJob(
              db,
              "email",
              jobs.docs[0].id,
              "https://satsunicgo.web.app",
              now,
              sender,
              identity,
            ),
          ),
        );
        expect(sent).toHaveLength(1);
        const token = /#notification-confirm=([a-f0-9]{64})/.exec(sent[0])![1];
        expect(
          await applySubscriptionToken(
            db,
            token,
            "confirm",
            now + 100,
            identity,
          ),
        ).toEqual({ status: "confirmed" });
        expect(
          (await db.doc(`users/${uid}`).get()).data()?.marketingConsent,
        ).toBe(true);
        const prefs = (
          await db.doc(`notificationPreferences/${uid}`).get()
        ).data()!;
        await saveNotificationPreferences(
          db,
          uid,
          email,
          {
            ...command,
            operationId: randomUUID(),
            expectedVersion: prefs.version,
            selected: {
              orderEmail: true,
              promotionsEmail: false,
              orderSms: false,
            },
          },
          now + 200,
        );
        expect(
          (await db.doc(`users/${uid}`).get()).data()?.marketingConsent,
        ).toBe(false);
        expect(
          (await db.doc(`notificationPreferences/${uid}`).get()).data()?.topics
            .orderEmail.requested,
        ).toBe(true);
        // Reuse is idempotent and cannot restore a topic disabled after confirmation.
        expect(
          await applySubscriptionToken(
            db,
            token,
            "confirm",
            now + 300,
            identity,
          ),
        ).toEqual({ status: "already_processed" });
        expect(
          (await db.doc(`notificationPreferences/${uid}`).get()).data()?.topics
            .promotionsEmail.requested,
        ).toBe(false);
        const consentBefore = (
          await db.doc(`notificationPreferences/${uid}`).get()
        ).data();
        const baseJob = jobs.docs[0].data();
        const seed = async (overrides: Record<string, unknown> = {}) => {
          const ref = db.doc(`notificationEmailJobs/${randomUUID()}`);
          await ref.set({ ...baseJob, ...overrides });
          return ref;
        };
        for (const resolver of [
          async () => null,
          async () => ({ email, verified: false, disabled: false }),
          async () => {
            throw { code: "auth/user-not-found" };
          },
        ]) {
          const ref = await seed();
          expect(
            await deliverSubscriptionJob(
              db,
              "email",
              ref.id,
              "https://satsunicgo.web.app",
              now,
              sender,
              resolver,
            ),
          ).toBe("blocked_recipient");
          expect((await ref.get()).data()?.state).toBe("blocked_recipient");
        }
        const transient = await seed();
        expect(
          await deliverSubscriptionJob(
            db,
            "email",
            transient.id,
            "https://satsunicgo.web.app",
            now,
            sender,
            async () => {
              throw { code: "auth/internal-error" };
            },
          ),
        ).toBe("identity_unavailable");
        expect((await transient.get()).data()?.state).toBe("queued");
        const expired = await seed({ createdAt: now - 86400001 });
        expect(
          await deliverSubscriptionJob(
            db,
            "email",
            expired.id,
            "https://satsunicgo.web.app",
            now,
            sender,
            async () => {
              throw Error("Auth must not be called");
            },
          ),
        ).toBe("suppressed");
        expect((await expired.get()).data()?.state).toBe("expired");
        const malformed = await seed({ scopes: [] });
        expect(
          await deliverSubscriptionJob(
            db,
            "email",
            malformed.id,
            "https://satsunicgo.web.app",
            now,
            sender,
            identity,
          ),
        ).toBe("blocked_content");
        expect((await malformed.get()).data()?.state).toBe("blocked_content");
        const raced = await seed();
        expect(
          await deliverSubscriptionJob(
            db,
            "email",
            raced.id,
            "https://satsunicgo.web.app",
            now,
            sender,
            async () => {
              await raced.update({
                state: "accepted",
                claimId: "other-worker",
              });
              return null;
            },
          ),
        ).toBe("suppressed");
        expect((await raced.get()).data()?.state).toBe("accepted");
        expect(
          (await db.doc(`notificationPreferences/${uid}`).get()).data(),
        ).toEqual(consentBefore);
        expect(sent).toHaveLength(1);
      } finally {
        const owned = [
          "notificationEmailJobs",
          "notificationSmsJobs",
          "notificationChallenges",
          "notificationConsentEvents",
          "notificationPreferenceOperations",
        ];
        for (const name of owned) {
          const rows = await db
            .collection(name)
            .where("ownerId", "==", uid)
            .get();
          for (const row of rows.docs) await row.ref.delete();
        }
        await db.doc(`notificationPreferences/${uid}`).delete();
        await db.doc(`users/${uid}`).delete();
        await db
          .doc(
            `notificationRecipientQuotas/${subscriptionHash("owner:" + uid)}`,
          )
          .delete();
        await db
          .doc(
            `notificationRecipientQuotas/${subscriptionHash("email:" + email)}`,
          )
          .delete();
        await deleteApp(app);
      }
    }, 20000);
  },
);

describe.skipIf(!enabled)("subscription server-only security boundary", () => {
  test("owner, stranger and anonymous cannot directly read or mutate consent, jobs, tokens, operations or quotas", async () => {
    if (
      process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
      process.env.GCLOUD_PROJECT !== "demo-satsunicgo"
    )
      throw Error("DEMO_EMULATOR_REQUIRED");
    const { initializeTestEnvironment, assertFails } =
      await import("@firebase/rules-unit-testing");
    const { doc, getDoc, setDoc, deleteDoc } =
      await import("firebase/firestore");
    // Use deployed emulator rules; never upload rules or clear the shared database.
    const env = await initializeTestEnvironment({
      projectId: "demo-satsunicgo",
      firestore: { host: "127.0.0.1", port: 18207 },
    });
    const owner = `notification-rules-${randomUUID()}`;
    try {
      for (const context of [
        env.authenticatedContext(owner),
        env.authenticatedContext(`other-${owner}`),
        env.unauthenticatedContext(),
      ]) {
        for (const collection of [
          "notificationPreferences",
          "notificationEmailJobs",
          "notificationSmsJobs",
          "notificationChallenges",
          "notificationConsentEvents",
          "notificationPreferenceOperations",
          "notificationRecipientQuotas",
        ]) {
          const ref = doc(context.firestore(), collection, owner);
          await assertFails(getDoc(ref));
          await assertFails(
            setDoc(ref, {
              ownerId: owner,
              state: "accepted",
              topics: {
                promotionsEmail: { requested: true, confirmedGeneration: 1 },
              },
            }),
          );
          await assertFails(deleteDoc(ref));
        }
      }
    } finally {
      await env.cleanup();
    }
  }, 30000);
});
