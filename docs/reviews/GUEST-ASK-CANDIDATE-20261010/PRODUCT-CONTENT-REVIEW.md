# Product Content Review — Guest/Ask candidate integration

Scope: responsive React web Account/Ask, VI/EN guest view, Vietnamese Account.
Audience: owner sharing a code and guest checking progress/qualified ETA.
Target fit: existing blue/white/navy web controls and timeline. No Apple-platform
conformity claim or Apple-only conventions. Reviewer: root, 2026-10-10.

## Context and inventory

Verified: ordinary order IDs remain private. Owner-issued SGT capabilities return
only the minimal public projection. All conversation turns, VI/EN, contextual
review, Back/Escape and confirmation remain after navigation removal.
CONTENT-INVENTORY.json records guest literal candidates and removed text. Internal
imports, CSS classes, enum keys and locale identifiers are excluded from display
copy. Changed displayed groups are:

| Location/state | Content and job | Behavior evidence |
| --- | --- | --- |
| Guest stages | Received, preparing, in transit, delivered, cancelled, unavailable; VI/EN | Domain projection and renderer |
| Guest view | Tracking by code, progress/ETA-only disclosure, current/next/previous steps | Exact DTO and renderer |
| Time/ETA | Recorded update, read time, timezone, unavailable recorded time, not live, staff estimate | Qualified aggregation; null remains unavailable |
| Ask prompts | Missing/ambiguous SGT code, recorded-update success, timeout/quota/not-found/connection recovery, owner Account guidance | Public branch before image/model/analytics/transcript I/O |
| Owner Account | Sharing/rotation consequence, code/expiry, issue/rotate/revoke, pending, revoked status, connection/stale-order recovery | Verified owner and transactional response |
| Removed navigation | Numbered question buttons, waypoint label, historical-return label, Conversation/Current task tab pair | Removed JSX/history-only state/styles |
| Preserved navigation | VI/EN, Back to conversation, contextual task headings | Existing preview/task behavior |

Assumption: owner/root actual shared-component browser observations support the
matching UI portions in candidate. This is disclosed proxy evidence, not a new
candidate browser run. The final Ask delta adds null-safe error handling and
preserves focus moved during a guest lookup; these lines have source/compiler/
regression evidence only. Genuine200%zoom/spokenAT remain NOT_RUN.

## State coverage

| State | Result/evidence |
| --- | --- |
| Default/action | Owner issue/revoke; guest minimal progress/next step; source and prior actual320/desktop VIEN surfaces |
| Loading/pending/disabled | Busy/pending/account/confirmation guards retained; both owner buttons disabled while pending |
| Empty/no result/zero | Missing code and unavailable time/ETA explicit; no fabricated zero or promised delivery date |
| Success | Only server-acknowledged issue/read/revoke changes display success |
| Error/recovery | Generic unavailable for private/unknown/expired; timeout/quota/connection/stale-version recovery |
| Offline/stale/partial | Abort and late response ownership tested; observed vs recorded timestamp differentiated; exhaustive browser fault injection NOT_RUN |
| Unauthorized | Verified-Google owner and locked/ownership checks; ordinary IDs do not grant anonymous access |
| Consequential actions | Rotation invalidates old code; revoke explicit; sharing/expiry consequence disclosed |

## Data semantics

Source: server order stage, bounded consistent allocations/projections/timeline.
Exact DTO allowlist reconstructs values; no private data spreads. Null/held/failed/
partial ETA stays unavailable. Locale-aware times use the device timezone; ETA
is an estimate, not a delivery promise. Read time is distinct from update time.
Raw code is excluded from model, transcript, analytics and URL; registry stores
hashes. Account remains Vietnamese under its existing locale contract.

## Mandatory Human Interface principles

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Progress/ETA available; redundant navigation removed |
| Agency | PASSED | Rotation/revoke, scrollback, VI/EN, contextual review/Back/Escape remain |
| Responsibility | PASSED | Privacy/expiry/rotation, estimated/not-live limitations disclosed |
| Familiarity | PASSED | Existing web buttons/chat/timeline pattern |
| Flexibility | NOT_RUN | Narrow/wide VIEN/keyboard proxy exists; genuine zoom/spokenAT missing |
| Simplicity | PASSED | Minimal public data and fewer duplicate controls |
| Craft | NOT_RUN | Source/regressions/browser proxy reviewed; scaling/spoken acceptance incomplete |
| Delight | PASSED | Fewer distracting controls per direct human feedback; no invented user research |

## Platform/pattern checks and gate results

Target-platform fit, meaning/behavior, audience/business context, natural respectful
tone, brevity, terminology, scoped state coverage and data/privacy: PASSED.
Writing/controls, feedback, contextual help, consequential choices and privacy
match implemented behavior. No new motion, marketing or crawler route content.
Guest no-store/noindex/no-referrer is source evidence; live headers NOT_RUN.
Accessibility and localization/text scaling: NOT_RUN for genuine200%zoom/spokenAT.
In-context verification: partial disclosed shared-component proxy; newest focus
delta has no spoken/browser acceptance. Do not adopt owner's broader Product PASS
label when that evidence explicitly excludes scaling/spoken checks.

Decision: BLOCKED. PRE001/MFA, manual review, immutable release/provider/live gates
remain. No repeat MFA/unlock question and no synthetic scaling/AT substitute.
