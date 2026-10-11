# Production test UI and receipt boundary

Approval: APPROVAL.json, PRODUCTION-TEST v1. Repository Intelligence Gate executed on608d2e0: DEGRADED (optional indexes absent in isolated checkout). This contribution uses bounded source tracing. No provider, secret, runtime or account mutation.

## Verified paths

- App.tsx owns account order reads/cards. Workbench.tsx consumes listWork; Customer.tsx consumes customerOverview. Warehouse-only listWork projections currently omit all test provenance.
- OperationsDetails uses readOrderOperations. The response remains role-filtered; provenance adds no recipient access.
- purchase-pdf.ts already names SePay sandbox and prints its invoice/merchant. It lacks an explicit test document header on every page.
- purchase-receipts.ts preserves private deterministic PDF storage and leased bounded retries. Its email/outbox projections currently omit immutable execution provenance.
- Finance agent owns operationalDashboard aggregate, analytics-worker, order-history and server fulfillment rejection. Policy agent owns strict provenance plus conservative presentation classifier. No same-hunk edits.

## Approved implementation

Add one compact non-interactive Test marker shared by account/CRM. Retain existing blue-white-navy design system and no new motion. CRM's order-kind selector filters only the loaded page and exposes displayed/loaded count. Suppress live ActionForm fulfillment for test/unsafe-provenance records. Keep the separately simulated sourcing adjustment flow.

Expose canonical server provenance and conservative test flag in existing role-filtered read projections and receipt jobs. PDF every-page header explicitly marks test documents. Existing verified totals/method/timezone/private download validation remain.

Strict exclusions: purchase-checkout.tsx, all cart/payment components, domain/index.ts, settlement/index/release, real financial/provider/account fixtures. No additional frontend/emulator. No network or model calls.

## Validation

Use existing Vitest/React server-render tests for marker and live action suppression; negative legacy/partial provenance fixtures; extracted PDF text for multi-page marker and genuine receipt compatibility. Frontend/backend strict and scoped lint after contracts land. Product content review records all eight principles and SSR/PDF representation; actual browser viewport/keyboard/AT and hosted provider E2E remain NOT_RUN by this contribution and must be bound by root before production-ready handoff.
