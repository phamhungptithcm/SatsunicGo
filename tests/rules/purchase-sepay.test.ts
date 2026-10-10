import { beforeAll, afterAll, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import {
  sepayInvoice,
  SEPAY_MERCHANT,
  type SePayIntent,
  type SePayIpn,
} from "../../packages/domain/purchase-sepay";
import {
  createSandboxAdapter,
  type SePayAdapter,
} from "../../functions/src/payments/sepay-sandbox";

// Entry-point command bootstrap normally runs once in a Functions process.
// Reuse this test's explicitly emulated app when importing the real handler.
vi.mock("firebase-admin/app", async (original) => {
  const actual = await original<typeof import("firebase-admin/app")>();
  return {
    ...actual,
    initializeApp: (...args: Parameters<typeof actual.initializeApp>) =>
      actual.getApps().length ? actual.getApp() : actual.initializeApp(...args),
  };
});

let app: ReturnType<typeof initializeApp>;
let checkout: typeof import("../../functions/src/purchase-checkout");
let sepay: typeof import("../../functions/src/purchase-sepay");
let cart: typeof import("../../functions/src/cart");
let receipts: typeof import("../../functions/src/purchase-receipts");
const productId = `sepay-fixture-${randomUUID()}`;
const req = (uid: string, data: unknown) =>
  ({
    data,
    auth: {
      uid,
      token: {
        email_verified: true,
        email: "synthetic@satsunicgo.example.invalid",
        firebase: { sign_in_provider: "google.com" },
      },
    },
  }) as CallableRequest;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
beforeAll(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:18207")
    throw Error("SHARED_DEMO_ONLY");
  process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId: "demo-satsunicgo",
    storageBucket: "demo-satsunicgo.appspot.com",
  });
  process.env.PURCHASE_SEPAY_SANDBOX_ENABLED = "true";
  process.env.SEPAY_SANDBOX_SECRET_KEY =
    "synthetic-fixture-only-no-provider-access";
  process.env.SEPAY_SANDBOX_IPN_SECRET_KEY =
    "synthetic-ipn-fixture-only-no-provider-access";
  app = initializeApp({
    projectId: "demo-satsunicgo",
    storageBucket: "demo-satsunicgo.appspot.com",
  });
  checkout = await import("../../functions/src/purchase-checkout");
  sepay = await import("../../functions/src/purchase-sepay");
  cart = await import("../../functions/src/cart");
  receipts = await import("../../functions/src/purchase-receipts");
  const db = getFirestore();
  // Human approved a fresh demo runtime. Create only missing synthetic settings;
  // never replace existing shared policy or data.
  const settings = {
    "settings/upfrontCheckout": {
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
    },
    "settings/purchaseDemo": { enabled: true, environment: "demo-satsunicgo" },
    "settings/purchaseRegions": JSON.parse(
      readFileSync("functions/assets/purchase-vn-regions.json", "utf8"),
    ),
  };
  for (const [path, value] of Object.entries(settings))
    if (!(await db.doc(path).get()).exists) await db.doc(path).create(value);
  await db.doc(`products/${productId}`).create({
    title: "Tai nghe niêm yết · kiểm thử",
    slug: productId,
    status: "published",
    market: "US",
    version: 1,
    orderable: true,
    listedPrice: 1650000,
    termsVersion: "fixture-v1",
    catalogOptions: [],
  });
});
afterAll(async () => {
  if (app) {
    await getFirestore().terminate();
    await deleteApp(app);
  }
});
async function readyReceipt(id: string) {
  for (let i = 0; i < 10; i++) {
    await receipts.processPurchaseReceipt(id);
    const state = (
      await getFirestore().doc(`purchaseReceipts/${id}`).get()
    ).data()?.state;
    if (state === "ready") return;
    expect(["queued", "processing"]).toContain(state);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw Error("PDF_READY_DEADLINE");
}
async function createCheckout(mixed = true) {
  const uid = `sepay-owner-${randomUUID()}`,
    added = (await checkout.purchaseCheckout.run(
      req(uid, {
        action: "addRequest",
        operationId: randomUUID(),
        expectedRevision: 0,
        request: {
          market: "US",
          notes: "Synthetic SePay contract",
          items: [
            {
              name: "Tai nghe cần tìm mua",
              variant: "Trắng",
              quantity: 2,
              unitSourceMinor: 5800,
            },
          ],
        },
      }),
    )) as { cart: { revision: number } };
  let revision = added.cart.revision;
  if (mixed) {
    const merged = (await cart.cartCommand.run(
      req(uid, {
        action: "merge",
        operationId: randomUUID(),
        expectedRevision: revision,
        items: [{ productId, lineId: randomUUID(), quantity: 1, variant: "" }],
      }),
    )) as { revision: number };
    revision = merged.revision;
  }
  const setup = await checkout.purchaseCheckoutSetup.run(req(uid, {}));
  const region = setup.regions[0],
    commune = region.communes[0];
  const preview = (await checkout.purchaseCheckout.run(
    req(uid, {
      action: "preview",
      operationId: randomUUID(),
      expectedRevision: revision,
      recipient: {
        recipient: "Khách kiểm thử",
        phone: "0900000000",
        country: "VN",
        provinceCode: region.code,
        province: region.name,
        communeCode: commune.code,
        commune: commune.name,
        street: "Số 10, đường kiểm thử",
        note: "",
      },
    }),
  )) as { id: string; previewHash: string; total: number };
  const command = {
    action: "commit",
    operationId: randomUUID(),
    previewId: preview.id,
    previewHash: preview.previewHash,
    confirmed: true,
    paymentMethod: "BANK_TRANSFER",
  };
  return {
    uid,
    preview,
    command,
    commit: () => checkout.purchaseCheckout.run(req(uid, command)),
  };
}
async function intentFor(c: Awaited<ReturnType<typeof createCheckout>>) {
  await c.commit();
  const adapter = createSandboxAdapter(
    "synthetic-fixture-only-no-provider-access",
  );
  await sepay.handleSePayPayment(
    req(c.uid, { id: c.preview.id, action: "createCheckout" }),
    adapter,
  );
  return (
    await getFirestore().doc(`purchaseSePayIntents/${c.preview.id}`).get()
  ).data() as SePayIntent;
}
function proofFixture(
  intent: SePayIntent,
  amount = intent.amount,
  status = "CAPTURED",
) {
  const date = new Date().toISOString(),
    txn = `txn-${randomUUID()}`;
  const order = {
    id: `internal-${randomUUID()}`,
    order_id: `SEPAY-${randomUUID()}`,
    order_invoice_number: intent.invoice,
    order_amount: `${intent.amount}.00`,
    order_currency: "VND",
    order_status: status,
  };
  const transaction = {
    id: txn,
    payment_method: "BANK_TRANSFER",
    transaction_type: "PAYMENT",
    transaction_status: "APPROVED",
    transaction_amount: String(amount),
    transaction_currency: "VND",
    transaction_date: date,
  };
  const notification = {
    timestamp: Math.floor(Date.now() / 1000),
    notification_type: "ORDER_PAID",
    order,
    transaction,
  } as SePayIpn;
  const raw = { data: { ...order, transactions: [transaction] } };
  const adapter: SePayAdapter = {
    form: createSandboxAdapter("synthetic-fixture-only-no-provider-access")
      .form,
    readback: async () => raw,
  };
  return { notification, raw, adapter };
}
test("mixed cart → one immutable invoice → authenticated IPN/readback → allocation/PDF and duplicate replay", async () => {
  const c = await createCheckout();
  expect(c.preview.total).toBe(4695000);
  const [a, b] = await Promise.all([c.commit(), c.commit()]);
  expect(a).toEqual(b);
  const adapter = createSandboxAdapter(
    "synthetic-fixture-only-no-provider-access",
  );
  const forms = await Promise.all(
    Array.from({ length: 4 }, () =>
      sepay.handleSePayPayment(
        req(c.uid, { id: c.preview.id, action: "createCheckout" }),
        adapter,
      ),
    ),
  );
  expect(
    forms.every((f) => JSON.stringify(f) === JSON.stringify(forms[0])),
  ).toBe(true);
  const db = getFirestore(),
    intent = (
      await db.doc(`purchaseSePayIntents/${c.preview.id}`).get()
    ).data() as SePayIntent;
  expect(intent.invoice).toBe(sepayInvoice(c.preview.id));
  expect(
    (await db.collection("orders").where("ownerId", "==", c.uid).get()).size,
  ).toBe(0);
  const f = proofFixture(intent),
    inbox = await sepay.admitSePayIpn({
      ...f.notification,
      customer: { name: "DO_NOT_STORE" },
    });
  expect(await sepay.admitSePayIpn(f.notification)).toBe(inbox);
  await sepay.processSePayInbox(inbox, f.adapter);
  const stored = (
    await db.doc(`purchaseCheckouts/${c.preview.id}`).get()
  ).data()!;
  expect(stored.state).toBe("paid");
  const orders = await db
    .collection("orders")
    .where("ownerId", "==", c.uid)
    .get();
  expect(orders.size).toBe(2);
  expect(orders.docs.reduce((s, d) => s + d.data().collected, 0)).toBe(
    c.preview.total,
  );
  expect(orders.docs.every((d) => d.data().testMode === true)).toBe(true);
  const entries = await db
    .collection("purchaseTestFinancialEntries")
    .where("checkoutId", "==", c.preview.id)
    .get();
  expect(entries.size).toBe(2);
  expect(
    (await db.collection("financialEntries")
      .where("checkoutId", "==", c.preview.id).get()).size,
  ).toBe(0);
  const proofId = hash(
    `sepay_sandbox|${SEPAY_MERCHANT}|${f.notification.transaction.id}`,
  );
  const settlement = await import("../../functions/src/purchase-settlement");
  await Promise.all(
    Array.from({ length: 5 }, () => settlement.settleSePayEvidence(proofId)),
  );
  await sepay.processSePayInbox(inbox, f.adapter);
  expect(
    (
      await db
        .collection("purchaseTestFinancialEntries")
        .where("checkoutId", "==", c.preview.id)
        .get()
    ).size,
  ).toBe(2);
  expect(
    JSON.stringify((await db.doc(`purchaseSePayInbox/${inbox}`).get()).data()),
  ).not.toContain("DO_NOT_STORE");
  await readyReceipt(c.preview.id);
  const receipt = (
    await db.doc(`purchaseReceipts/${c.preview.id}`).get()
  ).data()!;
  expect(receipt).toMatchObject({
    provider: "sepay_sandbox",
    paymentMethod: "BANK_TRANSFER",
    state: "ready",
    emailState: "demo_delivered",
  });
  expect(
    (await db.doc(`purchaseEmailOutbox/${c.preview.id}`).get()).data()
      ?.transport,
  ).toBe("demo_sink");
  expect((await db.doc(`carts/${c.uid}`).get()).data()?.items).toEqual([]);
});
test.each(["CARD", "NAPAS_BANK_TRANSFER", undefined])(
  "rejects unavailable/missing sandbox method %s without creating checkout",
  async (paymentMethod) => {
    const c = await createCheckout(false);
    await expect(
      checkout.purchaseCheckout.run(
        req(c.uid, { ...c.command, paymentMethod }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    expect(
      (await getFirestore().doc(`purchaseCheckouts/${c.preview.id}`).get())
        .exists,
    ).toBe(false);
  },
);
test("owner/auth/overposting boundaries and no direct demo settlement on sandbox", async () => {
  const c = await createCheckout(false);
  await intentFor(c);
  await expect(
    sepay.handleSePayPayment(
      req("foreign", { id: c.preview.id, action: "status" }),
    ),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(
    sepay.handleSePayPayment({
      data: { id: c.preview.id, action: "status" },
    } as CallableRequest),
  ).rejects.toMatchObject({ code: "unauthenticated" });
  await expect(
    sepay.handleSePayPayment(
      req(c.uid, { id: c.preview.id, action: "status", amount: 1 }),
    ),
  ).rejects.toMatchObject({ code: "invalid-argument" });
  await expect(
    checkout.applyPurchaseDemoOutcome({
      id: c.preview.id,
      uid: c.uid,
      outcome: "paid",
    }),
  ).rejects.toMatchObject({ code: "permission-denied" });
});
test.each([-1, 1])(
  "under/overpayment %s stays in review with no orders or receipt",
  async (delta) => {
    const c = await createCheckout(false),
      intent = await intentFor(c),
      f = proofFixture(intent, intent.amount + delta),
      inbox = await sepay.admitSePayIpn(f.notification);
    await sepay.processSePayInbox(inbox, f.adapter);
    const db = getFirestore();
    expect(
      (await db.doc(`purchaseCheckouts/${c.preview.id}`).get()).data()?.state,
    ).toBe("review_required");
    expect(
      (await db.collection("orders").where("ownerId", "==", c.uid).get()).size,
    ).toBe(0);
    expect(
      (await db.doc(`purchaseReceipts/${c.preview.id}`).get()).exists,
    ).toBe(false);
  },
);
test("timeout/pending and forged return never allocate; manual retry uses same intent", async () => {
  const c = await createCheckout(false),
    intent = await intentFor(c),
    f = proofFixture(intent, intent.amount, "AUTHENTICATION_NOT_NEEDED"),
    key = await sepay.admitSePayIpn(f.notification);
  await expect(
    sepay.processSePayInbox(key, {
      ...f.adapter,
      readback: async () => {
        throw Error("SECRET PII");
      },
    }),
  ).rejects.toThrow("SEPAY_RETRY_REQUIRED");
  const db = getFirestore();
  expect(
    (await db.doc(`purchaseCheckouts/${c.preview.id}`).get()).data()?.state,
  ).toBe("unknown");
  expect(
    JSON.stringify((await db.doc(`purchaseSePayInbox/${key}`).get()).data()),
  ).not.toContain("SECRET PII");
  await db
    .doc(`purchaseSePayIntents/${c.preview.id}`)
    .update({ nextReadAt: 0 });
  await expect(sepay.processSePayInbox(key, f.adapter)).rejects.toThrow(
    "SEPAY_RETRY_REQUIRED",
  );
  expect((await db.doc(`purchaseReceipts/${c.preview.id}`).get()).exists).toBe(
    false,
  );
});
test("unknown invoice/conflicting replay cannot overwrite pinned order or inbox", async () => {
  const c = await createCheckout(false),
    intent = await intentFor(c),
    f = proofFixture(intent),
    key = await sepay.admitSePayIpn(f.notification);
  await expect(
    sepay.admitSePayIpn({
      ...f.notification,
      order: { ...f.notification.order, order_id: "FOREIGN" },
    }),
  ).rejects.toThrow("SEPAY_BINDING_MISMATCH");
  await expect(
    sepay.admitSePayIpn({
      ...f.notification,
      transaction: { ...f.notification.transaction, transaction_amount: "1" },
    }),
  ).rejects.toThrow("SEPAY_REPLAY_CONFLICT");
  expect(
    (await getFirestore().doc(`purchaseSePayInbox/${key}`).get()).data()?.state,
  ).toBe("queued");
});
test.each(["cooldown", "lease"])(
  "a distinct transaction during %s is retried and retained without double allocation",
  async (gate) => {
    const c = await createCheckout(false),
      intent = await intentFor(c),
      f = proofFixture(intent),
      key = await sepay.admitSePayIpn(f.notification),
      db = getFirestore();
    await sepay.processSePayInbox(key, f.adapter);
    const second = structuredClone(f.notification);
    second.transaction.id = `second-${randomUUID()}`;
    const secondKey = await sepay.admitSePayIpn(second);
    const adapter = {
      ...f.adapter,
      readback: async () => ({
        data: {
          ...second.order,
          transactions: [f.notification.transaction, second.transaction],
        },
      }),
    };
    await db
      .doc(`purchaseSePayIntents/${c.preview.id}`)
      .update(
        gate === "lease"
          ? { leaseUntil: Date.now() + 60000, nextReadAt: 0 }
          : { nextReadAt: Date.now() + 60000 },
      );
    await expect(sepay.processSePayInbox(secondKey, adapter)).rejects.toThrow(
      "SEPAY_RETRY_REQUIRED",
    );
    expect(
      (await db.doc(`purchaseSePayInbox/${secondKey}`).get()).data()?.state,
    ).toBe("queued");
    expect(
      (
        await db
          .doc(`purchasePaymentEvidence/SEPAY-SBX-${second.transaction.id}`)
          .get()
      ).exists,
    ).toBe(false);
    // Simulate expiry only after proving the distinct notification was not dropped.
    await db
      .doc(`purchaseSePayIntents/${c.preview.id}`)
      .update({ nextReadAt: 0, leaseUntil: 0 });
    await sepay.processSePayInbox(secondKey, adapter);
    const evidence = (
      await db
        .doc(`purchasePaymentEvidence/SEPAY-SBX-${second.transaction.id}`)
        .get()
    ).data();
    expect(evidence).toMatchObject({
      allocationState: "review_required",
      reason: "SECOND_TRANSACTION",
      amount: intent.amount,
    });
    expect(
      (
        await db
          .collection("purchaseTestFinancialEntries")
          .where("checkoutId", "==", c.preview.id)
          .get()
      ).size,
    ).toBe(1);
  },
);
test("authenticated void holds fulfillment without automatically reversing money", async () => {
  const c = await createCheckout(false),
    intent = await intentFor(c),
    f = proofFixture(intent),
    key = await sepay.admitSePayIpn(f.notification),
    db = getFirestore();
  await sepay.processSePayInbox(key, f.adapter);
  const voidKey = await sepay.admitSePayIpn({
    ...f.notification,
    notification_type: "TRANSACTION_VOID",
  });
  await sepay.processSePayInbox(voidKey, f.adapter);
  const order = (
    await db.collection("orders").where("ownerId", "==", c.uid).get()
  ).docs[0].data();
  expect(order.hold).toBeTruthy();
  expect(order.collected).toBe(intent.amount);
  expect(
    (await db.doc(`purchaseSePayInbox/${voidKey}`).get()).data(),
  ).toMatchObject({
    state: "review_required",
    failureCode: "VOID_REQUIRES_REVIEW",
  });
  expect(
    (
      await db
        .collection("purchaseTestFinancialEntries")
        .where("checkoutId", "==", c.preview.id)
        .get()
    ).size,
  ).toBe(1);
});
test("reference reused across checkouts preserves conflict proof and holds second checkout", async () => {
  const c1 = await createCheckout(false),
    i1 = await intentFor(c1),
    f1 = proofFixture(i1),
    key1 = await sepay.admitSePayIpn(f1.notification),
    db = getFirestore();
  await sepay.processSePayInbox(key1, f1.adapter);
  const c2 = await createCheckout(false),
    i2 = await intentFor(c2),
    f2 = proofFixture(i2);
  f2.notification.transaction.id = f1.notification.transaction.id;
  f2.raw.data.transactions[0].id = f1.notification.transaction.id;
  const key2 = await sepay.admitSePayIpn(f2.notification);
  await sepay.processSePayInbox(key2, f2.adapter);
  expect(
    (await db.doc(`purchaseCheckouts/${c2.preview.id}`).get()).data()?.state,
  ).toBe("review_required");
  expect(
    (await db.doc(`purchaseSePayIntents/${c2.preview.id}`).get()).data()
      ?.failureCode,
  ).toBe("REFERENCE_REUSED");
  expect(
    (await db.collection("orders").where("ownerId", "==", c2.uid).get()).size,
  ).toBe(0);
});
test("IPN HTTP boundary rejects missing auth/oversize/method; acknowledges only durable normalized input", async () => {
  const c = await createCheckout(false),
    intent = await intentFor(c),
    f = proofFixture(intent);
  async function ipnRequest(
    method: string,
    header: string,
    body: unknown,
    bytes?: number,
  ) {
    let status = 200;
    let sent = false;
    const res = {
      status: (n: number) => {
        status = n;
        return res;
      },
      json: () => {
        sent = true;
        return res;
      },
      end: () => {
        sent = true;
        return res;
      },
    };
    const request = {
      method,
      body,
      rawBody: Buffer.alloc(bytes ?? Buffer.byteLength(JSON.stringify(body))),
      get: (name: string) =>
        name === "X-Secret-Key" ? header : "application/json",
    };
    await sepay.handleSePayIpn(request as never, res as never);
    expect(sent).toBe(true);
    return status;
  }
  expect(await ipnRequest("GET", "", {})).toBe(405);
  expect(await ipnRequest("POST", "", f.notification)).toBe(401);
  expect(await ipnRequest("POST", "wrong", f.notification)).toBe(401);
  expect(
    await ipnRequest(
      "POST",
      "synthetic-ipn-fixture-only-no-provider-access",
      f.notification,
      65537,
    ),
  ).toBe(400);
  expect(
    await ipnRequest(
      "POST",
      "synthetic-ipn-fixture-only-no-provider-access",
      f.notification,
    ),
  ).toBe(200);
  expect(
    (await getFirestore().doc(`purchaseCheckouts/${c.preview.id}`).get()).data()
      ?.state,
  ).toBe("pending");
});
test.each(["locked", "expired", "cancelled"])(
  "confirmed money after %s is retained for review",
  async (kind) => {
    const c = await createCheckout(false),
      intent = await intentFor(c),
      f = proofFixture(intent),
      key = await sepay.admitSePayIpn(f.notification),
      db = getFirestore();
    if (kind === "locked") await db.doc(`users/${c.uid}`).set({ locked: true });
    if (kind === "expired")
      await db
        .doc(`purchaseCheckouts/${c.preview.id}`)
        .update({ expiresAt: 0 });
    if (kind === "cancelled")
      await db
        .doc(`purchaseCheckouts/${c.preview.id}`)
        .update({ state: "cancelled" });
    await sepay.processSePayInbox(key, f.adapter);
    expect(
      (await db.doc(`purchaseCheckouts/${c.preview.id}`).get()).data()?.state,
    ).toBe("review_required");
    expect(
      (await db.collection("orders").where("ownerId", "==", c.uid).get()).size,
    ).toBe(0);
  },
);
test("cross-process verified proof allocates once without the in-memory queue", async () => {
  const c = await createCheckout(),
    intent = await intentFor(c),
    f = proofFixture(intent),
    key = await sepay.admitSePayIpn(f.notification),
    db = getFirestore();
  // Persist proof then simulate the allocator dying before writing the ledger.
  const bound = (
    await db.doc(`purchaseSePayIntents/${c.preview.id}`).get()
  ).data() as SePayIntent;
  const { verifySePayReadback } =
    await import("../../packages/domain/purchase-sepay");
  const proof = verifySePayReadback(f.raw, bound, f.notification)!,
    proofId = hash(`sepay_sandbox|${SEPAY_MERCHANT}|${proof.transactionId}`);
  await db.doc(`purchaseSePayEvidence/${proofId}`).create(proof);
  await db
    .doc(`purchaseSePayIntents/${c.preview.id}`)
    .update({ verifiedEvidenceId: proofId });
  const result = await promisify(execFile)(
    process.execPath,
    ["scripts/purchase-sepay-cross-process.mjs", proofId],
    { env: process.env, timeout: 40000, maxBuffer: 65536 },
  );
  expect(JSON.parse(result.stdout)).toMatchObject({
    state: "paid",
    processes: 4,
    entries: 2,
    total: c.preview.total,
  });
  await db
    .doc(`purchaseSePayIntents/${c.preview.id}`)
    .update({ nextReadAt: 0 });
  await sepay.reconcileSePayIntent(c.preview.id, {
    ...f.adapter,
    readback: async () => {
      throw Error("PROVIDER_DOWN");
    },
  });
  expect(
    (await db.doc(`purchaseCheckouts/${c.preview.id}`).get()).data()?.state,
  ).toBe("paid");
  expect((await db.doc(`purchaseSePayInbox/${key}`).get()).exists).toBe(true);
}, 45000);
test.each([false, true])(
  "approved source price top-up is paid exactly once; stale target=%s is held",
  async (stale) => {
    const c = await createCheckout(false),
      intent = await intentFor(c),
      f = proofFixture(intent),
      key = await sepay.admitSePayIpn(f.notification),
      db = getFirestore();
    await sepay.processSePayInbox(key, f.adapter);
    const order = (
        await db.collection("orders").where("ownerId", "==", c.uid).get()
      ).docs[0],
      staff = `sepay-staff-${randomUUID()}`;
    await db
      .doc(`staffAccess/${staff}`)
      .create({ active: true, roles: ["OWNER"], locked: false });
    const { command } = await import("../../functions/src/index"),
      { purchaseSourcingChange } =
        await import("../../functions/src/purchase-adjustment");
    let version = order.data().version;
    const claim = await command.run(
      req(staff, {
        action: "claimPurchase",
        operationId: randomUUID(),
        orderId: order.id,
        expectedVersion: version,
        payload: {},
      }),
    );
    version = claim.version;
    const proposed = await purchaseSourcingChange.run(
      req(staff, {
        action: "propose",
        operationId: randomUUID(),
        orderId: order.id,
        expectedVersion: version,
        sourceLimitMinor: 12400,
        reason: "Giá cửa hàng tăng trong kiểm thử",
      }),
    );
    version = proposed.version;
    const approved = await purchaseSourcingChange.run(
      req(c.uid, {
        action: "approve",
        operationId: randomUUID(),
        orderId: order.id,
        expectedVersion: version,
        proposalVersion: 1,
      }),
    );
    version = approved.version;
    await expect(
      command.run(
        req(staff, {
          action: "recordPurchase",
          operationId: randomUUID(),
          orderId: order.id,
          expectedVersion: version,
          payload: {
            quantity: 2,
            supplierOrder: "SYNTHETIC",
            evidence: "Chưa trả đủ",
            actualSourceMinor: 12400,
          },
        }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    const p = (await checkout.purchaseBalanceCheckout.run(
      req(c.uid, {
        action: "preview",
        operationId: randomUUID(),
        orderId: order.id,
        expectedVersion: version,
      }),
    )) as { id: string; previewHash: string; total: number };
    expect(p.total).toBe(200000);
    const input = {
      action: "commit",
      operationId: randomUUID(),
      previewId: p.id,
      previewHash: p.previewHash,
      confirmed: true,
      paymentMethod: "BANK_TRANSFER",
    };
    await expect(
      checkout.purchaseBalanceCheckout.run(
        req(c.uid, { ...input, paymentMethod: "CARD" }),
      ),
    ).rejects.toMatchObject({ code: "failed-precondition" });
    const [a, b] = await Promise.all([
      checkout.purchaseBalanceCheckout.run(req(c.uid, input)),
      checkout.purchaseBalanceCheckout.run(req(c.uid, input)),
    ]);
    expect(a).toEqual(b);
    await sepay.handleSePayPayment(
      req(c.uid, { id: p.id, action: "createCheckout" }),
      createSandboxAdapter("synthetic-fixture-only-no-provider-access"),
    );
    const topIntent = (
        await db.doc(`purchaseSePayIntents/${p.id}`).get()
      ).data() as SePayIntent,
      top = proofFixture(topIntent),
      topKey = await sepay.admitSePayIpn(top.notification);
    if (stale) await order.ref.update({ version: version + 2 });
    await sepay.processSePayInbox(topKey, top.adapter);
    const result = (await order.ref.get()).data()!;
    expect(
      (await db.doc(`purchaseCheckouts/${p.id}`).get()).data()?.state,
    ).toBe(stale ? "review_required" : "paid");
    expect(result.collected).toBe(c.preview.total + (stale ? 0 : 200000));
    if (stale) {
      expect(result.hold).toBeTruthy();
      expect((await db.doc(`purchaseReceipts/${p.id}`).get()).exists).toBe(
        false,
      );
    } else {
      await readyReceipt(p.id);
      expect(
        (await db.doc(`purchaseReceipts/${p.id}`).get()).data(),
      ).toMatchObject({
        state: "ready",
        purpose: "balance",
        previousReceiptId: c.preview.id,
        paymentMethod: "BANK_TRANSFER",
      });
    }
  },
  30000,
);

test("expired inbox lease is reclaimed, active lease does not allocate", async () => {
  const c = await createCheckout(false),
    intent = await intentFor(c),
    f = proofFixture(intent),
    key = await sepay.admitSePayIpn(f.notification),
    db = getFirestore();
  await db.doc(`purchaseSePayInbox/${key}`).update({
    state: "processing",
    claim: "stale-fixture-worker",
    leaseUntil: Date.now() + 60000,
  });
  await sepay.processSePayInbox(key, f.adapter);
  expect(
    (await db.doc(`purchaseCheckouts/${c.preview.id}`).get()).data()?.state,
  ).toBe("pending");
  await db
    .doc(`purchaseSePayInbox/${key}`)
    .update({ leaseUntil: Date.now() - 1 });
  await sepay.processSePayInbox(key, f.adapter);
  expect(
    (await db.doc(`purchaseSePayInbox/${key}`).get()).data(),
  ).toMatchObject({ state: "done", leaseUntil: 0 });
});
test("receipt rendering failure is bounded and never reverses a verified payment", async () => {
  const c = await createCheckout(false),
    intent = await intentFor(c),
    f = proofFixture(intent),
    key = await sepay.admitSePayIpn(f.notification),
    db = getFirestore();
  await sepay.processSePayInbox(key, f.adapter);
  await readyReceipt(c.preview.id);
  await db
    .doc(`purchaseReceiptJobs/${c.preview.id}`)
    .update({ state: "queued", attempts: 0, leaseUntil: 0 });
  // Deliberately corrupt only a named synthetic receipt snapshot after the paid
  // transaction, exercising failure isolation rather than changing real money.
  await db.doc(`purchaseReceipts/${c.preview.id}`).update({
    lines: [],
    snapshotHash: "corrupted-synthetic-fixture",
    state: "queued",
  });
  for (let attempt = 0; attempt < 3; attempt++)
    await receipts.processPurchaseReceipt(c.preview.id);
  expect(
    (await db.doc(`purchaseReceiptJobs/${c.preview.id}`).get()).data(),
  ).toMatchObject({
    state: "failed",
    attempts: 3,
    failureDetail: "RECEIPT_INVALID",
    leaseUntil: 0,
  });
  expect(
    (await db.doc(`purchaseCheckouts/${c.preview.id}`).get()).data()?.state,
  ).toBe("paid");
  expect(
    (
      await db
        .collection("purchaseTestFinancialEntries")
        .where("checkoutId", "==", c.preview.id)
        .get()
    ).size,
  ).toBe(1);
});

test("return before IPN cannot guess a provider order or turn a callback into money", async () => {
  const c = await createCheckout(false);
  await intentFor(c);
  const readback = vi.fn(async () => {
    throw Error("MUST_NOT_CALL_PROVIDER");
  });
  const response = await sepay.handleSePayPayment(
    req(c.uid, { id: c.preview.id, action: "reconcile" }),
    {
      ...createSandboxAdapter("synthetic-fixture-only-no-provider-access"),
      readback,
    },
  );
  expect(response).toMatchObject({ id: c.preview.id, state: "pending" });
  expect(readback).not.toHaveBeenCalled();
  const db = getFirestore();
  expect(
    (await db.collection("orders").where("ownerId", "==", c.uid).get()).size,
  ).toBe(0);
  expect((await db.doc(`purchaseReceipts/${c.preview.id}`).get()).exists).toBe(
    false,
  );
});

test("confirmed unpaid demo cancellation can reconcile repeatedly without new writes or releasing a newer cart", async () => {
  const enabled = process.env.PURCHASE_SEPAY_SANDBOX_ENABLED;
  let c: Awaited<ReturnType<typeof createCheckout>>;
  try {
    process.env.PURCHASE_SEPAY_SANDBOX_ENABLED = "false";
    c = await createCheckout(false);
    await c.commit();
  } finally {
    process.env.PURCHASE_SEPAY_SANDBOX_ENABLED = enabled;
  }
  const db = getFirestore(),
    linkId = randomUUID();
  await db.doc(`purchaseDemoLinks/${c.preview.id}`).create({
    ownerId: c.uid,
    paymentLinkId: linkId,
    status: "CANCELLED",
    amount: c.preview.total,
    currency: "VND",
  });
  const { applyDemoSettlement } =
    await import("../../functions/src/purchase-settlement");
  const input = {
    id: c.preview.id,
    uid: c.uid,
    outcome: "cancelled" as const,
    linkId,
  };
  await applyDemoSettlement(input);
  // A later cart must not be unlocked or incremented by replay of the old one.
  await db.doc(`carts/${c.uid}`).update({ activeCheckoutId: randomUUID() });
  const before = await db.getAll(
    db.doc(`purchaseCheckouts/${c.preview.id}`),
    db.doc(`carts/${c.uid}`),
  );
  expect(await applyDemoSettlement(input)).toEqual({
    id: c.preview.id,
    state: "cancelled",
  });
  expect(await applyDemoSettlement(input)).toEqual({
    id: c.preview.id,
    state: "cancelled",
  });
  const after = await db.getAll(...before.map((s) => s.ref));
  expect(after.map((s) => s.data())).toEqual(before.map((s) => s.data()));
  await expect(
    applyDemoSettlement({ ...input, linkId: "wrong-link" }),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  expect(
    (await db.collection("orders").where("ownerId", "==", c.uid).get()).size,
  ).toBe(0);
  expect((await db.doc(`purchaseReceipts/${c.preview.id}`).get()).exists).toBe(
    false,
  );
});

test("missing runtime configuration preserves queued IPN and retry budget until manual recovery", async () => {
  const c = await createCheckout(false),
    intent = await intentFor(c),
    f = proofFixture(intent),
    key = await sepay.admitSePayIpn(f.notification),
    db = getFirestore(),
    before = (await db.doc(`purchaseSePayInbox/${key}`).get()).data();
  const enabled = process.env.PURCHASE_SEPAY_SANDBOX_ENABLED;
  try {
    process.env.PURCHASE_SEPAY_SANDBOX_ENABLED = "false";
    await sepay.processSePayInbox(key);
    expect((await db.doc(`purchaseSePayInbox/${key}`).get()).data()).toEqual(
      before,
    );
    expect(
      (await db.doc(`purchaseCheckouts/${c.preview.id}`).get()).data()?.state,
    ).toBe("pending");
  } finally {
    process.env.PURCHASE_SEPAY_SANDBOX_ENABLED = enabled;
  }
  await sepay.processSePayInbox(key, f.adapter);
  expect(
    (await db.doc(`purchaseCheckouts/${c.preview.id}`).get()).data()?.state,
  ).toBe("paid");
  expect(
    (await db.doc(`purchaseSePayInbox/${key}`).get()).data()?.attempts,
  ).toBe(1);
});

test("five real readback failures exhaust the retry budget without losing evidence or allocating money", async () => {
  const c = await createCheckout(false),
    intent = await intentFor(c),
    f = proofFixture(intent),
    key = await sepay.admitSePayIpn(f.notification),
    db = getFirestore();
  const readback = vi.fn(async () => {
    throw Error("PRIVATE_RAW_PROVIDER_FAILURE");
  });
  for (let attempt = 0; attempt < 5; attempt++) {
    await db
      .doc(`purchaseSePayIntents/${c.preview.id}`)
      .update({ nextReadAt: 0 });
    await expect(
      sepay.processSePayInbox(key, { ...f.adapter, readback }),
    ).rejects.toThrow("SEPAY_RETRY_REQUIRED");
  }
  await sepay.processSePayInbox(key, { ...f.adapter, readback });
  await sepay.processSePayInbox(key, { ...f.adapter, readback });
  expect(readback).toHaveBeenCalledTimes(5);
  const stored = (await db.doc(`purchaseSePayInbox/${key}`).get()).data();
  expect(stored).toMatchObject({
    state: "review_required",
    failureCode: "RETRY_LIMIT",
    attempts: 5,
    leaseUntil: 0,
    payload: f.notification,
  });
  expect(JSON.stringify(stored)).not.toContain("PRIVATE_RAW_PROVIDER_FAILURE");
  expect(
    (
      await db
        .collection("purchaseTestFinancialEntries")
        .where("checkoutId", "==", c.preview.id)
        .get()
    ).size,
  ).toBe(0);
  expect((await db.doc(`purchaseReceipts/${c.preview.id}`).get()).exists).toBe(
    false,
  );
  expect((await db.doc(`carts/${c.uid}`).get()).data()?.activeCheckoutId).toBe(
    c.preview.id,
  );
});

test("stale readback worker cannot save proof or clear a replacement worker lease", async () => {
  const c = await createCheckout(false),
    intent = await intentFor(c),
    f = proofFixture(intent),
    db = getFirestore();
  await sepay.admitSePayIpn(f.notification);
  const replacement = {
    claim: "replacement-worker",
    leaseUntil: Date.now() + 60000,
  };
  await expect(
    sepay.reconcileSePayIntent(
      c.preview.id,
      {
        ...f.adapter,
        readback: async () => {
          await db
            .doc(`purchaseSePayIntents/${c.preview.id}`)
            .update(replacement);
          return f.raw;
        },
      },
      f.notification,
    ),
  ).rejects.toThrow("SEPAY_LEASE_LOST");
  expect(
    (await db.doc(`purchaseSePayIntents/${c.preview.id}`).get()).data(),
  ).toMatchObject(replacement);
  expect(
    (
      await db
        .doc(
          `purchaseSePayEvidence/${hash(`sepay_sandbox|${SEPAY_MERCHANT}|${f.notification.transaction.id}`)}`,
        )
        .get()
    ).exists,
  ).toBe(false);
  expect(
    (await db.collection("orders").where("ownerId", "==", c.uid).get()).size,
  ).toBe(0);
  await db
    .doc(`purchaseSePayIntents/${c.preview.id}`)
    .update({ leaseUntil: 0, nextReadAt: 0 });
  await sepay.reconcileSePayIntent(c.preview.id, f.adapter, f.notification);
  expect(
    (await db.doc(`purchaseCheckouts/${c.preview.id}`).get()).data()?.state,
  ).toBe("paid");
});

test("concurrent return reconciliation performs one readback while the owner lease is active", async () => {
  const c = await createCheckout(false),
    intent = await intentFor(c),
    f = proofFixture(intent);
  await sepay.admitSePayIpn(f.notification);
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const entered = new Promise<void>((resolve) => {
    started = resolve;
  });
  const readback = vi.fn(async () => {
    started();
    await gate;
    return f.raw;
  });
  const adapter = { ...f.adapter, readback };
  const first = sepay.reconcileSePayIntent(
    c.preview.id,
    adapter,
    f.notification,
  );
  try {
    await entered;
    const retries = await Promise.all(
      Array.from({ length: 8 }, () =>
        sepay.reconcileSePayIntent(c.preview.id, adapter, f.notification),
      ),
    );
    expect(retries.every((r) => r.kind === "deferred")).toBe(true);
    expect(readback).toHaveBeenCalledTimes(1);
  } finally {
    release();
  }
  expect(await first).toMatchObject({
    kind: "processed",
    transactionId: f.notification.transaction.id,
  });
  const entries = await getFirestore()
    .collection("purchaseTestFinancialEntries")
    .where("checkoutId", "==", c.preview.id)
    .get();
  expect(entries.size).toBe(1);
  expect(entries.docs[0].data().amount).toBe(intent.amount);
});

test.each(["line_total", "foreign_order"])(
  "mixed checkout corruption %s keeps received money for review with zero partial orders",
  async (kind) => {
    const c = await createCheckout(),
      intent = await intentFor(c),
      f = proofFixture(intent),
      key = await sepay.admitSePayIpn(f.notification),
      db = getFirestore(),
      ref = db.doc(`purchaseCheckouts/${c.preview.id}`),
      snapshot = (await ref.get()).data()!;
    if (kind === "line_total") snapshot.lines[1].total -= 1;
    else snapshot.orders[1].ownerId = "foreign-synthetic-owner";
    await ref.update({ lines: snapshot.lines, orders: snapshot.orders });
    await sepay.processSePayInbox(key, f.adapter);
    expect((await ref.get()).data()).toMatchObject({
      state: "review_required",
      receivedAmount: intent.amount,
    });
    expect(
      (await db.collection("orders").where("ownerId", "==", c.uid).get()).size,
    ).toBe(0);
    for (const line of snapshot.lines)
      expect((await db.doc(`orders/${line.orderId}`).get()).exists).toBe(false);
    expect(
      (
        await db
          .collection("purchaseTestFinancialEntries")
          .where("checkoutId", "==", c.preview.id)
          .get()
      ).size,
    ).toBe(0);
    expect(
      (await db.doc(`purchaseReceipts/${c.preview.id}`).get()).exists,
    ).toBe(false);
    expect(
      (await db.doc(`purchaseEmailOutbox/${c.preview.id}`).get()).exists,
    ).toBe(false);
    expect((await db.doc(`carts/${c.uid}`).get()).data()?.items).toHaveLength(
      2,
    );
    expect(
      (
        await db
          .doc(
            `purchasePaymentEvidence/SEPAY-SBX-${f.notification.transaction.id}`,
          )
          .get()
      ).data(),
    ).toMatchObject({
      amount: intent.amount,
      allocationState: "review_required",
    });
  },
);

test("private PDF is downloadable only by verified unlocked owner and a corrupt digest never returns bytes", async () => {
  const c = await createCheckout(false),
    intent = await intentFor(c),
    f = proofFixture(intent),
    key = await sepay.admitSePayIpn(f.notification),
    db = getFirestore();
  await sepay.processSePayInbox(key, f.adapter);
  await readyReceipt(c.preview.id);
  const input = { id: c.preview.id, download: true };
  await expect(
    receipts.purchaseReceipt.run(req("foreign-owner", input)),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(
    receipts.purchaseReceipt.run({ data: input } as CallableRequest),
  ).rejects.toMatchObject({ code: "unauthenticated" });
  const downloaded = await receipts.purchaseReceipt.run(req(c.uid, input));
  expect(downloaded).toMatchObject({ state: "ready", mime: "application/pdf" });
  const pdf = Buffer.from(downloaded.base64!, "base64");
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  expect(pdf.length).toBeLessThanOrEqual(3000000);
  for (const path of [`users/${c.uid}`, `staffAccess/${c.uid}`]) {
    await db.doc(path).set({ locked: true });
    await expect(
      receipts.purchaseReceipt.run(req(c.uid, input)),
    ).rejects.toMatchObject({ code: "permission-denied" });
    await db.doc(path).update({ locked: false });
  }
  await db
    .doc(`purchaseReceipts/${c.preview.id}`)
    .update({ pdfSha256: "0".repeat(64) });
  await expect(
    receipts.purchaseReceipt.run(req(c.uid, input)),
  ).rejects.toMatchObject({ code: "failed-precondition" });
  expect(
    (await db.doc(`purchaseCheckouts/${c.preview.id}`).get()).data()?.state,
  ).toBe("paid");
  expect(
    (
      await db
        .collection("purchaseTestFinancialEntries")
        .where("checkoutId", "==", c.preview.id)
        .get()
    ).size,
  ).toBe(1);
});
