import { createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  cartItemSchema,
  cartCommandSchema,
  cartSchema,
  consumeCart,
  mergeCart,
  type CartItem,
} from "../../packages/domain/cart";
import { catalogProductSchema } from "../../packages/domain/catalog-checkout";
import { requireVerifiedGoogle } from "./auth/guards";

export const cartCommand = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 5,
    concurrency: 20,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    const uid = requireVerifiedGoogle(req.auth);
    const parsed = cartCommandSchema.safeParse(req.data);
    if (!parsed.success)
      throw new HttpsError(
        "invalid-argument",
        "Kiểm tra mẫu và số lượng trong giỏ.",
      );
    const input = parsed.data,
      db = getFirestore(),
      ref = db.doc(`carts/${uid}`);
    const op = db.doc(`idempotencyKeys/cart-${uid}-${input.operationId}`);
    const hash = createHash("sha256")
      .update(JSON.stringify(input))
      .digest("hex");
    return db.runTransaction(async (tx) => {
      const [profile, access, previous, snapshot] = await Promise.all([
        tx.get(db.doc(`users/${uid}`)),
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(op),
        tx.get(ref),
      ]);
      if (profile.data()?.locked || access.data()?.locked)
        throw new HttpsError(
          "permission-denied",
          "Tài khoản chưa thể cập nhật giỏ hàng.",
        );
      const stored = snapshot.exists
        ? cartSchema.safeParse(snapshot.data())
        : {
            success: true as const,
            data: {
              ownerId: uid,
              revision: 0,
              updatedAt: 0,
              items: [] as CartItem[],
            },
          };
      if (!stored.success)
        throw new HttpsError(
          "failed-precondition",
          "Giỏ đã lưu chưa đọc được. Liên hệ hỗ trợ để kiểm tra.",
        );
      const current = stored.data;
      if (current.ownerId !== uid)
        throw new HttpsError("permission-denied", "Chưa thể mở giỏ hàng.");
      if (previous.exists) {
        if (previous.data()?.hash !== hash)
          throw new HttpsError(
            "already-exists",
            "Lần cập nhật này đã được sử dụng.",
          );
        // Return the current cart rather than a stale replay snapshot.
        return current;
      }
      if (current.activeCheckoutId)
        throw new HttpsError(
          "failed-precondition",
          "Giỏ đang có thanh toán chờ xác minh. Tiếp tục lần đó trước khi sửa giỏ.",
        );
      let items = current.items;
      let completion: FirebaseFirestore.DocumentReference | undefined;
      if (input.action === "consume") {
        completion = ref.collection("checkouts").doc(input.orderId);
        const [done, orderDoc] = await Promise.all([
          tx.get(completion),
          tx.get(db.doc(`orders/${input.orderId}`)),
        ]);
        const order = orderDoc.data();
        if (
          !order ||
          order.ownerId !== uid ||
          order.purchaseKind !== "catalog" ||
          !order.catalogSnapshot
        )
          throw new HttpsError(
            "permission-denied",
            "Chưa xác nhận được đơn để cập nhật giỏ.",
          );
        if (done.exists) return current;
        const selected = cartItemSchema
          .pick({ productId: true, variant: true, quantity: true })
          .strip()
          .safeParse(order.catalogSnapshot);
        if (!selected.success)
          throw new HttpsError(
            "failed-precondition",
            "Thông tin đơn chưa đủ để cập nhật giỏ.",
          );
        const selection = selected.data;
        items = consumeCart(
          items,
          {
            productId: selection.productId,
            variant: selection.variant,
            quantity: selection.quantity,
          },
          input.lineId,
        );
      } else {
        if (current.revision !== input.expectedRevision)
          throw new HttpsError(
            "aborted",
            "Giỏ đã thay đổi ở nơi khác. Xem lại giỏ rồi thử lại.",
          );
        if (input.action === "merge") {
          if (input.items.some((item) => item.kind === "custom"))
            throw new HttpsError(
              "invalid-argument",
              "Món cần tìm mua phải được thêm từ form mua hộ.",
            );
          const products = await Promise.all(
            input.items.map((item) =>
              tx.get(db.doc(`products/${item.productId}`)),
            ),
          );
          input.items.forEach((item, index) => {
            const p = catalogProductSchema.safeParse(products[index].data());
            if (
              !p.success ||
              (p.data.catalogOptions.length
                ? !p.data.catalogOptions.includes(item.variant)
                : item.variant !== "")
            )
              throw new HttpsError(
                "failed-precondition",
                "Sản phẩm hoặc mẫu này chưa thể thêm vào giỏ.",
              );
          });
          try {
            items = mergeCart(items, input.items);
          } catch {
            throw new HttpsError(
              "invalid-argument",
              "Giỏ tối đa 30 mẫu sản phẩm, mỗi mẫu tối đa 100 sản phẩm.",
            );
          }
        } else {
          if (!items.some((item) => item.lineId === input.lineId))
            throw new HttpsError(
              "aborted",
              "Sản phẩm đã thay đổi trong giỏ. Xem lại rồi thử lại.",
            );
          items =
            input.action === "remove"
              ? items.filter((item) => item.lineId !== input.lineId)
              : items.map((item) =>
                  item.lineId === input.lineId
                    ? { ...item, quantity: input.quantity }
                    : item,
                );
        }
      }
      const result = {
        ownerId: uid,
        revision: current.revision + 1,
        updatedAt: Date.now(),
        items,
      };
      tx.set(ref, result);
      tx.create(op, { hash, result, createdAt: result.updatedAt });
      if (completion) tx.create(completion, { createdAt: result.updatedAt });
      return result;
    });
  },
);
