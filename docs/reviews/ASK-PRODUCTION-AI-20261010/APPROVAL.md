# Implementation Approval Record

Plan ID/version: ASK-PRODUCTION-AI-20261010 v1
Repository intelligence gate status: DEGRADED — source-verified fallback permitted by repository-intelligence-gate.yaml; validator still requires READY and cannot represent this policy state.
Indexed analysis reviewed: CodeGraph/CocoIndex followed by source verification; plan contains bounded findings.
Approval status: APPROVED
Approver: Human user in current chat
Approval timestamp or task reference: 2026-10-10 current chat user message “apporved”; subsequent budget reply “50000”.
Approved scope: Implement plan v1, 50,000 VND total customer generation ceiling; 24-hour window selected and disclosed in current chat; no top-up or trial ledger reuse. OWNER canary before customer audience. Production acceptance remains evidence-gated.

Approved paths:
- `functions/src/ai/ask-production.ts`
- `functions/src/ai/ask.ts`
- `functions/src/ai/ask-pilot-answer.ts`
- `functions/src/ai/server-context.ts`
- `functions/src/workspace.ts`
- `src/features/settings/AskPilot.tsx`
- `tests/unit/ask-production*.test.ts`
- `docs/plans/ASK-PRODUCTION-AI-20261010.md`
- `docs/reviews/ASK-PRODUCTION-AI-20261010/**`

Required constraints: Preserve shared WIP, App Check, verified Google, OWNER/MFA administration, account locks, object ownership, explicit transactional actions and uncertain reservations. No secrets, production fixtures, role grants, IAM expansion, rule changes, dependency changes or ledger reset.
Explicit exclusions: Anonymous paid AI, images, paid web research, payment/provider activation beyond scoped AI, unrelated release work.

## Approved delta and public disclosure — 2026-10-10

Human reply: “Approve test-only clock fix”. Scope adds `tests/unit/notification-subscriptions.test.ts`: freeze Date to the existing fixture timestamp before each test, restore real timers after each test, preserve all assertions and production email behavior. Rerun focused and full suites.

Human reply: “Approve public push and draft PR”. Explicit authorization to publish the isolated Ask commits to the existing public GitHub repository `phamhungptithcm/SatsunicGo` and open a draft PR. No unrelated shared WIP or secrets may be published.

Intelligence remains DEGRADED: prior source-verified brief retained, current test file and clock hooks reopened before editing; no dependency or production code change in this delta.
