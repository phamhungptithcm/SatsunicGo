import { isStringRoleArray, requireVerifiedGoogle } from "./auth/guards";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, type Transaction } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { z } from "zod";
import { createHash } from "node:crypto";
import { verifyImage } from "../../packages/domain/media";
const opts = {
  region: "asia-southeast1",
  maxInstances: 2,
  concurrency: 4,
  memory: "256MiB" as const,
  enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
};
const orderId = z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
  kind = z.enum(["request", "purchase", "warehouse", "receipt"]);
async function authorized(
  tx: Transaction,
  uid: string,
  id: string,
  purpose?: string,
  writing = false,
) {
  const db = getFirestore(),
    [order, staff, user] = await Promise.all([
      tx.get(db.doc(`orders/${id}`)),
      tx.get(db.doc(`staffAccess/${uid}`)),
      tx.get(db.doc(`users/${uid}`)),
    ]);
  const roles: string[] =
    staff.data()?.active === true && isStringRoleArray(staff.data()?.roles)
      ? staff.data()!.roles
      : [];
  const owner = order.data()?.ownerId === uid;
  const assigned =
    roles.includes("BUYER") &&
    Array.isArray(staff.data()?.orderIds) &&
    staff.data()!.orderIds.includes(id);
  const manager = roles.some((r) =>
    ["OWNER", "OPERATIONS_MANAGER"].includes(r),
  );
  const allowed = !writing
    ? owner ||
      manager ||
      assigned ||
      roles.some((r) => ["WAREHOUSE", "FINANCE", "SUPPORT"].includes(r))
    : purpose === "request"
      ? owner || manager
      : purpose === "purchase"
        ? manager || assigned
        : purpose === "warehouse"
          ? manager || roles.includes("WAREHOUSE")
          : owner || manager || roles.includes("FINANCE");
  // Compose each current role's existing grant; list and read use the same
  // union so a second role cannot accidentally remove an authorized kind.
  const readableKinds = kind.options.filter(
    (imageKind) =>
      owner ||
      manager ||
      roles.includes("FINANCE") ||
      (assigned && ["request", "purchase"].includes(imageKind)) ||
      (roles.includes("WAREHOUSE") &&
        ["request", "warehouse"].includes(imageKind)) ||
      (roles.includes("SUPPORT") && imageKind !== "receipt"),
  );
  if (
    !order.exists ||
    user.data()?.locked ||
    staff.data()?.locked ||
    !allowed ||
    (!writing &&
      purpose !== undefined &&
      !readableKinds.some((imageKind) => imageKind === purpose))
  )
    throw new HttpsError(
      "permission-denied",
      "Không thể truy cập ảnh riêng của đơn.",
    );
  return { readableKinds };
}
export const uploadOrderImage = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const parsed = z
    .object({
      orderId,
      kind,
      operationId: z.string().uuid(),
      mime: z.enum(["image/png", "image/jpeg", "image/webp"]),
      base64: z
        .string()
        .max(2800000)
        .regex(/^[A-Za-z0-9+/]*={0,2}$/),
      description: z.string().trim().min(2).max(300),
    })
    .strict()
    .safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError(
      "invalid-argument",
      "Dùng ảnh PNG, JPEG hoặc WebP tối đa 2 MB và mô tả ngắn.",
    );
  const d = parsed.data,
    uid = req.auth.uid,
    db = getFirestore(),
    bytes = Buffer.from(d.base64, "base64");
  try {
    verifyImage(bytes, d.mime);
  } catch {
    throw new HttpsError(
      "invalid-argument",
      "Nội dung hoặc kích thước ảnh chưa hợp lệ.",
    );
  }
  const hash = createHash("sha256").update(bytes).digest("hex"),
    id = createHash("sha256").update(`${uid}-${d.operationId}`).digest("hex"),
    metadataHash = createHash("sha256")
      .update(
        JSON.stringify({
          orderId: d.orderId,
          kind: d.kind,
          description: d.description,
          mime: d.mime,
          hash,
        }),
      )
      .digest("hex"),
    ref = db.doc(`orderMedia/${id}`),
    countRef = db.doc(`orderMediaCounters/${d.orderId}`),
    objectPath = `private-orders/${d.orderId}/${id}`;
  const ready = await db.runTransaction(async (tx) => {
    await authorized(tx, uid, d.orderId, d.kind, true);
    const [previous, count] = await Promise.all([
      tx.get(ref),
      tx.get(countRef),
    ]);
    if (previous.exists) {
      if (previous.data()?.metadataHash !== metadataHash)
        throw new HttpsError(
          "already-exists",
          "Mã tải ảnh đã dùng cho nội dung khác.",
        );
      return previous.data()?.state === "ready";
    }
    if ((count.data()?.count ?? 0) >= 20)
      throw new HttpsError(
        "resource-exhausted",
        "Mỗi đơn tối đa 20 ảnh. Liên hệ hỗ trợ nếu cần bổ sung.",
      );
    tx.set(countRef, { count: (count.data()?.count ?? 0) + 1 });
    tx.create(ref, {
      orderId: d.orderId,
      kind: d.kind,
      description: d.description,
      mime: d.mime,
      metadataHash,
      objectPath,
      size: bytes.length,
      state: "pending",
      uploadedBy: uid,
      createdAt: Date.now(),
    });
    return false;
  });
  if (ready) return { id };
  const file = getStorage().bucket().file(objectPath);
  try {
    await file.save(bytes, {
      resumable: false,
      preconditionOpts: { ifGenerationMatch: 0 },
      metadata: {
        contentType: d.mime,
        cacheControl: "private,no-store",
        metadata: { sha256: hash },
      },
    });
  } catch (e) {
    if ((e as { code?: number }).code !== 412)
      throw new HttpsError(
        "unavailable",
        "Chưa tải được ảnh. Giữ nguyên file để thử lại.",
      );
  }
  await db.runTransaction(async (tx) => {
    await authorized(tx, uid, d.orderId, d.kind, true);
    const previous = await tx.get(ref);
    if (previous.data()?.state === "ready") return;
    tx.update(ref, { state: "ready" });
    tx.create(db.collection("auditEvents").doc(), {
      action: "uploadOrderImage",
      actor: uid,
      resourceId: d.orderId,
      createdAt: Date.now(),
    });
  });
  return { id };
});
export const listOrderImages = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const parsed = z.object({ orderId }).strict().safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Mã đơn chưa hợp lệ.");
  const uid = req.auth.uid,
    db = getFirestore();
  return db.runTransaction(async (tx) => {
    const access = await authorized(tx, uid, parsed.data.orderId);
    const rows = await tx.get(
      db
        .collection("orderMedia")
        .where("orderId", "==", parsed.data.orderId)
        .where("state", "==", "ready")
        .where("kind", "in", access.readableKinds)
        .limit(20),
    );
    return {
      rows: rows.docs.map((d) => ({
        id: d.id,
        kind: d.data().kind,
        description: d.data().description,
      })),
    };
  });
});
export const readOrderImage = onCall(opts, async (req) => {
  requireVerifiedGoogle(req.auth);
  if (!req.auth?.uid)
    throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
  const parsed = z
    .object({ id: z.string().regex(/^[a-f0-9]{64}$/) })
    .strict()
    .safeParse(req.data);
  if (!parsed.success)
    throw new HttpsError("invalid-argument", "Ảnh chưa hợp lệ.");
  const uid = req.auth.uid,
    db = getFirestore(),
    mediaId = parsed.data.id;
  async function read() {
    return db.runTransaction(async (tx) => {
      const snapshot = await tx.get(db.doc(`orderMedia/${mediaId}`)),
        data = snapshot.data();
      if (!data || data.state !== "ready")
        throw new HttpsError("permission-denied", "Không thể mở ảnh.");
      await authorized(tx, uid, data.orderId, data.kind);
      return data;
    });
  }
  const data = await read();
  const [bytes] = await getStorage().bucket().file(data.objectPath).download();
  verifyImage(bytes, data.mime);
  await read(); // Recheck current access after I/O; no public download token.
  return {
    mime: data.mime,
    base64: bytes.toString("base64"),
    description: data.description,
  };
});
