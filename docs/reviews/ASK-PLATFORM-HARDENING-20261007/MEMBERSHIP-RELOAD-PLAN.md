# Membership reload recovery — scoped continuation

Plan ASK-PLATFORM-20261007 / S19-R1. Human approver: current task user. Approval evidence: APPROVAL.md original implementation instruction and latest “Tiếp tực hardness”. This implements the already approved S19 customer-workspace hardening; no backend financial policy/public-contract change.

## Intelligence and verified gap

2026-10-07 task: CodeGraph queried first (Membership/membershipCommand/CustomerWorkspace), CocoIndex second. Gate DEGRADED: CodeGraph stale/healthy, CocoIndex stale/unhealthy. Native source and tests verify critical facts. HEAD 53d59bd88fa7da9d1243692336ecd09b6540ea31; dirty concurrent work preserved. Optional index failure does not block bounded work.

Membership currently keeps an exact operation in a ref only. Mount/account change clears it. Therefore an unknown purchase or renewal outcome followed by reload can issue a new operation. Backend membershipCommand stores a transactionally committed uid + operationId + complete command hash/result, rejects changed replays and checks account lock before returning a previous result. Purchase is a pending invoice or free activation, never a payment. Renewal is intent only. Current backend records no idempotency expiry; deployed retention is NOT_VERIFIED. Existing client contract sends only planId/invoiceId, not expected plan price/revision. No price-binding or read-only resolver is introduced by this slice.

## Smallest change, ownership and impact

- NEW src/features/membership/command-recovery.ts: strict customer-only command envelope (purchase, cancelInvoice, requestRenewal, cancelRenewal); UUID operation; public resource ID payload only; no private profile/address/finance evidence. Per-owner SHA256 storage key, localStorage reservation under existing Web Locks convention, exact correlated clear, fail closed on corruption/storage/locks unavailable. Never persist identity/PII/payment evidence in value, never expire/auto-clear unknown intent.
- Membership.tsx: hydrate before enabling commands, preserve exact action/payload/op across reload, explicit manual retry only. Atomic reservation prevents different operations across tabs. Validate command reply before retirement. Keep uncertain/rejected replay pending; a later permission error cannot prove an earlier command did not commit. Account/generation fences protect async hydration, reservation and reply. A saved attempt never auto-submits on reload. Existing prices, entitlement, invoice and staff/payment semantics remain authoritative in backend. Show bounded recovery guidance in the existing Vietnamese Membership surface.
- NEW unit helper/admission tests plus scoped browser reload/corruption/storage/account/concurrency/reply scenarios using real Membership through CustomerWorkspace at shared 5207, synthetic auth/API/read snapshots declared.
- Extend existing actual-handler demo test to exercise serialized/restored exact replays, changed public plan after committed result, cancellation and renewal. Only unique synthetic demo records, no reseed/restart.
- Existing acceptance runner/config include added cases; review docs record all cycles and frozen source evidence.

No dependencies, backend finance/public API/schema, unrelated UI/layout, runtime/deploy config, IAM, paid provider, real customer operations or memory changes. Existing copy outside recovery is preserved. Product Language Gate applies to new recovery states; this surface already declares lang=vi, complete EN Membership localization remains a full-platform gap.

## Risk, alternatives and limits

High data-integrity risk: duplicate request after unknown outcome. Durable exact replay is the current-compatible correction. No browser identifier grants server permissions. Browser storage may be manually deleted/private-mode restricted; writes then fail closed where detectable, removal of all storage cannot establish recovery. Web Locks unavailable => read-only recovery guidance, no mutation. Pending helper does not make profile and membership mutually exclusive across different tabs; backend cross-workspace fencing is separate deferred work. Stale plan pricing before an uncommitted retry is a pre-existing public-contract limit: retry reuses planId and server current pricing. Durable unknown result will not be erased just because catalog plans changed; no new price or paid claim is fabricated. A read-only operation resolver with explicit not-dispatched/admitted states is the long-term option, requires a separately reviewed contract.

## Validation and review loop

Meaningful unit failures before implementation; strict envelopes, field contamination, account separation, concurrent reservation, missing storage/locks, correlated clear and reply shape/correlation. Browser: paid/free/renewal/cancel reload after lost result; exact payload/id; no automatic dispatch; changed live intent/plan never reconstructs original; malformed/denied reply stays pending; corruption/storage restrictions block new dispatch; account change late reply; parallel tabs one reserved operation; keyboard/mobile/scaled layout. Actual-handler demo proves one invoice/one history entry/no collection/unchanged entitlement. TS frontend/backend noEmit, scoped ESLint, diff check, frozen all-local suite. Review → fix → affected tests → fresh review, manually recorded if ai-agent-kit unavailable. Overall Ask/production stays BLOCKED until all existing acceptance/provider/release gates are satisfied.

## Pre-change hashes

- src/features/membership/Membership.tsx: 6dd8bea4628be7208ad8bf7fed19367c6566a1d5d020f58100d446fd8c5f428a
- src/features/ask/CustomerWorkspace.tsx: 6293cd5721df7ffcad0d2a55026c5472fa3a68f8d14083209f53d02c5ebef637
- functions/src/membership.ts: 3a1d4abe85967f89fc27086ab8d01944e886e1bc6f3c5d6ab3a266d6dd8d8227
- tests/browser/membership-workspace.spec.ts: 4b6cbc97e8e63d1efac05d87f8402a03354dc7ea0d788ac17811db7c611e5e3a
- tests/rules/ask-membership-workspace.test.ts: 0f2009c68f38c1eb3e62d74ae3c421aa243eaefe974355dbffca0e721c9855e2
