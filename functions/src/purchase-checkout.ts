import { createHash, randomUUID } from "node:crypto";
import { getFirestore, type Transaction } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { z } from "zod";
import {
  cartSchema,
  mergeCart,
  type CartItem,
  type Cart,
} from "../../packages/domain/cart";
import {
  buildCheckout,
  assertVerifiedPayment,
  researchedRequestSchema,
  checkoutRecipientSchema,
  checkoutPolicySchema,
  type ResearchedRequest,
  type CheckoutSnapshot,
  type PurchaseCheckout,
} from "../../packages/domain/purchase-checkout";
import {
  shippingQuoteInputSchema,
  shippingRateConfigSchema,
  calculateShippingRate,
  vietCargoReferenceRates,
} from "../../packages/domain/shipping-rates";
import { normalizeCustomerName } from "../../packages/domain/crm";
import { requireVerifiedGoogle } from "./auth/guards";
import { purchaseBalanceTarget } from "./purchase-adjustment";
import { type Order } from "../../packages/domain";

const options = {
  region: "asia-southeast1",
  maxInstances: 3,
  concurrency: 10,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const opId = z.string().uuid();
const inputSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("addRequest"),
      operationId: opId,
      expectedRevision: z.number().int().nonnegative(),
      request: researchedRequestSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("preview"),
      operationId: opId,
      expectedRevision: z.number().int().nonnegative(),
      recipient: checkoutRecipientSchema,
      shipping: shippingQuoteInputSchema.optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal("commit"),
      operationId: opId,
      previewId: opId,
      previewHash: z.string().regex(/^[a-f0-9]{64}$/),
      confirmed: z.literal(true),
    })
    .strict(),
  z.object({ action: z.literal("status"), id: opId }).strict(),
]);

export function purchaseDemoEnvironment(db = getFirestore()) {
  let config: { projectId?: string } = {};
  try {
    config = JSON.parse(process.env.FIREBASE_CONFIG ?? "{}");
  } catch {
    return false;
  }
  return (
    process.env.FUNCTIONS_EMULATOR === "true" &&
    process.env.GCLOUD_PROJECT === "demo-satsunicgo" &&
    config.projectId === "demo-satsunicgo" &&
    (db as unknown as { projectId: string }).projectId === "demo-satsunicgo" &&
    /^(?:127\.0\.0\.1|localhost):18207$/.test(
      process.env.FIRESTORE_EMULATOR_HOST ?? "",
    )
  );
}
async function unlocked(tx: Transaction, uid: string) {
  const db = getFirestore();
  const [user, access] = await Promise.all([
    tx.get(db.doc(`users/${uid}`)),
    tx.get(db.doc(`staffAccess/${uid}`)),
  ]);
  if (user.data()?.locked || access.data()?.locked)
    throw new HttpsError(
      "permission-denied",
      "Tài khoản chưa thể tiếp tục mua hàng.",
    );
  return user;
}
async function dependencies(tx: Transaction, uid: string) {
  const db = getFirestore();
  const [stored, policy, tariff, regions] = await Promise.all([
    tx.get(db.doc(`carts/${uid}`)),
    tx.get(db.doc("settings/upfrontCheckout")),
    tx.get(db.doc("shippingRatePublic/current")),
    tx.get(db.doc("settings/purchaseRegions")),
  ]);
  const cart: Cart = stored.exists
    ? cartSchema.parse(stored.data())
    : { ownerId: uid, revision: 0, updatedAt: 0, items: [] };
  if (cart.ownerId !== uid)
    throw new HttpsError("permission-denied", "Chưa mở được giỏ.");
  const productIds = [
      ...new Set(cart.items.filter((i) => !i.kind).map((i) => i.productId)),
    ],
    draftIds = [
      ...new Set(
        cart.items.flatMap((i) => (i.custom ? [i.custom.draftId] : [])),
      ),
    ];
  const [products, drafts] = await Promise.all([
    Promise.all(productIds.map((id) => tx.get(db.doc(`products/${id}`)))),
    Promise.all(draftIds.map((id) => tx.get(db.doc(`purchaseDrafts/${id}`)))),
  ]);
  if (
    drafts.some((d) =>
      (d.data()?.images ?? []).some(
        (i: { state: string }) => i.state !== "ready",
      ),
    )
  )
    throw new HttpsError(
      "failed-precondition",
      "Ảnh món đang tải. Hoàn tất tải ảnh trước khi xem tổng quan.",
    );
  return {
    cart,
    policy: policy.data(),
    tariff: tariff.data(),
    regions: regions.data(),
    products: Object.fromEntries(
      products.map((p, i) => [productIds[i], p.data()]),
    ),
    drafts: Object.fromEntries(
      drafts.map((d, i) => [
        draftIds[i],
        { ...d.data()?.request, ownerId: d.data()?.ownerId },
      ]),
    ) as Record<string, ResearchedRequest & { ownerId: string }>,
  };
}
function shippingSnapshot(
  dep: Awaited<ReturnType<typeof dependencies>>,
  input?: z.infer<typeof shippingQuoteInputSchema>,
): CheckoutSnapshot["shipping"] {
  if (dep.cart.items.some((i) => i.custom && i.custom.market !== "US"))
    return { state: "quote_required" };
  if (!input) return { state: "unknown" };
  const published = shippingRateConfigSchema.safeParse(dep.tariff?.config);
  const reference = purchaseDemoEnvironment() && !dep.tariff;
  if (dep.tariff?.disabled || (!published.success && !reference))
    return { state: "unavailable" };
  const config = published.success ? published.data : vietCargoReferenceRates;
  const quote = calculateShippingRate(config, input);
  if (quote.status !== "estimate" || quote.currency !== "USD")
    return { state: "quote_required" };
  return {
    state: reference ? "reference" : "estimate",
    amountUsdMinor: quote.freightMinor,
    basis: JSON.stringify(input),
    version: dep.tariff?.version ?? null,
  };
}
function recipientFromDirectory(
  dep: Awaited<ReturnType<typeof dependencies>>,
  raw: z.infer<typeof checkoutRecipientSchema>,
) {
  const province = (
    dep.regions?.provinces as
      | {
          code: string;
          name: string;
          communes: { code: string; name: string }[];
        }[]
      | undefined
  )?.find((p) => p.code === raw.provinceCode);
  const commune = province?.communes.find((c) => c.code === raw.communeCode);
  if (!province || !commune)
    throw new HttpsError(
      "failed-precondition",
      "Chọn lại tỉnh/thành và phường/xã trong danh mục hiện hành.",
    );
  return { ...raw, province: province.name, commune: commune.name };
}
export const purchaseCheckout = onCall(options, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    parsed = inputSchema.safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError(
      "invalid-argument",
      "Kiểm tra món, giá và thông tin nhận hàng.",
    );
  const input = parsed.data,
    db = getFirestore(),
    now = Date.now();
  try {
    return await db.runTransaction(async (tx) => {
      await unlocked(tx, uid);
      if (input.action === "status") {
        const row = await tx.get(db.doc(`purchaseCheckouts/${input.id}`));
        if (!row.exists || row.data()?.ownerId !== uid)
          throw new HttpsError("permission-denied", "Chưa mở được thanh toán.");
        const { orders, hash: storedHash, ...visible } = row.data()!;
        void orders;
        void storedHash;
        return visible;
      }
      const operation = db.doc(
          `idempotencyKeys/purchase-${uid}-${input.operationId}`,
        ),
        previous = await tx.get(operation),
        inputHash = hash(input);
      if (previous.exists) {
        if (previous.data()?.hash !== inputHash)
          throw new HttpsError(
            "already-exists",
            "Mã thao tác đã dùng cho nội dung khác.",
          );
        return previous.data()?.result;
      }
      if (input.action === "addRequest") {
        const ref = db.doc(`carts/${uid}`);
        const [stored, pricing] = await Promise.all([
          tx.get(ref),
          tx.get(db.doc("settings/upfrontCheckout")),
        ]);
        const policy = checkoutPolicySchema.parse(pricing.data());
        if (policy.effectiveFrom > now || policy.expiresAt <= now)
          throw new HttpsError(
            "failed-precondition",
            "Giá mua hộ đang chờ cập nhật. Nội dung của bạn được giữ lại.",
          );
        const cart: Cart = stored.exists
          ? cartSchema.parse(stored.data())
          : { ownerId: uid, revision: 0, updatedAt: 0, items: [] };
        if (cart.activeCheckoutId)
          throw new HttpsError(
            "failed-precondition",
            "Giỏ đang có thanh toán chờ. Tiếp tục lần đó trước khi thêm món.",
          );
        if (cart.revision !== input.expectedRevision)
          throw new HttpsError(
            "aborted",
            "Giỏ đã thay đổi. Tải lại trước khi thêm.",
          );
        const draftId = randomUUID();
        const rate =
          policy.rates[
            input.request.market === "US"
              ? "USD"
              : input.request.market === "JP"
                ? "JPY"
                : "KRW"
          ];
        const incoming: CartItem[] = input.request.items.map(
          (row, itemIndex) => ({
            lineId: randomUUID(),
            productId: draftId,
            variant: row.variant,
            quantity: row.quantity,
            kind: "custom",
            custom: {
              draftId,
              itemIndex,
              name: row.name,
              market: input.request.market,
              unitSourceMinor: row.unitSourceMinor,
              fxNumerator: rate.numerator,
              fxDenominator: rate.denominator,
              serviceBps: policy.serviceBps,
            },
          }),
        );
        const items = mergeCart(cart.items, incoming);
        const result = {
          id: draftId,
          cart: { ...cart, items, revision: cart.revision + 1, updatedAt: now },
        };
        tx.create(db.doc(`purchaseDrafts/${draftId}`), {
          ownerId: uid,
          request: input.request,
          version: 1,
          createdAt: now,
        });
        tx.set(ref, result.cart);
        tx.create(operation, { hash: inputHash, result, createdAt: now });
        return result;
      }
      const dep = await dependencies(tx, uid);
      if (dep.cart.activeCheckoutId)
        throw new HttpsError(
          "failed-precondition",
          "Giỏ đang có thanh toán chờ xác minh.",
          { checkoutId: dep.cart.activeCheckoutId },
        );
      if (input.action === "preview") {
        if (dep.cart.revision !== input.expectedRevision)
          throw new HttpsError("aborted", "Giỏ đã thay đổi. Xem lại giỏ.");
        const id = randomUUID(),
          built = buildCheckout({
            id,
            ownerId: uid,
            now,
            revision: dep.cart.revision,
            items: dep.cart.items,
            products: dep.products,
            drafts: dep.drafts,
            policy: dep.policy,
            recipient: recipientFromDirectory(dep, input.recipient),
            orderIds: dep.cart.items.map(() => randomUUID()),
            shipping: shippingSnapshot(dep, input.shipping),
          });
        const previewHash = hash(built.snapshot),
          result = { ...built.snapshot, previewHash };
        tx.create(db.doc(`purchasePreviews/${id}`), {
          ...result,
          orders: built.orders,
        });
        tx.create(operation, { hash: inputHash, result, createdAt: now });
        return result;
      }
      const stored = await tx.get(
          db.doc(`purchasePreviews/${input.previewId}`),
        ),
        p = stored.data();
      if (!p || p.ownerId !== uid || p.previewHash !== input.previewHash)
        throw new HttpsError(
          "permission-denied",
          "Chưa xác nhận được tổng quan đã duyệt.",
        );
      if (p.expiresAt <= now || p.cartRevision !== dep.cart.revision)
        throw new HttpsError(
          "aborted",
          "Tổng quan đã hết hạn hoặc giỏ đã thay đổi. Xem lại trước khi thanh toán.",
        );
      const built = buildCheckout({
        id: p.id,
        ownerId: uid,
        now: p.createdAt,
        revision: dep.cart.revision,
        items: dep.cart.items,
        products: dep.products,
        drafts: dep.drafts,
        policy: dep.policy,
        recipient: recipientFromDirectory(dep, p.recipient),
        orderIds: p.lines.map((l: { orderId: string }) => l.orderId),
        shipping: shippingSnapshot(
          dep,
          p.shipping.basis
            ? shippingQuoteInputSchema.parse(JSON.parse(p.shipping.basis))
            : undefined,
        ),
      });
      if (
        hash(built.snapshot) !== input.previewHash ||
        dep.policy!.expiresAt <= now
      )
        throw new HttpsError(
          "aborted",
          "Giá hoặc điều khoản đã thay đổi. Xem tổng quan mới.",
        );
      const demo = await tx.get(db.doc("settings/purchaseDemo"));
      const provider =
        purchaseDemoEnvironment(db) && demo.data()?.enabled === true
          ? "demo"
          : "payos_unavailable";
      if (provider !== "demo")
        throw new HttpsError(
          "failed-precondition",
          "Kênh thanh toán đang chờ thiết lập. Giỏ và thông tin của bạn được giữ lại.",
        );
      const { previewHash, ...snapshot } = p;
      void previewHash;
      const checkout = {
        ...snapshot,
        state: "pending",
        provider,
        version: 1,
        hash: input.previewHash,
      };
      tx.create(db.doc(`purchaseCheckouts/${p.id}`), checkout);
      tx.update(db.doc(`carts/${uid}`), {
        activeCheckoutId: p.id,
        revision: dep.cart.revision + 1,
        updatedAt: now,
      });
      const result = { id: p.id, state: "pending", total: p.total, provider };
      tx.create(operation, { hash: inputHash, result, createdAt: now });
      return result;
    });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      "failed-precondition",
      "Giỏ, giá hoặc cấu hình đang cần kiểm tra. Tải lại tổng quan rồi thử lại.",
    );
  }
});

// Only exported by the Functions entry point in the explicitly guarded emulator.
export const purchaseDemoPayment = onCall(options, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    db = getFirestore();
  if (!purchaseDemoEnvironment(db))
    throw new HttpsError(
      "permission-denied",
      "Thanh toán demo không khả dụng.",
    );
  const parsed = z
    .object({
      id: opId,
      outcome: z.enum(["pending", "unknown", "paid", "cancelled"]),
    })
    .strict()
    .safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Trạng thái demo không hợp lệ.");
  const { id, outcome } = parsed.data,
    ref = db.doc(`purchaseCheckouts/${id}`),
    reference = `DEMO-${id}`;
  return db.runTransaction(async (tx) => {
    const profile = await unlocked(tx, uid);
    const [stored, demo, cartDoc, received] = await Promise.all([
      tx.get(ref),
      tx.get(db.doc("settings/purchaseDemo")),
      tx.get(db.doc(`carts/${uid}`)),
      tx.get(db.doc(`purchasePaymentEvidence/${reference}`)),
    ]);
    const checkout = stored.data() as
      (PurchaseCheckout & { orders: Order[] }) | undefined;
    if (
      !checkout ||
      checkout.ownerId !== uid ||
      demo.data()?.enabled !== true ||
      checkout.provider !== "demo"
    )
      throw new HttpsError(
        "permission-denied",
        "Chưa mở được thanh toán demo.",
      );
    if (checkout.state === "paid")
      return { id, state: "paid", receiptId: checkout.receiptId };
    if (checkout.state === "cancelled" || checkout.state === "review_required")
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
    assertVerifiedPayment(
      checkout,
      {
        provider: "demo",
        merchant: "demo-satsunicgo",
        reference,
        currency: "VND",
        amount: checkout.total,
      },
      "demo-satsunicgo",
    );
    if (received.exists)
      throw new HttpsError(
        "failed-precondition",
        "Khoản này đang cần đối chiếu.",
      );
    const cart = cartSchema.parse(cartDoc.data());
    if (!balanceOrder && cart.activeCheckoutId !== id)
      throw new HttpsError(
        "failed-precondition",
        "Giỏ chưa khớp lượt thanh toán.",
      );
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
      receiptId = id;
    const currentOrder = balanceOrder?.data() as Order | undefined;
    let currentTarget: ReturnType<typeof purchaseBalanceTarget> | null = null;
    try {
      if (currentOrder) currentTarget = purchaseBalanceTarget(currentOrder);
    } catch {
      /* verified money goes to review */
    }
    if (
      balanceOrder &&
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
        ) !== checkout.total)
    ) {
      tx.create(db.doc(`purchasePaymentEvidence/${reference}`), {
        checkoutId: id,
        provider: "demo",
        merchant: "demo-satsunicgo",
        currency: "VND",
        amount: checkout.total,
        reference,
        verifiedAt: now,
        allocationState: "review_required",
      });
      tx.update(ref, {
        state: "review_required",
        version: checkout.version + 1,
      });
      if (balanceOrder.exists)
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
        typeof req.auth?.token.name === "string"
          ? req.auth.token.name.slice(0, 120)
          : "";
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
      provider: "demo",
      merchant: "demo-satsunicgo",
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
      if (!balanceOrder)
        tx.create(db.doc(`orderRecipients/${order.id}`), {
          ownerId: uid,
          recipient: checkout.recipient.recipient,
          phone: checkout.recipient.phone,
          address: [
            checkout.recipient.street,
            checkout.recipient.commune,
            checkout.recipient.province,
            "Việt Nam",
          ].join(", "),
          checkoutId: id,
          version: 1,
        });
      tx.create(db.doc(`financialEntries/purchase-${id}-${order.id}`), {
        orderId: order.id,
        ownerId: uid,
        checkoutId: id,
        kind: "payment",
        purpose: balanceOrder ? "balance" : "full",
        amount: line.total,
        reference,
        provider: "demo",
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
      ownerEmail:
        typeof req.auth?.token.email === "string" ? req.auth.token.email : null,
      checkoutId: id,
      lines: checkout.lines,
      total: checkout.total,
      currency: "VND",
      provider: "demo",
      reference,
      paidAt: now,
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
        paidAt: now,
      }),
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
      paidAt: now,
      paymentReference: reference,
      receiptId,
      version: checkout.version + 1,
    });
    if (!balanceOrder)
      tx.update(cartDoc.ref, {
        items: cart.items.filter(
          (item) => !checkout.lines.some((line) => line.lineId === item.lineId),
        ),
        activeCheckoutId: null,
        revision: cart.revision + 1,
        updatedAt: now,
      });
    tx.create(db.collection("auditEvents").doc(), {
      action: "purchasePaymentVerified",
      actor: "demo-payment-adapter",
      resourceId: id,
      createdAt: now,
    });
    return { id, state: "paid", receiptId };
  });
});

export const purchaseBalanceCheckout = onCall(options, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    db = getFirestore(),
    now = Date.now();
  const parsed = z
    .discriminatedUnion("action", [
      z
        .object({
          action: z.literal("preview"),
          operationId: opId,
          orderId: opId,
          expectedVersion: z.number().int().positive(),
        })
        .strict(),
      z
        .object({
          action: z.literal("commit"),
          operationId: opId,
          previewId: opId,
          previewHash: z.string().regex(/^[a-f0-9]{64}$/),
          confirmed: z.literal(true),
        })
        .strict(),
    ])
    .safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Kiểm tra khoản trả thêm.");
  const input = parsed.data;
  return db.runTransaction(async (tx) => {
    await unlocked(tx, uid);
    const op = db.doc(`idempotencyKeys/balance-${uid}-${input.operationId}`),
      previous = await tx.get(op),
      inputHash = hash(input);
    if (previous.exists) {
      if (previous.data()?.hash !== inputHash)
        throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
      return previous.data()?.result;
    }
    const preview =
      input.action === "commit"
        ? (await tx.get(db.doc(`purchasePreviews/${input.previewId}`))).data()
        : undefined;
    if (
      input.action === "commit" &&
      (!preview ||
        preview.ownerId !== uid ||
        preview.previewHash !== input.previewHash ||
        preview.purpose !== "balance")
    )
      throw new HttpsError(
        "permission-denied",
        "Chưa mở được tổng quan trả thêm.",
      );
    const orderId =
      input.action === "preview" ? input.orderId : preview!.sourceOrderId;
    const [stored, demo] = await Promise.all([
      tx.get(db.doc(`orders/${orderId}`)),
      tx.get(db.doc("settings/purchaseDemo")),
    ]);
    const order = stored.data() as Order | undefined;
    if (!order || order.ownerId !== uid || !order.upfront || !order.checkoutId)
      throw new HttpsError("permission-denied", "Chưa mở được khoản trả thêm.");
    if (order.balanceCheckoutId)
      throw new HttpsError(
        "failed-precondition",
        "Khoản này đang chờ xác minh.",
        { checkoutId: order.balanceCheckoutId },
      );
    if (order.hold || order.refundReserved)
      throw new HttpsError(
        "failed-precondition",
        "Chi phí cuối cần được duyệt trước khi thanh toán thêm.",
      );
    const target = purchaseBalanceTarget(order);
    const due = Math.max(0, target.total - order.collected + order.refunded);
    if (!due)
      throw new HttpsError(
        "failed-precondition",
        "Đơn không còn khoản phải trả thêm.",
      );
    if (input.action === "preview") {
      if (order.version !== input.expectedVersion)
        throw new HttpsError("aborted", "Chi phí đã đổi. Xem lại đơn.");
      const original = (
        await tx.get(db.doc(`purchaseCheckouts/${order.checkoutId}`))
      ).data() as PurchaseCheckout | undefined;
      if (!original || original.ownerId !== uid || original.state !== "paid")
        throw new HttpsError(
          "failed-precondition",
          "Thanh toán ban đầu chưa được xác minh.",
        );
      const line = original.lines.find((l) => l.orderId === orderId);
      if (!line)
        throw new HttpsError("failed-precondition", "Chưa khớp phân bổ đơn.");
      const id = randomUUID();
      const snapshot: CheckoutSnapshot = {
        id,
        ownerId: uid,
        version: 1,
        cartRevision: 0,
        policyVersion: order.upfront.policyVersion,
        createdAt: now,
        expiresAt: now + 600000,
        currency: "VND",
        lines: [
          {
            ...line,
            name: `Bổ sung chi phí · ${line.name}`,
            goods: due,
            service: 0,
            total: due,
          },
        ],
        total: due,
        listed: 0,
        goods: due,
        service: 0,
        recipient: original.recipient,
        shipping: {
          state:
            target.reason === "sourcing"
              ? "uncollected"
              : "included_in_approved_final",
        },
        purpose: "balance",
        balanceReason: target.reason,
        sourceOrderId: orderId,
        sourceOrderVersion: order.version,
        previouslyPaid: order.collected - order.refunded,
        finalTotal: target.total,
      };
      const previewHash = hash(snapshot),
        result = { ...snapshot, previewHash };
      tx.create(db.doc(`purchasePreviews/${id}`), {
        ...result,
        orders: [order],
      });
      tx.create(op, { hash: inputHash, result, createdAt: now });
      return result;
    }
    if (
      preview!.expiresAt <= now ||
      preview!.sourceOrderVersion !== order.version ||
      preview!.total !== due ||
      preview!.finalTotal !== target.total ||
      preview!.balanceReason !== target.reason
    )
      throw new HttpsError(
        "aborted",
        "Chi phí hoặc tổng quan đã thay đổi. Xem lại trước khi thanh toán.",
      );
    if (!purchaseDemoEnvironment(db) || demo.data()?.enabled !== true)
      throw new HttpsError(
        "failed-precondition",
        "Kênh thanh toán đang chờ thiết lập.",
      );
    const { previewHash, ...snapshot } = preview!;
    void previewHash;
    tx.create(db.doc(`purchaseCheckouts/${preview!.id}`), {
      ...snapshot,
      state: "pending",
      provider: "demo",
      hash: input.previewHash,
    });
    tx.update(stored.ref, {
      balanceCheckoutId: preview!.id,
      version: order.version + 1,
    });
    const result = {
      id: preview!.id,
      state: "pending",
      total: due,
      provider: "demo",
    };
    tx.create(op, { hash: inputHash, result, createdAt: now });
    return result;
  });
});

export const purchaseCheckoutSetup = onCall(options, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    db = getFirestore();
  return db.runTransaction(async (tx) => {
    await unlocked(tx, uid);
    const [regions, policy, tariff] = await Promise.all([
      tx.get(db.doc("settings/purchaseRegions")),
      tx.get(db.doc("settings/upfrontCheckout")),
      tx.get(db.doc("shippingRatePublic/current")),
    ]);
    const parsed = checkoutPolicySchema.safeParse(policy.data()),
      now = Date.now(),
      rate = shippingRateConfigSchema.safeParse(tariff.data()?.config),
      reference = !tariff.exists && purchaseDemoEnvironment(db);
    return {
      regions: regions.data()?.provinces ?? [],
      pricing:
        parsed.success &&
        parsed.data.effectiveFrom <= now &&
        parsed.data.expiresAt > now
          ? parsed.data
          : null,
      shipping: tariff.data()?.disabled
        ? null
        : rate.success
          ? rate.data
          : reference
            ? vietCargoReferenceRates
            : null,
      shippingOrigin: tariff.data()?.disabled
        ? "unavailable"
        : rate.success
          ? "published"
          : reference
            ? "reference"
            : "unavailable",
    };
  });
});
export const purchaseOrderRead = onCall(options, async (req) => {
  const uid = requireVerifiedGoogle(req.auth),
    db = getFirestore(),
    id = opId.safeParse(req.data?.orderId);
  if (!id.success)
    throw new HttpsError("invalid-argument", "Mã đơn chưa hợp lệ.");
  return db.runTransaction(async (tx) => {
    await unlocked(tx, uid);
    const order = await tx.get(db.doc(`orders/${id.data}`));
    if (order.data()?.ownerId !== uid)
      throw new HttpsError("permission-denied", "Chưa mở được đơn.");
    return {
      version: order.data()!.version,
      balanceCheckoutId: order.data()!.balanceCheckoutId ?? null,
    };
  });
});
