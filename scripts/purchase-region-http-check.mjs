/* global fetch, AbortSignal */
// Authenticated setup + invalid-address HTTP checks; no cart, fee or payment writes.
import assert from "node:assert/strict";
import process from "node:process";
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:19207"
)
  throw Error("EXPLICIT_SHARED_DEMO_ONLY");
const authUrl =
  "http://127.0.0.1:19207/identitytoolkit.googleapis.com/v1/accounts:";
const functionsUrl = "http://127.0.0.1:15207/demo-satsunicgo/asia-southeast1/";
const asset = JSON.parse(
  readFileSync("functions/assets/purchase-vn-regions.json", "utf8"),
);
const results = [];
let token;
async function post(url, body, authorization) {
  const response = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: {
      "content-type": "application/json",
      ...(authorization ? { authorization: `Bearer ${authorization}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return response.json();
}
async function callable(name, data, authorization = token) {
  return post(`${functionsUrl}${name}`, { data }, authorization);
}
async function check(name, run) {
  const start = performance.now();
  try {
    await run();
  } catch (error) {
    results.push({ name, status: "FAILED" });
    throw error;
  }
  results.push({
    name,
    status: "PASSED",
    durationMs: Math.round((performance.now() - start) * 100) / 100,
  });
}
try {
  await check("unauthenticated setup cannot read checkout state", async () => {
    const result = await callable("purchaseCheckoutSetup", {}, null);
    assert.equal(result.error?.status, "UNAUTHENTICATED");
  });
  const sub = `recipient-directory-${randomUUID()}`;
  const identity = await post(`${authUrl}signInWithIdp?key=demo`, {
    requestUri: "http://localhost",
    returnSecureToken: true,
    postBody: `id_token=${encodeURIComponent(JSON.stringify({ sub, email: `${sub}@satsunicgo.example.invalid`, email_verified: true }))}&providerId=google.com`,
  });
  assert.ok(identity.idToken, "Synthetic demo sign-in failed");
  token = identity.idToken;
  await check(
    "authenticated checkout setup exposes exact dated nationwide directory",
    async () => {
      const result = await callable("purchaseCheckoutSetup", {});
      assert.equal(result.error, undefined);
      assert.deepEqual(result.result?.regions, asset.provinces);
    },
  );
  const recipient = {
    recipient: "Khách kiểm thử",
    phone: "0900000000",
    country: "VN",
    province: "Tên tỉnh gửi từ trình duyệt",
    commune: "Tên xã gửi từ trình duyệt",
    street: "Số 10, đường kiểm thử",
    note: "",
  };
  async function rejectPair(provinceCode, communeCode) {
    const result = await callable("purchaseCheckout", {
      action: "preview",
      operationId: randomUUID(),
      expectedRevision: 0,
      recipient: { ...recipient, provinceCode, communeCode },
    });
    assert.equal(result.error?.status, "FAILED_PRECONDITION");
    assert.match(
      result.error?.message ?? "",
      /Chọn lại tỉnh\/thành và phường\/xã/,
    );
  }
  for (const [index, province] of asset.provinces.entries()) {
    const other = asset.provinces[(index + 1) % asset.provinces.length];
    await check(
      `server rejects a commune outside province ${province.code}`,
      () => rejectPair(province.code, other.communes[0].code),
    );
  }
  await check("server rejects unknown province code", () =>
    rejectPair("99", asset.provinces[0].communes[0].code),
  );
  await check("server rejects unknown commune code", () =>
    rejectPair("01", "99999"),
  );
  await check(
    "typed region labels without selected codes cannot create a preview",
    async () => {
      const result = await callable("purchaseCheckout", {
        action: "preview",
        operationId: randomUUID(),
        expectedRevision: 0,
        recipient: { ...recipient, provinceCode: "", communeCode: "" },
      });
      assert.equal(result.error?.status, "INVALID_ARGUMENT");
    },
  );
} finally {
  let cleanup = "NOT_RUN";
  if (token) {
    try {
      const result = await post(`${authUrl}delete?key=demo`, {
        idToken: token,
      });
      assert.equal(result.error, undefined);
      cleanup = "PASSED";
    } catch {
      cleanup = "FAILED";
    }
  }
  const passedCases = results.filter(
    (result) => result.status === "PASSED",
  ).length;
  writeFileSync(
    "docs/reviews/PAYMENT-UPFRONT-20261008/RECIPIENT-DIRECTORY-20261009/HTTP-RESULTS.json",
    JSON.stringify(
      {
        scope: "existing local demo HTTP; no provider or browser acceptance",
        asOf: asset.asOf,
        expectedCases: 39,
        passedCases,
        syntheticAccountCleanup: cleanup,
        complete: passedCases === 39 && cleanup === "PASSED",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  if (cleanup === "FAILED") {
    process.stderr.write(
      "Synthetic auth account cleanup failed; see partial results\n",
    );
    process.exitCode = 1;
  }
}
