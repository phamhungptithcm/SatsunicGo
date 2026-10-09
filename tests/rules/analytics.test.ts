import { beforeAll, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { CONSENT_VERSION, DAY, utcDay } from "../../packages/domain/analytics";
let api: typeof import("../../functions/src/analytics-ingest");
let worker: typeof import("../../functions/src/analytics-worker");
let dashboard: typeof import("../../functions/src/dashboard-analytics");
let db: ReturnType<typeof getFirestore>;
const tokens = new Map<string, string>();
const sidFor = (token: string) => tokens.get(token)!;
const owned = new Set<string>(),
  prefix = `analytics-${randomUUID()}`,
  uid = `${prefix}-buyer`,
  now = Date.now();
let oldPolicy: FirebaseFirestore.DocumentData | undefined;
function request(data: unknown, owner: string | null = uid) {
  return {
    data,
    ...(owner
      ? {
          auth: {
            uid: owner,
            token: {
              email_verified: true,
              firebase: { sign_in_provider: "google.com" },
            },
          },
        }
      : {}),
  } as CallableRequest;
}
async function put(path: string, data: unknown) {
  owned.add(path);
  await db.doc(path).set(data as FirebaseFirestore.DocumentData);
}
async function session(
  owner: string | null = uid,
  browserId = randomUUID(),
  requestId = randomUUID(),
) {
  const r = await api.analyticsSession.run(
    request(
      { version: 1, consent: CONSENT_VERSION, browserId, requestId },
      owner,
    ),
  );
  const sid = (
    await db.doc(`analyticsCapabilities/${api.digest(r.session)}`).get()
  ).data()!.sessionId;
  tokens.set(r.session, sid);
  owned.add(`analyticsCapabilities/${api.digest(r.session)}`);
  if (owner)
    owned.add(
      `analyticsSubjects/${utcDay(Date.now())}-${api.digest(`account:${owner}`)}`,
    );
  for (const path of [
    `analyticsSessions/${sid}`,
    `analyticsJobs/session-${sid}`,
    `analyticsSessionRequests/${api.digest(`${browserId}:${owner ? api.digest(`account:${owner}`) : null}:${requestId}`)}`,
    `analyticsSubjects/${utcDay(Date.now())}-${api.digest(browserId)}`,
  ])
    owned.add(path);
  return r;
}
async function ingest(
  token: string,
  events: unknown[],
  owner: string | null = uid,
) {
  const result = await api.analyticsIngest.run(
    request({ version: 1, session: token, events }, owner),
  );
  for (const e of events as { id: string }[]) {
    const id = api.digest(`${sidFor(token)}:${e.id}`);
    owned.add(`analyticsEvents/${id}`);
    owned.add(`analyticsJobs/event-${id}`);
  }
  return result;
}
async function processJob(id: string) {
  const result = await worker.processAnalyticsJob(id);
  for (const path of result?.written ?? []) owned.add(path);
}
async function enqueue(
  type: "ledger" | "order",
  source: string,
  revision: string,
) {
  await worker.enqueueAnalytics(type, source, revision);
  owned.add(`analyticsJobs/${type}-${api.digest(`${source}:${revision}`)}`);
}
async function drain() {
  for (const path of [...owned].filter((p) => p.startsWith("analyticsJobs/"))) {
    const d = await db.doc(path).get();
    if (d.data()?.state === "pending") await processJob(d.id);
  }
}
const event = (kind: string, extra = {}) => ({
  id: randomUUID(),
  at: Date.now(),
  kind,
  ...extra,
});
beforeAll(async () => {
  if (
    process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
    process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207"
  )
    throw Error("Shared demo only");
  await import("../../functions/src/index");
  api = await import("../../functions/src/analytics-ingest");
  worker = await import("../../functions/src/analytics-worker");
  dashboard = await import("../../functions/src/dashboard-analytics");
  db = getFirestore();
  oldPolicy = (await db.doc("analyticsConfig/current").get()).data();
  if (oldPolicy || (await db.doc("analyticsHealth/current").get()).exists)
    throw Error(
      "An analytics policy already exists; do not change shared settings.",
    );
  await put("analyticsConfig/current", {
    enabled: true,
    startedAt: now - 10_000,
  });
  await put(`users/${uid}`, { locked: false });
});

afterAll(async () => {
  if (!db) return;
  const paths = [...owned];
  for (let i = 0; i < paths.length; i += 400) {
    const batch = db.batch();
    for (const path of paths.slice(i, i + 400)) batch.delete(db.doc(path));
    await batch.commit();
  }
  await db.terminate();
});

it("withdrawal cancels pending tracking without creating permanent pipeline loss", async () => {
  const s = await session(null),
    e = event("page", { route: "home" });
  await ingest(s.session, [e], null);
  await api.analyticsWithdraw.run(request({ session: s.session }, null));
  await drain();
  const id = `event-${api.digest(`${sidFor(s.session)}:${e.id}`)}`;
  const job = (await db.doc(`analyticsJobs/${id}`).get()).data();
  expect(job?.state).toBe("done");
  expect(job?.reason).toBe("consent_withdrawn");
  expect(
    (await db.doc(`analyticsSessions/${sidFor(s.session)}`).get()).data()
      ?.aggregated,
  ).not.toBe(true);
  expect((await db.doc("analyticsHealth/current").get()).exists).toBe(false);
});
it("concurrent ingest/worker retries count once; timestamps and private rules", async () => {
  const s = await session();
  const e = event("page", { route: "home" });
  await Promise.all([ingest(s.session, [e]), ingest(s.session, [e])]);
  const id = `event-${api.digest(`${sidFor(s.session)}:${e.id}`)}`;
  await Promise.all([processJob(id), processJob(id)]);
  await drain();
  const days = await db
    .collection("analyticsDays")
    .where("day", "==", utcDay(Date.now()))
    .get();
  expect(days.docs.reduce((n, d) => n + (d.data().counts.views ?? 0), 0)).toBe(
    1,
  );
  expect(
    (await db.doc(`analyticsSessions/${sidFor(s.session)}`).get()).data()
      ?.expireAt,
  ).toBeInstanceOf(Timestamp);
  await expect(
    ingest(s.session, [
      event("ask", { topic: "shipping", question: "raw PII" }),
    ]),
  ).rejects.toThrow();
  await expect(
    ingest(s.session, [event("page", { route: "home" })], `${prefix}-foreign`),
  ).rejects.toThrow();
  const env = await initializeTestEnvironment({
    projectId: "demo-satsunicgo",
    firestore: { host: "127.0.0.1", port: 18207 },
  });
  await expect(
    getDoc(
      doc(
        env.unauthenticatedContext().firestore(),
        "analyticsSessions",
        api.digest(s.session),
      ),
    ),
  ).rejects.toThrow();
  await expect(
    setDoc(
      doc(env.authenticatedContext(uid).firestore(), "analyticsDays", "forged"),
      { count: 999 },
    ),
  ).rejects.toThrow();
  await env.cleanup();
});
it("canonical installments, late linking, out-of-order stage, ownership and conversion", async () => {
  const s = await session(),
    sid = sidFor(s.session),
    oid = `${prefix}-order`,
    productId = `${prefix}-product`;
  await put(`products/${productId}`, {
    status: "published",
    publishAt: 0,
    title: "Synthetic product",
    slug: "synthetic-product",
  });
  const order = {
    id: oid,
    ownerId: uid,
    createdAt: Date.now(),
    version: 1,
    market: "US",
    stage: "REQUESTED",
    purchaseKind: "catalog",
    catalogSnapshot: { productId, total: 1000 },
    finalTotal: 900,
    collected: 400,
    refunded: 0,
    refundReserved: 0,
  };
  await put(`orders/${oid}`, order);
  const p1 = `${prefix}-p1`;
  await put(`financialEntries/${p1}`, {
    orderId: oid,
    kind: "payment",
    amount: 400,
    currency: "VND",
    createdAt: Date.now(),
  });
  await enqueue("ledger", p1, p1);
  await drain();
  expect(
    (await db.doc(`analyticsSessions/${sid}`).get()).data()?.convertedOrders,
  ).toBe(0);
  await api.analyticsLinkOrder.run(
    request({ session: s.session, orderId: oid }),
  );
  owned.add(`analyticsAttributions/${oid}`);
  owned.add(`analyticsJobs/link-${oid}`);
  await drain();
  expect(
    (await db.doc(`analyticsSessions/${sid}`).get()).data()?.convertedOrders,
  ).toBe(1);
  await expect(
    api.analyticsLinkOrder.run(
      request({ session: s.session, orderId: oid }, `${prefix}-foreign`),
    ),
  ).rejects.toThrow();
  await put(`orders/${oid}`, {
    ...order,
    collected: 900,
    version: 2,
    stage: "PURCHASING",
  });
  const p2 = `${prefix}-p2`;
  await put(`financialEntries/${p2}`, {
    orderId: oid,
    kind: "payment",
    amount: 500,
    currency: "VND",
    createdAt: Date.now(),
  });
  await enqueue("ledger", p2, p2);
  await drain();
  await enqueue("order", oid, "1");
  await drain();
  const dimensions = await db
    .collection("analyticsDimensions")
    .where("entityId", "==", productId)
    .get();
  expect(
    dimensions.docs.reduce((n, d) => n + (d.data().counts.paidOrders ?? 0), 0),
  ).toBe(1);
  const projection = (
    await db.doc(`analyticsOrderProjections/${api.digest(oid)}`).get()
  ).data();
  expect(projection?.version).toBe(2);
  expect(projection?.stage).toBe("PURCHASING");
  await put(`staffAccess/${uid}`, {
    active: true,
    locked: false,
    roles: ["OPERATIONS_MANAGER"],
  });
  const from = Math.floor(Date.now() / DAY) * DAY,
    until = Date.now();
  const manager = await dashboard.dashboardAnalytics.run(
    request({ from, until }),
  );
  expect(manager.convertedSessions).toBe(1);
  expect(manager.buyers).toBe(1);
  expect(manager.products[0].paidOrders).toBe(1);
  expect(manager.days.some((d) => "payments" in d.counts)).toBe(false);
  await put(`staffAccess/${uid}`, {
    active: true,
    locked: false,
    roles: ["OWNER"],
  });
  const owner = await dashboard.dashboardAnalytics.run(
    request({ from, until }),
  );
  expect(owner.days.reduce((n, d) => n + (d.counts.payments ?? 0), 0)).toBe(
    900,
  );
});
it("five distinct sessions for topics, refusal/withdrawal and default disabled policy", async () => {
  const guest = await session(null);
  await ingest(
    guest.session,
    [event("ask", { topic: "shipping" }), event("ask", { topic: "shipping" })],
    null,
  );
  await drain();
  const from = Math.floor(Date.now() / DAY) * DAY,
    until = Date.now();
  let result = await dashboard.dashboardAnalytics.run(request({ from, until }));
  expect(result.topics).toHaveLength(0);
  for (let i = 0; i < 4; i++) {
    const s = await session(null);
    await ingest(s.session, [event("ask", { topic: "shipping" })], null);
  }
  await drain();
  result = await dashboard.dashboardAnalytics.run(
    request({ from, until: Date.now() }),
  );
  expect(result.topics.find((t) => t.id === "shipping")?.sessions).toBe(5);
  await api.analyticsWithdraw.run(request({ session: guest.session }, null));
  await expect(
    ingest(guest.session, [event("page", { route: "home" })], null),
  ).rejects.toThrow();
  await db.doc("analyticsConfig/current").update({ enabled: false });
  await expect(session(null)).rejects.toThrow();
  await db.doc("analyticsConfig/current").update({ enabled: true });
});

it("current cash from older orders, refunds/reversals and dead-letter loss stay visible", async () => {
  const oid = `${prefix}-old`,
    p = `${prefix}-old-payment`,
    refund = `${prefix}-refund`,
    reverse = `${prefix}-reversal`;
  await put(`orders/${oid}`, {
    id: oid,
    ownerId: uid,
    createdAt: Date.now() - 500 * DAY,
    version: 1,
    market: "US",
    stage: "COMPLETED",
    collected: 700,
    refunded: 200,
  });
  for (const [id, kind, amount] of [
    [p, "payment", 700],
    [refund, "refund", 200],
    [reverse, "reversal", 100],
  ] as const) {
    await put(`financialEntries/${id}`, {
      orderId: oid,
      kind,
      amount,
      currency: "VND",
      createdAt: Date.now(),
    });
    await enqueue("ledger", id, id);
  }
  await drain();
  const from = Math.floor(Date.now() / DAY) * DAY,
    until = Date.now();
  const s = await dashboard.dashboardAnalytics.run(request({ from, until }));
  expect(s.days.reduce((n, d) => n + (d.counts.payments ?? 0), 0)).toBe(1600);
  expect(s.days.reduce((n, d) => n + (d.counts.refunds ?? 0), 0)).toBe(200);
  expect(s.days.reduce((n, d) => n + (d.counts.reversals ?? 0), 0)).toBe(100);
  const invalid = `${prefix}-invalid`;
  await put(`analyticsJobs/${invalid}`, {
    type: "bogus",
    source: "invalid",
    state: "pending",
    createdAt: Date.now(),
  });
  await processJob(invalid);
  owned.add("analyticsHealth/current");
  expect((await db.doc(`analyticsJobs/${invalid}`).get()).data()?.state).toBe(
    "dead",
  );
  expect((await db.doc("analyticsHealth/current").get()).data()?.hasLoss).toBe(
    true,
  );
});

it("session retries alias one visit, and a duplicate 20-event burst applies once", async () => {
  const browser = randomUUID(),
    requestId = randomUUID();
  const [a, b] = await Promise.all([
    session(null, browser, requestId),
    session(null, browser, requestId),
  ]);
  expect(a.session).not.toBe(b.session);
  expect(sidFor(a.session)).toBe(sidFor(b.session));
  const events = Array.from({ length: 20 }, () =>
    event("page", { route: "home" }),
  );
  const started = performance.now();
  const accepted = await Promise.all([
    ingest(a.session, events, null),
    ingest(b.session, events, null),
    ingest(a.session, events, null),
  ]);
  expect(accepted.reduce((n, r) => n + r.accepted, 0)).toBe(20);
  const ids = events.map(
    (e) => `event-${api.digest(`${sidFor(a.session)}:${e.id}`)}`,
  );
  for (let i = 0; i < ids.length; i += 8)
    await Promise.all(ids.slice(i, i + 8).map(processJob));
  await drain();
  expect(
    (await db.doc(`analyticsSessions/${sidFor(a.session)}`).get()).data()
      ?.events,
  ).toBe(20);
  const d = await dashboard.dashboardAnalytics.run(
    request({ from: Math.floor(Date.now() / DAY) * DAY, until: Date.now() }),
  );
  expect(Buffer.byteLength(JSON.stringify(d))).toBeLessThan(65536);
  console.info(
    JSON.stringify({
      probe: "20-event-duplicate-burst",
      elapsedMs: Math.round(performance.now() - started),
      accepted: 20,
      responseBytes: Buffer.byteLength(JSON.stringify(d)),
      environment: "shared-firestore-emulator",
    }),
  );
}, 45000);

it("activity across UTC midnight belongs to both days but period browsers are a union", async () => {
  const today = Math.floor(Date.now() / DAY) * DAY,
    startedAt = today - 10_000,
    sid = randomUUID(),
    browser = api.digest(randomUUID());
  await put(`analyticsSessions/${sid}`, {
    browser,
    subject: null,
    startedAt,
    lastSeenAt: Date.now(),
    events: 2,
    revoked: false,
    convertedOrders: 0,
    productViewed: false,
    expireAt: api.expiry(startedAt, 45),
  });
  const sj = `session-${sid}`;
  await put(`analyticsJobs/${sj}`, {
    type: "session",
    source: sid,
    state: "pending",
    createdAt: startedAt,
  });
  await processJob(sj);
  for (const at of [startedAt, today + 1]) {
    const id = api.digest(randomUUID()),
      job = `event-${id}`;
    await put(`analyticsEvents/${id}`, {
      sessionId: sid,
      event: { ...event("page", { route: "home" }), at },
      receivedAt: at,
      expireAt: api.expiry(at, 7),
    });
    await put(`analyticsJobs/${job}`, {
      type: "event",
      source: id,
      state: "pending",
      createdAt: at,
    });
    await processJob(job);
  }
  const both = await dashboard.dashboardAnalytics.run(
    request({ from: today - DAY, until: Date.now() }),
  );
  const current = await dashboard.dashboardAnalytics.run(
    request({ from: today, until: Date.now() }),
  );
  expect(both.browsers).toBe(current.browsers);
  expect(
    (
      await db
        .doc(
          `analyticsMembers/${api.digest(`${utcDay(today)}:browser:${browser}`)}`,
        )
        .get()
    ).exists,
  ).toBe(true);
  expect(
    (
      await db
        .doc(
          `analyticsMembers/${api.digest(`${utcDay(startedAt)}:browser:${browser}`)}`,
        )
        .get()
    ).exists,
  ).toBe(true);
});

it("a later refund does not erase the first full-payment occurrence; malformed sources are terminal and visible", async () => {
  const oid = `${prefix}-refund-race`,
    productId = `${prefix}-refund-product`,
    payment = `${prefix}-race-payment`,
    refund = `${prefix}-race-refund`,
    at = Date.now();
  await put(`products/${productId}`, {
    status: "published",
    publishAt: 0,
    title: "Refund race fixture",
  });
  await put(`orders/${oid}`, {
    id: oid,
    ownerId: uid,
    createdAt: at,
    version: 1,
    market: "JP",
    stage: "COMPLETED",
    purchaseKind: "catalog",
    catalogSnapshot: { productId, total: 1000 },
    finalTotal: 1000,
    collected: 1000,
    refunded: 200,
    refundReserved: 0,
  });
  for (const [id, kind, amount, createdAt] of [
    [payment, "payment", 1000, at],
    [refund, "refund", 200, at + 1],
  ] as const) {
    await put(`financialEntries/${id}`, {
      orderId: oid,
      kind,
      amount,
      currency: "VND",
      createdAt,
    });
  }
  // Both canonical entries exist before the first analytics job runs.
  await enqueue("ledger", refund, refund);
  await enqueue("ledger", payment, payment);
  await drain();
  const projection = (
    await db.doc(`analyticsOrderProjections/${api.digest(oid)}`).get()
  ).data();
  expect(projection?.productPaidAt).toBe(at);
  const rows = await db
    .collection("analyticsDimensions")
    .where("entityId", "==", productId)
    .get();
  expect(
    rows.docs.reduce((n, d) => n + (d.data().counts.paidOrders ?? 0), 0),
  ).toBe(1);
  const malformed = `${prefix}-malformed`;
  await put(`financialEntries/${malformed}`, {
    orderId: "bad/id",
    kind: "payment",
    amount: 1,
    currency: "VND",
    createdAt: at,
  });
  await enqueue("ledger", malformed, malformed);
  await drain();
  const job = `ledger-${api.digest(`${malformed}:${malformed}`)}`;
  expect((await db.doc(`analyticsJobs/${job}`).get()).data()?.state).toBe(
    "dead",
  );
  expect(
    (await db.doc(`analyticsJobs/${job}`).get()).data()?.expireAt,
  ).toBeInstanceOf(Timestamp);
  await db.doc(`analyticsJobs/${job}`).delete();
  const d = await dashboard.dashboardAnalytics.run(
    request({ from: Math.floor(Date.now() / DAY) * DAY, until: Date.now() }),
  );
  expect(d.complete).toBe(false);
  expect((await db.doc("analyticsHealth/current").get()).data()?.hasLoss).toBe(
    true,
  );
});

it("account rotation closes collection while an already linked purchase still converts", async () => {
  const owner = `${prefix}-logout-buyer`,
    oid = `${prefix}-logout-order`,
    payment = `${prefix}-logout-payment`;
  await put(`users/${owner}`, { locked: false });
  const s = await session(owner),
    sid = sidFor(s.session),
    at = Date.now();
  await put(`orders/${oid}`, {
    id: oid,
    ownerId: owner,
    createdAt: at,
    version: 1,
    market: "US",
    stage: "REQUESTED",
    collected: 100,
    refunded: 0,
  });
  await api.analyticsLinkOrder.run(
    request({ session: s.session, orderId: oid }, owner),
  );
  owned.add(`analyticsAttributions/${oid}`);
  owned.add(`analyticsJobs/link-${oid}`);
  await api.analyticsWithdraw.run(
    request({ session: s.session, reason: "account_change" }, null),
  );
  await expect(
    ingest(s.session, [event("page", { route: "home" })], owner),
  ).rejects.toThrow();
  await put(`financialEntries/${payment}`, {
    orderId: oid,
    kind: "payment",
    amount: 100,
    currency: "VND",
    createdAt: at,
  });
  await enqueue("ledger", payment, payment);
  await drain();
  const row = (await db.doc(`analyticsSessions/${sid}`).get()).data();
  expect(row?.closed).toBe(true);
  expect(row?.revoked).toBe(false);
  expect(row?.convertedOrders).toBe(1);
});

it("expired retained aggregates remain unavailable even before asynchronous TTL removes them", async () => {
  const from = Math.floor((Date.now() - 400 * DAY) / DAY) * DAY,
    until = from + DAY - 1,
    product = `${prefix}-retained`,
    day = utcDay(from);
  await put(`analyticsDays/${prefix}-retained`, {
    day,
    counts: { views: 23, stage_COMPLETED: 9 },
    expireAt: api.expiry(from, 365),
  });
  await put(`analyticsDimensions/${prefix}-retained`, {
    day,
    kind: "product",
    entityId: product,
    counts: { clicks: 45, views: 56, paidOrders: 2 },
    expireAt: api.expiry(from, 365),
  });
  const current = (await db.doc("analyticsConfig/current").get()).data()!;
  try {
    await db.doc("analyticsConfig/current").update({ startedAt: from - DAY });
    const oid = `${prefix}-expired-stage`;
    await put(`orders/${oid}`, {
      id: oid,
      ownerId: uid,
      createdAt: from,
      version: 2,
      market: "US",
      stage: "PURCHASING",
      collected: 0,
      refunded: 0,
    });
    await put(`analyticsOrderProjections/${api.digest(oid)}`, {
      version: 1,
      stage: "REQUESTED",
      expireAt: api.expiry(Date.now(), 365),
    });
    await enqueue("order", oid, "2");
    await drain();
    expect(
      (
        await db.doc(`analyticsJobs/order-${api.digest(`${oid}:2`)}`).get()
      ).data()?.state,
    ).toBe("done");
    expect(
      (
        await db.doc(`analyticsOrderProjections/${api.digest(oid)}`).get()
      ).data()?.stage,
    ).toBe("PURCHASING");
    const d = await dashboard.dashboardAnalytics.run(request({ from, until }));
    expect(d.availability.products).toBe(false);
    expect(d.availability.stages).toBe(false);
    expect(d.availability.traffic).toBe(false);
    expect(d.products).toEqual([]);
    expect(d.stages).toEqual({});
    expect(d.days).toEqual([]);
    expect(d.complete).toBe(false);
  } finally {
    await db.doc("analyticsConfig/current").set(current);
  }
});

it("a read cap clears affected totals while other covered blocks remain usable", async () => {
  const day = utcDay(Date.now()),
    paths = Array.from(
      { length: 497 },
      (_, i) => `analyticsDays/${prefix}-bound-${i}`,
    ),
    batch = db.batch();
  for (const path of paths) {
    owned.add(path);
    batch.set(db.doc(path), {
      day,
      counts: { views: 1 },
      expireAt: api.expiry(Date.now(), 365),
    });
  }
  await batch.commit();
  try {
    const d = await dashboard.dashboardAnalytics.run(
      request({ from: Math.floor(Date.now() / DAY) * DAY, until: Date.now() }),
    );
    expect(d.availability.reason).toBe("read_limit");
    expect(d.availability.traffic).toBe(false);
    expect(d.availability.stages).toBe(false);
    expect(d.days).toEqual([]);
    expect(d.stages).toEqual({});
    expect(d.complete).toBe(false);
    expect(d.availability.products).toBe(true);
    expect(d.products.length).toBeGreaterThan(0);
  } finally {
    const cleanup = db.batch();
    for (const path of paths) cleanup.delete(db.doc(path));
    await cleanup.commit();
  }
}, 30000);
