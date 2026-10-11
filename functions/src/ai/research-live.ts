import { createHash, randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { requireVerifiedGoogle } from "../auth/guards";
import {
  askConversationSchema,
  redactChat,
} from "../../../packages/domain/ask-workflow";
import {
  candidateScore,
  productQuery,
} from "../../../packages/domain/ask-language-query";
import {
  researchPolicySchema,
  researchMerchant,
} from "../../../packages/domain/ask-research";
import {
  webDiscoveryInputSchema,
  webDiscoveryResultSchema,
  webSelectInputSchema,
  webSelectResultSchema,
  webReferenceDraft,
} from "../../../packages/domain/ask-web";
import { geminiResearch, researchReservation } from "./research-gemini";
import { vertexResearchTransport } from "./research-transport";
import { admitSharedAskReservation, askCostPolicy } from "./ask-cost-policy";
import {
  productionTestEnvironment,
  admitProductionTestPolicy,
  productionTestProvenance,
} from "../production-test-policy";

const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const quotaCount = (value: unknown, limit: number) => {
  const count = value ?? 0;
  if (
    !Number.isSafeInteger(count) ||
    Number(count) < 0 ||
    Number(count) >= limit
  )
    throw new HttpsError(
      "resource-exhausted",
      "Anh/chị thử lại sau một chút nhé.",
    );
  return Number(count);
};

export const discoveryPolicySchema = z
  .object({
    enabled: z.literal(true),
    version: z.number().int().positive().safe(),
    termsReviewed: z.literal(true),
    expiresAt: z.number().int().positive().safe(),
    merchantPolicyVersion: z.number().int().positive().safe(),
    budgetImportHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
/** Existing lifetime ledger must include the prior local reservations. Never initialize it here. */
export function discoveryLedgerAdmission(
  ledger: unknown,
  importHash: string,
  now: number,
  minimumImportedReservedVnd = 50000,
) {
  const parsed = z
    .object({
      maxBudgetVnd: z.literal(50000),
      reservedVnd: z.number().int().nonnegative().safe(),
      importedReservedVnd: z.number().int().nonnegative().max(50000),
      importHash: z.literal(importHash),
    })
    .passthrough()
    .parse(ledger);
  if (
    parsed.importedReservedVnd < minimumImportedReservedVnd ||
    parsed.reservedVnd < parsed.importedReservedVnd
  )
    throw Error("RESEARCH_BUDGET_UNAVAILABLE");
  return researchReservation(parsed.reservedVnd, now);
}
function assertCatalogScope(collection: string) {
  if (
    collection !== "products" &&
    !(
      process.env.GCLOUD_PROJECT === "demo-satsunicgo" &&
      process.env.FUNCTIONS_EMULATOR === "true" &&
      /^qa-askweb-[a-f0-9-]{36}$/.test(collection)
    )
  )
    throw new HttpsError("permission-denied", "Catalogue test scope denied");
}
export async function runWebDiscovery(
  uid: string,
  value: unknown,
  transport = vertexResearchTransport(),
  signal = AbortSignal.timeout(45000),
  catalogCollection = "products",
) {
  assertCatalogScope(catalogCollection);
  const input = webDiscoveryInputSchema.parse(value),
    db = getFirestore(),
    testRunId = randomUUID();
  if (
    redactChat(input.query) !== input.query ||
    /https?:\/\/|[\r\n]/i.test(input.query) ||
    !productQuery(input.query).terms.length ||
    productQuery(input.query).requiresInterpretation ||
    /gửi về|giao tới|ship to|phone|sđt|sdt|recipient|người nhận|password|mật khẩu/i.test(
      input.query,
    )
  )
    throw new HttpsError(
      "invalid-argument",
      "Chỉ gửi tên sản phẩm và thị trường để tìm web.",
    );
  const queryHash = digest({ query: input.query, market: input.market });
  const key = digest({ uid, conversationId: input.conversationId, queryHash });
  const ref = db.doc(`askWebDiscovery/${key}`),
    budget = db.doc("askResearchBudget/lifetime");
  const admission = await db.runTransaction(async (tx) => {
    const now = Date.now();
    const [
      user,
      access,
      conversation,
      settings,
      merchants,
      ledger,
      pilot,
      prior,
      testSettings,
    ] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(db.doc(`askConversations/${uid}-${input.conversationId}`)),
      tx.get(db.doc("settings/askWebDiscovery")),
      tx.get(db.doc("settings/askResearch")),
      tx.get(budget),
      tx.get(db.doc("aiPilotBudget/lifetime")),
      tx.get(ref),
      tx.get(db.doc("settings/productionTest")),
    ]);
    const c = askConversationSchema.safeParse(conversation.data()),
      policy = discoveryPolicySchema.safeParse(settings.data()),
      p = researchPolicySchema.safeParse(merchants.data());
    if (user.data()?.locked || access.data()?.locked)
      throw new HttpsError(
        "permission-denied",
        "Không thể tìm web với tài khoản này.",
      );
    const testPolicy = productionTestEnvironment(db)
      ? admitProductionTestPolicy(testSettings.data(), uid, now)
      : null;
    if (process.env.GCLOUD_PROJECT === "satsunicgo" && !testPolicy)
      throw new HttpsError("unavailable", "Tìm web hiện chưa sẵn sàng.");
    if (
      !c.success ||
      c.data.ownerId !== uid ||
      c.data.version !== input.expectedVersion ||
      c.data.pendingOperation
    )
      throw new HttpsError(
        "failed-precondition",
        "Hội thoại đã thay đổi. Mở lại trước khi tìm web.",
      );
    if (
      !policy.success ||
      policy.data.expiresAt <= now ||
      !p.success ||
      !p.data.enabled ||
      p.data.expiresAt <= now ||
      p.data.version !== policy.data.merchantPolicyVersion
    )
      throw new HttpsError("unavailable", "Tìm web hiện chưa sẵn sàng.");
    if (prior.exists) {
      const row = prior.data()!;
      const result = webDiscoveryResultSchema.safeParse(row.result);
      if (
        row.state !== "answered" ||
        !result.success ||
        result.data.expiresAt <= now ||
        row.policyHash !== digest([policy.data, p.data])
      )
        throw new HttpsError(
          "unavailable",
          "Lượt tìm này chưa có kết quả xác nhận. Không gửi thêm lượt có tính phí.",
        );
      return {
        result: { ...result.data, expectedVersion: input.expectedVersion },
        policy: p.data,
        policyHash: row.policyHash as string,
      };
    }
    let reservedVnd: number;
    try {
      reservedVnd = discoveryLedgerAdmission(
        ledger.data(),
        policy.data.budgetImportHash,
        now,
        process.env.GCLOUD_PROJECT === "demo-satsunicgo" &&
          process.env.FUNCTIONS_EMULATOR === "true"
          ? 0
          : 50000,
      );
      admitSharedAskReservation(pilot.data(), ledger.data(), 25000, now);
    } catch {
      throw new HttpsError(
        "resource-exhausted",
        "Ngân sách tìm web chưa sẵn sàng hoặc đã được giữ hết.",
      );
    }
    const quota = db.doc(`askWebQuota/${uid}-${Math.floor(now / 60000)}`),
      globalQuota = db.doc(
        `askWebQuota/global-${policy.data.version}-${Math.floor(now / 86400000)}`,
      );
    const [usage, total] = await Promise.all([
      tx.get(quota),
      tx.get(globalQuota),
    ]);
    const count = quotaCount(usage.data()?.count, 4),
      globalCount = quotaCount(total.data()?.count, 50);
    // Charge even rejected scans. A failed/partial scan is never catalogue absence.
    const catalog = await tx.get(
      db
        .collection(catalogCollection)
        .where("status", "==", "published")
        .select("title")
        .limit(4097),
    );
    tx.set(quota, { count: count + 1, expiresAt: new Date(now + 120000) });
    tx.set(globalQuota, {
      count: globalCount + 1,
      expiresAt: new Date(now + 172800000),
    });
    if (
      catalog.size > 4096 ||
      catalog.docs.some(
        (doc) =>
          typeof doc.data().title !== "string" || doc.data().title.length > 160,
      )
    )
      return {
        error: "Chưa kiểm tra hết sản phẩm đã niêm yết để tìm web.",
        result: null,
        policy: p.data,
        policyHash: "",
      };
    if (
      catalog.docs.some(
        (doc) =>
          candidateScore(input.query, { title: doc.data().title as string }) >
          0,
      )
    )
      return {
        error:
          "Sản phẩm có trong danh mục. Anh/chị chọn sản phẩm đã niêm yết nhé.",
        result: null,
        policy: p.data,
        policyHash: "",
      };
    const policyHash = digest([policy.data, p.data]);
    tx.update(budget, { reservedVnd, updatedAt: now });
    tx.create(ref, {
      ownerId: uid,
      conversationId: input.conversationId,
      expectedVersion: input.expectedVersion,
      queryHash,
      policyHash,
      state: "reserved",
      reserveVnd: 25000,
      costPolicyId: askCostPolicy.id,
      ...(testPolicy ? productionTestProvenance(testPolicy, testRunId) : {}),
      createdAt: now,
      expiresAt: new Date(now + 600000),
    });
    return {
      result: null,
      policy: p.data,
      policyHash,
      testPolicyVersion: testPolicy?.version,
    };
  });
  if (admission.error)
    throw new HttpsError("failed-precondition", admission.error);
  if (admission.result) return admission.result;
  // Durable reservation already exists. A failed/unknown dispatch is never retried or refunded.
  const discovery = await geminiResearch(
    { query: input.query, market: input.market },
    admission.policy,
    async () => {
      signal.throwIfAborted();
    },
    transport.send,
    signal,
    transport.redirect,
    async () => {
      if (process.env.GCLOUD_PROJECT !== "satsunicgo") return;
      const current = productionTestEnvironment(db)
        ? admitProductionTestPolicy(
            (await db.doc("settings/productionTest").get()).data(),
            uid,
          )
        : null;
      if (!current || current.version !== admission.testPolicyVersion)
        throw Error("RESEARCH_UNAVAILABLE");
    },
  );
  const now = Date.now(),
    result = webDiscoveryResultSchema.parse({
      conversationId: input.conversationId,
      expectedVersion: input.expectedVersion,
      market: input.market,
      queryHash,
      discoveryId: key,
      observedAt: now,
      expiresAt: Math.min(now + 600000, admission.policy.expiresAt),
      candidates: discovery.candidates,
      suggestionsHtml: discovery.suggestionsHtml,
    });
  await db.runTransaction(async (tx) => {
    const [user, access, c, p, settings, prior, testSettings] =
      await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc(`askConversations/${uid}-${input.conversationId}`)),
        tx.get(db.doc("settings/askResearch")),
        tx.get(db.doc("settings/askWebDiscovery")),
        tx.get(ref),
        tx.get(db.doc("settings/productionTest")),
      ]);
    const conversation = askConversationSchema.safeParse(c.data()),
      policy = researchPolicySchema.safeParse(p.data()),
      approved = discoveryPolicySchema.safeParse(settings.data());
    const testPolicy = productionTestEnvironment(db)
      ? admitProductionTestPolicy(testSettings.data(), uid)
      : null;
    if (
      user.data()?.locked ||
      access.data()?.locked ||
      !conversation.success ||
      conversation.data.ownerId !== uid ||
      conversation.data.version !== input.expectedVersion ||
      conversation.data.pendingOperation ||
      !policy.success ||
      !policy.data.enabled ||
      policy.data.expiresAt <= Date.now() ||
      !approved.success ||
      approved.data.expiresAt <= Date.now() ||
      digest([approved.data, policy.data]) !== admission.policyHash ||
      prior.data()?.state !== "reserved" ||
      (process.env.GCLOUD_PROJECT === "satsunicgo" &&
        (!testPolicy || testPolicy.version !== admission.testPolicyVersion)) ||
      result.candidates.some(
        (candidate) =>
          !researchMerchant(
            candidate.url,
            input.market,
            "first-party",
            policy.data,
          ),
      )
    )
      throw new HttpsError(
        "failed-precondition",
        "Thông tin đã thay đổi trong lúc tìm web. Kết quả chưa được dùng.",
      );
    tx.update(ref, {
      state: "answered",
      result,
      usage: discovery.usage,
      model: discovery.model,
    });
  });
  return result;
}
export const askWebDiscovery = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 4,
    timeoutSeconds: 60,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    const uid = requireVerifiedGoogle(req.auth);
    try {
      return await runWebDiscovery(uid, req.data);
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      if (error instanceof z.ZodError)
        throw new HttpsError(
          "invalid-argument",
          "Thông tin tìm web chưa hợp lệ.",
        );
      throw new HttpsError(
        "unavailable",
        "Chưa xác nhận được kết quả tìm web. Ngân sách đã giữ sẽ không tự dùng lại.",
      );
    }
  },
);
export async function runWebSelect(
  uid: string,
  value: unknown,
  catalogCollection = "products",
) {
  assertCatalogScope(catalogCollection);
  const parsed = webSelectInputSchema.safeParse(value);
  if (
    !parsed.success ||
    redactChat(parsed.data.variant) !== parsed.data.variant
  )
    throw new HttpsError(
      "invalid-argument",
      "Kiểm tra mẫu và số lượng trước khi điền bản nháp.",
    );
  const input = parsed.data,
    db = getFirestore();
  const outcome = await db.runTransaction(async (tx) => {
    const [user, access, conversation, saved, settings, merchants] =
      await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc(`askConversations/${uid}-${input.conversationId}`)),
        tx.get(db.doc(`askWebDiscovery/${input.discoveryId}`)),
        tx.get(db.doc("settings/askWebDiscovery")),
        tx.get(db.doc("settings/askResearch")),
      ]);
    const c = askConversationSchema.safeParse(conversation.data()),
      result = webDiscoveryResultSchema.safeParse(saved.data()?.result),
      policy = discoveryPolicySchema.safeParse(settings.data()),
      p = researchPolicySchema.safeParse(merchants.data()),
      now = Date.now();
    if (
      user.data()?.locked ||
      access.data()?.locked ||
      saved.data()?.ownerId !== uid
    )
      throw new HttpsError("permission-denied", "Không thể chọn nguồn này.");
    if (
      !c.success ||
      c.data.ownerId !== uid ||
      c.data.version !== input.expectedVersion ||
      c.data.pendingOperation ||
      c.data.orderId ||
      c.data.draft?.items?.length ||
      !result.success ||
      result.data.conversationId !== input.conversationId ||
      result.data.expiresAt <= now ||
      !policy.success ||
      policy.data.expiresAt <= now ||
      !p.success ||
      !p.data.enabled ||
      p.data.expiresAt <= now ||
      saved.data()?.policyHash !== digest([policy.data, p.data])
    )
      throw new HttpsError(
        "failed-precondition",
        "Thông tin đã thay đổi. Mở lại hội thoại trước khi chọn nguồn.",
      );
    const candidate = result.data.candidates[input.index];
    if (
      !candidate ||
      !researchMerchant(
        candidate.url,
        result.data.market,
        "first-party",
        p.data,
      )
    )
      throw new HttpsError(
        "failed-precondition",
        "Nguồn hiện không còn khả dụng.",
      );
    const quota = db.doc(`askWebQuota/${uid}-${Math.floor(now / 60000)}`),
      globalQuota = db.doc(
        `askWebQuota/global-${policy.data.version}-${Math.floor(now / 86400000)}`,
      );
    const [usage, total] = await Promise.all([
      tx.get(quota),
      tx.get(globalQuota),
    ]);
    const count = quotaCount(usage.data()?.count, 4),
      globalCount = quotaCount(total.data()?.count, 50);
    const catalog = await tx.get(
      db
        .collection(catalogCollection)
        .where("status", "==", "published")
        .select("title")
        .limit(4097),
    );
    tx.set(quota, { count: count + 1, expiresAt: new Date(now + 120000) });
    tx.set(globalQuota, {
      count: globalCount + 1,
      expiresAt: new Date(now + 172800000),
    });
    if (
      catalog.size > 4096 ||
      catalog.docs.some(
        (doc) =>
          typeof doc.data().title !== "string" ||
          doc.data().title.length > 160 ||
          candidateScore(candidate.title, {
            title: doc.data().title as string,
          }) > 0,
      )
    )
      return {
        error: "Cần kiểm tra lại danh mục trước khi soạn yêu cầu mua hộ.",
      };
    return {
      result: webSelectResultSchema.parse({
        draft: webReferenceDraft(
          result.data,
          input.index,
          input.quantity,
          input.variant,
        ),
      }),
    };
  });
  if (outcome.error) throw new HttpsError("failed-precondition", outcome.error);
  return outcome.result!;
}
export const askWebSelect = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 4,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => runWebSelect(requireVerifiedGoogle(req.auth), req.data),
);
