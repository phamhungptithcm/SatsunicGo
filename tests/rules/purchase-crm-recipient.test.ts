import { randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { CallableRequest } from "firebase-functions/v2/https";
import { afterAll, beforeAll, expect, it } from "vitest";
import { buildCheckout } from "../../packages/domain/purchase-checkout";
import type { CartItem } from "../../packages/domain/cart";
import { demoFirestoreEndpoint } from "../helpers/demo-environment";

const paths = new Set<string>(),
  checkoutIds = new Set<string>();
let app: ReturnType<typeof initializeApp>;
let settlement: typeof import("../../functions/src/purchase-settlement");
let workspace: typeof import("../../functions/src/workspace");
let region: {
  code: string;
  name: string;
  communes: { code: string; name: string }[];
};
const request = (uid: string, orderId: string) =>
  ({
    auth: {
      uid,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data: { orderId },
  }) as CallableRequest;

beforeAll(async () => {
  if (demoFirestoreEndpoint(process.env).port !== 18207)
    throw Error("Exact shared demo Firestore18207 required");
  process.env.FIREBASE_CONFIG = JSON.stringify({
    projectId: "demo-satsunicgo",
  });
  app = initializeApp({ projectId: "demo-satsunicgo" });
  const db = getFirestore();
  const [demo, regions] = await db.getAll(
    db.doc("settings/purchaseDemo"),
    db.doc("settings/purchaseRegions"),
  );
  if (
    demo.data()?.enabled !== true ||
    !regions.data()?.provinces?.[0]?.communes?.length
  )
    throw Error(
      "Existing demo configuration required; fixture never replaces settings",
    );
  region = regions.data()!.provinces[0];
  settlement = await import("../../functions/src/purchase-settlement");
  workspace = await import("../../functions/src/workspace");
});

function own(path: string) {
  paths.add(path);
  return getFirestore().doc(path);
}
function trackCheckout(id: string, ownerId: string, orderIds: string[]) {
  checkoutIds.add(id);
  for (const collection of [
    "purchaseCheckouts",
    "purchaseReceipts",
    "purchaseReceiptJobs",
  ])
    paths.add(`${collection}/${id}`);
  paths.add(`purchasePaymentEvidence/DEMO-${id}`);
  paths.add(`outboxJobs/purchase-payment-${id}`);
  paths.add(`users/${ownerId}`);
  paths.add(`carts/${ownerId}`);
  for (const orderId of orderIds) {
    for (const collection of ["orders", "orderRecipients", "orderOperations"])
      paths.add(`${collection}/${orderId}`);
    paths.add(`financialEntries/purchase-${id}-${orderId}`);
    paths.add(`purchaseTestFinancialEntries/purchase-${id}-${orderId}`);
    paths.add(`orders/${orderId}/timeline/purchase-${id}`);
  }
}

async function seed(count = 2, mixed = true) {
  const id = randomUUID(),
    ownerId = `crm-recipient-${randomUUID()}`,
    now = Date.now();
  const draftId = randomUUID(),
    orderIds = Array.from({ length: count }, () => randomUUID());
  const items: CartItem[] = Array.from({ length: count }, (_, index) => ({
    lineId: randomUUID(),
    productId: randomUUID(),
    variant: "",
    quantity: 1,
    ...(mixed && index === 0
      ? {
          kind: "custom" as const,
          custom: {
            draftId,
            itemIndex: 0,
            name: "Món cần tìm mua kiểm thử",
            market: "US" as const,
            unitSourceMinor: 1000,
            fxNumerator: 250,
            fxDenominator: 1,
            serviceBps: 500,
          },
        }
      : {}),
  }));
  const built = buildCheckout({
    id,
    ownerId,
    now,
    revision: 1,
    items,
    orderIds,
    policy: {
      enabled: true,
      approved: true,
      version: 1,
      serviceBps: 500,
      termsVersion: "synthetic",
      effectiveFrom: 0,
      expiresAt: now + 600000,
      rates: {
        USD: { numerator: 250, denominator: 1 },
        JPY: { numerator: 170, denominator: 1 },
        KRW: { numerator: 20, denominator: 1 },
      },
    },
    products: Object.fromEntries(
      items
        .filter((item) => item.kind !== "custom")
        .map((item) => [
          item.productId,
          {
            title: "Món niêm yết kiểm thử",
            slug: item.productId,
            status: "published",
            orderable: true,
            listedPrice: 100000,
            termsVersion: "synthetic",
            market: "US",
            version: 1,
            catalogOptions: [],
          },
        ]),
    ),
    drafts: {
      [draftId]: {
        ownerId,
        market: "US",
        items: [
          {
            name: "Món cần tìm mua kiểm thử",
            quantity: 1,
            variant: "",
            unitSourceMinor: 1000,
          },
        ],
        notes: "",
      },
    },
    recipient: {
      recipient: "Người nhận kiểm thử",
      phone: "0900000000",
      country: "VN",
      provinceCode: region.code,
      province: region.name,
      communeCode: region.communes[0].code,
      commune: region.communes[0].name,
      street: "Số 10 đường kiểm thử",
      note: "Ghi chú riêng không đưa vào CRM",
    },
    shipping: { state: "quote_required" },
  });
  const checkout = {
    ...built.snapshot,
    orders: built.orders,
    hash: randomUUID(),
    state: "pending",
    provider: "demo",
  };
  trackCheckout(id, ownerId, orderIds);
  const batch = getFirestore().batch();
  batch.create(own(`purchaseCheckouts/${id}`), checkout);
  batch.create(own(`carts/${ownerId}`), {
    ownerId,
    revision: 1,
    updatedAt: now,
    activeCheckoutId: id,
    items,
  });
  await batch.commit();
  return { id, ownerId, orderIds, checkout };
}
type Fixture = Awaited<ReturnType<typeof seed>>;
const pay = (
  fixture: Fixture,
  outcome: "pending" | "unknown" | "paid" | "cancelled" = "paid",
) =>
  settlement.applyDemoSettlement({
    id: fixture.id,
    uid: fixture.ownerId,
    outcome,
  });
async function staff(roles: string[], orderIds: string[] = []) {
  const id = `crm-reader-${randomUUID()}`;
  await own(`staffAccess/${id}`).create({ active: true, roles, orderIds });
  return id;
}

it("mixed initial payment atomically projects the same canonical recipient for every order under parallel replay", async () => {
  const f = await seed(),
    db = getFirestore();
  const results = await Promise.all(Array.from({ length: 4 }, () => pay(f)));
  expect(new Set(results.map((result) => JSON.stringify(result))).size).toBe(1);
  for (const orderId of f.orderIds) {
    const [recipient, operations] = await db.getAll(
      db.doc(`orderRecipients/${orderId}`),
      db.doc(`orderOperations/${orderId}`),
    );
    expect(operations.data()?.recipient).toEqual({
      recipient: recipient.data()?.recipient,
      phone: recipient.data()?.phone,
      address: recipient.data()?.address,
    });
    expect(operations.data()?.recipient.address).toBe(
      `Số 10 đường kiểm thử, ${region.communes[0].name}, ${region.name}, Việt Nam`,
    );
    expect(Object.keys(operations.data()!.recipient).sort()).toEqual([
      "address",
      "phone",
      "recipient",
    ]);
    expect(operations.data()?.changedAt).toBeGreaterThan(0);
  }
  expect(
    (
      await db
        .collection("purchaseTestFinancialEntries")
        .where("ownerId", "==", f.ownerId)
        .get()
    ).size,
  ).toBe(2);
  expect(
    (
      await db
        .collection("financialEntries")
        .where("ownerId", "==", f.ownerId)
        .get()
    ).empty,
  ).toBe(true);
});

it.each(["OWNER", "OPERATIONS_MANAGER", "WAREHOUSE"])(
  "%s sees the paid checkout recipient through the actual CRM callable",
  async (role) => {
    const f = await seed(1);
    await pay(f);
    const reader = await staff([role]);
    const response = await workspace.readOrderOperations.run(
      request(reader, f.orderIds[0]),
    );
    expect(response.recipient).toMatchObject({
      recipient: "Người nhận kiểm thử",
      phone: "0900000000",
    });
    expect(response.recipient.address).toContain(region.communes[0].name);
    expect(JSON.stringify(response)).not.toContain(f.checkout.recipient.note);
  },
);

it("assigned BUYER cannot see recipient, and SUPPORT/customer/inactive/locked staff cannot read private operations", async () => {
  const f = await seed(1);
  await pay(f);
  const orderId = f.orderIds[0],
    buyer = await staff(["BUYER"], [orderId]);
  expect(
    (await workspace.readOrderOperations.run(request(buyer, orderId)))
      .recipient,
  ).toBeNull();
  const support = await staff(["SUPPORT"]),
    inactive = await staff(["OWNER"]),
    locked = await staff(["WAREHOUSE"]);
  await own(`staffAccess/${inactive}`).update({ active: false });
  await own(`users/${locked}`).create({ locked: true });
  for (const reader of [support, f.ownerId, inactive, locked])
    await expect(
      workspace.readOrderOperations.run(request(reader, orderId)),
    ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(
    workspace.readOrderOperations.run({ data: { orderId } } as CallableRequest),
  ).rejects.toMatchObject({ code: "unauthenticated" });
});

it.each(["pending", "unknown", "cancelled"] as const)(
  "%s never creates CRM recipient or financial allocation",
  async (outcome) => {
    const f = await seed();
    await pay(f, outcome);
    for (const orderId of f.orderIds) {
      expect(
        (await getFirestore().doc(`orderOperations/${orderId}`).get()).exists,
      ).toBe(false);
      expect(
        (await getFirestore().doc(`orderRecipients/${orderId}`).get()).exists,
      ).toBe(false);
      expect(
        (
          await getFirestore()
            .doc(`financialEntries/purchase-${f.id}-${orderId}`)
            .get()
        ).exists,
      ).toBe(false);
      expect(
        (
          await getFirestore()
            .doc(`purchaseTestFinancialEntries/purchase-${f.id}-${orderId}`)
            .get()
        ).exists,
      ).toBe(false);
    }
  },
);

it("projection collision aborts the entire payment without overwriting operations or partially allocating money", async () => {
  const f = await seed(),
    db = getFirestore();
  const existing = {
    recipient: { recipient: "Existing synthetic recipient" },
    pack: { weightGrams: 123 },
  };
  await own(`orderOperations/${f.orderIds[1]}`).create(existing);
  await expect(pay(f)).rejects.toMatchObject({ code: 6 });
  expect(
    (await db.doc(`orderOperations/${f.orderIds[1]}`).get()).data(),
  ).toEqual(existing);
  expect((await db.doc(`purchaseCheckouts/${f.id}`).get()).data()?.state).toBe(
    "pending",
  );
  expect(
    (await db.doc(`carts/${f.ownerId}`).get()).data()?.activeCheckoutId,
  ).toBe(f.id);
  for (const orderId of f.orderIds) {
    expect((await db.doc(`orders/${orderId}`).get()).exists).toBe(false);
    expect((await db.doc(`orderRecipients/${orderId}`).get()).exists).toBe(
      false,
    );
    expect(
      (await db.doc(`financialEntries/purchase-${f.id}-${orderId}`).get())
        .exists,
    ).toBe(false);
    expect(
      (
        await db
          .doc(`purchaseTestFinancialEntries/purchase-${f.id}-${orderId}`)
          .get()
      ).exists,
    ).toBe(false);
  }
  expect((await db.doc(`purchaseReceipts/${f.id}`).get()).exists).toBe(false);
});

it("paid replay preserves later warehouse metadata and the frozen address", async () => {
  const f = await seed(1);
  await pay(f);
  const ref = own(`orderOperations/${f.orderIds[0]}`);
  await ref.update({
    receive: { quantity: 1, condition: "good", shelf: "QA" },
    changedAt: 12345,
  });
  const before = (await ref.get()).data();
  await pay(f);
  expect((await ref.get()).data()).toEqual(before);
});

it("a later final-balance payment preserves initial recipient and existing packing metadata", async () => {
  const f = await seed(1);
  await pay(f);
  const db = getFirestore(),
    orderId = f.orderIds[0],
    id = randomUUID();
  const orderRef = db.doc(`orders/${orderId}`),
    order = (await orderRef.get()).data()!;
  await own(`orderOperations/${orderId}`).update({
    pack: { weightGrams: 500 },
    changedAt: 12345,
  });
  const before = (await db.doc(`orderOperations/${orderId}`).get()).data();
  const initialRecipient = (
    await db.doc(`orderRecipients/${orderId}`).get()
  ).data();
  const total = 50000;
  trackCheckout(id, f.ownerId, [orderId]);
  await own(`purchaseCheckouts/${id}`).create({
    ...f.checkout,
    id,
    purpose: "balance",
    balanceReason: "final",
    sourceOrderId: orderId,
    sourceOrderVersion: order.version,
    previouslyPaid: order.collected,
    finalTotal: order.collected + total,
    total,
    lines: [{ ...f.checkout.lines[0], total }],
    recipient: {
      ...f.checkout.recipient,
      street: "Different uncommitted address",
    },
  });
  await orderRef.update({
    stage: "PACKED",
    packingComplete: true,
    finalApproved: true,
    finalTotal: order.collected + total,
    balanceCheckoutId: id,
    version: order.version + 1,
  });
  expect((await pay({ ...f, id })).state).toBe("paid");
  expect((await db.doc(`orderOperations/${orderId}`).get()).data()).toEqual(
    before,
  );
  expect((await db.doc(`orderRecipients/${orderId}`).get()).data()).toEqual(
    initialRecipient,
  );
  expect((await orderRef.get()).data()?.stage).toBe("READY_TO_SHIP");
});

it("maximum 30-line cart projects every recipient in one successful allocation", async () => {
  const f = await seed(30, false);
  expect((await pay(f)).state).toBe("paid");
  const documents = await getFirestore().getAll(
    ...f.orderIds.map((id) => getFirestore().doc(`orderOperations/${id}`)),
  );
  expect(
    documents.filter(
      (doc) =>
        doc.exists && doc.data()?.recipient.address.includes(region.name),
    ),
  ).toHaveLength(30);
});

afterAll(async () => {
  if (!app) return;
  const db = getFirestore();
  try {
    for (const id of checkoutIds) {
      const audit = await db
        .collection("auditEvents")
        .where("resourceId", "==", id)
        .get();
      audit.docs.forEach((doc) => paths.add(doc.ref.path));
    }
    const all = [...paths];
    for (let start = 0; start < all.length; start += 400) {
      const batch = db.batch();
      for (const path of all.slice(start, start + 400))
        batch.delete(db.doc(path));
      await batch.commit();
    }
    expect(
      (await db.getAll(...all.map((path) => db.doc(path)))).some(
        (doc) => doc.exists,
      ),
    ).toBe(false);
  } finally {
    await db.terminate();
    await deleteApp(app);
  }
});
