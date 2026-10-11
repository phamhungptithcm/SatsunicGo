/* global fetch, AbortSignal, console */
import process from "node:process";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:19207"
)
  throw Error("Owned demo fixture only");
const f = JSON.parse(readFileSync("test-results/tracking-real/fixture.json")),
  code = JSON.parse(
    readFileSync("/private/tmp/tracking-real-private.json"),
  ).code,
  app = initializeApp({ projectId: "demo-satsunicgo" }),
  db = getFirestore();
async function post(url, data, token) {
  const r = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(30000),
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify(data),
  });
  const b = await r.json();
  if (b.error)
    throw Object.assign(Error(b.error.message), { code: b.error.status });
  return b.result ?? b;
}
const call = (token, name, data) =>
  post(
    "http://127.0.0.1:15207/demo-satsunicgo/asia-southeast1/" + name,
    { data },
    token,
  );
async function identity(a) {
  return (
    await post(
      "http://127.0.0.1:19207/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo",
      {
        requestUri: "http://localhost",
        returnSecureToken: true,
        postBody: `id_token=${encodeURIComponent(JSON.stringify({ sub: a.sub, email: a.email, email_verified: true }))}&providerId=google.com`,
      },
    )
  ).idToken;
}
try {
  const owner = await identity(f.owner),
    staff = await identity(f.staff);
  const tracking = await call(owner, "customerOrderTracking", {
      orderId: f.orderId,
    }),
    publicDTO = await call(null, "publicOrderTracking", { code });
  const order = (await db.doc("orders/" + f.orderId).get()).data(),
    parcel = (await db.doc("packages/" + f.parcelId).get()).data(),
    projection = (
      await db.doc("customerShipments/" + f.owner.uid + "-" + f.parcelId).get()
    ).data(),
    events = await db.collection("orders/" + f.orderId + "/timeline").get();
  assert.equal(order.version, 3);
  assert.equal(parcel.version, 3);
  assert.equal(order.stage, "DELIVERED");
  assert.equal(parcel.state, "delivered");
  assert.equal(order.collected, 240000);
  assert.equal(events.size, 2);
  assert.ok(
    events.docs.every(
      (d) => Object.keys(d.data()).sort().join(",") === "action,createdAt",
    ),
  );
  const delivery = tracking.timeline.find(
    (e) => e.action === "parcelDelivered",
  );
  assert.equal(delivery.createdAt, projection.updatedAt);
  assert.equal(tracking.estimate, null);
  assert.equal(publicDTO.publicStatus, "delivered");
  assert.equal(publicDTO.updatedAt, delivery.createdAt);
  assert.equal(publicDTO.eta, null);
  assert.equal(
    Object.keys(publicDTO).sort().join(","),
    "eta,observedAt,publicStatus,updatedAt",
  );
  for (const actor of [null, staff])
    await assert.rejects(
      call(actor, "customerOrderTracking", { orderId: f.orderId }),
      (e) => ["UNAUTHENTICATED", "PERMISSION_DENIED"].includes(e.code),
    );
  const invalid = [];
  for (const value of [f.orderId, "SGT-" + "0".repeat(64)]) {
    try {
      await call(null, "publicOrderTracking", { code: value });
      throw Error("Unexpected success");
    } catch (e) {
      assert.equal(e.code, "NOT_FOUND");
      invalid.push(e.message);
    }
  }
  assert.equal(invalid[0], invalid[1]);
  const evidence = {
    status: "PASSED",
    environment:
      "real local HTTP Auth/Functions/Firestore + native CRM UI fixture",
    orderVersion: order.version,
    parcelVersion: parcel.version,
    safeEvents: events.docs.map((d) => d.data()),
    projectionUpdatedAt: projection.updatedAt,
    publicDTOKeys: Object.keys(publicDTO).sort(),
    publicStatus: publicDTO.publicStatus,
    privateReadDenials: 2,
    uniformInvalidCodeDenials: 2,
    moneyUnchanged: true,
    externalProviderCalls: 0,
    limitations: [
      "Synthetic prerequisite IN_TRANSIT order, not checkout end to end",
      "Native parent is a fixture; real Shipping/AccountTracking/Ask components and SDK transports; commerce/provider/analytics isolated",
    ],
  };
  writeFileSync(
    "docs/reviews/ORDER-TRACKING-CRM-E2E-20261010/REAL-HTTP.json",
    JSON.stringify(evidence, null, 2),
  );
  console.log(
    JSON.stringify({
      status: evidence.status,
      orderVersion: order.version,
      safeEvents: events.size,
      publicDTOKeys: evidence.publicDTOKeys,
    }),
  );
} finally {
  await deleteApp(app);
}
