# Ask release and revised panel — current evidence report

Task `ASK-RELEASE-20261008`; 2026-10-09 UTC. **Production: NOT_READY. New panel layout: design only, human approval pending.** Weighted acceptance progress, provider token usage, actual billed cost and API-equivalent estimate: **Unavailable**. No invented completion percentage or zero-cost claim.

The latest user request is to keep all conversation, forms and history inside Ask and simplify its presentation. [The revised preview](../../../previews/ASK-PANEL-CONTINUOUS-r2-20261009.html) uses the existing outer footprint, one reading stream and one composer. Form/history temporarily replace only the middle region. Current desktop VI/editor/history captures are source-bound in [the executor receipt](PANEL-r2-EXECUTOR-r1.json). Mobile, short-height, English and200percent text captures explicitly reuse the unchanged nonhistory rendering from the immediate precursor. Native browser zoom is not claimed. The application layout has not been changed.

## Acceptance criteria

| Criterion | Current status | Evidence and boundary |
| --- | --- | --- |
| Everything inside existing Ask panel | VERIFIED bounded prototype | Desktop1280×720, mobile390×844, short320×480; form/footer/composer contained |
| Natural continuous conversation and compact forms | VERIFIED bounded composition; approval PENDING | No permanent tabs/split pane/card stack; current pixels require human design review |
| Form validation, draft/focus return, historical read-only view | VERIFIED bounded prototype | Native quantity0 validation; Edit/Escape; draft preserved; historical confirmation unavailable |
| Numeric edit/confirmation safety | VERIFIED bounded prototype | Live -5/1.5/1000 retain2/980000VND; negated input clarifies; fresh review before local confirmation |
| New six-file layout integration | PENDING human approval | [Exact plan](PANEL-REDESIGN-r2-PLAN.md); user explicitly asked to revise before implementation |
| Approved pending recovery correctness | VERIFIED local source/mocked tests | CustomerWorkspace recovery packet, Profile12 + Membership29 and current broad acceptance |
| Approved Handlebars4.7.10 dependency delta | VERIFIED local candidate | Exact two root manifests, fresh npm11.18 install, scoped compatibility/build/audit receipts |
| Unit/compiler/lint/build/release contract | VERIFIED composite local evidence | UNIT1366/1366, release58/58; unchanged runtime inputs from CHECKS-r3 after test-only fixture successor |
| Browser acceptance and composer preparation barrier | VERIFIED current local mock |139/139 and8/8, workers1/retries0; original oracles/timeouts unchanged |
| Current demo backend acceptance | FAILED latest19/21 | Existing fixture/runtime/domain cause unresolved; previous21PASS diagnostic is not final evidence |
| Official knowledge/policy/feedback retention | BLOCKED | Missing published authoritative admission/effective-source evidence;30days remains proposal; deletion/backup behavior unverified |
| Native AT and authenticated provider/business acceptance | NOT_RUN/BLOCKED | Native speech/live region, real-device keyboard, authenticated App Check/MFA and commercial flow missing |
| Immutable release/deployment/provider readback | NOT_RUN | Local archive exists; no candidate commit/configured production artifact or deployment |

## Quality gates

| Gate | Status | Evidence/limit |
| --- | --- | --- |
| Compilation | PASSED local | Frontend TSC and Functions build in CANDIDATE-CHECKS-r3 |
| Unit tests | PASSED local |132files/1366tests; prior EPERM loopback failure preserved, authorized environment-only rerun succeeded |
| Integration | FAILED overall |139/139 mocked browser acceptance passed; latest demo backend19/21 failed; provider integration NOT_RUN |
| Static/language-aware analysis | PASSED local | Whole candidate lint previously passed; fixture-only affected lint passed fresh |
| Architecture/API compatibility | PASSED bounded source review | Domain/queue/private-save/auth/payment fences retained; prototype does not prove integration |
| Language/version profile | PASSED selection | TypeScript/JavaScript profile, React web source, Node22/Firebase tooling verified |
| Platform/domain/visual/content/motion profiles | PASSED selection | Web-app, visual-design, product-content and existing motion contract; selected profiles are not final gate acceptance |
| Public SEO/GEO | NOT_APPLICABLE | No public page/content contract changed; local docs preview is not a publication |
| Security checks | PASSED bounded local | Root production audit0high/critical, residual2low/13moderate; standalone deployment13moderate; not vulnerability-free or production security acceptance |
| Database migration | NOT_APPLICABLE | No migration in this delta |
| Observability | PASSED bounded source review | Existing audit/recovery behavior retained; no new production monitoring proof |
| Diff self-review | PASSED scoped | Candidate fixture barrier, preview numeric/CSS corrections and receipt metadata reviewed; unrelated WIP preserved |
| Final implementation review | BLOCKED | Latest independent review receipt must be current; formal completion/production required gates still absent |
| Responsive composition and interaction evidence | PASSED bounded prototype | Ten hashed captures; desktop/mobile/short/text200, keyboard/native validation; no real-device/AT claim |
| Product Language/accessibility | NOT_RUN required dimensions; global BLOCKED | [Content review](PANEL-r2-PRODUCT-CONTENT-REVIEW.md); Flexibility/Craft/Delight acceptance incomplete; formal UX QA NOT_RUN |
| Animation/lifecycle/performance | NOT_RUN production | Existing composer eight-mode mocks passed; no current production load/heap/performance/native-motion acceptance |

## Review and fix cycles

Earlier FINAL-REVIEW-r2 and r3 remain immutable historical reviews. This successor records current approved findings and explicit evidence reuse; it does not erase earlier failed checks.

1. Initial dependency/recovery review: Handlebars production audit and unique pending-kind recovery required fixes. Exact approved4.7.10 candidate manifests/install/audits and scoped recovery source/test packets resolve these bounded findings; provider/native AT holds remain.
2. Existing prototype rejected by human: fullpage/secondary dialog did not satisfy panel containment. Preserved as rejected historical proposal; replaced with this separate design-only in-panel plan.
3. BA/UI source review: unsupported catalog Notes, ambiguous quantity mutation, catalog/custom shipping wording, earlier-message terminology and private-persistence scope were corrected. The missing paused-history composer explanation was corrected. BA/UX source receipts are historical precursor observations, not fresh formal QA.
4. Root rendered review: dense vertical fields and footer clipping were corrected through compact desktop/two-column mobile fields and one whole-form short-height scroller. Desktop/mobile/short/text200 keyboard observations now pass their bounded criteria.
5. TL REL5-PANEL-QTY-01: old negative5 substring changed2 to5. Complete unsigned safe integer recognition fixes signed/decimal/oversized ambiguity. Fresh live3bad cases preserve2/980000VND; frontend26synthetic cases and root current12scalar checks pass. Application parser is outside this prototype delta.
6. TL REL5-PANEL-CONTEXT-HASH: plan now distinguishes candidate App27c0 from concurrent shared App64c9; route fence unchanged. No unrelated App WIP copied.
7. Root current history pixels: close-icon width inherited list styling, causing header clipping. Two selectors narrowed to `.history-list button`; fresh current r4 title/close bounds and pixels resolve the finding.
8. Browser r4 preparing fixture:138/139 failed because a150ms mock did not guarantee the next draft preceded prepare completion. Approved candidate-only entered/release barrier retains all old oracles, workers, retries and timeouts. Fresh8/8 +139/139 and affected lint pass. Independent current review is required before a successful implementation handoff.

Current evidence found no additional actionable defect within those executed bounded checks. It does not establish that the system has no issues.

## Immutable candidate and preserved source

Selection-r6 contains104paths; source-r5 matches104; full-source-r3 covers3106paths; build-r3 re-verifies295unchanged actual build files. ZIP-r3 contains105safe members,104selected files plus manifest, and tracked patch-r3 is bound to the baseline. [Artifact receipt](CANDIDATE-ARTIFACT-r3.json) classifies it **LOCAL_REVIEW_CANDIDATE_NOT_DEPLOYABLE**. The latest delta changes only candidate tests/browser/ask109.spec.ts; shared fixture and23selected sharedsrc files are unchanged. Build and unit evidence is deliberately reused across this test-only delta, rather than claimed freshly rerun.

Shared HEAD53d59bd88fa7da9d1243692336ecd09b6540ea31 has concurrent dirty WIP and untracked task artifacts. No staging, commit, push or deployment. Candidate is based on production v0.6.1/73dc7d51cffd89ea2e62d2ee16b3f3ec5ccf2a36. Existing frontend5207 and demo Firestore were reused without restart, reseed or duplicate frontend. Existing verified v0.6.1 rollback artifact remains separate; no rollback executed.

## Production holds and remaining work

The user approved continuing the overall hardening work and release intent. This revised layout remains separately pending because the user chose “Chỉnh thêm trước khi triển khai.” After layout approval, implement only the six planned presentation files while preserving native private saves and immutable commerce guards, then validate the integrated form/history/scroll/keyboard/AT states and rerun affected checks. Approval alone does not clear official knowledge, feedback retention, real provider/App Check/MFA, demo backend or release-artifact gates.

Gemini50000VND remains fully reserved, with no new paid-provider call in this turn and unchanged ledger hash45b3bd687e38c7803363b62ae8b589079f3a75df3833cf904c58b4452334c1b9. Actual billed cost is Unavailable; elapsed research/pilot windows were not extended. Feedback review is not model training or automatic policy promotion. Retention30days is not asserted as an approved current policy.

No held function, payment, webhook, cleanup or provider control was activated. Candidate release/source comparison, immutable configured artifact, actual provider readback, production smoke and rollback execution remain NOT_RUN. The previously deployed artifact/HTTP state cannot substitute for current Ask business acceptance.

## Runtime report and final review

Runtime task-report CLI is absent from PATH. The repository fail-open wrapper was retried using taskIdASK-RELEASE-20261008 and Node22, exited0 with empty output. That is not a passing ledger report. This manual report derives counts from immutable receipts; weighted progress, provider tokens and cost remain Unavailable. No memory files were updated. Memory candidates: **None**.

Independent current [FINAL-REVIEW-r4.json](FINAL-REVIEW-r4.json) was saved and read back: SHA256 `a30baea1032bc643165e034ee86965e27946fea36390038536a2ba5c0862e16e`, cycle4. Bounded source/local engineering **PASSED** and revised proposal **PASSED_REVIEWABLE_PREPARATION**. Reviewer checked48refs,104selected/3106source/295build with zero drift, independently viewed8/hashed10 images, and confirmed the two-selector reconstruction supporting explicit nonhistory capture reuse. Quantity/context/header findings are resolved. No additional actionable application/proposal defect was observed in this bounded review.

Formal final review and Product Language Gate remain **BLOCKED**; production **NOT_READY** for actual AT, latest demo19/21/current-graph acceptance gap, policy/retention/live/billing/admission/exact artifact and human layout acceptance. This is a concrete design review handoff, not an implementation or production-success handoff. All specialist leases are released. Root rendered/asked approval for the exact current proposal; no dependent application edit occurred.
