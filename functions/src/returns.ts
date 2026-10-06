import { isStringRoleArray, requireVerifiedGoogle } from "./auth/guards";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { z } from "zod";
const schema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
    operationId: z.string().uuid(),
    expectedVersion: z.number().int().positive(),
    action: z.enum(["receive", "inspect", "close"]),
    line: z.number().int().min(0).max(29).optional(),
    quantity: z.number().int().min(1).max(100).optional(),
    condition: z.enum(["accepted", "damaged"]).optional(),
    evidence: z.string().trim().min(5).max(1000),
  })
  .strict();
export const returnCommand = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 3,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    requireVerifiedGoogle(req.auth);
    if (!req.auth?.uid)
      throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
    const parsed = schema.safeParse(req.data);
    if (!parsed.success)
      throw new HttpsError(
        "invalid-argument",
        "Thông tin hàng trả chưa hợp lệ.",
      );
    const d = parsed.data,
      uid = req.auth.uid,
      db = getFirestore(),
      now = Date.now();
    const ref = db.doc(`orderReturns/${d.id}`),
      op = db.doc(`idempotencyKeys/${uid}-${d.operationId}`);
    const hash = createHash("sha256").update(JSON.stringify(d)).digest("hex");
    return db.runTransaction(async (tx) => {
      const [access, user, snapshot, previous] = await Promise.all([
        tx.get(db.doc(`staffAccess/${uid}`)),
        tx.get(db.doc(`users/${uid}`)),
        tx.get(ref),
        tx.get(op),
      ]);
      const roles = access.data()?.roles ?? [],
        allowed =
          d.action === "close"
            ? ["OWNER", "OPERATIONS_MANAGER"]
            : ["OWNER", "OPERATIONS_MANAGER", "WAREHOUSE"];
      if (
        access.data()?.active !== true ||
        access.data()?.locked ||
        user.data()?.locked ||
        !isStringRoleArray(roles) ||
        !allowed.some((r) => roles.includes(r))
      )
        throw new HttpsError(
          "permission-denied",
          "Không có quyền xử lý hàng trả.",
        );
      if (previous.exists) {
        if (previous.data()?.hash !== hash)
          throw new HttpsError("already-exists", "Mã thao tác đã dùng.");
        return previous.data()?.result;
      }
      const data = snapshot.data();
      if (!data || data.version !== d.expectedVersion)
        throw new HttpsError("aborted", "Hồ sơ hàng trả đã thay đổi. Tải lại.");
      const orderRef = db.doc(`orders/${data.orderId}`),
        order = await tx.get(orderRef);
      if (!order.exists || data.state === "closed")
        throw new HttpsError(
          "failed-precondition",
          "Hồ sơ hàng trả không còn mở.",
        );
      const lines = data.lines as {
        line: number;
        authorized: number;
        received: number;
        accepted: number;
        damaged: number;
      }[];
      let state = data.state;
      if (d.action === "close") {
        if (
          d.line !== undefined ||
          d.quantity !== undefined ||
          d.condition !== undefined ||
          !lines.every(
            (l) =>
              l.received === l.authorized &&
              l.accepted + l.damaged === l.received,
          )
        )
          throw new HttpsError(
            "failed-precondition",
            "Cần nhận đủ và kiểm tra toàn bộ hàng được phép trả.",
          );
        // Closing physical inspection never credits or refunds money or releases
        // the financial hold. Finance must reconcile the immutable ledger separately.
        state = "closed";
      } else {
        const line = lines.find((l) => l.line === d.line);
        if (
          !line ||
          !d.quantity ||
          (d.action === "receive" && d.condition !== undefined) ||
          (d.action === "inspect" && !d.condition)
        )
          throw new HttpsError(
            "invalid-argument",
            "Chọn dòng hàng, số lượng và kết quả kiểm tra.",
          );
        if (d.action === "receive") {
          if (line.received + d.quantity > line.authorized)
            throw new HttpsError(
              "failed-precondition",
              "Số lượng nhận vượt hàng được phép trả.",
            );
          line.received += d.quantity;
          state = "receiving";
        } else {
          if (line.accepted + line.damaged + d.quantity > line.received)
            throw new HttpsError(
              "failed-precondition",
              "Chỉ kiểm tra hàng đã nhận và chưa kiểm tra.",
            );
          line[d.condition!] += d.quantity;
          state = "inspecting";
        }
      }
      const version = data.version + 1;
      tx.update(ref, { lines, state, version, changedAt: now });
      tx.create(ref.collection("evidence").doc(), {
        action: d.action,
        evidence: d.evidence,
        actor: uid,
        createdAt: now,
        ...(d.line !== undefined ? { line: d.line } : {}),
        ...(d.quantity ? { quantity: d.quantity } : {}),
        ...(d.condition ? { condition: d.condition } : {}),
      });
      tx.create(orderRef.collection("timeline").doc(), {
        action: `return-${d.action}`,
        createdAt: now,
      });
      tx.create(db.collection("auditEvents").doc(), {
        actor: uid,
        action: `return-${d.action}`,
        resourceId: data.orderId,
        createdAt: now,
      });
      const result = { id: d.id, version };
      tx.create(op, { hash, result, createdAt: now });
      return result;
    });
  },
);
