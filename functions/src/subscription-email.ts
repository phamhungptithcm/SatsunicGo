import { getFirestore } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { warn } from "firebase-functions/logger";
import {
  parseEmailProviderConfig,
  emailProviderReady,
} from "./email/provider-config";
import { dispatchResend, emailRequestIdentity } from "./email/dispatch";
import {
  releaseCapabilityAllowed,
  emailProductionEnvironmentAllowed,
} from "./provider-release-gate";
import { CUSTOMER_EMAIL_ORIGIN } from "./email-content";
import { subscriptionIdentity } from "./notification-preferences";
import {
  deliverSubscriptionJob,
  type SubscriptionSender,
} from "./subscription-delivery-service";
const password = defineSecret("SFTP_PASSWORD");
/** Separate queue: subscription content must never fall through the order-email renderer. */
export const deliverSubscriptionEmail = onSchedule(
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
    if (!emailProviderReady(config) || !config.subscriptionsEnabled) return;
    const deadline = Date.now() + 240_000;
    let providerBackoffUsed = false;
    const stale = await db
      .collection("notificationEmailJobs")
      .where("state", "==", "sending")
      .limit(20)
      .get();
    for (const job of stale.docs)
      await db.runTransaction(async (tx) => {
        const row = await tx.get(job.ref);
        if (
          row.data()?.state === "sending" &&
          row.data()?.startedAt < Date.now() - 900000
        )
          tx.update(job.ref, {
            state: "unknown",
            reconciliationRequired: true,
          });
      });
    const rows = await db
      .collection("notificationEmailJobs")
      .where("state", "==", "queued")
      .limit(20)
      .get();
    const sender: SubscriptionSender = {
      available: (channel) => channel === "email" && Date.now() < deadline,
      send: async (_channel, to, content, key, authorize) => {
        if (!("html" in content) || typeof content.html !== "string")
          return "rejected";
        const message = {
          from: config.from,
          to,
          subject: content.subject,
          text: content.text,
          html: content.html,
        };
        const requestIdentity = emailRequestIdentity(message);
        let anyAttempted = false;
        const send = () =>
          dispatchResend({
            db,
            config,
            message,
            apiKey: password.value(),
            stableJobKey: key,
            beforeSend: async () => {
              const live = parseEmailProviderConfig(
                (await db.doc("settings/email").get()).data(),
              );
              return (
                emailProviderReady(live) &&
                live.subscriptionsEnabled &&
                live.cutoverAt === config.cutoverAt &&
                live.dailyAttemptLimit === config.dailyAttemptLimit &&
                Date.now() < deadline &&
                !!authorize &&
                (await authorize(requestIdentity, config.from))
              );
            },
          });
        let result = await send();
        anyAttempted ||= result.attempted;
        if (result.state === "deferred" && result.reason === "rate_limit") {
          const delay = result.retryAt - Date.now();
          if (
            delay > 0 &&
            delay <= 1100 &&
            Date.now() + delay + 10_000 < deadline
          ) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            result = await send();
            anyAttempted ||= result.attempted;
          }
        }
        if (
          result.state === "deferred" &&
          result.reason === "provider_rate_limit" &&
          !providerBackoffUsed
        ) {
          const delay = result.retryAt - Date.now();
          // Keep the same token/body only in memory for one finite retry; never reconstruct an attempted body.
          if (
            delay > 0 &&
            delay <= 60_000 &&
            Date.now() + delay + 10_000 < deadline
          ) {
            providerBackoffUsed = true;
            await new Promise((resolve) => setTimeout(resolve, delay));
            result = await send();
            anyAttempted ||= result.attempted;
          }
        }
        if (result.state === "deferred" && anyAttempted)
          return {
            state: "rejected",
            attempted: true,
            retryAt: result.retryAt,
          };
        return result;
      },
    };
    for (const row of rows.docs) {
      if (Date.now() >= deadline) break;
      try {
        await deliverSubscriptionJob(
          db,
          "email",
          row.id,
          CUSTOMER_EMAIL_ORIGIN,
          Date.now(),
          sender,
          subscriptionIdentity,
          config.cutoverAt,
        );
      } catch {
        // Keep the durable state for retry/reconciliation; isolate one job failure.
        warn("Subscription job processing failed", { jobId: row.id });
      }
    }
  },
);
