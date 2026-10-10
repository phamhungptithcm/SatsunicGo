import { createHash, randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { askConversationSchema } from "../../../packages/domain/ask-workflow";
import {
  askFeedbackSchema,
  feedbackPolicySchema,
  feedbackReviewSchema,
} from "../../../packages/domain/ask-feedback";
import { approvedKnowledgeSchema } from "../../../packages/domain/ask-knowledge";
import {
  requireVerifiedGoogle,
  isStringRoleArray,
  recentMfa,
} from "../auth/guards";
import { knowledgeSource } from "./approved-knowledge";
import {
  productionTestEnvironment,
  admitProductionTestPolicy,
  productionTestProvenance,
} from "../production-test-policy";
import {
  feedbackExecution,
  testFeedbackRetention,
} from "./feedback-provenance";
const config = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 4,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
export const askFeedbackPolicy = onCall(config, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    db = getFirestore();
  if (!req.data || typeof req.data !== "object" || Object.keys(req.data).length)
    throw new HttpsError(
      "invalid-argument",
      "Thông tin kiểm tra góp ý chưa hợp lệ.",
    );
  return db.runTransaction(
    async (tx) => {
      const [user, access, settings, testSettings] = await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc("settings/askFeedback")),
        tx.get(db.doc("settings/productionTest")),
      ]);
      if (user.data()?.locked || access.data()?.locked)
        throw new HttpsError(
          "permission-denied",
          "Không thể gửi góp ý với tài khoản này.",
        );
      const policy = feedbackPolicySchema.safeParse(settings.data());
      if (
        !policy.success ||
        !policy.data.enabled ||
        policy.data.expiresAt <= Date.now()
      )
        throw new HttpsError("unavailable", "Góp ý hiện chưa sẵn sàng.");
      const testPolicy = productionTestEnvironment(db)
        ? admitProductionTestPolicy(testSettings.data(), uid, Date.now())
        : null;
      return testPolicy
        ? {
            ...policy.data,
            retentionDays: Math.min(
              policy.data.retentionDays,
              testFeedbackRetention.maxDays,
            ),
          }
        : policy.data;
    },
    { readOnly: true },
  );
});
export const feedbackHash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const askFeedback = onCall(config, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    parsed = askFeedbackSchema.safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError(
      "invalid-argument",
      "Chọn góp ý hợp lệ trước khi gửi.",
    );
  const input = parsed.data,
    db = getFirestore(),
    ref = db.doc(`askFeedback/${uid}-${input.operationId}`),
    testRunId = randomUUID();
  return db.runTransaction(async (tx) => {
    const now = Date.now(),
      quota = db.doc(`askFeedbackQuota/${uid}-${Math.floor(now / 86400000)}`);
    const [
      user,
      access,
      settings,
      conversation,
      previous,
      usage,
      testSettings,
    ] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(db.doc("settings/askFeedback")),
      tx.get(db.doc(`askConversations/${uid}-${input.conversationId}`)),
      tx.get(ref),
      tx.get(quota),
      tx.get(db.doc("settings/productionTest")),
    ]);
    if (user.data()?.locked || access.data()?.locked)
      throw new HttpsError(
        "permission-denied",
        "Không thể gửi góp ý với tài khoản này.",
      );
    const hash = feedbackHash(input);
    if (previous.exists) {
      if (previous.data()?.withdrawn === true)
        throw new HttpsError(
          "failed-precondition",
          "Góp ý này đã được rút lại.",
        );
      if (previous.data()?.hash !== hash)
        throw new HttpsError("already-exists", "Góp ý đã thay đổi.");
      const expiry = previous.data()?.expiresAt;
      if (typeof expiry?.toMillis !== "function" || expiry.toMillis() <= now)
        throw new HttpsError(
          "failed-precondition",
          "Góp ý đã hết thời gian lưu.",
        );
      return { id: input.operationId, version: 1 };
    }
    if (input.submittedAt < now - 300000 || input.submittedAt > now + 10000)
      throw new HttpsError(
        "failed-precondition",
        "Lượt gửi góp ý đã hết hạn. Mở lại câu trả lời để gửi góp ý mới.",
      );
    const policy = feedbackPolicySchema.safeParse(settings.data()),
      c = askConversationSchema.safeParse(conversation.data());
    if (!policy.success || !policy.data.enabled || policy.data.expiresAt <= now)
      throw new HttpsError("unavailable", "Góp ý hiện chưa sẵn sàng.");
    if (policy.data.version !== input.expectedPolicyVersion)
      throw new HttpsError(
        "failed-precondition",
        "Thời hạn góp ý đã thay đổi. Kiểm tra lại trước khi đồng ý gửi.",
      );
    if (
      !c.success ||
      c.data.ownerId !== uid ||
      c.data.version !== input.expectedVersion ||
      !c.data.turns.some(
        (turn) => feedbackHash(turn.answer) === input.answerHash,
      )
    )
      throw new HttpsError(
        "failed-precondition",
        "Hội thoại đã thay đổi. Mở lại câu trả lời trước khi góp ý.",
      );
    const count = usage.data()?.count ?? 0;
    if (!Number.isSafeInteger(count) || count < 0 || count >= 10)
      throw new HttpsError(
        "resource-exhausted",
        "Anh/chị thử gửi góp ý vào lần sau nhé.",
      );
    const testPolicy = productionTestEnvironment(db)
      ? admitProductionTestPolicy(testSettings.data(), uid, now)
      : null;
    const map = conversation.data()?.turnProvenance;
    let pinned;
    if (map && typeof map === "object" && !Array.isArray(map)) {
      for (const turn of c.data.turns.filter(
        (turn) => feedbackHash(turn.answer) === input.answerHash,
      )) {
        const saved = (map as Record<string, Record<string, unknown>>)[turn.id];
        if (!saved) continue;
        try {
          if (saved.answerHash !== input.answerHash)
            throw Error("FEEDBACK_TURN_CHANGED");
          pinned = feedbackExecution(saved);
        } catch {
          throw new HttpsError(
            "failed-precondition",
            "Hội thoại đã thay đổi. Mở lại câu trả lời trước khi góp ý.",
          );
        }
        if (pinned) break;
      }
    }
    const provenance =
      pinned ??
      (testPolicy
        ? {
            ...productionTestProvenance(testPolicy, testRunId),
            testMode: true as const,
            analyticsEligible: false as const,
          }
        : undefined);
    const retentionDays = provenance
      ? Math.min(policy.data.retentionDays, testFeedbackRetention.maxDays)
      : policy.data.retentionDays;
    // No question, answer, profile, address or free-text feedback is copied.
    tx.create(ref, {
      hash,
      category: input.category,
      conversationId: input.conversationId,
      answerHash: input.answerHash,
      version: 1,
      reviewVersion: 1,
      policyVersion: policy.data.version,
      consent: true,
      createdAt: now,
      expiresAt: new Date(now + retentionDays * 86400000),
      disposition: "unreviewed",
      ...(provenance ?? {}),
      ...(provenance
        ? { retentionDays, retentionClass: testFeedbackRetention.recordClass }
        : {}),
    });
    tx.set(quota, {
      count: count + 1,
      createdAt: now,
      retentionClass: testFeedbackRetention.quotaClass,
      expiresAt: new Date(now + 172800000),
    });
    return { id: input.operationId, version: 1 };
  });
});
export const askFeedbackReview = onCall(config, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    parsed = feedbackReviewSchema.safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError(
      "invalid-argument",
      "Thông tin xem xét góp ý chưa hợp lệ.",
    );
  const input = parsed.data,
    db = getFirestore(),
    ref = db.doc(`askFeedback/${input.ownerId}-${input.feedbackId}`),
    op = db.doc(`askFeedbackReviewOperations/${uid}-${input.operationId}`);
  return db.runTransaction(async (tx) => {
    const now = Date.now(),
      parts = input.source?.key.match(/^(posts|blogPublished)-(.+)$/);
    const [user, staff, current, previous, source, publication] =
      await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(ref),
        tx.get(op),
        input.source
          ? tx.get(db.doc(`askKnowledge/${input.source.key}`))
          : Promise.resolve(null),
        parts
          ? tx.get(db.doc(`${parts[1]}/${parts[2]}`))
          : Promise.resolve(null),
      ]);
    const access = staff.data();
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
        "Cần quyền quản trị và xác thực gần đây để xem xét góp ý.",
      );
    const hash = feedbackHash(input);
    if (previous.exists) {
      if (previous.data()?.hash !== hash)
        throw new HttpsError("already-exists", "Thao tác đã thay đổi.");
      return previous.data()!.result as { version: number };
    }
    const row = current.data(),
      expiry = row?.expiresAt;
    if (
      !row ||
      row.withdrawn === true ||
      row.consent !== true ||
      typeof expiry?.toMillis !== "function" ||
      expiry.toMillis() <= now
    )
      throw new HttpsError("not-found", "Góp ý hiện không còn khả dụng.");
    let provenance;
    try {
      provenance = feedbackExecution(row);
    } catch {
      throw new HttpsError(
        "failed-precondition",
        "Góp ý hiện không còn khả dụng.",
      );
    }
    if (
      row.reviewVersion !== input.expectedVersion ||
      !Number.isSafeInteger(row.reviewVersion) ||
      row.reviewVersion >= Number.MAX_SAFE_INTEGER
    )
      throw new HttpsError(
        "aborted",
        "Góp ý đã được xem xét. Tải lại trước khi tiếp tục.",
      );
    if (input.source) {
      const s = approvedKnowledgeSchema.safeParse(source?.data()),
        evidence = knowledgeSource(publication?.data());
      if (
        !s.success ||
        !s.data.active ||
        s.data.effectiveFrom > now ||
        s.data.effectiveTo <= now ||
        s.data.version !== input.source.version ||
        s.data.contentHash !== input.source.contentHash ||
        s.data.contentHash !== evidence?.hash ||
        s.data.source !== parts?.[1] ||
        s.data.sourceId !== parts?.[2]
      )
        throw new HttpsError(
          "failed-precondition",
          "Nguồn đã thay đổi hoặc chưa được duyệt.",
        );
    }
    const result = { version: row.reviewVersion + 1 };
    tx.update(ref, {
      reviewVersion: result.version,
      disposition: input.disposition,
      source: input.source ?? null,
      reviewedBy: uid,
      reviewedAt: now,
    });
    tx.create(op, {
      hash,
      result,
      expiresAt: expiry,
      ...(provenance
        ? {
            ...provenance,
            createdAt: now,
            retentionDays: row.retentionDays,
            retentionClass: testFeedbackRetention.operationClass,
          }
        : {}),
    });
    // Disposition records review only. It never edits knowledge, prompts or models.
    return result;
  });
});
