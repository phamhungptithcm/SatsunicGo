import { createHash, randomUUID } from "node:crypto";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import {
  sessionSchema,
  ingestSchema,
  linkSchema,
  DAY,
  SESSION_IDLE,
  WORKING_RETENTION,
  utcDay,
} from "../../packages/domain/analytics";
import { requireVerifiedGoogle } from "./auth/guards";
import {
  admitProductionTestPolicy,
  productionTestEnvironment,
} from "./production-test-policy";
import { isPurchaseTestRecord } from "./purchase-test-boundary";

export const analyticsOptions = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 8,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const expiry = (at: number, days: number) =>
  Timestamp.fromMillis(at + days * DAY);
function identity(
  auth: Parameters<typeof requireVerifiedGoogle>[0],
): string | null {
  if (!auth) return null;
  requireVerifiedGoogle(auth);
  return digest(`account:${auth.uid}`);
}
export async function enabledPolicy(
  tx: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
) {
  const policy = (await tx.get(db.doc("analyticsConfig/current"))).data();
  if (
    policy?.enabled !== true ||
    !Number.isSafeInteger(policy.startedAt) ||
    policy.startedAt <= 0
  )
    throw new HttpsError(
      "failed-precondition",
      "Thống kê truy cập chưa được bật.",
    );
  return policy;
}
/** Exclude admitted test customers as well as existing internal staff traffic. */
async function requireExternalAnalytics(
  tx: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  uid: string | undefined,
  now: number,
) {
  if (!uid || !productionTestEnvironment(db)) return;
  const policy = (await tx.get(db.doc("settings/productionTest"))).data();
  if (admitProductionTestPolicy(policy, uid, now))
    throw new HttpsError(
      "permission-denied",
      "Không ghi nhận truy cập nội bộ.",
    );
}
export function validSession(
  data: FirebaseFirestore.DocumentData | undefined,
  subject: string | null,
  now: number,
) {
  if (
    !data ||
    data.revoked ||
    data.closed ||
    data.subject !== subject ||
    now - data.lastSeenAt > SESSION_IDLE ||
    now < data.startedAt ||
    now > data.startedAt + WORKING_RETENTION
  )
    throw new HttpsError("failed-precondition", "Phiên thống kê đã kết thúc.");
}
export async function resolveAnalyticsSession(
  tx: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  token: string,
  now: number,
) {
  const cap = (
    await tx.get(db.doc(`analyticsCapabilities/${digest(token)}`))
  ).data();
  if (
    !cap ||
    !(cap.expireAt instanceof Timestamp) ||
    cap.expireAt.toMillis() <= now
  )
    throw new HttpsError("failed-precondition", "Phiên thống kê đã kết thúc.");
  return db.doc(`analyticsSessions/${cap.sessionId}`);
}
export const analyticsSession = onCall(analyticsOptions, async (req) => {
  const p = sessionSchema.safeParse(req.data);
  if (!p.success)
    throw new HttpsError(
      "invalid-argument",
      "Thông tin thống kê không hợp lệ.",
    );
  const subject = identity(req.auth),
    db = getFirestore();
  const token = randomUUID(),
    newSessionId = randomUUID();
  // Retry aliases point to one logical session. Persist only a capability hash, never the token.
  const receipt = db.doc(
    `analyticsSessionRequests/${digest(`${p.data.browserId}:${subject}:${p.data.requestId}`)}`,
  );
  return db.runTransaction(async (tx) => {
    // A retry can observe a session committed by a later concurrent request.
    // Use this attempt's time for eligibility and the matching UTC quota day.
    const now = Date.now();
    const quota = db.doc(
      `analyticsSubjects/${utcDay(now)}-${digest(p.data.browserId)}`,
    );
    await enabledPolicy(tx, db);
    await requireExternalAnalytics(tx, db, req.auth?.uid, now);
    const accountQuota = subject
      ? db.doc(`analyticsSubjects/${utcDay(now)}-${subject}`)
      : null;
    const [old, q, aq, profile, staff] = await Promise.all([
      tx.get(receipt),
      tx.get(quota),
      accountQuota ? tx.get(accountQuota) : null,
      req.auth ? tx.get(db.doc(`users/${req.auth.uid}`)) : null,
      req.auth ? tx.get(db.doc(`staffAccess/${req.auth.uid}`)) : null,
    ]);
    if (
      profile?.data()?.locked ||
      staff?.data()?.locked ||
      staff?.data()?.active === true
    )
      throw new HttpsError(
        "permission-denied",
        "Không ghi nhận truy cập nội bộ.",
      );
    if (old.exists) {
      const prior = (
        await tx.get(db.doc(`analyticsSessions/${old.data()!.sessionId}`))
      ).data();
      // The initial read can also wait behind a newer committed request.
      validSession(prior, subject, Date.now());
      if (old.data()!.aliases >= 8)
        throw new HttpsError(
          "resource-exhausted",
          "Đã đạt giới hạn phiên thống kê.",
        );
      tx.create(db.doc(`analyticsCapabilities/${digest(token)}`), {
        sessionId: old.data()!.sessionId,
        expireAt: expiry(prior!.startedAt, 45),
      });
      tx.update(receipt, { aliases: old.data()!.aliases + 1 });
      return { session: token, startedAt: prior!.startedAt };
    }
    const ref = db.doc(`analyticsSessions/${newSessionId}`);
    if ((q.data()?.sessions ?? 0) >= 96 || (aq?.data()?.sessions ?? 0) >= 192)
      throw new HttpsError("resource-exhausted", "Đã đạt giới hạn thống kê.");
    const session = {
      subject,
      browser: digest(p.data.browserId),
      startedAt: now,
      lastSeenAt: now,
      events: 0,
      revoked: false,
      convertedOrders: 0,
      productViewed: false,
      expireAt: expiry(now, 45),
    };
    tx.create(ref, session);
    tx.create(receipt, {
      sessionId: ref.id,
      aliases: 1,
      startedAt: now,
      expireAt: expiry(now, 1),
    });
    tx.create(db.doc(`analyticsCapabilities/${digest(token)}`), {
      sessionId: ref.id,
      expireAt: expiry(now, 45),
    });
    tx.set(
      quota,
      { sessions: (q.data()?.sessions ?? 0) + 1, expireAt: expiry(now, 2) },
      { merge: true },
    );
    if (accountQuota)
      tx.set(
        accountQuota,
        { sessions: (aq?.data()?.sessions ?? 0) + 1, expireAt: expiry(now, 2) },
        { merge: true },
      );
    tx.create(db.doc(`analyticsJobs/session-${ref.id}`), {
      type: "session",
      source: ref.id,
      state: "pending",
      createdAt: now,
    });
    return { session: token, startedAt: now };
  });
});
export const analyticsIngest = onCall(analyticsOptions, async (req) => {
  if (Buffer.byteLength(JSON.stringify(req.data ?? {})) > 65536)
    throw new HttpsError("invalid-argument", "Gói thống kê quá lớn.");
  const p = ingestSchema.safeParse(req.data);
  if (!p.success)
    throw new HttpsError(
      "invalid-argument",
      "Thông tin thống kê không hợp lệ.",
    );
  const subject = identity(req.auth),
    db = getFirestore(),
    now = Date.now();
  if (
    new Set(p.data.events.map((e) => e.id)).size !== p.data.events.length ||
    p.data.events.some((e) => e.at > now + 60_000 || e.at < now - DAY)
  )
    throw new HttpsError(
      "invalid-argument",
      "Thời điểm thống kê không hợp lệ.",
    );
  return db.runTransaction(async (tx) => {
    await enabledPolicy(tx, db);
    await requireExternalAnalytics(tx, db, req.auth?.uid, now);
    const sref = await resolveAnalyticsSession(tx, db, p.data.session, now);
    const session = await tx.get(sref);
    validSession(session.data(), subject, now);
    const accountQuota = subject
      ? db.doc(`analyticsSubjects/${utcDay(now)}-${subject}`)
      : null;
    const [aq, profile, staff] = await Promise.all([
      accountQuota ? tx.get(accountQuota) : null,
      req.auth ? tx.get(db.doc(`users/${req.auth.uid}`)) : null,
      req.auth ? tx.get(db.doc(`staffAccess/${req.auth.uid}`)) : null,
    ]);
    if (
      profile?.data()?.locked ||
      staff?.data()?.locked ||
      staff?.data()?.active === true
    )
      throw new HttpsError(
        "permission-denied",
        "Không ghi nhận truy cập nội bộ.",
      );

    const receipts = await Promise.all(
      p.data.events.map((e) =>
        tx.get(db.doc(`analyticsEvents/${digest(`${sref.id}:${e.id}`)}`)),
      ),
    );
    const productIds = [
      ...new Set(
        p.data.events.flatMap((e) => ("productId" in e ? [e.productId] : [])),
      ),
    ];
    const products = await Promise.all(
      productIds.map((id) => tx.get(db.doc(`products/${id}`))),
    );
    if (
      products.some(
        (s) =>
          !s.exists ||
          s.data()?.status !== "published" ||
          (s.data()?.publishAt ?? 0) > now,
      )
    )
      throw new HttpsError("invalid-argument", "Sản phẩm không khả dụng.");
    const fresh = p.data.events.filter((_, i) => !receipts[i].exists);
    if (
      (session.data()!.events ?? 0) + fresh.length > 240 ||
      (aq?.data()?.events ?? 0) + fresh.length > 2400
    )
      throw new HttpsError(
        "resource-exhausted",
        "Đã đạt giới hạn phiên thống kê.",
      );
    for (const e of fresh) {
      const id = digest(`${sref.id}:${e.id}`);
      tx.create(db.doc(`analyticsEvents/${id}`), {
        event: e,
        sessionId: sref.id,
        receivedAt: now,
        expireAt: expiry(now, 7),
      });
      tx.create(db.doc(`analyticsJobs/event-${id}`), {
        type: "event",
        source: id,
        state: "pending",
        createdAt: now,
      });
    }
    if (accountQuota)
      tx.set(
        accountQuota,
        {
          events: (aq?.data()?.events ?? 0) + fresh.length,
          expireAt: expiry(now, 2),
        },
        { merge: true },
      );
    tx.update(sref, {
      events: session.data()!.events + fresh.length,
      lastSeenAt: now,
    });
    return { accepted: fresh.length };
  });
});
export const analyticsLinkOrder = onCall(analyticsOptions, async (req) => {
  requireVerifiedGoogle(req.auth);
  const p = linkSchema.safeParse(req.data);
  if (!p.success || !req.auth)
    throw new HttpsError(
      "invalid-argument",
      "Thông tin thống kê không hợp lệ.",
    );
  const db = getFirestore(),
    now = Date.now(),
    subject = identity(req.auth);
  return db.runTransaction(async (tx) => {
    await enabledPolicy(tx, db);
    const sessionRef = await resolveAnalyticsSession(
        tx,
        db,
        p.data.session,
        now,
      ),
      sid = sessionRef.id;
    const [s, order, previous] = await Promise.all([
      tx.get(sessionRef),
      tx.get(db.doc(`orders/${p.data.orderId}`)),
      tx.get(db.doc(`analyticsAttributions/${p.data.orderId}`)),
    ]);
    const data = s.data();
    if (
      !data ||
      data.subject !== subject ||
      data.revoked ||
      now - data.startedAt > WORKING_RETENTION ||
      order.data()?.ownerId !== req.auth!.uid ||
      isPurchaseTestRecord(order.data()) ||
      order.data()?.createdAt < data.startedAt ||
      order.data()?.createdAt > data.startedAt + 7 * DAY
    )
      throw new HttpsError(
        "permission-denied",
        "Không thể liên kết phiên thống kê.",
      );
    if (previous.exists) return { linked: previous.data()?.sessionId === sid };
    tx.create(db.doc(`analyticsAttributions/${p.data.orderId}`), {
      sessionId: sid,
      subject,
      createdAt: now,
      eligible: false,
      expireAt: expiry(now, 45),
    });
    tx.create(db.doc(`analyticsJobs/link-${p.data.orderId}`), {
      type: "order",
      source: p.data.orderId,
      state: "pending",
      createdAt: now,
    });
    return { linked: true };
  });
});
export const analyticsWithdraw = onCall(analyticsOptions, async (req) => {
  const p = z
    .object({
      session: z.string().uuid(),
      reason: z.enum(["withdraw", "account_change"]).default("withdraw"),
    })
    .strict()
    .safeParse(req.data);
  if (!p.success)
    throw new HttpsError(
      "invalid-argument",
      "Thông tin thống kê không hợp lệ.",
    );
  const db = getFirestore();
  await db.runTransaction(async (tx) => {
    const ref = await resolveAnalyticsSession(
      tx,
      db,
      p.data.session,
      Date.now(),
    );
    const s = await tx.get(ref);
    if (s.exists)
      tx.update(
        ref,
        p.data.reason === "withdraw"
          ? { closed: true, revoked: true }
          : { closed: true },
      );
  });
  return { stopped: true };
});
