# Product Content Review — approved tracking implementation

Surface: shared OrderTracking in Account detail and Ask; compact aggregate DeliveryEstimate. Audience: customer checking the current milestone, next stage, recorded activity and manual delivery window. VI/EN, responsive web. Reviewed 2026-10-09 using write-product-content; internal Human Interface principles reference applied as a human-centered quality reference, not Apple platform controls.

Verified source: domain trackingStages/trackingMilestones; index.ts transition cases; redacted customer-order-tracking owner projection; DeliveryEstimate validation/formatters; AccountTracking request generation. No new provider, GPS, location claim, financial transition or actual delivery promise.

## Content inventory
| Surface/state | Visible and accessible content | Job and source |
|---|---|---|
| Header/default | Theo dõi đơn hàng / Order tracking; order ID | Identifies the private projected order; ID escaped as text |
| Hero/default | Đơn hàng của bạn / Your order; domain trackingStageLabel; Theo các cập nhật đã ghi nhận của đơn hàng / Based on recorded order updates | Current state from stage, not parcel state |
| Route/present | Tuyến vận chuyển / Shipping route | Route metadata, never current position; hidden if unavailable |
| Timeline | Cập nhật gần nhất từng mốc / Latest activity per step; Các bước xử lý / Processing steps; domain milestone labels | Latest recorded milestone activity, not exact transition/financial proof |
| Timeline/current/next/held/passed | Hiện tại / Current; Tiếp theo / Next; Tạm dừng / On hold; visually hidden Đã qua bước này / Previous step | Current stage via aria-current; ordinal next only, no forecast percentage |
| Timeline/unknown | Chưa có cập nhật / No update yet; Chưa có thời điểm ghi nhận / Recorded time unavailable | Future and missing historical times remain unknown; observedAt never used as event time |
| Hold | Đang tạm giữ xử lý / Processing on hold | No private hold reason in projection; aggregate ETA suppressed |
| Read metadata | Đọc lúc / Read at; không cập nhật trực tiếp / not live; IANA device timezone | Snapshot freshness and timezone explicit, dd/mm/yyyy · HH:mm |
| ETA/current | Dự kiến nhận hàng / Estimated delivery; date range; year; Ước tính của nhân viên, có thể thay đổi / Staff estimate; dates may change | Validated manual staff aggregate; compact dates expand to exact instants |
| ETA/disclosure | Chi tiết thời gian / Time details | Native details, keyboard operable; retains exact start/end, timezone, oldest/latest recording times |
| ETA/missing/expired/failed/terminal | Existing DeliveryEstimate unknown, previous estimate and update-needed messages retained | Reuses parsers; no active aggregate on hold, incomplete or terminal order |
| History | Lịch sử cập nhật / Update history; Chưa có lịch sử cập nhật / No update history yet; latest 50 disclosure | Allowlisted event labels, newest first; event label dictionary unchanged; unknown action becomes generic update |
| Parcels | Kiện của đơn này / Parcels for this order; Chưa có thông tin kiện hàng / No parcel information yet | Actual parcels, no fake count or location |
| Parcel fields/states | Existing packed/in-transit/delivered/failed/returned labels; Mã kiện / Parcel ID; Đơn vị vận chuyển / Carrier; Mã vận đơn / Tracking number; Cập nhật / Updated | Text escaped; missing metadata omitted; one delivered parcel cannot complete order |
| Partial | Existing incomplete-parcel support and recent-history messages | Missing projection/history remains visible, no confirmed aggregate |
| Navigation | Mở đơn đang tra cứu / Open the tracked order | Only shown when current path differs; no self-link in Account detail |
| Removed | Entire next-step explanation strip and milestone inspection controls | No empty controls after removal; next stage remains clear in chart |

## State coverage
Default/current, empty history/parcels, delivered, cancelled, hold, partial, failed/returned parcels, catalog/custom/upfront, VI/EN: renderer tests and BROWSER-320.json, desktop/mobile screenshots. Loading, error/retry, logout/unmount/A-B-A/stale responses: existing AccountTracking UI unchanged; account-tracking-request073 tests. No destructive confirmation or new user permissions. Offline callable errors recover through existing retry.

## Data semantics and privacy
Latest action time for each milestone is not proof of payment or exact stage entrance. pack belongs to warehouse activity; finalize/approveFinal to remaining costs. Initial verifyTransfer is usable only before purchasing and with complete history; final payments cannot overwrite initial payment time. track activity reaches delivery only when whole-order stage is DELIVERED/COMPLETED. Route is not location. Manual ETA null/freshness/oldest/latest rules retained. Owner-only read, verified Google authentication and App Check unchanged. No private actor, address, financial ledger or hold reason added.

## Mandatory Human Interface principles
| Principle | Status | Current evidence |
|---|---|---|
| Purpose | PASSED | Hero/current milestone/ETA first; account-desktop.jpg |
| Agency | PASSED | Native ETA details opens and closes with Enter; no auto navigation, polling or empty timeline buttons |
| Responsibility | PASSED | Unknown timestamps, partial/hold disclosures, manual estimate qualifiers; 45 unit tests and 9 owner/backend tests |
| Familiarity | PASSED | Existing SatsunicGo terms and blue-white-navy tokens; native web details/time/link/ol semantics |
| Flexibility | PASSED | 22 VI/EN scenarios at320; account-mobile-320.jpg; container-responsive stacked flow |
| Simplicity | PASSED | Removed requested strip; timestamps on one line; no repeated passed-state paragraphs |
| Craft | PASSED | Account/Ask shared renderer, scoped typography, escaped data, 34/30px icons, explicit timezone and exact ETA details |
| Delight | PASSED | Finite quiet node ring and connector fade, no timers/dependency; reduced-motion media disables animation |

Platform fit: PASSED for responsive web. No copied artwork, Apple-only controls or trade dress. Browser native keyboard disclosure verified; screen-reader speech and OS reduced-motion emulation NOT_RUN, CSS fallback reviewed. No load/performance percentile or universal pixel equality claim. Source/current screenshots demonstrate matching approved composition with truthful dynamic data; device timezone differs from the synthetic UTC+7 mockup by design, preserving existing app behavior.

Gate: PASSED for scoped local implementation and product-language review. Production deployment and provider validation are outside the authorized implementation.
