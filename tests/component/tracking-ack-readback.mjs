/* global console */
import process from "node:process";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
assert.equal(process.env.GCLOUD_PROJECT, "demo-satsunicgo");
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:18207");
const fixture = JSON.parse(
  readFileSync("test-results/tracking-real/fixture.json"),
);
assert.ok(fixture.owner.sub.startsWith("tracking-qa-owner-"));
const app = initializeApp({ projectId: "demo-satsunicgo" });
try {
  const db = getFirestore();
  const order = (await db.doc(`orders/${fixture.orderId}`).get()).data();
  const parcel = (await db.doc(`packages/${fixture.parcelId}`).get()).data();
  const history = await db
    .collection(`orders/${fixture.orderId}/timeline`)
    .get();
  const expectedVersion = Number(process.argv[3]);
  assert.equal(order.ownerId, fixture.owner.uid);
  assert.equal(order.version, expectedVersion);
  assert.equal(parcel.version, expectedVersion);
  assert.equal(history.size, expectedVersion - 1);
  assert.equal(order.collected, 240000);
  assert.equal(order.refunded, 0);
  const value = {
    label: process.argv[2],
    orderVersion: order.version,
    parcelVersion: parcel.version,
    events: history.size,
    collected: order.collected,
    refunded: order.refunded,
    observedAt: Date.now(),
  };
  writeFileSync(
    `test-results/tracking-real/ack-${process.argv[2]}.json`,
    JSON.stringify(value, null, 2),
  );
  console.log(JSON.stringify(value));
} finally {
  await deleteApp(app);
}
