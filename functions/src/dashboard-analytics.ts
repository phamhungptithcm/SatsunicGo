import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import {
  DAY,
  WORKING_RETENTION,
  utcDay,
  safeSum,
  analyticsSnapshotSchema,
  type AnalyticsSnapshot,
} from "../../packages/domain/analytics";
import { requireVerifiedGoogle } from "./auth/guards";
const analyticsOptions = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 8,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};

const rangeSchema = z
  .object({
    from: z.number().int().positive(),
    until: z.number().int().positive(),
  })
  .strict();
const cache = new Map<string, { at: number; data: AnalyticsSnapshot }>();
export const dashboardAnalytics = onCall(analyticsOptions, async (req) => {
  requireVerifiedGoogle(req.auth);
  const p = rangeSchema.safeParse(req.data),
    now = Date.now();
  if (
    !req.auth ||
    !p.success ||
    p.data.until <= p.data.from ||
    p.data.until - p.data.from > 31 * DAY ||
    p.data.until > now + 60_000 ||
    p.data.from % DAY !== 0
  )
    throw new HttpsError(
      "invalid-argument",
      "Chọn khoảng thời gian tối đa 31 ngày theo UTC.",
    );
  const db = getFirestore(),
    { from, until } = p.data;
  return db.runTransaction(async (tx) => {
    const [access, user, policy, health] = await Promise.all([
      tx.get(db.doc(`staffAccess/${req.auth!.uid}`)),
      tx.get(db.doc(`users/${req.auth!.uid}`)),
      tx.get(db.doc("analyticsConfig/current")),
      tx.get(db.doc("analyticsHealth/current")),
    ]);
    const a = access.data(),
      roles = a?.roles;
    if (
      a?.active !== true ||
      a?.locked ||
      user.data()?.locked ||
      !Array.isArray(roles) ||
      !roles.every((r: unknown) => typeof r === "string") ||
      !roles.some((r) => ["OWNER", "OPERATIONS_MANAGER"].includes(r))
    )
      throw new HttpsError("permission-denied", "Cần quyền quản lý vận hành.");
    const finance = roles.includes("OWNER") || roles.includes("FINANCE");
    const key = `${from}:${until}:${finance}:${policy.data()?.enabled}:${policy.data()?.startedAt}`;
    const previous = cache.get(key);
    if (
      previous &&
      now - previous.at < 60_000 &&
      process.env.FUNCTIONS_EMULATOR !== "true"
    )
      return previous.data;
    const start = utcDay(from),
      end = utcDay(until);
    const inDays = (collection: string) =>
      db
        .collection(collection)
        .where("day", ">=", start)
        .where("day", "<=", end)
        .orderBy("day");
    const [days, dimensions, members, sessions, pending, dead] =
      await Promise.all([
        tx.get(inDays("analyticsDays").limit(497)),
        tx.get(inDays("analyticsDimensions").limit(3001)),
        tx.get(inDays("analyticsMembers").limit(3501)),
        tx.get(
          db
            .collection("analyticsSessions")
            .where("startedAt", ">=", from)
            .where("startedAt", "<=", until)
            .orderBy("startedAt")
            .limit(2501),
        ),
        tx.get(
          db
            .collection("analyticsJobs")
            .where("state", "==", "pending")
            .orderBy("createdAt")
            .limit(101),
        ),
        tx.get(
          db
            .collection("analyticsJobs")
            .where("state", "==", "dead")
            .limit(101),
        ),
      ]);
    const bounded =
      days.size < 497 &&
      dimensions.size < 3001 &&
      members.size < 3501 &&
      sessions.size < 2501 &&
      days.size + dimensions.size + members.size + sessions.size <= 10_000;
    const workingAvailable =
      from >= now - WORKING_RETENTION &&
      members.size < 3501 &&
      sessions.size < 2501;
    const dayMap = new Map<string, Record<string, number>>(),
      stages: Record<string, number> = {};
    for (let at = from; at <= until; at += DAY) dayMap.set(utcDay(at), {});
    for (const doc of days.docs) {
      const row = doc.data();
      const counts = dayMap.get(row.day);
      if (!counts || !row.counts) continue;
      for (const [k, v] of Object.entries(row.counts)) {
        if (!finance && ["payments", "refunds", "reversals"].includes(k))
          continue;
        if (typeof v !== "number" || v < 0 || !Number.isSafeInteger(v))
          throw new HttpsError("data-loss", "Dữ liệu thống kê cần kiểm tra.");
        counts[k] = safeSum([counts[k] ?? 0, v]);
        if (k.startsWith("stage_"))
          stages[k.slice(6)] = safeSum([stages[k.slice(6)] ?? 0, v]);
      }
    }
    const unknownPaidProducts = new Set<string>();
    const productMap = new Map<
        string,
        { id: string; views: number; clicks: number; paidOrders: number }
      >(),
      topicMap = new Map<
        string,
        { id: string; questions: number; sessions: number }
      >();
    if (dimensions.size < 3001)
      for (const doc of dimensions.docs) {
        const d = doc.data();
        if (d.kind === "product") {
          if (d.counts?.paidOrdersUnknown) unknownPaidProducts.add(d.entityId);
          const r = productMap.get(d.entityId) ?? {
            id: d.entityId,
            views: 0,
            clicks: 0,
            paidOrders: 0,
          };
          for (const k of ["views", "clicks", "paidOrders"] as const)
            r[k] = safeSum([r[k], d.counts?.[k] ?? 0]);
          productMap.set(r.id, r);
        } else if (d.kind === "topic") {
          const r = topicMap.get(d.entityId) ?? {
            id: d.entityId,
            questions: 0,
            sessions: 0,
          };
          r.questions = safeSum([r.questions, d.counts?.questions ?? 0]);
          topicMap.set(r.id, r);
        }
      }
    const uniques = (kind: string) =>
      new Set(
        members.docs
          .filter((d) => d.data().kind === kind)
          .map((d) => d.data().key),
      ).size;
    const topicSessions = new Map<string, Set<string>>();
    for (const doc of members.docs) {
      const m = doc.data();
      if (m.kind === "topic") {
        const set = topicSessions.get(m.topic) ?? new Set<string>();
        set.add(m.sessionId);
        topicSessions.set(m.topic, set);
      }
    }
    for (const [id, r] of topicMap)
      r.sessions = topicSessions.get(id)?.size ?? 0;
    const recorded = sessions.docs
      .map((d) => d.data())
      .filter((s) => s.aggregated);
    const enabled = policy.data()?.enabled === true,
      startedAt = policy.data()?.startedAt ?? 0;
    const available = workingAvailable && startedAt > 0 && until >= startedAt;
    const aggregateAvailable =
      days.size < 497 &&
      from >= now - 365 * DAY &&
      startedAt > 0 &&
      until >= startedAt;
    const productAvailable =
      dimensions.size < 3001 &&
      from >= now - 365 * DAY &&
      startedAt > 0 &&
      until >= startedAt;
    const topicAvailable =
      available && dimensions.size < 3001 && members.size < 3501;
    const topProducts =
      dimensions.size < 3001
        ? [...productMap.values()]
            .sort(
              (a, b) =>
                b.clicks - a.clicks ||
                b.views - a.views ||
                a.id.localeCompare(b.id),
            )
            .slice(0, 10)
        : [];
    const productSources = await Promise.all(
      topProducts.map((r) => tx.get(db.doc(`products/${r.id}`))),
    );
    const products = topProducts.map((r, i) => {
      const p = productSources[i].data();
      return {
        ...r,
        ...(unknownPaidProducts.has(r.id) ? { paidOrders: null } : {}),
        ...(typeof p?.title === "string"
          ? { title: p.title.slice(0, 160) }
          : {}),
        ...(p?.status === "published" &&
        typeof p.slug === "string" &&
        /^[a-zA-Z0-9-]{1,160}$/.test(p.slug)
          ? { slug: p.slug }
          : {}),
      };
    });
    const snap = analyticsSnapshotSchema.parse({
      version: 1,
      from,
      until,
      asOf: now,
      startedAt,
      enabled,
      finance,
      complete:
        enabled &&
        bounded &&
        available &&
        aggregateAvailable &&
        productAvailable &&
        unknownPaidProducts.size === 0 &&
        pending.empty &&
        dead.empty &&
        health.data()?.hasLoss !== true &&
        from >= startedAt,
      workingAvailable: available,
      availability: {
        traffic: aggregateAvailable,
        stages: aggregateAvailable,
        products: productAvailable,
        topics: topicAvailable,
        reason:
          !startedAt || until < startedAt
            ? "not_collected"
            : !bounded
              ? "read_limit"
              : from < now - WORKING_RETENTION
                ? "retention"
                : "ready",
      },
      days: aggregateAvailable
        ? [...dayMap].map(([day, counts]) => ({ day, counts }))
        : [],
      products: productAvailable ? products : [],
      topics: topicAvailable
        ? [...topicMap.values()]
            .filter((r) => r.sessions >= 5)
            .sort(
              (a, b) => b.questions - a.questions || a.id.localeCompare(b.id),
            )
            .slice(0, 10)
        : [],
      stages: aggregateAvailable ? stages : {},
      sessions: available ? recorded.length : null,
      browsers: available ? uniques("browser") : null,
      accounts: available ? uniques("account") : null,
      buyers: available ? uniques("buyer") : null,
      convertedSessions: available
        ? recorded.filter((s) => s.convertedOrders > 0).length
        : null,
      productSessions: available
        ? recorded.filter((s) => s.productViewed).length
        : null,
      convertedProductSessions: available
        ? recorded.filter((s) => s.productViewed && s.convertedOrders > 0)
            .length
        : null,
      paidOrders: available ? uniques("paidOrder") : null,
      linkedPaidOrders: available
        ? new Set(
            members.docs
              .filter((d) => d.data().kind === "paidOrder" && d.data().linked)
              .map((d) => d.data().key),
          ).size
        : null,
      provisional: until > now - 7 * DAY,
      backlog: pending.size,
      deadLetters: dead.size,
      oldestPendingAt: pending.docs[0]?.data().createdAt ?? 0,
      lastWorkerAt: health.data()?.lastWorkerAt ?? 0,
    });
    // Authorization is always reread before cache use; money cache is role-segregated.
    if (cache.size >= 32) cache.delete(cache.keys().next().value!);
    cache.set(key, { at: now, data: snap });
    return snap;
  });
});
