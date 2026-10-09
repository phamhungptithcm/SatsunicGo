/* global fetch, AbortSignal */
import assert from "node:assert/strict";
import process from "node:process";
import { Buffer } from "node:buffer";
import { setTimeout } from "node:timers";
import console from "node:console";
import { randomUUID, createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:19207"
)
  throw Error("EXPLICIT_SHARED_DEMO_ONLY");
initializeApp({
  projectId: "demo-satsunicgo",
  storageBucket: "demo-satsunicgo.appspot.com",
});
const db = getFirestore();
const runId = randomUUID(),
  results = [];
async function identity(sub) {
  const credential = JSON.stringify({
    sub,
    email: `${sub}@satsunicgo.example.invalid`,
    email_verified: true,
  });
  const r = await fetch(
    "http://127.0.0.1:19207/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo",
    {
      method: "POST",
      signal: AbortSignal.timeout(60000),
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requestUri: "http://localhost",
        postBody: `id_token=${encodeURIComponent(credential)}&providerId=google.com`,
        returnSecureToken: true,
      }),
    },
  );
  const data = await r.json();
  assert.ok(data.idToken, "Demo Google identity failed");
  return { token: data.idToken, uid: data.localId };
}
async function call(who, name, data) {
  const r = await fetch(
    `http://127.0.0.1:15207/demo-satsunicgo/asia-southeast1/${name}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${who.token}`,
      },
      body: JSON.stringify({ data }),
    },
  );
  const body = await r.json();
  if (body.error) {
    const e = Error(body.error.message);
    e.code = body.error.status;
    throw e;
  }
  assert.ok("result" in body || "data" in body);
  return body.result ?? body.data;
}
async function rejected(who, name, input, code) {
  await assert.rejects(
    () => call(who, name, input),
    (e) => e.code === code,
  );
  results.push({ scenario: `reject ${name} ${code}`, status: "PASSED" });
}
const config = db.doc("settings/upfrontCheckout");
if (!(await config.get()).exists)
  await config.create({
    enabled: true,
    approved: true,
    version: 1,
    serviceBps: 500,
    termsVersion: "demo-upfront-v1",
    effectiveFrom: 0,
    expiresAt: Date.now() + 86400000,
    rates: {
      USD: { numerator: 250, denominator: 1 },
      JPY: { numerator: 170, denominator: 1 },
      KRW: { numerator: 20, denominator: 1 },
    },
  });
const demo = db.doc("settings/purchaseDemo");
if (!(await demo.get()).exists)
  await demo.create({ enabled: true, environment: "demo-satsunicgo" });
const regions = db.doc("settings/purchaseRegions");
if (!(await regions.get()).exists)
  await regions.create(
    JSON.parse(
      readFileSync("functions/assets/purchase-vn-regions.json", "utf8"),
    ),
  );
const user = await identity(`purchase-${runId}`),
  other = await identity(`purchase-other-${runId}`),
  staff = await identity(`purchase-staff-${runId}`);
await db
  .doc(`staffAccess/${staff.uid}`)
  .create({ active: true, roles: ["OWNER"], locked: false });
const productId = `purchase-${runId}`,
  lineId = randomUUID();
await db.doc(`products/${productId}`).create({
  title: "Tai nghe không dây niêm yết · demo",
  slug: productId,
  status: "published",
  market: "US",
  version: 1,
  orderable: true,
  listedPrice: 1650000,
  termsVersion: "fixture-v1",
  catalogOptions: [],
});
const add = {
  action: "addRequest",
  operationId: randomUUID(),
  expectedRevision: 0,
  request: {
    market: "US",
    items: [
      {
        name: "Tai nghe không dây · cần tìm mua",
        variant: "Trắng",
        quantity: 2,
        unitSourceMinor: 5800,
      },
    ],
    notes: "Demo purchase",
  },
};
const [a, a2] = await Promise.all([
  call(user, "purchaseCheckout", add),
  call(user, "purchaseCheckout", add),
]);
assert.deepEqual(a, a2);
assert.equal(a.cart.items.length, 1);
assert.equal(
  (await db.collection("orders").where("ownerId", "==", user.uid).get()).size,
  0,
);
results.push({
  scenario: "custom add replay once; no staff work before payment",
  status: "PASSED",
});
const upload = {
  action: "upload",
  draftId: a.id,
  itemIndex: 0,
  operationId: randomUUID(),
  mime: "image/jpeg",
  base64: readFileSync("docs/previews/payment-demo-earbuds-r4.jpg").toString(
    "base64",
  ),
};
await call(user, "purchaseDraftImage", upload);
await call(user, "purchaseDraftImage", upload);
await rejected(
  other,
  "purchaseDraftImage",
  { action: "read", draftId: a.id, itemIndex: 0 },
  "PERMISSION_DENIED",
);
let cart = (await db.doc(`carts/${user.uid}`).get()).data();
cart = await call(user, "cartCommand", {
  action: "merge",
  operationId: randomUUID(),
  expectedRevision: cart.revision,
  items: [{ productId, lineId, quantity: 1, variant: "" }],
});
const setup = await call(user, "purchaseCheckoutSetup", {}),
  province = setup.regions.find((p) => p.code === "79"),
  commune =
    province.communes.find((c) => c.name === "Phường Bến Thành") ??
    province.communes[0];
const recipient = {
  recipient: "Khách hàng demo",
  phone: "0900000000",
  country: "VN",
  provinceCode: province.code,
  communeCode: commune.code,
  province: province.name,
  commune: commune.name,
  street: "Số 10, đường minh họa",
  note: "",
};
const overviewInput = {
  action: "preview",
  operationId: randomUUID(),
  expectedRevision: cart.revision,
  recipient,
};
await rejected(other, "purchaseCheckout", overviewInput, "ABORTED");
await rejected(
  user,
  "purchaseCheckout",
  {
    ...overviewInput,
    operationId: randomUUID(),
    recipient: { ...recipient, communeCode: "00000" },
  },
  "FAILED_PRECONDITION",
);
const p = await call(user, "purchaseCheckout", overviewInput);
assert.equal(p.total, 4695000);
assert.equal(p.shipping.state, "unknown");
await rejected(
  user,
  "purchaseCheckout",
  {
    action: "commit",
    operationId: randomUUID(),
    previewId: p.id,
    previewHash: "a".repeat(64),
    confirmed: true,
  },
  "PERMISSION_DENIED",
);
const commit = {
  action: "commit",
  operationId: randomUUID(),
  previewId: p.id,
  previewHash: p.previewHash,
  confirmed: true,
};
const [c, c2] = await Promise.all([
  call(user, "purchaseCheckout", commit),
  call(user, "purchaseCheckout", commit),
]);
assert.deepEqual(c, c2);
assert.equal(
  (await db.collection("orders").where("ownerId", "==", user.uid).get()).size,
  0,
);
await rejected(
  user,
  "cartCommand",
  {
    action: "quantity",
    operationId: randomUUID(),
    expectedRevision: cart.revision + 1,
    lineId,
    quantity: 2,
  },
  "FAILED_PRECONDITION",
);
await rejected(
  other,
  "purchaseDemoPayment",
  { id: c.id, outcome: "paid" },
  "PERMISSION_DENIED",
);
await call(user, "purchaseDemoPayment", { id: c.id, outcome: "unknown" });
await call(user, "purchaseDemoPayment", { id: c.id, outcome: "pending" });
assert.equal(
  (await call(user, "purchaseCheckout", { action: "status", id: c.id })).state,
  "unknown",
);
await rejected(
  user,
  "purchaseDemoPayment",
  { id: c.id, outcome: "cancelled" },
  "FAILED_PRECONDITION",
);
const paid = await Promise.all([
  call(user, "purchaseDemoPayment", { id: c.id, outcome: "paid" }),
  call(user, "purchaseDemoPayment", { id: c.id, outcome: "paid" }),
]);
assert.deepEqual(paid[0], paid[1]);
const orders = (
  await db.collection("orders").where("ownerId", "==", user.uid).get()
).docs.map((d) => d.data());
assert.equal(orders.length, 2);
assert.equal(
  orders.reduce((s, o) => s + o.collected, 0),
  p.total,
);
assert.equal((await db.doc(`carts/${user.uid}`).get()).data().items.length, 0);
assert.equal(
  (
    await db
      .collection("financialEntries")
      .where("ownerId", "==", user.uid)
      .get()
  ).size,
  2,
);
results.push({
  scenario:
    "unknown survives reload/pending; concurrent paid allocates exactly once and consumes cart",
  status: "PASSED",
});
if (process.env.PURCHASE_REQUIRE_BACKGROUND === "true") {
  let ready = false;
  for (let i = 0; i < 12; i++) {
    const receipt = (await db.doc(`purchaseReceipts/${c.id}`).get()).data();
    if (receipt?.state === "ready" && receipt.emailState === "demo_delivered") {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  assert.ok(
    ready,
    "Background receipt must finish without a receipt read call",
  );
  results.push({
    scenario:
      "background PDF and email sink complete before any customer receipt read",
    status: "PASSED",
  });
}
const pdf = await call(user, "purchaseReceipt", { id: c.id, download: true });
assert.equal(pdf.state, "ready");
assert.equal(pdf.emailState, "demo_delivered");
assert.ok(
  Buffer.from(pdf.base64, "base64")
    .subarray(0, 8)
    .toString()
    .startsWith("%PDF-1.7"),
);
await rejected(
  other,
  "purchaseReceipt",
  { id: c.id, download: true },
  "PERMISSION_DENIED",
);
mkdirSync("output/pdf/payment-upfront-20261008", { recursive: true });
writeFileSync(
  "output/pdf/payment-upfront-20261008/receipt-e2e-initial.pdf",
  Buffer.from(pdf.base64, "base64"),
);
const order = orders.find((o) => o.upfront);
let version = order.version;
async function command(action, payload, who = staff) {
  const r = await call(who, "command", {
    action,
    operationId: randomUUID(),
    orderId: order.id,
    expectedVersion: version,
    payload,
  });
  version = r.version;
  return r;
}
await rejected(
  other,
  "command",
  {
    action: "claimPurchase",
    operationId: randomUUID(),
    orderId: order.id,
    expectedVersion: version,
    payload: {},
  },
  "PERMISSION_DENIED",
);
await command("claimPurchase", {});
await rejected(
  staff,
  "command",
  {
    action: "recordPurchase",
    operationId: randomUUID(),
    orderId: order.id,
    expectedVersion: version,
    payload: {
      quantity: 2,
      supplierOrder: "DEMO-SUPPLIER-01",
      evidence: "Giá mua cao hơn chưa duyệt",
      actualSourceMinor: 12400,
    },
  },
  "FAILED_PRECONDITION",
);
let changed = await call(staff, "purchaseSourcingChange", {
  action: "propose",
  operationId: randomUUID(),
  orderId: order.id,
  expectedVersion: version,
  sourceLimitMinor: 12400,
  reason: "Giá cửa hàng tăng; khách duyệt trước khi mua",
});
version = changed.version;
changed = await call(user, "purchaseSourcingChange", {
  action: "approve",
  operationId: randomUUID(),
  orderId: order.id,
  expectedVersion: version,
  proposalVersion: 1,
});
version = changed.version;
await rejected(
  staff,
  "command",
  {
    action: "recordPurchase",
    operationId: randomUUID(),
    orderId: order.id,
    expectedVersion: version,
    payload: {
      quantity: 2,
      supplierOrder: "DEMO-SUPPLIER-01",
      evidence: "Đã duyệt nhưng chưa đủ tiền",
      actualSourceMinor: 12400,
    },
  },
  "FAILED_PRECONDITION",
);
const sourcePreview = await call(user, "purchaseBalanceCheckout", {
  action: "preview",
  operationId: randomUUID(),
  orderId: order.id,
  expectedVersion: version,
});
assert.equal(sourcePreview.total, 200000);
assert.equal(sourcePreview.balanceReason, "sourcing");
const sourceCheckout = await call(user, "purchaseBalanceCheckout", {
  action: "commit",
  operationId: randomUUID(),
  previewId: sourcePreview.id,
  previewHash: sourcePreview.previewHash,
  confirmed: true,
});
await call(user, "purchaseDemoPayment", {
  id: sourceCheckout.id,
  outcome: "paid",
});
const sourcePdf = await call(user, "purchaseReceipt", {
  id: sourceCheckout.id,
  download: true,
});
assert.equal(sourcePdf.state, "ready");
writeFileSync(
  "output/pdf/payment-upfront-20261008/receipt-e2e-price-change.pdf",
  Buffer.from(sourcePdf.base64, "base64"),
);
version = (await db.doc(`orders/${order.id}`).get()).data().version;
results.push({
  scenario:
    "higher source price blocked until customer approval and exact 200000 funding",
  status: "PASSED",
});
await command("recordPurchase", {
  quantity: 2,
  supplierOrder: "DEMO-SUPPLIER-01",
  evidence: "Chứng từ mua thử nghiệm",
  actualSourceMinor: 12400,
});
await command("receive", {
  quantity: 2,
  condition: "good",
  shelf: "DEMO",
  evidence: "Kiểm hàng thử nghiệm",
});
await command("pack", {
  weightGrams: 1500,
  dimensionsCm: [20, 10, 10],
  evidence: "Đóng gói thử nghiệm",
  checklist: true,
});
await command("finalize", {
  total: 3500000,
  reason: "Giá mua thực tế cao hơn và cước đã kiểm tra",
});
await rejected(
  staff,
  "command",
  {
    action: "dispatch",
    operationId: randomUUID(),
    orderId: order.id,
    expectedVersion: version,
    payload: {},
  },
  "FAILED_PRECONDITION",
);
await command("approveFinal", {}, user);
const b = await call(user, "purchaseBalanceCheckout", {
  action: "preview",
  operationId: randomUUID(),
  orderId: order.id,
  expectedVersion: version,
});
assert.equal(b.total, 255000);
assert.equal(b.previouslyPaid, 3245000);
const bCommand = {
  action: "commit",
  operationId: randomUUID(),
  previewId: b.id,
  previewHash: b.previewHash,
  confirmed: true,
};
const bc = await call(user, "purchaseBalanceCheckout", bCommand);
assert.deepEqual(bc, await call(user, "purchaseBalanceCheckout", bCommand));
await call(user, "purchaseDemoPayment", { id: bc.id, outcome: "paid" });
await call(user, "purchaseDemoPayment", { id: bc.id, outcome: "paid" });
const final = (await db.doc(`orders/${order.id}`).get()).data();
assert.equal(final.collected, 3500000);
assert.equal(final.stage, "READY_TO_SHIP");
version = final.version;
await command("dispatch", {});
assert.equal(
  (await db.doc(`orders/${order.id}`).get()).data().stage,
  "IN_TRANSIT",
);
const bp = await call(user, "purchaseReceipt", { id: bc.id, download: true });
assert.equal(bp.state, "ready");
assert.equal(bp.emailState, "demo_delivered");
writeFileSync(
  "output/pdf/payment-upfront-20261008/receipt-e2e-balance.pdf",
  Buffer.from(bp.base64, "base64"),
);
assert.equal(
  (await db.doc(`purchaseReceipts/${bc.id}`).get()).data().previousReceiptId,
  sourceCheckout.id,
);
results.push({
  scenario:
    "funded staff sourcing, actual higher cost, customer approval, exact top-up, dispatch and linked PDF/email demo",
  status: "PASSED",
});
const report = {
  runId,
  status: "PASSED",
  boundary:
    "shared local demo; real HTTP Auth/Functions/Firestore/Storage; no provider or real email",
  checkoutId: c.id,
  balanceCheckoutId: bc.id,
  priceChangeCheckoutId: sourceCheckout.id,
  orderIds: orders.map((o) => o.id),
  total: p.total,
  balance: b.total,
  results,
  pdfHashes: {
    initial: createHash("sha256")
      .update(Buffer.from(pdf.base64, "base64"))
      .digest("hex"),
    balance: createHash("sha256")
      .update(Buffer.from(bp.base64, "base64"))
      .digest("hex"),
  },
};
writeFileSync(
  "docs/reviews/PAYMENT-UPFRONT-20261008/E2E-HTTP.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    status: report.status,
    checks: results.length,
    total: p.total,
    balance: b.total,
    checkout: c.id,
  }),
);
await db.terminate();
