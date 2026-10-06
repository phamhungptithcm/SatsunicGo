import {
  initializeApp,
  deleteApp,
  getApps,
  type App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { beforeAll, beforeEach, afterEach, afterAll, it, expect } from "vitest";
import { randomUUID } from "node:crypto";

// Emulator callable transaction tests with synthetic auth input, not real Google/App Check/provider evidence.
let app: App, db: ReturnType<typeof getFirestore>;
let shipping: typeof import("../../functions/src/shipping"),
  tracking: typeof import("../../functions/src/customer-order-tracking"),
  consolidation: typeof import("../../functions/src/consolidation");
let staff = "",
  owner = "",
  orderId = "",
  parcelId = "";
const ownedPaths = new Set<string>();
const ownedResources = new Set<string>();
const ownedBatches = new Set<string>();
let generation = 0;
const inFlight = new Set<Promise<unknown>>();
function check(current: number) {
  if (current !== generation) throw Error("064_FIXTURE_CANCELLED");
}
async function tracked<T>(current: number, work: () => Promise<T>): Promise<T> {
  const promise = Promise.resolve().then(async () => {
    check(current);
    const result = await work();
    check(current);
    return result;
  });
  inFlight.add(promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(promise);
  }
}
function scopeDb(current: number): typeof db {
  const wrap = <T extends object>(object: T): T =>
    new Proxy(object, {
      get(target, key) {
        const value = Reflect.get(target, key);
        if (typeof value !== "function") return value;
        if (
          ["get", "getAll", "set", "update", "delete", "commit"].includes(
            String(key),
          )
        )
          return (...args: unknown[]) =>
            tracked(current, () => value.apply(target, args));
        if (
          ["doc", "collection", "where", "limit", "orderBy", "batch"].includes(
            String(key),
          )
        )
          return (...args: unknown[]) => {
            check(current);
            return wrap(value.apply(target, args));
          };
        return value.bind(target);
      },
    });
  return wrap(db);
}
function caseScope(current: number) {
  const identity = auth(staff);
  return {
    db: scopeDb(current),
    run: (data: unknown, actor: unknown = identity) =>
      tracked(current, () => runImpl(data, actor)),
    command: (payload?: unknown, version?: number) => {
      check(current);
      return commandImpl(payload, version);
    },
    invariant: () => tracked(current, invariantImpl),
    tracking: {
      customerOrderTracking: {
        run: (request: CallableRequest) =>
          tracked(current, () => tracking.customerOrderTracking.run(request)),
      },
    },
  };
}
const document = (path: string) => {
  ownedPaths.add(path);
  return db.doc(path);
};
const auth = (uid: string) => ({
  uid,
  token: { email_verified: true, firebase: { sign_in_provider: "google.com" } },
});
function commandImpl(
  payload: unknown = {
    estimate: { startAt: Date.now() + 3600000, endAt: Date.now() + 7200000 },
    evidence: "Synthetic ETA evidence064",
  },
  expectedVersion = 1,
) {
  const operationId = randomUUID();
  ownedPaths.add(`idempotencyKeys/${staff}-${operationId}`);
  return {
    action: "setDeliveryEstimate",
    parcelId,
    expectedVersion,
    orderVersions: { [orderId]: 1 },
    operationId,
    payload,
  };
}
const runImpl = (data: unknown, identity: unknown = auth(staff)) =>
  shipping.shippingCommand.run({ data, auth: identity } as CallableRequest);
beforeAll(async () => {
  if (
    process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8187" ||
    getApps().some((a) => a.name === "[DEFAULT]")
  )
    throw Error(
      "064 requires isolated default SDK on dedicated emulator; no baseline writes",
    );
  app = initializeApp({ projectId: `demo-eta064-${randomUUID().slice(0, 8)}` });
  db = getFirestore(app);
  shipping = await import("../../functions/src/shipping");
  tracking = await import("../../functions/src/customer-order-tracking");
  consolidation = await import("../../functions/src/consolidation");
});
beforeEach(async () => {
  const current = ++generation;
  const prefix = `eta064-${randomUUID()}`;
  staff = prefix + "-staff";
  owner = prefix + "-owner";
  orderId = prefix + "-order";
  parcelId = prefix + "-parcel";
  ownedResources.add(parcelId);
  const allocation = { orderId, line: 0, quantity: 2 },
    batch = db.batch();
  for (const [path, value] of [
    [`users/${staff}`, { locked: false }],
    [`users/${owner}`, { locked: false }],
    [`staffAccess/${staff}`, { active: true, roles: ["OWNER"] }],
    [
      `orders/${orderId}`,
      {
        id: orderId,
        ownerId: owner,
        version: 1,
        market: "US",
        stage: "IN_TRANSIT",
        items: [{ name: "Synthetic ETA item", quantity: 2 }],
        collected: 240000,
        refunded: 0,
      },
    ],
    [
      `packages/${parcelId}`,
      {
        id: parcelId,
        version: 1,
        state: "in_transit",
        allocations: [allocation],
        route: "US-VN",
        warehouse: "Synthetic ETA warehouse",
        weightGrams: 500,
      },
    ],
    [
      `packageAllocations/${orderId}`,
      { parcelIds: [parcelId], allocations: [allocation] },
    ],
    [
      `customerShipments/${owner}-${parcelId}`,
      {
        id: parcelId,
        ownerId: owner,
        version: 1,
        state: "in_transit",
        route: "US-VN",
        allocations: [allocation],
      },
    ],
  ] as const)
    batch.set(document(path), value);
  await tracked(current, () => batch.commit());
});
async function invariantImpl() {
  return {
    order: (await db.doc(`orders/${orderId}`).get()).data(),
    allocation: (await db.doc(`packageAllocations/${orderId}`).get()).data(),
    ledger: (
      await db
        .collection("financialEntries")
        .where("orderId", "==", orderId)
        .get()
    ).docs.map((d) => d.data()),
    outbox: (
      await db.collection("outboxJobs").where("orderId", "==", orderId).get()
    ).docs.map((d) => d.data()),
  };
}
it("records one public staff window with CAS/replay, no order/money/outbox effects and redacted owner ETA", async () => {
  const current = generation,
    { db, run, command, invariant, tracking } = caseScope(current);
  const before = await invariant(),
    data = command(),
    result = await run(data);
  expect(await run(data)).toEqual(result);
  expect(await invariant()).toEqual(before);
  const parcel = (await db.doc(`packages/${parcelId}`).get()).data()!;
  expect(parcel.version).toBe(2);
  expect(parcel.state).toBe("in_transit");
  expect(parcel.deliveryEstimate.source).toBe("staff");
  expect((await db.collection(`packages/${parcelId}/events`).get()).size).toBe(
    1,
  );
  expect(
    (
      await db
        .collection("auditEvents")
        .where("resourceId", "==", parcelId)
        .get()
    ).size,
  ).toBe(1);
  const projected = (
    await db.doc(`customerShipments/${owner}-${parcelId}`).get()
  ).data()!;
  expect(projected.deliveryEstimate).toEqual(parcel.deliveryEstimate);
  expect(projected).not.toHaveProperty("evidence");
  expect(projected).not.toHaveProperty("actor");
  const own = await tracking.customerOrderTracking.run({
    auth: auth(owner),
    data: { orderId },
  } as CallableRequest);
  expect(own.estimate?.source).toBe("staff_aggregate");
  expect(own.shipments[0].deliveryEstimate?.freshness).toBe("current");
  expect(JSON.stringify(own)).not.toContain("Synthetic ETA evidence064");
  expect(JSON.stringify(own)).not.toContain(staff);
});
it("explicit null clears estimate, increments parcel only and preserves whole unknown", async () => {
  const current = generation,
    { db, run, command, invariant, tracking } = caseScope(current);
  await run(command());
  const before = await invariant();
  await run(
    command({ estimate: null, evidence: "Synthetic remove ETA064" }, 2),
  );
  expect(
    (await db.doc(`packages/${parcelId}`).get()).data(),
  ).not.toHaveProperty("deliveryEstimate");
  expect(
    (await db.doc(`customerShipments/${owner}-${parcelId}`).get()).data(),
  ).not.toHaveProperty("deliveryEstimate");
  expect(await invariant()).toEqual(before);
  expect(
    (
      await tracking.customerOrderTracking.run({
        auth: auth(owner),
        data: { orderId },
      } as CallableRequest)
    ).estimate,
  ).toBeNull();
});
it("CAS/order conflict and reused operation payload reject without effects", async () => {
  const current = generation,
    { db, run, command, invariant } = caseScope(current);
  const stale = command(undefined, 2),
    before = await invariant();
  await expect(run(stale)).rejects.toMatchObject({ code: "aborted" });
  expect(
    (await db.doc(`idempotencyKeys/${staff}-${stale.operationId}`).get())
      .exists,
  ).toBe(false);
  const data = command();
  await run(data);
  await expect(
    run({
      ...data,
      payload: { estimate: null, evidence: "Synthetic conflicting replay064" },
    }),
  ).rejects.toMatchObject({ code: "already-exists" });
  await expect(
    run({ ...command(undefined, 2), orderVersions: { [orderId]: 2 } }),
  ).rejects.toMatchObject({ code: "aborted" });
  expect(await invariant()).toEqual(before);
});
it.each(["WAREHOUSE", "FINANCE", "SUPPORT", "BUYER"])(
  "%s cannot record an ETA",
  async (role) => {
    const current = generation,
      { db, run, command, invariant } = caseScope(current);
    await db.doc(`staffAccess/${staff}`).update({ roles: [role] });
    const data = command(),
      before = await invariant();
    await expect(run(data)).rejects.toMatchObject({
      code: "permission-denied",
    });
    expect((await db.doc(`packages/${parcelId}`).get()).get("version")).toBe(1);
    expect(await invariant()).toEqual(before);
  },
);
it("current operations manager may record; locked owner and foreign customer may not", async () => {
  const current = generation,
    { db, run, command, tracking } = caseScope(current);
  await db
    .doc(`staffAccess/${staff}`)
    .update({ roles: ["OPERATIONS_MANAGER"] });
  await run(command());
  await db.doc(`users/${staff}`).update({ locked: true });
  await expect(run(command(undefined, 2))).rejects.toMatchObject({
    code: "permission-denied",
  });
  await expect(run(command(undefined, 2), auth(owner))).rejects.toMatchObject({
    code: "permission-denied",
  });
  await expect(
    tracking.customerOrderTracking.run({
      auth: auth(staff),
      data: { orderId },
    } as CallableRequest),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it.each(["packed", "delivered", "returned"])(
  "%s parcel cannot receive a future ETA",
  async (state) => {
    const current = generation,
      { db, run, command } = caseScope(current);
    await db.doc(`packages/${parcelId}`).update({ state });
    await expect(run(command())).rejects.toMatchObject({
      code: "failed-precondition",
    });
    expect((await db.doc(`packages/${parcelId}`).get()).get("version")).toBe(1);
  },
);
it("failed parcel shows needs-update without whole ETA; malformed/range/elapsed dates reject", async () => {
  const current = generation,
    { db, run, command, tracking } = caseScope(current);
  await db.doc(`packages/${parcelId}`).update({ state: "failed" });
  await run(command());
  const own = await tracking.customerOrderTracking.run({
    auth: auth(owner),
    data: { orderId },
  } as CallableRequest);
  expect(own.shipments[0].deliveryEstimate?.freshness).toBe("needs_update");
  expect(own.estimate).toBeNull();
  for (const estimate of [
    { startAt: Date.now() + 1000, endAt: Date.now() - 1 },
    { startAt: 1, endAt: 2 },
    { startAt: Date.now(), endAt: 8640000000000001 },
  ])
    await expect(
      run(command({ estimate, evidence: "Synthetic invalid ETA064" }, 2)),
    ).rejects.toMatchObject({ code: "failed-precondition" });
  await expect(
    run(command({ evidence: "Synthetic omitted estimate064" }, 2)),
  ).rejects.toMatchObject({ code: "failed-precondition" });
});
it("redacts mixed-owner parcel projections and denies cross-owner tracking", async () => {
  const current = generation,
    { db, run, command, tracking } = caseScope(current);
  const foreignOwner = owner + "-other",
    foreignOrder = orderId + "-other";
  const ownAllocation = { orderId, line: 0, quantity: 2 };
  const foreignAllocation = { orderId: foreignOrder, line: 0, quantity: 1 };
  for (const path of [
    `users/${foreignOwner}`,
    `orders/${foreignOrder}`,
    `packageAllocations/${foreignOrder}`,
    `customerShipments/${foreignOwner}-${parcelId}`,
  ])
    ownedPaths.add(path);
  await db.doc(`users/${foreignOwner}`).set({ locked: false });
  await db.doc(`orders/${foreignOrder}`).set({
    id: foreignOrder,
    ownerId: foreignOwner,
    version: 1,
    market: "US",
    stage: "IN_TRANSIT",
    items: [{ name: "Synthetic other item", quantity: 1 }],
    collected: 0,
    refunded: 0,
  });
  await db.doc(`packageAllocations/${foreignOrder}`).set({
    parcelIds: [parcelId],
    allocations: [foreignAllocation],
  });
  await db.doc(`packages/${parcelId}`).update({
    allocations: [ownAllocation, foreignAllocation],
  });
  const before = (await db.doc(`orders/${foreignOrder}`).get()).data();
  await run({
    ...command(),
    orderVersions: { [orderId]: 1, [foreignOrder]: 1 },
  });
  expect((await db.doc(`orders/${foreignOrder}`).get()).data()).toEqual(before);
  for (const [uid, selectedOrder, allocation, hiddenOwner, hiddenOrder] of [
    [owner, orderId, ownAllocation, foreignOwner, foreignOrder],
    [foreignOwner, foreignOrder, foreignAllocation, owner, orderId],
  ] as const) {
    const projection = (
      await db.doc(`customerShipments/${uid}-${parcelId}`).get()
    ).data()!;
    expect(projection.allocations).toEqual([allocation]);
    expect(projection).not.toHaveProperty("actor");
    expect(projection).not.toHaveProperty("evidence");
    const own = await tracking.customerOrderTracking.run({
      auth: auth(uid),
      data: { orderId: selectedOrder },
    } as CallableRequest);
    expect(own.estimate?.source).toBe("staff_aggregate");
    const serialized = JSON.stringify(own);
    expect(serialized).not.toContain(JSON.stringify(hiddenOwner));
    // The same parcel identifier is public to both owners; only foreign order data is private.
    expect(own.shipments[0]).not.toHaveProperty("allocations");
    expect(serialized).not.toContain(`"orderId":"${hiddenOrder}"`);
    expect(serialized).not.toContain("Synthetic ETA evidence064");
    await expect(
      tracking.customerOrderTracking.run({
        auth: auth(uid),
        data: { orderId: hiddenOrder },
      } as CallableRequest),
    ).rejects.toMatchObject({ code: "permission-denied" });
  }
});
it.each([true, false])(
  "consolidation preserves only validated canonical staff ETA (valid=%s)",
  async (valid) => {
    const current = generation,
      { db } = caseScope(current);
    const batchId = parcelId + "-batch",
      operationId = randomUUID();
    const identity = auth(staff);
    const estimate = {
      source: "staff",
      startAt: Date.now() + 3600000,
      endAt: Date.now() + 7200000,
      recordedAt: Date.now(),
    };
    ownedResources.add(batchId);
    ownedBatches.add(batchId);
    ownedPaths.add(`consolidationBatches/${batchId}`);
    ownedPaths.add(`idempotencyKeys/${staff}-${operationId}`);
    await db.doc(`orders/${orderId}`).update({
      stage: "READY_TO_SHIP",
      finalApproved: true,
      packingComplete: true,
      packedQuantity: 2,
      finalTotal: 240000,
      consolidatedFreight: { batchId, version: 1, amount: 0 },
      finalFreightVersion: 1,
    });
    // Legacy canonical metadata is seeded directly: ETA action itself cannot set a packed parcel.
    await db
      .doc(`packages/${parcelId}`)
      .update({
        state: "packed",
        batchId,
        deliveryEstimate: valid ? estimate : { ...estimate, actor: staff },
      });
    await db.doc(`consolidationBatches/${batchId}`).set({
      id: batchId,
      version: 1,
      state: "sealed",
      parcelIds: [parcelId],
      orderIds: [orderId],
      freight: 0,
      shares: { [orderId]: 0 },
      warehouse: "Synthetic ETA warehouse",
      route: "US-VN",
      hub: "Synthetic hub",
      service: "Synthetic service",
      cutoff: Date.now() + 86400000,
    });
    await tracked(current, () =>
      consolidation.consolidationCommand.run({
        auth: identity,
        data: {
          action: "dispatch",
          operationId,
          batchId,
          expectedVersion: 1,
          orderVersions: { [orderId]: 1 },
          parcelVersions: { [parcelId]: 1 },
          payload: {
            carrier: "Synthetic carrier",
            tracking: "SYNTHETIC064",
            handoffEvidence: "Synthetic handoff evidence",
          },
        },
      } as CallableRequest),
    );
    const projection = (
      await db.doc(`customerShipments/${owner}-${parcelId}`).get()
    ).data()!;
    expect(projection.state).toBe("in_transit");
    expect(projection.version).toBe(2);
    if (valid) expect(projection.deliveryEstimate).toEqual(estimate);
    else expect(projection).not.toHaveProperty("deliveryEstimate");
    expect(projection).not.toHaveProperty("actor");
    expect(projection).not.toHaveProperty("handoffEvidence");
    expect(
      (
        await db
          .collection("financialEntries")
          .where("orderId", "==", orderId)
          .get()
      ).empty,
    ).toBe(true);
    expect((await db.doc(`orders/${orderId}`).get()).data()).toMatchObject({
      stage: "IN_TRANSIT",
      collected: 240000,
      refunded: 0,
    });
  },
);
afterEach(async () => {
  generation++;
  await Promise.allSettled([...inFlight]);
  const queries = [
    ...[...ownedResources].flatMap((resourceId) =>
      ["auditEvents", "outboxJobs"].map((kind) =>
        db.collection(kind).where("resourceId", "==", resourceId),
      ),
    ),
    ...[...ownedBatches].map((batchId) =>
      db.collection("batchHandoffs").where("batchId", "==", batchId),
    ),
    db.collection(`packages/${parcelId}/events`),
  ];
  for (const query of queries) {
    const snapshot = await query.limit(401).get();
    if (snapshot.size > 400) throw Error("064_CLEANUP_QUERY_BOUND_EXCEEDED");
    for (const entry of snapshot.docs) ownedPaths.add(entry.ref.path);
  }
  const paths = [...ownedPaths];
  for (let offset = 0; offset < paths.length; offset += 400) {
    const chunk = paths.slice(offset, offset + 400),
      batch = db.batch();
    chunk.forEach((path) => batch.delete(db.doc(path)));
    await batch.commit();
    expect(
      (await db.getAll(...chunk.map((path) => db.doc(path)))).filter(
        (snapshot) => snapshot.exists,
      ),
    ).toHaveLength(0);
  }
  for (const query of queries)
    expect((await query.limit(1).get()).empty).toBe(true);
  ownedPaths.clear();
  ownedResources.clear();
  ownedBatches.clear();
});
afterAll(async () => {
  const errors: unknown[] = [];
  if (app) {
    try {
      await db.terminate();
    } catch (e) {
      errors.push(e);
    }
    try {
      await deleteApp(app);
    } catch (e) {
      errors.push(e);
    }
  }
  if (errors.length) throw new AggregateError(errors, "064 SDK cleanup failed");
});
