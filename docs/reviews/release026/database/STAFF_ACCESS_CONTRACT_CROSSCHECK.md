# Release026 StaffAccess contract delta cross-check

Readonly current source inspection, 2026-10-05. Earlier 36-file manifest and reviews retained as historical evidence. Repository intelligence remains DEGRADED; bounded direct source used. No source/rules/index/data edits or runtime runners.

## Observed contract

- workspace.ts:568-578 preserves existing-record CAS equality first, then rejects any defined stored version that is not a safe nonnegative integer below Number.MAX_SAFE_INTEGER. Undefined legacy version is accepted only when expectedVersion is also undefined. Explicit null is defined and rejected; no normalization to zero bypasses CAS. The subsequent increment at 659 yields legacy first version 1 and a safe increment for accepted stored versions. Exhausted maximum version is deliberately rejected before increment.
- readStaffAccess (workspace.ts:798-802) omits version/active/locked only when each is undefined. Explicit null and other malformed values remain visible. roles is returned raw; orderIds retains the existing nullish fallback to []. Three direct document reads and OWNER/user/staff lock guard are retained; no new query or collection introduced by these clauses.
- StaffAccess validAccess (src/features/settings/StaffAccess.tsx:28-44) accepts null target or a projection with optional undefined version/active/locked; defined version must be safe nonnegative integer below MAX_SAFE_INTEGER, defined flags booleans, roles/orderIds arrays of strings. Explicit null optional fields are rejected. Unknown string roles are not rejected by this projection, while the server save schema still constrains grant roles to its enum and assignments to bounded valid IDs.
- Client save (StaffAccess.tsx:91-114) requires ready, idle and target === current input UID. expectedVersion is omitted when undefined, preserving legacy CAS. Every load/save captures a request epoch; UID change and unmount increment it, and completion/status/finally handlers ignore stale epochs. UID change clears readiness/target/access. Successful save requires another load before editing again.
- Server saveStaffAccess retains OWNER authorization, production recent MFA, self-lock/self-OWNER-removal prevention and strict bounded payload schema (workspace.ts:506-546). No production grants were performed by this reviewer.

## Query/data scope and limits

Local firestore.rules and firestore.indexes.json SHA256 match the earlier 36-file manifest. This is local file evidence only; deployment/index availability UNKNOWN. The generic CAS guard affects existing workspaceCommand persistence paths, not only staff grant; action-specific malformed-version, replay and legacy coverage must come from root receipts. No migration/schema declaration was inspected as a changed artifact; undefined compatibility is a read/write contract adjustment, not evidence of a production data migration.

Root reported 16 native StaffAccess cases, legacy SDK grant, keyboard/layout and current unit passes. These are coordination context, not independently inspected or rerun by database. Full rules/native aggregate was pending at assignment. No runtime/local whole-system readiness certification here.

Remaining limits: live Google/MFA/AppCheck, all generic command actions, audit/idempotency no-write on rejected versions, provider/Storage/email effects, deployed indexes and production restore NOT TESTED by database. Epoch fencing suppresses stale UI responses but cannot cancel a server write already submitted; real authorization/CAS must continue to guard that write. readNotification user/staff-lock parity remains the earlier policy question. Production NOT_READY; final aggregate review UNKNOWN. Memory candidates None; token/cost totals unavailable.
