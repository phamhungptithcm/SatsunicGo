import { initializeApp, deleteApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import { createCatalogOrder } from "../../packages/domain/catalog-checkout";
import {
  documentSnapshot,
  type SalesDocument,
} from "../../packages/domain/invoices";
import type { Order } from "../../packages/domain";

if (
  process.env.GCLOUD_PROJECT !== "demo-satsunicgo" ||
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8187" ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9197" ||
  process.env.FUNCTIONS_EMULATOR !== "true"
)
  throw Error("Browser fixtures require the dedicated demo emulator ports");

let app = initializeApp({ projectId: "demo-satsunicgo" }, "release021-browser");
export let db = getFirestore(app);
export const customer = "e2e005-customer-a";
export const otherCustomer = "e2e005-customer-b";
export const operator = "e2e005-owner";
export async function freshCustomer() {
  const identity = `customer-${randomUUID()}`;
  const uid = `e2e005-${identity}`;
  const email = `${identity}@satsunicgo.example.invalid`;
  await getAuth(app).createUser({ uid, email, emailVerified: true });
  await getAuth(app).updateUser(uid, {
    providerToLink: { providerId: "google.com", uid, email },
  });
  await db.doc(`users/${uid}`).set({ ownerId: uid, locked: false, version: 1 });
  return { identity, uid };
}
export async function closeFixtures() {
  await db.terminate();
  await deleteApp(app);
  // Playwright can reuse this module in the next spec within the same worker.
  // Recreate idle clients only; do not reseed shared identities or settings.
  app = initializeApp({ projectId: "demo-satsunicgo" }, "release021-browser");
  db = getFirestore(app);
}
export async function seedIdentities() {
  if (!getApps().some((a) => a.name === "release021-browser")) {
    app = initializeApp({ projectId: "demo-satsunicgo" }, "release021-browser");
    db = getFirestore(app);
  }
  const auth = getAuth(app);
  for (const [identity, roles] of [
    ["customer-a", []],
    ["customer-b", []],
    ["owner", ["OWNER"]],
    ["support", ["SUPPORT"]],
    ["finance", ["FINANCE"]],
    ["revoked", ["OWNER"]],
    ["locked", ["OWNER"]],
  ] as const) {
    const uid = `e2e005-${identity}`;
    const email = `${identity}@satsunicgo.example.invalid`;
    try {
      await auth.createUser({ uid, email, emailVerified: true });
    } catch (e) {
      if ((e as { code?: string }).code !== "auth/uid-already-exists") throw e;
    }
    if (
      !(await auth.getUser(uid)).providerData.some(
        (p) => p.providerId === "google.com",
      )
    )
      await auth.updateUser(uid, {
        providerToLink: { providerId: "google.com", uid, email },
      });
    await db.doc(`users/${uid}`).set({
      ownerId: uid,
      displayName: `Synthetic ${identity}`,
      searchName: `synthetic ${identity}`,
      locked: identity === "locked",
      version: 1,
    });
    if (roles.length)
      await db.doc(`staffAccess/${uid}`).set({
        active: identity !== "revoked",
        locked: identity === "locked",
        roles: [...roles],
      });
  }
  await db.doc("settings/invoiceSeller").set({
    seller: {
      name: "Synthetic sanity seller",
      address: "Synthetic sanity address",
      contact: "example.invalid",
    },
    version: 1,
  });
  await db.doc("settings/email").set({ enabled: false });
  await db.doc("settings/payments").set({ payosEnabled: false });
  await db.doc("settings/pricing").set({
    approved: true,
    termsVersion: "synthetic-sanity-v1",
    effectiveFrom: 1,
    expiresAt: Date.now() + 3600000,
    rates: {
      USD: { numerator: 250, denominator: 1 },
      JPY: { numerator: 1, denominator: 1 },
      KRW: { numerator: 1, denominator: 1 },
    },
  });
}
export async function product(id = `sanity-${randomUUID()}`) {
  const data = {
    title: `Synthetic ${id}`,
    slug: id,
    body: "Isolated browser fixture only",
    status: "published",
    market: "US",
    version: 1,
    orderable: true,
    listedPrice: 120000,
    termsVersion: "synthetic-sanity-v1",
    catalogOptions: ["Small", "Large"],
  };
  await db.doc(`products/${id}`).set(data);
  return { id, ...data };
}
export async function ownedOrders(uid = customer) {
  return (
    await db.collection("orders").where("ownerId", "==", uid).get()
  ).docs.map((s) => ({ ...s.data(), id: s.id }));
}
export async function sourceOrder(id = `sanity-order-${randomUUID()}`) {
  const p = await product();
  await db.doc(`orders/${id}`).set(
    createCatalogOrder(
      p,
      {
        productId: p.id,
        productVersion: 1,
        quantity: 2,
        variant: "Large",
      },
      { id, ownerId: customer, now: Date.now() },
    ),
  );
  return id;
}
export async function sourceOrders(ids: string[]) {
  if (!ids.length || ids.length > 100 || new Set(ids).size !== ids.length)
    throw Error("Fixture batch requires 1 to 100 unique order IDs");
  const p = await product();
  const batch = db.batch();
  const now = Date.now();
  for (const id of ids)
    batch.set(
      db.doc(`orders/${id}`),
      createCatalogOrder(
        p,
        {
          productId: p.id,
          productVersion: 1,
          quantity: 2,
          variant: "Large",
        },
        { id, ownerId: customer, now },
      ),
    );
  await batch.commit();
}
/** Print/layout-only fixture, not an issued financial or catalog acceptance proof. */
export async function statementRenderFixture() {
  const orderId = await sourceOrder();
  const order = (await db.doc(`orders/${orderId}`).get()).data() as Order;
  const seller = (await db.doc("settings/invoiceSeller").get()).data()!.seller;
  const id = `render-only-${randomUUID()}`;
  const now = Date.now();
  const document: SalesDocument = {
    ...documentSnapshot(order, seller, "Synthetic render customer"),
    id,
    ownerId: customer,
    sourceOrderId: id,
    sourceVersion: 1,
    version: 1,
    state: "issued",
    kind: "internal_statement",
    currency: "VND",
    sellerVersion: 1,
    createdAt: now,
    changedAt: now,
    issuedAt: now,
    issueNumber: "SYNTHETIC-PRINT-021",
    shareEpoch: 0,
    lines: Array.from({ length: 20 }, (_, index) => ({
      name: `PRINT-ROW-${String(index + 1).padStart(2, "0")} Synthetic long product description for pagination and Vietnamese wrapping kiểm tra chứng từ `.repeat(
        3,
      ),
      variant: "Synthetic long option only",
      quantity: 1,
    })),
  };
  await db.doc(`salesDocuments/${id}`).set(document);
  return document;
}
export async function askSource(productId?: string) {
  const p = await product(productId),
    cid = randomUUID();
  await db.doc(`askConversations/${customer}-${cid}`).set({
    ownerId: customer,
    version: 1,
    updatedAt: Date.now(),
    turns: [
      {
        id: randomUUID(),
        question: "Synthetic reviewed source fixture",
        answer: {
          language: "vi",
          title: "Sản phẩm thử nghiệm",
          paragraphs: ["Nguồn synthetic, không gọi AI thật."],
          bullets: [],
          sourceIds: [`product:${p.slug}`],
          action: "manual",
        },
      },
    ],
    draft: {},
  });
  await db.doc(`askCurrent/${customer}`).set({ conversationId: cid });
  return { p, cid };
}
