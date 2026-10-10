/* global console */
import process from "node:process";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

assert.equal(process.env.GCLOUD_PROJECT, "demo-satsunicgo");
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:18207");
assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST, "127.0.0.1:19207");
const app = initializeApp({ projectId: "demo-satsunicgo" });
const db = getFirestore();
const ref = db.doc("settings/upfrontCheckout");
const backup = `/private/tmp/tracking-pricing-${randomUUID()}.json`;
const failureMode = process.argv.includes("--verify-apply-rejection")
  ? "apply-rejection"
  : process.argv.includes("--verify-apply-ack-loss")
    ? "apply-ack-loss"
    : null;
const evidencePath =
  "docs/reviews/ORDER-TRACKING-CRM-E2E-20261010/DEMO-PRICING-" +
  (failureMode ? failureMode.toUpperCase() : "WINDOW") +
  ".json";
const evidence = {
  approvedBy: "Human chat reply 2026-10-10",
  project: "demo-satsunicgo",
  changedFields: ["expiresAt"],
  restore: "NOT_RUN",
  cleanup: "NOT_RUN",
};
const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
function child(file, args = []) {
  const result = spawnSync(process.execPath, [file, ...args], {
    env: process.env,
    stdio: "inherit",
    timeout: 240000,
  });
  if (result.error || result.status !== 0)
    throw Error(`${file}: ${result.error?.code ?? result.status}`);
}
let original,
  temporary,
  applied = false,
  setupStarted = false;
try {
  const snapshot = await ref.get();
  assert.ok(snapshot.exists);
  original = snapshot.data();
  // Refuse non-JSON Firestore types rather than silently corrupting a backup.
  assert.deepEqual(original, JSON.parse(JSON.stringify(original)));
  writeFileSync(backup, JSON.stringify(original), { mode: 0o600, flag: "wx" });
  const now = Date.now();
  temporary = { ...original, expiresAt: now + 2 * 60 * 60 * 1000 };
  evidence.startedAt = now;
  evidence.version = original.version;
  evidence.originalExpiresAt = original.expiresAt;
  evidence.temporaryExpiresAt = temporary.expiresAt;
  evidence.originalHash = hash(original);
  // A lost commit acknowledgement must still enter guarded restoration.
  applied = true;
  const applying = db.runTransaction(async (tx) => {
    assert.deepEqual(
      (await tx.get(ref)).data(),
      original,
      "Pricing changed concurrently before apply",
    );
    tx.update(ref, { expiresAt: temporary.expiresAt });
    if (failureMode === "apply-rejection")
      throw Error("Synthetic apply-rejection");
  });
  await applying.then(() => {
    if (failureMode === "apply-ack-loss")
      throw Error("Synthetic apply-ack-loss");
  });
  assert.deepEqual((await ref.get()).data(), temporary);
  setupStarted = true;
  child("tests/component/tracking-real-fixture.mjs");
  child("tests/component/tracking-business-http.mjs");
  evidence.business = "PASSED";
} catch (error) {
  const expected = failureMode && error.message === "Synthetic " + failureMode;
  evidence.business = expected ? "NOT_RUN" : "FAILED";
  evidence.injectedFailure = expected ? failureMode : null;
  if (expected) evidence.cleanup = "NOT_APPLICABLE: no fixture started";
  evidence.error = error.message;
  process.exitCode = expected ? 0 : 1;
} finally {
  try {
    if (setupStarted && existsSync("test-results/tracking-real/fixture.json")) {
      child("tests/component/tracking-real-fixture.mjs", ["--cleanup"]);
      evidence.cleanup = "PASSED";
    }
  } catch (error) {
    evidence.cleanup = "FAILED";
    evidence.cleanupError = error.message;
    process.exitCode = 1;
  }
  try {
    if (applied) {
      await db.runTransaction(async (tx) => {
        const current = (await tx.get(ref)).data();
        // The apply may have failed before commit: already-original is safe.
        if (hash(current) === hash(original)) return;
        assert.deepEqual(
          current,
          temporary,
          "Concurrent pricing change: backup retained; no overwrite",
        );
        tx.set(ref, original);
      });
      assert.deepEqual((await ref.get()).data(), original);
      evidence.restore = "PASSED";
      evidence.restoredHash = hash((await ref.get()).data());
      unlinkSync(backup);
    } else if (existsSync(backup)) unlinkSync(backup);
  } catch (error) {
    evidence.restore = "CONFLICT_OR_FAILURE";
    evidence.restoreError = error.message;
    process.exitCode = 1;
  }
  if (
    evidence.cleanup === "PASSED" &&
    existsSync("/private/tmp/tracking-real-private.json")
  )
    unlinkSync("/private/tmp/tracking-real-private.json");
  evidence.finishedAt = Date.now();
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence));
  await deleteApp(app);
}
