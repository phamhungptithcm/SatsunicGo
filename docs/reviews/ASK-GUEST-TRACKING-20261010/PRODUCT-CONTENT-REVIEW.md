# Product content review — guest tracking

Reviewed 2026-10-10 in actual Account and logged-out Ask at existing5207. Web React, Vietnamese/English; Satsunic blue-white-navy design system. Apple HIG reference used as eight human-centered principles, not Apple platform compliance; current Apple-specific contract NOT_APPLICABLE. Source inventory: CONTENT-INVENTORY.json. Shared DeliveryEstimate strings/formatting unchanged, reviewed in context.

## Facts and meaning
Owner obtains a separate SGT capability in Account. Any holder can see coarse progress/ETA until expiry, rotation or revocation. Ordinary order IDs are unsupported publicly. Only publicStatus/updatedAt/observedAt/eta leave the callable. No personal, item, financial, route or tracking details. ETA is staff-entered, not guaranteed or live. Latest relevant recorded activity is different from query read time. Dates use device timezone with zone/UTC offset in ETA. Unknown means unknown, never zero or invented date. All delivered/cancelled statuses suppress future ETA; incomplete/future/stale coverage suppresses ETA; held/failed/returned states neutralize reasons. Four public coarse steps intentionally hide purchase/payment detail.

## Changed strings and state inventory
Exact source literals and JSX text are retained in CONTENT-INVENTORY.json; technical schema/class literals are inventory context, not user copy.

| Surface | State | Content families / behavior evidence |
|---|---|---|
| Account code | default | Mã tra cứu cho khách; explanation anyone with code can look up, new code invalidates old; Tạo mã tra cứu / Thu hồi mã |
| Account code | pending/success | Đang xử lý…; disabled controls; Tạo mã mới; Hết hạn; code is selectable and wraps; expiry from server |
| Account code | revoked/error | Đã thu hồi mã tra cứu; generic connection/retry/reload guidance; same operation ID retained on uncertainty |
| Ask question | all guest submissions | Tra cứu tiến độ / Track progress localized separately; raw code never displayed in submitted bubble or waypoint |
| Ask request | missing/ambiguous | Enter a code; one code at a time; ordinary order code explains owner Account SGT path / sign-in |
| Ask request | not-found/rate/service/timeout | Uniform unavailable text; one-minute retry; network retry; timeout retry; VI/EN from branch |
| Guest card | success | Progress from recorded updates; progress-only scope; four normalized labels; current/next/previous labels |
| Guest card | cancelled/held | Cancelled or needs update; no internal hold/failure reason, no future promise |
| Guest card | unknown/partial/stale | Existing shared unknown ETA text; no fake dates; recorded time unavailable where absent |
| Guest card | timestamps | Recorded update, Read at, Not live; actual time elements/zone; shared staff estimate qualification |
| Existing Ask shell | loading/accessibility | Existing loading copy, stop/send/close controls and role=log retained; attachments remain pending for separate product questions (ATTACHMENT-NEGATIVE.png) (ATTACHMENT-NEGATIVE.png) (ATTACHMENT-NEGATIVE.png) |

## State coverage and recovery
Default, loading, disabled, success and revoked states: Account UI + backend tests. Empty/no result, malformed and missing code: browser/HTTP/unit tests. Rate, expired/locked, schema-tampered, offline/dependency failure: unit/emulator plus source context. Timeout/late resolve/cancel: abort helper tests, request ownership checks, retry copy; full browser artificial delay/offline injection NOT_RUN. Neutral/cancelled/unknown ETA: server-rendered VI/EN unit coverage. Existing owner-only forbidden state remains protected. Issuance is an explicit optional owner action; replacing/withdrawing codes has no financial effect. No automatic notifications or code publication.

## Mandatory principles

| Principle | Status | In-context evidence |
|---|---|---|
| Purpose | PASSED | Guest card exposes only processing stage, next coarse step and qualified ETA; HTTP.log and screenshots |
| Agency | PASSED | Explicit owner issue/rotate/revoke, anonymous lookup, stop/send controls; no forced login for SGT |
| Responsibility | PASSED | Any-holder sharing consequence, expiry, manual estimate and not-live qualifications; DTO canary tests |
| Familiarity | PASSED | Native buttons, timeline, Account/Ask terminology and established brand; no new navigation pattern |
| Flexibility | PASSED | VI/EN actual Ask and 320px layout; 320px scrollWidth=320; text/current marker supplements color |
| Simplicity | PASSED | One code per request; no private parcel/history panels or details link; localized masked waypoint |
| Craft | PASSED | Fixed missing ot CSS class, capitalized Vietnamese intent, malformed suffix, timeout and owner routing; timestamps differ honestly |
| Delight | PASSED | Session follow-up avoids retyping; reliable recovery, minimal data entry; calm task-focused copy |

## Platform / pattern checks
Web DOM native buttons and time elements; existing dialog focus and role=log announce updates. Guest steps have one aria-current=step. No extra animations introduced; existing Ask reduced-motion/interrupt cleanup retained. Four columns on desktop, vertical at≤600px; no horizontal overflow at320px. GUEST-DESKTOP.png/GUEST-MOBILE.png capture actual UI, not preview HTML. Screen-reader hardware/200% system text/reduced-motion browser emulation NOT_RUN; code follows existing shell and adds no motion. No legal/medical/financial claim. No Apple-only expression. Locale owner controls follow Vietnamese Account; guest card supports VI/EN.

## Decision
PASSED for scoped web content and displayed semantics. Production provider behavior is not asserted. Residual: 68-character capability requires selecting/copying; mixed guest queries return public progress only and should send unrelated product/fee questions separately. Existing shell's Google notice is conditional “when AI is used”; guest branch invokes no AI.
