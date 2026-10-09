import {
  optionalOrderEmailTemplates,
  optionalOrderNotificationAllowed,
} from "./notification-order-policy";
import type { Firestore } from "firebase-admin/firestore";
import {
  customerEmailEligible,
  parseCustomerEvent,
  type CustomerEvent,
} from "../../packages/domain/customer-notification";
import { customerSnapshotHash } from "./customer-notification-events";
import { renderCustomerEmail } from "./email-content";
export function customerEntityPath(event: CustomerEvent) {
  if (event.templateId.startsWith("membership_"))
    return `membershipSubscriptions/${event.entityId}`;
  if (event.templateId === "support_reply")
    return `supportTickets/${event.entityId}`;
  if (event.templateId === "receipt_ready")
    return `purchaseReceipts/${event.entityId}`;
  if (event.templateId === "payment_confirmed" && !event.orderId)
    return `purchaseCheckouts/${event.entityId}`;
  return `orders/${event.orderId ?? event.entityId}`;
}
/** Re-check immediately before network I/O. Unknown outcomes never enter this function automatically. */
export async function prepareCustomerEmail(
  db: Firestore,
  job: Record<string, unknown>,
  now: number,
  verifiedRecipient?: string,
) {
  const event = parseCustomerEvent(job.customerEvent);
  if (
    event.ownerId !== job.ownerId ||
    customerSnapshotHash(event) !== job.customerSnapshotHash ||
    !customerEmailEligible(event)
  )
    throw Error("blocked_policy");
  const [config, resource] = await Promise.all([
    db.doc("settings/customerNotifications").get(),
    db.doc(customerEntityPath(event)).get(),
  ]);
  const policy = config.data(),
    entity = resource.data();
  if (
    policy?.approved !== true ||
    policy?.emailEnabled !== true ||
    !Number.isSafeInteger(policy.cutoverAt) ||
    event.occurredAt < policy.cutoverAt
  )
    throw Error("blocked_policy");
  if (!entity || entity.ownerId !== event.ownerId)
    throw Error("blocked_recipient");
  if (event.templateId.startsWith("membership_")) {
    if (
      entity.endsAt !== (event.payload as { endsAt: number }).endsAt ||
      (event.templateId === "membership_expired"
        ? entity.state !== "expired"
        : entity.state !== "active" || entity.endsAt <= now)
    )
      throw Error("suppressed_obsolete");
  }
  if (
    [
      "quote_ready",
      "price_change_proposed",
      "change_proposed",
      "final_balance_due",
      "excess_payment_review",
      "refund_requested",
    ].includes(event.templateId) &&
    entity.version !== event.entityVersion
  )
    throw Error("suppressed_obsolete");
  if (event.templateId === "warehouse_issue" && !entity.hold)
    throw Error("suppressed_obsolete");
  if (
    event.templateId === "price_change_proposed" &&
    entity.purchaseAdjustment?.approved
  )
    throw Error("suppressed_obsolete");
  if (
    event.templateId === "payment_confirmed" &&
    !event.orderId &&
    entity.state !== "paid"
  )
    throw Error("blocked_content");
  if (
    [
      "shipment_dispatched",
      "delivery_failed",
      "shipment_returned",
      "parcel_delivered_partial",
      "order_delivered",
    ].includes(event.templateId) &&
    event.entityId !== event.orderId
  ) {
    const parcel = (
      await db.doc(`customerShipments/${event.ownerId}-${event.entityId}`).get()
    ).data();
    if (
      !parcel ||
      parcel.ownerId !== event.ownerId ||
      parcel.version !== event.entityVersion
    )
      throw Error("suppressed_obsolete");
  }
  if (optionalOrderEmailTemplates.has(event.templateId)) {
    const prefs = (
      await db.doc(`notificationPreferences/${event.ownerId}`).get()
    ).data();
    // Only explicit current preferences authorize optional updates. Never import legacy consent.
    if (
      !optionalOrderNotificationAllowed(prefs, "email", verifiedRecipient ?? "")
    )
      throw Error("suppressed_preference");
  }
  return renderCustomerEmail(event);
}
