import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
export const maintenance = onSchedule(
  { schedule: "every 30 minutes", region: "asia-southeast1", maxInstances: 1 },
  async () => {
    const db = getFirestore(),
      now = Date.now();
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
        }),
      ),
    );
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
    const jobs = await db
      .collection("outboxJobs")
      .where("state", "==", "queued")
      .limit(30)
      .get();
    await Promise.all(
      jobs.docs.map((d) =>
        db.runTransaction(async (tx) => {
          const job = await tx.get(d.ref);
          if (job.data()?.state !== "queued") return;
          tx.create(db.doc(`notifications/${d.id}`), {
            ownerId: job.data()?.ownerId,
            orderId: job.data()?.orderId,
            action: job.data()?.action,
            createdAt: now,
            read: false,
          });
          tx.update(d.ref, {
            state: "inAppDelivered",
            deliveredAt: now,
            emailState: emailReady ? "queued" : "blocked_external",
          });
        }),
      ),
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
    if (
      !req.auth?.uid ||
      typeof req.data?.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(req.data.id)
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
