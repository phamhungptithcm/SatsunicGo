# Ask scenarios

All cases use synthetic data. No provider payment, production traffic, demo reset, rules replacement or server restart.

| Layer / scenario | Preconditions and steps | Expected | Result |
|---|---|---|---|
| Unit: policy eligibility + exception | Published policy with relevant terms in separate spans; retrieve lexical query | Both spans retained, original evidence preserved, hard bounds respected | PASSED |
| Unit: citation conflict | Same source ID with inconsistent title/body | Ambiguous evidence omitted | PASSED |
| Unit: Unicode/chunk bounds | Paragraphs, long text and emoji crossing boundary | Original contiguous spans and valid UTF-16, at most 1200 chars per span / 20000 per doc | PASSED |
| Unit: malformed stream | Duplicate, oversized, invalid or excessive events | Reject without accepted answer | PASSED |
| Unit: final mismatch/provider error | Stream answer followed by inconsistent final or rejection | No success event published | PASSED |
| Unit: stalled cancellation | Never-settling next() or final promise; abort | Prompt rejection and nonblocking cleanup | PASSED |
| Unit: run guard | Registered read/draft tools; 4 calls; deadline; cancel | Fifth call, unknown tool, cancelled/expired run rejected | PASSED |
| Unit: mutable policy | Change maxCalls/tools after factory; destructure admit | Original policy remains authoritative | PASSED |
| Demo integration: duplicate draft | Concurrent same-operation saveDraft, then resume | One version increment, same recovered result | PASSED |
| Demo integration: stale/tampered | Alter payload under same operationId or submit stale version | Reject; original draft intact; no new operation | PASSED |
| Demo integration: identity | Anonymous/password auth, locked user, mismatched owner | Denied before writes | PASSED |
| Demo integration: privileged chat | refund/verifyTransfer/publish/grantMembership/changeRole | invalid-argument, no conversation created | PASSED |
| Demo integration: corrupt recovery | Completed operation with negative/ahead version or foreign order | failed-precondition; locked recovery denied | PASSED |
| Demo integration: draft → submit → recovery | Save synthetic draft, explicitly submit, resume completed operation | Exactly one owned REQUESTED order; collected remains 0 | PASSED |
| Browser: happy/mobile | Actual Ask component and stream consumer; synthetic provider | Answer only after final validation; no page errors | PASSED |
| Browser: mismatch/failure/retry | Final conflicts or rejects after streamed answer; retry and wait | Error and retry visible; no false answer; draft preserved | PASSED |
| Browser: close | Close panel during provider wait | Panel closes; animation stops; no page errors | PASSED |
| Live provider / deployed callable | Requires separately verified paid admission/active provider and deployment | Real provider identity, usage/cost, App Check, error/recovery | NOT_RUN |

Executed commands:

```sh
npx vitest run tests/unit/ask-*.test.ts tests/unit/demo-environment.test.ts
GCLOUD_PROJECT=demo-satsunicgo FUNCTIONS_EMULATOR=true FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 npx vitest run --config vitest.rules.config.ts tests/rules/ask-platform.test.ts tests/rules/ask-hardening.test.ts
npx playwright test --config tests/browser/ask-platform.config.ts
npx playwright test --config tests/browser/ask109.config.ts
npx tsc --noEmit
npx tsc -p functions/tsconfig.json --noEmit
```

Integration new suite: 10 passing cases. Existing hardening regression: 6 passing cases. Browser new suite: 5 passing cases; composer regression: 8 passing cases. Unit counts and whole-repo failure are in REPORT.md. Rules suites that replace shared emulator rules were not run. New tests clean their own UUID-scoped synthetic records only.

## S18 executed continuation
- Actual workspaceCommand demo: concurrent/exact address replay -> one address and audit; tampered payload rejected; profile lost-response retry retains expectedVersion; stale new operation rejected; locked owner cannot replay; invalid/forged-owner payload cannot persist. 5 PASSED.
- Actual Profile/CustomerWorkspace rendering with synthetic backend/auth: happy; unavailable; malformed version; terminal conflict; owner switch with late callback; mobile no overflow; inline collapse/reopen preserves pending op; profile expectedVersion retry. 8 PASSED.
- Existing profile-state/required-label/Ask-transport unit checks 15 PASSED; actual Ask browser regression 5 PASSED. Initial browser runs caught fixture locator mistakes (case and region/textbox ambiguity); corrected fixtures, no weakened assertions.
- Browser fixture is not production App Check/auth proof. Full reload recovery is not implemented; tests do not imply it.

## Cycles 8–9: reload recovery and Membership

PASSED: Profile reload committed/missing resolution, delayed save denial, transaction races, hash/version/owner mismatch, locked account, quota exhaustion including failed lookups, direct client fence/quota denial, corrupted pointer/storage denial, cross-tab admission and correlated clear. Current Profile demo 12, browser 12, pointer unit 5.

PASSED: Membership paid/free duplicate behavior, renewal intent without payment/extension, privileged/foreign/paid cancellation rejection, owner lock, malformed result/public plan/private snapshot, failed snapshot with late callback, original-action retry after renewal snapshot changes, account switch, sign-in failure, mobile and cross-tab pending protection. Demo 5, browser 12.

Final regression: Node22 959 unit tests / 112 files; Ask browser 5; composer browser 8; TypeScript, ESLint, whitespace passed. Production endpoint missing; deployment and real authenticated/App Check acceptance NOT_RUN. Membership reload recovery remains outstanding.

Cycle 10 PASSED: missing-letter typo, exact-match preference, numeric mismatch exclusion, short-token exclusion, contiguous overlapping original-source spans with forward progress/no gaps, original bounds and prior knowledge/approval/guard/transport regression (46 tests). Real-provider natural-language answer and follow-up reference acceptance NOT_RUN.

Cycles 11–12: competing typo spellings rejected, exact corpus evidence excludes fuzzy sources, conflicting publications excluded from vocabulary: PASSED. Current full suite 964 tests/112 files; focused 49; backend TypeScript, ESLint, whitespace PASSED. Fresh diff review performed.

Cycles 13–16 current acceptance: 1061 unit / 46 actual-handler demo / 51 actual-component browser cases passed against stable source. New cases: Unicode numbers/table headers, exact explicit/no-accent/polite commands, question/negative/conditional refusal, chat draft field updates, open form/manual notes, real handler quantity-save-submit duplicate replay and rejected research/payment field injection. 115 target scenario inventory includes explicit unimplemented/live gaps; counts are not completion coverage.

Current cycles17–18: 117 target scenarios inventoried; 1074 unit +46 actual-handler demo +55 browser cases passed at frozen `output/ask-hardening/2026-10-08T03-26-58-291Z`. Natural atomic edits, no price/action contamination, duplicate field rejection, actual open-form VI/EN updates, keyboard focus and unchanged manual notes covered. Entire draft validated before any edit; actual server creates one custom order under concurrent replay, no quote/payment assertion. Web research/provider/continuous-learning acceptance remain NOT_IMPLEMENTED/NOT_RUN.

## Research, context and feedback: current executable coverage

Current source-bound evidence: 21 new unit cases in ask-research.test.ts (7), ask-research-gemini.test.ts (5), ask-research-budget.test.ts (2), ask-context-feedback.test.ts (7); 10 actual-handler demo cases in ask-research-feedback.test.ts; 23 actual-component browser cases in ask-research-feedback.spec.ts. These add to full current 1207-unit / 60-demo / 119-browser runs. Full unit result is 1206 passed, 1 failed (Dashboard markers outside owned scope); no full-pass claim. All phase snapshots are identical, sourceStable=true.

| Family | Happy case | Bad cases actually exercised | Evidence level / limit |
|---|---|---|---|
| Reviewed merchant evidence | OWNER/MFA approve, exact revision replay, polite VI/EN query, select quantity into canonical source-backed draft | Invalid URL/host/seller/currency/review/time, expired/revoked/tampered source, stale selection, locked account, absent MFA, punctuation query, quota, known catalog duplicate | Domain + actual demo handlers; source approval manual, no automatic seller verification |
| Public Gemini discovery | Fixed endpoint/full request counted/reserve before network, valid grounded response | Private input, unknown market/merchant, failed count/generation, overflow, denied reserve, cancellation and policy/pricing expiry during reserve/count | Unit injected transport; one actual validated provider receipt, no end-to-end customer acceptance |
| Citation redirect | Fixed Google proxy -> approved HTTPS source | Evil/private/prefix/query hosts, unknown targets, two-hop loop and policy expiry after await | Unit restricted transport; post-fix real redirect NOT_RUN |
| Test budget | Atomic bounded local ledger replacement, no orphan temp | Oversize preserves previous ledger; reservation persistence failure dispatches zero provider calls; third attempt blocked | Actual temporary filesystem + unit budget admission; unknown reservation not refunded |
| Context | Original revision-bound span IDs/headings, full request wrapper counted, protected current facts/task retained | Required overflow, malformed count/output reserve, stalled cancellation, UTF-8 including JSON array overhead | Exact-counter seam only; char chunks/lexical retrieval active, production model-loop/token/semantic integration incomplete |
| Feedback | Explicit consent on actual answer hash/version, concurrent identical UUID replay, OWNER review tied to current published source | No consent, extra raw chat/payment fields, wrong owner/hash/version, locked account, expired policy, role/MFA/CAS, source changed/unpublished, client direct-read/write denial | Actual demo handlers; no model/prompt/knowledge promotion |
| Evaluation | Comparable frozen holdout produces REVIEW_REQUIRED | Safety/factual/retrieval/task regression, changed hash/split/case IDs/count/duplicates | Offline synthetic scores; no actual business holdout or measured learning improvement |
| Research UI | VI/EN, 390/320px, native keyboard/200% CSS zoom, two-item sourced draft | Empty/unknown price/partial/offline/expired/stale/malformed/account switch/pending commerce | Actual components with synthetic auth/API; no automatic submit/pay |
| Feedback UI | VI/EN/native keyboard/mobile/unchecked consent | Offline/unknown exact UUID retry/malformed receipt/account switch | Actual components with synthetic auth/API; not retention/deletion/live staff review |
| Membership concurrency | Explicit exact retry after unknown outcome | Stale fresh click across two tabs cannot become implicit replay | Six repeated contention cases, 29 current actual-component regression cases; existing handler idempotency only |

Still NOT_IMPLEMENTED or NOT_VERIFIED: fresh web search automatically from arbitrary customer chat; seller-specific price/review/stock/variant adapters and source comparison; compliant Search Suggestions customer integration; source-price-to-staff-quotation live journey; semantic multilingual retrieval + authoritative policies + measured holdout; model-loop context/compaction/opt-in memory; feedback staff inbox, withdrawal/TTL/deletion and reviewed corpus-update/canary pipeline; authenticated App Check/customer/staff/payment release and rollback acceptance. Earlier scenario inventories are requirement lists, not proof these are done.


## Integration cycles31–33: automatic chat web, complete request context, reviewed learning

Supersedes the previous NOT_IMPLEMENTED entries for automatic chat discovery, Suggestions embedding, native request counting and feedback inbox/withdrawal/cleanup source. Broad live/service/learning acceptance remains incomplete. Canonical current evidence is QUALITY-GATES-INTEGRATION.json; no scenario inventory count is a success percentage.

| Family | Happy cases executed | Bad cases executed | Evidence boundary |
|---|---|---|---|
| Automatic chat web | Fresh complete catalog miss + US; market-only “Mỹ” follow-up; separate Suggestions/direct links; native choice and “chọn nguồn1, số lượng2, mẫu Đen”→canonical saveDraft | Missing/conflicting market, English “my”, guest, partial/offline catalog, malformed/unknown web response, missing/exhausted ledger, imported-budget reset, duplicate/version-changed unknown query | Actual unit/demo handlers and component tests; web happy uses gated owned synthetic catalog/Vertex; default incomplete shared catalog stays blocked |
| Web source selection | Explicit source/quantity/variant, current owner/version/policy, exact draft result | Missing fields, question instead of command, nonexistent ordinal, quantity100, expired/revoked/stale source, UID change/pending task/existing draft, returned price/action contamination | Typed server and actual component paths; no auto submit/quotation/payment |
| Source refresh expiry | Same mounted component gets expired then new valid source; controls recover | Old expiry must not survive refreshed result; timer/unmount generation still fenced | Reproduced failing browser web-refresh-before.json→fixed browser-final.json,18integrationpass |
| Protected complete context | Coherent owner task/order/source revisions; full serialized native count; preserve current facts/task/output reserve | Foreign/mismatched order, private recipient/notes/URL projection, UTF8/invalid counter/required overflow, optional excess trimmed, current-source/task changes after generation | Actual request-builder/native fake-counter and demo coherent reads; existing OWNER pilot closed; no real provider generation this continuation |
| Consent and withdrawal | Active actual retention shown before opt-in; same UUID retry; sent/unknown event withdrawn | No/current expired policy, wrong version/timestamp, old create after tombstone expiry, quota/account switch, unknown withdrawal, review cannot revive withdrawn row | Actual demo transaction/actual components; proposed30days is not official |
| Review and retrieval evaluation | OWNER/MFA metadata inbox, current approved source preview/disposition, actual frozen public QA retrieval, hash/case counts | Missing holdout, stale/unapproved/changed publication, absent role/MFA, concurrent review/unknown exact-retry/account switch, malformed/expired inbox records, retrieval regressions | Actual retrieveKnowledge runner and demo handlers; no caller score claim/model training/automatic promotion |
| Cleanup | Expired bounded batch records deleted in fake database test with snapshot update-time condition | Newer record must not be deleted from old read; expired/withdrawn records excluded from serving | Source and meaningful injected-database test; production scheduler/TTL/backups/physical deletion NOT_RUN |
| Existing commerce and recovery | Exact catalog/draft selection, Membership unknown UUID recovery, source-bound changed-context guard | Direct price/payment flags, stale owner/version, competing tabs, malformed receipts, revoked source | Current97Askunit/78affectedbrowser before expiry fix/18finalintegration; historical69demo/138fullbrowser remain frozen evidence |

Current related25unit has24pass/1Dashboard marker failure; historicalfull1221has1220pass/1same family failure. Current full139-browser suite NOT_RUN after the one new expiry regression; the18current integration cases are verified separately. Remaining: official corpus/holdout/retention decision, usable live seller/variant/stock/price/review research, current-provider cost reconciliation, semantic/customer-wide NLU, durable compaction and measured reviewed-learning canary, authenticated AppCheck/customer/staff/payment/retention/release acceptance. No existing test assertion, required authentication or budget control was weakened.
