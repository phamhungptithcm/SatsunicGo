// Dedicated isolated027 runtime. Original shared8181 guard remains unchanged.
if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FUNCTIONS_EMULATOR !== "true" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8187" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9197" ||
  process.env.FIREBASE_STORAGE_EMULATOR_HOST !== "127.0.0.1:9297"
)
  throw Error(
    "027 tests require dedicated demo-only Firestore8187/Auth9197/Storage9297.",
  );
