# Backend production prerequisites — RELEASE-LOCAL-20261009

Status: **NOT_READY for production acceptance.** Source release can preserve the current fail-closed capabilities, subject to fresh broad-source quality gates and exact-artifact/provider verification. Pushing main starts the release workflow; it does not prove configuration, rules, indexes, payment capability or customer AI readiness. No production configuration was inspected or changed by this audit.

Scope: source-only backend/release review under `INTELLIGENCE-BRIEF.md`. Repository intelligence is **DEGRADED** because the shared CodeGraph/CocoIndex indexes are stale; bounded source reads and JSON parsing were used. Root remains sole source/Git/deployment executor. Tests, provider readback, IAM/API checks, paid calls, runtime/data changes and deployment are **NOT_RUN** here. Prior Ask candidate checks do not certify this broader source. This document is the only write; other work and all release holds are preserved.

## 1. What main actually deploys

`.github/workflows/release.yml:1-23,159-175` triggers on main, runs reusable CI, creates one immutable artifact and promotes **functions:satsunicgo,hosting**. CI includes typecheck, lint, Vitest, release tests, rules integration, HTTP/restore and the high-severity production dependency audit (`ci.yml:35-48`). The artifact uses the tested root dependency lock for the standalone Functions package (`artifact.mjs:192-204`), verifies source/Hosting hashes and prevents implicit function removal (`verify-production.mjs:18-29`). Fresh evidence must bind to the final broad commit/artifact; a prior candidate, successful build or HTTP200 is insufficient.

The artifact's deployment configuration contains Functions/Hosting only (`artifact.mjs:28-36,208-209`). Although repository `firebase.json` declares Firestore rules/indexes and Storage rules, **main does not promote those files**. Its after-readback verifies Functions/Hosting, not deployed rules/index readiness/TTL/configuration.

Eight exports are excluded from the artifact: `askWorkflow`, `currentAskConversation`, `maintenance`, `createPaymentLink`, `payosWebhook`, `reconcilePayments`, `deliverEmail`, `askFeedbackCleanup` (`artifact.mjs:78-81,145-168`). Unsupported compiled hold shapes fail closed. `provider-release-gate.ts:1-31` additionally makes production AI/email/payments/maintenance capability enablement unavailable through Firestore settings. The deployed `ask` callable has its own deterministic knowledge and constrained pilot path; the code-owned AI flag is not a blanket switch for every Ask export.

**Before-promotion blocker:** a previously deployed codebase export absent from the held artifact triggers `FUNCTION_REMOVAL_OR_DUPLICATE_BLOCKED`, including an already-deployed held scheduler. Excluding a scheduler from a new package does not disable an existing deployment. Root must compare the exact manifest against current provider inventory; do not delete or bypass this guard to obtain a green release.

## 2. Concrete export → client → prerequisite mapping

| Current export family | Actual consumer / behavior | Required admission and production prerequisite |
| --- | --- | --- |
| `command`; `workspaceCommand`, `listWork`, `ticketMessages`, `readOwnerConfiguration`, `readStaffAccess`, `readOrderOperations`; CRM/operational reads | `src/shared/firebase.ts` RPC adapter; request/account, staff CRM and Settings | Verified Google current-session provider and verified email; unlocked user/staff; action roles, OWNER recent MFA for protected changes, operation UUID/hash and expected version. `workspaceCommand` supports concrete actions, not arbitrary settings writes. `settings/pricing` is the legacy custom-request FX/terms config. Queue/CRM compound-query indexes must be deployed, not merely present locally. Sources: `index.ts:45-125`, `workspace.ts:333-430,598-623,812-861`, `auth/guards.ts:12-48`, `crm.ts:76-82,131-137,175-178,250-253`. |
| `ask` | `src/features/ask/transport.ts:93-99`; frontend Ask service | App Check and verified Google; deterministic `approvedKnowledgeAnswer` first. Production project then calls OWNER pilot; missing approved evidence is not permission to use a general customer model. Sources: `ai/ask.ts:55-104`; see section3. |
| Held `askWorkflow`, `currentAskConversation` | `Commerce.tsx:296,594,715,783` conversation read/prepare/confirm and durable Ask state | Not enabled by this artifact. Existing client consumers must retain unavailable/recovery states; this release cannot claim durable production Ask workflow completion from mocked acceptance. |
| `askKnowledgePreview`, `askKnowledgeCommand` | `Settings/KnowledgeApproval.tsx:72,133` | Actual OWNER/recent-MFA preview → `approve`/`revoke` commands, source publication/hash, locale, effective interval, operation/approval version. No invented official source approval. `askKnowledge` active lookup is single-field; source/sourceId point reads are transactionally rechecked. Sources: `approved-knowledge.ts:114-186,318-412`, `packages/domain/ask-knowledge.ts:24-78`. |
| `askResearchCommand`, `askResearchSearch`, `askResearchSelect` | `WebResearch.tsx:82,108`, reviewed offer selection | `settings/askResearch` strict enabled/version/expiry/merchant-host-kind-market-seller policy; OWNER approves/revokes each offer through the existing command. Reviewed offers are distinct from paid web discovery. Search is bounded (101 offers), and select checks current catalog and coherent owner/conversation versions. Sources: `ai/research.ts:54-77,218,290-291`; `packages/domain/ask-research.ts:11-38,101-115`. |
| `askWebDiscovery`, `askWebSelect` | `Ask.tsx:1848,1081`; `WebDiscovery.tsx:97` | Additional strict `settings/askWebDiscovery`, matched merchant-policy version, reviewed terms, budget-import hash, existing lifetime ledger and no pending conversation operation. Paid transport fixed to satsunicgo/us-central1/gemini-2.5-flash-lite; callable region asia-southeast1. No admissible new paid request within the current fully reserved budget; section3. |
| `askFeedbackPolicy`, `askFeedback`, `askFeedbackWithdraw`, `askFeedbackInbox`, `askFeedbackReview`, `askFeedbackEvaluation`; held `askFeedbackCleanup` | `AnswerFeedback.tsx:50,131,176`; `FeedbackReview.tsx:97,106,130` | Valid approved retention policy, explicit consent, owner/current conversation+answer/policy version, fresh submit timestamp, quota and operation identity. Review/evaluation require OWNER/recent MFA and approved current source/holdout. Read policy is not a policy writer. Cleanup remains held; section4. |
| `customerSaveResolve`; `workspaceCommand` profile/address actions; `membershipCommand` | `CustomerWorkspaceProfile`, `CustomerWorkspaceMembership`, Settings/account | Owner UID scope, expected revision/version, idempotency/recovery fences; actual published membership plan and authorized membership state. Do not initialize or overwrite a customer's profile/address/membership as a release prerequisite. `firestore.rules:15,19-25` must match the current owner reads. |
| `analyticsSession`, `analyticsIngest`, `analyticsLinkOrder`, `analyticsWithdraw`; `analyticsOrderChanged`, `analyticsPaymentCreated`, `analyticsJobCreated`, `analyticsCompact`; `dashboardAnalytics` | `src/shared/analytics.ts:166,241,277,321-366`; `AnalyticsConsent` and Dashboard | Independent affirmative consent, App Check, strict bounded non-free-text events; `analyticsConfig/current` enabled with positive safe `startedAt`. Order/financial projections read authoritative server records. OWNER/OPERATIONS_MANAGER dashboard access, FINANCE/OWNER finance data; dashboard range ≤31days. Composite analyticsJobs(state,createdAt) and13 TTL declarations require separate promotion decisions; section5. |
| `cartCommand`, `catalogCheckout` | Cart store and catalog selections; legacy catalog order creation | Verified Google/owner, current cart/product revision, published genuinely orderable product/variant and authoritative VND all-inclusive price. `catalogCheckout` can create an order but does not provide a live checkout payment adapter; held createPaymentLink cannot complete that route. Sources: `cart.ts:85`; `catalog-checkout.ts:15-75`. |
| `purchaseCheckoutSetup`, `purchaseCheckout`, `purchaseBalanceCheckout`, `purchaseOrderRead`, `purchaseSourcingChange` | `cart/purchase-checkout.tsx:120,198,269`; purchase payment/status and orders | `settings/upfrontCheckout` approved enabled effective pricing/terms/service-bps plus real USD/JPY/KRW integer rates, current `settings/purchaseRegions`, published shipping tariff and owner revision/hash checks. Production commit intentionally refuses live payment: section6. |
| `purchaseDraftImage`, `purchaseReceipt`, `purchaseReceiptWorker`, `purchaseReceiptRecovery` | `purchase-thumbnail.tsx:21`; `purchase-payment.tsx:68,120`; private draft/receipt storage | Admin bucket access, bounded validated media, owner-safe signed read/download, authoritative receipt snapshot and durable jobs. Current Storage client rule is deny-all; do not make private buckets public to enable a flow. Receipt worker/recovery are not in the maintenance hold, and production email stays pending_configuration. |
| Held `createPaymentLink`, `payosWebhook`, `reconcilePayments`, `deliverEmail`, `maintenance` | Commerce/purchase payment, outbox/notifications and maintenance | Unavailable in new artifact; flags/config cannot bypass code holds. Any later activation requires reviewed implementation/provider identity + webhook/account/currency/amount/idempotency/reconciliation evidence and approved email/retention policy. Secret names are code declarations only; no credential access was performed. |
| `shippingCommand`, `changeCommand`, `returnCommand`, `refundCommand`, `consolidationCommand`, order/history/tracking, invoice/outbox/finance reads and commands | Staff shipping/finance/operational queues; customer account/order tracking | Existing per-action roles, assigned-order restrictions, owner reads, version/transaction/financial controls. Deployed order/financial/queue indexes and private owner rules are prerequisites; release must not make financial corrections or seed production orders. |
| `publicPage`, `publicDiscovery`, `publicImage`, `campaignBannersPublic`; studio/content/comment/banner/review/media administration | Hosting rewrites in `firebase.json`; public products/posts/fees, Studio and reviews | Existing published content/media; actual publication/moderation roles and source facts. No catalog/policy/banner publication is inferred. Public shipping read can return labelled reference rates when no publication exists (`shipping-rates.ts:54-84`); purchase shipping uses published tariff only outside exact demo (`purchase-checkout.ts:153-173`). |

## 3. AI/research cannot be enabled through a prerequisite toggle

Production `ask` first allows bounded, deterministic answers from actually approved public knowledge (`ask.ts:71-79`), without paid transport. For generated answers the production branch uses `pilotAnswer` and `readServerContext`; that server context requires active/unlocked **OWNER** (`server-context.ts:89-99`). This is not a customer authorization gap to bypass.

The only pilot admin action is `workspaceCommand` action `saveAskPilotPolicy`, payload `{enabled:boolean}`, operationId and expectedVersion. It writes `settings/askPaidPilot`, binds pilotUid to the authenticated OWNER, caps the budget at10000 and expiry to the fixed pricing deadline. `readOwnerConfiguration` provides pilot/budget readiness readback. These are real existing commands (`workspace.ts:351-377,454-477,677-684,812-849`); there is no `setAskPilot` callable. `pilotLimits.pricingExpiresAt` is **2026-10-08T00:00:00Z** (`ask-pilot.ts:13-25`); settings cannot extend it. The generated customer Ask fallback's settings/aiPaidPilot and settings/ai are in the non-satsunicgo branch (`ask.ts:80-104`), not production activation authority.

Web research uses a distinct ledger: `askResearchBudget/lifetime`. Production admission requires maxBudgetVnd50000, importedReservedVnd≥50000, reservedVnd≥importedReservedVnd and an exact matching importHash before reserving another25000 (`research-live.ts:54-75,173-188`). That cannot succeed within the unchanged50000 ceiling. Fixed pricing expiry is **2026-10-09T00:00:00Z** (`research-gemini.ts:17-37,60-67`). The two prior attempts' fully reserved50000 and actualCostUnavailable remain unchanged; no resets/releases/replenishment or guessed cost. Even a new price date alone would not resolve budget authority or customer authorization.

Missing inputs for any future paid expansion: authoritative attempt-level billing reconciliation, explicitly authorized new spend envelope, current reviewed price/model/region/service terms and an approved concrete code delta. Neither current source nor this audit supplies them. Merchant settings/allowlists and source approvals likewise require actual owner-reviewed facts, not defaults.

## 4. Feedback and official knowledge admission

`settings/askFeedback` must match `{enabled,version,retentionDays:1..90,expiresAt}` (`packages/domain/ask-feedback.ts:3-10`). No exported generic feedback-policy writer exists. `askFeedbackPolicy` is read-only and refuses missing/disabled/expired values. The fact that30days is representable does not approve30days. Feedback persists category/hash/references/consent, not copied question/answer/contact/free text (`feedback.ts:104-150`).

`askFeedbackCleanup` permanently deletes expired feedback/review-operation/quota records, with bounded batches and update-time preconditions (`feedback-lifecycle.ts:195-229`); its artifact hold must remain until actual retention/activation authority exists. Existing scheduler state must be read back before promotion. Source holdout evaluation is retrieval-only, outputs REVIEW_REQUIRED/REJECTED and automaticPromotionfalse; it cannot approve corpus facts or generated semantics.

Actual official knowledge enabling uses `askKnowledgePreview` followed by approved `askKnowledgeCommand` `approve`/`revoke`, exact current publication contentHash, locale and effective interval. OWNER recent MFA and expected approval version are mandatory. Supplied business approvals may authorize only their named source/version; a general release request cannot invent terms/refund/privacy/fee/membership facts or publish draft copy.

## 5. Analytics/index/rules boundary

`analyticsConfig/current` is the only runtime admission read, requiring `{enabled:true,startedAt:<positive safe integer>}` (`analytics-ingest.ts:33-47`); no exported admin analytics-config callable or production config writer was found. Client consent version is2026-10-08 and working retention45days (`packages/domain/analytics.ts:3-7,61-67`); events contain route/productId/classified Ask topic only, not chat text (`src/shared/analytics.ts:331-358`). Enabling starts authoritative order/financial-entry jobs and the every-minute compactor (`analytics-worker.ts:34-84,453-490`). Actual current enabled/startedAt/provider trigger state is **NOT_VERIFIED**.

The local manifest contains48 composite indexes and13 `expireAt` TTL field overrides. The required compactor index is analyticsJobs stateASC/createdAtASC (`firestore.indexes.json:923-935`). The13 analytics TTL groups cover sessions/sessionRequests/subjects/jobs/events/processed/ledgerReceipts/orderProjections/attributions/days/dimensions/members/capabilities (`:952-1030`). **Do not treat a blanket `firestore:indexes` deployment as a purely additive query prerequisite:** it also activates these automatic deletion policies. Retention policy/activation authority must be explicit; this task excludes autonomous permanent cleanup.

Root can first verify current deployed rules and composite index metadata without data reads. If current rules differ, the source-frozen rule promotion command is `firebase deploy --project satsunicgo --config firebase.json --only firestore:rules,storage --non-interactive`, only after the reviewed rules suite and existing-user impact pass. This command was **NOT_RUN** and is not part of main's artifact. The analogous full `--only firestore:indexes` command must remain blocked pending TTL authority. If a composite is absent, root needs a reviewed composite-only promotion configuration/receipt; do not silently apply all fieldOverrides or remove existing indexes.

Current Firestore rules restrict owner/private records, allow published public products/posts/blog/membershipPlans and deny all other client access; Storage denies all client access (`firestore.rules:4-27`, `storage.rules`). These rules do not block Admin callable persistence. Do not weaken rules, App Check or IAM to work around a missing authenticated endpoint.

## 6. Purchase live integration is missing, rather than merely unconfigured

`purchaseCheckout` commit chooses demo only when emulator/environment/database/project/port checks all match and purchaseDemo enabled; otherwise it sets payos_unavailable and throws before creating checkout (`purchase-checkout.ts:71-86,373-382`). `purchaseBalanceCheckout` commit has the same demo-only boundary (`:887-891`). `purchaseDemoPayment` is omitted in production index (`index.ts:548-551`) and independently guarded; it must remain unavailable.

`purchaseCheckoutSetup` safely returns pricingnull, missing regions and unavailable production shipping rather than invented values (`purchase-checkout.ts:915-951`). No exported writer for settings/upfrontCheckout or purchaseRegions was found. `workspaceCommand.savePricingPolicy` writes **settings/pricing**, a different contract; it cannot initialize the upfront policy. Required upfront facts are actual approved termsVersion, serviceBps, effective dates, real integer FX rates and a valid current province/commune directory (`packages/domain/purchase-checkout.ts:38-62`, `purchase-checkout.ts:175-194`). Shipping does have an actual OWNER/recent-MFA `shippingRatesAdmin` read/save/publish workflow with operationId/expectedVersion, settings/shippingRates draft and shippingRatePublic/current publication (`shipping-rates.ts:23-43,91-193`). Publishing rates requires actual tariffs, not reference values.

Receipt worker writes private PDF and purchaseEmailOutbox, but only exact demo marks email delivered. Production email remains pending_configuration with transportunconfigured (`purchase-receipts.ts:82-110`). Receipt generation/Storage/provider readback and current scheduler/index health are not proven by a demo sink. A live payment/receipt-email adapter requires a separately reviewed code/provider delta; this audit assigns no source changes.

## 7. Safe release prerequisites and unresolved blockers

Root may verify and use already authorized existing production release configuration: GitHub production environment/WIF deployment principal, public Firebase build bindings to satsunicgo and asia-southeast1, authorized Google sign-in domains and the public App Check/reCAPTCHA site binding. The source gates validate public build variables without printing values (`src/shared/firebase.ts:34-84`, `scripts/release/check-public-config.mjs`). Reuse approved authenticated integrations; do not acquire/print tokens/keyfiles, loosen App Check, create IAM grants or enable paid services based solely on this document. Whether those provider prerequisites exist is **NOT_VERIFIED** here.

The broader source may be delivered **with holds**, provided fresh broad compilation/unit/lint/integration/security/release-contract checks pass; frozen manifest includes declared WIP and excludes local credentials/customer/provider artifacts; provider before-readback admits the exact inventory; and exact Functions/Hosting source/asset after-readback passes. Root owns the final independent review. This read audit does not certify safe production deployment by itself.

Mandatory outstanding evidence: current broad-source gates/final review; actual provider API/IAM/AppCheck/Auth/Storage configuration; rules/composite-index deployed comparison and readiness; preexisting held scheduler/export disposition without deletion; actual analytics config plus retention/TTL activation decision; truthful live purchase availability and reviewed missing adapter; named published corpus/official policy approvals; feedback retention decision; authoritative billing reconciliation and paid scope. Production acceptance remains NOT_READY until the required scope is concretely closed. Leave unavailable flows unavailable and show their durable recovery states.

No tests or production probes were run for this report. No cost estimate was made. Prior paid reservations remain fully held. Memory candidate: None. Audit write/runtime/test lease: **RELEASED after handoff**; root retains review/executor responsibility.

## Source snapshot SHA256

These hashes bind the bounded facts above to the inspected local source; they are not a deployed-version receipt. Recheck after root integrates or freezes any successor.

```text
ccd3fd7d97593225257ba85531eea1fab244c0b74619bb21c167f50adb48bd92  .github/workflows/release.yml
77097b3d4f923979e9bcb4a91a849749e58f75ec286eb3ae355a161d7ff23795  .github/workflows/ci.yml
8c3f8e1e73b8aee68c13c0348c8ef01bfdc721c760caf38ba8c44cbdd4330e53  firebase.json
f55bbbde8623a7252d542b4dc8525f716f86caa4bf393ebc32486844d814ce58  firestore.rules
f29fbaf53430f06adade7dbd887c0521d614557c8b9e71acecf895b5a4a33660  firestore.indexes.json
4a043206e7ecbd14ffb97ce055cd22fe2a1f1300fb4f61d1a984f5b27b6889cf  storage.rules
99b349c8c417e9dba83e02265cfb6ba119041c1177fafa95b6ce99e10cc95364  scripts/release/artifact.mjs
2f80ce7fcd20963be28c814f948a6d0dad3534d987630ef31a48476cc43eb57c  scripts/release/preflight.mjs
0f628837698ea2c4457ef532d8bd491475cc8ebcdf712f951351065e38d80616  scripts/release/verify-production.mjs
60f0e3b406c1046181efa638163c309a01ad9330b4e22748169217f4bd46b167  functions/src/index.ts
82dc7d98a193f4431ea1fdd9dadab777329501ecaf2a987a47763e53110e7a96  functions/src/provider-release-gate.ts
887dfdcb754067bf1d0318a37cabc63baa8be514bfa536da5ac0a215dc30129a  functions/src/auth/guards.ts
d284af638eaa6f888785285ddd8bea28fa00b39a5def5529040248068a7fdaae  functions/src/workspace.ts
dd8d43c85c95e4bb17485ec6d76ab1470214ea67b97fbf488e4fa9a7151bb37d  functions/src/ai/ask.ts
9390ee5cac1d31c565e407e98c125cd2c1f7d9c28340229d7f14202ba3b17b3a  functions/src/ai/ask-pilot.ts
a550c19f065e3560c8332c8efbeb02e0eb1b9bf301fb401cf85e87ad403c92c4  functions/src/ai/server-context.ts
f88f73615425a71cb0bc9a63f4e5df476091d4fd2dba8e6944d532a92a048223  functions/src/ai/approved-knowledge.ts
0b4b0f31038ad033c020b39b048381b73baed71e76de6fa44a4ad4f454ed2272  functions/src/ai/research.ts
c4d8dfe0491395362fc85045dd7149229b31cc94b2874916cabd4dfd2a948bb2  functions/src/ai/research-live.ts
6cac39e0619fca0fef1f684b138310ac88d5194e13a55159c5d140c89a3c671e  functions/src/ai/research-gemini.ts
7282d1e99993025ba581caa5432db90e3f1eb0bad5efc4d7ab47da778b345244  functions/src/ai/feedback.ts
43f88bd68759555c1773d3c8a5c1b1e9325e203be16f4dd4b26d9eee2bbdb434  functions/src/ai/feedback-lifecycle.ts
859c0ec93ecec836ed5c15ce3c04ad6a99afea7c3c0933d6b9fc9d6959dec318  functions/src/analytics-ingest.ts
b231a6e813e2cf771a453f5ec36415738625539b8c354d3f2a608c603b34fce4  functions/src/analytics-worker.ts
999bc115d30834c9f53afe4cc45fc1eea18c72d32b32a3974465172dfb4c92ce  functions/src/dashboard-analytics.ts
00edf99aba78f2723d30bae8f2b5ddfa5635a63f6185201d7147869be62db1cc  functions/src/purchase-checkout.ts
07de63dc47a1e48ab9adb11dbe52584bd320864cdc719e9ea49e67da910dab98  functions/src/purchase-images.ts
1b76b21d3a2ac6f67e52354156417d6e9adb38cba8c95a0e0315c7701db3ae72  functions/src/purchase-receipts.ts
78c266cacfacb5845a682f2d84f76bcf9577fd2e62ff118a91c99f9d90c1ec7b  functions/src/payments/payos.ts
60e6dfef535552fd6fdefab3365a6141af64165870d1369236a376897dcd87b3  functions/src/shipping-rates.ts
153bc02293c6214ac6986888359d576a4e760890b5a349b97bc7f7cb536e49bc  packages/domain/purchase-checkout.ts
82b0bafb917cb2dc5d4e0362811b7e859bce3a2c98a303b88138ec93bf6c1e61  packages/domain/ask-feedback.ts
2f0b130f6d71c48f948e8f4e62c863ded2e90e746d1374e61f8f06254f289882  packages/domain/ask-research.ts
d8e283f8d0d8f9cfdcfd7e73daaf151fe223ce5b85af3824810f1b2b84ec34e3  packages/domain/ask-knowledge.ts
f7e70ebe14350a8bc449fdfc7f8ac6f8216a9d78087ee2ad47fddda1e11287fc  packages/domain/analytics.ts
f536939e0f08bf6f27a42efa4d194a65b30b9d370f522dec3a8759dd8e9f5371  src/shared/firebase.ts
79eac596833602e9d437a80d135e6b1b1af83792c7c2197c8f1ebba5ec9b60c3  src/shared/analytics.ts
f419ec7c6e50a7a50d8d81f04a398f391f63d35d46e41ba7c7e2daa36ef82610  package.json
66ab62e3367e0d813f08ad6e5d46994b753bc9fd7656c7621e815299eae10c90  functions/package.json
d2ef5388dbee9d04f0a8e269d0e43a7d149dd5bc001e9de701cf0ebaf6cc5800  package-lock.json
```
