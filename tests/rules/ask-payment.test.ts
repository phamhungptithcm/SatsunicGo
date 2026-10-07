import { syntheticProviderAllowed } from "../helpers/synthetic-provider-gate";
import { beforeAll, afterAll, expect, test, vi } from "vitest";
import { getFirestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import type { CallableRequest } from "firebase-functions/v2/https";
import { fixtureQR } from "../fixtures/ask009";
const provider = vi.hoisted(() => ({ calls: 0, bad: false, expires: 0 }));
vi.mock("@payos/node", () => ({
  PayOS: class {
    paymentRequests = {
      create: async (d: {
        amount: number;
        orderCode: number;
        expiredAt: number;
      }) => {
        provider.calls++;
        provider.expires = d.expiredAt;
        return {
          currency: "VND",
          amount: d.amount,
          accountNumber: "00000000",
          bin: "970000",
          qrCode: fixtureQR(
            provider.bad ? d.amount + 1 : d.amount,
            "00000000",
            `SG ${d.orderCode}`,
          ),
          checkoutUrl: "https://pay.payos.vn/web/fixture",
          paymentLinkId: "fixture-link",
        };
      },
      get: async () => ({}),
    };
  },
}));
let payment: typeof import("../../functions/src/payments/payos").createPaymentLink,
  ask: typeof import("../../functions/src/ai/ask").ask,
  db: ReturnType<typeof getFirestore>;
const uid = `ask009-${randomUUID()}`;
function req(data: unknown, who = uid) {
  return {
    auth: {
      uid: who,
      token: {
        email_verified: true,
        firebase: { sign_in_provider: "google.com" },
      },
    },
    data,
  } as CallableRequest;
}
beforeAll(async () => {
  const index = await import("../../functions/src/index");
  payment = index.createPaymentLink;
  ask = index.ask;
  db = getFirestore();
  await db
    .doc("settings/payments")
    .set({
      payosEnabled: true,
      accountNumber: "00000000",
      returnOrigin: "https://fixture.invalid",
    });
});
afterAll(async () => {
  await db.terminate();
});
async function order() {
  const id = randomUUID();
  await db
    .doc(`orders/${id}`)
    .set({
      id,
      ownerId: uid,
      stage: "QUOTE_ACCEPTED",
      acceptedAt: Date.now(),
      acceptedQuoteVersion: 1,
      deposit: 650,
      collected: 0,
      refunded: 0,
    });
  return id;
}
test("provider QR is persisted/cached, mismatched and expired QR fail closed, cross owner denied", async () => {
  const id = await order(),
    data = { orderId: id, purpose: "deposit", operationId: randomUUID() },
    count = provider.calls;
  const one = await payment.run(req(data));
  expect(one.qrCode).toBeTruthy();
  expect(one.amount).toBe(650);
  expect(one.expiresAt).toBeGreaterThan(Date.now());
  expect(provider.expires).toBeGreaterThan(Date.now() / 1000);
  expect(
    await payment.run(req({ ...data, operationId: randomUUID() })),
  ).toEqual(one);
  expect(provider.calls).toBe(count + 1);
  await expect(payment.run(req(data, `other-${uid}`))).rejects.toMatchObject({
    code: "permission-denied",
  });
  const links = await db
    .collection("paymentRequests")
    .where("orderId", "==", id)
    .get();
  await links.docs[0].ref.update({ expiresAt: Date.now() - 1 });
  await expect(payment.run(req(data))).rejects.toMatchObject({
    code: "failed-precondition",
  });
  provider.bad = true;
  const bad = await order();
  await expect(
    payment.run(req({ ...data, orderId: bad, operationId: randomUUID() })),
  ).rejects.toMatchObject({ code: "unavailable" });
  expect((await db.doc(`orders/${bad}`).get()).data()?.collected).toBe(0);
});
test("image API rejects anonymous photos and malformed input without model invocation", async () => {
  const data = {
    question: "fixture",
    sessionId: randomUUID(),
    language: "vi",
    images: [
      { mime: "image/png", base64: Buffer.alloc(30).toString("base64") },
    ],
  };
  await expect(ask.run({ data } as CallableRequest)).rejects.toMatchObject({
    code: "unauthenticated",
  });
  await expect(
    ask.run(req({ ...data, images: Array(4).fill(data.images[0]) })),
  ).rejects.toMatchObject({ code: "invalid-argument" });
});

// Exercise only synthetic provider transaction cores; real release-gate tests remain unmocked.
vi.mock("../../functions/src/provider-release-gate", async (actual) => {
  const original = await actual<typeof import("../../functions/src/provider-release-gate")>();
  return { ...original, releaseCapabilityAllowed: syntheticProviderAllowed };
});
