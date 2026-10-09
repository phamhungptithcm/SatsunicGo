import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { directoryHash } from "../../scripts/purchase-regions-demo.mjs";

test("directory comparison tolerates Firestore map key order but detects changed names and parent arrays", () => {
  assert.equal(
    directoryHash({ b: 2, a: { y: 2, x: 1 } }),
    directoryHash({ a: { x: 1, y: 2 }, b: 2 }),
  );
  assert.notEqual(
    directoryHash({ code: "01", name: "Hà Nội" }),
    directoryHash({ code: "01", name: "Đà Nẵng" }),
  );
  assert.notEqual(directoryHash(["01", "04"]), directoryHash(["04", "01"]));
  assert.notEqual(directoryHash(undefined), directoryHash(null));
});

test("sync refuses non-demo project and wrong emulator before initializing Firebase", () => {
  for (const [project, host] of [
    ["satsunicgo", "127.0.0.1:18207"],
    ["demo-satsunicgo", "127.0.0.1:8080"],
    ["demo-satsunicgo", "remote.example:18207"],
  ]) {
    const result = spawnSync(
      process.execPath,
      ["scripts/purchase-regions-demo.mjs", "apply", "a".repeat(64)],
      {
        env: {
          ...process.env,
          GCLOUD_PROJECT: project,
          FIRESTORE_EMULATOR_HOST: host,
        },
        encoding: "utf8",
        timeout: 10000,
      },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /EXPLICIT_SHARED_DEMO_ONLY/);
  }
});

test("sync requires an expected current hash for every apply", () => {
  const result = spawnSync(
    process.execPath,
    ["scripts/purchase-regions-demo.mjs", "apply"],
    {
      env: {
        ...process.env,
        GCLOUD_PROJECT: "demo-satsunicgo",
        FIRESTORE_EMULATOR_HOST: "127.0.0.1:18207",
      },
      encoding: "utf8",
      timeout: 10000,
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /expected-current-document-sha256/);
});
