import {
  customerEvent,
  customerEventFields,
} from "./customer-notification-events";
import { createHash, randomUUID } from "node:crypto";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { z } from "zod";
import { requireVerifiedGoogle } from "./auth/guards";
import { purchaseDemoEnvironment } from "./purchase-checkout";
import { withPurchaseMutation } from "./purchase-mutation-queue";
import { purchaseTestRecord } from "../../packages/domain/purchase-checkout";
import { purchaseTestProjection } from "./purchase-test-projection";
import {
  renderPurchaseReceipt,
  type PurchaseReceiptData,
} from "./purchase-pdf";
const hash = (b: Buffer) => createHash("sha256").update(b).digest("hex");
type PurchaseReceiptReply = ReturnType<typeof purchaseTestProjection> & {
  state: string;
  emailState: string | null;
  mime?: "application/pdf";
  base64?: string;
};
/** Lease before I/O; deterministic private object + outbox identifiers. Money
 * confirmation is independent of rendering/delivery success. */
export async function processPurchaseReceipt(id: string) {
  return withPurchaseMutation(`receipt-${id}`, () => processReceipt(id));
}
async function processReceipt(id: string) {
  const db = getFirestore(),
    ref = db.doc(`purchaseReceiptJobs/${id}`),
    receiptRef = db.doc(`purchaseReceipts/${id}`),
    claim = randomUUID(),
    now = Date.now();
  const receipt = await db.runTransaction(async (tx) => {
    const [job, snapshot] = await tx.getAll(ref, receiptRef);
    const data = job.data();
    if (!data) return null;
    if (!snapshot.exists) {
      tx.update(ref, {
        state: "failed",
        failureCode: "RECEIPT_MISSING",
        leaseUntil: 0,
      });
      return null;
    }
    if (data.state === "ready" || data.state === "failed") {
      if (data.leaseUntil) tx.update(ref, { leaseUntil: 0 });
      return null;
    }
    if (data.state === "processing" && data.leaseUntil > now) return null;
    if (data.attempts >= 3) {
      tx.update(ref, {
        state: "failed",
        failureCode: "RETRY_LIMIT",
        leaseUntil: 0,
      });
      tx.update(receiptRef, { state: "failed" });
      return null;
    }
    tx.update(ref, {
      state: "processing",
      claim,
      leaseUntil: now + 120000,
      attempts: data.attempts + 1,
    });
    tx.update(receiptRef, { state: "processing" });
    return snapshot.data() as PurchaseReceiptData & { ownerEmail?: string };
  });
  if (!receipt) return;
  try {
    const pdf = renderPurchaseReceipt(receipt),
      digest = hash(pdf),
      objectPath = `private-purchase-receipts/${id}/receipt.pdf`;
    if (pdf.length > 3000000) throw Error("PDF_TOO_LARGE");
    await getStorage()
      .bucket()
      .file(objectPath)
      .save(pdf, {
        resumable: false,
        metadata: {
          contentType: "application/pdf",
          cacheControl: "private,no-store",
          metadata: { sha256: digest },
        },
      });
    await db.runTransaction(async (tx) => {
      const [job, current, demo] = await tx.getAll(
        ref,
        receiptRef,
        db.doc("settings/purchaseDemo"),
      );
      if (job.data()?.claim !== claim || job.data()?.state !== "processing")
        return;
      if (current.data()?.snapshotHash !== receipt.snapshotHash)
        throw Error("RECEIPT_SNAPSHOT_CHANGED");
      const delivered =
        Boolean(receipt.ownerEmail) &&
        ["demo", "sepay_sandbox"].includes(receipt.provider) &&
        purchaseDemoEnvironment(db) &&
        demo.data()?.enabled === true;
      const emailState = !receipt.ownerEmail
        ? "pending_recipient"
        : delivered
          ? "demo_delivered"
          : "pending_configuration";
      tx.set(db.doc(`purchaseEmailOutbox/${id}`), {
        ...purchaseTestProjection(receipt),
        ownerId: receipt.ownerId,
        receiptId: id,
        objectPath,
        pdfSha256: digest,
        to: receipt.ownerEmail ?? null,
        subject: `SatsunicGo · ${purchaseTestRecord(receipt) ? "Chứng từ test" : "Chứng từ thanh toán"} ${id}`,
        text: purchaseTestRecord(receipt)
          ? `Thanh toán test ${receipt.total.toLocaleString("vi-VN")} ₫. Chứng từ PDF được đính kèm.`
          : `SatsunicGo đã ghi nhận ${receipt.total.toLocaleString("vi-VN")} ₫. Chứng từ PDF xác nhận khoản thanh toán được đính kèm. Chứng từ này không thay thế hóa đơn thuế.`,
        attachments: [
          {
            filename: `SatsunicGo-${id}.pdf`,
            objectPath,
            contentType: "application/pdf",
            sha256: digest,
          },
        ],
        state: emailState,
        createdAt: now,
        transport: delivered ? "demo_sink" : "unconfigured",
        customerDeliveryJobId: `purchase-receipt-${id}`,
        customerSenderEnabled: false,
      });
      // Shared customer inbox; receipt mail remains opt-in to avoid a second payment email.
      tx.create(db.doc(`outboxJobs/purchase-receipt-${id}`), {
        ...purchaseTestProjection(receipt),
        ownerId: receipt.ownerId,
        resourceId: id,
        action: "purchaseReceiptReady",
        state: "queued",
        createdAt: now,
        ...customerEventFields(() =>
          customerEvent(
            "receipt_ready",
            {
              ownerId: receipt.ownerId,
              entityId: id,
              entityVersion: 1,
              occurredAt: now,
            },
            { receiptRef: id, paidAmount: receipt.total },
          ),
        ),
      });
      tx.update(receiptRef, {
        state: "ready",
        objectPath,
        pdfSha256: digest,
        pdfSize: pdf.length,
        emailState,
      });
      tx.update(ref, {
        state: "ready",
        leaseUntil: 0,
        completedAt: Date.now(),
      });
    });
  } catch (error) {
    // Store only bounded diagnostic categories; never storage messages, paths or PII.
    const failureDetail =
      error instanceof Error &&
      [
        "RECEIPT_INVALID",
        "RECEIPT_BALANCE_INVALID",
        "RECEIPT_SNAPSHOT_CHANGED",
        "PDF_TOO_LARGE",
        "FONT_CMAP_MISSING",
      ].includes(error.message)
        ? error.message
        : ["ENOENT", "ECONNREFUSED", "ETIMEDOUT"].includes(
              String((error as { code?: unknown } | null)?.code),
            )
          ? String((error as { code: unknown }).code)
          : "UNCLASSIFIED";
    await db.runTransaction(async (tx) => {
      const job = await tx.get(ref);
      if (job.data()?.claim !== claim || job.data()?.state !== "processing")
        return;
      const failed = job.data()!.attempts >= 3;
      tx.update(ref, {
        state: failed ? "failed" : "queued",
        leaseUntil: 0,
        failureCode: "PDF_OR_STORAGE_FAILED",
        failureDetail,
      });
      tx.update(receiptRef, { state: failed ? "failed" : "queued" });
    });
  }
}
export const purchaseReceiptWorker = onDocumentCreated(
  {
    document: "purchaseReceiptJobs/{id}",
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 4,
    retry: true,
  },
  async (event) => {
    await processPurchaseReceipt(event.params.id);
  },
);
export const purchaseReceiptRecovery = onSchedule(
  { schedule: "every 5 minutes", region: "asia-southeast1", maxInstances: 1 },
  async () => {
    const db = getFirestore();
    const [queued, expired] = await Promise.all([
      db
        .collection("purchaseReceiptJobs")
        .where("state", "==", "queued")
        .limit(5)
        .get(),
      db
        .collection("purchaseReceiptJobs")
        .where("leaseUntil", ">", 0)
        .where("leaseUntil", "<=", Date.now())
        .limit(5)
        .get(),
    ]);
    const ids = [...queued.docs, ...expired.docs].slice(0, 10).map((d) => d.id);
    for (const id of ids) await processPurchaseReceipt(id);
  },
);
export const purchaseReceipt = onCall(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 4,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR !== "true",
  },
  async (req): Promise<PurchaseReceiptReply> => {
    const uid = requireVerifiedGoogle(req.auth),
      input = z
        .object({ id: z.string().uuid(), download: z.boolean() })
        .strict()
        .safeParse(req.data);
    if (!input.success)
      throw new HttpsError("invalid-argument", "Mã chứng từ chưa hợp lệ.");
    const db = getFirestore(),
      id = input.data.id;
    async function read() {
      return db.runTransaction(async (tx) => {
        const [receipt, user, access] = await Promise.all([
          tx.get(db.doc(`purchaseReceipts/${id}`)),
          tx.get(db.doc(`users/${uid}`)),
          tx.get(db.doc(`staffAccess/${uid}`)),
        ]);
        if (
          receipt.data()?.ownerId !== uid ||
          user.data()?.locked ||
          access.data()?.locked
        )
          throw new HttpsError("permission-denied", "Chưa mở được chứng từ.");
        return receipt.data()!;
      });
    }
    let data = await read();
    if (data.state !== "ready" && purchaseDemoEnvironment(db)) {
      await processPurchaseReceipt(id);
      data = await read();
    }
    if (!input.data.download || data.state !== "ready")
      return {
        ...purchaseTestProjection(data),
        state: data.state,
        emailState: data.emailState ?? null,
      };
    const [bytes] = await getStorage()
      .bucket()
      .file(data.objectPath)
      .download();
    if (bytes.length > 3000000 || hash(bytes) !== data.pdfSha256)
      throw new HttpsError(
        "failed-precondition",
        "Chứng từ cần được kiểm tra lại.",
      );
    await read();
    return {
      ...purchaseTestProjection(data),
      state: "ready",
      emailState: data.emailState,
      mime: "application/pdf",
      base64: bytes.toString("base64"),
    };
  },
);
