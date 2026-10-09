/** Disposable synthetic checks against the existing canonical shared emulator only. */
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import assert from "node:assert/strict";
if (
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo"
)
  throw Error("CANONICAL_EMULATOR_REQUIRED");
const buildRoot = process.env.CUSTOMER_EMAIL_BUILD_ROOT;
if (!buildRoot?.startsWith("/private/tmp/"))
  throw Error("ISOLATED_BUILD_REQUIRED");
const require = createRequire(import.meta.url);
const { projectCustomerNotification } = require(
  resolve(buildRoot, "functions/src/customer-notification-delivery.js"),
);
const { customerEvent, customerSnapshotHash } = require(
  resolve(buildRoot, "functions/src/customer-notification-events.js"),
);
const app = initializeApp(
    { projectId: "demo-satsunicgo" },
    `customer-email-${randomUUID()}`,
  ),
  db = getFirestore(app);
const suffix = randomUUID(),
  owner = `email-check-${suffix}`,
  order = `email-order-${suffix}`;
const paths = new Set();
const row = (id, event, extra = {}) => ({
  ownerId: owner,
  orderId: order,
  action: "issueQuote",
  state: "queued",
  createdAt: 1,
  customerEvent: event,
  customerSnapshotHash: customerSnapshotHash(event),
  ...extra,
});
const event = customerEvent(
  "quote_ready",
  {
    ownerId: owner,
    entityId: order,
    orderId: order,
    entityVersion: 1,
    occurredAt: 1,
  },
  { orderRef: order, quotedTotal: 1000 },
);
async function write(path, data) {
  paths.add(path);
  await db.doc(path).create(data);
}
let checks = 0;
try {
  await write(`users/${owner}`, { ownerId: owner, synthetic: true });
  await write(`orders/${order}`, {
    ownerId: owner,
    version: 1,
    synthetic: true,
  });
  const id = `email-event-${suffix}`;
  paths.add(`notifications/${id}`);
  await write(`outboxJobs/${id}`, row(id, event));
  const results = await Promise.all(
    Array.from({ length: 8 }, () => projectCustomerNotification(db, id, 100)),
  );
  assert.equal(results.filter(Boolean).length, 1);
  checks++;
  assert.equal(
    (await db.doc(`notifications/${id}`).get()).data().ownerId,
    owner,
  );
  checks++;
  assert.equal(
    (await db.doc(`notifications/${id}`).get()).data().targetPath,
    `/account/orders/${order}`,
  );
  checks++;
  assert.equal(
    (await db.doc(`outboxJobs/${id}`).get()).data().state,
    "inAppDelivered",
  );
  checks++;
  assert.notEqual(
    (await db.doc(`outboxJobs/${id}`).get()).data().emailState,
    "queued",
  );
  checks++;
  for (const [name, extra, expected] of [
    ["tampered", { customerSnapshotHash: "changed" }, "blocked_content"],
    ["wrong-owner", { ownerId: "another-owner" }, "blocked_content"],
  ]) {
    const bad = `email-${name}-${suffix}`;
    paths.add(`notifications/${bad}`);
    await write(`outboxJobs/${bad}`, row(bad, event, extra));
    assert.equal(await projectCustomerNotification(db, bad, 100), true);
    checks++;
    assert.equal(
      (await db.doc(`outboxJobs/${bad}`).get()).data().state,
      expected,
    );
    checks++;
    assert.equal((await db.doc(`notifications/${bad}`).get()).exists, false);
    checks++;
  }
  const badOwner = `email-resource-owner-${suffix}`;
  paths.add(`notifications/${badOwner}`);
  const foreign = customerEvent(
    "quote_ready",
    {
      ownerId: owner,
      entityId: order,
      orderId: order,
      entityVersion: 1,
      occurredAt: 1,
    },
    { orderRef: order, quotedTotal: 1000 },
  );
  await write(`outboxJobs/${badOwner}`, row(badOwner, foreign));
  await db.doc(`orders/${order}`).update({ ownerId: "foreign-owner" });
  await projectCustomerNotification(db, badOwner, 100);
  assert.equal(
    (await db.doc(`outboxJobs/${badOwner}`).get()).data().state,
    "blocked_recipient",
  );
  checks++;
  assert.equal((await db.doc(`notifications/${badOwner}`).get()).exists, false);
  checks++;
  const rollback = `email-rollback-${suffix}`;
  paths.add(`outboxJobs/${rollback}`);
  await assert.rejects(
    db.runTransaction(async (tx) => {
      tx.create(db.doc(`outboxJobs/${rollback}`), row(rollback, event));
      tx.create(db.doc(`orders/${order}`), { ownerId: owner });
    }),
  );
  checks++;
  assert.equal((await db.doc(`outboxJobs/${rollback}`).get()).exists, false);
  checks++;
  console.log(
    JSON.stringify({
      status: "PASSED",
      assertions: checks,
      concurrentProjectors: 8,
      project: "demo-satsunicgo",
      port: 18207,
      syntheticOnly: true,
      providerSending: "NOT_RUN",
    }),
  );
} finally {
  const batch = db.batch();
  for (const path of paths) batch.delete(db.doc(path));
  await batch.commit();
  await deleteApp(app);
}
