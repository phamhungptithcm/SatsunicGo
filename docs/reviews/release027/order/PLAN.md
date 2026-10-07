# Ask order lookup: evidence and proposed integration contract

Status: READ-ONLY discovery complete; implementation NOT_RUN. Repository Intelligence shared gate `/private/tmp/release027-intelligence.json` DEGRADED: bounded source and tests used, not indexed full coverage. No app changes or runners.

## Observed facts

- `src/features/ask/Ask.tsx:679-695` forwards the commerce/current route order ID; it does not extract an order ID typed in a customer question. FAQ fast path precedes the remote AI call.
- `functions/src/ai/ask.ts:105-135` owns authorization for optional order context, which contains stage/tracking/version/purchaseKind/remainingDue/observedAt. AI activation/model/quota are prerequisites, so this is unsuitable as the sole deterministic tracking path.
- `functions/src/order-history.ts:15-78` validates IDs and transactionally checks verified Google identity, account/staff lock and owner OR selected staff roles; response includes full order plus financial entries. Reusing this response in model context would unnecessarily broaden private data.
- `packages/domain/index.ts:165-219` defines Order. `desiredAt` is customer request input, not shipment ETA. There is no authoritative ETA field. Catalog-specific labels at lines 236-247 preserve full-upfront versus custom installments.
- `packages/domain/shipping.ts:11-24` defines Parcel with state/allocations/route/warehouse/carrier/tracking and NO ETA. `fullyDelivered` lines 74-86 requires every order line quantity delivered across parcels.
- `functions/src/shipping.ts:205-231` updates whole order delivered only after full allocation delivery; customerShipments is owner-filtered, and package events are manual. A delivered parcel must not show the entire order delivered.
- `src/features/shipping/CustomerShipments.tsx:69-74` correctly tells customers these updates are manual. `firestore.rules:7-12` permits owner reads of orders/timeline/customerShipments and no client writes.
- Existing privacy regression coverage: `tests/rules/private-read-authority026.test.ts:27-28` and `tests/rules/staff-role-array026.test.ts:250` exercise history authority; neither establishes a typed-order Ask workflow.

## Proposed smallest safe contract

Add owner-only `customerOrderTracking({orderId})` callable, independent of Gemini/quota. Verified Google, user AND staff lock checks, exact owner equality even for staff, AppCheck outside emulator, bounded ID, no writes. Missing/foreign orders return the same permission-denied outcome. Transaction returns only `{orderId, stage, purchaseKind, version, observedAt, timeline:[{action,createdAt}], shipments:[{id,state,route,carrier?,tracking?,updatedAt?}], estimate:null}`. Never return ownerId, delivery/address/contact documents, financial ledger, actor identities, notes or other-customer allocations. No address sent to AI.

Use existing `packageAllocations/{orderId}` parcelIds bounded by current shipping maximum 60 and known owner projection document IDs, NOT a first30 owner shipment scan: history beyond30 must remain discoverable. Validate owner before any shipment reads; verify each package association and omit inconsistent records instead of disclosing manifests. Verified source `functions/src/shipping.ts:123-140`: packageAllocations holds allocations and parcelIds keyed by order ID. Validate persisted array/string shapes and limit60 before dereferencing. Timeline bounded latest50 with explicit partial/history note where appropriate, chronological rendering. Parcel event time is optional only if a real persisted timestamp exists in the projection; do not invent updatedAt.

ETA is explicitly unavailable until an authorized staff/provider estimate contract exists. Display “Chưa có thời gian giao dự kiến được xác nhận” and equivalent English; never use desiredAt, inferred stage duration, competitor tariffs, or provider promises as order ETA. Root may choose a separately planned future estimate field, but this slice must ship honest null.

Root integrates deterministic typed-ID tracking BEFORE FAQ/AI/action interpretation. Exact UUID-style/generated IDs or clear explicit order-code phrase; ambiguous/multiple IDs ask to choose without arbitrary guessing. Keep active request/UID epoch fences: A→B account switch and old request completion cannot populate new account. Tracking read does not attach a foreign ID to the commerce workflow or mutate an existing draft/order. Follow-up tracking may keep explicit selected order context only within current authorized session. Anonymous customer gets login CTA and no private request.

Native compact `<ol>` progress stepper with current `aria-current=step`, visible text + decorative icons; catalog/custom paths use actual contract states, cancellation terminal, hold rendered without exposing internal hold text. Later milestones are pending, not promises; keep exact order ref accessible. Show latest actual history dates and parcel statuses with manual-update note and full-order-vs-parcel distinction. Layout 390/768/1440, keyboard, 200% zoom, reduced motion and loading/error/retry/offline/stale states. Private tracking caching is session/UID scoped and not localStorage/public shared cache; revalidate before calling current, clear on identity/logout and never substitute a cached response for ownership.

## Ownership / files

Root owns `src/features/ask/Ask.tsx`, `Commerce.tsx`, shared Ask schema, styles and exported integration `functions/src/index.ts`; no other worker edits these.
A future order implementer may own NEW `packages/domain/order-tracking.ts`, NEW `functions/src/customer-order-tracking.ts`, NEW `src/features/ask/OrderTracking.tsx`, NEW `tests/unit/order-tracking.test.ts`, NEW `tests/rules/order-tracking027.test.ts` after root concretely approves contract. Root owns native browser Ask integration scenarios. Existing domain/shipping/rules/history callables remain unchanged.

## Required validation

Pure parsing/stage tests: typed valid code, no-ID normal shopping text, punctuation, multiple ambiguous IDs, catalog payment labels, custom paths, cancellations, unknown/malformed state fail closed. Emulator security: owner success, foreign/missing same denial, anonymous/unverified, locked user/staff, selected staff foreign denied, malformed ID, no ledger/address/other-owner allocation keys, 31+ preserved histories, multipart partial delivery and no writes. Native happy: typed own order question renders actual timeline without AI enabled; follow-up current order; full and split-delivery status. Bad/race: foreign/missing, blocked auth, failed read/retry, slow response switching account/order, offline cached stale disclosure, mobile and keyboard. Actual ETA unavailable message; no live carrier/ETA claim.

Production provider tracking/ETA and real-user auth remain NOT_TESTED until authorized real environment evidence. Human all-fix authorization exists but source implementation waits for root integration plan and conflict allocation. No scripts, schema, API exports or runtime mutations by this discovery worker.
