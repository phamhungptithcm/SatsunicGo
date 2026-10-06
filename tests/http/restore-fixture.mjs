import process from "node:process";
import console from "node:console";
import { Buffer } from "node:buffer";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { strict as assert } from "node:assert";
const dedicated = process.env.SATSUNICGO_RESTORE_ISOLATED === "true";
const projectId = dedicated ? "demo-satsunicgo-restore021" : "demo-satsunicgo";
if (
  process.env.GCLOUD_PROJECT !== projectId ||
  process.env.FIRESTORE_EMULATOR_HOST !==
    (dedicated ? "127.0.0.1:8187" : "127.0.0.1:8181") ||
  process.env.FIREBASE_STORAGE_EMULATOR_HOST !==
    (dedicated ? "127.0.0.1:9397" : "127.0.0.1:9298")
)
  throw Error("Restore fixtures require the isolated demo emulators");
initializeApp({
  projectId,
  storageBucket: `${projectId}.appspot.com`,
});
const db = getFirestore(),
  ref = db.doc("restoreFixtures/snapshot-v1"),
  file = getStorage().bucket().file("restore-fixtures/snapshot.txt");
const fixture = {
  schemaVersion: 1,
  marker: "ISOLATED_FIXTURE_ONLY",
  collected: 0,
  refunded: 0,
  providerEffects: "disabled",
};
if (process.argv[2] === "write") {
  await ref.set(fixture);
  await file.save(Buffer.from("ISOLATED_STORAGE_FIXTURE_ONLY"), {
    resumable: false,
    metadata: { contentType: "text/plain" },
  });
} else if (process.argv[2] === "verify") {
  assert.deepEqual((await ref.get()).data(), fixture);
  assert.equal(
    (await file.download())[0].toString(),
    "ISOLATED_STORAGE_FIXTURE_ONLY",
  );
  console.log(
    "PASS: separate Firestore and Storage fixtures restored in isolated demo emulators; provider effects disabled. Production backup/restore NOT_TESTED.",
  );
} else throw Error("Choose write or verify");
await db.terminate();
