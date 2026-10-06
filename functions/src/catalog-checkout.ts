import { createHash, randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import {
  catalogSelectionSchema,
  createCatalogOrder,
} from "../../packages/domain/catalog-checkout";
import { normalizeCustomerName } from "../../packages/domain/crm";
import { requireVerifiedGoogle } from "./auth/guards";

const checkoutSchema = catalogSelectionSchema
  .extend({ operationId: z.string().uuid() })
  .strict();
export const catalogCheckout = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 5,
    concurrency: 20,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    requireVerifiedGoogle(req.auth);
    if (!req.auth?.uid)
      throw new HttpsError("unauthenticated", "Đăng nhập để đặt mua.");
    const parsed = checkoutSchema.safeParse(req.data);
    if (!parsed.success)
      throw new HttpsError("invalid-argument", "Kiểm tra lựa chọn sản phẩm.");
    const s = parsed.data,
      uid = req.auth.uid,
      db = getFirestore(),
      now = Date.now();
    const op = db.doc(`idempotencyKeys/${uid}-${s.operationId}`);
    const hash = createHash("sha256")
      .update(JSON.stringify({ action: "catalogCheckout", ...s }))
      .digest("hex");
    const ref = db.doc(`orders/${randomUUID()}`);
    return db.runTransaction(async (tx) => {
      const [previous, profile, access, product] = await Promise.all([
        tx.get(op),
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc(`products/${s.productId}`)),
      ]);
      if (profile.data()?.locked || access.data()?.locked)
        throw new HttpsError("permission-denied", "Không thể đặt mua lúc này.");
      if (previous.exists) {
        if (previous.data()?.hash !== hash)
          throw new HttpsError("already-exists", "Mã đặt mua đã được sử dụng.");
        return previous.data()?.result;
      }
      let order;
      try {
        order = createCatalogOrder(product.data(), sWithoutOperation(s), {
          id: ref.id,
          ownerId: uid,
          now,
        });
      } catch (error) {
        if ((error as Error).message === "CATALOG_PRICE_CHANGED")
          throw new HttpsError(
            "aborted",
            "Sản phẩm đã cập nhật. Tải lại để xem giá rồi đặt mua.",
          );
        throw new HttpsError(
          "failed-precondition",
          "Sản phẩm hoặc lựa chọn này chưa thể đặt mua. Kiểm tra lại danh mục.",
        );
      }
      const result = { id: ref.id, version: 1, total: order.finalTotal };
      tx.create(ref, order);
      tx.create(ref.collection("acceptances").doc("catalog"), {
        acceptedAt: now,
        acceptedBy: uid,
        catalogSnapshot: order.catalogSnapshot,
      });
      if (!profile.exists) {
        const name =
          typeof req.auth!.token.name === "string"
            ? req.auth!.token.name.slice(0, 120)
            : "";
        tx.create(db.doc(`users/${uid}`), {
          ownerId: uid,
          displayName: name,
          searchName: normalizeCustomerName(name),
          businessName: "",
          marketingConsent: false,
          version: 1,
          createdAt: now,
          changedAt: now,
        });
      }
      tx.create(op, { hash, result, createdAt: now });
      tx.create(ref.collection("timeline").doc(), {
        action: "catalogCheckout",
        createdAt: now,
      });
      tx.create(db.collection("auditEvents").doc(), {
        actor: uid,
        action: "catalogCheckout",
        resourceId: ref.id,
        createdAt: now,
      });
      tx.create(db.collection("outboxJobs").doc(), {
        ownerId: uid,
        orderId: ref.id,
        action: "catalogCheckout",
        state: "queued",
        createdAt: now,
      });
      return result;
    });
  },
);
function sWithoutOperation(s: z.infer<typeof checkoutSchema>) {
  return {
    productId: s.productId,
    productVersion: s.productVersion,
    quantity: s.quantity,
    variant: s.variant,
  };
}
