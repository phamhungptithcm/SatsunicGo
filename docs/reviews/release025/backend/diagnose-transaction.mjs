// Prepared for root-serialized execution only. Never targets production.
if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FUNCTIONS_EMULATOR !== "true" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8187"
) throw Error("Dedicated demo diagnostic environment required");
const { initializeApp, deleteApp } = await import("firebase-admin/app");
const { getFirestore } = await import("firebase-admin/firestore");
const { randomUUID } = await import("node:crypto");
const app = initializeApp({ projectId: "demo-satsunicgo" }, `perf-${randomUUID()}`);
const db = getFirestore(app);
const namespace = randomUUID();
const refs = Array.from({ length: 4 }, (_, i) => db.doc(`perfDiagnostics/${namespace}-seed-${i}`));
const emit = (metadata) => process.stdout.write(JSON.stringify(metadata) + "\n");
try {
  const seedStart = performance.now();
  const seed = db.batch();
  for (const ref of refs) seed.create(ref, { synthetic: true, value: 1 });
  await seed.commit();
  emit({ stage: "seed", elapsedMs: Math.round(performance.now() - seedStart) });
  for (let sample = 0; sample < 3; sample++) {
    const start = performance.now();
    let callbacks = 0, callbackEnd = start;
    const phases = [];
    await db.runTransaction(async (tx) => {
      callbacks++;
      const begin = performance.now();
      await Promise.all(refs.map((ref) => tx.get(ref)));
      const readsEnd = performance.now();
      for (let i = 0; i < 5; i++) tx.create(db.collection("perfDiagnostics").doc(), { synthetic: true, value: 1 });
      callbackEnd = performance.now();
      phases.push({ readMs: Math.round(readsEnd - begin), callbackMs: Math.round(callbackEnd - begin) });
    }, { maxAttempts: 3 });
    emit({ stage: "transaction", sample, callbacks, phases, totalMs: Math.round(performance.now() - start), afterLastCallbackMs: Math.round(performance.now() - callbackEnd) });
  }
} catch (error) {
  emit({ stage: "failure", code: typeof error?.code === "number" ? error.code : "unclassified" });
  process.exitCode = 1;
} finally {
  await db.terminate();
  await deleteApp(app);
}
