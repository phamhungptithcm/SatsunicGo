# Code Quality Review — purchase gateway scenario hardening

## Detected stack and scope

TypeScript 6.0.3, React 19.3, React Router 7.18, Vite 8.3, Zod 4.6, Firebase JS 12.19; Firebase Admin/Functions with Firestore transactions and private Storage. Installed PayOS Node SDK 2.0.5 used for offline signatures/verification only. npm workspace, ESLint 9, Prettier 3.9, Vitest 4.1.11. Functions targets Node 22; executed local Node is 25.9. No dependency/lockfile/runtime target changes. Transactional Vietnamese commerce web, background PDF generation, authentication, immutable money and private documents.

Reviewed source paths and hashes are in GATEWAY-SOURCE-MANIFEST.json. This is the approved v3 local payment continuation; preserve unrelated Ask/analytics/release work. Source-authoritative review follows DEGRADED CodeGraph/CocoIndex evidence. No subagents were spawned; this is primary-agent review with executable evidence, not a claim of independent human approval.

## Selected quality profiles

`.ai/quality-profiles/`: universal, typescript-javascript, frontend-html-css, web-app, api, database, concurrency, memory, visual-design, product-content. Animation-motion reviewed as NOT_APPLICABLE to new gateway changes: no added decorative motion. No new search/indexable content or crawler/SEO contract: seo-geo NOT_APPLICABLE. Infrastructure/devops production mutation NOT_APPLICABLE; release readiness still assessed explicitly as NOT_READY.

## Checks

| Check | Status | Evidence or rationale |
| --- | --- | --- |
| Language/version best practices | PASSED | Strict compiler, minimal additive types, SDK verifier, ESM dynamic import explicitly uses `.js`; Node 22 execution NOT_RUN |
| Platform/domain best practices | PASSED | Existing cart/request/connected checkout preserved; provider navigation has no money authority; GATEWAY-PRODUCT-CONTENT.md |
| Maintainability | PASSED | Separate small provider binding/gateway/queue modules; existing financial transaction retained; whitespace-only nesting identified separately in diff |
| Formatter | PASSED | Scoped Prettier check; shared index.ts and unrelated files not reformatted |
| Static analysis/lint | PASSED | Scoped ESLint, commands/results in GATEWAY-QUALITY-GATES.json |
| Type checking/build | PASSED | Frontend tsc/Vite and functions tsc; generated assets produced by normal root build |
| Unit tests | PASSED | 132 focused tests across 10 files; no assertion/timeout weakening |
| Integration tests | PASSED | 69 HTTP scenario groups,17 business groups,19 shared rules/worker cases and two independent callback processes |
| API compatibility | PASSED | Additive emulator-only actions; existing non-linked demo outcome branch retained; direct branch cannot bypass a linked intent; production real payment remains unavailable |
| Database connection/transaction safety | PASSED | Batched getAll; all reads before atomic money writes; SDK crypto only inside create transaction, no external API I/O; bounded 30 lines and existing media caps; Admin lifecycle managed or runner terminate |
| Concurrency/deadlock/leak risk | PASSED | Queue keys cart/allocation/provider/receipt have separate phases; no recursive same-key acquisition; finally releases/delete; durable transaction/lease authority verified across two processes |
| Heap/resource risk | PASSED | Map64 keys/16 pending per key; body16KiB; PDF3MB; recovery5+5; poll12 maximum with cleanup; generation and keyed UID; finite object URL revocation; 3200-operation/50-PDF GC probe. Long soak NOT_RUN |
| Performance-sensitive paths | PASSED | Batched reads and bounded burst smoothing; measured shared inspect emulator latency recorded, no production best-throughput claim |
| Security review | PASSED | Verified Google plus per-operation owner/lock checks, strict input, HMAC and persisted money/link/reference/time binding, no browser-query authority; private rules cover owner/other/anonymous; no secrets/logged raw callbacks |
| Observability impact | PASSED | Existing verified-payment audit/evidence and immutable ledger preserved; job attempts/lease/failureCode + bounded failureDetail; private outbox state/hash. No unbounded identifier metric added. Production alerts/SLIs NOT_RUN |
| Release/deployment safety | PASSED | Assessment: NOT_READY for live deployment. Strict emulator/project/loopback checks and conditional export; no live PayOS/mail/production state changes; rollback keeps received evidence/ledger/issued documents |

## Database and concurrency model

One checkout owns one private provider intent and link index. One durable reference owns one evidence record; a transaction checks checkout/owner/cart or balance-order version/target and allocates exactly one set of child orders/ledger/receipt. Different instances rely on Firestore transactions, not the module Map. Provider-paid but allocation drift/lock/amount mismatch retains actual money as review_required. No automatic refund, second payment or money deletion. Confirmed unpaid cancel/expiry/failure alone releases the cart; ambiguous PROCESSING/unknown does not expire into unpaid.

Receipt claim has two-minute lease, three attempts, deterministic private object and outbox identifiers, snapshot check and hash. I/O happens after claim and before conditional completion. Missing receipt retires the job; terminal stale leases clear. Recovery reads at most five queued plus five expired jobs. Client download rechecks access after Storage fetch, checks byte limit/hash. Snapshot payment time uses verified provider paidAt; audit/job createdAt remains processing time. Previously issued PDFs preserved.

No migration/backfill, retention TTL or extra index introduced. Recovery queries use single fields state/leaseUntil; SQL execution plans and ORM save-loop concerns NOT_APPLICABLE. Demo key is generated and stored only in private synthetic merchant configuration; no live credential is accessed. Future live provider needs a proper secret-backed adapter, verified API/readback, webhook account/time handling and operations approval.

## Findings, risks and follow-up

All actionable scoped source defects discovered in this loop were corrected and verified; every cycle is retained in GATEWAY-FINAL-REVIEW.json. Fixture repairs target the shared owned variant; current exclusive CI fixture remains untouched and NOT_RUN on its required Storage9298. A failed shared recovery fixture was confirmed to copy an intentionally invalid sibling receipt (200001 vs200000); exact original ID fixes deterministic selection.

One intermediate HTTP pay/cancel attempt had both calls rejected before diagnostic codes were captured. Cause was not conclusively established; two later complete suites passed the same three race assertions with the original30s request timeout, and independent processes passed. Treat this as a shared-emulator reliability limitation and rerun unchanged with the diagnostic capture if it recurs; do not infer production throughput or hide it as a proved source fix.

Remaining production follow-up: real PayOS request/response adapter, bank reconciliation, controlled manual financial review, approved prices/regions/freight configuration, real mail transport and inbox readback, Node22, deployed trigger/scheduler registration, IAM/AppCheck provider tests, monitoring/retention/soak/load/device and formal accessibility validation. Existing >500kB bundle and ineffective dynamic import warnings remain; new payment gateway does not introduce a chart/UI library.

Native ai-agent-kit CLI is unavailable (NOT_RUN for native ledgers). The legacy approval validator rejects DEGRADED while the repository workflow explicitly permits bounded source fallback; record that mismatch rather than falsifying READY. Human v3/latest scenario approval remains the authority. Native browser file-save, formal PDF-UA/screen reader/CJK coverage and production deployment remain NOT_VERIFIED/NOT_RUN.
