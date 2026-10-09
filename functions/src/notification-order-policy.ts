import type { Firestore } from "firebase-admin/firestore";
import {
  notificationPreferencesSchema,
  notificationState,
  type NotificationChannel,
  type NotificationTopic,
} from "../../packages/domain/notification-preferences";
/** Informational order updates are optional; financial, security and action-required mail remains unchanged. */
export const optionalOrderEmailTemplates = new Set([
  "order_received",
  "quote_accepted",
  "change_accepted",
  "change_rejected",
  "change_applied",
  "purchase_partial",
  "purchase_completed",
  "warehouse_received",
  "final_no_balance",
  "shipment_dispatched",
  "shipment_progress",
  "delivery_estimate_changed",
  "parcel_delivered_partial",
  "order_delivered",
]);
export function notificationTopicAllowed(
  data: unknown,
  topic: NotificationTopic,
  destination: string,
) {
  const parsed = notificationPreferencesSchema.safeParse(data);
  if (!parsed.success) return false;
  const p = parsed.data;
  return (
    notificationState(p.topics[topic]) === "active" &&
    (topic === "orderSms" ? p.phone : p.email) === destination
  );
}
export function optionalOrderNotificationAllowed(
  data: unknown,
  channel: NotificationChannel,
  destination: string,
) {
  return notificationTopicAllowed(
    data,
    channel === "email" ? "orderEmail" : "orderSms",
    destination,
  );
}
/** Called again after the sender's immutable claim and immediately before provider I/O. */
export async function emailPreferenceAllowed(
  db: Firestore,
  job: Record<string, unknown>,
  recipient: string,
) {
  const templateId = (job.customerEvent as { templateId?: unknown } | undefined)
    ?.templateId;
  const topic =
    job.marketing === true
      ? "promotionsEmail"
      : typeof templateId === "string" &&
          optionalOrderEmailTemplates.has(templateId)
        ? "orderEmail"
        : null;
  if (!topic) return true;
  if (
    typeof job.ownerId !== "string" ||
    !job.ownerId ||
    job.ownerId.includes("/")
  )
    return false;
  return notificationTopicAllowed(
    (await db.doc(`notificationPreferences/${job.ownerId}`).get()).data(),
    topic,
    recipient,
  );
}
