export function assertDemoTestEnvironment(
  env: Record<string, string | undefined>,
) {
  if (
    env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
    env.FUNCTIONS_EMULATOR !== "true" ||
    !["127.0.0.1:8181", "127.0.0.1:18207"].includes(
      env.FIRESTORE_EMULATOR_HOST ?? "",
    )
  ) {
    throw new Error(
      "Integration tests require demo-satsunicgo, FUNCTIONS_EMULATOR=true and loopback Firestore 127.0.0.1:8181 or shared 127.0.0.1:18207 before Firebase imports.",
    );
  }
}

/** Client rules checks must target the same validated emulator as Admin fixtures. */
export function demoFirestoreEndpoint(env: Record<string, string | undefined>) {
  assertDemoTestEnvironment(env);
  return {
    host: "127.0.0.1",
    port: Number(env.FIRESTORE_EMULATOR_HOST!.split(":")[1]),
  };
}
