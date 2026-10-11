# Tracking release preparation v1

Human authorization: current user requested release candidate closure, production configuration/runtime verification and fixes within tracking scope; explicitly no deploy. Prior implementation approvals remain in ORDER-TRACKING-CRM-E2E-20261010/APPROVAL.md and conversation guest lookup approval.

Intelligence DEGRADED (both indexes stale; CocoIndex health unavailable); bounded source, Git, compiler/tests and read-only provider metadata used.

1. Freeze latest remote main and live release metadata. Reuse shared runtime without changes.
2. Build an isolated managed worktree from verified remote SHA; overlay only approved tracking modules/tests and missing import dependencies. Preserve upstream unrelated behavior (including Ask conversation-history read-only guards) and omit shared unrelated WIP.
3. Validate candidate using Node22, production public configuration from existing GitHub variables (never log values), production build, callable preflight, scoped rules/components/unit regression; compare candidate source hashes.
4. Read-only production metadata: Functions runtime/inventory, App Check registration, Auth domains/MFA, guest quota secret presence, quota TTL and relevant IAM. No secret values, customer documents, role changes, IAM edits or production calls that mutate state.
5. Fix reproducible integration defects in tracking source/tests only. New infrastructure/IAM/secret provisioning remains a documented operator action, not an autonomous production mutation. No dependencies/CI changes.
6. Commit only isolated candidate with Conventional Commit on hunpeolabs branch if validation permits; do not push, tag, create GitHub release or deploy. Hash/checksum source bundle and record remaining gates, rollout/rollback and fresh final review.

Risk: HIGH privacy/authorization boundary. Public lookup stays high-entropy capability only, strict4-field DTO, App Check and quota enforced. Preserve authoritative quantity completion, finances, concurrency/idempotency and approved compact timeline. Production evidence does not prove undeployed candidate behavior.
