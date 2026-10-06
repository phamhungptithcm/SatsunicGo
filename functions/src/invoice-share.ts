import { createHash } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import {
  sharedDocument,
  type SalesDocument,
} from "../../packages/domain/invoices";
export const invoiceShare = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 20,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req) => {
    req.rawRequest.res?.set({
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    });
    const p = z
      .object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
      .strict()
      .safeParse(req.data);
    if (!p.success)
      throw new HttpsError("not-found", "Liên kết không còn sử dụng được.");
    const db = getFirestore(),
      now = Date.now(),
      key = createHash("sha256").update(p.data.token).digest("hex");
    const bucket = createHash("sha256")
      .update(`${Math.floor(now / 60000)}:${req.rawRequest.ip ?? "unknown"}`)
      .digest("hex");
    const result = await db.runTransaction(async (tx) => {
      const quotaRef = db.doc(`invoiceShareQuotas/${bucket}`);
      const [quota, share] = await Promise.all([
        tx.get(quotaRef),
        tx.get(db.doc(`salesDocumentShares/${key}`)),
      ]);
      if ((quota.data()?.count ?? 0) >= 30)
        throw new HttpsError("resource-exhausted", "Thử lại sau một phút.");
      const count = () =>
        tx.set(quotaRef, {
          count: (quota.data()?.count ?? 0) + 1,
          expiresAt: now + 120000,
        });
      const s = share.data();
      if (!s || s.expiresAt <= now) {
        count();
        return null;
      }
      const document = await tx.get(db.doc(`salesDocuments/${s.documentId}`)),
        d = document.data() as SalesDocument | undefined;
      if (!d || d.state !== "issued" || d.shareEpoch !== s.epoch) {
        count();
        return null;
      }
      const [owner, access] = await Promise.all([
        tx.get(db.doc(`users/${d.ownerId}`)),
        tx.get(db.doc(`staffAccess/${d.ownerId}`)),
      ]);
      count();
      return owner.data()?.locked || access.data()?.locked
        ? null
        : sharedDocument(d);
    });
    if (!result)
      throw new HttpsError("not-found", "Liên kết đã hết hạn hoặc bị thu hồi.");
    return result;
  },
);
