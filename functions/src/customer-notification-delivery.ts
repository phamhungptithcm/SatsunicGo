import { releaseCapabilityAllowed } from "./provider-release-gate";
import {
  parseEmailProviderConfig,
  emailProviderReady,
} from "./email/provider-config";
import { customerEntityPath } from "./customer-email-job";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import {
  customerEmailCatalog,
  customerEmailEligible,
  customerEventTarget,
  parseCustomerEvent,
} from "../../packages/domain/customer-notification";
import { customerSnapshotHash } from "./customer-notification-events";
import { renderCustomerEmail } from "./email-content";
import {
  matchingPurchaseExecution,
  purchaseExecutionFields,
} from "./purchase-test-boundary";
/** Same transaction for trigger and bounded scheduled recovery. No provider delivery here. */
export async function projectCustomerNotification(
  db: Firestore,
  id: string,
  now: number,
) {
  const ref = db.doc(`outboxJobs/${id}`);
  return db.runTransaction(async (tx) => {
    const row = await tx.get(ref),
      job = row.data();
    if (job?.state !== "queued" || !job.customerEvent) return false;
    let event;
    try {
      event = parseCustomerEvent(job.customerEvent);
      if (
        event.ownerId !== job.ownerId ||
        customerSnapshotHash(event) !== job.customerSnapshotHash
      )
        throw Error("SNAPSHOT_MISMATCH");
      renderCustomerEmail(event);
    } catch {
      tx.update(ref, {
        state: "blocked_content",
        emailState: "blocked_content",
        customerContentState: "invalid_snapshot",
      });
      return true;
    }
    const [user, entity, policy, transport] = await tx.getAll(
      db.doc(`users/${event.ownerId}`),
      db.doc(customerEntityPath(event)),
      db.doc("settings/customerNotifications"),
      db.doc("settings/email"),
    );
    if (
      !entity.exists ||
      entity.data()?.ownerId !== event.ownerId ||
      user.data()?.locked
    ) {
      tx.update(ref, {
        state: "blocked_recipient",
        emailState: "blocked_recipient",
      });
      return true;
    }
    let execution;
    try {
      if (!matchingPurchaseExecution(entity.data(), job))
        throw Error("EXECUTION_MISMATCH");
      execution = purchaseExecutionFields(entity.data());
    } catch {
      tx.update(ref, {
        state: "blocked_content",
        emailState: "blocked_content",
        customerContentState: "invalid_execution",
      });
      return true;
    }
    const settings = policy.data();
    // Independent cutover prevents configuration from draining the historical outbox.
    const eligible =
      settings?.approved === true &&
      settings?.emailEnabled === true &&
      Number.isSafeInteger(settings.cutoverAt) &&
      event.occurredAt >= settings.cutoverAt &&
      event.occurredAt <= now &&
      customerEmailEligible(event);
    const provider = parseEmailProviderConfig(transport.data());
    const queueReady =
      eligible &&
      emailProviderReady(provider) &&
      provider!.cutoverAt === settings.cutoverAt &&
      releaseCapabilityAllowed(
        "email",
        process.env,
        Reflect.get(db, "projectId"),
      );
    tx.create(db.doc(`notifications/${id}`), {
      ownerId: event.ownerId,
      orderId: event.orderId ?? null,
      resourceId: event.entityId,
      action: job.action,
      templateId: event.templateId,
      title: customerEmailCatalog[event.templateId].heading,
      targetPath: customerEventTarget(event),
      targetLabel: customerEmailCatalog[event.templateId].ctaLabel,
      createdAt: event.occurredAt,
      read: false,
      ...execution,
    });
    tx.update(ref, {
      state: "inAppDelivered",
      deliveredAt: now,
      emailState: queueReady
        ? "queued"
        : eligible
          ? "blocked_external"
          : "blocked_policy",
    });
    return true;
  });
}
export const customerNotificationCreated = onDocumentCreated(
  {
    document: "outboxJobs/{jobId}",
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 4,
    retry: true,
  },
  async (event) => {
    if (event.data?.data()?.customerEvent)
      await projectCustomerNotification(
        getFirestore(),
        event.params.jobId,
        Date.now(),
      );
  },
);
