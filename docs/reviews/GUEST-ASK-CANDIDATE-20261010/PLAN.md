# Guest tracking and Ask candidate integration v1

Approval: latest direct human request in this chat: “Tích hợp luôn phần tra cứu khách và gỡ tab Ask vào candidate, chạy CI và fix lỗi trong scope đã duyệt, giữ nguyên WIP khác và chưa deploy.”

## Evidence and impact
Candidate f675ea3a on hunpeolabs/production-test-v1-20261010, draft PR3. Shared guest handoff SOURCE-MANIFEST is verified 11/11 at integration start. Ask simplification scope and original guest implementation plan are already approved. Repository Intelligence Gate is DEGRADED: candidate lacks CodeGraph/CocoIndex indexes. Bounded direct source, Git diff, compiler and tests replace discovery only, not whole-graph assurance. Node22/TypeScript6/React19/Vite8/Vitest4; serverless Firestore callables and web Account/Ask. HIGH risk for additive anonymous capability API; no provider operations authorized.

## Concrete implementation
1. Apply only reviewed Ask, Ask.module.css, AccountTracking and appended order-tracking.css diffs. Add seven manifest-bound domain/backend/UI/test files. Shared source is read-only during integration.
2. Add only publicOrderTracking/managePublicTrackingCode export to candidate index.ts. Recover the exact original index bytes by removing this addition; preserve all production-test isolation, jobs and SePay changes.
3. Reuse existing demoFirestoreEndpoint test helper instead of the guest test's fixed local18207 so normal CI baseline8181 runs the same 63 backend cases. Keep unique demo project, owner-only cleanup and fail-closed emulator guard. No CI/workflow/dependency changes.
4. Regenerate public-assets manifest from npm run build with the existing CI public tuple (no build env injected by ci.yml). No handwritten generated asset changes.
5. Run strict frontend/backend types, scoped lint and guest/action-preview/production-test regression. Commit only explicit scoped paths; push existing candidate branch. Observe normal mandatory PR CI at the exact new SHA, inspect logs, fix scoped issues and repeat affected checks only.
6. Record source preservation, current CI receipt, product-content and final reviews, task report. Keep final review BLOCKED where human accessibility/predeployment evidence is missing.

## Preserved behavior and constraints
Owner-private IDs remain private; only owner-issued high-entropy SGT capabilities return minimal progress/qualified ETA. AppCheck, verified owner identity, quotas, expiry/rotation/revoke/idempotency and no raw-code model/analytics/persistence must remain. No production test money/stock/fulfillment regression. VI/EN and contextual task opening/Back/Escape/confirmation remain after removal of numbered row and tab pair.
No main push, deployment, provider secret/TTL/IAM activation, paid AI, additional frontend/emulator server, shared runtime restart/reseed, unrelated WIP edit or broad staging. New GUEST_TRACKING_QUOTA_KEY and TTL/provider checks are separate release gates.

## Validation and rollback
Normal PR CI must cover guest unit and backend/rules cases plus existing quality gates. Prior CI38024008498 applies only to f675ea3a. Rollback is a normal revert of this candidate integration commit, never reset/force push. Immutable main artifact/provider verification, PRE001/MFA, genuine200% zoom/spokenAT and protected review gates remain mandatory before release.

## Reviewed concurrent guest delta
Guest owner changed only Ask null-safe rejection handling and focus preservation while lookup is pending. Reviewed two exact hunks and integrated within approved guest fixes; all other shared files preserved. Re-ran frontend build, scoped lint and135 guest/preview regressions. No new displayed strings or server scope.
