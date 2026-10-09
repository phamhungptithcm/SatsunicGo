import {
  customerEvent,
  customerEventFields,
} from "./customer-notification-events";
import { createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { cartSchema } from "../../packages/domain/cart";
import {
  assertVerifiedPayment,
  type PurchaseCheckout,
} from "../../packages/domain/purchase-checkout";
import type { Order } from "../../packages/domain";
import { normalizeCustomerName } from "../../packages/domain/crm";
import { purchaseBalanceTarget } from "./purchase-adjustment";
import { purchaseDemoEnvironment } from "./purchase-environment";
import { withPurchaseMutation } from "./purchase-mutation-queue";
import {
  SEPAY_MERCHANT,
  type SePayProof,
} from "../../packages/domain/purchase-sepay";
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
type DemoSettlementInput = {
  id: string;
  outcome: "pending" | "unknown" | "paid" | "cancelled";
  uid: string;
  token?: { name?: unknown; email?: unknown };
  linkId?: string;
};
export async function applyDemoSettlement(input: DemoSettlementInput) {
  return applySettlement(input);
}
/** Only persisted server-verified evidence can reach the SePay allocation branch. */
export async function settleSePayEvidence(evidenceId: string) {
  if (!/^[a-f0-9]{64}$/.test(evidenceId) || !purchaseDemoEnvironment())
    throw new HttpsError("permission-denied", "Kênh thử chưa khả dụng.");
  const stored = await getFirestore()
    .doc(`purchaseSePayEvidence/${evidenceId}`)
    .get();
  const proof = stored.data() as SePayProof | undefined;
  if (!proof || proof.state !== "verified")
    throw new HttpsError(
      "failed-precondition",
      "Chưa xác minh được giao dịch.",
    );
  return applySettlement({
    id: proof.checkoutId,
    uid: proof.ownerId,
    outcome: "paid",
    evidenceId,
  });
}
async function applySettlement(
  input: DemoSettlementInput & { evidenceId?: string },
) {
  const { id, outcome, uid, token = {}, linkId, evidenceId } = input,
    db = getFirestore();
  if (!purchaseDemoEnvironment(db))
    throw new HttpsError("permission-denied", "Kênh thử chưa khả dụng.");
  const channel = evidenceId ? "sepay_sandbox" : "demo";
  const merchant = evidenceId ? SEPAY_MERCHANT : "demo-satsunicgo";
  const ref = db.doc(`purchaseCheckouts/${id}`);
  return withPurchaseMutation(`allocation-${id}`, () =>
    db.runTransaction(async (tx) => {
      const [profile, access, providerDoc] = await tx.getAll(
        db.doc(`users/${uid}`),
        db.doc(`staffAccess/${uid}`),
        evidenceId
          ? db.doc(`purchaseSePayEvidence/${evidenceId}`)
          : db.doc(`purchaseDemoLinks/${id}`),
      );
      const provider = providerDoc.data();
      const proof = evidenceId
        ? (provider as SePayProof | undefined)
        : undefined;
      if (
        evidenceId &&
        (!proof ||
          proof.state !== "verified" ||
          proof.provider !== channel ||
          proof.merchant !== merchant ||
          proof.checkoutId !== id ||
          proof.ownerId !== uid ||
          proof.currency !== "VND" ||
          proof.paymentMethod !== "BANK_TRANSFER" ||
          !Number.isSafeInteger(proof.amount) ||
          proof.amount <= 0 ||
          !Number.isSafeInteger(proof.paidAt) ||
          !/^SEPAY-SBX-[A-Za-z0-9_-]{1,100}$/.test(proof.reference))
      )
        throw new HttpsError(
          "failed-precondition",
          "Bằng chứng thanh toán chưa khớp.",
        );
      if (
        !evidenceId &&
        providerDoc.exists &&
        (!linkId ||
          linkId !== provider?.paymentLinkId ||
          provider?.ownerId !== uid)
      )
        throw new HttpsError(
          "failed-precondition",
          "Tiếp tục qua liên kết thanh toán đã tạo.",
        );
      if (
        linkId &&
        (!providerDoc.exists ||
          (outcome === "paid" &&
            !["PAID", "UNDERPAID"].includes(provider?.status)) ||
          (outcome === "cancelled" &&
            !["CANCELLED", "EXPIRED", "FAILED"].includes(provider?.status)))
      )
        throw new HttpsError(
          "failed-precondition",
          "Chưa xác minh được kết quả từ kênh thanh toán.",
        );
      const locked = profile.data()?.locked || access.data()?.locked;
      if (locked && !evidenceId && (!linkId || outcome !== "paid"))
        throw new HttpsError(
          "permission-denied",
          "Tài khoản chưa thể tiếp tục mua hàng.",
        );
      const reference = proof
        ? proof.reference
        : linkId && provider!.reference
          ? provider!.reference
          : `DEMO-${id}`;
      const [stored, demo, cartDoc, received] = await tx.getAll(
        ref,
        db.doc("settings/purchaseDemo"),
        db.doc(`carts/${uid}`),
        db.doc(`purchasePaymentEvidence/${reference}`),
      );
      const checkout = stored.data() as
        | (PurchaseCheckout & {
            orders: Order[];
            hash: string;
            receiptEmail?: string;
          })
        | undefined;
      if (
        !checkout ||
        checkout.ownerId !== uid ||
        (!evidenceId && demo.data()?.enabled !== true) ||
        checkout.provider !== channel ||
        (proof &&
          (proof.checkoutHash !== checkout.hash ||
            proof.expectedAmount !== checkout.total ||
            checkout.paymentMethod !== proof.paymentMethod))
      )
        throw new HttpsError(
          "permission-denied",
          "Chưa mở được thanh toán demo.",
        );
      if (checkout.state === "paid") {
        if (
          proof &&
          checkout.paymentReference !== reference &&
          !received.exists
        ) {
          tx.create(received.ref, {
            ...proof,
            allocationState: "review_required",
            reason: "SECOND_TRANSACTION",
          });
          return { id, state: "review_required" };
        }
        return { id, state: "paid", receiptId: checkout.receiptId };
      }
      if (proof && received.exists)
        return {
          id,
          state: checkout.state,
          receiptId: checkout.receiptId ?? null,
        };
      if (
        checkout.state === "review_required" &&
        !evidenceId &&
        linkId &&
        outcome === "paid"
      )
        return { id, state: "review_required" };
      // A retry of the same server-confirmed unpaid cancellation is a read.
      // Owner, provider link and terminal unpaid status were checked above.
      // Never release a later cart or increment versions again on this replay.
      if (
        !evidenceId &&
        linkId &&
        checkout.state === "cancelled" &&
        outcome === "cancelled" &&
        !received.exists
      )
        return { id, state: "cancelled" };
      if (
        !evidenceId &&
        (checkout.state === "cancelled" || checkout.state === "review_required")
      )
        throw new HttpsError(
          "failed-precondition",
          "Lượt này đã dừng hoặc cần đối chiếu.",
        );
      const balanceOrder =
        checkout.purpose === "balance"
          ? await tx.get(db.doc(`orders/${checkout.sourceOrderId}`))
          : null;
      if (outcome === "cancelled") {
        if (checkout.state === "unknown" || received.exists)
          throw new HttpsError(
            "failed-precondition",
            "Kết quả chưa rõ. Tiếp tục kiểm tra cùng lượt.",
          );
        tx.update(ref, { state: "cancelled", version: checkout.version + 1 });
        if (balanceOrder?.data()?.balanceCheckoutId === id)
          tx.update(balanceOrder.ref, {
            balanceCheckoutId: null,
            version: balanceOrder.data()!.version + 1,
          });
        if (cartDoc.data()?.activeCheckoutId === id)
          tx.update(cartDoc.ref, {
            activeCheckoutId: null,
            revision: cartDoc.data()!.revision + 1,
            updatedAt: Date.now(),
          });
        return { id, state: "cancelled" };
      }
      if (outcome !== "paid") {
        const state = checkout.state === "unknown" ? "unknown" : outcome;
        tx.update(ref, { state, version: checkout.version + 1 });
        return { id, state };
      }
      if (
        linkId &&
        (provider!.amount !== checkout.total ||
          provider!.currency !== "VND" ||
          !Number.isSafeInteger(provider!.paidAt) ||
          provider!.paidAt < 0 ||
          !/^DEMO-[a-zA-Z0-9-]{1,80}$/.test(reference ?? ""))
      )
        throw new HttpsError(
          "failed-precondition",
          "Bằng chứng thanh toán chưa khớp.",
        );
      const receivedAmount = proof
        ? proof.amount
        : linkId
          ? (provider!.paidAmount ?? checkout.total)
          : checkout.total;
      const amountMismatch = receivedAmount !== checkout.total;
      if (
        !amountMismatch &&
        (!proof || !["cancelled", "review_required"].includes(checkout.state))
      )
        assertVerifiedPayment(
          checkout,
          {
            provider: channel,
            merchant,
            reference,
            currency: "VND",
            amount: checkout.total,
          },
          merchant,
        );
      if (received.exists)
        throw new HttpsError(
          "failed-precondition",
          "Khoản này đang cần đối chiếu.",
        );
      const parsedCart = cartSchema.safeParse(cartDoc.data());
      const cart = parsedCart.success
        ? parsedCart.data
        : { ownerId: uid, revision: 0, updatedAt: 0, items: [] };

      const draftMedia = balanceOrder
        ? []
        : await Promise.all(
            checkout.lines.map((line) =>
              line.draftId
                ? tx.get(db.doc(`purchaseDrafts/${line.draftId}`))
                : Promise.resolve(null),
            ),
          );
      const now = Date.now(),
        paidAt = proof ? proof.paidAt : linkId ? provider!.paidAt : now,
        receiptId = id;
      const currentOrder = balanceOrder?.data() as Order | undefined;
      let currentTarget: ReturnType<typeof purchaseBalanceTarget> | null = null;
      try {
        if (currentOrder) currentTarget = purchaseBalanceTarget(currentOrder);
      } catch {
        /* verified money goes to review */
      }
      if (
        amountMismatch ||
        (proof &&
          (checkout.state === "cancelled" ||
            checkout.state === "review_required" ||
            proof.paidAt > checkout.expiresAt)) ||
        locked ||
        !parsedCart.success ||
        checkout.orders.length !== checkout.lines.length ||
        checkout.lines.reduce((sum, line) => sum + line.total, 0) !==
          checkout.total ||
        checkout.orders.some(
          (order, n) =>
            order.ownerId !== uid || order.id !== checkout.lines[n]?.orderId,
        ) ||
        (!balanceOrder &&
          (cart.ownerId !== uid || cart.activeCheckoutId !== id)) ||
        (balanceOrder &&
          (!currentOrder ||
            currentOrder.ownerId !== uid ||
            currentOrder.balanceCheckoutId !== id ||
            currentOrder.version !== checkout.sourceOrderVersion! + 1 ||
            currentOrder.hold ||
            currentOrder.refundReserved ||
            currentTarget?.reason !== checkout.balanceReason ||
            Math.max(
              0,
              (currentTarget?.total ?? 0) -
                currentOrder.collected +
                currentOrder.refunded,
            ) !== checkout.total))
      ) {
        tx.create(db.doc(`purchasePaymentEvidence/${reference}`), {
          checkoutId: id,
          provider: channel,
          merchant,
          currency: "VND",
          amount: receivedAmount,
          reference,
          verifiedAt: now,
          allocationState: "review_required",
        });
        tx.update(ref, {
          state: "review_required",
          receivedAmount,
          version: checkout.version + 1,
        });
        if (balanceOrder?.exists)
          tx.update(balanceOrder.ref, {
            hold: "Khoản trả thêm cần đối chiếu",
            version: (currentOrder?.version ?? 0) + 1,
          });
        return { id, state: "review_required" };
      }
      if (
        checkout.orders.length !== checkout.lines.length ||
        checkout.lines.reduce((s, l) => s + l.total, 0) !== checkout.total
      )
        throw new HttpsError(
          "failed-precondition",
          "Phân bổ thanh toán cần đối chiếu.",
        );
      if (!balanceOrder && !profile.exists) {
        const displayName =
          typeof token.name === "string" ? token.name.slice(0, 120) : "";
        tx.create(db.doc(`users/${uid}`), {
          ownerId: uid,
          displayName,
          searchName: normalizeCustomerName(displayName),
          businessName: "",
          marketingConsent: false,
          version: 1,
          createdAt: now,
          changedAt: now,
        });
      }
      tx.create(db.doc(`purchasePaymentEvidence/${reference}`), {
        checkoutId: id,
        provider: channel,
        merchant,
        currency: "VND",
        amount: checkout.total,
        reference,
        verifiedAt: now,
      });
      checkout.orders.forEach((order, i) => {
        const line = checkout.lines[i];
        if (order.id !== line.orderId || order.ownerId !== uid)
          throw new HttpsError("failed-precondition", "Phân bổ đơn chưa khớp.");
        if (balanceOrder)
          tx.update(balanceOrder.ref, {
            collected: currentOrder!.collected + line.total,
            latestReceiptId: id,
            ...(proof ? { testMode: true, paymentProvider: channel } : {}),
            balanceCheckoutId: null,
            stage:
              currentOrder!.packingComplete && currentOrder!.finalApproved
                ? "READY_TO_SHIP"
                : currentOrder!.stage,
            version: currentOrder!.version + 1,
          });
        else
          tx.create(db.doc(`orders/${order.id}`), {
            ...order,
            collected: line.total,
            ...(proof ? { testMode: true, paymentProvider: channel } : {}),
            latestReceiptId: id,
          });
        if (!balanceOrder) {
          const images = (draftMedia[i]?.data()?.images ?? []).filter(
            (m: { itemIndex: number; state: string }) =>
              m.itemIndex === line.itemIndex && m.state === "ready",
          );
          for (const media of images) {
            const mediaId = hash({ orderId: order.id, sourceId: media.id });
            tx.create(db.doc(`orderMedia/${mediaId}`), {
              orderId: order.id,
              kind: "request",
              description: line.name,
              mime: media.mime,
              objectPath: media.objectPath,
              state: "ready",
              uploadedBy: uid,
              createdAt: now,
            });
          }
          if (images.length)
            tx.create(db.doc(`orderMediaCounters/${order.id}`), {
              count: images.length,
            });
        }
        if (!balanceOrder) {
          const recipient = {
            recipient: checkout.recipient.recipient,
            phone: checkout.recipient.phone,
            address: [
              checkout.recipient.street,
              checkout.recipient.commune,
              checkout.recipient.province,
              "Việt Nam",
            ].join(", "),
          };
          tx.create(db.doc(`orderRecipients/${order.id}`), {
            ownerId: uid,
            ...recipient,
            checkoutId: id,
            version: 1,
          });
          // Match Ask's private operations projection in the same allocation.
          // A replay/balance never replaces the frozen recipient or warehouse data.
          tx.create(db.doc(`orderOperations/${order.id}`), {
            recipient,
            changedAt: now,
          });
        }
        tx.create(db.doc(`financialEntries/purchase-${id}-${order.id}`), {
          orderId: order.id,
          ownerId: uid,
          checkoutId: id,
          kind: "payment",
          purpose: balanceOrder ? "balance" : "full",
          amount: line.total,
          reference,
          provider: channel,
          ...(proof
            ? { testMode: true, paymentMethod: proof.paymentMethod }
            : {}),
          createdAt: now,
        });
        tx.create(db.doc(`orders/${order.id}/timeline/purchase-${id}`), {
          action: "verifyTransfer",
          createdAt: now,
        });
      });
      tx.create(db.doc(`purchaseReceipts/${receiptId}`), {
        id: receiptId,
        ownerId: uid,
        ownerEmail: proof
          ? (checkout.receiptEmail ?? null)
          : typeof token.email === "string"
            ? token.email
            : null,
        checkoutId: id,
        lines: checkout.lines,
        total: checkout.total,
        currency: "VND",
        provider: channel,
        ...(proof
          ? {
              testMode: true,
              paymentMethod: proof.paymentMethod,
              merchant,
              invoice: proof.invoice,
            }
          : {}),
        reference,
        paidAt,
        purpose: balanceOrder ? "balance" : "initial",
        state: "queued",
        previouslyPaid: checkout.previouslyPaid ?? 0,
        ...(balanceOrder
          ? {
              balanceReason: checkout.balanceReason,
              previousReceiptId:
                currentOrder!.latestReceiptId ?? currentOrder!.checkoutId,
              finalTotal: checkout.finalTotal,
            }
          : {}),
        shipping: checkout.shipping,
        snapshotHash: hash({
          lines: checkout.lines,
          total: checkout.total,
          reference,
          paidAt,
        }),
      });
      tx.create(db.doc(`outboxJobs/purchase-payment-${receiptId}`), {
        ownerId: uid,
        action: "verifyTransfer",
        resourceId: id,
        state: "queued",
        createdAt: now,
        ...customerEventFields(() =>
          customerEvent(
            "payment_confirmed",
            {
              ownerId: uid,
              entityId: id,
              entityVersion: checkout.version + 1,
              occurredAt: now,
              ...(balanceOrder ? { orderId: currentOrder!.id } : {}),
            },
            {
              orderRef:
                checkout.lines.length === 1
                  ? checkout.lines[0].orderId
                  : `${checkout.lines.length} đơn · ${id}`,
              paidAmount: checkout.total,
              paymentScope: balanceOrder
                ? checkout.balanceReason === "sourcing"
                  ? "sourcing_difference"
                  : "final_balance"
                : checkout.orders.every(
                      (order) => order.purchaseKind === "catalog",
                    )
                  ? "catalog_full"
                  : checkout.orders.every(
                        (order) => order.purchaseKind === "custom",
                      )
                    ? "custom_initial"
                    : "mixed_checkout",
            },
          ),
        ),
      });
      tx.create(db.doc(`purchaseReceiptJobs/${receiptId}`), {
        ownerId: uid,
        receiptId,
        state: "queued",
        attempts: 0,
        createdAt: now,
      });
      tx.update(ref, {
        state: "paid",
        paidAt,
        paymentReference: reference,
        receiptId,
        version: checkout.version + 1,
      });
      if (!balanceOrder)
        tx.update(cartDoc.ref, {
          items: cart.items.filter(
            (item) =>
              !checkout.lines.some((line) => line.lineId === item.lineId),
          ),
          activeCheckoutId: null,
          revision: cart.revision + 1,
          updatedAt: now,
        });
      tx.create(db.collection("auditEvents").doc(), {
        action: "purchasePaymentVerified",
        actor: proof ? "sepay-sandbox-adapter" : "demo-payment-adapter",
        resourceId: id,
        createdAt: now,
      });
      return { id, state: "paid", receiptId };
    }),
  );
}
