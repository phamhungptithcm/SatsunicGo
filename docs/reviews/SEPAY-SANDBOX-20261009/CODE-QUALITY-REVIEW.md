# Integrated engineering review

Review scope: approved SePay local-first delta, current source manifest, shared domain/checkout/payment/PDF callers, official SDK dependency and tests. Concurrent Ask/analytics/release WIP is not approved by this review. Intelligence gate DEGRADED; final CodeGraph call resolved inbox→reconcile→settlement and CocoIndex returned relevant current fragments, but complete index-health/freshness coverage was not established. Current source, compiler and executable evidence remain authoritative.

Stack: TypeScript6.0.3/JavaScript, React19.3.0/Vite8.3.2, Firebase Functions7.4.0/Admin14.5.0, Firestore/Auth/Storage emulators, Vitest4.1.11, Zod4.6.5, official backend-only sepay-pg-node1.0.0. Requested Functions Node22; actual checks ran Node25.9.0. Node22 validation NOT_RUN. Profiles: universal, typescript-javascript, web-app, database, concurrency, memory, visual-design, product-content. No SEO/marketing or new animation surface; those profiles are NOT_APPLICABLE to this transactional delta.

## Architecture and compatibility

Domain code owns exact amount/form/IPN/readback admission without secrets. Backend adapter owns SDK signing and fixed bounded authenticated transport. Authenticated IPN is a durable wake-up signal, not money proof. Only private persisted verified evidence enters the shared transaction core. Initial and balance commits pin provider/method and operation identity. Existing demo wrapper retains its environment/settings/link-proof guards. UI dispatches by pinned provider, uses an admitted ordered normal POST form and cannot turn callback parameters into payment. PDF/email rendering follows settlement asynchronously.

Additive public response fields preserve legacy demo acknowledgement without a method; sandbox requires BANK_TRANSFER. Unsupported CARD/NAPAS and overposting fail server-side. Newly exported sandbox endpoints are exact-demo-only; production real-payment/email holds remain. The official SDK is pinned with integrity in package-lock; no floating Git install. Its static environment URLs/no default API timeout are contained by a sandbox-only signing wrapper and separate bounded native readback.

## Checks

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Language/platform/domain | PASSED within local runtime | Current TypeScript/backend build and Vite build; Node22 release run still NOT_RUN |
| Clean code/ownership/layering | PASSED by bounded source review | Small provider module and shared core; no unrelated architecture rewrite |
| Formatter/static analysis/type checking | PASSED | Targeted Prettier/ESLint, npm run typecheck, git diff --check; no claim about all concurrent WIP |
| Unit tests | PASSED | 241 tests, evidence/unit-final.json; refreshed after final PDF copy refinement |
| Integration tests | PASSED | 27 tests with real emulator persistence and synthetic provider; evidence/integration-final.json |
| HTTP demo business regression | PASSED | 17 assertions including staff approval, exact top-up, funding/dispatch and private PDF/demo sink |
| API compatibility | PASSED | Legacy acknowledgement/provider regressions plus strict unsupported-method/schema tests |
| Database transactions | PASSED within fixtures/source | Deterministic document IDs, atomic proof/allocation/ledger/order/receipt-job updates, all reads before writes, no provider I/O inside transaction |
| Concurrency/leases | PASSED within executed races | Four independent processes, duplicate/reused references, cooldown/active/expired leases; BR-01 fixed and independently verified |
| Resource/heap bounds | PASSED for finite probe/source | 10s timeout,256KiB response,64KiB IPN,50transactions,30checkout lines,3MB PDF limit, finite retries/polls, timer/stream/form/objectURL cleanup |
| Production leak/throughput certification | NOT_RUN | Offline50PDF/3200queue probe is not a production benchmark; no UI lifecycle measurement |
| Security | PASSED within local contracts | Owner/auth/rules/overposting/binding/redaction/tamper tests; no live provider protocol certification |
| Observability | PASSED for local diagnostics | Private bounded failureCode/claim/attempt/evidence states; no raw secret/provider-body logging; production operator dashboard/alerts NOT_RUN |
| Database migration/TTL | NOT_APPLICABLE to destructive migration | Additive private direct-ID stores; no database object rename, migration, financial TTL or deletion |
| Documentation | PASSED | Plan/approval,67scenario overlay, runbook, hashes, review-cycle findings and deferred boundaries |
| Release/deployment safety | PASSED for non-activation | Exact demo guard, no deploy/push/IAM/publicIPN/real email/money; production readiness remains NOT_READY |
| Complete UI/product gate | NOT_RUN | Current payment-route browser rejected localhost; selector/PDF proxy evidence does not certify full route |

## Performance and resource evidence

The fixed readback transport denies redirects, validates JSON type, aborts after10s and stops above256KiB. finally clears timeout, aborts and cancels/releases the reader. Intent lease30s plus2s cooldown bounds duplicate reads; inbox lease60s/max5attempts and Functions maxInstances2/concurrency4 bound local retries. No active readback occurs inside Firestore retries. Direct document reads avoid new index/query scans; allocation writes are bounded by existing30line checkout. No financial TTL is used as a substitute for recovery.

Offline probe rendered50 synthetic30line sandbox PDFs and ran3200 queue operations including1600 expected failures. After the final website-branding refinement, each PDF was634828bytes; elapsed190ms on this host. After forced GC, heap delta359736bytes, external delta6259619bytes; RSS rose from73089024 to113672192bytes. These are finite measurements, not proof of zero leaks, stable production memory, provider latency or end-user performance. See output/sepay-sandbox-20261009/resources.json. UI timer/subscription lifecycle measurement NOT_RUN; cleanup source reviewed.

## Security findings and controls

No open critical/high source finding remains identified in the bounded executed review. This is not a claim that the system has no vulnerabilities. Owner verifies Google session, account lock and checkout ownership; private collections deny guest/customer/foreign/staff direct reads/writes. Merchant/invoice/provider/order/internalID/transaction/method/currency/amount/date/hash bindings are checked before allocation. Under/over/late/locked/stale money remains review evidence; second transactions do not add a second ledger allocation. VOID holds fulfillment without automatic financial reversal.

Secrets are backend-only defineSecret bindings. IPN authentication is independently configured and timing-safe; merchant and IPN keys are not assumed interchangeable. Only metadata of the real merchant secret was verified. Fixture keys are explicitly synthetic; actual shared SePay flag is false. No agent secret-value access. Fixed hosts and callback admission prevent caller-directed SSRF/open redirects.156 compiled browser JS files had zero matches for the five checked SDK/secret/fixture markers; that bounded scan is not a complete Git-history secret audit.

Dependency audit:15 existing production findings (13moderate Genkit/OpenTelemetry,2low Mermaid/KaTeX); no reported vulnerability in the added SePay/Axios graph. No unrelated autofix or dependency upgrade. Real sandbox protocol/callback acceptance, credential binding, public IPN transport/auth setup and production alerts remain unverified/deferred.

## Review cycles and corrections

1. Initial local review added durable verified-proof recovery, separate second-transaction evidence, VOID fulfillment hold and preserved conflicting proof on cross-checkout reference reuse. Unit/emulator cases verify each relevant branch. No automatic refund/reversal was added.
2. CSP review found the original form-action replacement did not match the directive at the end of the string. Fixed exact sandbox origin admission; unit test now asserts the production header permits only self plus that sandbox form origin, leaving other directives unchanged.
3. Independent review found HIGH BR-01: a deferred readback during cooldown/lease could mark a distinct inbox transaction done merely because the checkout was already paid. Fixed tagged reconciliation result bound to the inbox's own transaction ID. Meaningful cooldown/lease tests assert queued/no evidence before expiry, then separate SECOND_TRANSACTION evidence after retry and one ledger allocation. Independent closure and proof hashes are in CROSS-CHAT-BACKEND-REVIEW-COLORS-20261009.md / BR-01-R2-TEST-EVIDENCE.json.
4. Verification harness failures were corrected without weakening business assertions: reuse emulated Firebase bootstrap, test bare actual HTTP handler rather than an incomplete fake Express wrapper, wait finitely for asynchronous PDF readiness, set required demo environment, authorize local loopback access. Formatting was corrected and27integration tests rerun. The HTTP wrapper's stale report replacement path was corrected and17assertions rerun into its separate evidence directory. Historical failures are retained in VALIDATION.json.
5. Fresh full bounded source review finds no additional actionable defect within executed local checks. Overall recommendation remains BLOCKED for complete handoff because full payment-route/product evidence is missing; independent backend correction and selector/PDF slices are not blanket release approval.

6. An additional final scenario review found that a readback containing two approved payments would reject even when an authenticated normalized notification identifies exactly one. The earlier second-money fixture returned only the second transaction. Corrected candidate selection to restrict approved payments to the notification's transaction ID when present, preserving all existing proof bindings. Without a notice, multiple payments remain ambiguous; duplicate matching IDs and a declined target still reject. Three new unit cases and the stronger cooldown/lease fixture returning both transactions pass (241unit/27integration). The original chat independently read/reviewed the current three-file delta and reported PASSED within that bounded scope; it did not rerun the emulator or certify real provider/browser behavior. Domain hash644dd35eace381de945ca89cee7887151cb308d1e1287dd1b12478a83ecd0df0; unitf5a7b95afb99f6a04e5cffc698585ba42328da46864652f49938f8fb8a1911f4; rules3930909c3732d0cd3fc5f279dce87392e6ac5d0dfc71546d8c606358013ed1bf. The payment handler/settlement core hashes remain unchanged.

7. The final source guard detected notification metadata added by independently approved CUSTOMER-EMAILS A+B work. Root verified the approval and reviewed the shared financial interface: deterministic outbox ID, minimal typed payment scope, snapshot/hash validation, no new network or reads in settlement, and caught formatting failures that cannot prevent authoritative writes. Customer notification projection remains transactional and provider sending is policy/external blocked. Root formatted the producer only, preserving its meaning; two overly strict output equality probes were rejected and were not used as evidence. Current compiler/241unit/27emulator checks were rerun instead. Another catalog refinement invalidated the first candidate guard, so the latest33files were recaptured and verified stable during the final rerun.17HTTP assertions passed after producer addition, with the pre-format/latest-catalog boundary disclosed. Full notification feature acceptance is owned separately; no new email activation authority was inferred.

## Risks, operations and decision

Production NOT_READY. Additive private stores need a separately approved production retention/operator review/alert workflow if ever released. No public sandbox endpoint exists; provider readback depends on authenticated IPN giving a provider order ID. Real localhost callback acceptance is unknown. Current runtime uses synthetic demo data, owner-approved replacement and preserved export. No old dataset restoration claim.

Rollback of eventual local activation selects demo for new attempts while retaining pinned sandbox intents/proofs for reconciliation. Do not relabel existing paid attempts, delete evidence or replay a financial correction. No deployment rollback was performed or tested in production. No new migration, release or production-access scope is authorized here.

Missing tooling: ai-agent-kit CLI/native ledgers unavailable; file-backed evidence/report only. Full browser/payment accessibility, live provider/publicIPN, Node22 and production runtime checks NOT_RUN. Token usage/API-equivalent cost/actual billed cost: Unavailable. Memory candidates: None.

Merge/complete-handoff recommendation: **BLOCKED** pending the current integrated Product Language Gate and authenticated payment-route evidence. The final source guard also caught another independently owned customer-notification-events.ts change after the last241/27/compiler run; CURRENT-FRESHNESS.json records it. This review's passing checks belong to the immutable tested manifest; current complete dependency acceptance requires stable handoff and affected revalidation. Local backend code/tests remain reviewable from that manifest; the concurrent dirty worktree is not ready for blanket commit/push approval.
