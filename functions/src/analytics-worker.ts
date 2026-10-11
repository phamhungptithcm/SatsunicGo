import { isPurchaseTestRecord } from "./purchase-test-boundary";
import { getFirestore } from "firebase-admin/firestore";
import {
  onDocumentCreated,
  onDocumentWritten,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  analyticsEventSchema,
  firstCatalogPaidAt,
  conversionEligible,
  DAY,
  utcDay,
} from "../../packages/domain/analytics";
import { catalogPayable, stageLabels, type Order } from "../../packages/domain";
import { digest, expiry } from "./analytics-ingest";

const triggerOptions = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 8,
  retry: true,
};
const validAt = (at: unknown, now: number): at is number =>
  typeof at === "number" &&
  Number.isSafeInteger(at) &&
  at > now - 365 * DAY &&
  at <= now + 60_000;
const refId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(value);
function shard(source: string) {
  return parseInt(digest(source).slice(0, 4), 16) % 16;
}
/** Only immutable source IDs enter jobs; no financial payload from a client. */
export async function enqueueAnalytics(
  type: "order" | "ledger",
  source: string,
  revision: string,
) {
  const db = getFirestore();
  if ((await db.doc("analyticsConfig/current").get()).data()?.enabled !== true)
    return;
  const sourceRecord = (
    await db
      .doc(`${type === "order" ? "orders" : "financialEntries"}/${source}`)
      .get()
  ).data();
  if (isPurchaseTestRecord(sourceRecord)) return;
  if (
    type === "ledger" &&
    refId(sourceRecord?.orderId) &&
    isPurchaseTestRecord(
      (await db.doc(`orders/${sourceRecord.orderId}`).get()).data(),
    )
  )
    return;
  const now = Date.now();
  try {
    await db
      .doc(`analyticsJobs/${type}-${digest(`${source}:${revision}`)}`)
      .create({
        type,
        source,
        state: "pending",
        createdAt: now,
      });
  } catch (e) {
    if ((e as { code?: number }).code !== 6) throw e;
  }
}
export const analyticsOrderChanged = onDocumentWritten(
  { ...triggerOptions, document: "orders/{id}" },
  async (e) => {
    if (e.data?.after.exists && !isPurchaseTestRecord(e.data.after.data()))
      await enqueueAnalytics(
        "order",
        e.params.id,
        String(e.data.after.data()?.version ?? e.id),
      );
  },
);
export const analyticsPaymentCreated = onDocumentCreated(
  { ...triggerOptions, document: "financialEntries/{id}" },
  async (e) => {
    if (e.data?.exists && !isPurchaseTestRecord(e.data.data()))
      await enqueueAnalytics("ledger", e.params.id, e.params.id);
  },
);

export async function processAnalyticsJob(jobId: string, now = Date.now()) {
  const db = getFirestore(),
    jobRef = db.doc(`analyticsJobs/${jobId}`);
  return db.runTransaction(async (tx) => {
    const [jobSnap, policy] = await Promise.all([
      tx.get(jobRef),
      tx.get(db.doc("analyticsConfig/current")),
    ]);
    const job = jobSnap.data();
    if (!job || job.state !== "pending" || policy.data()?.enabled !== true)
      return;
    // One receipt protects the source application even after a job retry or deletion.
    const receiptRef = db.doc(`analyticsProcessed/${jobId}`),
      receipt = await tx.get(receiptRef);
    if (receipt.exists) {
      tx.update(jobRef, { state: "done", expireAt: expiry(now, 7) });
      return;
    }
    const patch = new Map<string, Record<string, unknown>>();
    const put = (path: string, data: Record<string, unknown>) =>
      patch.set(path, { ...patch.get(path), ...data });
    const increment = (
      path: string,
      key: string,
      amount: number,
      at: number,
    ) => {
      const prior = patch.get(path) ?? {};
      const sums = (prior.counts ?? {}) as Record<string, number>;
      sums[key] = (sums[key] ?? 0) + amount;
      put(path, {
        day: utcDay(at),
        counts: sums,
        expireAt: expiry(at, 365),
        updatedAt: now,
      });
    };
    const counter = (key: string, amount: number, at: number, source: string) =>
      increment(
        `analyticsDays/${utcDay(at)}-${shard(source)}`,
        key,
        amount,
        at,
      );
    const member = (
      kind: string,
      key: string,
      at: number,
      extra: Record<string, unknown> = {},
    ) => {
      put(`analyticsMembers/${digest(`${utcDay(at)}:${kind}:${key}`)}`, {
        day: utcDay(at),
        kind,
        key,
        at,
        ...extra,
        expireAt: expiry(at, 45),
      });
    };
    const dimension = (
      kind: string,
      id: string,
      key: string,
      amount: number,
      at: number,
    ) => {
      const path = `analyticsDimensions/${utcDay(at)}-${kind}-${id}`;
      increment(path, key, amount, at);
      put(path, { kind, entityId: id });
    };
    let invalid = false;
    if (job.type === "session" || job.type === "event") {
      const raw =
        job.type === "event"
          ? (await tx.get(db.doc(`analyticsEvents/${job.source}`))).data()
          : null;
      const sid = raw?.sessionId ?? job.source;
      const sref = db.doc(`analyticsSessions/${sid}`),
        session = (await tx.get(sref)).data();
      const event = raw ? analyticsEventSchema.safeParse(raw.event) : null;
      // A privacy choice intentionally cancels unapplied tracking work; it is not pipeline data loss.
      if (session?.revoked === true) {
        tx.create(receiptRef, {
          skippedAt: now,
          reason: "consent_withdrawn",
          expireAt: expiry(now, 45),
        });
        tx.update(jobRef, {
          state: "done",
          reason: "consent_withdrawn",
          cancelledAt: now,
          expireAt: expiry(now, 7),
        });
        return { written: [receiptRef.path, jobRef.path] };
      }
      if (
        !session ||
        session.revoked ||
        !validAt(session.startedAt, now) ||
        (job.type === "event" &&
          (!event?.success || !validAt(raw?.receivedAt, now)))
      )
        invalid = true;
      else if (job.type === "session") {
        counter("sessions", 1, session.startedAt, sid);
        member("browser", session.browser, session.startedAt);
        if (session.subject)
          member("account", session.subject, session.startedAt);
        put(sref.path, { aggregated: true });
      } else if (event?.success) {
        const e = event.data,
          at = raw!.receivedAt;
        member("browser", session.browser, at);
        if (session.subject) member("account", session.subject, at);
        if (e.kind === "page") counter("views", 1, at, sid);
        else if (e.kind === "ask") {
          counter("questions", 1, at, sid);
          dimension("topic", e.topic, "questions", 1, at);
          member("topic", `${e.topic}:${sid}`, at, {
            topic: e.topic,
            sessionId: sid,
          });
        } else {
          dimension(
            "product",
            e.productId,
            e.kind === "product_view" ? "views" : "clicks",
            1,
            at,
          );
          if (e.kind === "product_view")
            put(sref.path, { productViewed: true });
        }
      }
    } else if (job.type === "order" || job.type === "ledger") {
      const entry =
        job.type === "ledger"
          ? (await tx.get(db.doc(`financialEntries/${job.source}`))).data()
          : null;
      const oid = entry?.orderId ?? job.source;
      const order = refId(oid)
        ? ((await tx.get(db.doc(`orders/${oid}`))).data() as Order | undefined)
        : undefined;
      if (isPurchaseTestRecord(entry) || isPurchaseTestRecord(order)) {
        tx.update(jobRef, {
          state: "done",
          reason: "test_record_excluded",
          expireAt: expiry(now, 7),
        });
        tx.create(receiptRef, { createdAt: now, expireAt: expiry(now, 365) });
        return;
      }
      const pref = db.doc(`analyticsOrderProjections/${digest(String(oid))}`),
        projection = (await tx.get(pref)).data() ?? {};
      const attrRef = refId(oid)
          ? db.doc(`analyticsAttributions/${oid}`)
          : null,
        attr = attrRef ? (await tx.get(attrRef)).data() : undefined;
      const sref = attr ? db.doc(`analyticsSessions/${attr.sessionId}`) : null,
        session = sref ? (await tx.get(sref)).data() : undefined;
      const ledgerReceiptRef =
        job.type === "ledger"
          ? db.doc(`analyticsLedgerReceipts/${digest(job.source)}`)
          : null;
      const ledgerReceipt = ledgerReceiptRef
        ? await tx.get(ledgerReceiptRef)
        : null;
      if (
        !order ||
        !refId(order.ownerId) ||
        !Number.isSafeInteger(order.createdAt) ||
        order.createdAt <= 0 ||
        order.createdAt > now + 60_000 ||
        !Number.isSafeInteger(order.version) ||
        order.version < 1 ||
        !(order.stage in stageLabels)
      )
        invalid = true;
      else {
        let firstPayment = projection.firstPaymentAt as number | undefined;
        if (job.type === "ledger" && !ledgerReceipt?.exists) {
          if (
            !entry ||
            !["payment", "refund", "reversal"].includes(entry.kind) ||
            entry.currency !== "VND" ||
            !Number.isSafeInteger(entry.amount) ||
            entry.amount <= 0 ||
            entry.amount > 1e12 ||
            !validAt(entry.createdAt, now) ||
            entry.createdAt < order.createdAt
          )
            invalid = true;
          else {
            counter(
              { payment: "payments", refund: "refunds", reversal: "reversals" }[
                entry.kind as "payment" | "refund" | "reversal"
              ],
              entry.amount,
              entry.createdAt,
              job.source,
            );
            if (entry.kind === "payment") {
              firstPayment = Math.min(
                firstPayment ?? entry.createdAt,
                entry.createdAt,
              );
              member("buyer", digest(order.ownerId), entry.createdAt);
              member("paidOrder", oid, entry.createdAt, {
                orderId: oid,
                linked: !!attr,
              });
            }
            put(ledgerReceiptRef!.path, {
              createdAt: now,
              expireAt: expiry(entry.createdAt, 365),
            });
          }
        }
        if (!invalid) {
          if ((projection.version ?? 0) < order.version) {
            if (
              !projection.version &&
              order.createdAt >= policy.data()!.startedAt &&
              validAt(order.createdAt, now)
            ) {
              counter("orders", 1, order.createdAt, oid);
              counter(
                ["US", "JP", "KR"].includes(order.market)
                  ? order.market
                  : "unknown",
                1,
                order.createdAt,
                oid,
              );
            }
            if (
              order.createdAt >= policy.data()!.startedAt &&
              validAt(order.createdAt, now)
            ) {
              if (projection.stage)
                counter(`stage_${projection.stage}`, -1, order.createdAt, oid);
              counter(`stage_${order.stage}`, 1, order.createdAt, oid);
            }
            put(pref.path, { version: order.version, stage: order.stage });
          }
          let payable: number | undefined;
          if (order.purchaseKind === "catalog") {
            try {
              payable = catalogPayable(order);
            } catch {
              tx.update(jobRef, {
                state: "dead",
                reason: "invalid_catalog_payable",
                expireAt: expiry(now, 45),
              });
              tx.set(
                db.doc("analyticsHealth/current"),
                { hasLoss: true },
                { merge: true },
              );
              return;
            }
          }
          if (
            !projection.productPaid &&
            firstPayment &&
            order.purchaseKind === "catalog" &&
            payable !== undefined &&
            payable > 0 &&
            refId(order.catalogSnapshot?.productId)
          ) {
            const sourceEntries = await tx.get(
              db
                .collection("financialEntries")
                .where("orderId", "==", oid)
                .orderBy("createdAt")
                .limit(101),
            );
            const paidAt = firstCatalogPaidAt(
              sourceEntries.docs
                .filter((d) => !isPurchaseTestRecord(d.data()))
                .map(
                  (d) =>
                    d.data() as {
                      kind: string;
                      currency: string;
                      amount: number;
                      createdAt: number;
                    },
                ),
              payable,
            );
            if (paidAt !== null) {
              if (paidAt >= policy.data()!.startedAt && validAt(paidAt, now))
                dimension(
                  "product",
                  order.catalogSnapshot!.productId,
                  "paidOrders",
                  1,
                  paidAt,
                );
              put(pref.path, { productPaid: true, productPaidAt: paidAt });
            } else if (sourceEntries.size >= 101) {
              dimension(
                "product",
                order.catalogSnapshot!.productId,
                "paidOrdersUnknown",
                1,
                firstPayment,
              );
              put(pref.path, { productPaidCoverage: false });
            }
          }
          if (firstPayment) put(pref.path, { firstPaymentAt: firstPayment });
          if (attr && session && !session.revoked && firstPayment) {
            const eligible = conversionEligible(
              session.startedAt,
              firstPayment,
            );
            const delta = Number(eligible) - Number(attr.eligible === true);
            if (delta) {
              put(sref!.path, {
                convertedOrders: Math.max(
                  0,
                  (session.convertedOrders ?? 0) + delta,
                ),
              });
              put(attrRef!.path, { eligible });
            }
            // Late sidecar linking reconciles payment-period attribution coverage.
            member("paidOrder", oid, firstPayment, {
              orderId: oid,
              linked: true,
            });
          }
          put(pref.path, { expireAt: expiry(now, 365), updatedAt: now });
        }
      }
    } else invalid = true;
    if (invalid) {
      tx.update(jobRef, {
        state: "dead",
        reason: "invalid_or_expired_source",
        attemptedAt: now,
        expireAt: expiry(now, 45),
      });
      tx.set(
        db.doc("analyticsHealth/current"),
        { hasLoss: true },
        { merge: true },
      );
      return;
    }
    // Reads of every destination precede every write; increments use transaction snapshots.
    const destinations = await Promise.all(
      [...patch.keys()].map((path) => tx.get(db.doc(path))),
    );
    let n = 0;
    for (const [path, data] of patch) {
      const old = destinations[n++].data() ?? {};
      if (data.counts) {
        const counts = { ...old.counts };
        for (const [key, delta] of Object.entries(
          data.counts as Record<string, number>,
        )) {
          const sum = (counts[key] ?? 0) + delta;
          if (!Number.isSafeInteger(sum) || sum < 0)
            throw Error("ANALYTICS_COUNTER_INVALID");
          counts[key] = sum;
        }
        data.counts = counts;
      }
      tx.set(db.doc(path), data, { merge: true });
    }
    tx.create(receiptRef, {
      appliedAt: now,
      expireAt: expiry(
        now,
        job.type === "ledger" || job.type === "order" ? 365 : 45,
      ),
    });
    tx.update(jobRef, {
      state: "done",
      appliedAt: now,
      expireAt: expiry(now, 7),
    });
    return { written: [...patch.keys(), receiptRef.path, jobRef.path] };
  });
}
export const analyticsJobCreated = onDocumentCreated(
  { ...triggerOptions, document: "analyticsJobs/{id}" },
  async (e) => {
    await processAnalyticsJob(e.params.id);
  },
);
export const analyticsCompact = onSchedule(
  {
    region: "asia-southeast1",
    schedule: "every 1 minutes",
    maxInstances: 1,
    timeoutSeconds: 60,
  },
  async () => {
    const db = getFirestore();
    if (
      (await db.doc("analyticsConfig/current").get()).data()?.enabled !== true
    )
      return;
    const pending = await db
      .collection("analyticsJobs")
      .where("state", "==", "pending")
      .orderBy("createdAt")
      .limit(100)
      .get();
    // Bounded concurrency; failed jobs stay pending for the next tick. No source payload logs.
    let failures = 0;
    for (let i = 0; i < pending.docs.length; i += 8) {
      const results = await Promise.allSettled(
        pending.docs.slice(i, i + 8).map((doc) => processAnalyticsJob(doc.id)),
      );
      failures += results.filter((r) => r.status === "rejected").length;
    }
    await db
      .doc("analyticsHealth/current")
      .set(
        { lastWorkerAt: Date.now(), attempted: pending.size, failures },
        { merge: true },
      );
    if (failures) throw Error("ANALYTICS_COMPACTION_RETRY");
  },
);
