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
  researchedRequestSchema,
  checkoutRecipientSchema,
  checkoutPolicySchema,
  type ResearchedRequest,
  type CheckoutSnapshot,
  type PurchaseCheckout,
  purchaseExecutionProvenance,
} from "../../packages/domain/purchase-checkout";
import {
  shippingQuoteInputSchema,
  shippingRateConfigSchema,
  calculateShippingRate,
  vietCargoReferenceRates,
} from "../../packages/domain/shipping-rates";
import { requireVerifiedGoogle } from "./auth/guards";
import { purchaseBalanceTarget } from "./purchase-adjustment";
import { type Order } from "../../packages/domain";
import { withPurchaseMutation } from "./purchase-mutation-queue";
import { purchaseDemoEnvironment } from "./purchase-environment";
import { applyDemoSettlement } from "./purchase-settlement";
import {
  paymentMethodSchema,
  paymentCapabilities,
} from "../../packages/domain/purchase-sepay";
import { sandboxPaymentReady, sepaySecrets } from "./payments/sepay-sandbox";
import {
  productionTestEnvironment,
  admitProductionTestPolicy,
  productionTestProvenance,
} from "./production-test-policy";

const options = {
  region: "asia-southeast1",
  maxInstances: 3,
  concurrency: 10,
  secrets: sepaySecrets,
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
      paymentMethod: paymentMethodSchema.optional(),
    })
    .strict(),
  z.object({ action: z.literal("status"), id: opId }).strict(),
]);

export { purchaseDemoEnvironment } from "./purchase-environment";
async function unlocked(tx: Transaction, uid: string) {
  const db = getFirestore();
  const [user, access] = await tx.getAll(
    db.doc(`users/${uid}`),
    db.doc(`staffAccess/${uid}`),
  );
  if (user.data()?.locked || access.data()?.locked)
    throw new HttpsError(
      "permission-denied",
      "Tài khoản chưa thể tiếp tục mua hàng.",
    );
  return user;
}
async function dependencies(tx: Transaction, uid: string) {
  const db = getFirestore();
  const [stored, policy, tariff, regions, testPolicy] = await tx.getAll(
    db.doc(`carts/${uid}`),
    db.doc("settings/upfrontCheckout"),
    db.doc("shippingRatePublic/current"),
    db.doc("settings/purchaseRegions"),
    db.doc("settings/productionTest"),
  );
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
  const refs = [
    ...productIds.map((id) => db.doc(`products/${id}`)),
    ...draftIds.map((id) => db.doc(`purchaseDrafts/${id}`)),
  ];
  const rows = refs.length ? await tx.getAll(...refs) : [];
  const products = rows.slice(0, productIds.length),
    drafts = rows.slice(productIds.length);
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
    testPolicy: productionTestEnvironment(db)
      ? admitProductionTestPolicy(testPolicy.data(), uid)
      : null,
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
    return await withPurchaseMutation(`cart-${uid}`, () =>
      db.runTransaction(async (tx) => {
        await unlocked(tx, uid);
        if (input.action === "status") {
          const row = await tx.get(db.doc(`purchaseCheckouts/${input.id}`));
          if (!row.exists || row.data()?.ownerId !== uid)
            throw new HttpsError(
              "permission-denied",
              "Chưa mở được thanh toán.",
            );
          const {
            orders,
            hash: storedHash,
            receiptEmail,
            ...visible
          } = row.data()!;
          void receiptEmail;
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
          const [stored, pricing] = await tx.getAll(
            ref,
            db.doc("settings/upfrontCheckout"),
          );
          const policy = checkoutPolicySchema.parse(pricing.data());
          if (policy.effectiveFrom > now || policy.expiresAt <= now)
            throw new HttpsError(
              "failed-precondition",
              "Giá mua hộ đang chờ cập nhật. Nội dung của bạn được giữ lại.",
            );
          const cart: Cart = stored.exists
            ? cartSchema.parse(stored.data())
            : { ownerId: uid, revision: 0, updatedAt: 0, items: [] };
          if (cart.ownerId !== uid)
            throw new HttpsError("permission-denied", "Chưa mở được giỏ.");
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
            cart: {
              ...cart,
              items,
              revision: cart.revision + 1,
              updatedAt: now,
            },
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
          if (productionTestEnvironment(db)) {
            if (!dep.testPolicy)
              throw new HttpsError(
                "failed-precondition",
                "Kênh thử chưa khả dụng.",
              );
            Object.assign(
              built.snapshot,
              productionTestProvenance(dep.testPolicy, id),
            );
          }
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
        const provenance = purchaseExecutionProvenance(p);
        if (productionTestEnvironment(db)) {
          if (
            !provenance ||
            !dep.testPolicy ||
            provenance.executionPolicyVersion !== dep.testPolicy.version
          )
            throw new HttpsError(
              "failed-precondition",
              "Kênh thử chưa khả dụng.",
            );
          Object.assign(built.snapshot, provenance);
        } else if (provenance) {
          throw new HttpsError("permission-denied", "Kênh thử chưa khả dụng.");
        }
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
          sandboxPaymentReady() &&
          (!productionTestEnvironment(db) || !!dep.testPolicy)
            ? "sepay_sandbox"
            : purchaseDemoEnvironment(db) && demo.data()?.enabled === true
              ? "demo"
              : "payos_unavailable";
        if (
          provider === "payos_unavailable" ||
          (input.paymentMethod && input.paymentMethod !== "BANK_TRANSFER") ||
          (provider === "sepay_sandbox" &&
            input.paymentMethod !== "BANK_TRANSFER")
        )
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
          paymentMethod: "BANK_TRANSFER",
          receiptEmail:
            typeof req.auth!.token.email === "string"
              ? req.auth!.token.email
              : null,
          version: 1,
          hash: input.previewHash,
        };
        tx.create(db.doc(`purchaseCheckouts/${p.id}`), checkout);
        tx.update(db.doc(`carts/${uid}`), {
          activeCheckoutId: p.id,
          revision: dep.cart.revision + 1,
          updatedAt: now,
        });
        const result = {
          id: p.id,
          state: "pending",
          total: p.total,
          provider,
          paymentMethod: "BANK_TRANSFER",
          ...(provenance ?? {}),
        };
        tx.create(operation, { hash: inputHash, result, createdAt: now });
        return result;
      }),
    );
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
  if (req.data?.action)
    return (
      await import("./purchase-demo-gateway.js")
    ).handlePurchaseDemoGateway(req);
  const parsed = z
    .object({
      id: opId,
      outcome: z.enum(["pending", "unknown", "paid", "cancelled"]),
    })
    .strict()
    .safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Trạng thái demo không hợp lệ.");
  return applyPurchaseDemoOutcome({
    ...parsed.data,
    uid,
    token: req.auth!.token,
  });
});

/** Demo entry point retains its exact environment and persisted-link guards. */
export const applyPurchaseDemoOutcome = applyDemoSettlement;

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
          paymentMethod: paymentMethodSchema.optional(),
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
    const [stored, demo, testPolicyDoc] = await Promise.all([
      tx.get(db.doc(`orders/${orderId}`)),
      tx.get(db.doc("settings/purchaseDemo")),
      tx.get(db.doc("settings/productionTest")),
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
    const testPolicy = productionTestEnvironment(db)
      ? admitProductionTestPolicy(testPolicyDoc.data(), uid)
      : null;
    const orderProvenance = purchaseExecutionProvenance(order);
    if (productionTestEnvironment(db) && (!testPolicy || !orderProvenance))
      throw new HttpsError("failed-precondition", "Kênh thử chưa khả dụng.");
    if (orderProvenance && !productionTestEnvironment(db))
      throw new HttpsError("permission-denied", "Kênh thử chưa khả dụng.");
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
      const originalProvenance = purchaseExecutionProvenance(original);
      if (
        productionTestEnvironment(db) &&
        (!originalProvenance ||
          !orderProvenance ||
          original.provider !== "sepay_sandbox" ||
          JSON.stringify(originalProvenance) !==
            JSON.stringify(orderProvenance))
      )
        throw new HttpsError("failed-precondition", "Chưa khớp phân bổ đơn.");
      const line = original.lines.find((l) => l.orderId === orderId);
      if (!line)
        throw new HttpsError("failed-precondition", "Chưa khớp phân bổ đơn.");
      const id = randomUUID();
      const snapshot: CheckoutSnapshot = {
        ...(orderProvenance ?? {}),
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
    const provenance = purchaseExecutionProvenance(preview);
    if (
      productionTestEnvironment(db) &&
      (!provenance ||
        !testPolicy ||
        JSON.stringify(provenance) !== JSON.stringify(orderProvenance))
    )
      throw new HttpsError("failed-precondition", "Kênh thử chưa khả dụng.");
    const provider =
      sandboxPaymentReady() && (!productionTestEnvironment(db) || !!testPolicy)
        ? "sepay_sandbox"
        : purchaseDemoEnvironment(db) && demo.data()?.enabled === true
          ? "demo"
          : "payos_unavailable";
    if (
      provider === "payos_unavailable" ||
      (input.paymentMethod && input.paymentMethod !== "BANK_TRANSFER") ||
      (provider === "sepay_sandbox" && input.paymentMethod !== "BANK_TRANSFER")
    )
      throw new HttpsError(
        "failed-precondition",
        "Kênh thanh toán đang chờ thiết lập.",
      );
    const { previewHash, ...snapshot } = preview!;
    void previewHash;
    tx.create(db.doc(`purchaseCheckouts/${preview!.id}`), {
      ...snapshot,
      state: "pending",
      provider,
      paymentMethod: "BANK_TRANSFER",
      receiptEmail:
        typeof req.auth!.token.email === "string"
          ? req.auth!.token.email
          : null,
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
      provider,
      paymentMethod: "BANK_TRANSFER",
      ...(provenance ?? {}),
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
    const [regions, policy, tariff, demo, testPolicyDoc] = await Promise.all([
      tx.get(db.doc("settings/purchaseRegions")),
      tx.get(db.doc("settings/upfrontCheckout")),
      tx.get(db.doc("shippingRatePublic/current")),
      tx.get(db.doc("settings/purchaseDemo")),
      tx.get(db.doc("settings/productionTest")),
    ]);
    const parsed = checkoutPolicySchema.safeParse(policy.data()),
      now = Date.now(),
      rate = shippingRateConfigSchema.safeParse(tariff.data()?.config),
      reference = !tariff.exists && purchaseDemoEnvironment(db),
      testPolicy = productionTestEnvironment(db)
        ? admitProductionTestPolicy(testPolicyDoc.data(), uid)
        : null;
    return {
      paymentCapabilities: paymentCapabilities(
        sandboxPaymentReady() &&
          (!productionTestEnvironment(db) || !!testPolicy)
          ? "sepay_sandbox"
          : purchaseDemoEnvironment(db) && demo.data()?.enabled === true
            ? "demo"
            : "unavailable",
      ),
      ...(testPolicy
        ? {
            executionMode: "production_test",
            executionPolicyVersion: testPolicy.version,
          }
        : {}),
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
