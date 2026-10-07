# Product Content Review — tracking073 / final numbered stepper072
Surface: web Ask response, Account list/detail and profile navigation. Audience: VI customers checking their own purchases; shared timeline also EN in Ask. Web semantic links, ordered lists, aria-current/role=status; no Apple-only expression or HIG compliance claim. Verified against actual domain stage definitions and authenticated owner-only callable.

## Content inventory and meaning
- Account filter nav “Lọc đơn hàng”: “Tất cả”, “Chưa giao”, “Đã giao”, “Đã hủy”; URL links with active page. DELIVERED/COMPLETED delivered, CANCELLED cancelled, other known stages undelivered. Unknown only All; no made-up delivered status.
- Scope note “Bộ lọc áp dụng cho tối đa 50 đơn đã tải trong tài khoản.” Counts not added: existing unordered bounded query is not global account history.
- Filtered empty heading “Không có đơn trong nhóm này”, scope explanation “Bộ lọc áp dụng cho tối đa 50 đơn đã tải. Xem tất cả để đổi nhóm đơn.” and link “Xem tất cả đơn” reset filter. Existing no-orders/request and inaccessible-selected-order states preserved.
- Account tracking loading “Đang tải tiến trình đơn hàng…” and chunk loading “Đang mở tiến trình đơn hàng…”. Error “Chưa tải được tiến trình đơn hàng. Kiểm tra kết nối và thử lại.” + “Tải lại tiến trình” rereads same owned ID. No raw exceptions/account/provider data disclosure or fabricated success/ETA.
- Profile link “Quản lý và theo dõi đơn hàng” goes to actual /account only when signed in.
- Stepper numbers1..N decorative aria-hidden; labels outside circle, existing previous/current/upcoming text and aria-current remain. No changed business stage/hold/cancel/partial/history/read-time/ETA wording; static numbers not percent completion or per-step timestamp.

## State/data coverage
Loaded, loading, error and retry covered; offline/deadline/forbidden use safe error recovery; wrong/malformed DTO or stale version rejected. Auth UID/order/version/retry generations block stale publication, no public/disk cache. Side effects read only. Partial timeline/shipments and unknown ETA remain explicitly qualified. Dates locale-local, observedAt still not realtime. Delivery does not imply customer receipt confirmation, financial settlement or whole order from one parcel. No destructive/confirmation action added (N/A).

## Eight principles
| Principle | Result | In-context evidence |
|---|---|---|
| Purpose | PASSED | Actual owner detail rendered timeline, selected current step; filters make delivery group visible. |
| Agency | PASSED | Filter URL/reset and retry links/actions; no forced movement/animation/focus. |
| Responsibility | PASSED | Explicit max50 loaded scope, current unknown/manual/partial qualifications; provider data not simulated as live. |
| Familiarity | PASSED | Connected numbered circles, labels outside, familiar delivery groups; native web navigation. |
| Flexibility | PASSED | Actual client VI/EN195/390/768/1440, vertical narrow/horizontal wide without page overflow; semantic text beyond color. |
| Simplicity | PASSED | No step-card backgrounds/autoscroll/observer; small labels outside circle, shared renderer. |
| Craft | PASSED | Actual 390/1440 screenshots visually reviewed, client16 geometry, native account owned flow and empty filters. |
| Delight | PASSED | Calm clear progress with no animated fictional parcel; one timeline across Ask/account. |

## Verification / limits
Root actual native ACCOUNT073 own order filter/detail with shared timeline/unknown ETA/current step and empty delivered/cancelled groups PASS, fixture conservation cleanup PASSED; 1440x1000 Chromium (pre final purely cosmetic number/layout delta). Current client16 actual React fixture cases confirm final numbered horizontal/vertical geometry at four widths VI/EN, custom8/cancel1; root inspected /private/tmp/tracking073-stepper-1440.png and -390.png. Focused async helper8/filter4/domain7=19PASS; full717PASS after sandbox-only loopback issue rerun. Native account screenshot empty cancelled group inspected. Frontend build and scoped ESLint PASS.
Current native full authenticated Ask mixed flow, VoiceOver, keyboard zoom and full CRM unrelated surfaces NOT_RUN. Profile link in-context browser screenshot NOT_RUN; existing profile auth behavior unchanged and target route verified. No claim of live carrier data, provider ETA or whole-system release certification.
Product Language Gate: PASSED for shared numbered timeline and account filter/tracking scope with bounded evidence; profile link browser-specific evidence deferred. Overall production release remains BLOCKED/NOT_READY pending actual carrier onboarding/AppCheck and existing production gates.
