import { createHash } from "node:crypto";
import { quoteTotal, type Order } from "../../packages/domain";
import {
  parseCustomerEvent,
  type CustomerEvent,
  type CustomerTemplateId,
  type CustomerPayload,
} from "../../packages/domain/customer-notification";
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b, "en"))
            .map(([key, item]) => [key, canonical(item)]),
        )
      : value;
export const customerSnapshotHash = (event: CustomerEvent) =>
  createHash("sha256")
    .update(JSON.stringify(canonical(event)))
    .digest("hex");
type EventContext = {
  ownerId: string;
  entityId: string;
  entityVersion: number;
  occurredAt: number;
  orderId?: string;
};
export function customerEvent<K extends CustomerTemplateId>(
  templateId: K,
  context: EventContext,
  payload: CustomerPayload<K>,
): CustomerEvent {
  const eventId = createHash("sha256")
    .update(
      JSON.stringify([
        context.ownerId,
        context.entityId,
        context.entityVersion,
        templateId,
      ]),
    )
    .digest("hex");
  return parseCustomerEvent({
    schemaVersion: 1,
    templateVersion: 2,
    templateId,
    ...context,
    eventId,
    payload,
  });
}
/** Notification formatting must never prevent an authoritative financial write. */
export function customerEventFields(
  build: () => CustomerEvent,
): Record<string, unknown> {
  try {
    const event = build();
    return {
      customerEvent: event,
      customerSnapshotHash: customerSnapshotHash(event),
      emailState: "blocked_policy",
      emailAttempts: 0,
    };
  } catch {
    // No raw payload or recipient in diagnostics. Inbox legacy action remains usable.
    return {
      customerContentState: "blocked_invalid_snapshot",
      emailState: "blocked_content",
    };
  }
}
const itemSummary = (order: Order) =>
  order.items
    .map((i) => `${i.quantity} × ${i.name}`)
    .join("; ")
    .slice(0, 1000);
/** Only committed public facts. Operational notes and bank references are excluded. */
export function orderCustomerEvent(
  action: string,
  order: Order,
  now: number,
  amount?: number,
): CustomerEvent | null {
  const c = {
    ownerId: order.ownerId,
    entityId: order.id,
    entityVersion: order.version,
    orderId: order.id,
    occurredAt: now,
  };
  const ref = { orderRef: order.id };
  switch (action) {
    case "submitRequest":
      return customerEvent("request_received", c, ref);
    case "issueQuote":
      return order.quote
        ? customerEvent("quote_ready", c, {
            ...ref,
            quotedTotal: quoteTotal(order.quote),
          })
        : null;
    case "acceptQuote":
      return order.quote
        ? customerEvent("quote_accepted", c, {
            ...ref,
            quotedTotal: quoteTotal(order.quote),
          })
        : null;
    case "transferReview":
      return customerEvent("payment_reported", c, ref);
    case "verifyTransfer":
      return amount === undefined
        ? null
        : customerEvent("payment_confirmed", c, {
            ...ref,
            paidAmount: amount,
            paymentScope: "legacy_payment",
          });
    case "refund":
      return amount === undefined
        ? null
        : customerEvent("refund_recorded", c, {
            ...ref,
            refundAmount: amount,
            refundRecordedAt: now,
          });
    case "recordPurchase": {
      const total = order.items.reduce((s, i) => s + i.quantity, 0),
        purchased = order.purchasedQuantity;
      if (purchased === total)
        return customerEvent("purchase_completed", c, {
          ...ref,
          itemSummary: itemSummary(order),
        });
      if (purchased !== undefined)
        return customerEvent("purchase_partial", c, {
          ...ref,
          purchasedSummary: `${purchased} sản phẩm`,
          remainingSummary: `${total - purchased} sản phẩm chưa mua`,
        });
      return null;
    }
    case "receive":
      if (
        !Number.isSafeInteger(order.receivedQuantity) ||
        order.receivedQuantity! <= 0
      )
        return null;
      return order.hold
        ? customerEvent("warehouse_issue", c, {
            ...ref,
            customerReason: "Số lượng hoặc tình trạng hàng nhận cần kiểm tra",
            nextStep: "Bạn mở đơn để xem chi tiết và trao đổi với bên mình.",
          })
        : customerEvent("warehouse_received", c, {
            ...ref,
            receivedSummary: `${order.receivedQuantity} sản phẩm`,
          });
    case "finalize":
    case "approveFinal": {
      if (
        !order.finalApproved ||
        order.finalTotal === undefined ||
        order.refundReserved ||
        order.hold
      )
        return null;
      const net = order.collected - order.refunded,
        due = order.finalTotal - net;
      if (due > 0)
        return customerEvent("final_balance_due", c, {
          ...ref,
          finalTotal: order.finalTotal,
          netPaid: net,
          balanceDue: due,
        });
      if (due < 0)
        return customerEvent("excess_payment_review", c, {
          ...ref,
          excessAmount: -due,
        });
      return customerEvent("final_no_balance", c, {
        ...ref,
        finalTotal: order.finalTotal,
        zeroAmount: 0,
      });
    }
    case "hold":
      return order.hold
        ? customerEvent("order_hold", c, {
            ...ref,
            customerReason: "Đơn cần được kiểm tra trước khi tiếp tục",
            nextStep: "Bạn mở đơn để xem chi tiết và trao đổi với bên mình.",
          })
        : null;
    case "track":
      return order.stage === "DELIVERED"
        ? customerEvent("order_delivered", c, ref)
        : null;
    case "cancelRequest":
      return order.stage === "CANCELLED"
        ? customerEvent("order_cancelled", c, ref)
        : null;
    default:
      return null;
  }
}
export function orderCustomerFields(
  action: string,
  order: Order,
  now: number,
  amount?: number,
) {
  try {
    const event = orderCustomerEvent(action, order, now, amount);
    if (!event)
      return {
        emailState: "blocked_policy",
        customerContentState: "no_customer_template",
      };
    return customerEventFields(() => event);
  } catch {
    return {
      emailState: "blocked_content",
      customerContentState: "blocked_invalid_snapshot",
    };
  }
}

/** One parcel event per owner; never copy another owner's allocations into the snapshot. */
export function parcelCustomerEvent(
  parcel: import("../../packages/domain/shipping").Parcel,
  orders: Order[],
  ownerId: string,
  action: string,
  now: number,
): CustomerEvent | null {
  if (!["dispatchParcel", "trackParcel"].includes(action)) return null;
  const own = orders.filter(
    (o) =>
      o.ownerId === ownerId &&
      parcel.allocations.some((a) => a.orderId === o.id),
  );
  const allocations = parcel.allocations.filter((a) =>
    own.some((o) => o.id === a.orderId),
  );
  if (!own.length || !allocations.length) return null;
  const first = own[0],
    c = {
      ownerId,
      entityId: parcel.id,
      entityVersion: parcel.version,
      occurredAt: now,
      orderId: first.id,
    };
  const refs = {
    orderRef: own.length === 1 ? first.id : `${own.length} đơn · ${parcel.id}`,
    parcelRef: parcel.id,
  };
  const parcelItems = allocations
    .map(
      (a) =>
        `${a.quantity} × ${own.find((o) => o.id === a.orderId)!.items[a.line].name}`,
    )
    .join("; ")
    .slice(0, 1000);
  if (action === "dispatchParcel")
    return parcel.carrier && parcel.tracking
      ? customerEvent("shipment_dispatched", c, {
          ...refs,
          carrierName: parcel.carrier,
          trackingCode: parcel.tracking,
          parcelItems,
        })
      : null;
  switch (parcel.state) {
    case "failed":
      return customerEvent("delivery_failed", c, {
        ...refs,
        customerReason: "Kiện hàng được ghi nhận chưa giao được",
        nextStep: "Bạn mở đơn để trao đổi hướng xử lý với bên mình.",
      });
    case "returned":
      return customerEvent("shipment_returned", c, refs);
    case "delivered":
      return own.every((o) => o.stage === "DELIVERED")
        ? customerEvent("order_delivered", c, { orderRef: refs.orderRef })
        : customerEvent("parcel_delivered_partial", c, {
            ...refs,
            parcelItems,
            remainingSummary:
              "Phần hàng chưa giao đủ được theo dõi trong từng đơn",
          });
    case "in_transit":
      return customerEvent("shipment_progress", c, {
        ...refs,
        trackingSummary: "Kiện hàng đang được vận chuyển",
        observedAt: now,
      });
    default:
      return null;
  }
}
