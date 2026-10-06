export function assertDemoTestEnvironment(
  env: Record<string, string | undefined>,
) {
  if (
    env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
    env.FUNCTIONS_EMULATOR !== "true" ||
    env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8181"
  ) {
    throw new Error(
      "Integration tests require demo-satsunicgo, FUNCTIONS_EMULATOR=true and loopback Firestore 127.0.0.1:8181 before Firebase imports.",
    );
  }
}
