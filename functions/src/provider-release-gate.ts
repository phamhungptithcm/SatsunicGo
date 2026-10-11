import { productionTestArtifactEnvironmentAllowed } from "./production-test-policy";
/** Release holds are code-owned. Firestore settings cannot enable a capability. */
export const releaseCapabilities = Object.freeze({
  ai: false,
  email: true,
  payments: false,
  scheduledMaintenance: false,
  scheduledPublication: true,
  notificationRecovery: true,
});
export type ReleaseCapability = keyof typeof releaseCapabilities;
export type ReleaseEnvironment = Readonly<Record<string, string | undefined>>;
/** Pre-initialization check only; actual database identity is also mandatory. */
export function maintenanceDemoEnvironmentAllowed(
  environment: ReleaseEnvironment,
): boolean {
  const host = environment.FIRESTORE_EMULATOR_HOST;
  const match =
    typeof host === "string"
      ? /^127\.0\.0\.1:([1-9][0-9]{0,4})$/.exec(host)
      : null;
  return Boolean(
    match &&
    Number(match[1]) <= 65535 &&
    environment.FUNCTIONS_EMULATOR === "true" &&
    environment.GCLOUD_PROJECT === "demo-satsunicgo" &&
    (environment.GOOGLE_CLOUD_PROJECT === undefined ||
      environment.GOOGLE_CLOUD_PROJECT === "demo-satsunicgo"),
  );
}
/** Pre-initialization eligibility. Runtime settings still cannot bypass this project fence. */
export function emailProductionEnvironmentAllowed(
  environment: ReleaseEnvironment,
): boolean {
  return (
    (environment.GCLOUD_PROJECT ?? environment.GOOGLE_CLOUD_PROJECT) ===
      "satsunicgo" &&
    (environment.GCLOUD_PROJECT === undefined ||
      environment.GCLOUD_PROJECT === "satsunicgo") &&
    (environment.GOOGLE_CLOUD_PROJECT === undefined ||
      environment.GOOGLE_CLOUD_PROJECT === "satsunicgo") &&
    (environment.FUNCTIONS_EMULATOR === undefined ||
      environment.FUNCTIONS_EMULATOR === "false") &&
    environment.FIRESTORE_EMULATOR_HOST === undefined &&
    environment.FIREBASE_AUTH_EMULATOR_HOST === undefined
  );
}
/** Email eligibility is exact production only; sending also requires validated server policy. */
export function releaseCapabilityAllowed(
  capability: ReleaseCapability,
  environment: ReleaseEnvironment,
  actualDatabaseProjectId?: unknown,
): boolean {
  if (capability === "scheduledPublication" || capability === "notificationRecovery")
    return releaseCapabilities[capability] && actualDatabaseProjectId === "satsunicgo" && productionTestArtifactEnvironmentAllowed(environment);
  if (capability === "email")
    return (
      releaseCapabilities.email &&
      actualDatabaseProjectId === "satsunicgo" &&
      emailProductionEnvironmentAllowed(environment)
    );
  return (
    capability === "scheduledMaintenance" &&
    actualDatabaseProjectId === "demo-satsunicgo" &&
    maintenanceDemoEnvironmentAllowed(environment)
  );
}
