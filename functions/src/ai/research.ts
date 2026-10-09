import { createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  productQuery,
  candidateScore,
} from "../../../packages/domain/ask-language-query";
import {
  requireVerifiedGoogle,
  isStringRoleArray,
  recentMfa,
} from "../auth/guards";
import {
  researchCommandSchema,
  researchPolicySchema,
  researchOfferInputSchema,
  researchOfferSchema,
  researchSearchSchema,
  researchSearchResultSchema,
  researchSelectSchema,
  researchSelectResultSchema,
  researchMerchant,
  researchDraft,
} from "../../../packages/domain/ask-research";

const config = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 4,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/gu, "d")
    .toLowerCase()
    .trim();
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
function policy(value: unknown, now: number) {
  const p = researchPolicySchema.safeParse(value);
  if (!p.success || !p.data.enabled || p.data.expiresAt <= now)
    throw new HttpsError("unavailable", "Nguồn tham khảo hiện chưa sẵn sàng.");
  return p.data;
}
export function currentResearchOffer(
  value: unknown,
  id: string,
  p: ReturnType<typeof policy>,
  now: number,
) {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>,
    parsed = researchOfferInputSchema.safeParse(row.offer);
  if (
    !parsed.success ||
    row.active !== true ||
    row.policyVersion !== p.version ||
    parsed.data.observedAt > now ||
    parsed.data.expiresAt <= now ||
    !researchMerchant(
      parsed.data.url,
      parsed.data.market,
      parsed.data.sellerId,
      p,
    )
  )
    return null;
  const result = researchOfferSchema.safeParse({
    ...parsed.data,
    id,
    version: row.version,
    contentHash: row.contentHash,
    policyVersion: row.policyVersion,
  });
  return result.success && digest(parsed.data) === result.data.contentHash
    ? result.data
    : null;
}
export const askResearchCommand = onCall(config, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    c = researchCommandSchema.safeParse(req.data);
  if (!c.success)
    throw new HttpsError(
      "invalid-argument",
      "Thông tin nguồn tham khảo chưa hợp lệ.",
    );
  const db = getFirestore(),
    command = c.data,
    now = Date.now(),
    ref = db.doc(`askResearchOffers/${command.id}`),
    op = db.doc(`askResearchOperations/${uid}-${command.operationId}`);
  return db.runTransaction(async (tx) => {
    const [user, staff, settings, current, previous] = await Promise.all([
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(db.doc("settings/askResearch")),
      tx.get(ref),
      tx.get(op),
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
    const hash = digest(command);
    if (previous.exists) {
      if (previous.data()?.hash !== hash)
        throw new HttpsError("already-exists", "Thao tác đã thay đổi.");
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
      const p = policy(settings.data(), now),
        offer = command.offer;
      if (
        offer.observedAt > now ||
        offer.expiresAt <= now ||
        !researchMerchant(offer.url, offer.market, offer.sellerId, p)
      )
        throw new HttpsError(
          "failed-precondition",
          "Nguồn bán hoặc thời điểm kiểm tra chưa hợp lệ.",
        );
      const row = {
        offer,
        active: true,
        version: version + 1,
        contentHash: digest(offer),
        policyVersion: p.version,
        reviewedBy: uid,
        reviewedAt: now,
      };
      tx.set(ref, row);
      tx.create(ref.collection("revisions").doc(String(version + 1)), row);
    } else {
      if (!current.exists)
        throw new HttpsError("not-found", "Chưa có nguồn để thu hồi.");
      tx.update(ref, { active: false, version: version + 1 });
      tx.create(ref.collection("revisions").doc(String(version + 1)), {
        active: false,
        version: version + 1,
        reviewedBy: uid,
        reviewedAt: now,
      });
    }
    const result = { version: version + 1 };
    tx.create(op, { hash, result, createdAt: now });
    return result;
  });
});

export const askResearchSearch = onCall(config, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    input = researchSearchSchema.safeParse(req.data);
  if (!input.success)
    throw new HttpsError(
      "invalid-argument",
      "Nhập sản phẩm và thị trường cần tìm.",
    );
  const db = getFirestore(),
    now = Date.now();
  const terms = productQuery(input.data.query).terms.filter((term) =>
    /[\p{L}\p{N}]/u.test(term),
  );
  if (!terms.length)
    throw new HttpsError("invalid-argument", "Nhập tên sản phẩm cần tìm.");
  return db.runTransaction(async (tx) => {
    const quota = db.doc(`askResearchQuota/${uid}-${Math.floor(now / 60000)}`);
    const [settings, user, access, usage] = await Promise.all([
      tx.get(db.doc("settings/askResearch")),
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(quota),
    ]);
    if (user.data()?.locked || access.data()?.locked)
      throw new HttpsError(
        "permission-denied",
        "Không thể tra cứu với tài khoản này.",
      );
    const p = policy(settings.data(), Date.now()),
      count = quotaCount(usage.data()?.count, 4),
      globalQuota = db.doc(
        `askResearchQuota/global-${p.version}-${Math.floor(now / 86400000)}`,
      ),
      total = quotaCount((await tx.get(globalQuota)).data()?.count, 50),
      snapshots = await tx.get(db.collection("askResearchOffers").limit(101));
    const results = snapshots.docs.slice(0, 100).flatMap((doc) => {
      const offer = currentResearchOffer(doc.data(), doc.id, p, Date.now());
      const score =
        offer && offer.market === input.data.market
          ? candidateScore(input.data.query, {
              title: offer.title,
              body: offer.variant,
            })
          : 0;
      return offer && score > 0 ? [{ offer, score }] : [];
    });
    tx.set(quota, { count: count + 1, expiresAt: new Date(now + 120000) });
    tx.set(globalQuota, {
      count: total + 1,
      expiresAt: new Date(now + 172800000),
    });
    return researchSearchResultSchema.parse({
      offers: results
        .sort(
          (a, b) =>
            b.score - a.score ||
            b.offer.observedAt - a.offer.observedAt ||
            a.offer.id.localeCompare(b.offer.id),
        )
        .slice(0, 5)
        .map((row) => row.offer),
      scanned: Math.min(snapshots.size, 100),
      limited: snapshots.size > 100,
      observedAt: now,
    });
  });
});
export const askResearchSelect = onCall(config, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    input = researchSelectSchema.safeParse(req.data);
  if (!input.success)
    throw new HttpsError("invalid-argument", "Chọn lại sản phẩm và số lượng.");
  const db = getFirestore(),
    now = Date.now();
  const outcome = await db.runTransaction(async (tx) => {
    const quota = db.doc(`askResearchQuota/${uid}-${Math.floor(now / 60000)}`);
    const [settings, user, access, usage] = await Promise.all([
      tx.get(db.doc("settings/askResearch")),
      tx.get(db.doc(`users/${uid}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(quota),
    ]);
    if (user.data()?.locked || access.data()?.locked)
      throw new HttpsError(
        "permission-denied",
        "Không thể chuẩn bị yêu cầu với tài khoản này.",
      );
    const p = policy(settings.data(), Date.now()),
      count = quotaCount(usage.data()?.count, 4),
      globalQuota = db.doc(
        `askResearchQuota/global-${p.version}-${Math.floor(now / 86400000)}`,
      ),
      total = quotaCount((await tx.get(globalQuota)).data()?.count, 50),
      record = await tx.get(db.doc(`askResearchOffers/${input.data.id}`)),
      offer = currentResearchOffer(record.data(), record.id, p, Date.now());
    if (
      !offer ||
      offer.version !== input.data.version ||
      offer.contentHash !== input.data.contentHash
    )
      throw new HttpsError(
        "failed-precondition",
        "Thông tin đã thay đổi. Tìm lại trước khi chọn.",
      );
    const catalog = await tx.get(
      db
        .collection("products")
        .where("status", "==", "published")
        .select("title")
        .limit(4097),
    );
    // Charge every admitted catalog scan, including rejected duplicates or
    // incomplete coverage; throwing inside the transaction would refund them.
    tx.set(quota, { count: count + 1, expiresAt: new Date(now + 120000) });
    tx.set(globalQuota, {
      count: total + 1,
      expiresAt: new Date(now + 172800000),
    });
    if (catalog.size > 4096)
      return {
        error:
          "Chưa kiểm tra đủ danh mục. Anh/chị xem lại sản phẩm trước khi soạn yêu cầu.",
      };
    if (
      catalog.docs.some((doc) => {
        const title = doc.data().title;
        return (
          typeof title === "string" &&
          title.trim().length >= 2 &&
          (fold(offer.title).includes(fold(title)) ||
            fold(title).includes(fold(offer.title)))
        );
      })
    )
      return {
        error:
          "Sản phẩm đã có trong danh mục. Anh/chị xem và chọn mua từ trang sản phẩm.",
      };
    return {
      result: researchSelectResultSchema.parse({
        offer,
        draft: researchDraft(offer, input.data.quantity),
      }),
    };
  });
  if (outcome.error) throw new HttpsError("failed-precondition", outcome.error);
  return outcome.result!;
});
