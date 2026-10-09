import { expect, it } from "vitest";
import {
  releaseCapabilities,
  releaseCapabilityAllowed,
  maintenanceDemoEnvironmentAllowed,
  emailProductionEnvironmentAllowed,
} from "../../functions/src/provider-release-gate";
const demo = {
  FUNCTIONS_EMULATOR: "true",
  GCLOUD_PROJECT: "demo-satsunicgo",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8187",
};
it("holds AI and payments while non-production runtimes cannot enable email", () => {
  for (const environment of [
    {},
    demo,
    { FUNCTIONS_EMULATOR: "true", GCLOUD_PROJECT: "production" },
    { GCLOUD_PROJECT: "production" },
  ])
    for (const capability of ["ai", "email", "payments"] as const)
      expect(releaseCapabilityAllowed(capability, environment)).toBe(false);
});

it("email is eligible only on the exact production runtime and actual database", () => {
  for (const environment of [
    { GCLOUD_PROJECT: "satsunicgo" },
    { GOOGLE_CLOUD_PROJECT: "satsunicgo" },
    {
      GCLOUD_PROJECT: "satsunicgo",
      GOOGLE_CLOUD_PROJECT: "satsunicgo",
      FUNCTIONS_EMULATOR: "false",
    },
  ]) {
    expect(emailProductionEnvironmentAllowed(environment)).toBe(true);
    expect(releaseCapabilityAllowed("email", environment, "satsunicgo")).toBe(
      true,
    );
    for (const actual of [
      undefined,
      null,
      "demo-satsunicgo",
      "other-project",
      { projectId: "satsunicgo" },
    ])
      expect(releaseCapabilityAllowed("email", environment, actual)).toBe(
        false,
      );
    for (const capability of [
      "ai",
      "payments",
      "scheduledMaintenance",
    ] as const)
      expect(
        releaseCapabilityAllowed(capability, environment, "satsunicgo"),
      ).toBe(false);
  }
});
it.each([
  {},
  { GCLOUD_PROJECT: "satsunicgo", GOOGLE_CLOUD_PROJECT: "other-project" },
  { GCLOUD_PROJECT: "", GOOGLE_CLOUD_PROJECT: "satsunicgo" },
  { GCLOUD_PROJECT: "satsunicgo", FUNCTIONS_EMULATOR: "true" },
  { GCLOUD_PROJECT: "satsunicgo", FUNCTIONS_EMULATOR: "FALSE" },
  { GCLOUD_PROJECT: "satsunicgo", FIRESTORE_EMULATOR_HOST: "127.0.0.1:18207" },
  { GCLOUD_PROJECT: "satsunicgo", FIRESTORE_EMULATOR_HOST: "" },
  {
    GCLOUD_PROJECT: "satsunicgo",
    FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:19207",
  },
  { GCLOUD_PROJECT: "demo-satsunicgo", GOOGLE_CLOUD_PROJECT: "satsunicgo" },
])("ambiguous or emulator email environment %j fails closed", (environment) => {
  expect(emailProductionEnvironmentAllowed(environment)).toBe(false);
  expect(releaseCapabilityAllowed("email", environment, "satsunicgo")).toBe(
    false,
  );
});
it("cannot mutate frozen code-owned release capability metadata", () => {
  expect(Object.isFrozen(releaseCapabilities)).toBe(true);
  expect(Reflect.set(releaseCapabilities, "payments", true)).toBe(false);
  expect(releaseCapabilities.payments).toBe(false);
});
it("permits only exact demo non-provider maintenance", () => {
  expect(
    releaseCapabilityAllowed("scheduledMaintenance", demo, "demo-satsunicgo"),
  ).toBe(true);
  expect(
    releaseCapabilityAllowed(
      "scheduledMaintenance",
      { ...demo, GOOGLE_CLOUD_PROJECT: "demo-satsunicgo" },
      "demo-satsunicgo",
    ),
  ).toBe(true);
  for (const environment of [
    {},
    { FUNCTIONS_EMULATOR: "true" },
    { GCLOUD_PROJECT: "demo-satsunicgo" },
    { ...demo, GCLOUD_PROJECT: "demo-other" },
    { ...demo, GOOGLE_CLOUD_PROJECT: "production" },
    { ...demo, FUNCTIONS_EMULATOR: "TRUE" },
  ])
    expect(releaseCapabilityAllowed("scheduledMaintenance", environment)).toBe(
      false,
    );
});
it("unknown runtime capabilities fail closed", () => {
  expect(releaseCapabilityAllowed("unknown" as "email", demo)).toBe(false);
});

it("requires both actual database identity and exact loopback host", () => {
  for (const actual of [
    undefined,
    null,
    "production",
    "demo-other",
    { projectId: "demo-satsunicgo" },
  ])
    expect(releaseCapabilityAllowed("scheduledMaintenance", demo, actual)).toBe(
      false,
    );
  for (const host of [
    undefined,
    "",
    "localhost:8187",
    "[::1]:8187",
    "0.0.0.0:8187",
    "127.0.0.1:0",
    "127.0.0.1:65536",
    "127.0.0.1:0187",
    "127.0.0.1:8187/path",
    "evil.example:8187",
  ])
    expect(
      maintenanceDemoEnvironmentAllowed({
        ...demo,
        FIRESTORE_EMULATOR_HOST: host,
      }),
    ).toBe(false);
  expect(
    releaseCapabilityAllowed("scheduledMaintenance", demo, "demo-satsunicgo"),
  ).toBe(true);
});
