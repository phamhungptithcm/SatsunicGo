# Local integration report

Current decision: **BLOCKED for complete E2E handoff; production NOT_READY**. Approved local code and substantial synthetic/local checks are implemented. The authenticated current payment-route browser check remains unavailable after the browser tool rejected localhost access. No workaround was attempted. Real hosted SePay payment/readback has not been completed; public IPN is explicitly deferred by the user. This is not a successful provider or production release report.

Final freshness guard: the independently owned customer-notification-events.ts changed again after the last successful241/27/compiler run. SOURCE-MANIFEST.json is the immutable tested snapshot, not a claim that the moving complete checkout is now verified. CURRENT-FRESHNESS.json records the later dependency change. The current complete dependency snapshot requires a stable owner handoff and affected revalidation. No other owner's work was reverted and no current-source pass was inferred.

## Implemented behavior

Existing mixed cart and recipient/Overview flow stay in place. Listed products pay full server price; custom researched-price products pay full researched goods plus configured service fee. Staff sourcing/shipping changes require customer review and an exact balance payment. Three payment choices appear in the existing Overview; only available BANK_TRANSFER is selectable, with backend validation and immutable method pinning. The original chat owns and independently reviewed the selector/color refinement; current PDF copy refinements are coordinated in that chat without changing money logic.

Official SePay SDK1.0.0 is backend-only and pinned. Signing uses fixed sandbox merchant/hosts and admitted ordered form fields. The browser posts a normal form and cannot mark paid from return parameters. Authenticated IPN persists a normalized private inbox; fixed-host bounded readback verifies invoice/order/transaction/amount/method/date/hash before a persisted proof reaches the atomic settlement core. Both initial and balance checkout share this path. Exact demo-database guards prevent production activation.

Retries reuse the checkout/invoice. Verified proof can resume allocation after interruption. Duplicate money does not allocate twice; a distinct second transaction is retained for reconciliation. Wrong amounts, late/cancelled/locked/stale targets stay for human review. VOID freezes fulfillment without automatic reversal/refund. Private itemized PDF work is asynchronous and cannot repeat a charge. Actual email is not activated; test deliveries use a demo sink.

## Executed checks

| Check | Current evidence |
| --- | --- |
| Unit/regression |241/241; evidence/unit-final.json |
| Emulator contracts/integration |27/27, including four independent settlement processes; real Firestore/Storage and in-process real handlers with synthetic provider |
| Existing HTTP demo business flow |17 assertions; Auth/Functions/Firestore/Storage HTTP, staff approval, sourcing increase, final charges, exact top-up, funding barrier, private PDFs and demo sink |
| Compile/build/static |Current TypeScript/backend build and targeted ESLint/Prettier/diff checks passed; previous Vite build remains applicable to unchanged frontend/domain |
| Dependency/isolation |Official SDK pinned/integrity verified; no new SePay/Axios vulnerability reported;156browser JS files had0matches for the5checked secret/SDK markers |
| Resource probe |50synthetic30line PDFs plus3200queue operations/1600expected failures; bounded measurements, not production performance/leak certification |
| Visual/product evidence |Actual selector/CSS in disclosed desktop320px/200% proxy; current initial/balance PDFs rendered/inspected independently; full payment-route browser NOT_RUN |

Full commands, exact tests, artifact hashes, historical failures and scope boundaries are in VALIDATION.json, RESULTS.md/JSON, SOURCE-MANIFEST.json and CODE-QUALITY-REVIEW.md. The67planned scenarios are not all passed: partial cases and unexecuted real/browser scenarios remain explicit. The old asynchronous-PDF script failure is retained; a different business wrapper with finite worker-readiness waiting passed. Test harness and report-path fixes did not weaken business assertions.

## Review and fixes

Every correction stayed within approved local scope. Review added durable proof recovery, separate second-money evidence, VOID hold and preserved cross-checkout conflict proof. The CSP origin insertion was corrected and tested. Independent HIGH BR-01 identified dropped second notifications during an active lease/cooldown; tagged reconciliation results now bind inbox completion to its own transaction. Both meaningful regressions passed and the original chat independently verified source hash/results. See CROSS-CHAT-BACKEND-REVIEW-COLORS-20261009.md and BR-01-R2-TEST-EVIDENCE.json.

Final scenario review also corrected readback selection when an order contains multiple approved transactions: an authenticated normalized notice selects exactly its own transaction, while manual ambiguity, duplicate IDs and declined targets still reject. Three added unit cases and stronger cooldown/lease responses containing both transactions passed. The original chat independently reviewed this bounded correction; see MULTI-TRANSACTION-REVIEW.md. PDF copy/website branding was then handed back and all current local checks were refreshed; no ready immutable receipts were backfilled.

The final source guard subsequently detected independently approved notification producer work in settlement/index. Root reviewed that interface, preserved the other chat's changes, formatted the shared financial file, and refreshed compiler/241unit/27emulator checks against33unchanged source hashes including the latest notification catalog.17HTTP demo assertions passed after the producer addition, before the formatting-only diff/latest template refinement; that exact boundary is retained in evidence/notification-delta-checks.json. Notification test type errors were corrected by their owner. The helper isolates invalid content from authoritative financial writes; this review does not certify the complete notification feature or activate customer sending.

Fresh review found no additional actionable code defect within the executed local scope. Final overall review remains BLOCKED because the Product Language Gate for the complete current payment route has missing in-context interaction/accessibility evidence. Passing backend/PDF/selector slices do not erase that missing required check. Native ai-agent-kit ledger/report command is unavailable; file-backed current reviews and this report are provided without claiming a native receipt.

The applicable [final-implementation-review skill](../../../.ai/skills-src/final-implementation-review/SKILL.md) explicitly defines `BLOCKED` when “any required dimension failed or was not run, evidence is insufficient”. The [write-product-content skill](../../../.ai/skills-src/write-product-content/SKILL.md) requires current rendered/proxy evidence and all eight principles. Those rules prevent a successful complete handoff while the integrated payment-route evidence is missing; they do not erase the local checks that passed or require another permission request for already authorized work.

## Weighted local acceptance

Weights describe this approved local-first phase only; they do not estimate total product/release completion. Evidence records are file-backed because native runtime ledger is unavailable.

| Criterion | Weight | Status |
| --- | --- | --- |
| Official backend adapter and strict contracts |15 |PASSED within local signing/fixture checks |
| Initial/balance transactional allocation and idempotency |25 |PASSED within emulator/race checks |
| Auth/security/private persistence boundaries |15 |PASSED within source/contract/rules checks |
| Failure/recovery/late/second/void handling |15 |PASSED within executed fixtures |
| Three-method Overview selector |5 |PASSED within disclosed actual-component proxy |
| Itemized PDF/payment metadata |10 |PASSED within unit/emulator/rendered evidence |
| Compile/static/demo regressions |5 |PASSED |
| Authenticated current payment/completion route desktop/mobile/keyboard/recovery |10 |NOT_RUN; blocked by browser tool |

At the last tested snapshot, local evidence weight was90/100. This is historical local evidence; after the external dependency changed, current complete-snapshot progress is not certified. Missing browser10/100 never counted as passed. Real provider/publicIPN/production are outside this local percentage and remain unverified/deferred, not100%complete.

## Runtime, Git and remaining work

Human authorized creating a replacement demo dataset because the prior backend configuration/export was lost. Exact four backend ports are running under demo-satsunicgo; shared frontend5207 is reused. Synthetic settings/users/products/orders are uniquely named; no reset of an existing dataset. Current export is preserved at /private/tmp/satsunicgo-shared5207/export. This is new test data, not recovered old data. Shared SePay flag remains false and keys are synthetic fixtures; no real secret value access occurred.

Before real sandbox acceptance: bind merchant and independently configured IPN credentials using an approved application-scoped mechanism, verify actual callback/order-ID/readback contracts, then separately deploy/test public HTTPS IPN under an approved environment. No key should be pasted into chat. Complete current authenticated UI/browser checks through an authorized browser environment. Validate Node22; current host used25.9.0. Production retention/operator reconciliation/alerts/release checks are future reviewed work.

Git HEAD0d6e721698608eebb36b0b2f68021c3054d97d1c. Checkout is dirty with unrelated concurrent WIP; source manifest identifies the bounded candidate. No blanket merge approval, commit, push, production deployment, secret retrieval, real payment, real email, public IPN or IAM mutation in this phase. Existing production holds remain. Rollback new local activation for future attempts only; preserve pinned attempts and permanent financial proof.

Token usage: Unavailable. API-equivalent estimated cost: Unavailable. Actual billed cost: Unavailable. Memory candidates: None.
