# Product Content Review — tracking hardening

Reviewer: root agent, 2026-10-09; scoped self-review. Web React Account/Ask shared OrderTracking; Vietnamese/English customers checking current stage and recorded times. No new strings, layout or motion. Changed displayed-data semantics only. Apple HIG is a human-centered reference, not an Apple platform contract; native web details/summary and existing SatsunicGo design retained. Contract: repository product-content policy, profile and skill references.

## Context and inventory

| Surface/state | Content retained | Meaning change / evidence |
|---|---|---|
| Initial payment / imported history | Chưa có thời điểm ghi nhận / Recorded time unavailable | Downstream events cannot classify ambiguous transfer as initial payment; three red→green view regressions |
| Parcel activity / success | Cập nhật / Updated + localized timestamp | Timestamp is server-recorded shipping mutation activity (pack/dispatch/ETA/scan), not inferred GPS/carrier scan; hardening real transaction suite |
| Malformed future parcel / partial | Thông tin kiện chưa đầy đủ / Parcel information is incomplete | Server omits invalid projection; aggregate suppressed; tracking027 regression |
| Client invalid response / error retry | Existing Account error/retry message | Client rejects timestamp beyond snapshot observedAt; request073 regression |

Verified: no new location or carrier promise; timestamps use device IANA timezone, dates+times and exact disclosure. Legacy absent times remain unavailable; no backfill. Snapshot observedAt is read time, separate from parcel activity. ETA remains manual staff estimate, range and uncertainty retained. Partial registry and failed parcel suppress aggregate. Owner auth/redaction preserved. No business terminology invented. Unknown: real carrier location/ETA accuracy is not available from this manual data flow.

## State coverage

Default/success: current timestamp shown, shipping transaction and browser transit. Empty/unknown: unavailable time, browser unknown. Partial/stale: disclose missing parcel/history; browser partial and aggregation tests. Error/offline/recovery: request rejection/retry tests, unchanged rendered controls. Unauthorized: callable and real rules denial without existence disclosure. Loading/pending/disabled: unchanged request generation. Confirmation/destructive: NOT_APPLICABLE, no new action.

## Mandatory principles

| Principle | Status | Evidence |
|---|---|---|
| Purpose | PASSED | Event-backed times help locate actual order stage, not guess payment dates |
| Agency | PASSED | Enter opens native time disclosure; existing retry/own-order links retained |
| Responsibility | PASSED | Future dates denied, partial disclosed; ETA uncertainty and no live-data claim |
| Familiarity | PASSED | Existing VI/EN domain labels, native web details and local timezone |
| Flexibility | PASSED | 22 VI/EN narrow scenarios; keyboard disclosure and accessible current step |
| Simplicity | PASSED | No added visual blocks or dialogs; unknown uses existing compact fallback |
| Craft | PASSED | Exact time disclosure, dates/times, one current step, no overflow at320 |
| Delight | PASSED | Approved compact presentation and motion retained without extra animation cost |

## Platform, patterns and gate

Target platform/terminology/meaning/data privacy/tone/brevity/state coverage/localization/in-context checks: PASSED within changed timestamp semantics. Native summary keyboard activation and AX expanded feedback verified; screenshots and BROWSER.json current rendered component proxy. Controls/layout/motion unchanged. No alerts, permission requests, onboarding, destructive actions or Apple-only expression introduced (NOT_APPLICABLE). RTL, screen reader speech and actual OS reduced-motion toggle NOT_RUN; no new control or motion in this delta, prior evidence not promoted to fresh certification. Error/recovery wire outage is simulated at request boundary, not full browser network test.

Evidence: GREEN-UNIT.log, GREEN-BACKEND.log, BROWSER.json, mobile-partial.jpg, desktop-detail.jpg. Result: PASSED for scoped timestamp changes; full platform accessibility certification remains outside this local check.
