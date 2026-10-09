# Analytics activation boundary

Target: project `satsunicgo`, Firestore `(default)`, region `asia-southeast1`. Never use the current gcloud default project: it is a different project.

Read-only provider checks on 2026-10-08: database is FIRESTORE_NATIVE in asia-southeast1; `gcloud firestore fields ttls list --project=satsunicgo --database='(default)' --format='json(name,ttlConfig)'` returned `[]`; v2 analytics function listing returned no functions. No provider changes were made.

## Ready source and pending release

Nine additions: `analyticsSession`, `analyticsIngest`, `analyticsLinkOrder`, `analyticsWithdraw`, `dashboardAnalytics`, `analyticsOrderChanged`, `analyticsPaymentCreated`, `analyticsJobCreated`, `analyticsCompact`. They are independent of commerce payloads and existing Ask provider behavior. Production App Check stays enforced. Default collection is off until a validated policy exists.

Declarative TTL field `expireAt` (Firestore Timestamp) and single-field index exemption are prepared for these thirteen NEW collections only:

`analyticsSessions`, `analyticsSessionRequests`, `analyticsSubjects`, `analyticsCapabilities`, `analyticsJobs`, `analyticsEvents`, `analyticsProcessed`, `analyticsLedgerReceipts`, `analyticsOrderProjections`, `analyticsAttributions`, `analyticsDays`, `analyticsDimensions`, `analyticsMembers`.

Pending jobs omit expireAt; only terminal jobs expire. Sticky loss health has no TTL. Retention is 7 days for events/completed jobs, 45 days for working/session/membership/attribution and dead jobs, 365 days for aggregate/canonical-source receipts/projections; creation aliases/quotas have shorter 1/2-day retention. Canonical orders, ledger, chat, support, audit and users have no new TTL.

Required indexes: analyticsJobs state ASC + createdAt ASC; financialEntries orderId ASC + createdAt ASC. Existing indexes must be compared to provider before activation; never approve deletion of an unrelated provider index.

## Controlled sequence

1. Finish current source review and verify exact scope. Preserve unrelated dirty Ask work. Produce a clean isolated release source/artifact containing only the approved integration and bind checks to its hash; the shared `dist` build includes unrelated WIP and is NOT a release candidate.
2. Obtain the separately scoped production rollout decision, excluded by v1. The user's latest wording authorizes new analytics TTL/tracking; it does not broaden release to unrelated WIP or authorize IAM, historical backfill or canonical-source deletion.
3. Confirm new collection ownership/field types and provider state without exposing customer content. Apply the two additive composite indexes and thirteen field policies only, preserving all existing provider objects. TTL activation is asynchronous: requesting it is not an ACTIVE readback or a deletion guarantee.
4. Deploy exactly the nine named analytics functions from the isolated reviewed backend artifact, and the corresponding tested frontend artifact. Use explicit project, verify ACTIVE functions/triggers/scheduler/App Check and indexes READY. Do not use broad functions deployment from this shared checkout.
5. Set the analytics-owned config only after dependencies are verified: `analyticsConfig/current = {enabled:true, startedAt:<activation UTC milliseconds>}`. Preserve a known earlier collection start if collection is ever paused/resumed; do not reset historical coverage to the resume time. No backfill.
6. Verify refusal sends no events; opt-in public visit/product selection/Ask safe topic reaches events, workers and dashboard. Verify a genuinely owned eligible purchase with a canonical confirmed payment. No fake product/payment mutation to manufacture evidence. Verify finance segregation, backlog, no raw query or full URL, and TTL ACTIVE per collection.
7. Record provider/source/artifact hashes, as-of and gaps. Activation remains NOT_VERIFIED until readback. A small synthetic local burst is not a production SLO.

Rollback: turn collection off through the analytics config, retain canonical sources, preserve pending jobs for reconciliation, restore prior reviewed Hosting artifact. Do not delete source orders/ledger or purge analytics collections. Finance history remains authoritative.

Remaining gates: isolated release artifact, production rollout authorization, actual callable/trigger/App Check integration and authenticated full-app acceptance, provider TTL ACTIVE readback, production performance/monitoring validation. This document is a concrete scoped release procedure, not evidence that rollout happened.
