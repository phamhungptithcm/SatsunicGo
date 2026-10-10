import {
  customerEvent,
  customerEventFields,
} from "./customer-notification-events";
import { projectCustomerNotification } from "./customer-notification-delivery";
import {
  maintenanceDemoEnvironmentAllowed,
  releaseCapabilityAllowed,
} from "./provider-release-gate";
import { publishDueStudioPosts } from "./blog-studio";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { FieldPath, getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { requireVerifiedGoogle } from "./auth/guards";
export const maintenance = onSchedule(
  { schedule: "every 30 minutes", region: "asia-southeast1", maxInstances: 1 },
  async () => {
    if (!maintenanceDemoEnvironmentAllowed(process.env)) return;
    let db: ReturnType<typeof getFirestore>;
    try {
      db = getFirestore();
      if (
        !releaseCapabilityAllowed(
          "scheduledMaintenance",
          process.env,
          Reflect.get(db, "projectId"),
        )
      )
        return;
    } catch {
      return;
    }
    const now = Date.now();
    await publishDueStudioPosts(db, now);
    // Expired capabilities and minute quotas contain no financial records.
    for (const kind of ["salesDocumentShares", "invoiceShareQuotas"]) {
      const expired = await db
        .collection(kind)
        .where("expiresAt", "<=", now)
        .limit(30)
        .get();
      if (!expired.empty) {
        const batch = db.batch();
        expired.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    }
    for (const kind of ["products", "posts"]) {
      const rows = await db
        .collection(kind)
        .where("status", "==", "scheduled")
        .where("publishAt", "<=", now)
        .limit(20)
        .get();
      await Promise.all(
        rows.docs.map((d) =>
          db.runTransaction(async (tx) => {
            const current = await tx.get(d.ref);
            if (
              current.data()?.status !== "scheduled" ||
              current.data()?.publishAt > now
            )
              return;
            tx.create(d.ref.collection("versions").doc(), {
              ...current.data(),
              status: "published",
              changedAt: now,
              createdBy: "scheduled-job",
              version: (current.data()?.version ?? 0) + 1,
            });
            tx.update(d.ref, {
              status: "published",
              changedAt: now,
              version: (current.data()?.version ?? 0) + 1,
            });
            tx.create(db.collection("auditEvents").doc(), {
              actor: "scheduled-job",
              action: "publishScheduled",
              resourceId: d.id,
              createdAt: now,
            });
          }),
        ),
      );
    }
    const memberships = await db
      .collection("membershipSubscriptions")
      .where("state", "==", "active")
      .where("endsAt", "<=", now)
      .limit(30)
      .get();
    await Promise.all(
      memberships.docs.map((d) =>
        db.runTransaction(async (tx) => {
          const s = await tx.get(d.ref);
          if (s.data()?.endsAt > now || s.data()?.state !== "active") return;
          tx.update(d.ref, { state: "expired", changedAt: now });
          tx.create(d.ref.collection("history").doc(), {
            action: "expired",
            createdAt: now,
            actor: "scheduled-job",
            previousEndsAt: s.data()?.endsAt,
          });
          tx.create(db.collection("membershipHistory").doc(), {
            ownerId: d.id,
            action: "expired",
            createdAt: now,
            actor: "scheduled-job",
            endsAt: s.data()?.endsAt,
          });
          tx.create(
            db.doc(`outboxJobs/membership-expired-${d.id}-${s.data()?.endsAt}`),
            {
              ownerId: d.id,
              action: "membershipExpired",
              state: "queued",
              createdAt: now,
              ...customerEventFields(() =>
                customerEvent(
                  "membership_expired",
                  {
                    ownerId: d.id,
                    entityId: d.id,
                    entityVersion: s.data()!.endsAt,
                    occurredAt: now,
                  },
                  {
                    planName: s.data()!.planSnapshot?.name,
                    endsAt: s.data()!.endsAt,
                  },
                ),
              ),
            },
          );
          tx.create(db.collection("auditEvents").doc(), {
            actor: "scheduled-job",
            action: "expireMembership",
            resourceId: d.id,
            createdAt: now,
          });
        }),
      ),
    );
    // Lead time is operator policy, never an invented commercial default.
    const reminders = (
      await db.doc("settings/membershipReminders").get()
    ).data();
    if (
      reminders?.approved === true &&
      Number.isSafeInteger(reminders.daysBeforeExpiry) &&
      reminders.daysBeforeExpiry >= 1 &&
      reminders.daysBeforeExpiry <= 30
    ) {
      const deadline = now + reminders.daysBeforeExpiry * 86400000;
      const cursorRef = db.doc("maintenanceCursors/membershipReminders");
      const cursor = (await cursorRef.get()).data();
      let reminderQuery = db
        .collection("membershipSubscriptions")
        .where("state", "==", "active")
        .where("endsAt", ">", now)
        .where("endsAt", "<=", deadline)
        .orderBy("endsAt")
        .orderBy(FieldPath.documentId());
      if (
        cursor &&
        cursor?.daysBeforeExpiry === reminders.daysBeforeExpiry &&
        cursor?.policyVersion === (reminders.version ?? 0) &&
        Number.isSafeInteger(cursor.endsAt) &&
        typeof cursor.id === "string"
      )
        reminderQuery = reminderQuery.startAfter(cursor.endsAt, cursor.id);
      const upcoming = await reminderQuery.limit(30).get();
      await Promise.all(
        upcoming.docs.map((row) =>
          db.runTransaction(async (tx) => {
            const subscription = await tx.get(row.ref);
            const value = subscription.data();
            if (
              value?.state !== "active" ||
              !Number.isSafeInteger(value.endsAt) ||
              value.endsAt <= now ||
              value.endsAt > deadline
            )
              return;
            const ref = db.doc(
              `outboxJobs/membership-reminder-${row.id}-${value.endsAt}`,
            );
            const existing = await tx.get(ref);
            if (existing.exists) return;
            tx.create(ref, {
              ownerId: row.id,
              action: "membershipExpiring",
              state: "queued",
              createdAt: now,
              endsAt: value.endsAt,
              ...customerEventFields(() =>
                customerEvent(
                  "membership_expiring",
                  {
                    ownerId: row.id,
                    entityId: row.id,
                    entityVersion: value.endsAt,
                    occurredAt: now,
                  },
                  { planName: value.planSnapshot?.name, endsAt: value.endsAt },
                ),
              ),
            });
          }),
        ),
      );
      // Advance past already-notified active subscriptions instead of starving
      // later pages. Reset at the end so newly eligible earlier rows are revisited.
      const last = upcoming.docs.at(-1);
      await cursorRef.set({
        daysBeforeExpiry: reminders.daysBeforeExpiry,
        policyVersion: reminders.version ?? 0,
        endsAt: upcoming.size === 30 ? last!.data().endsAt : null,
        id: upcoming.size === 30 ? last!.id : null,
        changedAt: now,
      });
    }
    // No financial, customer or legal records are removed by technical cleanup.
    const retention = (await db.doc("settings/retention").get()).data();
    if (
      retention?.approved === true &&
      retention.technicalQuotaRetentionDays === 2 &&
      typeof retention.policyVersion === "string"
    ) {
      const expired = await db
        .collection("aiQuota")
        .where("expiresAt", "<=", now)
        .limit(50)
        .get();
      for (const row of expired.docs)
        await db.runTransaction(async (tx) => {
          const current = await tx.get(row.ref);
          if (current.data()?.expiresAt <= now) tx.delete(row.ref);
        });
    }
    const email = (await db.doc("settings/email").get()).data();
    const emailReady =
      email?.enabled === true &&
      typeof email.host === "string" &&
      typeof email.user === "string" &&
      typeof email.from === "string" &&
      typeof email.messageIdDomain === "string";
    if (emailReady) {
      const blocked = await db
        .collection("outboxJobs")
        .where("emailState", "==", "blocked_external")
        .limit(30)
        .get();
      await Promise.all(
        blocked.docs.map((row) =>
          db.runTransaction(async (tx) => {
            const current = await tx.get(row.ref);
            // Only configuration-blocked, never-claimed deliveries are safe to resume.
            if (
              current.data()?.emailState === "blocked_external" &&
              current.data()?.customerEvent &&
              (current.data()?.emailAttempts ?? 0) === 0 &&
              !current.data()?.claimedAt
            )
              tx.update(row.ref, { emailState: "queued" });
          }),
        ),
      );
    }
    const jobs = await db
      .collection("outboxJobs")
      .where("state", "==", "queued")
      .limit(30)
      .get();
    await Promise.all(
      jobs.docs.map(async (d) => {
        if (await projectCustomerNotification(db, d.id, now)) return;
        return db.runTransaction(async (tx) => {
          const job = await tx.get(d.ref);
          if (job.data()?.state !== "queued") return;
          if (
            [
              "claimPurchase",
              "pack",
              "confirmReceipt",
              "releaseHold",
              "packParcel",
              "batch-seal",
              "batch-dispatch",
            ].includes(job.data()?.action)
          ) {
            tx.update(d.ref, {
              state: "suppressed",
              emailState: "blocked_policy",
              suppressionReason: "internal_action",
            });
            return;
          }
          tx.create(db.doc(`notifications/${d.id}`), {
            ownerId: job.data()?.ownerId,
            orderId: job.data()?.orderId ?? null,
            action: job.data()?.action,
            resourceId: job.data()?.resourceId ?? null,
            endsAt: job.data()?.endsAt ?? null,
            createdAt: now,
            read: false,
          });
          tx.update(d.ref, {
            state: "inAppDelivered",
            deliveredAt: now,
            emailState: "blocked_policy",
          });
        });
      }),
    );
  },
);
export const readNotification = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    requireVerifiedGoogle(req.auth);
    if (
      !req.auth?.uid ||
      typeof req.data?.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,256}$/.test(req.data.id)
    )
      throw new HttpsError("invalid-argument", "Thông tin không hợp lệ.");
    const db = getFirestore();
    return db.runTransaction(async (tx) => {
      const ref = db.doc(`notifications/${req.data.id}`),
        s = await tx.get(ref),
        u = await tx.get(db.doc(`users/${req.auth!.uid}`));
      if (s.data()?.ownerId !== req.auth?.uid || u.data()?.locked)
        throw new HttpsError(
          "permission-denied",
          "Không thể truy cập thông báo.",
        );
      tx.update(ref, { read: true });
      return { ok: true };
    });
  },
);
