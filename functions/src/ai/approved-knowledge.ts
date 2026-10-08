import { createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  activeKnowledge,
  knowledgeCommandSchema,
  knowledgePreviewSchema,
  knowledgePreviewResultSchema,
} from "../../../packages/domain/ask-knowledge";
import { askAnswerSchema } from "../../../packages/domain/ask-stream";
import { knowledgeBody } from "../../../packages/domain/ask-knowledge-body";
import {
  isStringRoleArray,
  recentMfa,
  requireVerifiedGoogle,
} from "../auth/guards";
import { publishedKnowledge, retrieveKnowledge } from "./knowledge-retrieval";

/** Hash precisely the public evidence; no private records or inferred approval. */
export function knowledgeSource(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  let body: unknown;
  try {
    body =
      typeof row.body === "string"
        ? row.body
        : row.body && typeof row.body === "object"
          ? knowledgeBody(row.body)
          : row.content;
  } catch {
    return null;
  }
  if (typeof body !== "string" || body.length > 20_000) return null;
  const document = publishedKnowledge({ ...row, body });
  return document
    ? {
        document,
        hash: createHash("sha256")
          .update(JSON.stringify(document))
          .digest("hex"),
      }
    : null;
}

export const askKnowledgePreview = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 4,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    const uid = requireVerifiedGoogle(req.auth),
      parsed = knowledgePreviewSchema.safeParse(req.data);
    if (!parsed.success)
      throw new HttpsError(
        "invalid-argument",
        "Chọn bài viết hợp lệ để kiểm tra.",
      );
    const { source, sourceId } = parsed.data,
      db = getFirestore();
    return db.runTransaction(async (tx) => {
      const [user, staff, publication, approval] = await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc(`${source}/${sourceId}`)),
        tx.get(db.doc(`askKnowledge/${source}-${sourceId}`)),
      ]);
      const access = staff.data();
      if (
        user.data()?.locked ||
        access?.locked ||
        access?.active !== true ||
        !isStringRoleArray(access.roles) ||
        !access.roles.includes("OWNER") ||
        !recentMfa(req.auth!.token, Date.now())
      )
        throw new HttpsError(
          "permission-denied",
          "Cần quyền quản trị và xác thực gần đây để duyệt nguồn.",
        );
      const evidence = knowledgeSource(publication.data());
      const liveApproval =
        activeKnowledge(approval.data(), "vi", Date.now()) ??
        activeKnowledge(approval.data(), "en", Date.now());
      if (!approval.exists && !evidence)
        throw new HttpsError(
          "not-found",
          "Chưa tìm được bài viết đã xuất bản.",
        );
      return knowledgePreviewResultSchema.parse({
        source,
        sourceId,
        title: evidence?.document.title ?? "Nguồn hiện không khả dụng",
        body: evidence?.document.body ?? "",
        published: !!evidence,
        contentHash: evidence?.hash ?? null,
        version: approval.data()?.version ?? 0,
        active: !!evidence && liveApproval?.contentHash === evidence.hash,
        approved: approval.data()?.active === true,
      });
    });
  },
);

export const askKnowledgeCommand = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 4,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    const uid = requireVerifiedGoogle(req.auth);
    const parsed = knowledgeCommandSchema.safeParse(req.data);
    if (!parsed.success)
      throw new HttpsError(
        "invalid-argument",
        "Thông tin duyệt nguồn chưa hợp lệ.",
      );
    const command = parsed.data,
      db = getFirestore(),
      now = Date.now();
    const key = `${command.source}-${command.sourceId}`;
    const ref = db.doc(`askKnowledge/${key}`),
      op = db.doc(`askKnowledgeOperations/${uid}-${command.operationId}`);
    const hash = createHash("sha256")
      .update(JSON.stringify(command))
      .digest("hex");
    return db.runTransaction(async (tx) => {
      const [user, staff, previous, current, source] = await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(op),
        tx.get(ref),
        tx.get(db.doc(`${command.source}/${command.sourceId}`)),
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
          "Cần quyền quản trị và xác thực gần đây để duyệt nguồn.",
        );
      if (previous.exists) {
        if (previous.data()?.hash !== hash)
          throw new HttpsError(
            "already-exists",
            "Thao tác duyệt nguồn đã thay đổi.",
          );
        return previous.data()!.result as { version: number };
      }
      const version = current.data()?.version ?? 0;
      if (
        !Number.isSafeInteger(version) ||
        version !== command.expectedVersion ||
        version >= Number.MAX_SAFE_INTEGER
      )
        throw new HttpsError(
          "aborted",
          "Nguồn đã thay đổi. Tải lại trước khi duyệt.",
        );
      if (command.action === "approve") {
        const evidence = knowledgeSource(source.data());
        if (
          !evidence ||
          evidence.hash !== command.contentHash ||
          command.effectiveTo <= now
        )
          throw new HttpsError(
            "failed-precondition",
            "Nguồn chưa xuất bản, đã thay đổi hoặc thời hạn không hợp lệ.",
          );
        const revision = {
          schemaVersion: 1,
          source: command.source,
          sourceId: command.sourceId,
          version: version + 1,
          active: true,
          language: command.language,
          effectiveFrom: command.effectiveFrom,
          effectiveTo: command.effectiveTo,
          contentHash: evidence.hash,
          reviewedBy: uid,
          reviewedAt: now,
        };
        tx.set(ref, revision);
        tx.create(ref.collection("revisions").doc(String(version + 1)), {
          ...revision,
          document: evidence.document,
        });
      } else {
        if (!current.exists)
          throw new HttpsError(
            "failed-precondition",
            "Không có nguồn đã duyệt để thu hồi.",
          );
        tx.update(ref, {
          active: false,
          version: version + 1,
          reviewedBy: uid,
          reviewedAt: now,
        });
        tx.create(ref.collection("revisions").doc(String(version + 1)), {
          action: "revoke",
          version: version + 1,
          reviewedBy: uid,
          reviewedAt: now,
        });
      }
      const result = { version: version + 1 };
      tx.create(op, {
        hash,
        result,
        action: command.action,
        sourceKey: key,
        createdAt: now,
      });
      return result;
    });
  },
);

/** Public quoted evidence path, not a generated or exhaustive policy answer. */
export async function approvedKnowledgeAnswer(
  uid: string,
  input: {
    question: string;
    language: "vi" | "en";
    images: unknown[];
    orderId?: string;
    conversationId?: string;
  },
  signal?: AbortSignal,
) {
  if (input.images.length || input.orderId) return null;
  signal?.throwIfAborted();
  const db = getFirestore(),
    now = Date.now();
  const candidates = await db
    .collection("askKnowledge")
    .where("active", "==", true)
    .limit(21)
    .get();
  if (candidates.empty) return null;
  const approvals = candidates.docs.slice(0, 20).flatMap((doc) => {
    const row = activeKnowledge(doc.data(), input.language, now);
    return row ? [{ key: doc.id, row }] : [];
  });
  if (!approvals.length) return null;
  // A coherent transaction rechecks approval, source and identity. No public cache.
  const documents = await db.runTransaction(async (tx) => {
    const quota = db.doc(`askKnowledgeQuota/${uid}-${Math.floor(now / 60000)}`);
    const globalQuota = db.doc(
      `askKnowledgeQuota/global-${Math.floor(now / 86400000)}`,
    );
    const [user, access, conversation, usage, globalUsage] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      input.conversationId
        ? tx.get(db.doc(`askConversations/${uid}-${input.conversationId}`))
        : Promise.resolve(null),
      tx.get(quota),
      tx.get(globalQuota),
    ]);
    if (
      user.data()?.locked ||
      access.data()?.locked ||
      (conversation?.exists && conversation.data()?.ownerId !== uid)
    )
      throw new HttpsError(
        "permission-denied",
        "Không thể dùng tư vấn với tài khoản này.",
      );
    const count = usage.data()?.count ?? 0;
    const globalCount = globalUsage.data()?.count ?? 0;
    if (
      !Number.isSafeInteger(count) ||
      count < 0 ||
      count >= 4 ||
      !Number.isSafeInteger(globalCount) ||
      globalCount < 0 ||
      globalCount >= 500
    )
      throw new HttpsError(
        "resource-exhausted",
        "Anh/chị thử lại sau một chút nhé.",
      );
    const snapshots = await Promise.all(
      approvals.flatMap(({ key, row }) => [
        tx.get(db.doc(`askKnowledge/${key}`)),
        tx.get(db.doc(`${row.source}/${row.sourceId}`)),
      ]),
    );
    const valid = approvals.flatMap(({ row }, i) => {
      const approval = activeKnowledge(
        snapshots[i * 2].data(),
        input.language,
        Date.now(),
      );
      const evidence = knowledgeSource(snapshots[i * 2 + 1].data());
      return approval &&
        evidence &&
        approval.version === row.version &&
        approval.source === row.source &&
        approval.sourceId === row.sourceId &&
        approval.contentHash === evidence.hash
        ? [evidence.document]
        : [];
    });
    tx.set(quota, { count: count + 1, expiresAt: new Date(now + 120000) });
    tx.set(globalQuota, {
      count: globalCount + 1,
      expiresAt: new Date(now + 172800000),
    });
    return valid;
  });
  signal?.throwIfAborted();
  const excerpts = retrieveKnowledge(documents, input.question, 4);
  if (!excerpts.length) return null;
  return askAnswerSchema.parse({
    language: input.language,
    title:
      input.language === "vi"
        ? "Thông tin từ hướng dẫn SatsunicGo"
        : "From SatsunicGo's published guidance",
    paragraphs: [
      input.language === "vi"
        ? "Em tìm được các đoạn hướng dẫn dưới đây. Đây là trích dẫn từ nguồn đã duyệt; chưa phải báo giá hay xác nhận cho đơn hàng của anh/chị."
        : "These are excerpts from reviewed guidance, not a quotation or confirmation for your order.",
      ...excerpts.map((row) => `${row.title}\n${row.text}`),
    ],
    bullets: [],
    sourceIds: [...new Set(excerpts.map((row) => row.id))],
    action: "workflow",
  });
}
