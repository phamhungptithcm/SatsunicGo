# Ask platform implementation status

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
- Full unit suite on production-compatible Node 22 with test-only App Check site key unset and permitted loopback: **111 files / 954 tests PASSED**. Production App Check remains unchanged.
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
| Profile/address/membership/change/document/staff task expansion inside Ask | S18 Profile/address now available through explicit Ask panel control; mounted-session recovery hardened. Membership/change/document/staff expansion, full English form and durable reload reconciliation remain incomplete |
| Durable compaction / optional memory | NOT_IMPLEMENTED |
| Customer analytics outbox / aggregates / insights | NOT_IMPLEMENTED |
| Full happy/bad capability acceptance corpus and canary/release | NOT_IMPLEMENTED; new scenarios cover current hardening only |

No completion percentage is invented. Source-local, demo integration, fixture browser, live provider and production evidence remain distinct. Passing current tests does not prove Ask can perform almost every service task.

Token usage: Unavailable. Actual billed cost: Unavailable. Memory candidates: None. Unrelated concurrent WIP preserved.
