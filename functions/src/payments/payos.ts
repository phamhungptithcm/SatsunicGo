import { releaseCapabilityAllowed } from "../provider-release-gate";
import { validatePaymentQr } from "../../../packages/domain/payment-qr";
import { PayOS } from "@payos/node";
import { defineSecret } from "firebase-functions/params";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { z } from "zod";
import { money, paymentDue, type Order } from "../../../packages/domain";
import { requireVerifiedGoogle } from "../auth/guards";
const clientId = defineSecret("PAYOS_CLIENT_ID"),
  apiKey = defineSecret("PAYOS_API_KEY"),
  checksumKey = defineSecret("PAYOS_CHECKSUM_KEY");
const secrets = [clientId, apiKey, checksumKey];
function sdk() {
  return new PayOS({
    clientId: clientId.value(),
    apiKey: apiKey.value(),
    checksumKey: checksumKey.value(),
    timeout: 10000,
    maxRetries: 0,
  });
}
async function settings() {
  if (!releaseCapabilityAllowed("payments", process.env))
    throw new HttpsError("unavailable", "Thanh toán payOS chưa được kích hoạt.");
  const s = (await getFirestore().doc("settings/payments").get()).data();
  if (
    s?.payosEnabled !== true ||
    typeof s.accountNumber !== "string" ||
    typeof s.returnOrigin !== "string" ||
    !s.returnOrigin.startsWith("https://")
  )
    throw new HttpsError(
      "unavailable",
      "Thanh toán payOS chưa được kích hoạt.",
    );
  return s;
}
export type VerifiedPayment = {
  orderCode: number;
  amount: number;
  currency: string;
  reference: string;
  paymentLinkId: string;
  accountNumber: string;
  code: string;
};
export async function applyVerifiedPayment(
  data: VerifiedPayment,
  accountNumber: string,
) {
  const db = getFirestore(),
    key = createHash("sha256")
      .update(`payos:${data.reference.trim()}`)
      .digest("hex"),
    receipt = db.doc(`webhookReceipts/${key}`),
    bankRef = db.doc(
      `bankTransactions/${createHash("sha256").update(data.reference.trim()).digest("hex")}`,
    );
  return db.runTransaction(async (tx) => {
    const [old, bank] = await Promise.all([tx.get(receipt), tx.get(bankRef)]);
    if (old.exists) return;
    const links = await tx.get(
      db
        .collection("paymentRequests")
        .where("orderCode", "==", data.orderCode)
        .limit(1),
    );
    const intent = links.docs[0],
      i = intent?.data();
    const order = i ? await tx.get(db.doc(`orders/${i.orderId}`)) : null;
    const o = order?.data() as Order | undefined;
    const mismatch =
      bank.exists ||
      !i ||
      !o ||
      data.currency !== "VND" ||
      data.accountNumber !== accountNumber ||
      data.code !== "00" ||
      data.paymentLinkId !== i.paymentLinkId ||
      !Number.isSafeInteger(data.amount) ||
      data.amount <= 0 ||
      data.amount !== i.amount ||
      (o.acceptedQuoteVersion ?? null) !== (i.acceptedQuoteVersion ?? null) ||
      o.stage === "CANCELLED";
    tx.create(receipt, {
      referenceHash: key,
      orderCode: data.orderCode,
      amount: data.amount,
      receivedAt: Date.now(),
      state: mismatch ? "exception" : "allocated",
    });
    if (mismatch) {
      tx.create(db.doc(`paymentExceptions/${key}`), {
        orderCode: data.orderCode,
        amount: data.amount,
        currency: data.currency,
        state: "open",
        reason: "Unmatched payment context",
        bankReferenceHash: bankRef.id,
        inboundVerified:
          data.accountNumber === accountNumber &&
          data.code === "00" &&
          data.currency === "VND" &&
          Number.isSafeInteger(data.amount) &&
          data.amount > 0,
        createdAt: Date.now(),
      });
      return;
    }
    tx.create(bankRef, {
      provider: "payos",
      referenceHash: key,
      orderId: o!.id,
      amount: data.amount,
      createdAt: Date.now(),
    });
    o!.collected = money.parse(o!.collected + data.amount);
    o!.version++;
    if (
      o!.stage === "PACKED" &&
      o!.finalApproved &&
      o!.finalTotal !== undefined &&
      o!.collected - o!.refunded - (o!.refundReserved ?? 0) >= o!.finalTotal &&
      !o!.hold
    )
      o!.stage = "READY_TO_SHIP";
    tx.update(order!.ref, {
      collected: o!.collected,
      version: o!.version,
      stage: o!.stage,
    });
    tx.create(db.collection("financialEntries").doc(), {
      kind: "payment",
      provider: "payos",
      amount: data.amount,
      currency: "VND",
      orderId: o!.id,
      referenceHash: key,
      createdAt: Date.now(),
    });
    tx.update(intent.ref, { state: "paid", paidAt: Date.now() });
    tx.create(db.collection("outboxJobs").doc(), {
      ownerId: o!.ownerId,
      orderId: o!.id,
      action: "verifyTransfer",
      state: "queued",
      createdAt: Date.now(),
    });
    tx.create(db.collection("auditEvents").doc(), {
      actor: "payos-webhook",
      action: "allocatePayment",
      resourceId: o!.id,
      createdAt: Date.now(),
    });
  });
}
export const createPaymentLink = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 3,
    concurrency: 10,
    secrets,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    requireVerifiedGoogle(req.auth);
    if (!req.auth?.uid)
      throw new HttpsError("unauthenticated", "Đăng nhập để thanh toán.");
    const p = z
      .object({
        orderId: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
        purpose: z.enum(["full", "deposit", "balance"]),
        operationId: z.string().uuid(),
      })
      .strict()
      .safeParse(req.data);
    if (!p.success)
      throw new HttpsError("invalid-argument", "Thông tin không hợp lệ.");
    const config = await settings(),
      db = getFirestore(),
      d = p.data;
    const intent = await db.runTransaction(async (tx) => {
      const [os, u, c] = await Promise.all([
        tx.get(db.doc(`orders/${d.orderId}`)),
        tx.get(db.doc(`users/${req.auth!.uid}`)),
        tx.get(db.doc("counters/paymentOrderCode")),
      ]);
      const o = os.data() as Order;
      if (o?.ownerId !== req.auth!.uid || u.data()?.locked)
        throw new HttpsError("permission-denied", "Không thể truy cập đơn.");
      if (!o.acceptedAt || o.stage === "CANCELLED" || o.hold)
        throw new HttpsError("failed-precondition", "Đơn chưa thể thanh toán.");
      if (
        d.purpose === "balance" &&
        (!o.finalApproved || o.finalTotal === undefined)
      )
        throw new HttpsError(
          "failed-precondition",
          "Tổng phí cuối chưa được duyệt.",
        );
      let amount: number;
      try {
        amount = paymentDue(o, d.purpose);
      } catch {
        throw new HttpsError(
          "failed-precondition",
          "Khoản thanh toán không khớp với đơn hiện tại.",
        );
      }
      if (!amount)
        throw new HttpsError(
          "failed-precondition",
          "Không còn khoản cần thanh toán.",
        );
      const id = `${o.id}-${d.purpose}-${o.acceptedQuoteVersion ?? `catalog-${o.catalogSnapshot?.productVersion}`}-${amount}`,
        ref = db.doc(`paymentRequests/${id}`),
        old = await tx.get(ref);
      if (old.exists)
        return { id, ...old.data(), shouldCreate: false } as {
          id: string;
          state: string;
          orderCode: number;
          amount: number;
          checkoutUrl?: string;
          expiresAt?: number;
          qrCode?: string;
          description?: string;
          bin?: string;
          accountNumber?: string;
          shouldCreate: boolean;
        };
      const orderCode = (c.data()?.value ?? 100000) + 1;
      const value = {
        orderId: o.id,
        ownerId: o.ownerId,
        purpose: d.purpose,
        acceptedQuoteVersion: o.acceptedQuoteVersion ?? null,
        amount,
        currency: "VND",
        orderCode,
        state: "creating",
        createdAt: Date.now(),
        operationId: d.operationId,
      };
      tx.set(db.doc("counters/paymentOrderCode"), { value: orderCode });
      tx.create(ref, value);
      return {
        id,
        ...value,
        shouldCreate: true,
        expiresAt: undefined as number | undefined,
        checkoutUrl: undefined as string | undefined,
        qrCode: undefined as string | undefined,
        description: undefined as string | undefined,
        bin: undefined as string | undefined,
      };
    });
    if (intent.checkoutUrl) {
      if (intent.expiresAt && intent.expiresAt <= Date.now())
        throw new HttpsError(
          "failed-precondition",
          "Yêu cầu thanh toán đã hết hạn. Liên hệ nhân viên để đối chiếu trước khi thanh toán lại.",
        );
      if (intent.qrCode)
        validatePaymentQr(intent.qrCode, {
          accountNumber: config.accountNumber,
          amount: intent.amount!,
          description: intent.description!,
          bin: intent.bin,
        });
      return {
        checkoutUrl: intent.checkoutUrl,
        ...(intent.qrCode
          ? {
              expiresAt: intent.expiresAt,
              qrCode: intent.qrCode,
              amount: intent.amount,
              accountNumber: config.accountNumber,
              description: intent.description,
              bin: intent.bin,
            }
          : {}),
      };
    }
    const client = sdk();
    if (
      !intent.shouldCreate ||
      intent.state !== "creating" ||
      Date.now() - Number((intent as { createdAt?: number }).createdAt) > 30000
    ) {
      try {
        await client.paymentRequests.get(intent.orderCode);
      } catch {
        /* Unknown outcome is kept for reconciliation. */
      }
      throw new HttpsError(
        "unavailable",
        "Đang xác minh yêu cầu thanh toán trước. Không tạo giao dịch mới.",
      );
    }
    try {
      const expiresAt = Date.now() + 30 * 60 * 1000;
      const link = await client.paymentRequests.create({
        expiredAt: Math.floor(expiresAt / 1000),
        orderCode: intent.orderCode,
        amount: intent.amount,
        description: `SG ${intent.orderCode}`,
        cancelUrl: `${config.returnOrigin}/account`,
        returnUrl: `${config.returnOrigin}/account`,
      });
      if (
        link.currency !== "VND" ||
        link.amount !== intent.amount ||
        link.accountNumber !== config.accountNumber
      )
        throw Error("MERCHANT_MISMATCH");
      const qrCode = validatePaymentQr(link.qrCode, {
        accountNumber: config.accountNumber,
        amount: intent.amount!,
        description: `SG ${intent.orderCode}`,
        bin: link.bin,
      });
      await db.doc(`paymentRequests/${intent.id}`).update({
        qrCode,
        expiresAt,
        description: `SG ${intent.orderCode}`,
        bin: link.bin,
        accountNumber: config.accountNumber,
        state: "pending",
        checkoutUrl: link.checkoutUrl,
        paymentLinkId: link.paymentLinkId,
      });
      return {
        checkoutUrl: link.checkoutUrl,
        qrCode,
        expiresAt,
        amount: intent.amount,
        accountNumber: config.accountNumber,
        description: `SG ${intent.orderCode}`,
        bin: link.bin,
      };
    } catch {
      await db.doc(`paymentRequests/${intent.id}`).update({ state: "unknown" });
      throw new HttpsError(
        "unavailable",
        "Chưa xác định kết quả tạo thanh toán. Yêu cầu được giữ để đối soát.",
      );
    }
  },
);
export const payosWebhook = onRequest(
  { region: "asia-southeast1", maxInstances: 3, secrets },
  async (req, res) => {
    if (!releaseCapabilityAllowed("payments", process.env)) {
      res.status(503).send("Payment processing unavailable");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }
    try {
      const config = await settings(),
        verified = await sdk().webhooks.verify(req.body);
      await applyVerifiedPayment(verified, config.accountNumber);
      res.status(200).send("OK");
    } catch {
      res.status(400).send("Invalid webhook");
    }
  },
);
export const reconcilePayments = onSchedule(
  {
    schedule: "every 30 minutes",
    region: "asia-southeast1",
    maxInstances: 1,
    secrets,
  },
  async () => {
    if (!releaseCapabilityAllowed("payments", process.env)) return;
    let config;
    try {
      config = await settings();
    } catch {
      return;
    }
    const db = getFirestore(),
      rows = await db
        .collection("paymentRequests")
        .where("state", "in", ["pending", "unknown"])
        .limit(20)
        .get(),
      client = sdk();
    for (const doc of rows.docs) {
      const intent = doc.data();
      try {
        const result = await client.paymentRequests.get(intent.orderCode);
        // Recover a create timeout only from an authenticated provider readback.
        // Never derive the link identifier from a browser return parameter.
        if (!intent.paymentLinkId) {
          if (
            result.orderCode !== intent.orderCode ||
            result.amount !== intent.amount ||
            !result.id
          )
            throw Error("PROVIDER_CONTEXT_MISMATCH");
          await db.runTransaction(async (tx) => {
            const current = await tx.get(doc.ref);
            if (
              current.data()?.orderCode !== result.orderCode ||
              current.data()?.amount !== result.amount
            )
              throw Error("STALE_PAYMENT_INTENT");
            if (
              current.data()?.paymentLinkId &&
              current.data()?.paymentLinkId !== result.id
            )
              throw Error("PROVIDER_CONTEXT_MISMATCH");
            tx.update(doc.ref, {
              paymentLinkId: result.id,
              state: "pending",
              reconciliationState: "linkRecovered",
              lastCheckedAt: Date.now(),
            });
          });
        }
        for (const t of result.transactions) {
          await applyVerifiedPayment(
            {
              orderCode: result.orderCode,
              amount: t.amount,
              currency: "VND",
              reference: t.reference,
              paymentLinkId: result.id,
              accountNumber: t.accountNumber,
              code: "00",
            },
            config.accountNumber,
          );
        }
      } catch {
        await doc.ref.update({
          reconciliationState: "retry",
          lastCheckedAt: Date.now(),
        });
      }
    }
  },
);
