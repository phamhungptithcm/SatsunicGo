# NOT-17 subscription queue hardening

Defect fixed in the approved local subscription failure-path scope. Latest bounded implementation review: PASSED, cycle 4. External delivery and production activation remain NOT_READY. Cross-chat tool delivery of this handoff remains BLOCKED by automatic approval review; no message was sent.

## Cause and change

Recipient lookup formerly returned blocked_recipient without changing the queued job, and ran before expiry. Malformed jobs likewise returned invalid while staying queued. A limit-20 worker could repeatedly select the same permanent failures.

- Permanent invalid identities (explicit null, disabled, missing/unverified email, Auth user-not-found/invalid-uid) now retire to blocked_recipient.
- Malformed queued job/channel or persisted preference becomes blocked_content; raw consent is preserved for investigation.
- Expiry runs before Auth lookup. Old jobs retire even if Auth is unavailable.
- Other Auth errors return identity_unavailable and leave the complete queued snapshot unchanged for retry. No transient exception is treated as proof of user deletion.
- Every retirement transaction rechecks queued state and the complete initial job snapshot using order-insensitive deep equality. The normal claim uses the same snapshot fence. Raced sending, accepted, unknown or changed queued payloads are not overwritten.
- SubscriptionIdentityReader is a named shared type; regression helpers no longer depend on a positional Parameters tuple index. No scheduler cadence, provider gate, consent generation, notification copy or financial behavior changed.

Changed implementation ownership: functions/src/subscription-delivery-service.ts; tests/unit/notification-subscriptions.test.ts; tests/integration/notification-subscriptions.test.ts. No other production or test-owner file was edited. No restart, reseed, provider call, secret access, deployment, commit or PR.

## Current checks

| Check | Result |
| --- | --- |
| Five-file joint Vitest (subscription lifecycle/endpoint/customer emails/content/delivery security) | 134 tests PASSED, exit 0 |
| Expanded shared demo Firestore transaction integration | 1 test PASSED, exit 0; permanent retirement, transient retention, expiry, malformed row, raced accepted state, unchanged consent and single original provider mock send; synthetic rows cleaned |
| Whole-repository `npx tsc --noEmit` | PASSED on final fresh run, exit 0 |
| Functions `npx tsc -p functions/tsconfig.json --noEmit` | PASSED, exit 0 |
| Scoped application + changed/regression tests typecheck (`NOT-17-tsconfig.json`) | PASSED, exit 0 |
| ESLint three changed source/test files | PASSED, exit 0 |
| Source-snapshot/ownership review | PASSED: only the three declared implementation/test paths differ from previous reviewed manifest |

Intermediate typecheck caught my test helper's incorrect tuple index; corrected to a named resolver type and reverified. The same intermediate global run also reported five errors in tests/rules/order-tracking-security.test.ts, outside this task's ownership. This task did not edit that file. The final global run passed; intermediate diagnostics are superseded, not hidden or attributed as this task's fixes.

Evidence logs: NOT-17-{UNIT-TESTS,EMULATOR-TEST,GLOBAL-TYPECHECK,SCOPED-TYPECHECK,FUNCTIONS-TYPECHECK,LINT}.txt. Integration uses only demo-satsunicgo at existing Firestore 18207 with explicitly guarded opt-in test flag and cleanup; no external messaging. Type-only alias change after the emulator check does not alter emitted delivery behavior; final unit/type/lint checks bind the current source.

## Review cycles and release boundary

Cycle 3 found NOT-17 permanent failures staying queued; review BLOCKED pending correction. Fixes and regressions above applied. Compile review caught the tuple-index defect and it was corrected before completion.

Cycle 4 independently reviewed requirement match, strict validation/privacy, transaction snapshot fencing, dependency failures, non-success states, cleanup, compatibility and deployment limits. PASSED within bounded local scope. No known unresolved critical/high issue in the executed checks. UI/product content is unchanged; prior content review remains applicable. Intelligence remains DEGRADED with current direct source/compiler/test evidence. Existing approval covers in-scope defect fixes, with no new capability or delta expansion.

Production remains NOT_READY / NOT_ACTIVATED: no SMS provider/dispatcher, external email release/config/cutover, authenticated deployed end-to-end or real-provider/handset acceptance. Current dirty concurrent worktree is not certified as a release candidate. Runtime review CLI remains unavailable; review/check files are the recorded evidence, not a fabricated runtime receipt.

## Coordination

Direct user-authored sync text was found by reading thread 01a120df-2ef2-79b2-a108-1bc1f32012a7, turn 01a120df-a273-7f90-bfbb-26a53d1b44cb. Nonetheless automatic approval review rejected the attempted message to integration QA because it did not accept thread/tool evidence as trusted permission in this transcript. No workaround or further send attempt was made. The result is documented locally; explicit permission in this chat is needed to send it through the thread tool.

Local acceptance for NOT-17: durable permanent failure retirement, retryable Auth dependency failures, expiry-before-Auth, snapshot/terminal-state protection, consent preservation and executable checks all PASSED (6/6 equal-weight local criteria). Communication delivery remains BLOCKED; no completed sync delivery is claimed. Token usage and actual billed/API-equivalent cost: Unavailable. Memory candidates: None.


## Independent queue progression evidence refresh

QA command outputs from thread 01a116b3-a055-7190-b275-a4461826678a were inspected directly. Actual shared Firestore, batch limit20, two passes: before-fix build retained 21 queued / 0 accepted / 0 fake-provider calls; after-fix build produced 20 blocked_recipient / 1 accepted / 0 queued / 1 fake-provider call. Both executions exited0 and cleanupVerified was true. The current source transpiles byte-for-byte to the QA after-fix compiled service (SHA256 9da7defbed1c4d49e45582e7aefd46f8904f0c19e99951ceba91b12d3983ca41). Current implementation/test manifest hashes remain unchanged. Evidence is bound in NOT-17-INDEPENDENT-QA.json and the final review; no additional source change or test rerun was necessary.

Broader 1879 unit / 5 existing integration tests were peer-reported; they are not relabeled as owner reruns. External sender/domain verification and real delivery remain NOT_VERIFIED / NOT_ACTIVATED. Cross-chat messaging remains blocked by automatic approval review; this evidence refresh does not bypass that restriction.
