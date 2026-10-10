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

Durable S18 approved continuation: workspace.ts customer save fence admission only, index.ts export, NEW customer-save domain/backend and save-recovery client helper, Profile integration, targeted tests. Workspace pre-change SHA256 eb3178ddcace89b9e3bb915608f22b017fe2641e1732ac0d2572cb8229393e26; unrelated workspace WIP preserved.

S19 paths as continuation of full approved plan: src/features/membership/Membership.tsx; src/features/ask/CustomerWorkspace.tsx; customer-workspace.css; Profile optional pending/blocked props; scoped tests. Membership initial SHA256 3924c7e001af363fde9f55d0a3a3f475a756b01ae4931b8dfed2588941c076ec. No backend finance/policy edits.

S19-R1 follows the latest human continuation “Tiếp tực hardness” and already approved Membership customer-workspace hardening. MEMBERSHIP-RELOAD-PLAN.md records impact before implementation. NEW src/features/membership/command-recovery.ts; Membership.tsx integration; NEW tests/unit/membership-command-recovery.test.ts; existing membership browser and actual-handler demo tests; review/scenario docs. No backend finance policy/public-contract/dependency/deploy changes. Original instruction and current task reference are the approval evidence, not an agent-issued authorization.

Research/context/feedback continuation (2026-10-08): the human explicitly requested implementation/fix/test of web research, advanced knowledge/context, reviewed feedback learning and live verification. RESEARCH-CONTEXT-FEEDBACK-PLAN.md records observed paths, baseline hashes and scoped review deltas before edits. Human provider/budget reply verbatim: “gemini nhữnv web lớn uy tín giới han chi phí là 50000vnd”. This authorizes a bounded Gemini public-product provider probe up to 50,000 VND. It supersedes the earlier blanket no-paid-probe boundary for this test only; it does not activate general customer paid generation, deploy anything, change production settings, authorize secret access, or perform customer financial actions.

Additional owned paths: NEW ask-research/ask-feedback domain contracts; NEW research/research-discovery/research-gemini/research-budget/knowledge-context/feedback/feedback-evaluation backend modules; NEW WebResearch/AnswerFeedback/Research.module.css; CatalogSearch/Ask targeted mounts and approved-knowledge byte bound; index exports; local research runner and acceptance runner/config; scoped unit/demo/browser tests and review docs. Membership explicit recovery-button-only retry is an in-scope correction to earlier approved recovery boundary. Concurrent analytics exports/imports are preserved.

First-party-only local live policy now restricts sources to B&H and Sony US: Best Buy removed after its official Marketplace FAQ confirmed third-party sellers on the same host. No new live call or budget increase. Candidate links remain unverified; seller/price/review verification and production merchant policy still require their own acceptance.

DASHBOARD-LABEL-DELTA-PLAN.md and .patch are reviewable only, NOT_APPLIED. The two-marker Dashboard fix is outside the approved Ask edit paths and awaits the pending human answer. No implicit authorization claimed from this file. Business corpus and feedback retention/withdrawal/deletion policy also await the pending human clarification.

ASK-INTEGRATION-20261008/v1 follows the latest explicit human continuation of the three enumerated gaps after REPORT cycles26–30. INTEGRATION-PLAN.md records source-verified plan/paths/risks before edits. Provider ceiling unchanged; no production activation/data/deployment/financial authority or unrelated Dashboard approval inferred.
