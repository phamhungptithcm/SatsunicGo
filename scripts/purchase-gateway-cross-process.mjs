/* global fetch, AbortSignal */
import assert from "node:assert/strict";
import process from "node:process";
import console from "node:console";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { setTimeout, clearTimeout } from "node:timers";
import { writeFileSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PayOS } from "@payos/node";

if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:19207"
)
  throw Error("EXPLICIT_SHARED_DEMO_ONLY");
initializeApp({ projectId: "demo-satsunicgo" });
const db = getFirestore(),
  sub = `cross-process-${randomUUID()}`,
  children = [];
try {
  const identityResponse = await fetch(
    "http://127.0.0.1:19207/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo",
    {
      method: "POST",
      signal: AbortSignal.timeout(30000),
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requestUri: "http://localhost",
        returnSecureToken: true,
        postBody: `id_token=${encodeURIComponent(JSON.stringify({ sub, email: `${sub}@satsunicgo.example.invalid`, email_verified: true }))}&providerId=google.com`,
      }),
    },
  );
  const identity = await identityResponse.json();
  assert.ok(identity.idToken);
  async function call(name, data) {
    const response = await fetch(
      `http://127.0.0.1:15207/demo-satsunicgo/asia-southeast1/${name}`,
      {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${identity.idToken}`,
        },
        body: JSON.stringify({ data }),
      },
    );
    const body = await response.json();
    assert.ok(!body.error, body.error?.status);
    return body.result ?? body.data;
  }
  const setup = await call("purchaseCheckoutSetup", {}),
    region = setup.regions[0];
  const added = await call("purchaseCheckout", {
    action: "addRequest",
    operationId: randomUUID(),
    expectedRevision: 0,
    request: {
      market: "US",
      notes: "",
      items: [
        {
          name: "Món kiểm thử hai tiến trình",
          variant: "",
          quantity: 1,
          unitSourceMinor: 1000,
        },
      ],
    },
  });
  const preview = await call("purchaseCheckout", {
    action: "preview",
    operationId: randomUUID(),
    expectedRevision: added.cart.revision,
    recipient: {
      recipient: "Khách kiểm thử",
      phone: "0900000000",
      country: "VN",
      provinceCode: region.code,
      province: region.name,
      communeCode: region.communes[0].code,
      commune: region.communes[0].name,
      street: "Số 10 đường kiểm thử",
      note: "",
    },
  });
  const checkout = await call("purchaseCheckout", {
    action: "commit",
    operationId: randomUUID(),
    previewId: preview.id,
    previewHash: preview.previewHash,
    confirmed: true,
  });
  await call("purchaseDemoPayment", { id: checkout.id, action: "createLink" });
  await call("purchaseDemoPayment", {
    id: checkout.id,
    action: "payWithoutWebhook",
  });
  assert.equal(
    (await call("purchaseCheckout", { id: checkout.id, action: "status" }))
      .state,
    "pending",
  );
  const intent = (
    await db.doc(`purchaseDemoLinks/${checkout.id}`).get()
  ).data();
  const merchant = (await db.doc("purchaseDemoMerchant/config").get()).data();
  const sdk = new PayOS({
    clientId: "local-demo",
    apiKey: "local-demo",
    checksumKey: merchant.checksumKey,
  });
  const data = {
    orderCode: intent.orderCode,
    amount: intent.amount,
    description: `SG ${intent.orderCode}`,
    accountNumber: "DEMO-NO-BANK",
    reference: intent.reference,
    transactionDateTime: new Date(intent.paidAt).toISOString(),
    currency: "VND",
    paymentLinkId: intent.paymentLinkId,
    code: "00",
    desc: "Thanh toán demo",
  };
  const body = {
    code: "00",
    desc: "success",
    success: true,
    data,
    signature: await sdk.crypto.createSignatureFromObj(data, sdk.checksumKey),
  };
  // Separate Node processes each have their own mutation queue. The checksum stays in memory.
  // Pass the signed synthetic notification via stdin, never command arguments or a file.
  const childSource = `
    const { initializeApp } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");
    if (process.env.GCLOUD_PROJECT !== "demo-satsunicgo" || process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207") process.exit(2);
    process.env.FIREBASE_CONFIG = JSON.stringify({projectId:"demo-satsunicgo"});
    initializeApp({projectId:"demo-satsunicgo"});
    let input=""; process.stdin.setEncoding("utf8");
    process.stdin.on("data", chunk => { input += chunk; if(input.length > 16384) process.exit(3); });
    process.stdin.on("end", async () => {
      try {
        const { receivePurchaseDemoWebhook } = require("./functions/lib/functions/src/purchase-demo-gateway.js");
        const result = await receivePurchaseDemoWebhook(JSON.parse(input)); input="";
        process.stdout.write(JSON.stringify({state:result.state})+"\\n");
      } catch { process.exitCode=4; }
      finally { await getFirestore().terminate(); }
    });`;
  function start() {
    const child = spawn(process.execPath, ["-e", childSource], {
      cwd: process.cwd(),
      env: { ...process.env, FUNCTIONS_EMULATOR: "true" },
      stdio: ["pipe", "pipe", "ignore"],
    });
    children.push(child);
    const result = new Promise((resolve, reject) => {
      let output = "";
      const timeout = setTimeout(() => {
        child.kill("SIGTERM");
        reject(Error("CROSS_PROCESS_TIMEOUT"));
      }, 60000);
      child.stdout.on("data", (bytes) => {
        output += bytes.toString();
        if (output.length > 1024) child.kill("SIGTERM");
      });
      child.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0) reject(Error("CROSS_PROCESS_FAILED"));
        else resolve(JSON.parse(output));
      });
    });
    return { child, result };
  }
  const processes = [start(), start()],
    started = performance.now();
  for (const entry of processes) entry.child.stdin.end(JSON.stringify(body));
  const outcomes = await Promise.all(processes.map((entry) => entry.result));
  assert.deepEqual(outcomes, [{ state: "paid" }, { state: "paid" }]);
  const entries = await db
    .collection("financialEntries")
    .where("checkoutId", "==", checkout.id)
    .get();
  assert.equal(entries.size, 1);
  assert.equal(entries.docs[0].data().amount, preview.total);
  assert.equal(
    (await db.collection("orders").where("checkoutId", "==", checkout.id).get())
      .size,
    1,
  );
  assert.equal(
    (
      await db
        .collection("purchaseReceipts")
        .where("id", "==", checkout.id)
        .get()
    ).size,
    1,
  );
  assert.deepEqual(
    (await db.doc(`carts/${identity.localId}`).get()).data().items,
    [],
  );
  const evidence = {
    status: "PASSED",
    scenario:
      "Two separate Node processes allocate the same valid signed callback exactly once",
    processes: 2,
    elapsedMs: Math.round(performance.now() - started),
    financialEntries: 1,
    orders: 1,
    receipts: 1,
    scope:
      "Preserved local Firestore demo; independent process maps; not production deployment/load evidence",
  };
  writeFileSync(
    "docs/reviews/PAYMENT-UPFRONT-20261008/GATEWAY-CROSS-PROCESS.json",
    JSON.stringify(evidence, null, 2) + "\n",
  );
  console.log(JSON.stringify(evidence));
} finally {
  for (const child of children)
    if (child.exitCode === null) child.kill("SIGTERM");
  await db.terminate();
}
