import type { Response } from "express";
import { createHash, randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import {
  onCall,
  onRequest,
  HttpsError,
  type CallableRequest,
  type Request,
} from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { z } from "zod";
import { requireVerifiedGoogle } from "./auth/guards";
import { purchaseDemoEnvironment } from "./purchase-environment";
import { settleSePayEvidence } from "./purchase-settlement";
import {
  SEPAY_MERCHANT,
  sepayInvoice,
  sepayIpnSchema,
  verifySePayReadback,
  type SePayIntent,
  type SePayProof,
  type SePayIpn,
} from "../../packages/domain/purchase-sepay";
import type { PurchaseCheckout } from "../../packages/domain/purchase-checkout";
import {
  authenticSePayIpn,
  sandboxAdapter,
  sandboxPaymentReady,
  sepaySecrets,
  sepaySandboxIpnSecret,
  type SePayAdapter,
} from "./payments/sepay-sandbox";

const options = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 4,
  secrets: sepaySecrets,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const invoiceKey = (invoice: string) => digest(`${SEPAY_MERCHANT}|${invoice}`);
const evidenceKey = (id: string) =>
  digest(`sepay_sandbox|${SEPAY_MERCHANT}|${id}`);
const command = z
  .object({
    id: z.string().uuid(),
    action: z.enum(["createCheckout", "status", "reconcile"]),
  })
  .strict();
function guard() {
  if (!purchaseDemoEnvironment())
    throw new HttpsError("permission-denied", "Kênh thử chưa khả dụng.");
}

export async function handleSePayPayment(
  req: CallableRequest,
  adapter?: SePayAdapter,
) {
  guard();
  const uid = requireVerifiedGoogle(req.auth),
    parsed = command.safeParse(req.data),
    db = getFirestore();
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Kiểm tra lại mã thanh toán.");
  const { id, action } = parsed.data;
  const intent = await db.runTransaction(async (tx) => {
    const ref = db.doc(`purchaseSePayIntents/${id}`);
    const [stored, existing, profile, access] = await tx.getAll(
      db.doc(`purchaseCheckouts/${id}`),
      ref,
      db.doc(`users/${uid}`),
      db.doc(`staffAccess/${uid}`),
    );
    const checkout = stored.data() as
      (PurchaseCheckout & { hash: string }) | undefined;
    if (
      !checkout ||
      checkout.ownerId !== uid ||
      checkout.provider !== "sepay_sandbox"
    )
      throw new HttpsError("permission-denied", "Chưa mở được thanh toán.");
    if (profile.data()?.locked || access.data()?.locked)
      throw new HttpsError(
        "permission-denied",
        "Tài khoản chưa thể tiếp tục mua hàng.",
      );
    if (existing.exists) {
      const prior = existing.data() as SePayIntent;
      if (
        prior.ownerId !== uid ||
        prior.amount !== checkout.total ||
        prior.checkoutHash !== checkout.hash ||
        prior.paymentMethod !== checkout.paymentMethod
      )
        throw new HttpsError(
          "failed-precondition",
          "Lượt thanh toán cần đối chiếu.",
        );
      if (
        action === "createCheckout" &&
        (!["pending", "unknown"].includes(checkout.state) ||
          prior.expiresAt <= Date.now())
      )
        throw new HttpsError(
          "failed-precondition",
          "Lượt này cần kiểm tra kết quả trước khi tiếp tục.",
        );
      return prior;
    }
    if (action !== "createCheckout") return null;
    if (!adapter && !sandboxPaymentReady())
      throw new HttpsError(
        "failed-precondition",
        "Kênh thanh toán đang chờ thiết lập. Lượt của bạn được giữ lại.",
      );
    if (
      checkout.state !== "pending" ||
      checkout.expiresAt <= Date.now() ||
      checkout.paymentMethod !== "BANK_TRANSFER"
    )
      throw new HttpsError(
        "failed-precondition",
        "Xem lại lượt thanh toán trước khi tiếp tục.",
      );
    const invoice = sepayInvoice(id),
      indexRef = db.doc(`purchaseSePayInvoiceIndex/${invoiceKey(invoice)}`),
      index = await tx.get(indexRef);
    if (index.exists)
      throw new HttpsError(
        "failed-precondition",
        "Mã thanh toán cần đối chiếu.",
      );
    const created: SePayIntent = {
      checkoutId: id,
      ownerId: uid,
      invoice,
      merchant: SEPAY_MERCHANT,
      provider: "sepay_sandbox",
      amount: checkout.total,
      currency: "VND",
      paymentMethod: "BANK_TRANSFER",
      checkoutHash: checkout.hash,
      createdAt: Date.now(),
      expiresAt: checkout.expiresAt,
    };
    tx.create(ref, created);
    tx.create(indexRef, {
      checkoutId: id,
      ownerId: uid,
      invoice,
      merchant: SEPAY_MERCHANT,
    });
    tx.update(stored.ref, { sepayInvoice: invoice });
    return created;
  });
  try {
    if (action === "createCheckout")
      return (adapter ?? sandboxAdapter()).form(intent!);
    if (action === "reconcile" && intent?.providerOrderId)
      await reconcileSePayIntent(id, adapter);
    const c = (await db.doc(`purchaseCheckouts/${id}`).get()).data()!;
    return {
      id,
      state: c.state,
      invoice: intent?.invoice ?? null,
      receiptId: c.receiptId ?? null,
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      "unavailable",
      "Chưa xác minh được với SePay. Giữ cùng lượt và kiểm tra lại sau.",
    );
  }
}
export const purchaseSePayPayment = onCall(options, (req) =>
  handleSePayPayment(req),
);

/** Authenticated IPN is only a wake-up signal; it is never settlement proof. */
export async function admitSePayIpn(body: unknown) {
  guard();
  const payload = sepayIpnSchema.parse(body),
    db = getFirestore();
  const indexRef = db.doc(
    `purchaseSePayInvoiceIndex/${invoiceKey(payload.order.order_invoice_number)}`,
  );
  const key = digest(
    `${SEPAY_MERCHANT}|${payload.notification_type}|${payload.order.order_id}|${payload.transaction.id}`,
  );
  await db.runTransaction(async (tx) => {
    const index = await tx.get(indexRef),
      id = index.data()?.checkoutId;
    if (!id || index.data()?.merchant !== SEPAY_MERCHANT)
      throw Error("SEPAY_UNKNOWN_INVOICE");
    const ref = db.doc(`purchaseSePayIntents/${id}`),
      inboxRef = db.doc(`purchaseSePayInbox/${key}`);
    const [intentDoc, inbox] = await tx.getAll(ref, inboxRef),
      intent = intentDoc.data() as SePayIntent | undefined;
    if (
      !intent ||
      intent.invoice !== payload.order.order_invoice_number ||
      intent.merchant !== SEPAY_MERCHANT ||
      (intent.providerOrderId &&
        (intent.providerOrderId !== payload.order.order_id ||
          intent.providerInternalId !== payload.order.id))
    )
      throw Error("SEPAY_BINDING_MISMATCH");
    if (inbox.exists) {
      if (
        inbox.data()?.payloadHash !==
        digest(JSON.stringify({ ...payload, timestamp: 0 }))
      )
        throw Error("SEPAY_REPLAY_CONFLICT");
      return;
    }
    tx.update(ref, {
      providerOrderId: payload.order.order_id,
      providerInternalId: payload.order.id,
    });
    tx.create(inboxRef, {
      checkoutId: id,
      payload,
      payloadHash: digest(JSON.stringify({ ...payload, timestamp: 0 })),
      state: "queued",
      attempts: 0,
      createdAt: Date.now(),
    });
  });
  return key;
}
export async function handleSePayIpn(req: Request, res: Response) {
  if (!purchaseDemoEnvironment() || !sandboxPaymentReady()) {
    res.status(503).json({ received: false });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  if (
    !authenticSePayIpn(req.get("X-Secret-Key"), sepaySandboxIpnSecret.value())
  ) {
    res.status(401).end();
    return;
  }
  if (
    !/^application\/json(?:;|$)/i.test(req.get("content-type") ?? "") ||
    !req.rawBody ||
    req.rawBody.length > 65536
  ) {
    res.status(400).end();
    return;
  }
  try {
    await admitSePayIpn(req.body);
    res.status(200).json({ received: true });
  } catch (error) {
    const invalid =
      error instanceof z.ZodError ||
      (error instanceof Error &&
        [
          "SEPAY_UNKNOWN_INVOICE",
          "SEPAY_BINDING_MISMATCH",
          "SEPAY_REPLAY_CONFLICT",
        ].includes(error.message));
    res.status(invalid ? 400 : 503).json({ received: false });
  }
}
export const purchaseSePayIpn = onRequest(
  { ...options, cors: false },
  handleSePayIpn,
);

export async function reconcileSePayIntent(
  id: string,
  adapter?: SePayAdapter,
  notification?: SePayIpn,
) {
  guard();
  z.string().uuid().parse(id);
  const db = getFirestore(),
    ref = db.doc(`purchaseSePayIntents/${id}`),
    claim = randomUUID(),
    now = Date.now();
  const intent = await db.runTransaction(async (tx) => {
    const stored = await tx.get(ref),
      data = stored.data();
    if (
      !data?.providerOrderId ||
      data.leaseUntil > now ||
      data.nextReadAt > now
    )
      return null;
    tx.update(ref, { claim, leaseUntil: now + 30000, nextReadAt: now + 2000 });
    return data as SePayIntent;
  });
  if (!intent) return { kind: "deferred" as const };
  try {
    const storedEvidenceId = (
      intent as SePayIntent & { verifiedEvidenceId?: string }
    ).verifiedEvidenceId;
    if (storedEvidenceId) {
      const previous = (
        await db.doc(`purchaseSePayEvidence/${storedEvidenceId}`).get()
      ).data() as SePayProof | undefined;
      if (
        !previous ||
        previous.checkoutId !== id ||
        previous.ownerId !== intent.ownerId ||
        previous.invoice !== intent.invoice
      )
        throw Error("SEPAY_BINDING_MISMATCH");
      if (
        !notification ||
        notification.transaction.id === previous.transactionId
      ) {
        await settleSePayEvidence(storedEvidenceId);
        return {
          kind: "processed" as const,
          transactionId: previous.transactionId,
        };
      }
    }
    const raw = await (adapter ?? sandboxAdapter()).readback(
        intent.providerOrderId!,
      ),
      proof = verifySePayReadback(raw, intent, notification);
    if (!proof) return { kind: "pending" as const }; // No reservation release from a callback.
    const key = evidenceKey(proof.transactionId);
    const proofConflict = await db.runTransaction(async (tx) => {
      const [current, previous, checkout] = await tx.getAll(
        ref,
        db.doc(`purchaseSePayEvidence/${key}`),
        db.doc(`purchaseCheckouts/${id}`),
      );
      if (current.data()?.claim !== claim) throw Error("SEPAY_LEASE_LOST");
      if (previous.exists) {
        const prior = previous.data() as SePayProof;
        if (
          prior.checkoutId !== proof.checkoutId ||
          prior.ownerId !== proof.ownerId ||
          prior.amount !== proof.amount ||
          prior.paidAt !== proof.paidAt ||
          prior.invoice !== proof.invoice ||
          prior.providerOrderId !== proof.providerOrderId ||
          prior.checkoutHash !== proof.checkoutHash
        ) {
          tx.update(ref, {
            conflictingProof: proof,
            failureCode: "REFERENCE_REUSED",
          });
          if (checkout.data()?.state !== "paid")
            tx.update(checkout.ref, {
              state: "review_required",
              receivedAmount: proof.amount,
              version: checkout.data()!.version + 1,
            });
          return true;
        }
      } else tx.create(previous.ref, proof);
      tx.update(ref, { verifiedEvidenceId: key });
      return false;
    });
    if (proofConflict)
      return {
        kind: "review_required" as const,
        transactionId: proof.transactionId,
      };
    await settleSePayEvidence(key);
    return { kind: "processed" as const, transactionId: proof.transactionId };
  } finally {
    await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (current.data()?.claim === claim) tx.update(ref, { leaseUntil: 0 });
    });
  }
}
export async function processSePayInbox(key: string, adapter?: SePayAdapter) {
  guard();
  if (!adapter && !sandboxPaymentReady()) return; // Keep queued without burning retries while configuration is absent.
  if (!/^[a-f0-9]{64}$/.test(key)) throw Error("SEPAY_INBOX_INVALID");
  const db = getFirestore(),
    ref = db.doc(`purchaseSePayInbox/${key}`),
    claim = randomUUID(),
    now = Date.now();
  const item = await db.runTransaction(async (tx) => {
    const current = await tx.get(ref),
      data = current.data();
    if (
      !data ||
      data.state === "done" ||
      data.state === "review_required" ||
      data.leaseUntil > now
    )
      return null;
    if (data.attempts >= 5) {
      tx.update(ref, {
        state: "review_required",
        leaseUntil: 0,
        failureCode: "RETRY_LIMIT",
      });
      return null;
    }
    tx.update(ref, {
      state: "processing",
      claim,
      leaseUntil: now + 60000,
      attempts: data.attempts + 1,
    });
    return data;
  });
  if (!item) return;
  try {
    if (item.payload.notification_type === "TRANSACTION_VOID") {
      await db.runTransaction(async (tx) => {
        const [current, checkout] = await tx.getAll(
          ref,
          db.doc(`purchaseCheckouts/${item.checkoutId}`),
        );
        const orderRefs: FirebaseFirestore.DocumentReference[] = (
          checkout.data()?.lines ?? []
        ).map((line: { orderId: string }) => db.doc(`orders/${line.orderId}`));
        const orders = orderRefs.length ? await tx.getAll(...orderRefs) : [];
        if (current.data()?.claim !== claim) return;
        tx.update(ref, {
          state: "review_required",
          leaseUntil: 0,
          failureCode: "VOID_REQUIRES_REVIEW",
        });
        // An authenticated reversal notice freezes fulfillment for human review.
        // Collected amounts and ledger entries are never automatically reversed.
        for (const order of orders)
          if (order.exists)
            tx.update(order.ref, {
              hold: "Giao dịch thanh toán cần đối chiếu",
              version: order.data()!.version + 1,
            });
        if (checkout.exists && checkout.data()?.state !== "paid")
          tx.update(checkout.ref, {
            state: "review_required",
            version: checkout.data()!.version + 1,
          });
      });
      return;
    }
    const reconciliation = await reconcileSePayIntent(
      item.checkoutId,
      adapter ?? sandboxAdapter(),
      item.payload,
    );
    if (
      !reconciliation ||
      !["processed", "review_required"].includes(reconciliation.kind) ||
      !("transactionId" in reconciliation) ||
      reconciliation.transactionId !== item.payload.transaction.id
    )
      throw Error("SEPAY_NOTIFICATION_NOT_PROCESSED");
    const c = (
      await db.doc(`purchaseCheckouts/${item.checkoutId}`).get()
    ).data();
    if (!["paid", "review_required"].includes(c?.state))
      throw Error("SEPAY_NOT_YET_CONFIRMED");
    await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (current.data()?.claim === claim)
        tx.update(ref, {
          state: "done",
          leaseUntil: 0,
          completedAt: Date.now(),
        });
    });
  } catch {
    await db.runTransaction(async (tx) => {
      const [current, checkout] = await tx.getAll(
        ref,
        db.doc(`purchaseCheckouts/${item.checkoutId}`),
      );
      if (current.data()?.claim === claim)
        tx.update(ref, {
          state: "queued",
          leaseUntil: 0,
          failureCode: "READBACK_OR_ALLOCATION_FAILED",
        });
      if (
        current.data()?.claim === claim &&
        checkout.data()?.state === "pending"
      )
        tx.update(checkout.ref, {
          state: "unknown",
          version: checkout.data()!.version + 1,
        });
    });
    throw Error("SEPAY_RETRY_REQUIRED");
  }
}
export const purchaseSePayInboxWorker = onDocumentCreated(
  {
    document: "purchaseSePayInbox/{id}",
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 4,
    secrets: sepaySecrets,
    retry: true,
  },
  (event) => processSePayInbox(event.params.id),
);
