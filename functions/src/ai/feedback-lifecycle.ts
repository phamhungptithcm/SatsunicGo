import { getFirestore, type DocumentSnapshot } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  feedbackWithdrawalSchema,
  feedbackInboxSchema,
  feedbackEvaluationResultSchema,
} from "../../../packages/domain/ask-feedback";
import { activeKnowledge } from "../../../packages/domain/ask-knowledge";
import { knowledgeSource } from "./approved-knowledge";
import { evaluateRetrievalHoldout } from "./feedback-evaluation";
import {
  feedbackExecution,
  feedbackCleanupEligible,
  testFeedbackRetention,
} from "./feedback-provenance";
import { z } from "zod";
import {
  requireVerifiedGoogle,
  isStringRoleArray,
  recentMfa,
} from "../auth/guards";
const config = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 4,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
export const askFeedbackWithdraw = onCall(config, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    parsed = feedbackWithdrawalSchema.safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Chọn góp ý cần rút lại.");
  const db = getFirestore(),
    ref = db.doc(`askFeedback/${uid}-${parsed.data.feedbackId}`);
  await db.runTransaction(async (tx) => {
    const now = Date.now(),
      quota = db.doc(
        `askFeedbackQuota/withdraw-${uid}-${Math.floor(now / 86400000)}`,
      );
    const [user, access, previous, usage] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(ref),
      tx.get(quota),
    ]);
    if (user.data()?.locked || access.data()?.locked)
      throw new HttpsError(
        "permission-denied",
        "Không thể rút góp ý với tài khoản này.",
      );
    if (previous.data()?.withdrawn === true) return;
    const count = usage.data()?.count ?? 0;
    if (!Number.isSafeInteger(count) || count < 0 || count >= 20)
      throw new HttpsError("resource-exhausted", "Anh/chị thử lại sau nhé.");
    const expiry = previous.data()?.expiresAt;
    // Same ref fences an in-flight create. A missing record keeps only a short
    // tombstone; submittedAt admission prevents recreation after its expiry.
    const expiresAt = new Date(
      typeof expiry?.toMillis === "function" && expiry.toMillis() > now
        ? Math.min(expiry.toMillis(), now + 90 * 86400000)
        : now + 310001,
    );
    let provenance;
    try {
      provenance = feedbackExecution(previous.data() ?? {});
    } catch {
      provenance = undefined;
    }
    tx.set(ref, {
      withdrawn: true,
      expiresAt,
      ...(provenance
        ? {
            ...provenance,
            createdAt: now,
            retentionDays: testFeedbackRetention.maxDays,
            retentionClass: testFeedbackRetention.recordClass,
          }
        : {}),
    });
    tx.set(quota, {
      count: count + 1,
      createdAt: now,
      retentionClass: testFeedbackRetention.quotaClass,
      expiresAt: new Date(now + 172800000),
    });
  });
  return { id: parsed.data.feedbackId, withdrawn: true as const };
});
export function inboxRow(
  doc: Pick<DocumentSnapshot, "id" | "data">,
  now: number,
) {
  const match = doc.id.match(/^([A-Za-z0-9_-]{1,128})-([a-f0-9-]{36})$/i),
    row = doc.data();
  if (
    !match ||
    row?.withdrawn ||
    row?.consent !== true ||
    typeof row.expiresAt?.toMillis !== "function" ||
    row.expiresAt.toMillis() <= now
  )
    return null;
  let provenance;
  try {
    provenance = feedbackExecution(row);
  } catch {
    return null;
  }
  const parsed = feedbackInboxSchema.shape.rows.element.safeParse({
    ownerId: match[1],
    feedbackId: match[2],
    category: row.category,
    reviewVersion: row.reviewVersion,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt.toMillis(),
    disposition: row.disposition,
    ...(provenance ? { testMode: true } : {}),
  });
  return parsed.success ? parsed.data : null;
}
export const askFeedbackInbox = onCall(config, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    db = getFirestore();
  if (!req.data || typeof req.data !== "object" || Object.keys(req.data).length)
    throw new HttpsError(
      "invalid-argument",
      "Thông tin xem góp ý chưa hợp lệ.",
    );
  return db.runTransaction(async (tx) => {
    const [user, staff] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
    ]);
    const access = staff.data(),
      now = Date.now();
    if (
      user.data()?.locked ||
      access?.locked ||
      access?.active !== true ||
      !isStringRoleArray(access.roles) ||
      !access.roles.includes("OWNER") ||
      !recentMfa(req.auth!.token, now)
    )
      throw new HttpsError(
        "permission-denied",
        "Cần quyền quản trị và xác thực gần đây để xem góp ý.",
      );
    const records = await tx.get(
      db.collection("askFeedback").orderBy("expiresAt", "desc").limit(51),
    );
    return feedbackInboxSchema.parse({
      rows: records.docs.slice(0, 50).flatMap((doc) => {
        const row = inboxRow(doc, now);
        return row ? [row] : [];
      }),
      limited: records.size > 50,
    });
  });
});
export const askFeedbackEvaluation = onCall(config, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    input = z
      .object({ language: z.enum(["vi", "en"]) })
      .strict()
      .safeParse(req.data),
    db = getFirestore();
  if (!input.success)
    throw new HttpsError("invalid-argument", "Chọn ngôn ngữ cần kiểm tra.");
  return db.runTransaction(
    async (tx) => {
      const [user, staff, holdout, approvals] = await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc(`settings/askKnowledgeHoldout-${input.data.language}`)),
        tx.get(
          db.collection("askKnowledge").where("active", "==", true).limit(21),
        ),
      ]);
      const access = staff.data(),
        now = Date.now();
      if (
        user.data()?.locked ||
        access?.locked ||
        access?.active !== true ||
        !isStringRoleArray(access.roles) ||
        !access.roles.includes("OWNER") ||
        !recentMfa(req.auth!.token, now)
      )
        throw new HttpsError(
          "permission-denied",
          "Cần quyền quản trị và xác thực gần đây để kiểm tra hướng dẫn.",
        );
      if (approvals.size > 20)
        throw new HttpsError(
          "unavailable",
          "Chưa kiểm tra được toàn bộ nguồn trong giới hạn lượt này.",
        );
      const rows = approvals.docs.flatMap((doc) => {
        const a = activeKnowledge(doc.data(), input.data.language, now);
        return a && doc.id === `${a.source}-${a.sourceId}` ? [a] : [];
      });
      const sources = await Promise.all(
        rows.map((a) => tx.get(db.doc(`${a.source}/${a.sourceId}`))),
      );
      const documents = rows.flatMap((a, index) => {
        const source = knowledgeSource(sources[index].data());
        return source &&
          activeKnowledge(a, input.data.language, Date.now()) &&
          source.hash === a.contentHash
          ? [source.document]
          : [];
      });
      try {
        return feedbackEvaluationResultSchema.parse(
          evaluateRetrievalHoldout(documents, holdout.data(), Date.now()),
        );
      } catch {
        throw new HttpsError(
          "unavailable",
          "Chưa có bộ câu hỏi kiểm chứng đã duyệt và còn hạn cho ngôn ngữ này.",
        );
      }
    },
    { readOnly: true },
  );
});
/** Bounded deletion uses update-time preconditions, so a changed record is never deleted from an old read. */
export async function purgeExpiredFeedback(now = Date.now()) {
  if (!Number.isSafeInteger(now) || now <= 0) throw Error("INVALID_PURGE_TIME");
  const db = getFirestore();
  let deleted = 0;
  for (const [collection, recordClass] of [
    ["askFeedback", testFeedbackRetention.recordClass],
    ["askFeedbackReviewOperations", testFeedbackRetention.operationClass],
    ["askFeedbackQuota", testFeedbackRetention.quotaClass],
  ]) {
    const records = await db
      .collection(collection)
      .where("retentionClass", "==", recordClass)
      .where("expiresAt", "<=", new Date(now))
      .limit(100)
      .get();
    if (!records.size) continue;
    const batch = db.batch();
    let count = 0;
    for (const doc of records.docs) {
      if (!feedbackCleanupEligible(collection, doc.data(), now)) continue;
      batch.delete(doc.ref, { lastUpdateTime: doc.updateTime! });
      count++;
    }
    if (!count) continue;
    await batch.commit();
    deleted += count;
  }
  return { deleted };
}
// Only explicitly stamped production-test/short operational classes are deleted.
export const askFeedbackCleanup = onSchedule(
  {
    schedule: "every 60 minutes",
    region: "asia-southeast1",
    maxInstances: 1,
    retryCount: 0,
  },
  async () => {
    await purgeExpiredFeedback();
  },
);
