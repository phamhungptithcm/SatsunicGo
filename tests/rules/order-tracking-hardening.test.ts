import { initializeApp, deleteApp, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { randomUUID } from "node:crypto";
import { profileTransaction } from "../helpers/tracking-transaction-profile";
import { beforeAll, beforeEach, afterAll, expect, it, vi } from "vitest";

vi.mock("firebase-admin/app", async (original) => {
  const actual = await original<typeof import("firebase-admin/app")>();
  return {
    ...actual,
    initializeApp: (...args: Parameters<typeof actual.initializeApp>) =>
      actual.getApps().length ? actual.getApp() : actual.initializeApp(...args),
  };
});

// Real source transactions; synthetic identities, unique emulator project, no shared baseline writes.
let db: ReturnType<typeof getFirestore>;
let shipping: typeof import("../../functions/src/shipping");
let tracking: typeof import("../../functions/src/customer-order-tracking");
const staff = "operator",
  owner = "customer",
  orderId = "order";
const auth = (uid: string) => ({
  uid,
  token: { email_verified: true, firebase: { sign_in_provider: "google.com" } },
});
const request = (data: unknown, uid = staff) =>
  ({ data, auth: auth(uid) }) as CallableRequest;
const read = () =>
  tracking.customerOrderTracking.run(request({ orderId }, owner));
async function command(
  action: string,
  payload: unknown,
  parcelId = "p1",
  expectedVersion = 1,
) {
  return {
    action,
    parcelId,
    payload,
    expectedVersion,
    operationId: randomUUID(),
    orderVersions: {
      [orderId]: (await db.doc(`orders/${orderId}`).get()).get("version"),
    },
  };
}
const run = (data: unknown, uid = staff) =>
  shipping.shippingCommand.run(request(data, uid));
async function state() {
  const [order, p1, p2] = await Promise.all(
    ["orders/order", "packages/p1", "packages/p2"].map((path) =>
      db.doc(path).get(),
    ),
  );
  return [order.data(), p1.data(), p2.data()];
}
beforeAll(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207")
    throw Error("Shared emulator required, unique project only");
  initializeApp({ projectId: `demo-trackinghard-${randomUUID().slice(0, 8)}` });
  db = getFirestore();
  shipping = await import("../../functions/src/shipping");
  tracking = await import("../../functions/src/customer-order-tracking");
});
beforeEach(async () => {
  for (const collection of await db.listCollections())
    await db.recursiveDelete(collection);
  const batch = db.batch();
  batch.set(db.doc(`users/${staff}`), { locked: false });
  batch.set(db.doc(`users/${owner}`), { locked: false });
  batch.set(db.doc(`staffAccess/${staff}`), { active: true, roles: ["OWNER"] });
  batch.set(db.doc(`orders/${orderId}`), {
    id: orderId,
    ownerId: owner,
    version: 1,
    market: "US",
    stage: "IN_TRANSIT",
    purchaseKind: "catalog",
    items: [{ name: "Synthetic parcel item", quantity: 2 }],
    collected: 240000,
    refunded: 0,
  });
  const allocations = ["p1", "p2"].map(() => ({
    orderId,
    line: 0,
    quantity: 1,
  }));
  batch.set(db.doc(`packageAllocations/${orderId}`), {
    parcelIds: ["p1", "p2"],
    allocations,
  });
  for (const [i, id] of ["p1", "p2"].entries()) {
    const parcel = {
      id,
      version: 1,
      state: "in_transit",
      allocations: [allocations[i]],
      route: "US-VN",
      warehouse: "Synthetic warehouse",
      weightGrams: 500,
    };
    batch.set(db.doc(`packages/${id}`), parcel);
    batch.set(db.doc(`customerShipments/${owner}-${id}`), {
      ...parcel,
      ownerId: owner,
    });
  }
  await batch.commit();
});
it("records real ETA and activity time, exact replay creates no duplicate activity, changed replay/conflicting versions fail without writes", async () => {
  const start = Date.now();
  const data = await command("setDeliveryEstimate", {
    estimate: { startAt: start + 3600000, endAt: start + 7200000 },
    evidence: "Synthetic carrier window",
  });
  await run(data);
  const value = await read();
  expect(
    value.shipments.find((p) => p.id === "p1")?.updatedAt,
  ).toBeGreaterThanOrEqual(start);
  expect(value.estimate).toBeNull(); // Second outstanding parcel has no ETA.
  const before = await state();
  const events = await db.collection("packages/p1/events").get();
  await run(data);
  expect(await state()).toEqual(before);
  expect((await db.collection("packages/p1/events").get()).size).toBe(
    events.size,
  );
  await expect(
    run({
      ...data,
      payload: { estimate: null, evidence: "Different operation body" },
    }),
  ).rejects.toMatchObject({ code: "already-exists" });
  await expect(
    run({ ...data, operationId: randomUUID() }),
  ).rejects.toMatchObject({ code: "aborted" });
  expect(await state()).toEqual(before);
  await run(await command("setDeliveryEstimate", data.payload, "p2"));
  expect((await read()).estimate?.source).toBe("staff_aggregate");
  expect((await db.doc("orders/order").get()).get("collected")).toBe(240000);
  expect((await db.collection("financialEntries").get()).empty).toBe(true);
});
it("failed delivery suppresses order promise; retry restores it; one delivered parcel does not complete order, all parcels do", async () => {
  const payload = {
    estimate: { startAt: Date.now() + 3600000, endAt: Date.now() + 7200000 },
    evidence: "Synthetic window",
  };
  for (const id of ["p1", "p2"])
    await run(await command("setDeliveryEstimate", payload, id));
  await run(
    await command(
      "trackParcel",
      { state: "failed", event: "Delivery address unavailable" },
      "p1",
      2,
    ),
  );
  expect((await read()).estimate).toBeNull();
  expect(
    (await read()).shipments.find((p) => p.id === "p1")?.deliveryEstimate
      ?.freshness,
  ).toBe("needs_update");
  await run(
    await command(
      "trackParcel",
      { state: "in_transit", event: "Delivery retry underway" },
      "p1",
      3,
    ),
  );
  expect((await read()).estimate).not.toBeNull();
  await run(
    await command(
      "trackParcel",
      { state: "delivered", event: "Recipient received first parcel" },
      "p1",
      4,
    ),
  );
  expect((await read()).stage).toBe("IN_TRANSIT");
  await run(
    await command(
      "trackParcel",
      { state: "delivered", event: "Recipient received second parcel" },
      "p2",
      2,
    ),
  );
  expect((await read()).stage).toBe("DELIVERED");
  expect((await read()).estimate).toBeNull();
});
it("returned parcel remains terminal and cannot be silently reopened", async () => {
  await run(
    await command("trackParcel", {
      state: "returned",
      event: "Returned to origin warehouse",
    }),
  );
  const before = await state();
  await expect(
    run(
      await command(
        "trackParcel",
        { state: "in_transit", event: "Invalid reopen" },
        "p1",
        2,
      ),
    ),
  ).rejects.toBeDefined();
  expect(await state()).toEqual(before);
  expect((await read()).estimate).toBeNull();
});
it.each(["CUSTOMER", "WAREHOUSE", "locked-user", "locked-staff", "inactive"])(
  "%s cannot alter delivery ETA or money",
  async (role) => {
    if (role === "locked-user")
      await db.doc(`users/${staff}`).update({ locked: true });
    else if (role === "locked-staff")
      await db.doc(`staffAccess/${staff}`).update({ locked: true });
    else
      await db
        .doc(`staffAccess/${staff}`)
        .update(role === "inactive" ? { active: false } : { roles: [role] });
    const before = await state();
    await expect(
      run(
        await command("setDeliveryEstimate", {
          estimate: null,
          evidence: "Attempted unauthorized change",
        }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(await state()).toEqual(before);
  },
);
it.each([
  { estimate: { startAt: 1, endAt: 2 }, evidence: "Expired window" },
  {
    estimate: { startAt: Date.now() + 7200000, endAt: Date.now() + 3600000 },
    evidence: "Reversed window",
  },
  { estimate: null, evidence: "" },
  { estimate: null, evidence: "Synthetic evidence", actor: "forged" },
])(
  "invalid ETA payload leaves both parcels and order unchanged",
  async (payload) => {
    const before = await state();
    await expect(
      run(await command("setDeliveryEstimate", payload)),
    ).rejects.toBeDefined();
    expect(await state()).toEqual(before);
  },
);
it("packing then dispatch enforces payment and hold guards and publishes real activity", async () => {
  await db.doc("packageAllocations/order").delete();
  await db.doc("orders/order").update({
    stage: "READY_TO_SHIP",
    packingComplete: true,
    packedQuantity: 2,
    finalApproved: true,
    finalTotal: 240000,
    catalogSnapshot: { total: 240000 },
  });
  await run(
    await command(
      "packParcel",
      {
        allocations: [{ orderId, line: 0, quantity: 2 }],
        weightGrams: 500,
        warehouse: "Synthetic origin",
        route: "US-VN",
        dimensionsCm: [10, 20, 30],
        checklist: true,
        evidence: "Synthetic packing evidence",
      },
      "new-parcel",
    ),
  );
  expect((await read()).shipments[0].updatedAt).toBeTypeOf("number");
  const payload = {
    carrier: "Synthetic carrier",
    tracking: "SYNTHETIC-TRACK",
    handoffEvidence: "Synthetic carrier handoff",
  };
  for (const delta of [{ hold: "Inspection" }, { hold: "", collected: 1 }]) {
    await db.doc("orders/order").update(delta);
    const before = await state();
    await expect(
      run(await command("dispatchParcel", payload, "new-parcel")),
    ).rejects.toBeDefined();
    expect(await state()).toEqual(before);
    expect((await db.doc("packages/new-parcel").get()).get("state")).toBe(
      "packed",
    );
  }
  await db.doc("orders/order").update({ collected: 240000 });
  await run(await command("dispatchParcel", payload, "new-parcel"));
  const value = await read();
  expect(value.stage).toBe("IN_TRANSIT");
  expect(value.timeline.at(-1)?.action).toBe("parcelDispatch");
  expect(value.timeline.at(-1)?.createdAt).toBe(value.shipments[0].updatedAt);
  expect(value.version).toBe(3); // pack and dispatch each publish one revision.
  expect(value.shipments[0]).toMatchObject({
    state: "in_transit",
    tracking: "SYNTHETIC-TRACK",
  });
  expect(value.shipments[0].updatedAt).toBeLessThanOrEqual(value.observedAt);
});

async function latestCommand(
  action: string,
  payload: unknown,
  parcelId = "p1",
) {
  return command(
    action,
    payload,
    parcelId,
    (await db.doc(`packages/${parcelId}`).get()).get("version"),
  );
}
it("H03 H04 H10 N11 N27 atomic ETA revision/event and replay preserve dispatch timestamp", async () => {
  const { trackingMilestoneUpdates } =
    await import("../../packages/domain/order-tracking");
  const start = Date.now();
  await db
    .doc("orders/order/timeline/real-dispatch")
    .create({ action: "parcelDispatch", createdAt: start - 1000 });
  const before = await read();
  const data = await latestCommand("setDeliveryEstimate", {
    estimate: { startAt: start + 3600000, endAt: start + 7200000 },
    evidence: "PRIVATE_CANARY estimate evidence",
  });
  await run(data);
  const after = await read();
  expect(after.version).toBe(before.version + 1);
  expect(
    after.timeline.filter((e) => e.action === "deliveryEstimateUpdated"),
  ).toHaveLength(1);
  expect(JSON.stringify(after)).not.toContain("PRIVATE_CANARY");
  expect(trackingMilestoneUpdates(after, "vi")).toEqual(
    trackingMilestoneUpdates(before, "vi"),
  );
  await run(data);
  expect((await read()).version).toBe(after.version);
  expect((await read()).timeline).toEqual(after.timeline);
  await run(
    await latestCommand("setDeliveryEstimate", {
      estimate: null,
      evidence: "Remove outdated estimate",
    }),
  );
  expect((await read()).version).toBe(after.version + 1);
  expect(
    (await db.doc("customerShipments/customer-p1").get()).get(
      "deliveryEstimate",
    ),
  ).toBeUndefined();
});
it("H07 partial scan publishes revision; only final quantity delivery gets delivery milestone", async () => {
  const before = await read();
  await run(
    await latestCommand("trackParcel", {
      state: "delivered",
      event: "PRIVATE_CANARY first parcel",
    }),
  );
  const partial = await read();
  expect(partial.version).toBe(before.version + 1);
  expect(partial.stage).toBe("IN_TRANSIT");
  expect(partial.timeline.at(-1)?.action).toBe("parcelProgress");
  await run(
    await latestCommand(
      "trackParcel",
      { state: "delivered", event: "Second parcel delivered" },
      "p2",
    ),
  );
  const full = await read();
  expect(full.version).toBe(partial.version + 1);
  expect(full.stage).toBe("DELIVERED");
  expect(full.timeline.at(-1)?.action).toBe("parcelDelivered");
  const { projectPublicTracking } =
    await import("../../packages/domain/public-order-tracking");
  const order = (await db.doc("orders/order").get()).data()!;
  const p = projectPublicTracking({
    orderId,
    order,
    allocation: (await db.doc("packageAllocations/order").get()).data(),
    parcels: await Promise.all(
      ["p1", "p2"].map(async (id) =>
        (await db.doc(`packages/${id}`).get()).data(),
      ),
    ),
    projections: await Promise.all(
      ["p1", "p2"].map(async (id) =>
        (await db.doc(`customerShipments/customer-${id}`).get()).data(),
      ),
    ),
    timeline: full.timeline,
    observedAt: Date.now(),
  });
  expect(p.publicStatus).toBe("delivered");
  expect(p.updatedAt).toBe(full.timeline.at(-1)?.createdAt);
  expect(Object.keys(p).sort()).toEqual([
    "eta",
    "observedAt",
    "publicStatus",
    "updatedAt",
  ]);
});
it("N14 P04 concurrent operators cannot lose a revision or duplicate timeline", async () => {
  const data = await latestCommand("trackParcel", {
    state: "in_transit",
    event: "Synthetic checkpoint",
  });
  const result = await profileTransaction(db, "P04 concurrent staff", () =>
    Promise.allSettled([
      run(data),
      run({ ...data, operationId: randomUUID() }),
    ]),
  );
  expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect((await read()).version).toBe(2);
  expect((await read()).timeline).toHaveLength(1);
  expect((await db.doc("packages/p1").get()).get("version")).toBe(2);
});
it.each(["WAREHOUSE", "CUSTOMER", "FINANCE"])(
  "N01 N02 %s cannot update ETA or journey",
  async (role) => {
    await db.doc("staffAccess/operator").update({ roles: [role] });
    const before = await state();
    await expect(
      run(
        await latestCommand("setDeliveryEstimate", {
          estimate: null,
          evidence: "Synthetic remove estimate",
        }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
    expect(await state()).toEqual(before);
    expect((await read()).timeline).toHaveLength(0);
  },
);
it.each(["locked-user", "locked-staff", "revoked", "anonymous"])(
  "N01 %s denied with no transaction effects",
  async (mode) => {
    if (mode === "locked-user")
      await db.doc("users/operator").update({ locked: true });
    if (mode === "locked-staff")
      await db.doc("staffAccess/operator").update({ locked: true });
    if (mode === "revoked")
      await db.doc("staffAccess/operator").update({ active: false });
    const before = await state();
    const data = await latestCommand("trackParcel", {
      state: "in_transit",
      event: "Synthetic checkpoint",
    });
    await expect(
      mode === "anonymous"
        ? shipping.shippingCommand.run({ data } as CallableRequest)
        : run(data),
    ).rejects.toBeDefined();
    expect(await state()).toEqual(before);
    expect((await read()).timeline).toHaveLength(0);
  },
);
it.each([
  { startAt: 3, endAt: 1 },
  { startAt: 1, endAt: 2 },
  { startAt: NaN, endAt: Infinity },
])("N07 invalid estimate writes no event/revision %s", async (estimate) => {
  const before = await state();
  await expect(
    run(
      await latestCommand("setDeliveryEstimate", {
        estimate,
        evidence: "Synthetic invalid estimate",
      }),
    ),
  ).rejects.toBeDefined();
  expect(await state()).toEqual(before);
  expect((await read()).timeline).toHaveLength(0);
});
it("N12 N13 conflict and changed replay write nothing, including safe timeline", async () => {
  const d = await latestCommand("trackParcel", {
    state: "in_transit",
    event: "Synthetic checkpoint",
  });
  await run(d);
  const before = await state();
  const history = (await read()).timeline;
  await expect(
    run({ ...d, payload: { state: "failed", event: "Changed operation" } }),
  ).rejects.toMatchObject({ code: "already-exists" });
  await expect(run({ ...d, operationId: randomUUID() })).rejects.toMatchObject({
    code: "aborted",
  });
  expect(await state()).toEqual(before);
  expect((await read()).timeline).toEqual(history);
});
it("N16 response lost after commit reconciles same operation once", async () => {
  const data = await latestCommand("trackParcel", {
    state: "in_transit",
    event: "Synthetic checkpoint",
  });
  await run(data); // response deliberately discarded
  const before = await state();
  await run(data);
  expect(await state()).toEqual(before);
  expect((await read()).timeline).toHaveLength(1);
});

it("N15 transaction write collision rolls back all canonical/projection/history/version writes", async () => {
  await db
    .doc("outboxJobs/parcel-p1-2-customer")
    .create({ state: "synthetic-collision" });
  const before = await state();
  const projection = (
    await db.doc("customerShipments/customer-p1").get()
  ).data();
  await expect(
    run(
      await latestCommand("trackParcel", {
        state: "in_transit",
        event: "Synthetic checkpoint",
      }),
    ),
  ).rejects.toBeDefined();
  expect(await state()).toEqual(before);
  expect((await db.doc("customerShipments/customer-p1").get()).data()).toEqual(
    projection,
  );
  expect((await read()).timeline).toHaveLength(0);
});
it("H08 two owners in a shared parcel receive only their own allocations", async () => {
  const order = (await db.doc("orders/order").get()).data()!;
  await db.doc("orders/other").set({
    ...order,
    id: "other",
    ownerId: "other-customer",
    items: [{ name: "Other synthetic item", quantity: 1 }],
  });
  await db.doc("users/other-customer").set({ locked: false });
  await db.doc("packages/p1").update({
    allocations: [
      { orderId, line: 0, quantity: 1 },
      { orderId: "other", line: 0, quantity: 1 },
    ],
  });
  await db.doc("packageAllocations/other").set({
    parcelIds: ["p1"],
    allocations: [{ orderId: "other", line: 0, quantity: 1 }],
  });
  const d = await latestCommand("trackParcel", {
    state: "in_transit",
    event: "PRIVATE_CANARY shared checkpoint",
  });
  await run({ ...d, orderVersions: { ...d.orderVersions, other: 1 } });
  expect((await db.doc("orders/other").get()).get("version")).toBe(2);
  const a = (await db.doc("customerShipments/customer-p1").get()).data()!,
    b = (await db.doc("customerShipments/other-customer-p1").get()).data()!;
  expect(a.allocations.map((v: { orderId: string }) => v.orderId)).toEqual([
    "order",
  ]);
  expect(b.allocations.map((v: { orderId: string }) => v.orderId)).toEqual([
    "other",
  ]);
  expect(JSON.stringify(await read())).not.toContain("PRIVATE_CANARY");
});
it("H09 batch dispatch publishes one order event/revision and timestamp parity", async () => {
  const consolidation = await import("../../functions/src/consolidation");
  await db.doc("orders/order").update({
    stage: "READY_TO_SHIP",
    packingComplete: true,
    packedQuantity: 2,
    finalApproved: true,
    finalTotal: 240000,
    catalogSnapshot: { total: 240000 },
    consolidatedFreight: { batchId: "b1", version: 1, share: 0 },
    finalFreightVersion: 1,
  });
  for (const id of ["p1", "p2"])
    await db.doc(`packages/${id}`).update({ state: "packed", batchId: "b1" });
  await db.doc("consolidationBatches/b1").set({
    id: "b1",
    version: 1,
    state: "sealed",
    parcelIds: ["p1", "p2"],
    orderIds: [orderId],
    freight: 0,
    shares: { order: 0 },
    warehouse: "Synthetic warehouse",
    route: "US-VN",
    hub: "Synthetic hub",
    service: "Synthetic service",
    cutoff: Date.now() + 3600000,
  });
  const data = {
    action: "dispatch",
    batchId: "b1",
    operationId: randomUUID(),
    expectedVersion: 1,
    orderVersions: { order: 1 },
    parcelVersions: { p1: 1, p2: 1 },
    payload: {
      carrier: "Synthetic carrier",
      tracking: "SYNTHETIC",
      handoffEvidence: "PRIVATE_CANARY batch evidence",
    },
  };
  await consolidation.consolidationCommand.run(request(data));
  const value = await read();
  expect(value.version).toBe(2);
  expect(value.timeline).toHaveLength(1);
  expect(value.timeline[0].action).toBe("parcelDispatch");
  expect(
    value.shipments.every((p) => p.updatedAt === value.timeline[0].createdAt),
  ).toBe(true);
  await consolidation.consolidationCommand.run(request(data));
  expect((await read()).version).toBe(2);
  expect((await read()).timeline).toHaveLength(1);
  expect(JSON.stringify(value)).not.toContain("PRIVATE_CANARY");
});
afterAll(async () => {
  // Only this randomly named test project; includes generated audit/idempotency/notification records.
  if (db) {
    for (const collection of await db.listCollections())
      await db.recursiveDelete(collection);
    await db.terminate();
  }
  await deleteApp(getApp());
});

it("H10 N06 parcel receipt checks canonical quantities, not a fabricated order tracking number", async () => {
  const { command: business } = await import("../../functions/src/index");
  await db.doc("orders/order").update({
    stage: "DELIVERED",
    catalogSnapshot: { total: 240000 },
    finalTotal: 240000,
    finalApproved: true,
    packingComplete: true,
    packedQuantity: 2,
  });
  async function confirm(uid = owner, payload: unknown = { received: true }) {
    const version = (await db.doc("orders/order").get()).get("version");
    return business.run(
      request(
        {
          action: "confirmReceipt",
          orderId,
          expectedVersion: version,
          operationId: randomUUID(),
          payload,
        },
        uid,
      ),
    );
  }
  const before = await state();
  await expect(confirm()).rejects.toMatchObject({
    code: "failed-precondition",
  });
  expect(await state()).toEqual(before);
  await db.doc("packages/p1").update({ state: "delivered" });
  await expect(confirm()).rejects.toMatchObject({
    code: "failed-precondition",
  });
  await db.doc("packages/p2").update({ state: "delivered" });
  await expect(confirm(staff)).rejects.toMatchObject({
    code: "permission-denied",
  });
  await expect(
    confirm(owner, { received: true, parcelDeliveryConfirmed: true }),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  await confirm();
  expect((await db.doc("orders/order").get()).data()).toMatchObject({
    stage: "COMPLETED",
    version: 2,
    collected: 240000,
  });
  expect((await db.doc("orders/order").get()).get("tracking")).toBeUndefined();
  expect(
    (await read()).timeline.some((e) => e.action === "confirmReceipt"),
  ).toBe(true);
});
it.each([1, 10, 1, 10, 1, 10])(
  "P01 %s affected orders publish bounded revisions atomically",
  async (count) => {
    const seed = db.batch(),
      ids = Array.from({ length: count }, (_, i) => "bounded-order-" + i),
      base = (await db.doc("orders/order").get()).data()!;
    const allocations = ids.map((id) => ({
      orderId: id,
      line: 0,
      quantity: 1,
    }));
    for (const id of ids) {
      seed.set(db.doc("orders/" + id), {
        ...base,
        id,
        items: [{ name: "Synthetic", quantity: 1 }],
      });
      seed.set(db.doc("packageAllocations/" + id), {
        parcelIds: ["bounded-parcel"],
        allocations: allocations.filter((a) => a.orderId === id),
      });
    }
    seed.set(db.doc("packages/bounded-parcel"), {
      id: "bounded-parcel",
      version: 1,
      state: "in_transit",
      allocations,
      warehouse: "Synthetic",
      route: "US-VN",
      weightGrams: 1000,
    });
    await seed.commit();
    const begin = performance.now();
    await profileTransaction(db, `P01 orders=${count}`, () =>
      run({
        action: "setDeliveryEstimate",
        parcelId: "bounded-parcel",
        expectedVersion: 1,
        orderVersions: Object.fromEntries(ids.map((id) => [id, 1])),
        operationId: randomUUID(),
        payload: {
          estimate: {
            startAt: Date.now() + 3600000,
            endAt: Date.now() + 7200000,
          },
          evidence: "Synthetic bounded test",
        },
      }),
    );
    for (const id of ids) {
      expect((await db.doc("orders/" + id).get()).get("version")).toBe(2);
      expect(
        (await db.collection("orders/" + id + "/timeline").get()).size,
      ).toBe(1);
    }
    console.info(
      JSON.stringify({
        scenario: "P01",
        orders: count,
        elapsedMs: Math.round(performance.now() - begin),
        environment: "local emulator only",
      }),
    );
  },
);
it.each([1, 20, 1, 20, 1, 20])(
  "P01 %s batch parcels preserve bounded dispatch parity",
  async (count) => {
    const consolidation = await import("../../functions/src/consolidation");
    const ids = Array.from({ length: count }, (_, i) => "batch-parcel-" + i),
      seed = db.batch();
    seed.update(db.doc("orders/order"), {
      stage: "READY_TO_SHIP",
      items: [{ name: "Synthetic", quantity: count }],
      packingComplete: true,
      packedQuantity: count,
      finalApproved: true,
      finalTotal: 240000,
      catalogSnapshot: { total: 240000 },
      consolidatedFreight: { batchId: "bounded-batch", version: 1, amount: 0 },
      finalFreightVersion: 1,
    });
    seed.set(db.doc("packageAllocations/order"), {
      parcelIds: ids,
      allocations: ids.map(() => ({ orderId, line: 0, quantity: 1 })),
    });
    for (const id of ids)
      seed.set(db.doc("packages/" + id), {
        id,
        version: 1,
        state: "packed",
        batchId: "bounded-batch",
        allocations: [{ orderId, line: 0, quantity: 1 }],
        warehouse: "Synthetic",
        route: "US-VN",
        weightGrams: 500,
      });
    seed.set(db.doc("consolidationBatches/bounded-batch"), {
      id: "bounded-batch",
      version: 1,
      state: "sealed",
      parcelIds: ids,
      orderIds: [orderId],
      freight: 0,
      shares: { order: 0 },
      warehouse: "Synthetic",
      route: "US-VN",
      hub: "Synthetic hub",
      service: "Synthetic service",
      cutoff: Date.now() + 3600000,
    });
    await seed.commit();
    const begin = performance.now();
    await profileTransaction(db, `P01 batchParcels=${count}`, () =>
      consolidation.consolidationCommand.run(
        request({
          action: "dispatch",
          batchId: "bounded-batch",
          expectedVersion: 1,
          operationId: randomUUID(),
          orderVersions: { order: 1 },
          parcelVersions: Object.fromEntries(ids.map((id) => [id, 1])),
          payload: {
            carrier: "Synthetic",
            tracking: "SYNTHETIC",
            handoffEvidence: "Synthetic bounded batch",
          },
        }),
      ),
    );
    const value = await read();
    expect(value.version).toBe(2);
    expect(value.timeline).toHaveLength(1);
    expect(value.shipments).toHaveLength(count);
    expect(
      value.shipments.every((p) => p.updatedAt === value.timeline[0].createdAt),
    ).toBe(true);
    console.info(
      JSON.stringify({
        scenario: "P01",
        batchParcels: count,
        elapsedMs: Math.round(performance.now() - begin),
        environment: "local emulator only",
      }),
    );
  },
);
it.each([
  ["email", false],
  ["password", true],
])("N01 staff credential %s/%s never publishes", async (provider, verified) => {
  const before = await state(),
    data = await command("setDeliveryEstimate", {
      estimate: null,
      evidence: "Synthetic",
    });
  await expect(
    shipping.shippingCommand.run({
      data,
      auth: {
        uid: staff,
        token: {
          email_verified: verified,
          firebase: { sign_in_provider: provider },
        },
      },
    } as CallableRequest),
  ).rejects.toMatchObject({ code: "permission-denied" });
  expect(await state()).toEqual(before);
  expect((await db.collection("orders/order/timeline").get()).empty).toBe(true);
});
it("N02 operations manager cannot pack even when manipulating the command payload", async () => {
  await db
    .doc("staffAccess/" + staff)
    .update({ roles: ["OPERATIONS_MANAGER"] });
  const before = await state();
  await expect(
    run({
      action: "packParcel",
      operationId: randomUUID(),
      orderVersions: { order: 1 },
      payload: {
        allocations: [{ orderId, line: 0, quantity: 1 }],
        weightGrams: 500,
        dimensionsCm: [10, 10, 10],
        warehouse: "Synthetic",
        route: "US-VN",
        checklist: true,
        evidence: "Synthetic",
      },
    }),
  ).rejects.toMatchObject({ code: "permission-denied" });
  expect(await state()).toEqual(before);
});
it("N14 financial/order mutation racing a parcel revision preserves money and exactly one authoritative winner", async () => {
  const { command: business } = await import("../../functions/src/index");
  await db.doc("orders/order").update({ acceptedAt: Date.now() });
  const eta = await command("setDeliveryEstimate", {
    estimate: null,
    evidence: "Synthetic concurrent window",
  });
  const results = await profileTransaction(
    db,
    "P04 concurrent finance/shipping",
    () =>
      Promise.allSettled([
        run(eta),
        business.run(
          request({
            action: "verifyTransfer",
            orderId,
            expectedVersion: 1,
            operationId: randomUUID(),
            payload: {
              amount: 100,
              bankTransactionId: randomUUID(),
              evidence: "Synthetic verified test receipt",
              reason: "Synthetic concurrency test",
            },
          }),
        ),
      ]),
  );
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(
    (results.find((r) => r.status === "rejected") as PromiseRejectedResult)
      .reason.code,
  ).toBe("aborted");
  const value = (await db.doc("orders/order").get()).data()!;
  expect(value.version).toBe(2);
  const ledger = await db.collection("financialEntries").get();
  expect(value.collected).toBe(240000 + (ledger.empty ? 0 : 100));
  expect((await db.collection("orders/order/timeline").get()).size).toBe(1);
});
it.each([
  { allocations: [{ orderId, line: 0, quantity: 3 }] },
  { allocations: [{ orderId, line: 1, quantity: 1 }] },
  {
    allocations: [
      { orderId, line: 0, quantity: 1 },
      { orderId, line: 0, quantity: 2 },
    ],
  },
  { allocations: [{ orderId: "missing-order", line: 0, quantity: 1 }] },
])(
  "N05 invalid allocation %j leaves registry and history unchanged",
  async ({ allocations }) => {
    await db
      .doc("orders/order")
      .update({ packingComplete: true, packedQuantity: 2 });
    const before = await state(),
      registry = (await db.doc("packageAllocations/order").get()).data();
    await expect(
      run({
        action: "packParcel",
        parcelId: "invalid-parcel",
        operationId: randomUUID(),
        orderVersions: { order: 1 },
        payload: {
          allocations,
          weightGrams: 500,
          dimensionsCm: [10, 10, 10],
          warehouse: "Synthetic",
          route: "US-VN",
          checklist: true,
          evidence: "Synthetic",
        },
      }),
    ).rejects.toBeDefined();
    expect(await state()).toEqual(before);
    expect((await db.doc("packages/invalid-parcel").get()).exists).toBe(false);
    expect((await db.doc("packageAllocations/order").get()).data()).toEqual(
      registry,
    );
    expect((await db.collection("orders/order/timeline").get()).empty).toBe(
      true,
    );
  },
);
it("N04 unapproved final cost cannot dispatch or publish a milestone", async () => {
  await db.doc("orders/order").update({
    stage: "READY_TO_SHIP",
    packingComplete: true,
    packedQuantity: 2,
    finalApproved: false,
    finalTotal: 240000,
    catalogSnapshot: { total: 240000 },
  });
  await db.doc("packages/p1").update({ state: "packed" });
  const before = await state();
  await expect(
    run(
      await command("dispatchParcel", {
        carrier: "Synthetic",
        tracking: "SYNTHETIC",
        handoffEvidence: "Synthetic",
      }),
    ),
  ).rejects.toBeDefined();
  expect(await state()).toEqual(before);
  expect((await db.collection("orders/order/timeline").get()).empty).toBe(true);
});
