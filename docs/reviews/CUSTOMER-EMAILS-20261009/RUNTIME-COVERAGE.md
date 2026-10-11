# Runtime template and event coverage

All 42 templates render subject/text/HTML. 37 have connected producer/explicit-document paths; 5 remain deliberately dormant. Connected does not mean email-enabled.

| Template | Producer status | Effective delivery |
| --- | --- | --- |
| `request_received` | CONNECTED | In-app; email held |
| `order_received` | DORMANT_BY_POLICY | Upfront checkout uses payment_confirmed; no duplicate unpaid order email. Legacy catalog inbox remains supported. |
| `quote_ready` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `quote_accepted` | CONNECTED | In-app; email held |
| `payment_reported` | CONNECTED | In-app; email held |
| `payment_confirmed` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `payment_review` | DORMANT_BY_POLICY | Action-required policy remains closed; checkout review feedback exists, no invented customer reason or new financial decision. |
| `payment_failed` | DORMANT_BY_POLICY | Checkout state/UI remains source; no automatic email or new failure interpretation. |
| `payment_expired` | DORMANT_BY_POLICY | Checkout state/UI remains source; no automatic email or new expiry interpretation. |
| `price_change_proposed` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `change_proposed` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `change_accepted` | CONNECTED | In-app; email held |
| `change_rejected` | CONNECTED | In-app; email held |
| `change_applied` | CONNECTED | In-app; email held |
| `order_hold` | CONNECTED | In-app; email held |
| `purchase_partial` | CONNECTED | In-app; email held |
| `purchase_completed` | CONNECTED | In-app; email held |
| `warehouse_received` | CONNECTED | In-app; email held |
| `warehouse_issue` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `final_balance_due` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `final_no_balance` | CONNECTED | In-app; email held |
| `excess_payment_review` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `shipment_dispatched` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `shipment_progress` | CONNECTED | In-app; email held |
| `delivery_estimate_changed` | DORMANT_BY_POLICY | Material-change threshold is not approved; metadata changes remain silent. |
| `delivery_failed` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `shipment_returned` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `parcel_delivered_partial` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `order_delivered` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `order_cancelled` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `refund_requested` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `refund_request_cancelled` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `refund_recorded` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `financial_adjustment` | CONNECTED | In-app; email held |
| `payment_allocated` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `order_reply` | CONNECTED | In-app; email held |
| `support_reply` | CONNECTED | In-app; email held |
| `membership_activated` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `membership_expiring` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `membership_expired` | CONNECTED | In-app + guarded email candidate; production hold remains |
| `receipt_ready` | CONNECTED | In-app; email held |
| `internal_document_issued` | CONNECTED | Explicit authorized document request only; provider hold remains |

Optional order email requires the canonical notificationPreferences schema, confirmed orderEmail generation and exact current verified Auth email at dispatch. Missing, pending, revoked, malformed or changed-destination preferences block optional order email. Promotions consent never substitutes for order-email consent. Membership notices are a separate existing service purpose; order-email opt-in is not reused as membership marketing consent. No marketing is introduced.

Conditional action-required, unread, material-ETA and optional progress mail remain disabled. Receipt ready defaults to inbox to avoid a second payment email. Sender release hold remains code-owned and unchanged.

Required financial/action notifications are classified separately by notification-order-policy.ts and retain the transactional delivery rules. Optional progress/delivery updates alone require confirmed orderEmail consent. Explicit document-request path remains separate.
