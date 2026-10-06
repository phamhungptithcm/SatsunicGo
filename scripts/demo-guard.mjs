export function assertDemoEnvironment(env) {
  if (
    env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
    env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9198" ||
    env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8181"
  ) {
    throw Error(
      "Only demo-satsunicgo on the dedicated loopback Auth/Firestore emulators is allowed",
    );
  }
}
