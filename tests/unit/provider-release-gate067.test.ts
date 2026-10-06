import { expect, it } from "vitest";
import { releaseCapabilities, releaseCapabilityAllowed, maintenanceDemoEnvironmentAllowed } from "../../functions/src/provider-release-gate";
const demo = { FUNCTIONS_EMULATOR: "true", GCLOUD_PROJECT: "demo-satsunicgo", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8187" };
it("holds all external providers regardless of production or exact demo settings", () => {
  for (const environment of [{}, demo, { FUNCTIONS_EMULATOR: "true", GCLOUD_PROJECT: "production" }, { GCLOUD_PROJECT: "production" }])
    for (const capability of ["ai", "email", "payments"] as const)
      expect(releaseCapabilityAllowed(capability, environment)).toBe(false);
});
it("cannot mutate frozen code-owned release capability metadata", () => {
  expect(Object.isFrozen(releaseCapabilities)).toBe(true);
  expect(Reflect.set(releaseCapabilities, "payments", true)).toBe(false);
  expect(releaseCapabilities.payments).toBe(false);
});
it("permits only exact demo non-provider maintenance", () => {
  expect(releaseCapabilityAllowed("scheduledMaintenance", demo, "demo-satsunicgo")).toBe(true);
  expect(releaseCapabilityAllowed("scheduledMaintenance", { ...demo, GOOGLE_CLOUD_PROJECT: "demo-satsunicgo" }, "demo-satsunicgo")).toBe(true);
  for (const environment of [{}, { FUNCTIONS_EMULATOR: "true" }, { GCLOUD_PROJECT: "demo-satsunicgo" }, { ...demo, GCLOUD_PROJECT: "demo-other" }, { ...demo, GOOGLE_CLOUD_PROJECT: "production" }, { ...demo, FUNCTIONS_EMULATOR: "TRUE" }])
    expect(releaseCapabilityAllowed("scheduledMaintenance", environment)).toBe(false);
});
it("unknown runtime capabilities fail closed", () => {
  expect(releaseCapabilityAllowed("unknown" as "email", demo)).toBe(false);
});

it("requires both actual database identity and exact loopback host", () => {
  for (const actual of [undefined, null, "production", "demo-other", { projectId: "demo-satsunicgo" }])
    expect(releaseCapabilityAllowed("scheduledMaintenance", demo, actual)).toBe(false);
  for (const host of [undefined, "", "localhost:8187", "[::1]:8187", "0.0.0.0:8187", "127.0.0.1:0", "127.0.0.1:65536", "127.0.0.1:0187", "127.0.0.1:8187/path", "evil.example:8187"])
    expect(maintenanceDemoEnvironmentAllowed({ ...demo, FIRESTORE_EMULATOR_HOST: host })).toBe(false);
  expect(releaseCapabilityAllowed("scheduledMaintenance", demo, "demo-satsunicgo")).toBe(true);
});
