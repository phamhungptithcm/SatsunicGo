# SECURITY078 Product Content Review

2026-10-06, Vietnamese web account-security status. Direct user delta: concise balanced idle/completed display. write-product-content applied with existing integrity/profile/eight-principle contract. Source inventory SECURITY-078-STRINGS.json; source Security.tsx/security.css. Platform: native web UI, established white/navy/blue account rail. Apple-platform HIG NOT_APPLICABLE; human-centered principles apply.

Verified behavior: overview and idle actions now one compact card. Loaded zero offers add/Google actions without redundant titles or explanatory text; unknown is loading/unavailable, never zero. Refreshed positive enrollment renders only heading+enabled badge; new-factor invitation and duplicate enrollment-success notice omitted. Badge role=status announces enabled truthfully. Existing QR/manual/copy/challenge/retry/cancel/provider refresh remains. No removal/role/cloud write or secret capture. Read-only designated-account metadata still mfaEnrolled=false: activation not certified by screenshot. Assumptions: enrollment presence is current SDK source; no device-study evidence.

## States and semantics

| State | Content/behavior and evidence |
| --- | --- |
| Zero | Xác thực hai bước / Chưa bật and compact actions |
| Enabled, one/multiple | Xác thực hai bước / Đã bật only; no repeated setup invitation |
| Loading/unknown | Đang kiểm tra / Chưa xác định; reload failure retains recovery action |
| Pending | Existing action labels/disabled/cancel remain |
| QR/manual/copy | Unchanged private local QR and visible manual row; explicit clipboard success/failure |
| Success | Enabled status, no duplicate enrollment-success prose |
| Error/offline/partial | Existing alert+recovery; never claim enabled from unconfirmed reload |
| Challenge | Existing factor validation and code-confirmation semantics retained |
| User change/cancel | Existing epoch/state cleanup retained |
| Unauthorized | Existing Google sign-in guidance; no setup |
| Destructive | NOT_APPLICABLE; no removal action |

Data: factor presence from successful user.reload then enrolledFactors.length; null unknown, zero confirmed empty. No inferred counts, currency/time/aggregation. No private material appears in fixture evidence. Removing add invitation after activation is scoped UI presentation; no backend permission change. Duplicate enrolled success is hidden only when confirmed positive.

| Principle | Result | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Completed display contains only required state |
| Agency | PASSED | Zero preserves add/reauth/cancel and setup choices |
| Responsibility | PASSED | Real state preserved; no false activation; prior QR/privacy controls |
| Familiarity | PASSED | Existing rail, labeled native controls and status badge |
| Flexibility | PASSED |390/768/1440, keyboard200percent, QR/manual/copy |
| Simplicity | PASSED | One overview; no repeated completed-state card/prose |
| Craft | PASSED | Loading/unknown/partial/retry/copy coverage, labels/focus/live state |
| Delight | PASSED | Compact balanced row, restrained spacing and palette |

Writing/action/feedback/privacy/account/platform patterns PASSED. Meaning, terminology, natural Vietnamese, concise copy, state coverage, privacy/data, keyboard/text scaling and in-context gates PASSED within synthetic checks. Full screen-reader/device/live-provider QA NOT_TESTED. Additional locales/RTL NOT_APPLICABLE to Vietnamese LTR delta. Screenshot enabled view390/1440 visually inspected; enabled overview under110px tall at all3widths. Current browser fixtures exercise real component; no production identity.

Decision Product Language Gate PASSED. No design owner decision pending. Production readiness/OWNER remains separate NOT_READY, not implied by screenshot/tests.
