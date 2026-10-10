# Product Content Review — PASSED

Scope: existing Ask web chat, VI/EN, owner and anonymous tracking. Human direction removes manual language toggles and uses approved Account visual language compactly. Account default sizing and private authorization remain unchanged. Evidence: OWNER-DESKTOP.png, OWNER-MOBILE.png, GUEST-DESKTOP.png, GUEST-MOBILE.png, ENGLISH.png, BROWSER.json and COMPONENT.log. Browser images use actual Ask/renderer with synthetic SDK/auth; not production or real-order evidence.

Verified facts: shared OrderTracking receives compact only in both Ask render paths. Guest uses strict publicTrackingSchema and four public statuses; no private six-stage financial history is fetched or inferred. Guest has one updatedAt, so only current stage receives that timestamp. Read time is observedAt; future/past missing timestamps are not invented. Owner milestones retain event-backed dates.
Assumptions: existing canonical blue/white/navy design remains authoritative.
Unknowns: live provider, actual screen-reader hardware and cross-browser engine checks are NOT_RUN. Apple HIG platform compliance is not claimed: this is a web interface using repository human-interface principles.

## Content inventory

| Location/state | Content and change | Job and behavior evidence |
| --- | --- | --- |
| Ask header | VI / EN selector removed, complete row removed | User requested removal; language inference remains; English query verified in ENGLISH.png and tests |
| Guest panel / success | Tra cứu bằng mã / Tracking by code; existing four labels retained | Describe anonymous allowlisted progress only |
| Guest timeline heading | Cập nhật ghi nhận / Recorded update; device timezone | Distinguish recorded update from read time |
| Guest status tags | Đã qua / Previous; Hiện tại / Current; Tiếp theo / Next | Reinforce connectors and aria-current, not color alone |
| Current guest timestamp | dd/mm/yyyy · HH:mm, single line; Chưa có cập nhật / No update yet if missing | Canonical approved format; no fake past dates |
| Cancelled/unknown footer | Cập nhật ghi nhận / Recorded update, or existing missing-time message | No active milestone invented; time still available |
| Read footer | Đọc lúc / Read at; Không cập nhật trực tiếp / Not live | observedAt remains separate from updatedAt; wraps as one inline sentence |
| Guest ETA | Existing DeliveryEstimate wording retained, uncertainty and source visible | No promised arrival; eta null remains unavailable |
| Owner card | Existing strings unchanged; same six milestones, dates, history, parcel panel | Compact changes spacing/size only; Account default unchanged |

## State coverage

Default/input, loading/disabled, success, no result, invalid schema, offline, timeout, cancellation, auth transition, stale A→B→A and recovery: COMPONENT.log 26 passed, UNIT.log 57 passed. Unknown/cancelled/partial/stale/delivered renderer semantics remain covered by unit tests. Owner/guest, VI/EN, wide/narrow screenshots verified. No confirmation/destructive action introduced (NOT_APPLICABLE).

## Data semantics

Progress is an ordered status projection, not a precise location. ETA is an estimate, not a guarantee. Public updatedAt is the only recorded status timestamp. observedAt is read time. Device timezone shown; numeric dates use h23, dd/mm/yyyy · HH:mm, machine-readable time datetime. No customer identity, address, amounts, carrier IDs, private history, capability code or owner links appear in guest results. Security boundaries and server allowlist unchanged.

## Mandatory Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Current status, connected steps and ETA lead the card; OWNER-DESKTOP/GUEST-DESKTOP |
| Agency | PASSED | Composer, stop/close, retry by code remain; keyboard focus regression passes; English queries set language |
| Responsibility | PASSED | Estimate uncertainty, missing timestamps and Not live remain explicit; privacy tests pass |
| Familiarity | PASSED | Existing Account icons, connector, current/next tags and event-backed dates reused |
| Flexibility | PASSED | 320px vertical, desktop horizontal; VI/EN; keyboard log; reduced-motion CSS retained |
| Simplicity | PASSED | Removed selector row; removed duplicate guest update footer for active stages; compact padding |
| Craft | PASSED | One-line numeric dates; current state aria-current; no dialog/card overflow at320px; BROWSER.json |
| Delight | PASSED | Existing finite enter/connector/ring animations, no new dependency/polling; reduced-motion disables animations |

## Platform fit and pattern checks

Web React/HTML: semantic ol/li, h2, time datetime, aria-current, decorative SVG aria-hidden; log keyboard focus retained, no focus stealing. Native buttons/input/dialog retained. Brand blue-white-navy, not copied Apple controls. Writing/feedback/recovery/privacy/inclusion: PASSED in actual synthetic in-context rendering and tests. Alerts/onboarding/permissions/destructive changes: NOT_APPLICABLE. RTL support and dedicated screen-reader hardware: NOT_RUN, outside supported VI/EN scope.

Accessibility: desktop owner axe had 0 violations/0 incomplete; mobile guest settled axe 0 violations/0 incomplete (BROWSER.json). Desktop/English scan may mark color-contrast incomplete for offscreen content; computed stable colors verified, existing muted #657087 on white/lavender preserved. First transient scan saw opacity animation blending; harness now waits for finite animations to settle and rescans on width changes. Source control is not weakened. 320px scoped dialog/card/list scrollWidth equals clientWidth; inert fixture background long code is excluded. Motion remains finite and reduced-motion rules apply globally to ot descendants.

Gate: eight principles, target-platform fit, meaning, tone/brevity, accessibility/localization, displayed-data and in-context evidence PASSED for this scoped local UI change.
