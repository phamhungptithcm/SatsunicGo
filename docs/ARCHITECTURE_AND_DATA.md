# Architecture and data boundaries

One React/TypeScript/Vite application with public, customer and lazy staff routes. Shared domain modules implement integer pricing, lifecycle, changes, shipping/consolidation, CSV and upload validation. Firebase Functions v2 enforce identity/current rights before authoritative writes. Firestore transactions bind version checks, idempotency hashes, business state and immutable financial/audit records. Firestore/Storage Rules default deny; customer reads require ownership. Admin SDK authorization is explicit in handlers.

| Data paths | Access / query |
| --- | --- |
| users, addresses, orders and quote/acceptance/timeline subcollections | Own customer projections; bounded listeners; writes through commands |
| staffAccess, settings, orderOperations, purchase evidence, internal notes | Current authorized server handlers; not customer-readable |
| customerShipments, orderChanges, notifications | Own projections; no full batch manifest |
| packages, packageAllocations, consolidationBatches | Authorized operations commands; atomic quantity/allocation guards |
| financialEntries, bankTransactions, payment intents/receipts/exceptions | Finance/provider server paths; immutable entries and deduplication |
| membershipPlans, membershipSubscriptions, membershipInvoices/history | Published plans and own membership; finance/access command guards |
| products, posts, campaigns, media | Published public content only; content staff mutations/version history; public image rechecks parent publication |
| supportTickets/messages, CRM notes | Customer-owned thread or authorized staff; private notes separate |
| idempotencyKeys, auditEvents, outboxJobs, aiQuota | Server-only; bounded scheduled work |

Inspect firestore.rules, storage.rules, firestore.indexes.json and functions/src for exact contracts; these names are not a promise of generic CRUD. Entity conventions vary by existing contract; full metadata-uniformity audit remains open. Customer shipping addresses and accepted quotes are snapshots. UI hiding is not an authorization boundary. Pagination/cursor coverage and derived-summary reconciliation need full acceptance beyond bounded current reads.
