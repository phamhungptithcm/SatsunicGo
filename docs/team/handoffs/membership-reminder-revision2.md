# Membership reminder configuration handoff revision2

2026-10-04; approved THAW assignment from lead under E2E-005. DEGRADED bounded-source intelligence. Owned new reminder-policy backend, new ReminderSettings UI, PlanEditor integration and separate unit test. Shared jobs/index/rules unchanged by this agent. No production/config policy data written; no default threshold, provider, billing, external email or memory action.

## Contract/integration

Register `export { membershipReminderPolicy } from "./membership-reminder-policy";` in functions index (CRM owns). One callable: `{action:"read"}` returns `{version,approved,daysBeforeExpiry:number|null}`. Save: `{action:"save",operationId:UUID,expectedVersion:integer>=0,approved:boolean,daysBeforeExpiry?:integer1..30}`; enabling requires threshold. Missing/legacy no-version record uses technical version0; missing threshold remains null. Read never supplies a business threshold.

RequireVerifiedGoogle guards both actions; transaction checks existing unlocked user, active/current unlocked staff record and OWNER role before reading policy/idempotent result. Production save requires recent MFA. Save rechecks expected version, fingerprints namespaced operation input, returns exact original replay result, rejects changed same ID, atomically sets policy + audit + operation result. It never queues email/charges during callable retry. Lead jobs consumes approved policy and deterministic reminder keys separately.

PlanEditor embeds ReminderSettings. Form is disabled until successful read; reload clears previous data; no threshold prefilled. Checkbox permits explicit approved enable/disable. Mutation errors preserve operation ID for uncertain transport/server result and lock edits/reload until same-payload retry; known rejection clears operation. Version mismatch disables edits until authoritative reload. Direct double-click guard and unmount guard included. No automatic payment promise; disabling policy only stops future creation, not existing queued notices.

## Validation

- Focused `npx vitest run tests/unit/membership-reminder-policy.test.ts`: PASS5tests. Missing threshold, input bounds/extra-field denial, replay one version/audit, changed same ID denial, stale version, current role revoked before replay, unverified/nonowner/locked denial, production MFA denial, explicit disable.
- Scoped ESLint: PASS. `npm run build --workspace functions`: PASS current source.
- Full typecheck: BLOCKED at time of run by unrelated tests/rules/firestore.test.ts TokenOptions errors lines60/68/78/89/111/124; lead notified. No unrelated edits.
- Firestore concurrency, callable deployment/registration, live owner MFA, scheduler+policy browser integration: NOT_RUN. No shared emulator mutation; live demo remains leased elsewhere.

## Product content review

Web vi-VN; current JSX/backend strings are explicit source proxy, not rendered evidence. Inventory: title “Nhắc membership sắp hết hạn”; owner-only/no-auto-charge explanation; reload action; loading status; enable checkbox; number label/range1–30; save/retry action; enabled confirmation with conditional configured-email meaning; disabled confirmation retaining already-created notices; failed read/retry/version mismatch/MFA/permission messages. Number range reflects schema+job contract. Missing is unknown/null, never assumed7/30; successful save means durable policy, not sent email. Error text comes from safe server messages; role denial does not expose another user.

| State | Evidence |
|---|---|
| Default/disabled | Null policy locks edits; number empty until owner read |
| Loading | Live status, fields disabled, direct request lock |
| Empty | Missing policy reads disabled state without invented threshold |
| Success | Stored policy confirmation distinct from queued/sent delivery |
| Error/retry/offline | Same payload/operation retry; known rejected version reload |
| Unauthorized | Verified Google/current OWNER required server side |
| Cancellation | Disable stops new jobs, retains existing notices; no deletion |

| Principle | Status | Evidence |
|---|---|---|
| Purpose | PASSED source proxy | Configure authorized reminder timing |
| Agency | PASSED source proxy | Explicit enable/disable and chosen days; no auto charge |
| Responsibility | PASSED source proxy | Server authority, version/MFA/idempotency; email outcome conditional |
| Familiarity | PASSED source proxy | Native labeled checkbox/number/button, familiar Vietnamese |
| Flexibility | NOT_RUN | Keyboard/mobile/zoom browser evidence outstanding |
| Simplicity | PASSED source proxy | Two policy fields; no invented provider controls |
| Craft | NOT_RUN | Rendered field/error/long message evidence outstanding |
| Delight | NOT_RUN | Actual feedback timing/interaction needs browser |

Product-language gate and final-review full handoff: BLOCKED pending current rendered + coordinated integration evidence. No successful full-ready certification. Root must include this scope in final browser/review cycle. Memory candidates None; token/cost unavailable.

## Source hashes
b1b492fc2da0c1f70a2b99e05c8d16d240c8d58ad7c2c13ee47ee2bf8658a934  functions/src/membership-reminder-policy.ts
49dbaa40575137205a637426de88b452c3bfb1ec7f2a66babc8ed4dda9e4dabb  src/features/membership/ReminderSettings.tsx
4d0d18ac1d26cf009670a3b310b8ff4878ebe281fb09a0096d3b3b70afd503e5  src/features/membership/PlanEditor.tsx
ff8a58bbbc0b8218e9123cc039b1a26f91df3ac5f976df055f611797b82c6871  tests/unit/membership-reminder-policy.test.ts
