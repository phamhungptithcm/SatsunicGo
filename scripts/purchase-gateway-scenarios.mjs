/* global fetch, AbortSignal */
import assert from "node:assert/strict";
import process from "node:process";
import console from "node:console";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
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
  prefix = `gateway-${randomUUID()}`,
  results = [],
  timings = [];
const base = "http://127.0.0.1:15207/demo-satsunicgo/asia-southeast1/";
async function identity(label, provider = "google.com", verified = true) {
  const sub = `${prefix}-${label}`,
    credential = JSON.stringify({
      sub,
      email: `${sub}@satsunicgo.example.invalid`,
      email_verified: verified,
    });
  const response = await fetch(
    "http://127.0.0.1:19207/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        requestUri: "http://localhost",
        postBody: `id_token=${encodeURIComponent(credential)}&providerId=${provider}`,
        returnSecureToken: true,
      }),
    },
  );
  const data = await response.json();
  assert.ok(data.idToken);
  return { uid: data.localId, token: data.idToken };
}
async function call(who, name, data) {
  const start = performance.now(),
    r = await fetch(base + name, {
      method: "POST",
      signal: AbortSignal.timeout(30000),
      headers: {
        "content-type": "application/json",
        ...(who ? { authorization: `Bearer ${who.token}` } : {}),
      },
      body: JSON.stringify({ data }),
    });
  const body = await r.json();
  timings.push({ name, ms: performance.now() - start });
  if (body.error) {
    const e = Error(body.error.message);
    e.code = body.error.status;
    throw e;
  }
  assert.ok("result" in body || "data" in body);
  return body.result ?? body.data;
}
async function check(id, scenario, run) {
  await run();
  results.push({ id, scenario, status: "PASSED" });
  console.log(`${id} PASSED ${scenario}`);
}
async function reject(who, name, data, code) {
  await assert.rejects(
    () => call(who, name, data),
    (e) => e.code === code,
  );
}
const owner = await identity("owner"),
  other = await identity("other"),
  wrongProvider = await identity("facebook", "facebook.com"),
  unverified = await identity("unverified", "google.com", false);
const setup = await call(owner, "purchaseCheckoutSetup", {}),
  region = setup.regions[0];
assert.ok(
  setup.pricing,
  "Existing approved demo pricing required; runner does not mutate shared configuration",
);
const recipient = {
  recipient: "Khách kiểm thử",
  phone: "0900000000",
  country: "VN",
  provinceCode: region.code,
  province: region.name,
  communeCode: region.communes[0].code,
  commune: region.communes[0].name,
  street: "Số 10 đường kiểm thử",
  note: "",
};
async function fixture(label, kind = "catalog", count = 1) {
  const user = await identity(label),
    productId = `${prefix}-${label}`,
    lineId = randomUUID();
  await db.doc(`products/${productId}`).create({
    title: "Sản phẩm kiểm thử",
    slug: productId,
    status: "published",
    market: "US",
    version: 1,
    orderable: true,
    listedPrice: 129900,
    termsVersion: "demo-v1",
    catalogOptions: [],
  });
  let cart;
  if (kind === "catalog")
    cart = await call(user, "cartCommand", {
      action: "merge",
      operationId: randomUUID(),
      expectedRevision: 0,
      items: [{ lineId, productId, variant: "", quantity: count }],
    });
  else {
    const added = await call(user, "purchaseCheckout", {
      action: "addRequest",
      operationId: randomUUID(),
      expectedRevision: 0,
      request: {
        market: kind === "JP" ? "JP" : "US",
        notes: "",
        items: Array.from({ length: count }, (_, n) => ({
          name: `Món cần tìm ${n + 1}`,
          variant: "",
          quantity: 1,
          unitSourceMinor: 1000,
        })),
      },
    });
    cart = added.cart;
  }
  const preview = await call(user, "purchaseCheckout", {
    action: "preview",
    operationId: randomUUID(),
    expectedRevision: cart.revision,
    recipient,
  });
  const commit = {
    action: "commit",
    operationId: randomUUID(),
    previewId: preview.id,
    previewHash: preview.previewHash,
    confirmed: true,
  };
  return { user, cart, preview, commit, productId, lineId };
}
async function committed(label, kind = "catalog", count = 1) {
  const f = await fixture(label, kind, count);
  f.checkout = await call(f.user, "purchaseCheckout", f.commit);
  return f;
}
const status = (f) =>
  call(f.user, "purchaseCheckout", { action: "status", id: f.checkout.id });
const gateway = (f, action) =>
  call(f.user, "purchaseDemoPayment", { action, id: f.checkout.id });
async function orderCount(f) {
  return (
    await db.collection("orders").where("ownerId", "==", f.user.uid).get()
  ).size;
}
async function signed(f, change = {}, envelope = {}) {
  const row = (await db.doc(`purchaseDemoLinks/${f.checkout.id}`).get()).data(),
    merchant = (await db.doc("purchaseDemoMerchant/config").get()).data();
  const sdk = new PayOS({
    clientId: "local-demo",
    apiKey: "local-demo",
    checksumKey: merchant.checksumKey,
  });
  const data = {
    orderCode: row.orderCode,
    amount: row.paidAmount ?? row.amount,
    description: `SG ${row.orderCode}`,
    accountNumber: "DEMO-NO-BANK",
    reference: row.reference,
    transactionDateTime: new Date(row.paidAt).toISOString(),
    currency: "VND",
    paymentLinkId: row.paymentLinkId,
    code: "00",
    desc: "Thanh toán demo",
    ...change,
  };
  return {
    code: "00",
    desc: "success",
    success: true,
    data,
    signature: await sdk.crypto.createSignatureFromObj(data, sdk.checksumKey),
    ...envelope,
  };
}
async function webhook(body, expected = 400, method = "POST") {
  const r = await fetch(base + "purchaseDemoWebhook", {
    method,
    signal: AbortSignal.timeout(30000),
    ...(method === "POST"
      ? {
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  assert.equal(r.status, expected, await r.text());
}
try {
  const f = await committed("happy");
  let link;
  await check(
    "G001",
    "parallel create and replay return one provider link",
    async () => {
      const values = await Promise.all([
        gateway(f, "createLink"),
        gateway(f, "createLink"),
      ]);
      assert.deepEqual(values[0], values[1]);
      link = values[0];
      assert.equal(link.amount, 129900);
      assert.equal(link.currency, "VND");
      assert.equal(link.status, "PENDING");
      assert.equal(
        link.checkoutUrl,
        `/checkout/payment/${f.checkout.id}?gateway=${link.paymentLinkId}`,
      );
      assert.equal(await orderCount(f), 0);
    },
  );
  await check(
    "G002",
    "provider projection contains no email, merchant key or identity",
    async () => {
      assert.deepEqual(
        Object.keys(await gateway(f, "linkStatus")).sort(),
        [
          "paymentLinkId",
          "orderCode",
          "amount",
          "currency",
          "status",
          "expiresAt",
          "checkoutUrl",
        ].sort(),
      );
    },
  );
  for (const action of [
    "createLink",
    "linkStatus",
    "pay",
    "cancel",
    "reconcile",
    "payWithoutWebhook",
    "loseResponse",
  ])
    await check(`AUTH-${action}`, `other customer cannot ${action}`, () =>
      reject(
        other,
        "purchaseDemoPayment",
        { action, id: f.checkout.id },
        "PERMISSION_DENIED",
      ),
    );
  await check("AUTH-NONE", "unauthenticated payment is rejected", () =>
    reject(
      null,
      "purchaseDemoPayment",
      { action: "pay", id: f.checkout.id },
      "UNAUTHENTICATED",
    ),
  );
  await check("AUTH-PROVIDER", "non-Google identity is rejected", () =>
    reject(
      wrongProvider,
      "purchaseDemoPayment",
      { action: "pay", id: f.checkout.id },
      "PERMISSION_DENIED",
    ),
  );
  await check("AUTH-UNVERIFIED", "unverified Google identity is rejected", () =>
    reject(
      unverified,
      "purchaseDemoPayment",
      { action: "pay", id: f.checkout.id },
      "PERMISSION_DENIED",
    ),
  );
  await check(
    "G003",
    "old simulate-paid command cannot bypass linked provider",
    () =>
      reject(
        f.user,
        "purchaseDemoPayment",
        { id: f.checkout.id, outcome: "paid" },
        "FAILED_PRECONDITION",
      ),
  );
  for (const [id, extra] of [
    ["amount", { amount: 1 }],
    ["redirect", { returnUrl: "https://attacker.invalid" }],
    ["outcome", { outcome: "paid" }],
  ])
    await check(
      `INPUT-${id}`,
      "client cannot alter provider contract " + id,
      () =>
        reject(
          f.user,
          "purchaseDemoPayment",
          { id: f.checkout.id, action: "pay", ...extra },
          "INVALID_ARGUMENT",
        ),
    );
  await check("INPUT-ID", "invalid document path is rejected", () =>
    reject(
      f.user,
      "purchaseDemoPayment",
      { action: "pay", id: "../other" },
      "INVALID_ARGUMENT",
    ),
  );
  await check(
    "G004",
    "provider paid but delayed webhook does not optimistically create order",
    async () => {
      await gateway(f, "payWithoutWebhook");
      assert.equal((await status(f)).state, "pending");
      assert.equal(await orderCount(f), 0);
    },
  );
  for (const [id, changes, env] of [
    ["amount-low", { amount: 1 }],
    ["amount-high", { amount: 129901 }],
    ["order-code", { orderCode: link.orderCode + 1 }],
    ["link-id", { paymentLinkId: "b".repeat(32) }],
    ["reference", { reference: "DEMO-other" }],
    ["payment-time", { transactionDateTime: "2000-01-01T00:00:00Z" }],
    ["invalid-time", { transactionDateTime: "not-a-date" }],
    ["currency", { currency: "USD" }],
    ["account", { accountNumber: "real-bank" }],
    ["signature", {}, { signature: "a".repeat(64) }],
    ["success", {}, { success: false }],
  ])
    await check(
      `WH-${id}`,
      "signed/forged webhook rejected for " + id,
      async () => {
        await webhook(await signed(f, changes, env));
        assert.equal(await orderCount(f), 0);
      },
    );
  await check("WH-METHOD", "webhook only accepts POST", () =>
    webhook(null, 405, "GET"),
  );
  await check("WH-SIZE", "oversized webhook is bounded", () =>
    webhook({ data: "x".repeat(17000) }, 413),
  );
  await check("G005", "valid concurrent callbacks allocate once", async () => {
    const body = await signed(f);
    await Promise.all([
      webhook(body, 200),
      webhook(body, 200),
      webhook(body, 200),
    ]);
    assert.equal((await status(f)).state, "paid");
    assert.equal(await orderCount(f), 1);
    assert.equal(
      (
        await db
          .collection("purchaseTestFinancialEntries")
          .where("checkoutId", "==", f.checkout.id)
          .get()
      ).size,
      1,
    );
    assert.equal(
      (
        await db
          .collection("financialEntries")
          .where("checkoutId", "==", f.checkout.id)
          .get()
      ).size,
      0,
    );
  });
  await check(
    "G006",
    "callback replay and reconcile preserve ledger and paid timestamp",
    async () => {
      const old = await status(f);
      await gateway(f, "reconcile");
      await webhook(await signed(f), 200);
      assert.deepEqual(await status(f), old);
    },
  );
  await check("G007", "paid provider cannot be cancelled", () =>
    reject(
      f.user,
      "purchaseDemoPayment",
      { action: "cancel", id: f.checkout.id },
      "FAILED_PRECONDITION",
    ),
  );
  const delayed = await committed("reconcile");
  await gateway(delayed, "createLink");
  await gateway(delayed, "payWithoutWebhook");
  await check(
    "G008",
    "server reconciliation recovers lost webhook without another payment",
    async () => {
      await gateway(delayed, "reconcile");
      const checkout = await status(delayed);
      assert.equal(checkout.state, "paid");
      const [provider, receipt] = await db.getAll(
        db.doc(`purchaseDemoLinks/${delayed.checkout.id}`),
        db.doc(`purchaseReceipts/${delayed.checkout.id}`),
      );
      assert.equal(checkout.paidAt, provider.data().paidAt);
      assert.equal(receipt.data().paidAt, provider.data().paidAt);
      assert.equal(await orderCount(delayed), 1);
    },
  );
  const unknown = await committed("unknown");
  await gateway(unknown, "createLink");
  await check(
    "G009",
    "ambiguous response retains exact checkout and cart lock",
    async () => {
      await gateway(unknown, "loseResponse");
      assert.equal((await status(unknown)).state, "unknown");
      assert.equal(
        (await db.doc(`carts/${unknown.user.uid}`).get()).data()
          .activeCheckoutId,
        unknown.checkout.id,
      );
      assert.equal(await orderCount(unknown), 0);
    },
  );
  await check("G010", "unknown cannot be cancelled", () =>
    reject(
      unknown.user,
      "purchaseDemoPayment",
      { action: "cancel", id: unknown.checkout.id },
      "FAILED_PRECONDITION",
    ),
  );
  await check(
    "G011",
    "expiry cannot auto-release ambiguous funds",
    async () => {
      await db
        .doc(`purchaseDemoLinks/${unknown.checkout.id}`)
        .update({ expiresAt: Date.now() - 1 });
      assert.equal((await gateway(unknown, "reconcile")).status, "PROCESSING");
      assert.equal((await status(unknown)).state, "unknown");
    },
  );
  await check(
    "G012",
    "same unknown link recovers verified payment",
    async () => {
      await gateway(unknown, "pay");
      assert.equal((await status(unknown)).state, "paid");
      assert.equal(await orderCount(unknown), 1);
    },
  );
  const cancelled = await committed("cancelled");
  await gateway(cancelled, "createLink");
  await check(
    "G013",
    "confirmed unpaid cancellation releases cart and preserves items",
    async () => {
      await gateway(cancelled, "cancel");
      const cart = (await db.doc(`carts/${cancelled.user.uid}`).get()).data();
      assert.equal(cart.activeCheckoutId, null);
      assert.equal(cart.items.length, 1);
      assert.equal((await status(cancelled)).state, "cancelled");
    },
  );
  await check("G014", "cancelled provider cannot pay later", () =>
    reject(
      cancelled.user,
      "purchaseDemoPayment",
      { action: "pay", id: cancelled.checkout.id },
      "FAILED_PRECONDITION",
    ),
  );
  const expired = await committed("expired");
  await gateway(expired, "createLink");
  await check(
    "G015",
    "expired unpaid link reconciles before cart release",
    async () => {
      await db
        .doc(`purchaseDemoLinks/${expired.checkout.id}`)
        .update({ expiresAt: Date.now() - 1 });
      assert.equal((await gateway(expired, "reconcile")).status, "EXPIRED");
      assert.equal((await status(expired)).state, "cancelled");
      assert.equal(await orderCount(expired), 0);
    },
  );
  const unopened = await committed("unopened");
  await check(
    "G016",
    "checkout expires before opening provider without trapping cart",
    async () => {
      await db
        .doc(`purchaseCheckouts/${unopened.checkout.id}`)
        .update({ expiresAt: Date.now() - 1 });
      assert.equal((await gateway(unopened, "createLink")).status, "EXPIRED");
      await gateway(unopened, "reconcile");
      assert.equal((await status(unopened)).state, "cancelled");
    },
  );
  for (let n = 0; n < 3; n++) {
    const race = await committed(`race-${n}`);
    await gateway(race, "createLink");
    await check(
      `RACE-${n}`,
      "pay/cancel race has exactly one financial outcome",
      async () => {
        const values = await Promise.allSettled([
          gateway(race, "pay"),
          gateway(race, "cancel"),
        ]);
        assert.ok(
          values.some((v) => v.status === "fulfilled"),
          JSON.stringify(
            values.map((v) => ({
              status: v.status,
              code: v.status === "rejected" ? v.reason.code : undefined,
            })),
          ),
        );
        await gateway(race, "reconcile");
        const state = (await status(race)).state;
        assert.ok(["paid", "cancelled"].includes(state));
        assert.equal(await orderCount(race), state === "paid" ? 1 : 0);
      },
    );
  }
  const locked = await committed("locked");
  await gateway(locked, "createLink");
  await gateway(locked, "payWithoutWebhook");
  await check(
    "LOCKED-CALLBACK",
    "money verified after account lock is captured for review",
    async () => {
      await db.doc(`users/${locked.user.uid}`).set({ locked: true });
      await webhook(await signed(locked), 200);
      const c = (
        await db.doc(`purchaseCheckouts/${locked.checkout.id}`).get()
      ).data();
      assert.equal(c.state, "review_required");
      assert.equal(await orderCount(locked), 0);
      const evidence = (
        await db
          .doc(
            `purchasePaymentEvidence/${(await db.doc(`purchaseDemoLinks/${locked.checkout.id}`).get()).data().reference}`,
          )
          .get()
      ).data();
      assert.equal(evidence.allocationState, "review_required");
    },
  );
  await check(
    "LOCKED-REPLAY",
    "review callback replay is acknowledged without allocating",
    () => signed(locked).then((body) => webhook(body, 200)),
  );
  const drift = await committed("drift");
  await gateway(drift, "createLink");
  await gateway(drift, "payWithoutWebhook");
  await check(
    "ALLOC-DRIFT",
    "paid money with changed cart ownership is held for review",
    async () => {
      await db.doc(`carts/${drift.user.uid}`).update({ ownerId: other.uid });
      await webhook(await signed(drift), 200);
      assert.equal((await status(drift)).state, "review_required");
      assert.equal(await orderCount(drift), 0);
    },
  );
  const stalePrice = await fixture("stale-price");
  await check(
    "STALE-PRICE",
    "price/version change rejects preview commit",
    async () => {
      await db
        .doc(`products/${stalePrice.productId}`)
        .update({ listedPrice: 130000, version: 2 });
      await reject(
        stalePrice.user,
        "purchaseCheckout",
        stalePrice.commit,
        "ABORTED",
      );
      assert.equal(await orderCount(stalePrice), 0);
    },
  );
  const staleCart = await fixture("stale-cart");
  await check(
    "STALE-CART",
    "cart edit requires new overview and confirmation",
    async () => {
      await call(staleCart.user, "cartCommand", {
        action: "quantity",
        operationId: randomUUID(),
        expectedRevision: staleCart.cart.revision,
        lineId: staleCart.lineId,
        quantity: 2,
      });
      await reject(
        staleCart.user,
        "purchaseCheckout",
        staleCart.commit,
        "ABORTED",
      );
    },
  );
  const stalePreview = await fixture("stale-preview");
  await check(
    "STALE-TIME",
    "expired overview cannot be committed",
    async () => {
      await db
        .doc(`purchasePreviews/${stalePreview.preview.id}`)
        .update({ expiresAt: Date.now() - 1 });
      await reject(
        stalePreview.user,
        "purchaseCheckout",
        stalePreview.commit,
        "ABORTED",
      );
    },
  );
  await check("CONSENT", "commit requires explicit confirmation", () =>
    reject(
      stalePreview.user,
      "purchaseCheckout",
      { ...stalePreview.commit, operationId: randomUUID(), confirmed: false },
      "INVALID_ARGUMENT",
    ),
  );
  await check(
    "ADDRESS-CANONICAL",
    "region names are canonical rather than client-controlled",
    async () => {
      const p = await call(staleCart.user, "purchaseCheckout", {
        action: "preview",
        operationId: randomUUID(),
        expectedRevision: staleCart.cart.revision + 1,
        recipient: {
          ...recipient,
          province: "Tên tự đổi",
          commune: "Tên tự đổi",
        },
      });
      assert.equal(p.recipient.province, recipient.province);
      assert.equal(p.recipient.commune, recipient.commune);
    },
  );
  for (const [id, address] of [
    ["country", { country: "US" }],
    ["phone", { phone: "wrong" }],
    ["street", { street: "x" }],
    ["region", { communeCode: "00000" }],
  ])
    await check(`ADDRESS-${id}`, "invalid recipient " + id + " blocked", () =>
      reject(
        staleCart.user,
        "purchaseCheckout",
        {
          action: "preview",
          operationId: randomUUID(),
          expectedRevision: staleCart.cart.revision + 1,
          recipient: { ...recipient, ...address },
        },
        id === "region" ? "FAILED_PRECONDITION" : "INVALID_ARGUMENT",
      ),
    );
  const custom = await committed("custom", "custom");
  await check(
    "CUSTOM",
    "custom-only full upfront goods and fee are funded before staff work",
    async () => {
      assert.equal(custom.preview.lines[0].kind, "custom");
      assert.equal(
        custom.preview.total,
        custom.preview.goods + custom.preview.service,
      );
      await gateway(custom, "createLink");
      await gateway(custom, "pay");
      const order = (
        await db.doc(`orders/${custom.preview.lines[0].orderId}`).get()
      ).data();
      assert.equal(order.collected, custom.preview.total);
      assert.equal(order.requiresSourcing, true);
      assert.equal(order.purchaseKind, "custom");
    },
  );
  const jp = await fixture("japan", "JP");
  await check("SHIP-JP", "Japan freight remains quote-required", async () =>
    assert.equal(jp.preview.shipping.state, "quote_required"),
  );
  const maximum = await committed("maximum", "custom", 30);
  await check(
    "MAX-LINES",
    "30 lines allocate exactly and stay within transaction limits",
    async () => {
      await gateway(maximum, "createLink");
      await gateway(maximum, "pay");
      assert.equal(await orderCount(maximum), 30);
      const entries = await db
        .collection("purchaseTestFinancialEntries")
        .where("checkoutId", "==", maximum.checkout.id)
        .get();
      assert.equal(entries.size, 30);
      assert.equal(
        entries.docs.reduce((sum, d) => sum + d.data().amount, 0),
        maximum.preview.total,
      );
      assert.equal(
        (
          await db
            .collection("financialEntries")
            .where("checkoutId", "==", maximum.checkout.id)
            .get()
        ).size,
        0,
      );
    },
  );
  for (const [id, items] of [
    ["zero", [{ name: "Món", variant: "", quantity: 1, unitSourceMinor: 0 }]],
    [
      "negative",
      [{ name: "Món", variant: "", quantity: 1, unitSourceMinor: -1 }],
    ],
    [
      "too-many",
      Array.from({ length: 31 }, () => ({
        name: "Món",
        variant: "",
        quantity: 1,
        unitSourceMinor: 1000,
      })),
    ],
  ])
    await check(
      `CUSTOM-${id}`,
      "invalid custom request " + id + " blocked",
      () =>
        reject(
          owner,
          "purchaseCheckout",
          {
            action: "addRequest",
            expectedRevision: 0,
            operationId: randomUUID(),
            request: { market: "US", notes: "", items },
          },
          "INVALID_ARGUMENT",
        ),
    );
  for (const action of ["underpay", "overpay"]) {
    const mismatch = await committed(action);
    await gateway(mismatch, "createLink");
    await check(
      `MONEY-${action}`,
      "provider amount mismatch is captured without an order or fabricated receipt",
      async () => {
        await gateway(mismatch, action);
        const c = await status(mismatch),
          row = (
            await db.doc(`purchaseDemoLinks/${mismatch.checkout.id}`).get()
          ).data();
        assert.equal(c.state, "review_required");
        assert.equal(c.receivedAmount, row.paidAmount);
        assert.equal(await orderCount(mismatch), 0);
        assert.equal(
          (
            await db.doc(`purchasePaymentEvidence/${row.reference}`).get()
          ).data().amount,
          row.paidAmount,
        );
        assert.equal(
          (await db.doc(`purchaseReceipts/${mismatch.checkout.id}`).get())
            .exists,
          false,
        );
        await gateway(mismatch, "reconcile");
        await webhook(await signed(mismatch), 200);
        await reject(
          mismatch.user,
          "purchaseDemoPayment",
          { id: mismatch.checkout.id, action: "cancel" },
          "FAILED_PRECONDITION",
        );
        assert.equal(
          (await db.doc(`carts/${mismatch.user.uid}`).get()).data()
            .activeCheckoutId,
          mismatch.checkout.id,
        );
      },
    );
  }
  const failed = await committed("decline");
  await gateway(failed, "createLink");
  await check(
    "PROVIDER-FAILED",
    "verified unpaid failure releases cart only after reconcile",
    async () => {
      await gateway(failed, "decline");
      assert.equal(await orderCount(failed), 0);
      await gateway(failed, "reconcile");
      assert.equal((await status(failed)).state, "cancelled");
      assert.equal(
        (await db.doc(`carts/${failed.user.uid}`).get()).data().items.length,
        1,
      );
    },
  );
  await check("PRIVATE-PDF", "another customer cannot read paid receipt", () =>
    reject(
      other,
      "purchaseReceipt",
      { id: f.checkout.id, download: true },
      "PERMISSION_DENIED",
    ),
  );
  await check(
    "PERF-READS",
    "bounded warm status burst remains correct",
    async () => {
      for (let n = 0; n < 10; n++)
        assert.equal((await status(f)).state, "paid");
      const reads = await Promise.all(
        Array.from({ length: 5 }, () => status(f)),
      );
      assert.ok(reads.every((c) => c.state === "paid"));
    },
  );
  const sorted = timings.map((t) => t.ms).sort((a, b) => a - b),
    percentile = (n) => Math.round(sorted[Math.ceil(sorted.length * n) - 1]);
  const output = {
    status: "PASSED",
    checks: results.length,
    results,
    runtime:
      "shared local Auth/Functions/Firestore only; synthetic customers; no role grant, real payment or email",
    measurements: {
      httpCalls: timings.length,
      p50Ms: percentile(0.5),
      p95Ms: percentile(0.95),
      maxMs: Math.round(sorted.at(-1)),
      scope:
        "mixed operations on shared inspect-mode emulator; not production capacity",
    },
    fixtures: {
      initial: f.checkout.id,
      delayed: delayed.checkout.id,
      custom: custom.checkout.id,
      maximum: maximum.checkout.id,
    },
  };
  mkdirSync("docs/reviews/PAYMENT-UPFRONT-20261008", { recursive: true });
  writeFileSync(
    "docs/reviews/PAYMENT-UPFRONT-20261008/GATEWAY-SCENARIOS-E2E.json",
    JSON.stringify(output, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      status: output.status,
      checks: output.checks,
      measurements: output.measurements,
    }),
  );
} finally {
  await db.terminate();
}
