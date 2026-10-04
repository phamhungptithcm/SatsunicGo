# SATSUNICGO-001 v1 — Full master-prompt implementation

Status: APPROVED for the documented local scope; human reply `apporved`, recorded in docs/approvals/SATSUNICGO-001-v1.md. Date: 2026-10-04 America/Chicago.

## Outcome and verified baseline

Implement all 20 sections of MASTER_PROMPT.md as one React/Vite application with public, customer and staff routes, Firebase persistence and server commands. Acceptance requires the complete purchase lifecycle and the additional membership, consolidation, support, CMS, notifications and Ask Anything workflows; scaffolding alone is incomplete.

Verified: checkout contains prompt/policy/docs only; no package.json, Firebase config or application source. Git main has no commits. Existing untracked files must be preserved. CodeGraph and CocoIndex health/index checks failed because neither project index exists: DEGRADED. Analysis uses bounded rg, direct source and policy reads. Reference image inspected. HunpeoLabs Ask TSX/CSS/route wrapper paths verified. Reference browser, exact visual baseline and provider capabilities remain NOT_RUN.

No current application callers, database or runtime contracts exist to migrate. New auth, financial and private-data paths are HIGH risk. No production target or provider account identity has been verified. Documentation approval does not authorize production mutation.

## Architecture and file ownership boundary

Use npm workspaces for root web app and functions; shared TypeScript domain package under packages/domain. Browser -> typed callable command -> current auth/App Check -> current staff rights/ownership -> Zod validation -> version/idempotency guard -> Firestore transaction -> audit/customer timeline/outbox. Provider calls occur outside retryable transaction callbacks. Customer-readable views are separate from private operations/financial/provider documents. Deny-by-default Rules; Admin SDK authorization independently checked.

Planned new/changed paths (prefixes include necessary subordinate files):

| Paths | Implementation responsibility |
| --- | --- |
| package.json, package-lock.json, index.html, vite.config.ts, tsconfig*.json, eslint.config.*, .gitignore, .env.example | Reproducible web/functions workspace, scripts, safe configuration |
| src/app/**, src/shared/**, src/styles/** | Router, shells, error boundaries, Firebase client/App Check, typed command client, locale, accessible controls, pagination, cleanup |
| src/features/auth/** | Google One Tap, popup/redirect fallback, verified Firebase session, draft retention, logout/cache cleanup |
| packages/domain/** | Money/rational FX, quote/deposit/balance, membership benefits, state guards, quantities, freight allocation, refund invariants and schemas |
| src/features/requests/**, src/features/orders/**, src/features/payments/** | Customer request/quote acceptance, invoice/receipt view, transfer evidence, timeline, balance, change approvals |
| src/features/operations/**, src/features/warehouse/**, src/features/shipping/** | Staff queues, scoped purchase claims, evidence, receiving discrepancies, packing, holds, consolidation and manual tracking |
| src/features/membership/**, src/features/business/** | Versioned plan publication, prepaid membership, grants/renewal/expiry, benefit snapshots, CSV validation/reorder/export |
| src/features/support/**, src/features/crm/**, src/features/settings/** | Customer tickets, internal notes separation, bounded CRM metrics, consent, assignments and protected settings |
| src/features/catalog/**, src/features/content/**, src/features/public/** | Published products/posts, public policies, draft/preview/schedule/archive, SEO and HTML without JavaScript |
| src/features/ask/** | Port current HunpeoLabs component/CSS mechanics; Genkit server bridge, cancellation, sources, quotas and parity ledger |
| functions/src/auth/**, functions/src/commands/** | Reusable authorization and explicitly scoped commands, no arbitrary set-status endpoint |
| functions/src/payments/**, functions/src/jobs/**, functions/src/integrations/** | Idempotent payOS adapter, verified webhook, reconciliation, outbox/email/carrier interfaces, scheduled work and recovery |
| functions/src/ai/** | Genkit/Gemini narrow tools, permission/context isolation, quotas, safe draft confirmation |
| firebase.json, firestore.rules, firestore.indexes.json, storage.rules, functions/package.json, functions/tsconfig.json | Emulator and Hosting/functions configuration, CSP/security headers, indexes, private file boundaries |
| scripts/**, tests/**, playwright.config.*, vitest.config.*, .github/workflows/** | Guarded emulator seed/reset/owner bootstrap, tests, prerender, CI if GitHub remote verified |
| docs/** | Requirement/evidence matrix, architecture, permissions, runbooks, pricing, deployment/rollback, external blockers and reviews |

Do not edit managed kit generated files directly, unrelated HunpeoLabs files, existing prompt requirements or repository security/approval policy. Generated build output comes from source/scripts. New dependencies are restricted to the stack named in MASTER_PROMPT.md, accessible component/icon utilities, exact-decimal arithmetic, sanitization, provider SDK and test tooling necessary for that stack. Verify official current documentation and compatible versions before install; commit lockfile only when a commit is authorized/appropriate. A second framework/database/provider AI stack or new deployment topology requires delta approval.

## Data boundaries and server-command contracts

All mutable entities have version and server actor/timestamps. Commands accept operationId and expectedVersion; duplicates return prior durable outcome, conflicting reuse fails. Request payloads never grant identities, staff access or authoritative money.

- users, addresses, staffAccess: safe customer profile fields, immutable owner IDs; staffAccess server-owned, checked on every command, locked account denied. Privileged recent-auth checks and financial 2FA verification before live launch.
- orders and customerTimeline: owner-visible projection, items and independent procurement/payment/shipping progress. orderOperations holds supplier receipts, margin, staff notes and assignments separately.
- quotes and quote acceptance snapshots: immutable accepted terms/rates/benefits; reject expired/superseded versions. Commands submitRequest, issueQuote, acceptQuote, proposeChange, acceptChange.
- invoices and append-only financialEntries: integer money and currency metadata; deposit ceil(total/2), finalDue from approved charges less credits/net confirmed collection. Commands requestTransferReview, verifyTransfer, createPaymentLink, requestRefund, confirmRefund; unique bank/provider allocation guards and atomic refund reservation prevent double allocation/over-refund.
- purchaseRecords, packages, consolidationBatches, customerShipments: quantity allocations immutable when finalized; claimPurchase, recordPurchase, receiveItems, packPackage, approveFinalCharges, finalizeBatch, dispatchPackage, recordTracking. Dispatch rechecks balance/hold/checklist/approval and allocated quantities in one transaction, including every batch member.
- membershipPlans/subscriptions/history: published config only, prepaid activation on confirmed funds or audited authorized grant; quote benefit snapshot remains unchanged after expiry. Commands publishPlan, purchaseMembership, grantMembership, cancelRenewalIntent.
- products/posts/campaigns: draft/published/scheduled/archived versions, sanitized content, trusted media, public projections and publication-triggered HTML/metadata regeneration. Commands saveDraft, publishContent, scheduleContent, archiveContent; marketing dispatch requires consent.
- supportTickets/messages versus internalNotes: ownership/role checked independently; audited assignment and real ticket creation.
- settings, auditEvents, idempotencyKeys, webhookReceipts, outboxJobs: private server-managed records; no client mutation of finance/audit/access. Minimal filtered audit, bounded retained context.

Firestore/Storage client Rules enforce ownership, immutable identity, field/type allowlists and published-only public access; privileged writes server-only. Private uploads use validated MIME/content/size and authorized retrieval, no permanent public tokens. Rules and server tests use two customers, all roles, assignments, locked accounts and revoked rights.

## Execution sequence and completion gates

A. Foundations: workspace/dependency lock, emulator, domain/schema, default-deny Rules, Google auth, public/customer/staff shells, error/offline behavior. Establish local start and test entry points. Build UI with natural Vietnamese and English message structure.

B. End-to-end trade: request -> verified versioned quote -> customer acceptance -> 50% deposit request -> finance confirmation -> claimed manual purchase -> receive/pack -> final-charge approval -> balance verification -> dispatch/tracking/delivery. Include cancellation, substitution, partial quantities, refund, reversal, overpayment, stale tabs and duplicate/concurrent operations. Verify exact 2,000,000 / 1,000,000 / 2,160,000 case gives 1,160,000 due.

C. Membership/business/consolidation/support/CRM: real persisted flows and role tests; freight sums conserved; unpaid or held members excluded from dispatch; paid membership never funds an order. CSV validation/formula escaping, privacy-safe exports.

D. Catalog/CMS/notifications/Ask: complete publication and static HTML metadata update; outbox retry and idempotent provider delivery; publish policies only after owner approval. Capture immutable HunpeoLabs file hashes/commit, browser states and motion; port interaction mechanics into React Router and prove parity at 390/768/1440px. Genkit tools cannot spend, refund, mark paid or change access; model failure preserves core transaction UI.

E. Verification/release preparation: clean install, lint/typecheck/unit/Rules/server integration/e2e, security and content reviews, screenshots/video, isolated restore/rollback tests where resources allow. Repeat final review/fix/verify until current review passes. Prepare deployment artifact and protected environment; production deploy remains separately authorized.

## Tests, risk and failure behavior

Planned commands: npm ci, npm run typecheck, npm run lint, npm test, npm run test:rules, npm run test:integration, npm run test:e2e, npm run build. These are planned scripts, not commands claimed to exist yet.

All 12 MASTER_PROMPT section-18 scenarios map to individual test IDs and evidence. Property tests check money safety/rounding, freight conservation, refundable balance and quantity conservation. Emulator integration proves transaction conflicts, duplicate callback/operation handling and revoked access. Provider contract doubles are labeled doubles, never live acceptance. Direct malicious API/Rules calls supplement route guards. Browser keyboard, narrow/long copy, dialog focus and cancellation, mobile keyboard, network failures, reduced motion and reference visual/motion parity are separate gates.

External timeout after payment intent is unknown outcome; recovery queries provider before creating again. Return URL never marks paid. Outbox retries never roll back confirmed payment. Offline financial/shipping actions blocked; no optimistic success. Logging excludes addresses, receipts, model transcript, credentials and raw provider payload. Resource queries/listeners bounded; max instances/concurrency and AI quotas set independently from finance paths.

Selected profiles: universal, typescript-javascript, frontend-html-css, web-app, api, database, concurrency, product-content, infrastructure/devops for Firebase/CI. Product-content skill mandatory during UI work with eight principles and rendered-state evidence. No generic Apple control assumptions on web.

## Unknowns, assumptions and external gates

VI default, VND collection, US/JP/KR origins, one business and one business-account owner are master-prompt assumptions and configurable. Region, dev/staging/prod Firebase identity, OAuth client/origins, payOS merchant, beneficiary, email sender, model access, carrier, approved fees/rates/terms, retention and staff identities remain unverified. Do not read secrets to infer authority. Configure blank fail-closed adapters; credentials unavailable => BLOCKED_EXTERNAL, independent implementation continues. No fabricated price, inventory, payments, delivery promises or production fixtures.

Architecture alternatives: preserve requested Firebase/Vite instead of adding Next/server/database; manual authenticated transfer verification is required operational flow while payOS is separately gated; static public prerender with publication coordination avoids a second framework. Trade-off: more explicit command/projection code; justified by financial privacy and authority requirements. SEO pipeline details finalized against current Hosting documentation before implementation; material topology change requires delta approval.

Rollback: backward-compatible additive contracts, versioned snapshots, release artifact retention and Hosting revert; isolate emulator reset/seed, no production deletion or payment-event replay. There is no existing data migration. Backup/restore operations require isolated targets and verified permissions.

## Approval decision

Approve SATSUNICGO-001 v1 for local implementation across the paths and stages above, dependency setup, emulator/dev fixtures, tests and release preparation. Constraints: preserve unrelated WIP; no real purchase/payment/refund, external marketing, production mutation, billing enablement, secret access, public deployment or push without separate authority. Material additional dependencies, paths, contracts, security or topology changes require a reviewed delta. The agent must record the human reply with task reference and approved scope; approval cannot be self-assigned.
