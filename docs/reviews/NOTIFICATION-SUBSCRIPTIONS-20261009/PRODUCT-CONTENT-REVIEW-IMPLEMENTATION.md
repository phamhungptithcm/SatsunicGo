# Product Content Review — implementation

Scope: actual PurchaseCheckout/Profile components, notification controls, callable errors, confirmation/welcome templates. Vietnamese web commerce. Approved r5; user removed two checkout helper lines. Target: existing project typography, blue/navy/white, small native checkboxes; no Apple platform/compliance claim.

Observed: labels are 12px/400, checkout checkboxes 13px, profile switches 30×18px with associated labels. Two default checkout lines only. No preselection from historical legacy consent. Availability and confirmed consent are separate. Current source, unit tests, real Firestore transaction test and interactive component fixtures support the wording. SMS provider does not exist; sending stays unavailable.

Assumption: Vietnamese mobile numbers only, matching current VN checkout. SMS preparation uses link confirmation, not a Firebase Auth OTP. Unknown: selected SMS provider, external delivery, production retention/export/deletion wiring. These are explicitly not represented as active or complete.

Inventory: CONTENT-INVENTORY-IMPLEMENTATION.json lists source-located UI, error and template strings. Profile replaces the historical marketing checkbox with “Quản lý thông báo →”; its personal save preserves the loaded consent. Checkout labels remain the exact approved two lines. Public token screen uses explicit confirmation/revocation verbs. Success means saved preference or confirmed token, never provider delivery.

| State | Coverage / evidence |
| --- | --- |
| Default/action | Actual checkout/profile fixture; two unchecked consent boxes; three independently labeled profile switches |
| Loading/pending/disabled | Hook loads read-only state; controls blocked during save/unknown result; save disabled when unchanged; state pending until token confirms |
| Empty/off/unavailable | Explicit “Đã tắt” vs “Chưa sẵn sàng”; missing preference record defaults off; no zero/unknown conflation |
| Success | Actual client hook with in-memory callable fixture shows “Đã lưu tùy chọn thông báo.”; Firestore service test verifies durable writes independently |
| Error/recovery | Missing SMS number tested in browser; no success shown; editable field, reload/retry; version conflict, quotas, stale-token and replay paths covered in unit tests |
| Offline/stale/partial | Network outcome uncertain retains operation ID and disables editing until retry; no payment rollback; provider unknown requires reconciliation |
| Unauthorized/forbidden | Endpoint tests reject unauthenticated/non-Google/current-disabled users and caller-selected owner IDs; production App Check retained |
| Confirmation/revocation | Token owns only scoped consent, not an account/order session; explicit action button; expiry and generation tests |

Data semantics: server preference record is authoritative; requested/pending/confirmed are distinct. Separate user-owned SMS phone, Vietnamese E.164 normalization, no implicit delivery-recipient subscription. No price, ETA or delivery guarantee was added. No token/contact information in logs; token URL fragment cleared by component effect. Preview banner explicitly states it does not save to accounts or send messages.

| Principle | Status | In-context evidence |
| --- | --- | --- |
| Purpose | PASSED | Optional checkout choices stay below recipient fields; order/payment remains primary |
| Agency | PASSED | Unchecked defaults, independent profile switches, explicit save and opt-out; no stale-link reactivation |
| Responsibility | PASSED | Availability never implies sending; own subscriber number; provider/release holds preserved |
| Familiarity | PASSED | Existing profile stepper/card/AccountRail and native checkboxes, ordinary Vietnamese labels |
| Flexibility | PASSED | Pointer and Space interactions checked; 1280px and 390px layouts; no horizontal overflow at 390px; narrow text wraps |
| Simplicity | PASSED | Exactly two default checkout labels; removed user-selected helper lines stay removed |
| Craft | PASSED | Associated labels, native controls, focus outlines, live status/alert; controls and backend state agree |
| Delight | PASSED | Retains entered choices on validation failure; optional save does not interrupt transaction integrity or invent delivery success |

Platform fit: PASSED for established web product patterns. No motion added; reduced-motion regression not applicable. Screen reader labels inspected in DOM accessibility tree; a real assistive-technology session was NOT_RUN. Non-Vietnamese/RTL and handset SMS delivery are outside current locale/provider scope.

Pattern checks: labels/controls, feedback/interruption, consequential actions, privacy, accessible localization and contextual help reviewed against bundled write-product-content references. Meaning, audience, tone, brevity, state coverage, data semantics, terminology and in-context verification PASSED for local preparation. No current Apple-platform HIG conformance is asserted.

Evidence: implementation-{checkout,profile}-{desktop,mobile}.jpg; browser real component and actual preference hook with Firebase/provider I/O replaced; read-only DOM verified 390px scrollWidth == viewport width. Browser exercised SMS missing-number error, normalized number save, independent SMS opt-out, native Space toggles, third profile tab and unchanged-save disabled state. Backend service/emulator and endpoint checks are separate evidence; the fixture does not prove deployed callables or external messaging.

Decision: Product Language Gate PASSED for approved local preparation. Residual risks: external provider/configuration and end-to-end authenticated runtime acceptance remain explicitly deferred.
