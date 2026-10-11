# Ask platform implementation status

Current authoritative checkpoint: **research/context/feedback continuation, review cycle 30**, below. Earlier checkpoints are historical and may say provider calls were not run; the new bounded Gemini probe supersedes that statement for this test only. Full objective remains **NOT_DONE / BLOCKED / NOT_READY**.

**Overall: NOT_DONE. Final review: BLOCKED. Production readiness: NOT_READY.**

This iteration implements and verifies hardening of existing Ask retrieval, read/draft model-loop admission, stream handling and completed-operation recovery. It does not implement the entire architecture plan.

## Implemented

- Paragraph/line/sentence-aware bounded source spans; original evidence preserved, Unicode boundaries protected; diversity first then complementary spans; ambiguous duplicate citations excluded.
- Read/draft tool admission shares one immutable allowlist, call budget, deadline and cancellation signal. Final model result checks run status.
- Stream answers withheld until validated final data agrees. Stalled iteration/final promises can be cancelled. Iterator cleanup does not block cancellation.
- Completed-operation resume returns validated stored result including immediate draft operations, without replaying writes; owner/account-lock and result version/order correlation enforced.
- Safe test harness allows only demo-satsunicgo on known local emulator ports 8181/18207; arbitrary targets rejected.
- Happy/bad cases, source manifest, explicit approval record and review findings recorded.

## Review / fix / verify cycles

1. Found stream premature publication, stalled cancellation and discarded complementary evidence. Fixed; focused unit suite passed.
2. New integration exposed immediate completed-draft recovery failure. Fixed; new scenarios passed.
3. Review strengthened stored result version/order correlation and policy immutability; protected Unicode at document hard bound. Added negative tests; reran integration/unit checks.
4. Actual-source diff reviewed again: no known unresolved defect within the executed Ask checks. Overall gate stays BLOCKED for full requirement coverage and production acceptance.

5. Added owner/MFA approved public-source lifecycle, content-hash/version fences, immutable revisions, effective dates, revocation, quota and direct-read denial. Found stale-source revocation UI and radio-group required-label errors; fixed and tested.
6. Reviewed rendered mobile UI; repaired a wrapped required marker and added expired/unavailable-source revocation coverage. Fresh scoped review retains full-plan and production blockers.

7. S18 customer workspace: Profile form mounted in Ask through explicit lazy expand control. Unknown address/profile save now retains exact operation/payload/version, blocks edited writes, validates correlated result and fences account changes. Unique instance IDs avoid page/panel collisions. Actual backend and UI checks passed; reload durability and remaining platform work keep overall review BLOCKED.

## Quality evidence

- Frontend and backend TypeScript noEmit: PASSED in preceding cycle; latest S18 frontend TypeScript PASSED (no backend implementation change).
- S18 current checks: **5 backend integration**, **8 browser recovery**, **15 affected unit**, **5 Ask browser regression** tests PASSED. Browser fixtures mock auth/backend; backend tests execute actual workspaceCommand on synthetic demo records.
- Scoped ESLint and whitespace: PASSED.
- Full unit suite on production-compatible Node 22 with test-only App Check site key unset and permitted loopback: **112 files / 959 tests PASSED**. Production App Check remains unchanged.
- Latest demo integration: **3 suites / 23 tests PASSED**, including 7 approved-knowledge cases, 10 workflow/recovery cases and 6 existing hardening cases.
- Owner knowledge UI: **6 browser scenarios PASSED**, including expired-source revocation; post-fix focused unit/required-label check **16 tests PASSED**.
- Actual-consumer browser fixture: 5 passed; composer regression: 8 passed.
- Ambient Node/App Check and sandbox telemetry failures were reproduced; Node 22 with test-only settings and authorized loopback passed. Membership required radio-group marker fixed; stricter marker tests retained.
- Repository intelligence: DEGRADED; source/compiler/test verification used. Legacy approval validator requires READY despite repository policy allowing DEGRADED; no false READY result recorded.
- Product-content evidence: PRODUCT-CONTENT.md and PRODUCT-CONTENT-KNOWLEDGE.md. New Vietnamese owner controls and VI/EN quoted-answer semantics reviewed; full customer Ask locale coverage remains incomplete.
- ai-agent-kit is not available on PATH or in local node_modules; runtime review receipt/report command NOT_RUN. Saved review JSON is not claimed as a runtime receipt.
- No commits, push, deploy, paid provider calls, spend enablement or production data operations performed. Restored stopped shared frontend on 5207 with demo settings; backend data preserved. Firestore is available, but complete Auth/Functions runtime is not claimed.

## Live production readback

- Production Functions are ACTIVE; earlier zero-functions evidence is obsolete.
- Exact deployed compiled source differs from this candidate; run-guard and approved-knowledge modules are absent from that artifact. Changes are NOT_DEPLOYED.
- Ask Cloud Run IAM has no public invoker binding. Both service and Firebase SDK URL return unauthenticated HTTP 403. This is network denial, not authenticated/App Check acceptance.
- Owner pilot pricing authorization expired at 2026-10-08T00:00Z; not extended. General paid-generation gate remains closed. No paid provider call made.
- See PRODUCTION-ASK.json, PRODUCTION-SOURCE-COMPARISON.json, PRODUCTION-ASK-IAM.json and PRODUCTION-SDK-UNAUTH-SMOKE.json.
- Dirty concurrent WIP prevents deploying the complete current tree. Scoped release artifact must isolate only reviewed changes.

## Remaining plan work

| Area | Status / remaining |
|---|---|
| Capability inventory / contracts / durable run registry | Partial; no full business-capability coverage measurement or general durable run ledger |
| Approved corpus / version and effective-date lifecycle | Implemented lifecycle and owner UI; authoritative production articles await owner selection; no automatic approval |
| Hybrid semantic retrieval / index / retrieval benchmark | NOT_IMPLEMENTED; current lexical retrieval only, bounded 100 docs / 8 excerpts |
| General grounded provider Q&A | NOT_READY; existing general paid guard intentionally rejects every generation; owner-pilot remains separately limited |
| Preview / expiring approval / execute gateway across all capabilities | Partial existing commerce flow; no universal payload-bound approval gateway |
| Profile/address/membership/change/document/staff task expansion inside Ask | S18 Profile/address includes durable reload resolution; S19 Membership available in Ask with exact mounted retry and private-state validation. Membership durable reload, change/document/staff expansion and full English forms remain incomplete |
| Durable compaction / optional memory | NOT_IMPLEMENTED |
| Customer analytics outbox / aggregates / insights | NOT_IMPLEMENTED |
| Full happy/bad capability acceptance corpus and canary/release | NOT_IMPLEMENTED; new scenarios cover current hardening only |

No completion percentage is invented. Source-local, demo integration, fixture browser, live provider and production evidence remain distinct. Passing current tests does not prove Ask can perform almost every service task.

Token usage: Unavailable. Actual billed cost: Unavailable. Memory candidates: None. Unrelated concurrent WIP preserved.

## Current continuation: cycles 8–9

Implemented metadata-only Profile/address recovery across reload, shared admission with Web Locks, authoritative resolver, admission quota and audited cancellation fences. A late original request cannot commit after a confirmed not-saved result. Added Membership inside Ask; paid purchase creates a pending invoice, free activation and renewal intent preserve existing backend semantics. Unknown outcomes retry the original operation. Snapshot failures/account changes clear private state; malformed prices, dates, entitlement states and results fail closed.

Review found and fixed late-commit races, failed-lookup quota evasion, changed renewal retry intent, invalid private/public snapshots, stale owner display and recovery-success error styling. Fresh final source/diff review has no known unresolved defect in the executed scope; overall review remains BLOCKED for full acceptance.

Latest verification: **959 unit tests / 112 files**, **24 Profile + Membership browser cases**, **17 current demo backend cases**, **13 Ask/composer browser regressions** passed. Frontend/backend TypeScript, scoped ESLint and whitespace passed. Browser tests use actual components with synthetic auth/backend fixtures; demo backend tests use actual handlers and Firestore, not deployed HTTP/App Check.

Production readback: workspaceCommand ACTIVE, updateTime 2026-10-08T00:54:20.404252637Z, exact source generation 1791420803535554 lacks customer-save fence. customerSaveResolve returned NOT_FOUND. Guard-first rollout and rollback constraints are documented in RECOVERY-ROLLOUT.md. No deployment, financial correction, IAM change or paid call performed. Earlier Ask IAM/artifact findings above are historical snapshots, not refreshed current acceptance.

Quality gates: repository intelligence DEGRADED; scoped requirement/security/failure/error/code/product-content checks PASSED; full requirement and production gates BLOCKED; runtime review receipt NOT_RUN. Product review: PRODUCT-CONTENT-RECOVERY-MEMBERSHIP.md. Safari and assistive-technology acceptance NOT_RUN. Token usage and billed cost Unavailable; memory candidates None.

## Cycle 10: natural-query retrieval and contiguous context

Current user explicitly authorized knowledge/context hardening. Added bounded single-edit matching for alphabetic terms at least five characters, weighted below exact matching; numbers and short terms are never fuzzy-corrected. Long sections retain 160-character contiguous overlap with original offsets and UTF-16 boundaries. No rewrite of raw questions, identifiers or source text; no history/auth/provider changes.

Verification: 4 focused files / 46 tests PASSED; backend TypeScript, scoped ESLint and whitespace PASSED. Fresh source review follows verification. Previous full 959-test suite predates this delta and is not promoted to current full-suite evidence. Product/real-provider answer acceptance NOT_RUN; overall review BLOCKED.

This is a lexical improvement, not complete natural-language understanding. Remaining implementation: explicit conversation reference resolution with ambiguity clarification; semantic/lexical fusion and calibrated thresholds; section headings/table headers/conditions and exceptions; real tokenizer budget and corpus benchmark; authoritative effective-date corpus; provider citation/revision acceptance. No deployment or paid calls. Token usage/cost unavailable; memory candidates None.

## Cycles 11–12: review, fix, test, fresh review

Review found competing typo spellings could leak into retrieved evidence even when an exact term existed. Fixed by resolving each query term once against the bounded non-conflicting source vocabulary. Exact corpus spelling disables fuzzy expansion; multiple near spellings disable correction. Conflicting publications cannot influence interpretation. Original question and source remain unchanged. No history/auth/publication/provider changes.

Current verification: **112 files / 964 full unit tests PASSED** on Node22 with test-only App Check setting; **49 focused tests PASSED**, backend TypeScript, scoped ESLint and whitespace PASSED. Fresh complete retrieval diff review after verification found no additional known defect in executed scope. Product/real-provider answer acceptance NOT_RUN; overall review BLOCKED. Local unit success is not proof of production language understanding.

Remaining: conversational references and ambiguity clarification, hybrid semantic retrieval, real tokenizer/retrieval benchmarks, authoritative corpus and production acceptance. Repository intelligence DEGRADED (stale indexes); runtime receipt NOT_RUN. Token/cost unavailable; memory candidates None.

## Cycles 13–16: full local scenario loop and chat purchase continuation

Inventoried 62 full-journey scenarios plus 53 purchase/research/improvement scenarios (115 targets). Execution tiers and NOT_IMPLEMENTED/NOT_RUN gaps are explicit. Added serial runner with demo-target guards, unique JSON reports and immutable source/test/config snapshot; drift marks STALE and subsequent phases NOT_RUN. Runner rejection tests prevent production/remote execution. No server restart/reseed or cloud fallback.

New actual failing cases reproduced Unicode numeric fuzzy matches and orphaned table overlap rows; fixed both. Added chat-command variants/no accents with guarded confirmation; fixed question punctuation being treated as consent. New bounded chat-fill changes quantity/variant/market for a selected draft through existing resolved/saveDraft path. Actual form test exposed stale defaultValue; repaired only 3 field keys, preserving other manual notes. Mixed/invalid/ambiguous text does not auto-submit or set money. Actual backend chain persisted edited draft and one custom order under concurrent replay, collected=0; forged research price/payment fields rejected.

Current final loop: **116 files / 1061 unit tests**, **46 actual-handler demo tests**, **51 browser cases** PASSED. Source remained stable through all phases; current source rechecked against snapshot. Frontend/backend TypeScript, scoped ESLint and whitespace passed. Test-only unit App Check site key blank; production controls unchanged. Demo auth is crafted; browser mocks auth/API/data hook, actual Ask parser and CommercePanel/form rendered. No live token/App Check/LLM/search/payment acceptance claimed.

Evidence: output/ask-hardening/2026-10-08T03-10-23-672Z/{source,summary,unit,demo,browser}.json. The earlier 1000/1004 test reports are historical iterations. The initial browser model-dispatch counter incorrectly counted module import; fixed instrumentation to count actual function invocation. Runner lint/config-path findings corrected, final loop passed.

Fresh review: no additional known defect within executed scope; overall **BLOCKED / NOT_READY**. Remaining real web research, trusted merchant/review validation, offer comparison and selection binding, research estimate persistence, broad multi-turn NLU/semantic/token-aware context, Membership durable reload, continuous-improvement deployment, English current copy/browser and authenticated production acceptance. Provider/budget question is pending; no paid admission enabled. Research price is dated evidence for staff review, not staff final quote/payment authority. CHAT-PURCHASE-PLAN.md documents sourced research direction and safe improvement workflow.

Git tree dirty/concurrent WIP preserved, no commits/push/deploy. Intelligence DEGRADED. Runtime review receipt NOT_RUN (CLI unavailable), JSON review saved. Token usage, API-equivalent and actual billed cost Unavailable. Memory candidates None; no memory writes. No coverage/completion percentage invented.

## Cycles 17–18: natural compound edits, actual routing and English acceptance

Added failing cases for 1–3 explicit field clauses in one message, polite/no-accent forms, duplicate/invalid fields and mixed price/address/transaction instructions. Initial 11 unit failures exposed unsupported formats and variant text absorbing a price clause. Parser now validates the complete message before applying any change; preserves original variant spelling and unrelated fields; does not guess products or money. Actual browser then exposed earlier mixed-read routing intercepting recognized edits. Precomputed guarded draft-change result now exempts these edits/clarifications from mixed reads; mixed transactions still clarify with no edit. Fresh complete diff/source review followed fixes.

English browser scenarios restore explicit previous EN preference; sparse brand/commerce terms intentionally retain current locale. Actual VI/EN updated/clarify copy, current form values and composer keyboard focus verified. Initial test incorrectly expected composer focus after deliberate form-details click; assertion corrected to run before that interaction. No application focus behavior changed. Existing manual notes preserved.

Final current loop: **116 unit files / 1074 tests**, **4 demo files / 46 tests**, **55 browser cases (zero retry/flaky/skipped)** PASSED. Both frontend and backend noEmit, scoped ESLint and git diff --check each ran separately with exit 0. Snapshot contains **623 source/test/config files**, sourceStable=true in every phase, current source rechecked with no drift and matching HEAD. Demo compound edit -> save -> explicit submission -> concurrent replay produces exactly one custom REQUESTED order, market JP, variant M, quantity 2, collected 0 and no staff quote.

Latest evidence: `output/ask-hardening/2026-10-08T03-26-58-291Z/{source,summary,unit,demo,browser}.json`. Previous 1061/51 evidence predates compound delta. Inventory now **117 target scenarios (62 platform + 55 purchase)**; target count is not a completion score. Browser fixtures still mock auth/API/commerce state; demo invokes actual handlers with crafted authentication and real local Firestore. No live authenticated HTTP/App Check/search/LLM/payment proof.

Current scoped chat-draft product review PASSED with all eight principles and actual VI/EN context evidence; full platform product and release acceptance remain incomplete. Assistive technology, Safari, live deployment and actual merchant/provider acceptance NOT_RUN. Web discovery/comparison/selection/estimate persistence and continuous improvement automation remain NOT_IMPLEMENTED; provider/budget input pending. No schema/financial authority/policy/IAM/production deployment changed. Root performed fresh review independently of implementation phase; no external reviewer/subagent claimed.

Overall review **BLOCKED**. Production **NOT_READY**. No known additional issue within the checks executed; this is not a complete Ask platform handoff. Current worktree is dirty with preserved concurrent WIP at HEAD 53d59bd88fa7da9d1243692336ecd09b6540ea31. No commit/push/deploy/provider spend/financial correction or memory write. Token usage, API-equivalent cost and actual billed cost: Unavailable. Memory candidates: None.

## Historical quality gates: cycle 18 (superseded by cycle 22 below)

| Gate | Status | Evidence / limitation |
|---|---|---|
| Compilation passed | PASSED | Node22 tsc --noEmit and tsc -p functions/tsconfig.json --noEmit, each exit 0. Production build not run this cycle. |
| Unit tests passed | PASSED | Frozen current runner, 116 files / 1074 tests. |
| Integration tests passed where applicable | PASSED | 46 actual-handler demo Firestore cases; crafted auth, no live callable/App Check evidence. |
| Static analysis passed | PASSED | Scoped ESLint exit 0; whitespace exit 0. |
| Architecture checks passed | PASSED | Scoped source/caller/contracts read; owner/stage/version and catalog/custom finance rules preserved. Intelligence DEGRADED, full architecture coverage not claimed. |
| Language/version quality profile selected | PASSED | typescript-javascript; TS6 strict ES2022, Node22 (Functions engine), React19/Vite8/Vitest4/Playwright1.63 verified manifests. |
| Platform/domain quality profile selected | PASSED | universal, web-app, frontend-html-css, API, database, concurrency, memory selected for affected boundaries. |
| Public web SEO/GEO profile selected where applicable | NOT_APPLICABLE | Chat routing/form update, no indexed public article/route metadata change. |
| Visual design profile selected where applicable | PASSED | visual-design; existing Ask brand/layout retained, actual mobile/desktop and EN response screenshot inspected. |
| Product content profile selected where applicable | PASSED | product-content and write-product-content; current inventory/eight principles in PRODUCT-CONTENT-CHAT-DRAFT.md. |
| Animation and motion profile selected where applicable | NOT_APPLICABLE | No animation/style change; existing reduced-motion browser regression passed. |
| Language-aware static analysis passed | PASSED | TS noEmit/scoped ESLint, no new dependency. |
| Security checks passed | PASSED | Scoped auth/lock/owner/input/quota/privileged-read/mixed-consent cases; no comprehensive external security audit claimed. |
| Database migration validated | NOT_APPLICABLE | No migration/datafix this continuation; existing transaction/replay handlers exercised with synthetic records. |
| API compatibility reviewed | PASSED | Request/quotation/payment authority contracts unchanged; new local parser returns existing shoppingDraft type; provider interface not introduced. Recovery guard rollout constraints remain separate. |
| Observability impact reviewed | PASSED | Unique JSON evidence, phase statuses/source hashes; no sensitive research/customer data logging added. Production metrics/alerts acceptance not run. |
| Diff self-reviewed | PASSED | Entire current scoped diff/new helper/callers/tests reviewed after verification; manifest binds candidate. |
| Final implementation review current and passed | FAILED | Cycle18 current JSON review BLOCKED for full target/production gates; runtime receipt NOT_RUN because ai-agent-kit unavailable. |
| Search metadata/crawler/structured data/claims reviewed where applicable | NOT_APPLICABLE | No public SEO surface changed; no merchant/stock/review claims introduced. |
| Design/responsive/states/accessibility/motion/visual evidence reviewed | PASSED | Current VI mobile + VI/EN desktop/native controls/keyboard and recovery regressions; no new layout/motion. Safari/AT not run, no full accessibility certification claimed. |
| Product language/eight principles/platform fit/in-context evidence reviewed | FAILED | Current chat-edit slice PASSED; full Ask locale/provider/service acceptance remains incomplete. Overall Product Language Gate remains BLOCKED. |
| Animation purpose/reduced motion/cleanup/evidence reviewed | NOT_APPLICABLE | No animation change; existing reduced-motion browser case retained. |

Runtime criterion/check/review/task-report commands NOT_RUN: executable unavailable. Review JSON and this evidence report are saved manually and are not runtime receipts. No missing gate promoted to production READY.


## Cycles 19–22: catalog purchase through chat and recovery admission

Current human continuation authorizes the approved Ask/domain/client/test hardening. CATALOG-CHAT-PLAN.md records source facts, impact, scope and each review delta before edits. No paid-provider admission, production deployment or financial correction. CodeGraph first and CocoIndex second were queried, both stale; index refresh failed on CocoIndex daemon-log permissions. Final intelligence gate remains DEGRADED at HEAD 53d59bd88fa7da9d1243692336ecd09b6540ea31. Native source/handlers/tests/compiler evidence was used; no full index coverage claimed.

Customers can choose a displayed catalog row by chat, edit its canonical listed variant and count, review the real controlled selection form/VND total, and explicitly confirm creation. Ordinals retain quote-only rows so item numbers cannot shift. A selection is bound to the current user/conversation, source freshness and product version, expires after five minutes and is discarded on account/conversation restoration, reload or new catalog search including failed mixed catalog/fees searches. Single-option/count-one defaults match the existing catalog form and are visible before confirmation. Multi-option products require a variant. Unknown/unsupported phrases clarify or retain existing read routing; broad free-form NLU is not claimed. Manual controls also work. A catalog choice cannot submit a preserved unrelated custom draft. Guest can preview/edit, but must sign in and select again before creation.

Creation uses the existing catalogCheckout command. Backend rechecks price/version/variant; concurrent retry creates one authoritative catalog order, collected=0, no custom staff quote/deposit. A stale product price version is rejected without order creation. The client now admits exact completion shape/version/order correlation before retiring pending or claiming success. Recovery checks authoritative no-operation/completed results against original metadata. Corrupt or cross-conversation envelopes remain blocked; private-payload-free non-catalog commands resume their server-stored original request instead of reconstructing changed fields. Existing conversation snapshots are validated for shape and owner before hydration; invalid owner/version/turns clear displayed state, block the composer and show a recovery alert.

Review findings F22–F26 are fixed and verified: unvalidated completion, unvalidated recovery, unsafe conversation casts, unvalidated pending/reconstructed payload and mixed-search stale choice. Full review history is in FINAL-REVIEW.json. Root performed separate source/diff/caller review cycles after implementation/verification; no external reviewer/subagent claimed. No additional known defect was found within the executed slice. Full Ask requirements and production gates remain BLOCKED.

Initial new unit files intentionally failed because helpers were not implemented yet. Subsequent source/schema/admission regressions pass. Browser test initially assumed a question must call the model; actual existing mixed-read clarification correctly made zero calls, so its instrumentation expectation was corrected while retaining the no-command assertion. Hidden dialog duplicated an error locator; assertions now select the visible state. Snapshot test expected missing notes instead of existing domain canonical empty notes default; expectation was corrected. TypeScript exposed optional spread from a nullable pending envelope; the branch now narrows the admitted object. No safety assertion, authentication check or production guard was weakened.

First full fork-worker run encountered EAGAIN/EPIPE process exhaustion and could not finish its source snapshot; it is not counted as passed. Runner uses one thread worker and records snapshot-check failure as incomplete/STALE rather than crashing with an unfinished summary. No other task's processes were killed and no shared server was reset/reseeded/restarted. The following full acceptance completed successfully.

Final evidence: output/ask-hardening/2026-10-08T04-13-49-648Z/{source,summary,unit,demo,browser}.json. Frozen snapshot contains 630 source/test/config files; sourceStable=true in every phase and current file hashes rechecked without drift. HEAD unchanged. **119 unit files / 1156 tests**, **4 actual-handler demo files / 48 tests**, **79 browser scenarios including 24 catalog-chat cases**, all passed with zero failed/skipped/flaky/retry. Browser uses actual Ask, useAskCommerce, CommercePanel, CatalogSearch and CatalogChat with synthetic auth/API/Firestore snapshots; other suites document their own mocks. Demo invokes actual handlers against real local Firestore with crafted authentication. This is not deployed HTTP/token/App Check/search/LLM/payment or production evidence.

Additional VI/EN desktop 1280×1000 and mobile 390×844 screenshot scenarios passed using the same source and shared frontend. Stable copies: output/ask-catalog-evidence/{happy-vi,happy-en,mobile}-preview.png; source/config/artifact hashes recorded in SOURCE_MANIFEST.json. Mobile content is vertically scrollable; no horizontal dialog overflow. Product inventory/states/all eight Human Interface principles and bounded platform fit are in PRODUCT-CONTENT-CATALOG-CHAT.md. Guest VI and EN normal/recovery are covered; exhaustive locale/state combinations, Safari/AT, live acceptance and full-platform product language remain unverified.

The target inventory now has **137 scenarios: 62 platform + 75 purchase**. This is an acceptance inventory, not completed-feature coverage or a completion score. BUY-056–075 have current local/demo checks; web/source/provider/continuous-improvement scenarios retain honest NOT_IMPLEMENTED/NOT_RUN statuses. Earlier 1074/55 and 1156/78 reports are historical candidates, superseded by the guest-inclusive final snapshot.

### Remaining acceptance criteria

| Criterion | Current status / required work |
|---|---|
| Catalog displayed-list chat selection/variant/count/preview/creation | PASSED local/demo bounded explicit commands; live callable/App Check/customer acceptance NOT_RUN |
| Custom draft edits and explicit custom submission | PASSED local/demo existing scoped cases; broad initial NLU/reference resolution incomplete |
| Web fallback, approved merchant/seller/review evidence, comparison and selected-offer binding | NOT_IMPLEMENTED; one supported provider, budget/pricing and merchant/seller policy decisions pending; no billable admission enabled |
| Research estimate source/currency/date persistence and staff review | NOT_IMPLEMENTED; staff quote/payment authority must stay separate |
| Authoritative production knowledge corpus | NOT_READY; lifecycle exists locally/demo but approved business content selection/readback remains pending |
| Semantic/lexical fusion, calibrated reference resolution and real token chunk budget | NOT_IMPLEMENTED; current bounded lexical/section retrieval only, no tokenizer/corpus benchmark certification |
| Durable compaction/optional long-term memory | NOT_IMPLEMENTED |
| Staff-reviewed feedback/evaluation/holdout promotion and customer analytics | NOT_IMPLEMENTED; no autonomous learning from private chats or automatic policy approval |
| Membership full-reload recovery and broader service/staff/change/document actions | S19-R1 exact durable Membership replay implemented locally/demo; production retention, price-bound resolver and cross-tab workspace coordination unverified. Broader service/staff/change/document actions remain incomplete. |
| Full locale, Safari/AT and real production happy/bad journeys | NOT_RUN / NOT_READY |
| Release artifacts, guard-first rollout, authenticated provider readback and rollback | NOT_READY; no deployment occurred; historical cloud findings are not refreshed proof |

No acceptance weights were supplied; no completion percentage is invented. Scoped reviewed work passes the checks above; overall newest review remains **BLOCKED**, production **NOT_READY**. The pending provider/budget/merchant/corpus decisions block the live research/answer path. Remaining independent capabilities are still implementation work, not merely release verification.

### Historical quality gates: cycle 22 (superseded by the continuation below)

| Gate | Status | Evidence / limitation |
|---|---|---|
| Compilation | PASSED | Frontend/backend Node22 TS noEmit, separate exit 0; no application changes afterward. Production bundle/release build NOT_RUN this cycle. |
| Unit tests | PASSED | Frozen final snapshot, 119 files / 1156 tests. |
| Integration tests where applicable | PASSED | 4 files / 48 actual-handler demo cases with crafted auth; live HTTP/App Check NOT_RUN. |
| Static analysis and language-aware checks | PASSED | Scoped ESLint exit 0, final guest-only test also linted; whitespace exit 0 and rechecked at handoff. |
| Architecture | PASSED scoped | Domain helpers own deterministic admission/selection, client uses existing backend command, server pricing/owner authority preserved; DEGRADED intelligence, broad architecture coverage not claimed. |
| Language/version profile | PASSED | typescript-javascript; TS6 strict ES2022/Node22/React19/Vite8 verified source manifests. |
| Platform/domain profiles | PASSED | universal, web-app, frontend-html-css, API, database, concurrency, memory; bounded snapshot/context, serial queue, recovery identity, original operation and cleanup reviewed. |
| Public SEO/GEO | NOT_APPLICABLE | No indexed public route, crawler or structured-data change. |
| Visual design profile | PASSED scoped | Existing Ask design system/native controls, desktop/mobile rendered evidence, no new dependency/style/motion. |
| Product content profile | PASSED selected | write-product-content, product-content; complete changed-copy inventory and eight-principle mapping in PRODUCT-CONTENT-CATALOG-CHAT.md. |
| Animation profile | NOT_APPLICABLE | No animation change; existing reduced-motion regression passed. |
| Security | PASSED scoped | Owner/version/stage/variant/expiry/mixed-consent/corruption/replay tests; no exhaustive external audit or full order-snapshot certification. |
| Database migration | NOT_APPLICABLE | Read-side shape validation only, no migration/datafix; actual demo catalog transaction exercised. |
| API compatibility | PASSED scoped | No backend public contract or financial schema changed; client validates existing response and original metadata. |
| Observability | PASSED scoped | Unique JSON evidence and source hashes, honest incomplete/STALE states, no sensitive logging; live metrics/alerts NOT_RUN. |
| Diff self-review | PASSED scoped | Complete current affected source/new helpers/callers/test paths reviewed after fixes; manifest binds candidate. |
| Final implementation review current and passed | FAILED overall | Cycle22 current BLOCKED; scoped checks pass, full requirements/production incomplete. Runtime receipt NOT_RUN: ai-agent-kit unavailable. |
| Search metadata/crawler/claims | NOT_APPLICABLE | No public SEO change or unverified merchant/rating claim introduced. |
| Responsive/states/accessibility/motion/visual evidence | PASSED scoped | VI/EN, guest, keyboard/manual, mobile overflow, recovery and actual rendered screenshots; Safari/AT not certified. |
| Product language/eight principles/platform fit/in-context | FAILED overall | Catalog slice bounded review passes; full Ask service/provider/locale acceptance incomplete. |
| Animation cleanup/reduced-motion evidence | NOT_APPLICABLE | No new animation/timer added; existing regressions retained. |

Runtime criterion/check/review/task-report receipts: NOT_RUN, ai-agent-kit executable unavailable. This saved report/JSON is manual evidence, not a runtime ledger receipt. Dirty concurrent worktree preserved at HEAD 53d59bd88fa7da9d1243692336ecd09b6540ea31. No commit, push, PR, production deployment, paid call, financial correction, IAM change or memory write. Provider token usage, API-equivalent estimated cost and actual billed cost: Unavailable. Memory candidates: None.


## Cycles 23–25: Membership reload recovery

Current user continuation “Tiếp tực hardness” continues approved S19; concrete impact, pre-change hashes, constraints and exact ownership recorded in MEMBERSHIP-RELOAD-PLAN.md before edits. Intelligence remains DEGRADED: initial and review gates report stale CodeGraph and stale/unhealthy CocoIndex. Queries run CodeGraph first/CocoIndex second; both returned bounded Membership evidence during review, native source/tests verified the contracts. No full index coverage claimed. Stack remains Node22.23.3/TS6/React19/Vite8/Zod4/Vitest4/Playwright; universal, typescript-javascript, web-app, frontend-html-css, API, database, concurrency, memory, visual-design and product-content profiles selected. No dependency changes.

An unknown Membership request now persists a strict customer-only envelope before dispatch. Owner-hashed localStorage key, native Web Locks reservation and original UUID/action/resource IDs survive full reload/account return. No private profile/address/bank evidence/amount/owner identity is stored in the envelope. Reload never submits automatically. Manual retry sends the original operation, including when live subscription intent or the published plan changes. Another tab reserves one original operation; a fresh competing request adopts pending and does not dispatch. Reply shape/owner or invoice correlation and exact storage retirement are checked before clearing pending or announcing success. Account/generation fences cover hydration/reservation/response/retirement. Corrupt/inaccessible storage, missing locks and silently failed storage operations fail closed; no unknown operation is auto-expired or silently erased.

Paid purchase still creates a pending membership invoice, free purchase activates the free plan, renewal changes intent only; none confirms payment or automatically collects money. Actual-handler demo proves a committed invoice survives plan price/status changes with its original amount and ID, no duplicate invoice/entitlement, and a restored old renewal does not overwrite newer live intent. Backend finance/public contract/persistence policy unchanged.

Cycle23 fixed F27 lost-on-reload identity and F28 clearing an uncertain operation after a later permission rejection. Initial unit helper import failed before implementation; subsequently focused helper and mounted/reload cases passed. First demo attempt lacked required env; demo guard rejected before Firebase imports. Corrected explicit demo env ran 7 actual-handler cases. This is not a cloud failure or production access.

Cycle24 fixed test-evidence gaps F29–F31. Changed-plan fixture originally refreshed the same paid plan; it now changes ID/name/price and proves the retry still carries original planId/op. A count assertion was corrected to the fixture's actual one replacement row. Screenshot review found CSS zoom reset after reload; test now restores zoom, checks computed zoom=2 and horizontal overflow, with a visibly scaled screenshot. Fresh frontend compiler caught an impossible scaled-mode comparison inside the clear-storage-only branch; only that unreachable check was removed, scale/recovery assertions retained. Earlier two 1177/50/96 runs belong to their earlier test snapshots and are historical; final evidence below must bind to the current snapshot. No auth/permission/domain/safety assertion weakened.

Cycle25 fresh source/diff/caller/failure/privacy/concurrency/product-language review after fixes: current scoped outcome and full-platform blockers are recorded in FINAL-REVIEW.json. Root performed the separate review pass; no external reviewer/subagent claimed. ai-agent-kit unavailable on PATH; manual JSON/report are not runtime ledger receipts.

Final evidence: **output/ask-hardening/2026-10-08T05-10-24-184Z** / source.json, summary.json, unit.json, demo.json, browser.json. **120 unit files / 1177 tests; 4 actual-handler demo files / 50 tests; 96 browser scenarios (29 Membership), zero failed/skipped/flaky/retry**. Frozen 632-file source/test/config snapshot stable in every phase, current hashes rechecked without drift and HEAD unchanged. Last fresh source/diff/caller/contract/product/failure review found no additional known defect within the executed slice. Selected slice PASSED locally/demo; overall review BLOCKED and production NOT_READY. VI desktop/mobile/scaled and error screenshots copied into output/ask-hardening/2026-10-08T05-10-24-184Z/membership/ and hashed in SOURCE_MANIFEST.json. Earlier acceptance runs are historical after the test changes; no mixed-source pass asserted.

### Acceptance and remaining work

Membership exact reload replay is a bounded local/demo capability. New 17 reload/storage/account/concurrency/scaling scenarios bring the full target inventory to **154: 79 platform + 75 purchase**; inventory is not a feature-completion score. The current Membership browser spec has 29 scenarios and helper has 21 unit tests. Broader Ask knowledge/context/provider/learning/service acceptance remains the earlier remaining-criteria table, not implicitly completed by these checks.

Known remaining limits: live idempotency retention NOT_VERIFIED; backend current plan terms apply if original request never committed (no expected-price/revision contract or read-only resolver introduced); manual browser storage deletion cannot provide server recovery proof; all-tab profile/membership fencing and recovery before opening the Membership subpanel are not certified; complete English Membership, Safari/AT and live-auth/App Check journeys NOT_RUN. No new production success/payment/price guarantee. Production **NOT_READY**, full newest review **BLOCKED**. No acceptance weights or percentage invented.

### Current quality gates: cycle 25

| Gate | Status | Evidence or limitation |
|---|---|---|
| Compilation | PASSED | Current frontend TS noEmit exit 0 after F31; backend TS noEmit exit 0, backend source unchanged. Release bundle/build NOT_RUN. |
| Unit tests | PASSED | Current frozen snapshot: 120 files / 1177 tests, zero failed/pending. |
| Integration tests | PASSED | Current frozen snapshot: 4 files / 50 tests; crafted-auth actual handler/demo Firestore, not live HTTP/App Check. |
| Static analysis | PASSED | Scoped ESLint exit 0; final browser-test correction linted exit 0. |
| Architecture | PASSED scoped | Strict metadata helper and existing Membership callable, source-verified uid/op/hash transaction authority preserved; DEGRADED index coverage. |
| Language/version profile | PASSED | Source manifests and current TS/lint; TS6/Node22/React19. |
| Platform/domain profiles | PASSED scoped | Web/native storage-lock controls, bounded envelope, async fences, transaction replay; API/database/concurrency/memory profiles. |
| Public SEO/GEO | NOT_APPLICABLE | No indexed public route, metadata/crawler/structured-data change. |
| Visual design | PASSED scoped | Existing component/design system/55dvh scroll area retained; desktop/mobile/scaled rendered evidence; no style changes. |
| Product content profile | PASSED VI scoped | PRODUCT-CONTENT-MEMBERSHIP-RELOAD.md inventory, states, exact semantics, all eight principles. |
| Animation profile | NOT_APPLICABLE | No animation/timer added; existing reduced-motion regression retained. |
| Language-aware static analysis | PASSED | TS and ESLint check current test/helper/component; no generated edits. |
| Security | PASSED scoped | Customer-only envelope, no PII, existing server auth/lock/role/idempotency; no exhaustive external audit. |
| Database migration | NOT_APPLICABLE | No database/schema/retention/financial migration; unique demo fixtures only. |
| API compatibility | PASSED scoped | Existing Membership request/result contract, no backend changes; original replay body retained. |
| Observability | PASSED scoped | Unique source-bound evidence, exact operation correlation, generic errors; no sensitive logging. Live alerts/metrics NOT_RUN. |
| Diff self-review | PASSED scoped | Current helper/component/caller/handler/tests reviewed, compare to earlier frozen source confirms only five scope files changed. |
| Final implementation review current and passed | FAILED overall | Full Ask/provider/production acceptance remains BLOCKED. Current scoped result PASSED after frozen runner; runtime receipt NOT_RUN. |
| Search/crawler/structured data/claims | NOT_APPLICABLE | No public web merchant/rating/review claims or SEO change. |
| Responsive/states/accessibility/motion/evidence | PASSED scoped | Actual VI rendered recovery desktop/mobile/CSS zoom 200%, native keyboard Enter, no overflow; AT/Safari not certified. |
| Product language/eight principles/platform fit/in-context | FAILED overall | Changed VI recovery slice passes; complete EN/service/live acceptance still incomplete. |
| Animation cleanup/reduced motion | NOT_APPLICABLE | No new animation/timer; listener cleanup/generation fence reviewed under concurrency. |

Dirty shared worktree preserved at HEAD 53d59bd88fa7da9d1243692336ecd09b6540ea31. No commit, push, PR, production deployment, paid provider call, real customer write, financial correction, IAM change, shared server restart/reseed or memory write. Provider token usage, API-equivalent estimate and actual billed cost: **Unavailable**. Runtime check/review/task-report receipts: NOT_RUN, executable unavailable. Memory candidates: **None**.

## Research/context/feedback continuation: cycles 26–30

Human selected Gemini, reputable major sites and a 50,000 VND test ceiling. Implemented the reviewable foundation under RESEARCH-CONTEXT-FEEDBACK-PLAN.md; this is not full automatic customer web research or a completed learning system.

Changes: reviewed offers now have exact host/seller/market/currency, source text, observed/expiry time, immutable revision/hash and OWNER/recent-MFA lifecycle. Customer polite VI/EN lookup can compare up to five reviewed sources, select an exact revision/quantity and save a sourced custom-request draft with reference *unit* price in notes. Current catalog duplicate guard examines bounded title projections (<=4096), consumes quotas even for rejected heavy scans, and refuses incomplete coverage. It never makes the reference price a quotation/invoice/payment. UI explicitly distinguishes preparing/replacing a draft and separately submitting it for staff quotation.

Knowledge: stable revision/span IDs and heading breadcrumbs; a full serialized-request/model-counter seam protects current facts/task and reserves output space while dropping old turns/evidence. The active approved-source retrieval path now enforces a full UTF-8 JSON-array byte bound. This is lexical/character chunking plus a context foundation; it is not production token-aware semantic retrieval or durable compaction.

Feedback: optional VI/EN per-event consent records category, conversation/answer hash/version and operation metadata; no extra raw chat/profile/address/free text is copied. Concurrent retries are idempotent. OWNER/MFA review can link a currently approved published source and record disposition; source edits/unpublication reject resolution. It does not modify prompts, knowledge or models. Frozen-holdout comparison rejects per-case safety/factual/retrieval/task regressions and otherwise requires review. The synthetic comparator is not measured learning improvement.

Provider: fixed public-product Gemini/Vertex probe with exact countTokens, <=800 output/thinking0, no retries, fixed endpoints, conservative durable budget reservation before I/O, and restricted Google citation redirect resolution. Best Buy was removed from the local first-party-only policy after official Marketplace readback; remaining B&H/Sony candidate links still have no seller/price/review certification. Expiry is rechecked after each asynchronous reservation/count/provider/redirect step. Production provider dispatch remains separate.

Review fixes and regression evidence:

- F32: live grounding web metadata contains domain; strict wrapper initially rejected it. Allow bounded web passthrough and validate admitted fields; the second actual Gemini response validates, 333 tokens, but direct merchant candidates remain zero before redirect fix.
- F33: 100/1000 catalog safety bounds blocked valid selection in shared 2100-product demo. Read-only aggregate verified 2100 published/2098 US without altering it. Use <=4096 title projections with account/policy/global/owner admission before scan and charge rejected scans; actual-handler happy and duplicate tests pass. Scalable indexed absence remains a release gate.
- F34: mobile action width, detached required marker and full-width checkbox. Scoped CSS/markup corrections; current 320/390px, VI/EN, native keyboard and real CSS zoom=2 screenshots inspected.
- F35: UTF-8 limit omitted brackets/separators and policy could expire while discovery awaited. Bound complete serialized array and recheck after await; executable boundary/delay tests pass.
- F36: budget write needed directory durability. Bounded exclusive temporary write + file fsync + atomic rename + parent fsync now precede dispatch; actual filesystem and persist-failure/zero-I/O tests pass.
- F37: macOS headless select-popup key sequence did not commit. Correct fixture to native closed-select type-ahead plus Tab; exact focus/category/consent/submit assertions retained, no skipped test.
- F38: polite sentences could miss research matches. Reuse existing productQuery/candidateScore with accent/polite/limited-typo retrieval and numeric/negation/comparison guards; actual VI/EN handler cases pass, never choose/write from a fuzzy match.
- F39: a second tab’s fresh Membership purchase click could replay a hydrated pending operation. Only explicit recovery control may pass the exact saved attempt. Six contention repeats and all 29 current Membership browser cases pass. No backend financial contract or new product string.
- F40: Best Buy same-host Marketplace contradicts first-party-only source assumption. Restrict local test policy; official source linked below. No further paid call.
- F41: authorization/pricing expiry during reserve/count could still allow later generation. Recheck before any subsequent dispatch; four delayed-admission/count combinations pass.
- B04: full unit required-label test still fails for two Dashboard date labels in concurrent work. Prepared DASHBOARD-LABEL-DELTA-PLAN.md/.patch, NOT_APPLIED; pending approval. No test weakening or unrelated Dashboard edit.

Current frozen verification (all three identical 664-file source snapshots, sourceStable=true and current hashes matched):

| Check | Result | Evidence |
|---|---|---|
| Full unit | FAILED: 1206/1207 tests; 126 files pass/1 fails. All 21 new research/context/feedback/budget cases pass. | output/ask-hardening/2026-10-08T06-40-22-244Z/{source,summary,unit}.json |
| Demo handlers | PASSED: 60 tests/5 files; includes 10 new research/feedback cases. | output/ask-hardening/2026-10-08T06-40-22-897Z/{source,summary,demo}.json |
| Actual-component browser | PASSED: 119, including 23 new research/feedback and 29 Membership; zero failed/skipped/flaky/retry. | output/ask-hardening/2026-10-08T06-40-22-636Z/{source,summary,browser}.json |
| Frontend/backend TypeScript | PASSED: Node22 tsc --noEmit for both configurations after final edits. | QUALITY-GATES-RESEARCH.json |
| Scoped ESLint/whitespace | PASSED: 23 owned implementation/test/runner paths, git diff --check exit0. | QUALITY-GATES-RESEARCH.json |
| Repository intelligence | DEGRADED: latest CodeGraph/CocoIndex health passes, both index metadata stale. Bounded source/compiler/test evidence used. | Latest gate output; no false READY assertion |
| Product language | Scoped VI/EN inventory/all eight principles/rendered states pass; overall BLOCKED for full service/live/privacy/AT acceptance. | PRODUCT-CONTENT-RESEARCH-FEEDBACK.md |
| Mandatory fresh final review | BLOCKED overall; root separate review, not external independent reviewer. | FINAL-REVIEW.json |
| Runtime receipt/report CLI | NOT_RUN: ai-agent-kit unavailable. Manual JSON/report is not a runtime receipt. | QUALITY-GATES-RESEARCH.json |

Live evidence: first provider attempt has unknown usage and retained reservation. Second has a validated ON_DEMAND receipt: 117 input + 216 output = 333 tokens, STOP, 13 Google proxy grounding chunks and zero direct merchant candidates. Redirect/parser/budget/expiry/current-policy fixes after those calls are not live-retested. No full customer/app acceptance is inferred. Local ledger holds 50,000 VND; this is reserved risk, **not confirmed actual spending of 50,000 VND**. Validated second response API-equivalent estimate is $0.0350981 under the verified standard rate + worst grounded-prompt charge without shared free allowance; first-call cost and actual billed total are Unavailable. Never release/refund an unknown attempt merely to run another test.

Read-only production metadata at 2026-10-08T06:05:26Z: ask ACTIVE, updated 03:28:33Z, node22/source generation 1791430058079099; new askResearchSearch NOT_FOUND. This confirms the new callable is not deployed, not customer functionality. Source-artifact comparison, authenticated App Check, actual customer/staff/payment flow and release/rollback acceptance NOT_RUN. No production settings, IAM, deployment or financial operations performed.

Remaining acceptance:

| Requirement | Current status / next evidence required |
|---|---|
| Fresh external product research automatically from chat | PARTIAL foundation; reviewed-store lookup active locally, Gemini probe separate. Implement compliant Suggestions and exact seller/variant/price/review/stock adapters + app budget policy; verify authenticated live. |
| Compare choices and fill request | Local reviewed-source UI/saveDraft PASSED; natural free-chat web selection and staff quotation/payment live journey NOT_VERIFIED. |
| Understand arbitrary customer phrasing | Bounded polite/accent/typo read matching and explicit chat commands exist; broad NLU/multi-turn ambiguity and service task corpus incomplete. |
| Knowledge/context/chunking | PARTIAL; authoritative owner policies missing, lexical/char retrieval plus protected counter seam; semantic benchmark, full model-loop serialization/counter and durable compaction/optional memory incomplete. |
| Learning from feedback | PARTIAL; consent/review contracts and frozen-score comparator verified. Real inbox/revised corpus/holdout/canary/retention/withdrawal/deletion workflow incomplete. |
| Production | NOT_READY; current full unit failure, capability gaps, isolated candidate/artifact/readback/auth/App Check/customer-staff-payment/rollback gates remain. |

Required owner information was asked asynchronously: official buying-service/fees/returns/shipping corpus links and feedback retention/withdrawal/deletion decision. It has not been answered; no fabricated policy/retention or self-training activation. A separate optional approval was requested for the exact two-marker concurrent Dashboard patch. Paid-provider choice and 50,000 VND ceiling are already recorded and are not requested again.

Current compatibility/security/performance: additive new callables/collections, default-denied client access verified; auth/App Check retained. Existing typed commerce owns mutations/quote/payment. Bounded transactional catalog scan is an interim cost/performance trade-off, not scalable absence proof. Global read quota resets per approved policy revision, not a forever account budget. Production TTL fields are metadata, not proof deletion is configured. New feature flags/server policies fail closed absent configuration. Rollback must disable new policies/flags, isolate only owned changes, preserve existing recovery fences and uncertain-operation records. Concurrent analytics changes are included in the frozen test candidate but not adopted or deployed by this task.

Provider/model references: [Vertex pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing), [Gemini 2.5 Flash-Lite lifecycle/limits](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/2-5-flash-lite), [Google Search grounding](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/grounding/grounding-with-google-search), [Best Buy Marketplace FAQ](https://www.bestbuy.com/site/marketplace/marketplace-faq/pcmcat273700050015.c?id=pcmcat273700050015). Model retires 2026-10-20; local pricing policy expires 2026-10-09T00Z. No silent model substitution or production price extension.

Weighted completion: Unavailable (no accepted weights; no invented percentage). Git: dirty shared main at 53d59bd88fa7da9d1243692336ecd09b6540ea31; unrelated WIP preserved. Assistant token usage: Unavailable. Validated provider usage: 333 tokens; first attempt Unavailable. Actual billed cost: Unavailable. Commit/push/PR/Jira/deploy/memory write: not performed. Memory candidates: None.

Final local build checks: Vite8 bundle to isolated output/ask-research-build PASSED (no extra server or shared dist/generated public-assets rewrite). Public release configuration checker returned ok:true/codes:[], a local-only configuration result. Existing large-chunk and mixed static/dynamic Changes import warnings remain; no performance certification or unrelated refactor. Agent configuration validator FAILED to complete because root CLAUDE.md is absent (FileNotFoundError); no fake/managed policy file was created. This additional governance check keeps overall review BLOCKED and is B05 in the latest cycle. Source snapshot remains unchanged by build/documentation.


## Integration continuation: cycles 31–33

**Current decision: scoped source integration PASSED; full acceptance BLOCKED; production NOT_READY.** This section supersedes the previous remaining-work rows for the three integrations. Earlier runs, failures and live receipts remain historical evidence, not proof of the current shared tree.

Approved scope is ASK-INTEGRATION-20261008/v1, recorded before edits. Latest human instruction authorizes continuing automatic chat web lookup, full provider context and reviewed learning. Existing Gemini choice and total 50,000 VND cap are retained. No deployment, budget reset, official policy publication, retention setting, financial operation or unrelated Dashboard edit was performed.

### What is connected

- **Web in chat:** a fresh exhausted catalog miss plus an explicit market can dispatch askWebDiscovery. A market-only follow-up can complete the query. Server repeats coherent bounded catalog checks, policy/owner/conversation/version checks and durable lifetime-budget admission before provider I/O. Permanent unknown reservations cannot be silently retried or refunded. Sources have unknown price/reviews and expire within ten minutes. Google Suggestions are separate in a sandboxed iframe; direct merchant links and native selection controls remain separate. “chọn nguồn 1, số lượng 2, mẫu Đen” resolves a canonical selected draft through askWebSelect and the existing saveDraft command. Missing or ambiguous fields trigger clarification. Preparing a draft is not submitting a request, staff quotation or payment.
- **Context:** server reads current owned task/order facts and current approved-publication revisions in one read-only snapshot. Recipient/contact/address/receipt/notes/budget fields do not enter the projected task. The complete serialized Gemini request is counted natively, with output reserve and UTF-8 admission. Old turns/evidence are trimmed first; protected current facts/task overflow fails closed. Source IDs must be among retained evidence; changed context is rejected before publication. This remains the text-only OWNER pilot with the existing expired gate, not general customer LLM activation. Retrieval is bounded lexical retrieval with revision/span IDs; semantic multilingual completeness and durable summary memory are not claimed.
- **Feedback and reviewed learning:** customer reads actual server retention before unchecked consent; a new event binds policy version, timestamp and actual answer hash/version. Same-UUID recovery and withdrawal handle unknown responses. Withdrawal leaves only a short or expiry-bound replay fence; expired/withdrawn events cannot enter the inbox/review. OWNER/recent-MFA review uses current approved source hash/version. A frozen approved public holdout actually runs retrieveKnowledge and returns case outcomes plus dataset/corpus hashes. These checks measure retrieval, not LLM accuracy or model training. Source/prompt/model promotion remains human reviewed. Bounded scheduled batch cleanup has update-time deletion preconditions; no production schedule or physical deletion is certified.

The official Google grounding guidance was checked for [Search Suggestions and separating grounded search from function/RAG tools](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/grounding/grounding-with-google-search). The actual provider Suggestions layout, destination behavior and terms acceptance still require live verification. The synthetic iframe test proves the executed sandbox behavior only.

### Review and fixes

Cycle31 found and corrected F42–F50: explicit market parsing avoids English “my”; discovery dedup survives conversation-version changes; server budget cannot start fresh without importing the prior 50,000 VND hold; withdrawal creates are quota bounded and timestamp fenced; consent shows actual retention/version; accidental mixed-read rendering was removed; three owned required markers/form spacing were fixed; optional UTF-8 overflow compacts before counting; Membership recovery test matches valid case differences while retaining exact-retry and one-request assertions. Existing Membership application semantics were preserved. Initial demo/catalog/locking, fixture selection, required-label and browser failures were retained in the cycle narrative and led to source or precise fixture corrections.

Cycle32 verified the identical historical 676-file candidate: 1,220/1,221 unit, 69 demo and 138 browser checks. The only full-unit failure was two Dashboard required markers, outside Ask ownership. Scoped source checks passed; official/live/governance gates kept the overall review BLOCKED.

Cycle33 observed concurrent Analytics runtime/test changes, including shared Ask question-only topic instrumentation. That instrumentation uses a coded topic and logical turn ID; raw text is not sent by trackAsk. Re-ran current compilers, 97 Ask unit cases, 25 related system unit cases and 78 affected browser scenarios. Review then found F51: a newly supplied valid web result retained a previous result’s expired state. An actual-component same-instance expired→renewed scenario reproduced the failure, then passed after resetting expiry from the new result. The first fixture run used a wrong control name; it was corrected to the existing accessible label before reproducing the application defect. Final 18 integration scenarios passed. No actionable source defect remains known within these executed scoped checks; this is not an exhaustive correctness claim.

### Evidence and current limits

| Check | Result | Bound evidence / limit |
|---|---|---|
| Historical full unit | FAILED: 1,220 pass / 1 fail, 128 files pass / 1 fail | output/ask-hardening/2026-10-08T13-14-25-858Z/{source,summary,unit}.json; entire old candidate, not the current full tree |
| Historical demo handlers | PASSED: 69 / 5 files | output/ask-hardening/2026-10-08T13-14-23-550Z/{source,summary,demo}.json; current owned backend hashes unchanged; crafted auth/MFA and injected Vertex transport |
| Historical full Ask browser suite | PASSED: 138, zero failed/skipped/flaky | output/ask-hardening/2026-10-08T13-14-25-346Z/{source,summary,browser}.json; shared5207 actual components, synthetic auth/API; current full139-case suite NOT_RUN |
| Current focused Ask unit | PASSED: 97 / 6 files | output/ask-hardening/integration-current-recheck/ask-unit.json; relevant unit source unchanged after final UI-only reset |
| Current related unit | FAILED: 24 pass / 1 fail | Same directory unit.json; Dashboard labels667/676 still lack markers. Assertion unchanged; proposed Dashboard patch NOT_APPLIED |
| Current affected browser before F51 fix | PASSED: 78 | Same directory browser.json; no failed/skipped/flaky. Fresh explicit chat, catalog/draft, research and feedback review coverage |
| Final integration browser after F51 fix | PASSED: 18 | Same directory browser-final.json; includes reproduced expired→renewed regression. Actual components with synthetic interfaces; no new paid call |
| Current TypeScript/lint/whitespace | PASSED | Same directory checks-final.json and logs: Node22 frontend/backend noEmit, scoped25-path ESLint and git diff --check exit0 |
| Current isolated local build | PASSED | output/ask-integration-build-current/.vite/manifest.json; no shared dist/generated public-assets rewrite, deployment or performance certification; existing build warnings retained |
| Snapshot | PASSED scoped / full-tree NOT_VERIFIED | Same directory source-final.json/summary.json; all current integration/runtime hashes matched during final checks. Later unrelated analytics-dashboard browser-test edits are explicitly recorded; whole shared-tree acceptance is not inferred |
| Repository intelligence | DEGRADED | CodeGraph then CocoIndex; stale indexes and CocoIndex health issue, bounded current source/compiler/tests used |
| Product language/visual | PASSED executed slice / BLOCKED full acceptance | PRODUCT-CONTENT-INTEGRATION.md/.json; 343 static strings inventoried, eight principles/current VI/EN/native/mobile/keyboard states reviewed; AT/device/real provider HTML NOT_RUN |
| Final review | BLOCKED, cycle33 | FINAL-REVIEW.json; fresh root manual final/code/code-quality/security/product review, not an external reviewer/runtime receipt |
| Agent runtime/configuration | NOT_RUN / FAILED | ai-agent-kit executable unavailable; root CLAUDE.md still absent. Manual report/JSON is not a runtime ledger. No fake managed file was created |
| Live/provider/production | NOT_RUN this continuation | No Gemini call, deploy, scheduler execution, production settings or real customer financial operation |

Default shared demo catalog has 2,100 published products and one missing title. Completeness is therefore not established; native default catalog absence correctly prevents discovery. New happy paths use a gated owned qa-askweb namespace on the same Firestore emulator. No shared product was modified to manufacture a happy case. Scalable indexed catalog absence, real seller/variant/stock/review/price evidence and the real customer→staff quotation→payment journey remain required.

### Remaining decisions and acceptance

| Requirement | Current status / next evidence |
|---|---|
| Automatic web in chat and chat source selection | Implemented and locally exercised, with strict public-query/market/catalog/policy/budget gates. Live usable merchant results and current pricing/terms authentication remain NOT_VERIFIED |
| Full request context/chunking | Integrated into existing OWNER pilot and tested; customer-wide NLU, semantic retrieval, complete official corpus and durable compaction remain incomplete |
| Feedback lifecycle and reviewed learning | Inbox/review/withdrawal/cleanup source and actual frozen retrieval evaluation integrated. Official holdout, production retention deletion/backups/backlog and measured answer/task improvements remain NOT_VERIFIED |
| Official business policies | Pending owner-confirmed buying-service/fees/returns/shipping sources; synthetic fixtures are not policy. No content was invented or published |
| Feedback retention | **30 days proposed, awaiting reply** to the30/7/90-day question. Current server policy is required before customer consent; no default production policy was enabled |
| Budget and provider verification | Prior50,000VND risk reservation remains held, including unknown first attempt. No reset/release/new paid call. Cost reconciliation is required before any further paid testing within the authorized cap |
| Whole system/release | Dashboard markers, missing agent configuration, concurrent-tree candidate freeze, authenticated AppCheck/real customer/provider/scheduler proof and exact artifact/rollback readback remain BLOCKED/NOT_RUN |

Rollback posture: disable only new discovery/feedback policies/flags; preserve permanent budget and uncertain-operation records, withdrawal fences and existing typed commerce recovery. Revert only owned source integrations after an isolated release candidate is prepared. No production rollback was executed.

Progress: three targeted integration paths are implemented with scoped local evidence; full service/production acceptance is incomplete. Weighted percentage **Unavailable** because no accepted weights/runtime ledger exists. Git remains a dirty shared tree at53d59bd88fa7da9d1243692336ecd09b6540ea31; unrelated Analytics/Dashboard WIP is preserved. No commit/push/PR/Jira/deploy/shared restart/reseed/memory write. Assistant/provider tokens for this continuation **Unavailable**; new live-provider dispatch count **0**. Historical validated provider receipt333tokens remains separate. Actual billed cost **Unavailable**, not0 or50,000VND; API-equivalent historical estimate is retained above. Memory candidates: **None**.

The mandatory [final-implementation-review](../../../.ai/skills-src/final-implementation-review/SKILL.md) states: “A blocked handoff is not a successful final output.” Missing business/live/whole-system evidence therefore prevents a successful completion or production-ready claim. The targeted source work is reviewable; the remaining external decisions and evidence are explicit.
