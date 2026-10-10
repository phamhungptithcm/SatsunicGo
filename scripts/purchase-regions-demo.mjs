// Update only public reference data on the explicitly authorized shared demo.
import process from "node:process";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function directoryHash(value) {
  function canonical(item) {
    if (Array.isArray(item)) return item.map(canonical);
    if (item && typeof item === "object")
      return Object.fromEntries(
        Object.keys(item)
          .sort()
          .map((key) => [key, canonical(item[key])]),
      );
    return item;
  }
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)) ?? "undefined")
    .digest("hex");
}

async function main() {
  if (
    process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
    process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207"
  )
    throw Error("EXPLICIT_SHARED_DEMO_ONLY");
  const [mode = "check", expected] = process.argv.slice(2);
  if (
    !["check", "apply"].includes(mode) ||
    (mode === "apply" && !/^[a-f0-9]{64}$/.test(expected ?? ""))
  )
    throw Error("Use check, or apply <expected-current-document-sha256>");
  const asset = JSON.parse(
    readFileSync("functions/assets/purchase-vn-regions.json", "utf8"),
  );
  const provinces = asset.provinces;
  const communes = provinces.flatMap((province) => province.communes);
  if (
    provinces.length !== 34 ||
    communes.length !== 3321 ||
    new Set(provinces.map((p) => p.code)).size !== 34 ||
    new Set(communes.map((c) => c.code)).size !== 3321 ||
    provinces.some((p) => !/^[0-9]{2}$/.test(p.code) || !p.communes.length) ||
    communes.some((c) => !/^[0-9]{5}$/.test(c.code) || !c.name)
  )
    throw Error("INVALID_NATIONWIDE_DIRECTORY");
  const app = initializeApp({ projectId: "demo-satsunicgo" });
  const db = getFirestore(app);
  try {
    const ref = db.doc("settings/purchaseRegions");
    const previous = (await ref.get()).data();
    if (!previous) throw Error("DIRECTORY_MISSING_REQUIRES_REVIEW");
    const before = directoryHash(previous);
    let backup = null;
    if (mode === "apply") {
      if (before !== expected)
        throw Error("DIRECTORY_CHANGED_RECHECK_BEFORE_APPLY");
      backup = `/private/tmp/purchase-regions-backup-${randomUUID()}.json`;
      writeFileSync(backup, JSON.stringify(previous), {
        mode: 0o600,
        flag: "wx",
      });
      await db.runTransaction(async (tx) => {
        const live = (await tx.get(ref)).data();
        if (directoryHash(live) !== expected)
          throw Error("CONCURRENT_DIRECTORY_CHANGE_ABORTED");
        // Retain any unrelated settings metadata; replace only directory fields.
        tx.set(ref, asset, { merge: true });
      });
    }
    const current = (await ref.get()).data();
    const matchesAsset = Object.keys(asset).every(
      (key) => directoryHash(current?.[key]) === directoryHash(asset[key]),
    );
    if (mode === "apply" && !matchesAsset)
      throw Error("DIRECTORY_READBACK_MISMATCH");
    process.stdout.write(
      JSON.stringify(
        {
          project: "demo-satsunicgo",
          document: ref.path,
          mode,
          beforeHash: before,
          currentHash: directoryHash(current),
          matchesAsset,
          backup,
          provinces: provinces.length,
          communes: communes.length,
          asOf: current?.asOf ?? null,
        },
        null,
        2,
      ) + "\n",
    );
  } finally {
    await db.terminate();
    await deleteApp(app);
  }
}

// Exports can be unit tested without initializing Firebase or accessing credentials.
if (process.argv[1]?.endsWith("purchase-regions-demo.mjs")) await main();
