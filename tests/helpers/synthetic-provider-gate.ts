import process from "node:process";
/** Tests of provider transaction cores use fake SDKs, never live release authority. */
export function syntheticProviderAllowed(capability: string, environment: Readonly<Record<string, string | undefined>>) {
  if (environment.FUNCTIONS_EMULATOR !== "true" ||
      !environment.GCLOUD_PROJECT?.startsWith("demo-satsunicgo") ||
      environment.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8181" ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GOOGLE_GHA_CREDS_PATH) throw Error("Synthetic provider tests require credential-free loopback demo isolation");
  return capability === "email" || capability === "payments";
}
