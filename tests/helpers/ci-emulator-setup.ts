import process from "node:process";
const expected: Record<string, [string, string]> = {
  cart: ["demo-satsunicgo-cart107", "127.0.0.1:18207"],
  pilot: ["demo-satsunicgo-ask106-ci", "127.0.0.1:18207"],
  delivery: ["demo-satsunicgo", "127.0.0.1:8187"],
  recipient: ["demo-satsunicgo", "127.0.0.1:18207"],
  sepay: ["demo-satsunicgo", "127.0.0.1:18207"],
};
const selected = expected[process.env.SATSUNICGO_RULES_GROUP ?? ""];
if (
  !selected ||
  process.env.GITHUB_ACTIONS !== "true" ||
  process.env.GCLOUD_PROJECT !== selected[0] ||
  process.env.GOOGLE_CLOUD_PROJECT !== selected[0] ||
  process.env.FIRESTORE_EMULATOR_HOST !== selected[1] ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9199" ||
  process.env.FUNCTIONS_EMULATOR !== "true"
) {
  throw Error(
    "Dedicated CI suite requires its exact demo project and loopback emulators before imports",
  );
}

// Only the exact disposable GitHub recipient group supplies prerequisites.
// Never seed/replace settings in the shared local runtime.
if (process.env.SATSUNICGO_RULES_GROUP === "recipient") {
  const { initializeApp, deleteApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const { readFileSync } = await import("node:fs");
  const app = initializeApp(
    { projectId: selected[0] },
    "ci-recipient-settings",
  );
  const db = getFirestore(app);
  try {
    await db
      .doc("settings/purchaseDemo")
      .create({ enabled: true, environment: selected[0] });
    await db
      .doc("settings/purchaseRegions")
      .create(
        JSON.parse(
          readFileSync("functions/assets/purchase-vn-regions.json", "utf8"),
        ),
      );
  } finally {
    await db.terminate();
    await deleteApp(app);
  }
}
