# Hardening 025 — evidence-bound task report

**Global status: NOT_READY. Aggregate final implementation review: BLOCKED.** Current local complete native regression:51/51PASS2.0min, zero skip/retry/flaky. Local scoped implementation review PASSED; aggregate review remains BLOCKED.

Approved local scope: repeated testing and fixes, coordinated through four existing UI/backend/database/business chats. Source ownership is recorded in PLAN.md; shared unrelated WIP is preserved. No production deployment, financial correction, datafix, customer message or dependency change was performed.

## Fixes and validation

- Reject missing/exhausted CRM stored-version metadata before overwriting notes; preserve successful replay and safe increments.
- Require exact active=true, valid role arrays and BUYER assignment arrays in affected command, list, media, return and consolidation paths; retain valid unions and owner overrides.
- Reject new transfer allocation on cancelled orders before bank/ledger writes; existing replay remains valid.
- Prevent late CRM mutation completion from reloading obsolete activity context; separate customer/follow-up view mounts.
- Present callable errors without known trailing HTTP metadata while preserving domain wording and error codes.
- Keep the most recent Support tickets visible with a bounded30 descending timestamp query matching the existing index; foreign tickets remain private.
- Defer Ask mounting until initial auth is ready. Preserve launcher/composer/resume behavior; browser mechanics follow actual UI rather than assuming every launcher click immediately opens a modal.

Current unit194/194 and integration133/133 passed with zero skips. Product typecheck, Functions compile, lint and build exit0. Latest test-mechanics scoped lint exit0. ASK completed-checkout response-loss recovery passed3/3 repetitions; current complete51/51 native cases PASS, receipt output/playwright/release025/browser-final51-complete.json. SOURCE_MANIFEST.json confirms no product/build drift after final compiled candidate; the only later changes were the two approved browser test files.

## Review cycles and remaining work

[CYCLE_JOURNAL.json](CYCLE_JOURNAL.json) records all17 local validation cycles, including actual failures, fixture corrections, before/after regressions and incomplete rounds. This does not count as13 independent production approvals. Prior formal runtime review cycles remain in the generated ledger report. [TEST_CASES.md](TEST_CASES.md) lists all51 executed native scenarios with their actual PASS result; [SCENARIOS.md](SCENARIOS.md) maps new happy, bad and race cases.

Firestore demo exhaustion caused60-second gRPC deadlines; owned service recovered using preserved native export/import, exact canary hashes and verified same-version emulator artifact. Shared services were not reset. See [RUNTIME_RECOVERY.md](RUNTIME_RECOVERY.md). This is not production restore acceptance. A prior intermittent document share failure and current image-click timeout were not root-caused; focused passes do not erase failed whole rounds. Image/list disclosure hypothesis did not reproduce across3 probe repetitions and3 unchanged privacy-case repetitions. First full51 timed out custom lifecycle after45s; previous43.7s pass and successful-command3–4.5s timings suggest commit/runtime pressure, not confirmed source cause. Timing failures are retained. Latest owned-runtime export/import preserved all data with exact canary hash equality; unchanged45s customFLOW then passed659ms and whole51 passed2.0min. This intervention supports runtime degradation, not production performance or an internal JVM rootcause claim.

Outstanding release gates: real Google/MFA/AppCheck identity and deployed access controls; merchant/signature/bank/payment/mail/model integration; actual assistive technology and comprehensive performance/load/frame/product-state coverage; production backup/restore/rollback and exact deployed-candidate readback. Legacy standalone HTTP/restore scripts require other dedicated ports and were NOT_RUN025; selected native HTTP flows are covered, not every endpoint/provider. Historical13 moderate dependency entries remain unresolved and are not a fresh audit result.

A fresh npm audit was rejected by automatic approval review because it would send production dependency names/versions to the external npm registry. The specific authorization question remains unanswered; no indirect workaround was used.

Acceptance criteria1 and2 are verified within local synthetic scope; criteria3 and4 remain pending broader acceptance. The existing runtime ledger reports50% weighted criterion progress, not50% implementation completion. Git HEAD3bd0d093255963a2cbf66ddd80d27456da7076e0 with dirty shared WIP; manifest binds the actual candidate. Optional repository indexes DEGRADED; bounded source/compiler/native checks used.

Provider token usage, API-equivalent estimated cost and actual billed cost: Unavailable. Memory candidates: None.

Final review and runtime ledger report are recorded after all source/tests/private documentation freeze. See FINAL_REVIEW.json and [runtime ledger report](../../../.ai-agent-kit/runtime/outputs/RELEASE-INTEGRATION-021-REPORT025.txt) for reviewed dimensions, cumulative formal cycles and weighted criterion progress. No successful production handoff is asserted.
