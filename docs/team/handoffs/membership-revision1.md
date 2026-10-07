# Membership handoff revision1 — 2026-10-04

Context: TEAM_CONTEXT revision1, E2E-005 owner approval; source-only bounded evidence, intelligence DEGRADED. Ownership respected: membership backend/UI, separate new membership tests. No production, provider, billing, secrets, external effects or durable global memory actions. No generated source edits.

## Fixed execution paths

- Purchase/confirm/grant validate server-snapshot integer period 1–366; corrupted or reversed times fail closed. Same active plan renews from previous expiry without losing prepaid time. Different active plan cannot overwrite existing commercial benefits without an approved transition policy; legacy same-name snapshots retained compatibly.
- Confirm requires invoice ID, pending invoice, exact amount, finance/owner and existing unlocked target. Existing MFA, bank reference uniqueness, ledger separation and transactional idempotency remain. Grant cannot create membership for an absent user.
- Renewal intent can be requested/cancelled; neither changes current expiry nor automatically charges. Cancellation cannot create a phantom subscription. Intent history is owner-readable and audited.
- Customer may cancel only their own pending invoice; paid invoices remain immutable by this action. This cancels the request, never claims to refund/undo a bank transfer.
- Activation creates deterministic outbox job in the same transaction, without external provider effects. Lead owns scheduler expiry integration.
- Customer page reads owner-filtered invoices/history and own subscription, limits each query to30 (not claimed as most recent/all), cleans listeners/private state on account change/failure, suppresses stale command completions. Commands and grants reuse operation ID after uncertain errors; direct double-click guard prevents simultaneous submissions. Authentication/staff permissions remain server-authoritative.

## Validation and evidence limits

- `npx vitest run tests/unit/membership-*.test.ts`: PASS2files/10tests; term boundaries, invalid periods, cross-plan denial, replay purchase, changed-operation rejection, phantom subscription prevention, intent persistence, cross-owner/paid invoice cancellation denial, absent grant target, separate receipt and bank reference reuse.
- `npx eslint tests/rules/membership.test.ts src/features/membership functions/src/membership.ts tests/unit/membership-*.test.ts`: PASS.
- Full `npm run typecheck`: first blocked by unrelated order-media.ts82 TS18048; rerun completion reported to lead separately. No unrelated fix by this agent.
- New `tests/rules/membership.test.ts`: NOT_RUN, explicitly held because shared demo95118 is active. Tests require exact demo project +8181 loopback; do not run outside coordinated emulator launcher. Covers real concurrent same-op confirmation/one receipt, finance denial and scheduler expiry replay/one owner-readable event + notification.
- Browser, customer One Tap, production data/query indexes, live payment/SMTP/AppCheck: NOT_TESTED by this agent. Unit transaction harness is not a Firestore concurrency test.

## Product content review (web/vi-VN)

Scope Membership.tsx and PlanEditor grant retry; backend HttpsError strings. Actual source and TypeScript JSX are current proxy; rendered screenshots/keyboard/zoom evidence NOT_RUN. Reviewed write-product-content contracts, principles and surface guidance. Web conventions apply; Apple-only controls/expression not adopted.

Inventory changed strings/states:
- Default: no automatic renewal charge; subscription active-until/expired date, renewal intent, request/cancel intent actions, purchase-or-renew action.
- Loading/disabled: “Đang tải các gói…”; anonymous/busy purchase and busy private actions disabled.
- Empty: published-plan absence only after completed read without error; no invented free/commercial plan. Invoice/history headings and explicit capped loaded30 rows, without claiming a zero or complete history.
- Success: durable purchase awaits confirmed payment; cancelled unpaid request; renewal intent recorded/no automatic charge; cancelling intent preserves current rights until expiry.
- Error/recovery: reload failed reads; retry same uncertain operation/payload before different action; grant uncertain-result wording preserves operation; server period/invoice/target/permission/active-plan errors describe safe boundaries.
- Unauthorized: account-page sign-in destination described; no private ownership IDs exposed in denied errors.
- Cancellation: before customer cancels request, explains if already transferred contact support; paid server state cannot be cancelled. No refund promise.
- History: confirm/grant/expired/intent enums map to Vietnamese, unknown action has safe update label.
Data meaning: VND and days from published snapshot; service-fee discount excludes item price/tax; authoritative server expiry, vi-VN localized display; UI selected rows are capped unsorted server subset sorted client-side. Customer query ownership mandatory. No staffing/support/quick delivery claim invented.

| Principle | Status | Current evidence |
|---|---|---|
| Purpose | PASSED (source proxy) | Purchase, current entitlement and separate invoice/history explain task |
| Agency | PASSED (source proxy) | Intent is optional, cancellation does not revoke prepaid term, no auto debit |
| Responsibility | PASSED (source proxy) | Pending vs paid distinct; uncertain commands retry same ID; no fake payment |
| Familiarity | PASSED (source proxy) | Native buttons, Vietnamese dates/currency; account sign-in destination |
| Flexibility | NOT_RUN | Narrow layouts, keyboard and zoom need coordinated browser |
| Simplicity | PASSED (source proxy) | One operation button per invoice; explicit capped results |
| Craft | NOT_RUN | Actual rendered long-content/focus/readability needs current browser |
| Delight | NOT_RUN | Motion/timing/interaction needs current browser; no decorative motion added |

Product-content gate: BLOCKED pending rendered evidence. Final review: BLOCKED; requirement/full acceptance, live configuration and coordinated emulator/browser tests remain. This is an integration handoff, not successful full readiness certification.

## Shared integration and open inputs

Lead scheduler contract sent: global membershipHistory and deterministic membershipExpired outbox/audit; lead reports implemented. Consumer labels must include membershipActivated/membershipExpired with no orderId. Reminders need approved settings/membershipReminders policy threshold; do not invent days or silently promise reminder coverage. Master additional freight reduction/storage/support benefits/minimum-fee/promotion combination remain owner policy + shared workspace/domain configuration gaps; no commercial values fabricated here. Bank beneficiary/payment instructions need approved operator settings; membership amount reference displayed but not fake account detail. Full history pagination/latest sorting needs coordinated composite indexes/API; current UI states capped loaded subset truthfully.

Auth full-system email-verification/provider gate was not changed in this bounded membership lease. Membership currently requires uid, existing unlocked target and existing auth infrastructure; lead should audit provider/verified-account requirement globally rather than certify unit fixtures as live OAuth.

Memory candidates: None. Token usage/cost: Unavailable.

## Immutable source hashes
6801e538bff23d27dcde9edb4bd54de0c7600eda8b6d1537a6c4b8db329ab8b6  functions/src/membership.ts
929b9664f658468b252a10c7e0362cce5fe3f77f855486d85cc0535722cbbac0  src/features/membership/Membership.tsx
697139408508c723c08c6f24f322a19863eef3ef92216d87e2ed2a1c73eceeca  src/features/membership/PlanEditor.tsx
003a7d88d167d4becc30c7ad65efd06e5009e3f3385761dc95720cddae7dfcb7  tests/unit/membership-command.test.ts
d446da8c050490233ae966c908dc39294b29cf2ed85f5e29ab3818cece5ac0ca  tests/unit/membership-term.test.ts
f8e2991cc321c2235fb0d5ef08bce2b2a56c024527f27aac2cc347d6aa385c35  tests/rules/membership.test.ts
