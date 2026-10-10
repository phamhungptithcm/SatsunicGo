import { purchaseFinancialCollection } from "./purchase-test-boundary";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { z } from "zod";
import { isStringRoleArray, requireVerifiedGoogle } from "./auth/guards";
export const orderHistory = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 3,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    requireVerifiedGoogle(req.auth);
    if (!req.auth?.uid)
      throw new HttpsError("unauthenticated", "Đăng nhập để tiếp tục.");
    const id = z
      .string()
      .regex(/^[a-zA-Z0-9-]{1,80}$/)
      .safeParse(req.data?.orderId);
    if (!id.success)
      throw new HttpsError("invalid-argument", "Thông tin đơn không hợp lệ.");
    const db = getFirestore();
    return db.runTransaction(async (tx) => {
      const [order, user, access] = await Promise.all([
        tx.get(db.doc(`orders/${id.data}`)),
        tx.get(db.doc(`users/${req.auth!.uid}`)),
        tx.get(db.doc(`staffAccess/${req.auth!.uid}`)),
      ]);
      if (
        !order.exists ||
        user.data()?.locked ||
        access.data()?.locked ||
        !(
          order.data()?.ownerId === req.auth!.uid ||
          (access.data()?.active === true &&
            isStringRoleArray(access.data()?.roles) &&
            access
              .data()
              ?.roles?.some((r: string) =>
                ["OWNER", "FINANCE", "SUPPORT", "OPERATIONS_MANAGER"].includes(
                  r,
                ),
              ))
        )
      )
        throw new HttpsError("permission-denied", "Không thể truy cập đơn.");
      const [timeline, entries] = await Promise.all([
        tx.get(
          order.ref
            .collection("timeline")
            .orderBy("createdAt", "desc")
            .limit(50),
        ),
        tx.get(
          db
            .collection(purchaseFinancialCollection(order.data()))
            .where("orderId", "==", id.data)
            .limit(100),
        ),
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
    });
  },
);
