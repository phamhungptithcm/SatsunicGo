import assert from "node:assert/strict";
import process from "node:process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FUNCTIONS_EMULATOR !== "true" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207"
)
  throw Error("EXPLICIT_SHARED_DEMO_ONLY");
const [key, mode] = process.argv.slice(2);
if (!/^[a-f0-9]{64}$/.test(key ?? ""))
  throw Error("SYNTHETIC_EVIDENCE_ID_REQUIRED");
process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: "demo-satsunicgo" });
initializeApp({ projectId: "demo-satsunicgo" });
const db = getFirestore();
try {
  const proof = (await db.doc(`purchaseSePayEvidence/${key}`).get()).data();
  assert.ok(
    proof?.ownerId?.startsWith("sepay-owner-"),
    "Only named synthetic fixtures allowed",
  );
  if (mode === "child") {
    const { settleSePayEvidence } =
      await import("../functions/lib/functions/src/purchase-settlement.js");
    const result = await settleSePayEvidence(key);
    process.stdout.write(JSON.stringify({ state: result.state }));
  } else {
    const children = await Promise.all(
      Array.from({ length: 4 }, () =>
        promisify(execFile)(
          process.execPath,
          ["scripts/purchase-sepay-cross-process.mjs", key, "child"],
          { env: process.env, timeout: 30000, maxBuffer: 65536 },
        ),
      ),
    );
    children.forEach((c) => assert.equal(JSON.parse(c.stdout).state, "paid"));
    const checkout = (
      await db.doc(`purchaseCheckouts/${proof.checkoutId}`).get()
    ).data();
    const entries = await db
      .collection("purchaseTestFinancialEntries")
      .where("checkoutId", "==", proof.checkoutId)
      .get();
    assert.equal(entries.size, checkout.lines.length);
    assert.equal(
      entries.docs.reduce((sum, d) => sum + d.data().amount, 0),
      checkout.total,
    );
    assert.equal(
      (
        await db
          .collection("financialEntries")
          .where("checkoutId", "==", proof.checkoutId)
          .get()
      ).size,
      0,
    );
    process.stdout.write(
      JSON.stringify({
        state: "paid",
        processes: 4,
        entries: entries.size,
        total: checkout.total,
      }),
    );
  }
} finally {
  await db.terminate();
}
