import { randomBytes, randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import {
  onRequest,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import { PayOS } from "@payos/node";
import {
  demoGatewayInput,
  demoWebhookSchema,
  assertDemoProviderBinding,
  type DemoPaymentLink,
} from "../../packages/domain/purchase-provider";
import { withPurchaseMutation } from "./purchase-mutation-queue";
import { requireVerifiedGoogle } from "./auth/guards";
import {
  purchaseDemoEnvironment,
  applyPurchaseDemoOutcome,
} from "./purchase-checkout";

type Intent = DemoPaymentLink & {
  checkoutId: string;
  ownerId: string;
  reference?: string;
  paidAmount?: number;
  paidAt?: number;
  customer: { email?: string; name?: string };
};
function guard() {
  if (!purchaseDemoEnvironment())
    throw new HttpsError(
      "permission-denied",
      "Cổng thanh toán demo không khả dụng.",
    );
}
async function client() {
  guard();
  const ref = getFirestore().doc("purchaseDemoMerchant/config");
  let row = await ref.get();
  if (!row.exists) {
    try {
      await ref.create({ checksumKey: randomBytes(32).toString("hex") });
    } catch (error) {
      if ((error as { code?: number }).code !== 6) throw error;
    }
    row = await ref.get();
  }
  const key = row.data()?.checksumKey;
  if (typeof key !== "string" || !/^[a-f0-9]{64}$/.test(key))
    throw Error("DEMO_MERCHANT_UNAVAILABLE");
  // SDK crypto/verifier only. No merchant credentials or API calls.
  return new PayOS({
    clientId: "local-demo",
    apiKey: "local-demo",
    checksumKey: key,
  });
}
function visible(i: Intent): DemoPaymentLink {
  return {
    paymentLinkId: i.paymentLinkId,
    orderCode: i.orderCode,
    amount: i.amount,
    currency: i.currency,
    status: i.status,
    expiresAt: i.expiresAt,
    checkoutUrl: i.checkoutUrl,
  };
}
async function payload(i: Intent) {
  const sdk = await client(),
    data = {
      orderCode: i.orderCode,
      amount: i.paidAmount ?? i.amount,
      description: `SG ${i.orderCode}`,
      accountNumber: "DEMO-NO-BANK" as const,
      reference: i.reference!,
      transactionDateTime: new Date(i.paidAt!).toISOString(),
      currency: "VND" as const,
      paymentLinkId: i.paymentLinkId,
      code: "00" as const,
      desc: "Thanh toán demo",
    };
  return {
    code: "00",
    desc: "success",
    success: true,
    data,
    signature: await sdk.crypto.createSignatureFromObj(data, sdk.checksumKey),
  };
}
export async function receivePurchaseDemoWebhook(body: unknown) {
  guard();
  const webhook = demoWebhookSchema.parse(body),
    sdk = await client();
  await sdk.webhooks.verify(webhook);
  const db = getFirestore(),
    index = await db
      .doc(`purchaseDemoLinkIndex/${webhook.data.paymentLinkId}`)
      .get();
  if (!index.exists) throw Error("UNKNOWN_PAYMENT_LINK");
  const row = await db
      .doc(`purchaseDemoLinks/${index.data()!.checkoutId}`)
      .get(),
    i = row.data() as Intent;
  if (!i) throw Error("UNKNOWN_PAYMENT_LINK");
  assertDemoProviderBinding(webhook.data, i);
  return applyPurchaseDemoOutcome({
    id: i.checkoutId,
    uid: i.ownerId,
    outcome: "paid",
    linkId: i.paymentLinkId,
    token: i.customer,
  });
}
export async function handlePurchaseDemoGateway(req: CallableRequest) {
  guard();
  const uid = requireVerifiedGoogle(req.auth),
    parsed = demoGatewayInput.safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError(
      "invalid-argument",
      "Thông tin thanh toán chưa hợp lệ.",
    );
  const { id, action } = parsed.data,
    db = getFirestore(),
    ref = db.doc(`purchaseDemoLinks/${id}`);
  const signingClient = action === "createLink" ? await client() : null;
  const result = await withPurchaseMutation(`provider-${id}`, () =>
    db.runTransaction(async (tx) => {
      const [user, access, stored, checkout, demo, counter] = await tx.getAll(
        db.doc(`users/${uid}`),
        db.doc(`staffAccess/${uid}`),
        ref,
        db.doc(`purchaseCheckouts/${id}`),
        db.doc("settings/purchaseDemo"),
        db.doc("counters/purchaseDemoOrderCode"),
      );
      const c = checkout.data();
      if (
        !c ||
        c.ownerId !== uid ||
        c.provider !== "demo" ||
        demo.data()?.enabled !== true ||
        user.data()?.locked ||
        access.data()?.locked
      )
        throw new HttpsError("permission-denied", "Chưa mở được thanh toán.");
      let i = stored.data() as Intent | undefined;
      if (i && i.ownerId !== uid)
        throw new HttpsError("permission-denied", "Chưa mở được thanh toán.");
      if (!i) {
        if (action !== "createLink" || c.state !== "pending")
          throw new HttpsError(
            "failed-precondition",
            "Lượt này chưa thể tạo liên kết thanh toán.",
          );
        const paymentLinkId = randomUUID().replaceAll("-", ""),
          orderCode = (counter.data()?.value ?? 200000) + 1;
        if (!Number.isSafeInteger(orderCode))
          throw new HttpsError(
            "failed-precondition",
            "Cấu hình thanh toán cần kiểm tra.",
          );
        i = {
          checkoutId: id,
          ownerId: uid,
          paymentLinkId,
          orderCode,
          amount: c.total,
          currency: "VND",
          status: "PENDING",
          expiresAt: c.expiresAt,
          checkoutUrl: `/checkout/payment/${id}?gateway=${paymentLinkId}`,
          customer: {
            ...(typeof req.auth!.token.email === "string"
              ? { email: req.auth!.token.email }
              : {}),
            ...(typeof req.auth!.token.name === "string"
              ? { name: req.auth!.token.name.slice(0, 120) }
              : {}),
          },
        };
        const createRequest = {
          orderCode,
          amount: i.amount,
          description: `SG ${orderCode}`,
          returnUrl: `http://127.0.0.1:5207/checkout/payment/${id}?returned=1`,
          cancelUrl: `http://127.0.0.1:5207/checkout/payment/${id}?returned=1`,
          expiredAt: Math.floor(i.expiresAt / 1000),
        };
        const signature =
          await signingClient!.crypto.createSignatureOfPaymentRequest(
            createRequest,
            signingClient!.checksumKey,
          );
        tx.create(ref, {
          ...i,
          createRequest: { ...createRequest, signature },
        });
        tx.create(db.doc(`purchaseDemoLinkIndex/${paymentLinkId}`), {
          checkoutId: id,
        });
        tx.set(db.doc("counters/purchaseDemoOrderCode"), { value: orderCode });
        tx.update(checkout.ref, { demoPaymentLinkId: paymentLinkId });
      }
      if (i.status === "PENDING" && i.expiresAt <= Date.now()) {
        i = { ...i, status: "EXPIRED" };
        tx.update(ref, { status: i.status });
      }
      if (["underpay", "overpay", "decline"].includes(action)) {
        if (i.status !== "PENDING")
          throw new HttpsError(
            "failed-precondition",
            "Liên kết thanh toán đã dừng hoặc đang đối chiếu.",
          );
        if (action === "decline") {
          i = { ...i, status: "FAILED" };
          tx.update(ref, { status: i.status });
        } else {
          const paidAmount = i.amount + (action === "underpay" ? -1 : 1);
          if (!Number.isSafeInteger(paidAmount) || paidAmount <= 0)
            throw new HttpsError(
              "failed-precondition",
              "Không mô phỏng được số tiền này.",
            );
          i = {
            ...i,
            status: action === "underpay" ? "UNDERPAID" : "PAID",
            paidAmount,
            reference: `DEMO-${randomUUID()}`,
            paidAt: Date.now(),
          };
          tx.update(ref, {
            status: i.status,
            paidAmount,
            reference: i.reference,
            paidAt: i.paidAt,
          });
        }
      }
      if (action === "pay" || action === "payWithoutWebhook") {
        if (i.status !== "PAID") {
          if (!["PENDING", "PROCESSING"].includes(i.status))
            throw new HttpsError(
              "failed-precondition",
              "Liên kết thanh toán đã dừng.",
            );
          i = {
            ...i,
            status: "PAID",
            reference: `DEMO-${randomUUID()}`,
            paidAt: Date.now(),
          };
          tx.update(ref, {
            status: i.status,
            reference: i.reference,
            paidAt: i.paidAt,
          });
        }
      } else if (action === "cancel") {
        if (
          i.status === "PROCESSING" ||
          ["PAID", "UNDERPAID"].includes(i.status) ||
          c.state === "unknown" ||
          c.state === "review_required"
        )
          throw new HttpsError(
            "failed-precondition",
            "Đang đối chiếu kết quả. Giữ nguyên lượt thanh toán này.",
          );
        i = { ...i, status: i.status === "EXPIRED" ? "EXPIRED" : "CANCELLED" };
        tx.update(ref, { status: i.status });
      } else if (action === "loseResponse" && i.status === "PENDING") {
        i = { ...i, status: "PROCESSING" };
        tx.update(ref, { status: i.status });
      }
      return i;
    }),
  );
  if (action === "loseResponse")
    await applyPurchaseDemoOutcome({
      id,
      uid,
      outcome: "unknown",
      linkId: result.paymentLinkId,
    });
  if (
    ["pay", "underpay", "overpay"].includes(action) ||
    (action === "reconcile" && ["PAID", "UNDERPAID"].includes(result.status))
  )
    await receivePurchaseDemoWebhook(await payload(result));
  if (
    action === "cancel" ||
    (action === "reconcile" &&
      ["CANCELLED", "EXPIRED", "FAILED"].includes(result.status))
  )
    await applyPurchaseDemoOutcome({
      id,
      uid,
      outcome: "cancelled",
      linkId: result.paymentLinkId,
    });
  return visible(result);
}
// Exported from index only in emulator; guard also verifies exact project/loopback store.
export const purchaseDemoWebhook = onRequest(
  { region: "asia-southeast1", maxInstances: 1, concurrency: 10 },
  async (req, res) => {
    try {
      guard();
      if (req.method !== "POST") {
        res.status(405).send("Method not allowed");
        return;
      }
      if (
        Number(req.headers["content-length"]) > 16384 ||
        JSON.stringify(req.body ?? null).length > 16384
      ) {
        res.status(413).send("Payload too large");
        return;
      }
      await receivePurchaseDemoWebhook(req.body);
      res.status(200).send("OK");
    } catch {
      res.status(400).send("Invalid demo webhook");
    }
  },
);
