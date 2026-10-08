import { syntheticProviderAllowed } from "../helpers/synthetic-provider-gate";
import { beforeAll, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
import { createCatalogOrder } from "../../packages/domain/catalog-checkout";

// Only this worker gets synthetic settings/provider behavior. No shared settings or real SDK call.
const provider = vi.hoisted(() => ({
  create: vi.fn(async () => {
    throw Error("SYNTHETIC_PROVIDER_FAILURE");
  }),
}));
vi.mock("@payos/node", () => ({
  PayOS: class {
    paymentRequests = { create: provider.create, get: async () => null };
  },
}));
vi.mock("firebase-functions/params", () => ({
  defineSecret: () => ({ value: () => "synthetic-not-a-credential" }),
}));
vi.mock("firebase-admin/firestore", async (actual) => {
  const module = await actual<typeof import("firebase-admin/firestore")>();
  return {
    ...module,
    getFirestore: () => {
      const db = module.getFirestore();
      return new Proxy(db, {
        get(target, key) {
          if (key === "doc")
            return (path: string) =>
              path === "settings/payments"
                ? {
                    get: async () => ({
                      data: () => ({
                        payosEnabled: true,
                        accountNumber: "synthetic018",
                        returnOrigin: "https://example.invalid",
                      }),
                    }),
                  }
                : target.doc(path);
          const value = Reflect.get(target, key);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    },
  };
});
let payment: typeof import("../../functions/src/payments/payos").createPaymentLink;
beforeAll(async () => {
  process.env.FUNCTIONS_EMULATOR = "true";
  process.env.GCLOUD_PROJECT = "demo-satsunicgo";
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8181";
  await import("../../functions/src/index");
  ({ createPaymentLink: payment } =
    await import("../../functions/src/payments/payos"));
});
it("persists a full catalog intent without undefined quote fields; provider failure never collects money", async () => {
  const { getFirestore } = await import("firebase-admin/firestore"),
    db = getFirestore();
  const uid = `catalogpay018-${randomUUID()}`,
    id = `catalogpay018-${randomUUID()}`;
  const o = createCatalogOrder(
    {
      title: "Synthetic product",
      slug: id,
      status: "published",
      market: "US",
      version: 1,
      orderable: true,
      listedPrice: 100000,
      termsVersion: "synthetic-v1",
    },
    { productId: id, productVersion: 1, quantity: 2, variant: "" },
    { id, ownerId: uid, now: Date.now() },
  );
  await db.doc(`orders/${id}`).set(o);
  const req = (purpose: string, owner = uid) =>
    ({
      auth: {
        uid: owner,
        token: {
          email_verified: true,
          firebase: { sign_in_provider: "google.com" },
        },
      },
      data: { orderId: id, purpose, operationId: randomUUID() },
    }) as CallableRequest;
  await expect(payment.run(req("deposit"))).rejects.toMatchObject({
    code: "failed-precondition",
  });
  await expect(payment.run(req("balance"))).rejects.toMatchObject({
    code: "failed-precondition",
  });
  await expect(
    payment.run(req("full", `other-${randomUUID()}`)),
  ).rejects.toMatchObject({ code: "permission-denied" });
  await expect(payment.run(req("full"))).rejects.toMatchObject({
    code: "unavailable",
  });
  const rows = await db
    .collection("paymentRequests")
    .where("orderId", "==", id)
    .get();
  expect(rows.size).toBe(1);
  expect(rows.docs[0].data()).toMatchObject({
    amount: 200000,
    purpose: "full",
    acceptedQuoteVersion: null,
    state: "unknown",
  });
  expect(provider.create).toHaveBeenCalledOnce();
  await expect(payment.run(req("full"))).rejects.toMatchObject({
    code: "unavailable",
  });
  expect(provider.create).toHaveBeenCalledOnce();
  expect((await db.doc(`orders/${id}`).get()).data()?.collected).toBe(0);
});

// Exercise only synthetic provider transaction cores; real release-gate tests remain unmocked.
vi.mock("../../functions/src/provider-release-gate", async (actual) => {
  const original = await actual<typeof import("../../functions/src/provider-release-gate")>();
  return { ...original, releaseCapabilityAllowed: syntheticProviderAllowed };
});
