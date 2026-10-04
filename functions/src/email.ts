import { getAuth } from "firebase-admin/auth";
import { defineSecret } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
const password = defineSecret("SMTP_PASSWORD");
export const deliverEmail = onSchedule(
  {
    schedule: "every 30 minutes",
    region: "asia-southeast1",
    maxInstances: 1,
    secrets: [password],
  },
  async () => {
    const db = getFirestore(),
      config = (await db.doc("settings/email").get()).data();
    if (
      config?.enabled !== true ||
      !config.host ||
      !config.user ||
      !config.from ||
      typeof config.messageIdDomain !== "string" ||
      !/^[a-zA-Z0-9.-]+$/.test(config.messageIdDomain)
    )
      return;
    const abandoned = await db
      .collection("outboxJobs")
      .where("emailState", "==", "sending")
      .limit(20)
      .get();
    for (const job of abandoned.docs)
      await db.runTransaction(async (tx) => {
        const current = await tx.get(job.ref);
        if (
          current.data()?.emailState === "sending" &&
          current.data()?.claimedAt < Date.now() - 900000
        )
          tx.update(job.ref, {
            emailState: "unknown",
            reconciliationRequired: true,
          });
      });
    const rows = await db
      .collection("outboxJobs")
      .where("emailState", "==", "queued")
      .limit(20)
      .get();
    const transport = nodemailer.createTransport({
      host: config.host,
      port: 465,
      secure: true,
      auth: { user: config.user, pass: password.value() },
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
    try {
      for (const d of rows.docs) {
        const claimed = await db.runTransaction(async (tx) => {
          const s = await tx.get(d.ref);
          if (
            s.data()?.emailState !== "queued" ||
            (s.data()?.emailAttempts ?? 0) >= 3
          )
            return null;
          tx.update(d.ref, {
            emailState: "sending",
            emailAttempts: (s.data()?.emailAttempts ?? 0) + 1,
            claimedAt: Date.now(),
          });
          return s.data()!;
        });
        if (!claimed) continue;
        const user = (await db.doc(`users/${claimed.ownerId}`).get()).data();
        let identity;
        try {
          identity = await getAuth().getUser(claimed.ownerId);
        } catch {
          await d.ref.update({ emailState: "blocked_recipient" });
          continue;
        }
        if (
          !identity.email ||
          identity.disabled ||
          user?.locked ||
          (claimed.marketing === true && user?.marketingConsent !== true)
        ) {
          await d.ref.update({ emailState: "blocked_recipient" });
          continue;
        }
        try {
          await transport.sendMail({
            from: config.from,
            to: identity.email,
            subject: "SatsunicGo · Đơn hàng có cập nhật",
            text: "Đơn của bạn có cập nhật. Đăng nhập SatsunicGo để xem báo giá, thanh toán và hành trình mua hộ.",
            messageId: `<${d.id}@${config.messageIdDomain}>`,
          });
          await d.ref.update({ emailState: "sent", emailSentAt: Date.now() });
        } catch {
          await d.ref.update({
            emailState: "unknown",
            emailRetryAt: Date.now() + 1800000,
          });
        }
      }
    } finally {
      transport.close();
    }
  },
);
