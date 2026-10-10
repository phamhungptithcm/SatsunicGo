/* global fetch, AbortSignal */
// HTTP regression wrapper: unchanged business assertions, separate evidence paths.
import assert from "node:assert/strict";
import process from "node:process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:19207"
)
  throw Error("EXPLICIT_SHARED_DEMO_ONLY");
initializeApp({ projectId: "demo-satsunicgo" });
const db = getFirestore(),
  dir = "output/sepay-sandbox-20261009/demo-regression";
mkdirSync(dir, { recursive: true });
try {
  const response = await fetch(
    "http://127.0.0.1:19207/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo",
    {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requestUri: "http://localhost",
        returnSecureToken: true,
        postBody: `id_token=${encodeURIComponent(JSON.stringify({ sub: "e2e005-owner", email: "e2e005-owner@satsunicgo.example.invalid", email_verified: true }))}&providerId=google.com`,
      }),
    },
  );
  const identity = await response.json();
  assert.ok(identity.localId);
  const staff = db.doc(`staffAccess/${identity.localId}`);
  if (!(await staff.get()).exists)
    await staff.create({ active: true, roles: ["OWNER"], locked: false });
  const baseline = readFileSync(
    "scripts/purchase-gateway-business-e2e.mjs",
    "utf8",
  );
  const script = `${dir}/run.mjs`;
  writeFileSync(
    script,
    baseline
      .replaceAll("output/pdf/payment-gateway-business-20261008", dir)
      .replaceAll(
        "docs/reviews/PAYMENT-UPFRONT-20261008/GATEWAY-BUSINESS-E2E.json",
        `${dir}/results.json`,
      ),
  );
  const result = await promisify(execFile)(process.execPath, [script], {
    env: process.env,
    timeout: 240000,
    maxBuffer: 2000000,
  });
  writeFileSync(`${dir}/stdout.log`, result.stdout);
  writeFileSync(`${dir}/stderr.log`, result.stderr);
  process.stdout.write(
    JSON.stringify({
      status: "PASSED",
      scope: "existing demo HTTP business regression",
      directory: dir,
    }),
  );
} finally {
  await db.terminate();
}
