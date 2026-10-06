import { releaseCapabilityAllowed } from "./provider-release-gate";
import { randomUUID } from "node:crypto";
import { getAuth } from "firebase-admin/auth";
import { defineSecret } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import { emailContent } from "./email-content";
const password = defineSecret("SMTP_PASSWORD");
export const deliverEmail = onSchedule(
  {
    schedule: "every 30 minutes",
    region: "asia-southeast1",
    maxInstances: 1,
    secrets: [password],
  },
  async () => {
    if (!releaseCapabilityAllowed("email", process.env)) return;
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
            version: (current.data()?.version ?? 0) + 1,
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
          const data = s.data()!;
          if (
            typeof data.ownerId !== "string" ||
            !data.ownerId ||
            data.ownerId.includes("/") ||
            data.ownerId.length > 128
          ) {
            tx.update(d.ref, {
              emailState: "blocked_recipient",
              version: (data.version ?? 0) + 1,
            });
            return null;
          }
          if (
            data.action === "invoiceIssued" &&
            (typeof data.documentId !== "string" ||
              !/^[a-zA-Z0-9_-]{1,256}$/.test(data.documentId))
          ) {
            tx.update(d.ref, {
              emailState: "blocked_document",
              version: (data.version ?? 0) + 1,
            });
            return null;
          }
          const claimId = randomUUID();
          tx.update(d.ref, {
            claimId,
            version: (s.data()?.version ?? 0) + 1,
            emailState: "sending",
            emailAttempts: (s.data()?.emailAttempts ?? 0) + 1,
            claimedAt: Date.now(),
          });
          return {
            ownerId: data.ownerId as string,
            action: data.action as unknown,
            marketing: data.marketing as unknown,
            documentId:
              typeof data.documentId === "string" ? data.documentId : "",
            documentNumber: data.documentNumber as unknown,
            claimId,
          };
        });
        if (!claimed) continue;
        async function finish(fields: Record<string, unknown>) {
          await db.runTransaction(async (tx) => {
            const latest = await tx.get(d.ref);
            if (
              latest.data()?.emailState !== "sending" ||
              latest.data()?.claimId !== claimed!.claimId
            ) {
              tx.create(db.collection("auditEvents").doc(), {
                action: "emailLateOutcome",
                resourceId: d.id,
                outcome: fields.emailState,
                createdAt: Date.now(),
              });
              return;
            }
            tx.update(d.ref, {
              ...fields,
              version: (latest.data()?.version ?? 0) + 1,
            });
          });
        }
        const user = (await db.doc(`users/${claimed.ownerId}`).get()).data();
        let identity;
        try {
          identity = await getAuth().getUser(claimed.ownerId);
        } catch {
          await finish({ emailState: "blocked_recipient" });
          continue;
        }
        if (
          !identity.email ||
          !identity.emailVerified ||
          identity.disabled ||
          user?.locked ||
          (claimed.marketing === true && user?.marketingConsent !== true)
        ) {
          await finish({ emailState: "blocked_recipient" });
          continue;
        }
        if (claimed.action === "invoiceIssued") {
          const document = (
            await db.doc(`salesDocuments/${claimed.documentId}`).get()
          ).data();
          if (
            !document ||
            document.state !== "issued" ||
            document.ownerId !== claimed.ownerId ||
            document.issueNumber !== claimed.documentNumber
          ) {
            await finish({ emailState: "blocked_document" });
            continue;
          }
        }
        try {
          await transport.sendMail({
            from: config.from,
            to: identity.email,
            ...emailContent(claimed.action, claimed.documentNumber),
            messageId: `<${d.id}@${config.messageIdDomain}>`,
          });
          await finish({ emailState: "sent", emailSentAt: Date.now() });
        } catch {
          await finish({
            emailState: "unknown",
            reconciliationRequired: true,
            emailRetryAt: Date.now() + 1800000,
          });
        }
      }
    } finally {
      transport.close();
    }
  },
);
