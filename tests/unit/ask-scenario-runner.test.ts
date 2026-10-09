import { expect, test } from "vitest";
import { spawnSync } from "node:child_process";
test.each([
  ["invalid-mode", {}, "Use --unit"],
  [
    "--all-local",
    {
      GCLOUD_PROJECT: "satsunicgo",
      FUNCTIONS_EMULATOR: "true",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:18207",
    },
    "Set demo-satsunicgo",
  ],
  [
    "--demo",
    {
      GCLOUD_PROJECT: "demo-satsunicgo",
      FUNCTIONS_EMULATOR: "true",
      FIRESTORE_EMULATOR_HOST: "remote.invalid:443",
    },
    "Set demo-satsunicgo",
  ],
  [
    "--demo",
    {
      GCLOUD_PROJECT: "demo-satsunicgo",
      FUNCTIONS_EMULATOR: "false",
      FIRESTORE_EMULATOR_HOST: "127.0.0.1:18207",
    },
    "Set demo-satsunicgo",
  ],
] as const)(
  "runner rejects %s with unsafe/invalid configuration before tests",
  (mode, env, message) => {
    const result = spawnSync(
      process.execPath,
      ["scripts/ask-hardening-scenarios.mjs", mode],
      { encoding: "utf8", env: { ...process.env, ...env } },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(message);
    expect(result.stdout).not.toContain("Running ");
  },
);
