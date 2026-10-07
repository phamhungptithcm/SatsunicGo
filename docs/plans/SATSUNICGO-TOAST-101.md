# SATSUNICGO-TOAST-101 — Project feedback hardening

Status: PLAN_READY, awaiting reviewed-plan approval. Supersedes Dashboard-only scope with a frontend-wide feedback audit. User request interpreted in context as project-wide toast/alert UX hardening, not unrestricted security/infrastructure remediation.

## Evidence and impact
React/TypeScript frontend has shared feedback.ts/Toast.tsx plus separate content Studio feedback components. Source search finds transient saved/sent notices mixed with persistent validation/recovery messages. A blanket role=alert/status replacement would hide important recovery, empty-state and accounting information. Current optional intelligence indexes stale; CocoIndex daemon permission error: DEGRADED with bounded source fallback. Shared worktree contains concurrent App/SiteChrome/Workspace/ContentEditor/global CSS edits; preserve and recheck before each edit.

## Implementation
1. Audit every frontend feedback occurrence in the inventory below. Record state, trigger, consumer and keep/convert decision. Confirm event handlers and async ownership against source before edits.
2. In shared/feedback.ts and Toast.tsx, verify current timer cleanup, obsolete dismissal IDs, rapid replacement, hidden-tab/hover/focus pauses, dialog portals, polite/assertive announcements, wrapping, reduced motion and non-shifting fixed positioning. Fix demonstrated defects only; preserve API compatibility and established Studio mechanisms unless consolidation is necessary and separately reviewed.
3. In inventory feature files, replace transient successful action receipts and nonblocking short action failures with existing notify at the authoritative async result/event handler. Remove duplicate inline notice/state only when exclusively transient. Retain validation near fields, persistent unavailable/partial/stale/authorization states, inline retry/actions, dangerous confirmations, and transaction reconciliation. Never convert save acceptance into fulfillment/payment success; preserve drafts, server result semantics, idempotency and access checks.
4. Do not modify authentication/MFA policy, billing/payment logic, AI integration, backend contracts, data/schema, dependencies, infrastructure or release settings. Login/MFA only audited for correct presentation; controls stay intact. Maintain unrelated concurrent edits.
5. Update focused existing regressions and add meaningful shared toast lifecycle/concurrency tests where missing. Audit expected text assertions after concurrent header changes. Run TypeScript, lint, unit suite, build and representative browser cases at desktop/mobile/text scaling, including true zero, partial, offline, retry, invalid input, permission, repeated notices, dismiss and dialog behavior.
6. Use only shared5207. Verify listener and preserve shared emulator configuration/data. Coordinate/restore that runtime only when no active owner/listener, without additional frontend servers or emulator resets. If restoration cannot be done safely, report browser gate blocked.
7. Apply write-product-content with per-string/state inventory and all eight principles. Run final-implementation-review: review -> fix in-scope finding -> affected checks -> fresh review, until every required local gate passes. Record every cycle, remaining limits, source revision and evidence. No deployment in this plan.

## Acceptance
All source feedback occurrences classified; transient receipts no longer insert layout blocks; no duplicate toast+inline receipt; errors requiring recovery remain discoverable; stale/unmounted async results do not produce misleading feedback; keyboard/focus/timer/modal behavior verified; responsive layout and text remain readable. All scoped validation and a fresh review must pass before done; production/provider claims require separate evidence.

## Candidate files (audit first; edits only where source proves a gap)
- `src/app/App.tsx`
- `src/shared/StepForm.tsx`
- `src/shared/Loading.tsx`
- `src/features/settings/Settings.tsx`
- `src/features/settings/StaffAccess.tsx`
- `src/features/payments/FinancialReview.tsx`
- `src/features/payments/Finance.tsx`
- `src/features/products/Checkout.tsx`
- `src/features/invoices/Documents.tsx`
- `src/features/ask/Ask.tsx`
- `src/features/ask/CatalogPurchase.tsx`
- `src/features/ask/ShippingQuote.tsx`
- `src/features/ask/OrderTracking.tsx`
- `src/features/ask/InlineSupport.tsx`
- `src/features/ask/Commerce.tsx`
- `src/features/ask/CatalogSearch.tsx`
- `src/features/auth/LoginChallenge.tsx`
- `src/features/auth/EmulatorLogin.tsx`
- `src/features/auth/CrmAccessScreen.tsx`
- `src/features/auth/Security.tsx`
- `src/features/crm/Dashboard.tsx`
- `src/features/crm/Activity.tsx`
- `src/features/crm/Customer.tsx`
- `src/features/crm/Customers.tsx`
- `src/features/content/ProductsCatalog.tsx`
- `src/features/content/WebsiteBanners.tsx`
- `src/features/content/BlogComments.tsx`
- `src/features/content/Campaigns.tsx`
- `src/features/content/ProductReviews.tsx`
- `src/features/content/Content.tsx`
- `src/features/content/ProductReviewModeration.tsx`
- `src/features/content/MediaUpload.tsx`
- `src/features/content/ContentEditor.tsx`
- `src/features/content/ProductSpreadsheet.tsx`
- `src/features/shipping/Shipping.tsx`
- `src/features/shipping/CustomerShipments.tsx`
- `src/features/shipping/DeliveryEstimate.tsx`
- `src/features/shipping/Consolidation.tsx`
- `src/features/shipping/ShippingRates.tsx`
- `src/features/operations/Returns.tsx`
- `src/features/operations/OperationsPresentation.tsx`
- `src/features/requests/RequestForm.tsx`
- `src/features/requests/ProductComposer.tsx`
- `src/features/requests/TransferNotice.tsx`
- `src/features/profile/Profile.tsx`
- `src/features/support/Support.tsx`
- `src/features/support/Thread.tsx`
- `src/features/support/OrderConversation.tsx`
- `src/features/orders/OrderImages.tsx`
- `src/features/orders/OrderTools.tsx`
- `src/features/orders/AccountTracking.tsx`
- `src/features/orders/Changes.tsx`
- `src/features/notifications/Notifications.tsx`
- `src/features/membership/Membership.tsx`
- `src/features/membership/ReminderSettings.tsx`
- `src/features/membership/PlanEditor.tsx`
- `src/features/content/studio/MermaidDiagram.tsx`
- `src/features/content/studio/source-account.tsx`
- `src/features/content/studio/source-settings.tsx`
- `src/features/content/studio/source-mermaid.tsx`
- `src/features/content/studio/StudioEditor.tsx`
- `src/features/content/studio/Studio.tsx`
- `src/features/content/studio/SourceStudio.tsx`
- `src/features/content/studio/source-editor.tsx`
- `src/features/content/studio/taxonomy-fields.tsx`
- `src/features/content/studio/source-dashboard.tsx`
- `src/features/content/studio/RichPreview.tsx`
- `src/features/content/studio/source-moderation.tsx`
- `src/features/content/studio/rich-editor.tsx`

Shared candidates: src/shared/feedback.ts, src/shared/Toast.tsx, shared toast styles in src/styles/, existing Studio toast hooks/components. Tests: feedback/countdown unit coverage, feature regressions under tests/unit and tests/browser. Documents: task-local approval, inventory, product-content review, final review and task report. Risk: moderate UI behavior breadth; unchanged security and persistence contracts. Rollback: revert only this task's scoped hunks, preserving concurrent WIP.
