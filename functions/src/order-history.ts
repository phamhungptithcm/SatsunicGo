import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { z } from "zod";
export const orderHistory = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 3,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    if (!req.auth?.uid)
      throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
    const id = z
      .string()
      .regex(/^[a-zA-Z0-9-]{1,80}$/)
      .safeParse(req.data?.orderId);
    if (!id.success)
      throw new HttpsError("invalid-argument", "Thông tin đơn không hợp lệ.");
    const db = getFirestore(),
      [order, user, access] = await Promise.all([
        db.doc(`orders/${id.data}`).get(),
        db.doc(`users/${req.auth.uid}`).get(),
        db.doc(`staffAccess/${req.auth.uid}`).get(),
      ]);
    if (
      !order.exists ||
      user.data()?.locked ||
      access.data()?.locked ||
      !(
        order.data()?.ownerId === req.auth.uid ||
        (access.data()?.active &&
          access
            .data()
            ?.roles?.some((r: string) =>
              ["OWNER", "FINANCE", "SUPPORT", "OPERATIONS_MANAGER"].includes(r),
            ))
      )
    )
      throw new HttpsError("permission-denied", "Không thể truy cập đơn.");
    const [timeline, entries] = await Promise.all([
      order.ref
        .collection("timeline")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get(),
      db
        .collection("financialEntries")
        .where("orderId", "==", id.data)
        .limit(100)
        .get(),
    ]);
    return {
      order: order.data(),
      timeline: timeline.docs.map((d) => ({
        id: d.id,
        action: d.data().action,
        createdAt: d.data().createdAt,
      })),
      entries: entries.docs.map((d) => ({
        id: d.id,
        kind: d.data().kind,
        amount: d.data().amount,
        createdAt: d.data().createdAt,
        currency: "VND",
      })),
    };
  },
);
