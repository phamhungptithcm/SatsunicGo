import { createHash, randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import {
  onCall,
  HttpsError,
  type CallableRequest,
} from "firebase-functions/v2/https";
import { z } from "zod";
import { cartSchema } from "../../packages/domain/cart";
import { catalogProductSchema } from "../../packages/domain/catalog-checkout";
import { buildCheckout } from "../../packages/domain/purchase-checkout";
import { withPurchaseMutation } from "./purchase-mutation-queue";
import { settleProductionDemoEvidence } from "./purchase-settlement";
import {
  assertDemoRecord,
  demoAuth,
  demoExecution,
  demoMfa,
  demoOwner,
  demoProvider,
  demoMerchant,
  demoSession,
  type DemoSession,
} from "./production-demo-policy";

const uuid = z.string().uuid();
const base = { runId: uuid };
const mutation = { ...base, operationId: uuid };
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("current") }).strict(),
  z.object({ action: z.literal("activate"), ...base }).strict(),
  z.object({ action: z.literal("disable"), ...base }).strict(),
  z.object({ action: z.literal("status"), ...base }).strict(),
  z.object({ action: z.literal("catalog"), ...base }).strict(),
  z
    .object({
      action: z.literal("select"),
      ...mutation,
      expectedRevision: z.number().int().nonnegative(),
      productId: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
      quantity: z.number().int().min(1).max(5),
      variant: z.string().max(200),
    })
    .strict(),
  z
    .object({
      action: z.literal("preview"),
      ...mutation,
      expectedRevision: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      action: z.literal("commit"),
      ...mutation,
      previewId: uuid,
      previewHash: z.string().regex(/^[a-f0-9]{64}$/),
      confirmed: z.literal(true),
    })
    .strict(),
  z
    .object({ action: z.literal("simulate"), ...base, checkoutId: uuid })
    .strict(),
  z
    .object({ action: z.literal("reconcile"), ...base, checkoutId: uuid })
    .strict(),
  z.object({ action: z.literal("cancel"), ...base, checkoutId: uuid }).strict(),
]);
const hash = (v: unknown) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
const demoOptions = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 4,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
function visibleCheckout(row: FirebaseFirestore.DocumentSnapshot) {
  const c = row.data()!;
  return {
    id: row.id,
    state: c.state,
    total: c.total,
    lines: c.lines,
    receiptId: c.receiptId ?? null,
  };
}
// Dedicated entry point: no external provider SDK, normal-cart writes or caller-supplied proof.
export async function handleProductionDemo(req: CallableRequest) {
  const uid = demoAuth(req),
    parsed = schema.safeParse(req.data),
    db = getFirestore();
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Kiểm tra lại thông tin demo.");
  const d = parsed.data;
  if (d.action === "activate" || d.action === "disable") demoMfa(req);
  try {
    const result = await withPurchaseMutation(`production-demo-${uid}`, () =>
      db.runTransaction(async (tx) => {
        await demoOwner(tx, uid);
        if (d.action === "current") {
          const pointer = await tx.get(db.doc(`productionDemoOwners/${uid}`));
          return { runId: pointer.data()?.runId ?? null };
        }
        const sessionRef = db.doc(`productionDemoSessions/${d.runId}`),
          cartRef = db.doc(`productionDemoCarts/${d.runId}`);
        if (d.action === "activate") {
          const pointerRef = db.doc(`productionDemoOwners/${uid}`);
          const [existing, pointer] = await tx.getAll(sessionRef, pointerRef);
          if (existing.exists) {
            const s = await demoSession(tx, d.runId, uid, false);
            return { runId: s.id, expiresAt: s.expiresAt };
          }
          if (pointer.data()?.runId) {
            const prior = await tx.get(
              db.doc(`productionDemoSessions/${pointer.data()!.runId}`),
            );
            if (prior.data()?.enabled && prior.data()!.expiresAt > Date.now())
              throw new HttpsError(
                "failed-precondition",
                "Bạn đã có phiên demo đang mở. Tiếp tục phiên đó trước.",
              );
          }
          const now = Date.now();
          const session: DemoSession = {
            id: d.runId,
            ownerId: uid,
            enabled: true,
            version: 1,
            createdAt: now,
            expiresAt: now + 4 * 3600000,
            checkoutIds: [],
            artifact: "production-demo-v1",
            revision: process.env.K_REVISION ?? "emulator",
          };
          tx.create(sessionRef, session);
          tx.set(pointerRef, { runId: d.runId });
          tx.create(cartRef, {
            ownerId: uid,
            revision: 0,
            updatedAt: now,
            items: [],
            ...demoExecution(session),
          });
          tx.create(db.doc(`auditEvents/production-demo-${d.runId}`), {
            action: "productionDemoActivated",
            actor: uid,
            resourceId: d.runId,
            ...demoExecution(session),
            createdAt: now,
          });
          return { runId: d.runId, expiresAt: session.expiresAt };
        }
        const s = await demoSession(
          tx,
          d.runId,
          uid,
          !["status", "reconcile", "disable"].includes(d.action),
        );
        if (d.action === "disable") {
          tx.update(sessionRef, { enabled: false });
          tx.set(db.doc(`auditEvents/production-demo-stop-${s.id}`), {
            action: "productionDemoDisabled",
            actor: uid,
            resourceId: s.id,
            ...demoExecution(s),
            createdAt: Date.now(),
          });
          return { disabled: true };
        }
        const cartDoc = await tx.get(cartRef),
          cart = cartSchema.parse(cartDoc.data());
        if (cart.ownerId !== uid)
          throw new HttpsError("permission-denied", "Không mở được giỏ demo.");
        if (d.action === "status") {
          const checkouts = s.checkoutIds.length
            ? await tx.getAll(
                ...s.checkoutIds.map((id) => db.doc(`purchaseCheckouts/${id}`)),
              )
            : [];
          const ids = checkouts.flatMap((c) =>
            (c.data()?.lines ?? []).map((l: { orderId: string }) => l.orderId),
          );
          const orders = ids.length
            ? await tx.getAll(...ids.map((id) => db.doc(`orders/${id}`)))
            : [];
          return {
            session: {
              id: s.id,
              enabled: s.enabled,
              expiresAt: s.expiresAt,
              checkoutCount: s.checkoutIds.length,
            },
            cart,
            checkouts: checkouts.filter((c) => c.exists).map(visibleCheckout),
            orders: orders
              .filter((o) => o.exists)
              .map((o) => ({
                id: o.id,
                stage: o.data()!.stage,
                version: o.data()!.version,
                items: o.data()!.items,
                tracking: o.data()!.tracking ?? null,
              })),
          };
        }
        if (d.action === "catalog") {
          const rows = await tx.get(
            db
              .collection("products")
              .where("status", "==", "published")
              .limit(30),
          );
          return {
            products: rows.docs.flatMap((row) => {
              const p = catalogProductSchema.safeParse(row.data());
              return p.success
                ? [
                    {
                      id: row.id,
                      title: p.data.title,
                      price: p.data.listedPrice,
                      options: p.data.catalogOptions,
                    },
                  ]
                : [];
            }),
          };
        }
        if (
          d.action === "simulate" ||
          d.action === "reconcile" ||
          d.action === "cancel"
        ) {
          if (!s.checkoutIds.includes(d.checkoutId))
            throw new HttpsError(
              "permission-denied",
              "Không mở được lượt demo.",
            );
          const c = await tx.get(db.doc(`purchaseCheckouts/${d.checkoutId}`));
          assertDemoRecord(c.data(), s);
          const proofRef = db.doc(`productionDemoEvidence/${d.checkoutId}`),
            proof = await tx.get(proofRef);
          if (d.action === "cancel") {
            if (
              proof.exists ||
              !["pending", "cancelled"].includes(c.data()!.state)
            )
              throw new HttpsError(
                "failed-precondition",
                "Lượt đã có kết quả mô phỏng. Kiểm tra cùng lượt trước khi tiếp tục.",
              );
            if (c.data()!.state === "cancelled") return { state: "cancelled" };
            tx.update(c.ref, {
              state: "cancelled",
              version: c.data()!.version + 1,
            });
            if (cart.activeCheckoutId === c.id)
              tx.update(cartRef, {
                activeCheckoutId: null,
                revision: cart.revision + 1,
                updatedAt: Date.now(),
              });
            tx.create(db.doc(`auditEvents/production-demo-cancel-${c.id}`), {
              ...demoExecution(s),
              action: "productionDemoCancelled",
              actor: uid,
              resourceId: c.id,
              createdAt: Date.now(),
            });
            return { state: "cancelled" };
          }
          if (proof.exists) return { settle: d.checkoutId };
          if (d.action === "reconcile") return { state: c.data()!.state };
          const simulatedAt = Date.now();
          if (
            c.data()!.state !== "pending" ||
            s.expiresAt <= simulatedAt ||
            c.data()!.expiresAt <= simulatedAt
          )
            throw new HttpsError(
              "failed-precondition",
              "Lượt demo đã hết hạn hoặc cần kiểm tra.",
            );
          tx.create(proofRef, {
            ...demoExecution(s),
            kind: "simulation",
            state: "verified",
            provider: demoProvider,
            merchant: demoMerchant,
            checkoutId: c.id,
            ownerId: uid,
            checkoutHash: c.data()!.hash,
            invoice: `DEMO-${c.id}`,
            providerOrderId: c.id,
            transactionId: c.id,
            reference: `PRODUCTION-DEMO-${c.id}`,
            currency: "VND",
            amount: c.data()!.total,
            expectedAmount: c.data()!.total,
            paidAt: simulatedAt,
            paymentMethod: "BANK_TRANSFER",
          });
          return { settle: c.id };
        }
        const opRef = db.doc(
            `productionDemoOperations/${s.id}-${d.operationId}`,
          ),
          prior = await tx.get(opRef),
          inputHash = hash(d);
        if (prior.exists) {
          if (prior.data()!.hash !== inputHash)
            throw new HttpsError("already-exists", "Mã thao tác đã được dùng.");
          return prior.data()!.result;
        }
        if (cart.activeCheckoutId)
          throw new HttpsError(
            "failed-precondition",
            "Hoàn tất hoặc kiểm tra lượt demo đang mở trước.",
          );
        let reply: Record<string, unknown>;
        if (d.action === "select") {
          if (cart.revision !== d.expectedRevision)
            throw new HttpsError(
              "aborted",
              "Giỏ demo đã thay đổi. Tải lại trước khi tiếp tục.",
            );
          const product = catalogProductSchema.parse(
            (await tx.get(db.doc(`products/${d.productId}`))).data(),
          );
          if (
            product.catalogOptions.length
              ? !product.catalogOptions.includes(d.variant)
              : d.variant !== ""
          )
            throw Error("INVALID_VARIANT");
          const next = {
            ownerId: uid,
            items: [
              {
                lineId: randomUUID(),
                productId: d.productId,
                quantity: d.quantity,
                variant: d.variant,
              },
            ],
            revision: cart.revision + 1,
            updatedAt: Date.now(),
            ...demoExecution(s),
          };
          tx.set(cartRef, next);
          reply = { revision: next.revision };
        } else if (d.action === "preview") {
          if (cart.revision !== d.expectedRevision)
            throw new HttpsError(
              "aborted",
              "Giỏ demo đã thay đổi. Tải lại trước khi tiếp tục.",
            );
          if (s.checkoutIds.length >= 5)
            throw new HttpsError(
              "resource-exhausted",
              "Phiên demo đã đủ 5 lượt.",
            );
          if (!cart.items.length)
            throw new HttpsError(
              "failed-precondition",
              "Chọn sản phẩm demo trước.",
            );
          const productRows = await tx.getAll(
            ...cart.items.map((i) => db.doc(`products/${i.productId}`)),
          );
          const id = randomUUID(),
            now = Date.now();
          const built = buildCheckout({
            id,
            ownerId: uid,
            now,
            revision: cart.revision,
            items: cart.items,
            products: Object.fromEntries(
              productRows.map((p) => [p.id, p.data()]),
            ),
            drafts: {},
            policy: {
              enabled: true,
              approved: true,
              version: 1,
              serviceBps: 0,
              termsVersion: "production-demo-no-money-v1",
              effectiveFrom: s.createdAt,
              expiresAt: s.expiresAt,
              rates: {
                USD: { numerator: 1, denominator: 1 },
                JPY: { numerator: 1, denominator: 1 },
                KRW: { numerator: 1, denominator: 1 },
              },
            },
            recipient: {
              recipient: "Người nhận mô phỏng",
              phone: "0900000000",
              country: "VN",
              provinceCode: "01",
              communeCode: "00001",
              province: "Địa chỉ demo",
              commune: "Địa chỉ demo",
              street: "Không giao hàng thật",
              note: "Dữ liệu thử",
            },
            orderIds: cart.items.map(() => randomUUID()),
            shipping: { state: "unknown" },
          });
          const snapshot = {
            ...built.snapshot,
            ...demoExecution(s),
            provider: demoProvider,
          };
          const previewHash = hash(snapshot);
          tx.create(db.doc(`productionDemoPreviews/${id}`), {
            ...snapshot,
            orders: built.orders,
            previewHash,
          });
          reply = { ...snapshot, previewHash };
        } else {
          const preview = await tx.get(
              db.doc(`productionDemoPreviews/${d.previewId}`),
            ),
            p = preview.data();
          assertDemoRecord(p, s);
          if (
            !p ||
            p.previewHash !== d.previewHash ||
            p.cartRevision !== cart.revision ||
            p.expiresAt <= Date.now() ||
            s.checkoutIds.length >= 5
          )
            throw new HttpsError(
              "failed-precondition",
              "Tổng quan demo đã thay đổi hoặc hết hạn.",
            );
          const products = await tx.getAll(
            ...p.lines.map((l: { productId: string }) =>
              db.doc(`products/${l.productId}`),
            ),
          );
          if (
            products.some(
              (r, i) =>
                !r.exists ||
                (r.data() as Record<string, unknown>).status !== "published" ||
                (r.data() as Record<string, unknown>).orderable !== true ||
                (r.data() as Record<string, unknown>).version !==
                  p.lines[i].productVersion ||
                Number((r.data() as Record<string, unknown>).listedPrice) *
                  p.lines[i].quantity !==
                  p.lines[i].total,
            )
          )
            throw Error("CATALOG_CHANGED");
          const { previewHash, ...snapshot } = p;
          tx.create(db.doc(`purchaseCheckouts/${preview.id}`), {
            ...snapshot,
            state: "pending",
            hash: previewHash,
            receiptEmail: null,
            paymentMethod: "BANK_TRANSFER",
          });
          tx.update(cartRef, {
            activeCheckoutId: preview.id,
            revision: cart.revision + 1,
          });
          tx.update(sessionRef, {
            checkoutIds: [...s.checkoutIds, preview.id],
          });
          reply = { id: preview.id, state: "pending", total: p.total };
        }
        tx.create(opRef, {
          hash: inputHash,
          result: reply,
          ...demoExecution(s),
        });
        return reply;
      }),
    );
    if (
      result &&
      typeof result === "object" &&
      "settle" in result &&
      typeof result.settle === "string"
    )
      return settleProductionDemoEvidence(result.settle);
    return result;
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      "failed-precondition",
      "Chưa hoàn tất thao tác demo. Tải lại trạng thái và kiểm tra thông tin.",
    );
  }
}
export const productionDemo = onCall(demoOptions, handleProductionDemo);
