/* global console */
import process from "node:process";
import { writeFileSync } from "node:fs";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207"
)
  throw Error("Read-only local demo metadata");
const app = initializeApp({ projectId: "demo-satsunicgo" });
try {
  const snapshot = await getFirestore().doc("settings/upfrontCheckout").get(),
    p = snapshot.data(),
    now = Date.now();
  const value = {
    exists: snapshot.exists,
    enabled: p?.enabled === true,
    approved: p?.approved === true,
    version: p?.version ?? null,
    effectiveFrom: p?.effectiveFrom ?? null,
    expiresAt: p?.expiresAt ?? null,
    observedAt: now,
    notExpired: typeof p?.expiresAt === "number" && p.expiresAt > now,
    settingsChanged: false,
  };
  writeFileSync(
    "docs/reviews/ORDER-TRACKING-CRM-E2E-20261010/DEMO-PRICING-GATE.json",
    JSON.stringify(value, null, 2),
  );
  console.log(JSON.stringify(value));
} finally {
  await deleteApp(app);
}
