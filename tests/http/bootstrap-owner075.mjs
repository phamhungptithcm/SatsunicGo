import process from "node:process";
import console from "node:console";
import assert from "node:assert/strict";
import { Firestore } from "firebase-admin/firestore";
import { bootstrapOwner } from "../../scripts/release/bootstrap-owner.mjs";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8196");
assert.equal(process.env.GCLOUD_PROJECT, "demo-satsunicgo");
const db = new Firestore({ projectId: "demo-satsunicgo" });
const auditPath = "auditEvents/first-owner-bootstrap-075";
const paths = [
  "staffAccess/fixture-owner075",
  "staffAccess/fixture-rival075",
  "users/fixture-owner075",
  auditPath,
];
const cleanup = async () => {
  const batch = db.batch();
  for (const path of paths) batch.delete(db.doc(path));
  await batch.commit();
};
const run = (uid = "fixture-owner075", apply = true) =>
  bootstrapOwner({
    db,
    apply,
    email: "owner@example.test",
    expectedUid: uid,
    operatorHash: "a".repeat(64),
    lookup: async () => [
      {
        localId: uid,
        email: "owner@example.test",
        emailVerified: true,
        disabled: false,
        providerUserInfo: [{ providerId: "google.com" }],
        mfaInfo: [{ mfaEnrollmentId: "fixture-factor", totpInfo: {} }],
      },
    ],
  });
try {
  await cleanup();
  assert.equal((await run(undefined, false)).status, "READ_ONLY_READY");
  assert.equal((await db.doc(auditPath).get()).exists, false);
  assert.equal((await run()).status, "BOOTSTRAPPED");
  assert.equal((await run()).status, "ALREADY_BOOTSTRAPPED");
  let rows = await db.getAll(db.doc(paths[0]), db.doc(auditPath));
  assert.equal(rows.filter((row) => row.exists).length, 2);
  assert.equal(rows[1].data().resourceId, "fixture-owner075");

  await cleanup();
  const concurrent = await Promise.allSettled([run(), run("fixture-rival075")]);
  assert.equal(
    concurrent.filter((result) => result.status === "fulfilled").length,
    1,
  );
  rows = await db.getAll(db.doc(paths[0]), db.doc(paths[1]), db.doc(auditPath));
  assert.equal(rows.slice(0, 2).filter((row) => row.exists).length, 1);
  assert.equal(
    rows[2].data().resourceId,
    rows.find((row) => row.exists && row.ref.parent.id === "staffAccess").id,
  );

  await cleanup();
  await db
    .doc(auditPath)
    .create({ action: "fixture-conflict", resourceId: "fixture-rival075" });
  await assert.rejects(
    run(),
    (error) => error.code === "AUDIT_CONFLICT_OR_OPERATOR_MISSING",
  );
  assert.equal((await db.doc(paths[0]).get()).exists, false);
  assert.equal(
    (await db.doc(auditPath).get()).data().action,
    "fixture-conflict",
  );

  await cleanup();
  await db.doc(paths[0]).create({ roles: ["SUPPORT"], active: true });
  await assert.rejects(
    run(),
    (error) => error.code === "EXISTING_RIGHTS_NOT_OWNED",
  );
  assert.equal((await db.doc(auditPath).get()).exists, false);
  assert.deepEqual((await db.doc(paths[0]).get()).data().roles, ["SUPPORT"]);
  console.log(
    JSON.stringify({
      scope: "ISOLATED_EMULATOR_ONLY",
      scenariosPassed: 4,
      productionWrites: false,
    }),
  );
} finally {
  await cleanup();
  await db.terminate();
}
