/* global fetch, AbortSignal */
import assert from "node:assert/strict";
import process from "node:process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { setTimeout, clearTimeout } from "node:timers";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:19207"
)
  throw Error("EXPLICIT_SHARED_DEMO_ONLY");

const app = initializeApp({ projectId: "demo-satsunicgo" });
const db = getFirestore(),
  paths = new Set(),
  identities = [],
  checkouts = new Set(),
  results = [];
const authUrl =
  "http://127.0.0.1:19207/identitytoolkit.googleapis.com/v1/accounts:";
const callableUrl = "http://127.0.0.1:15207/demo-satsunicgo/asia-southeast1/";
const uiFixture = process.argv.includes("--ui-fixture");
const street = uiFixture
  ? "Căn hộ kiểm thử A1208, tầng 12, tòa nhà kiểm thử giao nhận SatsunicGo, số 10 đường kiểm thử địa chỉ dài, lối vào khu giao nhận phía sau tòa nhà, gọi người nhận trước khi giao hàng"
  : "Số 10 đường kiểm thử";
let complete = false,
  cleanup = "NOT_RUN";
async function post(url, body, token) {
  const response = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(30000),
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return response.json();
}
async function identity() {
  const sub = `crm-http-${randomUUID()}`;
  const response = await post(`${authUrl}signInWithIdp?key=demo`, {
    requestUri: "http://localhost",
    returnSecureToken: true,
    postBody: `id_token=${encodeURIComponent(JSON.stringify({ sub, email: `${sub}@satsunicgo.example.invalid`, email_verified: true }))}&providerId=google.com`,
  });
  assert.ok(
    response.idToken && response.localId,
    "Synthetic Google identity unavailable",
  );
  const who = {
    uid: response.localId,
    token: response.idToken,
    email: `${sub}@satsunicgo.example.invalid`,
  };
  identities.push(who);
  paths.add(`users/${who.uid}`);
  paths.add(`carts/${who.uid}`);
  paths.add(`staffAccess/${who.uid}`);
  return who;
}
async function call(who, name, data) {
  const response = await post(`${callableUrl}${name}`, { data }, who?.token);
  if (response.error) {
    const error = Error(response.error.status);
    error.code = response.error.status;
    throw error;
  }
  assert.ok(
    "result" in response || "data" in response,
    "Callable response missing",
  );
  return response.result ?? response.data;
}
async function check(name, run) {
  try {
    await run();
    results.push({ name, status: "PASSED" });
  } catch (error) {
    results.push({ name, status: "FAILED" });
    throw error;
  }
}
function command(who, input) {
  const operationId = randomUUID();
  paths.add(`idempotencyKeys/purchase-${who.uid}-${operationId}`);
  return call(who, "purchaseCheckout", { ...input, operationId });
}
try {
  assert.equal(
    (await db.doc("settings/purchaseDemo").get()).data()?.enabled,
    true,
  );
  assert.equal(
    (await db.doc("purchaseDemoMerchant/config").get()).exists,
    true,
    "Existing synthetic merchant configuration required; no implicit shared creation",
  );
  const user = await identity(),
    warehouse = await identity(),
    buyer = await identity();
  await db
    .doc(`staffAccess/${warehouse.uid}`)
    .create({ active: true, roles: ["WAREHOUSE"] });
  await check("unauthenticated HTTP CRM read rejected", async () => {
    await assert.rejects(
      () => call(null, "readOrderOperations", { orderId: randomUUID() }),
      { code: "UNAUTHENTICATED" },
    );
  });
  const productId = `crm-http-${randomUUID()}`;
  paths.add(`products/${productId}`);
  await db.doc(`products/${productId}`).create({
    title: "Món niêm yết kiểm thử CRM",
    slug: productId,
    status: "published",
    market: "US",
    version: 1,
    orderable: true,
    listedPrice: 100000,
    termsVersion: "synthetic-crm",
    catalogOptions: [],
  });
  const added = await command(user, {
    action: "addRequest",
    expectedRevision: 0,
    request: {
      market: "US",
      items: [
        {
          name: "Món cần tìm mua kiểm thử CRM",
          variant: "",
          quantity: 1,
          unitSourceMinor: 1000,
        },
      ],
      notes: "",
    },
  });
  paths.add(`purchaseDrafts/${added.id}`);
  const mergeId = randomUUID();
  paths.add(`idempotencyKeys/cart-${user.uid}-${mergeId}`);
  const cart = await call(user, "cartCommand", {
    action: "merge",
    operationId: mergeId,
    expectedRevision: added.cart.revision,
    items: [{ productId, lineId: randomUUID(), quantity: 1, variant: "" }],
  });
  const setup = await call(user, "purchaseCheckoutSetup", {}),
    province = setup.regions[0],
    commune = province.communes[0];
  const preview = await command(user, {
    action: "preview",
    expectedRevision: cart.revision,
    recipient: {
      recipient: "Người nhận kiểm thử CRM",
      phone: "0900000000",
      country: "VN",
      provinceCode: province.code,
      communeCode: commune.code,
      province: "Tên tỉnh giả từ client",
      commune: "Tên xã giả từ client",
      street,
      note: "Ghi chú riêng không đưa vào CRM",
    },
  });
  checkouts.add(preview.id);
  const orderIds = preview.lines.map((line) => line.orderId);
  await check(
    "HTTP preview canonicalizes province and commune for mixed cart",
    async () => {
      assert.equal(preview.recipient.province, province.name);
      assert.equal(preview.recipient.commune, commune.name);
      assert.equal(preview.lines.length, 2);
      assert.deepEqual(
        new Set(preview.lines.map((line) => line.kind)),
        new Set(["catalog", "custom"]),
      );
    },
  );
  await command(user, {
    action: "commit",
    previewId: preview.id,
    previewHash: preview.previewHash,
    confirmed: true,
  });
  await check(
    "HTTP committed unpaid orders have no CRM recipient yet",
    async () => {
      for (const id of orderIds)
        assert.equal(
          (await db.doc(`orderOperations/${id}`).get()).exists,
          false,
        );
    },
  );
  const link = await call(user, "purchaseDemoPayment", {
    id: preview.id,
    action: "createLink",
  });
  paths.add(`purchaseDemoLinkIndex/${link.paymentLinkId}`);
  await check("HTTP demo gateway payment and replay settle once", async () => {
    const paid = await Promise.all(
      [1, 2].map(() =>
        call(user, "purchaseDemoPayment", { id: preview.id, action: "pay" }),
      ),
    );
    assert.deepEqual(paid[0], paid[1]);
    assert.equal(
      (
        await call(user, "purchaseCheckout", {
          action: "status",
          id: preview.id,
        })
      ).state,
      "paid",
    );
    assert.equal(
      (
        await db
          .collection("financialEntries")
          .where("ownerId", "==", user.uid)
          .get()
      ).size,
      2,
    );
  });
  await check(
    "HTTP CRM warehouse sees identical canonical recipient for both paid orders",
    async () => {
      for (const id of orderIds) {
        const response = await call(warehouse, "readOrderOperations", {
          orderId: id,
        });
        assert.deepEqual(response.recipient, {
          recipient: "Người nhận kiểm thử CRM",
          phone: "0900000000",
          address: `${street}, ${commune.name}, ${province.name}, Việt Nam`,
        });
        assert.ok(!JSON.stringify(response).includes(preview.recipient.note));
      }
    },
  );
  await db
    .doc(`staffAccess/${buyer.uid}`)
    .create({ active: true, roles: ["BUYER"], orderIds });
  await check(
    "HTTP assigned buyer does not receive recipient PII",
    async () => {
      assert.equal(
        (await call(buyer, "readOrderOperations", { orderId: orderIds[0] }))
          .recipient,
        null,
      );
    },
  );
  await check("HTTP customer cannot read staff operations", async () => {
    await assert.rejects(
      () => call(user, "readOrderOperations", { orderId: orderIds[0] }),
      { code: "PERMISSION_DENIED" },
    );
  });
  complete = true;
  if (uiFixture) {
    // Hold only this script's synthetic records for authorized read-only UI
    // acceptance. SIGTERM/SIGINT or the deadline runs the same owned cleanup.
    // Never persist the authentication tokens in the handoff metadata.
    writeFileSync(
      "/private/tmp/purchase-crm-ui-ready-20261009.json",
      JSON.stringify(
        {
          project: "demo-satsunicgo",
          pid: process.pid,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          checkoutId: preview.id,
          orderIds,
          identities: Object.fromEntries(
            Object.entries({ customer: user, warehouse, buyer }).map(
              ([role, who]) => [role, { uid: who.uid, email: who.email }],
            ),
          ),
          recipient: {
            recipient: preview.recipient.recipient,
            phone: preview.recipient.phone,
            address: `${street}, ${commune.name}, ${province.name}, Việt Nam`,
          },
          cleanup: "PENDING_AUTHORIZED_UI_READBACK",
        },
        null,
        2,
      ) + "\n",
      { mode: 0o600 },
    );
    await new Promise((resolve) => {
      function finish() {
        clearTimeout(deadline);
        process.off("SIGTERM", finish);
        process.off("SIGINT", finish);
        resolve();
      }
      const deadline = setTimeout(finish, 30 * 60 * 1000);
      process.once("SIGTERM", finish);
      process.once("SIGINT", finish);
    });
  }
} finally {
  try {
    // Discover owned results even if a response failed after the server committed.
    for (const who of identities) {
      for (const collection of [
        "purchasePreviews",
        "purchaseCheckouts",
        "purchaseDrafts",
        "purchaseReceipts",
        "purchaseReceiptJobs",
        "purchaseEmailOutbox",
        "financialEntries",
        "outboxJobs",
        "notifications",
        "orders",
        "orderRecipients",
        "carts",
        "users",
      ]) {
        const rows = await db
          .collection(collection)
          .where("ownerId", "==", who.uid)
          .get();
        for (const row of rows.docs) {
          paths.add(row.ref.path);
          if (["purchasePreviews", "purchaseCheckouts"].includes(collection))
            checkouts.add(row.id);
          if (collection === "orders") {
            paths.add(`orderOperations/${row.id}`);
            for (const checkoutId of checkouts)
              paths.add(`orders/${row.id}/timeline/purchase-${checkoutId}`);
          }
        }
      }
    }
    for (const id of checkouts) {
      for (const collection of [
        "purchaseDemoLinks",
        "purchaseReceiptJobs",
        "purchaseEmailOutbox",
      ])
        paths.add(`${collection}/${id}`);
      paths.add(`purchasePaymentEvidence/DEMO-${id}`);
      // The gateway reference is independent of checkout UUID; discover only
      // this fixture's evidence/index instead of guessing or rewinding counters.
      for (const collection of [
        "purchasePaymentEvidence",
        "purchaseDemoLinkIndex",
      ]) {
        const rows = await db
          .collection(collection)
          .where("checkoutId", "==", id)
          .get();
        rows.docs.forEach((row) => paths.add(row.ref.path));
      }
      const audit = await db
        .collection("auditEvents")
        .where("resourceId", "==", id)
        .get();
      audit.docs.forEach((row) => paths.add(row.ref.path));
    }
    const all = [...paths];
    for (let n = 0; n < all.length; n += 400) {
      const batch = db.batch();
      all.slice(n, n + 400).forEach((path) => batch.delete(db.doc(path)));
      await batch.commit();
    }
    assert.ok(
      !(await db.getAll(...all.map((path) => db.doc(path)))).some(
        (row) => row.exists,
      ),
    );
    for (const who of identities) {
      const response = await post(`${authUrl}delete?key=demo`, {
        idToken: who.token,
      });
      assert.equal(
        response.error,
        undefined,
        "Owned synthetic Auth cleanup failed",
      );
    }
    cleanup = "PASSED";
  } catch (error) {
    cleanup = "FAILED";
    process.exitCode = 1;
    results.push({
      name: "owned fixture cleanup",
      status: "FAILED",
      code: error.code ?? "ASSERTION",
    });
  } finally {
    const uiMetadataPath = "/private/tmp/purchase-crm-ui-ready-20261009.json";
    if (uiFixture && existsSync(uiMetadataPath)) {
      const metadata = JSON.parse(readFileSync(uiMetadataPath, "utf8"));
      if (metadata.pid === process.pid)
        writeFileSync(
          uiMetadataPath,
          JSON.stringify(
            { ...metadata, cleanup, cleanedAt: new Date().toISOString() },
            null,
            2,
          ) + "\n",
          { mode: 0o600 },
        );
    }
    writeFileSync(
      process.argv[2] ?? "/private/tmp/purchase-crm-http-results.json",
      JSON.stringify(
        {
          complete,
          cleanup,
          provider: "local signed demo gateway; no external provider",
          sharedDemoOrderCounterMayAdvance: true,
          results,
        },
        null,
        2,
      ) + "\n",
    );
    await db.terminate();
    await deleteApp(app);
  }
}
