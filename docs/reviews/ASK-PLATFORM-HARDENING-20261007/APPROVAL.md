# Implementation approval
Plan ID/version: ASK-PLATFORM-20261007 / source PLAN.md
Repository intelligence gate status: DEGRADED
Approval status: APPROVED
Approver: human user in current chat
Approval timestamp or task reference: 2026-10-07 current task, explicit implement / verify / review / fix loop instruction
Approved scope: implementation of the existing Ask platform plan; preserve concurrent changes and domain permissions. No production deployment, paid-provider enablement or financial operations.
Approved paths:
- `functions/src/ai/`
- `functions/src/index.ts`
- `packages/domain/`
- `src/features/ask/`
- `src/features/settings/KnowledgeApproval.tsx`
- `src/features/settings/knowledge-approval.css`
- `src/features/settings/Settings.tsx` (KnowledgeApproval import/mount only)
- `tests/unit/`
- `tests/helpers/demo-environment.ts`
- `tests/rules/`
- `tests/browser/`
- `docs/reviews/ASK-PLATFORM-HARDENING-20261007/`

CodeGraph and CocoIndex are stale; native source and tests provide bounded evidence. Repository intelligence policy permits DEGRADED mode. The legacy approval validator requires READY; do not misrepresent index health to satisfy that validator.

Human instruction (verbatim): “thực hiện hardness end to end implement, verify, review verfy, fix loop cho đén khi hoàn thành tạo scenarios bad case and happy case để thực thieejn testing trong quá trình làm loop cho đến khi done”. This supersedes the earlier planning-only instruction.

Continuation approved by human request: “Tiếp tuwjjc hardness loop đó độ hiểu quá cho đến khi done và production”. See CONTINUATION-PLAN.md for next slice and deployment constraints.

Production hardening supporting paths (scoped to required radio-group legend marker and test correctness): src/features/membership/PlanEditor.tsx; tests/unit/required-labels092.test.ts. All other Membership WIP preserved.

S18 scoped paths: src/features/profile/Profile.tsx; tests/browser/profile-recovery.spec.ts; tests/browser/profile-recovery.config.ts; tests/rules/profile-recovery.test.ts. Current human continuation authorizes the already-planned customer workspace hardening.

S18 Ask integration: NEW src/features/ask/CustomerWorkspace.tsx and customer-workspace.css; Ask.tsx import/mount only; Profile instance IDs; browser integration evidence.
