/** Release holds are code-owned. Firestore settings cannot enable a capability. */
export const releaseCapabilities = Object.freeze({
  ai: false,
  email: false,
  payments: false,
  scheduledMaintenance: false,
});
export type ReleaseCapability = keyof typeof releaseCapabilities;
export type ReleaseEnvironment = Readonly<Record<string, string | undefined>>;
/** Pre-initialization check only; actual database identity is also mandatory. */
export function maintenanceDemoEnvironmentAllowed(environment: ReleaseEnvironment): boolean {
  const host = environment.FIRESTORE_EMULATOR_HOST;
  const match = typeof host === "string" ? /^127\.0\.0\.1:([1-9][0-9]{0,4})$/.exec(host) : null;
  return Boolean(
    match && Number(match[1]) <= 65535 &&
    environment.FUNCTIONS_EMULATOR === "true" &&
    environment.GCLOUD_PROJECT === "demo-satsunicgo" &&
    (environment.GOOGLE_CLOUD_PROJECT === undefined ||
      environment.GOOGLE_CLOUD_PROJECT === "demo-satsunicgo")
  );
}
/** Only non-provider maintenance may run against the exact canonical demo. */
export function releaseCapabilityAllowed(
  capability: ReleaseCapability,
  environment: ReleaseEnvironment,
  actualDatabaseProjectId?: unknown,
): boolean {
  return capability === "scheduledMaintenance" &&
    actualDatabaseProjectId === "demo-satsunicgo" &&
    maintenanceDemoEnvironmentAllowed(environment);
}
