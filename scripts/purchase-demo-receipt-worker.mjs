import { initializeApp } from "firebase-admin/app";
import process from "node:process";
import { getFirestore } from "firebase-admin/firestore";
import { createRequire } from "node:module";
import { setTimeout as delay } from "node:timers/promises";

// The shared Firestore runs under its original hub. This local-only runner
// exercises the same bounded recovery handler without resetting that service.
if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FUNCTIONS_EMULATOR !== "true" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.FIREBASE_STORAGE_EMULATOR_HOST !== "127.0.0.1:19208"
)
  throw Error("EXPLICIT_SHARED_DEMO_ONLY");
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: "demo-satsunicgo",
  storageBucket: "demo-satsunicgo.appspot.com",
});
initializeApp({
  projectId: "demo-satsunicgo",
  storageBucket: "demo-satsunicgo.appspot.com",
});
const db = getFirestore();
const { purchaseReceiptRecovery } = createRequire(import.meta.url)(
  "../functions/lib/functions/src/purchase-receipts.js",
);
let stopping = false;
process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});
do {
  if ((await db.doc("settings/purchaseDemo").get()).data()?.enabled !== true)
    throw Error("DEMO_DISABLED");
  await purchaseReceiptRecovery.run({
    scheduleTime: new Date().toISOString(),
    jobName: "purchase-demo-local-recovery",
  });
  if (!process.argv.includes("--watch")) break;
  await delay(10000);
} while (!stopping);
await db.terminate();
