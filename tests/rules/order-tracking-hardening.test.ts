import { demoFirestoreEndpoint } from "../helpers/demo-environment";
import { initializeApp, deleteApp, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, afterAll, expect, it } from "vitest";

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
  demoFirestoreEndpoint(process.env);
  initializeApp({ projectId: `demo-trackinghard-${randomUUID().slice(0, 8)}` });
  db = getFirestore();
  shipping = await import("../../functions/src/shipping");
  tracking = await import("../../functions/src/customer-order-tracking");
});
beforeEach(async () => {
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
  expect(value.shipments[0]).toMatchObject({
    state: "in_transit",
    tracking: "SYNTHETIC-TRACK",
  });
  expect(value.shipments[0].updatedAt).toBeLessThanOrEqual(value.observedAt);
});
afterAll(async () => {
  // Only this randomly named test project; includes generated audit/idempotency/notification records.
  if (db) {
    for (const collection of await db.listCollections())
      await db.recursiveDelete(collection);
    await db.terminate();
  }
  if (getApps().length) await deleteApp(getApp());
});
