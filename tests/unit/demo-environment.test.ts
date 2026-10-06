import { expect, it } from "vitest";
import { assertDemoTestEnvironment } from "../helpers/demo-environment";
const safe = {
  GCLOUD_PROJECT: "demo-satsunicgo",
  FUNCTIONS_EMULATOR: "true",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8181",
};
it("fails closed before network imports for ambient cloud, missing flags and nonloopback targets", () => {
  expect(() => assertDemoTestEnvironment(safe)).not.toThrow();
  for (const bad of [
    {},
    { ...safe, GCLOUD_PROJECT: "production" },
    { ...safe, FUNCTIONS_EMULATOR: "false" },
    { ...safe, FIRESTORE_EMULATOR_HOST: undefined },
    { ...safe, FIRESTORE_EMULATOR_HOST: "example.com:8181" },
  ])
    expect(() => assertDemoTestEnvironment(bad)).toThrow();
});
