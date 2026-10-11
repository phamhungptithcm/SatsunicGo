# PR6 final review and scoped repair plan

Baseline af58ec291f1de31119abc36f03f12ae4e1e5fc51, PR6 base e9d248f331cba92970a6d06c503a3f66eb7d0972. User explicitly requested final review of security, CRM → Account/Ask and exact-commit artifact, fixing discovered bugs; no deploy. Existing approved tracking plan covers revocation, stale events and retry/idempotency. This scoped repair changes no API/schema/dependency/IAM/TTL or approved layout.

Intelligence DEGRADED: both indexes missing. Source, call graph, Firestore rules, tests and immutable CI/artifact evidence inspected. Stack Node22/TypeScript/React19/Firebase Functions v2/Firestore. Profiles universal, typescript-javascript, api, database, concurrency, web-app, devops; memory/resource cleanup inspected.

Verified code path: managePublicTrackingCode checks activeHash on issue replay, but not revoke replay. A completed revoke R followed by new issue I, then replay R currently acknowledges null code while I remains valid. Reproduce before repair. Intended behavior: repeated revoke succeeds when access remains null; replay after replacement must fail closed without invalidating the new capability or creating more audit events. Concurrent new issue/revoke transactions remain serialized by access document reads.

Files:
- tests/rules/guest-order-tracking.test.ts: real emulator regression for lost-response revoke replay after new issuance; assert new alias still reads safely, old alias denied, unchanged activeHash/order/audit count; repeated revoke with no replacement remains idempotent.
- functions/src/public-order-tracking.ts: in previous-operation branch require activeHash null for revoke replay, analogous to issue replay active-hash check. Reuse existing failed-precondition message; preserve fingerprint, ownership/lock/version/expiry gates and transaction reads/writes.
- tests/component/public-code-sync.test.ts: in-context retry error state preserves UI recovery and does not announce current capability revoked on rejected replay, if existing component coverage is insufficient.
- docs/reviews/PR6-FINAL-REVIEW-20261010/: current review, impact, approval, product-content review for changed error-state meaning, tests, metadata-only production readback, artifact and completion report.
- functions/generated/public-assets.json: regenerate only if production build changes bindings; never hand-edit.

Validation: baseline failing reproduction then passing repair; guest/security/tracking/shipping emulator and Ask/Account/code component regressions on unique disposable demo project IDs using existing shared backend; focused unit, lint/types, release tests; metadata-only secret/IAM/TTL and function inventory (no payload/customer reads); freeze/push approved candidate branch only, exact-source quality CI and immutable artifact download/checksum/manifest/standalone install/audit/runtime verification at new SHA; fresh final review. No deploy, main merge/push, release tag/reservation, shared-runtime restart/reset or provider business calls.

Authorization: current human user request explicitly authorizes review and all discovered in-scope fixes; retained earlier approved tracking hardening plan authorizes revocation and stale-retry repair. Agent does not grant independent human approval. Material scope expansion remains excluded. Roll back only this small repair to af58ec29 if validation fails; no production rollback needed.


## Observed regression-test delta, same PR scope

Full unit rerun reproduced one watcher test failure at its immediate add→same-size rewrite assertion (2505/2506 passed). The test rewrote a just-added file before native watcher registration/event coalescing settled. No watcher runtime source changed. Smallest correction in tests/unit/firebase-toolchain.test.ts: precreate a separate hot-reload file before watcher initialization; after ready, change that fully subscribed file while retaining independent add/unlink/ignore/close assertions. Do not increase timeouts, add retries or remove coverage. Rerun focused repeatedly and full unit; include existing exact-head CI. Authorized by current request to fix discovered PR bugs and prior approved watcher regression scope.


Second aggregate rerun still failed at nested-file add, while focused run passed; event timing under full-suite load remains the test risk. Fixture now also precreates the nested child-watch folder before ready. Dynamic directory discovery is retained as a separate addDir assertion before testing file add in the fully subscribed folder. This separates registration/discovery from add/change/unlink signals without retries, timing relaxation or removal of directory coverage. Native filesystem event coalescing is an inference; exact kernel event loss is not claimed diagnosed.


Watcher diagnostic cycle: native ready completed but addDir emitted no event and getWatched omitted the created directory; bounded two-worker run also failed, so CPU oversubscription is not established. Canonicalizing the macOS /var temporary path with realpath yielded a passing focused run; fixture path normalization (not runtime behavior) is under aggregate verification. Retain diagnostic detail and every event/ignore/close assertion. Earlier coalescing explanations remain hypotheses, not verified root cause.


Fixture final delta preserves dynamic directory plus file creation before waiting for both addDir/add. Empty-directory wait was not part of the original case and is removed. Local full validation is still failing under current runtime; CI and independent review remain pending, no readiness claimed.
