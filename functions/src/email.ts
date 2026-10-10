import { emailPreferenceAllowed } from "./notification-order-policy";
import { createHash } from "node:crypto";
import { prepareCustomerEmail } from "./customer-email-job";
import { customerEvent } from "./customer-notification-events";
import {
  releaseCapabilityAllowed,
  emailProductionEnvironmentAllowed,
} from "./provider-release-gate";
import {
  parseEmailProviderConfig,
  emailProviderReady,
} from "./email/provider-config";
import { dispatchResend, emailRequestIdentity } from "./email/dispatch";
import { isDeepStrictEqual } from "node:util";
import { randomUUID } from "node:crypto";
import { getAuth } from "firebase-admin/auth";
import { defineSecret } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { warn } from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { renderCustomerEmail } from "./email-content";
import { productionTestEmailAllowed } from "./production-test-email-policy";
import {
  isPurchaseTestRecord,
  purchaseExecutionFields,
} from "./purchase-test-boundary";
const password = defineSecret("SFTP_PASSWORD");
export const deliverEmail = onSchedule(
  {
    schedule: "every 30 minutes",
    region: "asia-southeast1",
    maxInstances: 1,
    timeoutSeconds: 300,
    secrets: [password],
  },
  async () => {
    if (!emailProductionEnvironmentAllowed(process.env)) return;
    const db = getFirestore();
    if (
      !releaseCapabilityAllowed(
        "email",
        process.env,
        Reflect.get(db, "projectId"),
      )
    )
      return;
    const config = parseEmailProviderConfig(
      (await db.doc("settings/email").get()).data(),
    );
    if (!emailProviderReady(config)) return;
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
    for (const d of rows.docs) {
      const claimId = randomUUID();
      const scanned = d.data();
      const claimed = await db
        .runTransaction(async (tx) => {
          const s = await tx.get(d.ref);
          if (s.data()?.emailState !== "queued") return null;
          if ((s.data()?.emailAttempts ?? 0) >= 3) {
            tx.update(d.ref, {
              emailState: "failed",
              failureStage: "attempts_exhausted",
              version: (s.data()?.version ?? 0) + 1,
            });
            return null;
          }
          const data = s.data()!;
          if (
            typeof data.emailRetryAt === "number" &&
            data.emailRetryAt > Date.now()
          )
            return null;
          const occurredAt = data.customerEvent?.occurredAt ?? data.createdAt;
          if (
            !Number.isSafeInteger(occurredAt) ||
            occurredAt < config.cutoverAt ||
            occurredAt > Date.now()
          ) {
            tx.update(d.ref, {
              emailState: "blocked_policy",
              version: (data.version ?? 0) + 1,
            });
            return null;
          }
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
          if (!data.customerEvent && data.action !== "invoiceIssued") {
            tx.update(d.ref, {
              emailState: "blocked_policy",
              version: (data.version ?? 0) + 1,
            });
            return null;
          }
          if (
            data.firstClaimedAt &&
            Date.now() - data.firstClaimedAt >= 86400000
          ) {
            tx.update(d.ref, {
              emailState: "unknown",
              reconciliationRequired: true,
              version: (data.version ?? 0) + 1,
            });
            return null;
          }
          tx.update(d.ref, {
            claimId,
            version: (s.data()?.version ?? 0) + 1,
            emailState: "sending",
            claimedAt: Date.now(),
          });
          return {
            ...purchaseExecutionFields(data),
            ...(isPurchaseTestRecord(data) ? { testMode: true } : {}),
            customerEvent: data.customerEvent,
            customerSnapshotHash: data.customerSnapshotHash,
            recipientHash: data.recipientHash,
            contentHash: data.contentHash,
            providerRequestIdentity: data.providerRequestIdentity,
            providerFrom: data.providerFrom,
            createdAt: data.createdAt,
            ownerId: data.ownerId as string,
            action: data.action as unknown,
            marketing: data.marketing as unknown,
            documentId:
              typeof data.documentId === "string" ? data.documentId : "",
            documentNumber: data.documentNumber as unknown,
            claimId,
          };
        })
        .catch(async () => {
          try {
            await db.runTransaction(async (tx) => {
              const latest = (await tx.get(d.ref)).data();
              if (
                (latest?.emailState === "queued" &&
                  isDeepStrictEqual(latest, scanned)) ||
                (latest?.emailState === "sending" && latest.claimId === claimId)
              )
                tx.update(d.ref, {
                  emailState: "failed",
                  failureStage: "preflight",
                  emailRetryAt: Date.now() + 1800000,
                  version: (latest.version ?? 0) + 1,
                });
            });
          } catch {
            warn("Email claim recovery unavailable", { jobId: d.id });
          }
          return null;
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
      let dispatchStarted = false;
      try {
        let identity, user;
        try {
          user = (await db.doc(`users/${claimed.ownerId}`).get()).data();
          identity = await getAuth().getUser(claimed.ownerId);
        } catch (error) {
          const permanent = [
            "auth/user-not-found",
            "auth/invalid-uid",
          ].includes((error as { code?: string } | null)?.code ?? "");
          await finish(
            permanent
              ? { emailState: "blocked_recipient" }
              : {
                  emailState: "queued",
                  failureStage: "preflight",
                  emailRetryAt: Date.now() + 1800000,
                },
          );
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
        const recipient = identity.email;
        if (claimed.action === "invoiceIssued") {
          let document;
          try {
            document = (
              await db.doc(`salesDocuments/${claimed.documentId}`).get()
            ).data();
          } catch {
            await finish({
              emailState: "failed",
              failureStage: "preflight",
              emailRetryAt: Date.now() + 1800000,
            });
            continue;
          }
          if (
            !document ||
            document.state !== "issued" ||
            document.ownerId !== claimed.ownerId ||
            document.issueNumber !== claimed.documentNumber
          ) {
            await finish({ emailState: "blocked_document" });
            continue;
          }
          if (
            !(await productionTestEmailAllowed(db, {
              ownerId: claimed.ownerId,
              recipient,
              createdAt: claimed.createdAt,
              now: Date.now(),
              kind: "invoice",
              resource: document,
              job: claimed,
            }))
          ) {
            await finish({ emailState: "blocked_policy" });
            continue;
          }
        }
        let content;
        try {
          content =
            claimed.action === "invoiceIssued"
              ? renderCustomerEmail(
                  customerEvent(
                    "internal_document_issued",
                    {
                      ownerId: claimed.ownerId,
                      entityId: claimed.documentId,
                      entityVersion: 1,
                      occurredAt: 0,
                    },
                    { documentNumber: claimed.documentNumber as string },
                  ),
                )
              : await prepareCustomerEmail(db, claimed, Date.now(), recipient);
        } catch (error) {
          const reason =
            error instanceof Error &&
            [
              "blocked_policy",
              "blocked_recipient",
              "suppressed_obsolete",
              "suppressed_preference",
            ].includes(error.message)
              ? error.message
              : error instanceof Error &&
                  /^(INVALID_|CUSTOMER_|MISSING_)/.test(error.message)
                ? "blocked_content"
                : "failed";
          await finish({
            emailState: reason,
            ...(reason === "failed"
              ? {
                  failureStage: "preflight",
                  emailRetryAt: Date.now() + 1800000,
                }
              : {}),
          });
          continue;
        }
        const recipientHash = createHash("sha256")
          .update(recipient.trim().toLowerCase())
          .digest("hex");
        const contentHash = createHash("sha256")
          .update(JSON.stringify(content))
          .digest("hex");
        const message = { from: config.from, to: recipient, ...content };
        const requestIdentity = emailRequestIdentity(message);
        if (
          (claimed.providerFrom && claimed.providerFrom !== config.from) ||
          (claimed.providerRequestIdentity &&
            claimed.providerRequestIdentity !== requestIdentity) ||
          (claimed.recipientHash && claimed.recipientHash !== recipientHash) ||
          (claimed.contentHash && claimed.contentHash !== contentHash)
        ) {
          await finish({ emailState: "unknown", reconciliationRequired: true });
          continue;
        }
        // Persist immutable recipient/body identity under the live claim before I/O.
        const pinned = await db.runTransaction(async (tx) => {
          const latest = await tx.get(d.ref);
          if (
            latest.data()?.emailState !== "sending" ||
            latest.data()?.claimId !== claimed.claimId
          )
            return false;
          tx.update(d.ref, {
            recipientHash,
            contentHash,
            providerRequestIdentity: requestIdentity,
            providerFrom: config.from,
            provider: "resend",
          });
          return true;
        });
        if (!pinned) continue;
        if (!(await emailPreferenceAllowed(db, claimed, recipient))) {
          await finish({ emailState: "suppressed_preference" });
          continue;
        }
        let preIoBlocked: string | undefined;
        const beforeSend = async () => {
          const liveConfig = parseEmailProviderConfig(
            (await db.doc("settings/email").get()).data(),
          );
          if (
            !emailProviderReady(liveConfig) ||
            liveConfig.from !== config.from ||
            liveConfig.cutoverAt !== config.cutoverAt ||
            liveConfig.dailyAttemptLimit !== config.dailyAttemptLimit
          )
            return false;
          const liveIdentity = await getAuth().getUser(claimed.ownerId);
          const liveUser = (
            await db.doc(`users/${claimed.ownerId}`).get()
          ).data();
          if (
            !liveIdentity.emailVerified ||
            liveIdentity.disabled ||
            liveIdentity.email !== recipient ||
            liveUser?.locked
          ) {
            preIoBlocked = "blocked_recipient";
            return false;
          }
          if (!(await emailPreferenceAllowed(db, claimed, recipient))) {
            preIoBlocked = "suppressed_preference";
            return false;
          }
          return db.runTransaction(async (tx) => {
            preIoBlocked = undefined;
            const latest = (await tx.get(d.ref)).data();
            if (
              latest?.emailState !== "sending" ||
              latest.claimId !== claimed.claimId ||
              latest.providerRequestIdentity !== requestIdentity ||
              latest.ownerId !== claimed.ownerId ||
              latest.action !== claimed.action ||
              latest.marketing !== claimed.marketing ||
              isPurchaseTestRecord(latest) !== isPurchaseTestRecord(claimed) ||
              !isDeepStrictEqual(
                purchaseExecutionFields(latest),
                purchaseExecutionFields(claimed),
              ) ||
              latest.providerFrom !== config.from ||
              latest.recipientHash !== recipientHash ||
              latest.contentHash !== contentHash ||
              (latest.documentId ?? "") !== claimed.documentId ||
              latest.documentNumber !== claimed.documentNumber ||
              latest.createdAt !== claimed.createdAt ||
              !isDeepStrictEqual(latest.customerEvent, claimed.customerEvent) ||
              latest.customerSnapshotHash !== claimed.customerSnapshotHash ||
              (latest.emailAttempts ?? 0) >= 3
            )
              return false;
            const currentConfig = parseEmailProviderConfig(
              (await tx.get(db.doc("settings/email"))).data(),
            );
            if (
              !emailProviderReady(currentConfig) ||
              currentConfig.from !== config.from ||
              currentConfig.cutoverAt !== config.cutoverAt ||
              currentConfig.dailyAttemptLimit !== config.dailyAttemptLimit
            )
              return false;
            const currentUser = (
              await tx.get(db.doc(`users/${claimed.ownerId}`))
            ).data();
            if (
              currentUser?.locked ||
              (claimed.marketing === true &&
                currentUser?.marketingConsent !== true)
            ) {
              preIoBlocked = "blocked_recipient";
              return false;
            }
            // This is the Firestore authorization point: resource, test policy
            // and consent are watched by the same transaction as the attempt.
            if (claimed.action !== "invoiceIssued") {
              try {
                await prepareCustomerEmail(
                  db,
                  claimed,
                  Date.now(),
                  recipient,
                  tx,
                );
              } catch (error) {
                if (
                  error instanceof Error &&
                  [
                    "blocked_policy",
                    "blocked_recipient",
                    "suppressed_obsolete",
                    "suppressed_preference",
                  ].includes(error.message)
                )
                  preIoBlocked = error.message;
                return false;
              }
            } else {
              const invoice = (
                await tx.get(db.doc(`salesDocuments/${claimed.documentId}`))
              ).data();
              if (
                invoice?.state !== "issued" ||
                invoice.ownerId !== claimed.ownerId ||
                invoice.issueNumber !== claimed.documentNumber
              ) {
                preIoBlocked = "blocked_document";
                return false;
              }
              if (
                !(await productionTestEmailAllowed(
                  db,
                  {
                    ownerId: claimed.ownerId,
                    recipient,
                    createdAt: claimed.createdAt,
                    now: Date.now(),
                    kind: "invoice",
                    resource: invoice,
                    job: claimed,
                  },
                  tx,
                ))
              ) {
                preIoBlocked = "blocked_policy";
                return false;
              }
            }
            if (
              latest.firstClaimedAt !== undefined &&
              (!Number.isSafeInteger(latest.firstClaimedAt) ||
                latest.firstClaimedAt > Date.now() ||
                Date.now() - latest.firstClaimedAt >= 86400000)
            ) {
              preIoBlocked = "unknown";
              return false;
            }
            tx.update(d.ref, {
              emailAttempts: (latest.emailAttempts ?? 0) + 1,
              firstClaimedAt: latest.firstClaimedAt ?? Date.now(),
            });
            return true;
          });
        };
        const send = () => {
          const apiKey = password.value();
          dispatchStarted = true;
          return dispatchResend({
            db,
            config,
            message,
            apiKey,
            stableJobKey: `customer/${d.id}`,
            beforeSend,
          });
        };
        let outcome = await send();
        // A short reservation collision is known-unsent; one bounded wait preserves useful batch throughput.
        if (outcome.state === "deferred" && outcome.reason === "rate_limit") {
          const delay = outcome.retryAt - Date.now();
          if (delay > 0 && delay <= 1100) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            outcome = await send();
          }
        }
        if (outcome.state === "deferred") {
          await finish(
            preIoBlocked
              ? {
                  emailState: preIoBlocked,
                  ...(preIoBlocked === "unknown"
                    ? { reconciliationRequired: true }
                    : {}),
                }
              : { emailState: "queued", emailRetryAt: outcome.retryAt },
          );
        } else if (outcome.state === "accepted") {
          await finish({
            emailState: "sent",
            providerState: "accepted",
            providerId: outcome.providerId,
            emailAcceptedAt: Date.now(),
          });
        } else if (outcome.state === "rejected") {
          await finish({
            emailState: outcome.attempted ? "rejected" : "blocked_external",
            providerState: "rejected",
            failureStage: outcome.attempted ? "provider" : "configuration",
          });
        } else {
          await finish({
            emailState: "unknown",
            providerState: "unknown",
            reconciliationRequired: true,
          });
        }
      } catch {
        try {
          await finish(
            dispatchStarted
              ? { emailState: "unknown", reconciliationRequired: true }
              : {
                  emailState: "failed",
                  failureStage: "preflight",
                  emailRetryAt: Date.now() + 1800000,
                },
          );
        } catch {
          // A persisted claim is never replayed while its outcome is unresolved.
          warn("Email outcome persistence unavailable", { jobId: d.id });
        }
      }
    }
  },
);
