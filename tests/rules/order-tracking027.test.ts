import { initializeApp, deleteApp, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { beforeAll, beforeEach, afterAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

let db: ReturnType<typeof getFirestore>,
  service: typeof import("../../functions/src/customer-order-tracking");
const prefix = "tracking027-" + randomUUID(),
  uid = prefix + "-customer",
  other = prefix + "-foreign",
  id = prefix + "-order";
const auth = {
  uid,
  token: { email_verified: true, firebase: { sign_in_provider: "google.com" } },
};
function request(data: unknown = { orderId: id }, identity: unknown = auth) {
  return { auth: identity, data } as CallableRequest;
}
beforeAll(async () => {
  initializeApp({ projectId: "demo-tracking027-" + randomUUID().slice(0, 8) });
  db = getFirestore();
  service = await import("../../functions/src/customer-order-tracking");
});
beforeEach(async () => {
  await Promise.all([
    db.doc("users/" + uid).set({ locked: false }),
    db.doc("staffAccess/" + uid).set({ active: true, roles: ["OWNER"] }),
    db.doc("orders/" + id).set({
      id,
      ownerId: uid,
      version: 3,
      stage: "IN_TRANSIT",
      purchaseKind: "catalog",
      desiredAt: Date.now() + 86400000,
      notes: "PRIVATE",
      delivery: { phone: "PRIVATE" },
      hold: "PRIVATE HOLD",
    }),
    db.doc("packageAllocations/" + id).delete(),
  ]);
});
it("owner receives only safe fields, no desiredAt ETA, hold detail, address or ledger", async () => {
  await db
    .doc("financialEntries/" + prefix)
    .set({ orderId: id, amount: 1234, private: "PRIVATE" });
  const before = (await db.doc("orders/" + id).get()).data();
  const result = await service.customerOrderTracking.run(request());
  expect(result.orderId).toBe(id);
  expect(result.estimate).toBeNull();
  expect(result.onHold).toBe(true);
  expect(Object.keys(result).sort()).toEqual(
    [
      "orderId",
      "stage",
      "purchaseKind",
      "version",
      "onHold",
      "observedAt",
      "timeline",
      "timelinePartial",
      "shipments",
      "shipmentsPartial",
      "estimate",
    ].sort(),
  );
  expect(JSON.stringify(result)).not.toContain("PRIVATE");
  expect(result.shipmentsPartial).toBe(true);
  expect((await db.doc("orders/" + id).get()).data()).toEqual(before);
});
it("foreign/missing denial is identical even for active OWNER staff", async () => {
  await db.doc("orders/" + id).update({ ownerId: other });
  const foreign = await service.customerOrderTracking
    .run(request())
    .catch((e: Error & { code: string }) => ({
      code: e.code,
      message: e.message,
    }));
  const missing = await service.customerOrderTracking
    .run(request({ orderId: prefix + "-missing" }))
    .catch((e: Error & { code: string }) => ({
      code: e.code,
      message: e.message,
    }));
  expect(foreign).toEqual({
    code: "permission-denied",
    message: "Không thể truy cập đơn.",
  });
  expect(missing).toEqual(foreign);
});
it.each(["user", "staff"])("locked %s denies own order", async (kind) => {
  await db
    .doc((kind === "user" ? "users/" : "staffAccess/") + uid)
    .update({ locked: true });
  await expect(
    service.customerOrderTracking.run(request()),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
it("anonymous/unverified/nonGoogle and malformed request are denied", async () => {
  await expect(
    service.customerOrderTracking.run(request({})),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  await expect(
    service.customerOrderTracking.run(request({ orderId: id }, null)),
  ).rejects.toMatchObject({ code: "unauthenticated" });
  for (const token of [
    { email_verified: false, firebase: { sign_in_provider: "google.com" } },
    { email_verified: true, firebase: { sign_in_provider: "password" } },
  ])
    await expect(
      service.customerOrderTracking.run(
        request({ orderId: id }, { uid, token }),
      ),
    ).rejects.toMatchObject({ code: "permission-denied" });
  for (const data of [
    { orderId: "../private" },
    { orderId: "a".repeat(81) },
    { orderId: id, ownerId: other },
  ])
    await expect(
      service.customerOrderTracking.run(request(data)),
    ).rejects.toMatchObject({ code: "invalid-argument" });
});
it("all 34 associated parcels remain discoverable, mixed allocations never escape, one delivered parcel does not complete the order", async () => {
  const ids = Array.from({ length: 34 }, (_, i) => prefix + "-parcel-" + i);
  await db.doc("packageAllocations/" + id).set({ parcelIds: ids });
  const batch = db.batch();
  ids.forEach((pid, i) =>
    batch.set(db.doc("customerShipments/" + uid + "-" + pid), {
      id: pid,
      ownerId: uid,
      state: i === 0 ? "delivered" : "in_transit",
      route: "US-VN",
      allocations: [
        { orderId: id, line: 0, quantity: 1 },
        { orderId: other, line: 0, quantity: 1 },
      ],
      warehouse: "PRIVATE",
      internal: "PRIVATE",
    }),
  );
  await batch.commit();
  const result = await service.customerOrderTracking.run(request());
  expect(result.shipments).toHaveLength(34);
  expect(result.stage).toBe("IN_TRANSIT");
  expect(result.estimate).toBeNull();
  expect(JSON.stringify(result)).not.toContain(other);
  expect(JSON.stringify(result)).not.toContain("allocations");
  expect(JSON.stringify(result)).not.toContain("PRIVATE");
  expect(result.shipments[0]).not.toHaveProperty("updatedAt");
});
it("invalid/unassociated projections and oversized allocation IDs are omitted with partial disclosure", async () => {
  const parcel = prefix + "-wrong";
  await db.doc("packageAllocations/" + id).set({ parcelIds: [parcel] });
  await db.doc("customerShipments/" + uid + "-" + parcel).set({
    id: parcel,
    ownerId: other,
    state: "delivered",
    route: "PRIVATE",
    allocations: [{ orderId: other, line: 0, quantity: 1 }],
  });
  const result = await service.customerOrderTracking.run(request());
  expect(result.shipments).toEqual([]);
  expect(result.shipmentsPartial).toBe(true);
  await db
    .doc("packageAllocations/" + id)
    .set({ parcelIds: Array.from({ length: 61 }, (_, i) => "parcel-" + i) });
  expect(
    (await service.customerOrderTracking.run(request())).shipmentsPartial,
  ).toBe(true);
});
it("latest50 history is chronological and sanitized; malformed stage fails closed", async () => {
  const batch = db.batch();
  for (let i = 1; i <= 55; i++)
    batch.set(db.doc("orders/" + id + "/timeline/event-" + i), {
      action:
        i === 55 ? "PRIVATE" : i === 54 ? "approveFinal" : "recordPurchase",
      createdAt: i,
      actor: "PRIVATE",
      notes: "PRIVATE",
    });
  await batch.commit();
  const result = await service.customerOrderTracking.run(request());
  expect(result.timeline).toHaveLength(50);
  expect(result.timeline[0].createdAt).toBe(6);
  expect(result.timelinePartial).toBe(true);
  expect(result.timeline.at(-1)?.action).toBe("update");
  expect(result.timeline.at(-2)?.action).toBe("approveFinal");
  expect(JSON.stringify(result)).not.toContain("PRIVATE");
  await db.doc("orders/" + id).update({ stage: "UNKNOWN" });
  await expect(
    service.customerOrderTracking.run(request()),
  ).rejects.toMatchObject({ code: "failed-precondition" });
});
afterAll(async () => {
  await db.terminate();
  await deleteApp(getApp());
});
