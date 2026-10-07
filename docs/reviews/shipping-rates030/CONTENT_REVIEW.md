# Product Content Review — Implementation SHIPPING-RATES-030

## Scope
- Surface/component: public shipping calculator and private support dialog in ShippingRates.tsx; owner editor preserved.
- Design: approved mockup revision 2. Audience: Vietnamese customers estimating freight and requesting confirmation.
- Locale/platform: Vietnamese web, native HTML form/select/details/dialog. No Apple-platform or HIG-compliance claim.
- Reviewer: Codex, 2026-10-06. Source bound by IMPLEMENTATION_SOURCE_MANIFEST.json.

## Context and evidence
Verified: common domain calculator preserves exact VN marks, US minimum 1 kg, Oregon confirmation, USD cents/VND integers; no FX, tax or total payment inference. Support uses existing workspaceCommand openTicket subject/message contract, owner-private supportTickets, Google-verified backend guards and idempotency. Public flow does not require sign-in until request submission.
Assumptions: 2 kg default is design convenience; request description optional because route/kg/source context is already populated.
Unknowns: commercial tariff freshness unverified; deployed callable missing. No price-source or delivery guarantee invented.

## Content inventory
| Location | State | Content / data | Job / evidence |
| --- | --- | --- | --- |
| Public heading | Default | Cước vận chuyển | Single task; desktop/mobile images |
| Direction/presets | Selected | Việt Nam → Mỹ; Mỹ → Việt Nam; 1/2/5/10 kg | Native buttons aria-pressed, motion timing verified |
| Inputs | Default/disabled | Dịch vụ; Thông thường; Nhanh; Hàng theo kg; Kho gửi; Texas / California; Oregon; Nhóm hàng; Chọn nhóm hàng; Khối lượng tính cước; kg | Single-choice fields hidden; groups from safe config; accessible weight name includes kg |
| Help | Expanded | Cách tính khối lượng; published /5000 formula and staff confirmation | Progressive disclosure, source conditions |
| Result | Default/loading/unavailable/invalid/quote | Cước tham khảo; Đang tải…; Chưa có cước; Kiểm tra khối lượng; Cần xác nhận cước | Stable polite live region, unavailable distinct from zero |
| Result hints | Invalid/missing/ambiguous | Nhập từ 0,001 đến 1.000.000 kg.; Chọn nhóm hàng để xem cước.; Kho Oregon cần xác nhận phụ thu.; Lựa chọn này cần báo giá riêng. | Calculator/schema and browser fixture |
| Cost meaning | Default | Chưa gồm thuế, thông quan, phụ thu và bảo hiểm. Tổng phí được xác nhận trước khi gửi. | Freight-only semantics; no payment or arrival promise |
| Table | Collapsed/expanded | Bảng giá chi tiết; Khối lượng / nhóm hàng; Cước; Thông quan / điều kiện; route/source labels; Bảng tham khảo/Bảng đã công bố; Chưa có giá cho lựa chọn này. | Shared published/reference origin; highlight and table row scopes |
| Conditions | Expanded | Điều kiện vận chuyển; current config conditions; Nguồn VietCargo + route | All original conditions retained, external links qualified |
| Load recovery | Error/empty | Chưa tải được bảng giá. Thử lại.; Bảng giá cần được kiểm tra. Nhờ xác nhận cước.; Tải lại; Chưa có bảng giá. Nhờ xác nhận cước theo kiện hàng. | Does not expose raw exceptions; no client fallback |
| Support dialog | Default | Nhờ xác nhận cước; shipment summary with kg/group/source/freight-only context; Mô tả hàng (không bắt buộc); Loại hàng, kích thước kiện…; Đóng | Captures current selections only when no pending immutable request |
| Support auth/send | Disabled/pending/error | Chưa thể gửi yêu cầu lúc này.; Đăng nhập để gửi và xem phản hồi riêng.; Đăng nhập để gửi; Đang đăng nhập…; Chưa đăng nhập được. Thử lại.; Gửi yêu cầu; Đang gửi… | Existing configured/auth/backend contract; no order/payment |
| Support retry/success | Error/success | Chưa nhận được kết quả. Thử lại cùng yêu cầu.; Thử gửi lại; Chưa gửi được yêu cầu. Kiểm tra tài khoản và thử lại.; Đã gửi yêu cầu.; Xem phản hồi | Success after callable resolves; uncertain payload locked and same key replay; UID fencing |

All modified user-facing literals and dynamic source labels are in the scoped component; staff mutation strings unchanged. Public loading status is within stable live container. Dynamic table source content is validated before display.

## State coverage
Default/selected/hover/focus: native controls, focus outline, explicit aria-pressed.
Loading/disabled: shell and inputs retained; loading amount, busy request button.
Empty/unpublished: distinct unavailable text, no tariff fallback.
Error/recovery/offline: safe load error and retry, retains selections. Offline uses same connection failure state rather than guessing stale prices.
Stale/partial/reference: source origin labelled; missing/ambiguous rows require quote.
Success: request success only after accepted callable response, link to existing support page.
Unauthorized: sign-in only at send; server retains Google verification/account restrictions. Cross-account pending/results cleared.
Confirmation/destructive: NOT_APPLICABLE; no destructive action or financial commitment.

## Data semantics
- Freight estimate only, not total payment; VND integer/USD cents; decimal kg → integral grams with binary noise tolerance, not tariff interpolation.
- Invalid kg differs from quote-required, unavailable, and true numeric freight.
- Public origin remains reference/published/unavailable. Explicitly disabled/invalid/failed server read never resurrects reference on client.
- User-entered description is sent only on explicit submit to existing private support contract; no logs/PII/credentials printed. Source reference freshness unverified.

## Mandatory Human Interface principles
| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Single route/kg/cost task; actual /fees screenshots |
| Agency | PASSED | Route/preset edits, retry, details, native dialog Escape/focus restore; explicit submit |
| Responsibility | PASSED | Freight exclusions and no total/arrival promise; uncertain result wording and immutable retry |
| Familiarity | PASSED | Native web inputs/selects/buttons/dialog/details; browser accessibility snapshot |
| Flexibility | PASSED | 320/390px and 200% zoom, unit accessible name, keyboard/native focus, reduced motion checks |
| Simplicity | PASSED | Removed hero and state-tool noise; no single-choice fields; conditions collapsed |
| Craft | PASSED | Three-decimal kg acceptance, stable live region, safe errors, account-switch and replay checks |
| Delight | PASSED | Quick presets and retained weight; 180ms result/240ms tab motion; no interaction delay |

## Platform fit and pattern checks
Web native conventions PASSED, no Apple-only expression/assets. Writing/controls, feedback levels, optional contextual help, privacy/account boundary and Vietnamese terminology PASSED against source and actual accessible browser snapshot. Native dialog keeps focus and restores trigger; reduced motion explicitly removes decorative animation. No gesture-only interaction. Destructive/RTL/English translation NOT_APPLICABLE for this scoped existing Vietnamese surface. Physical screen-reader speech and device verification NOT_TESTED; no claim of full manual assistive-technology certification.

## Gate results
Human principles, platform fit, business meaning, audience context, natural tone, brevity, states, data/privacy, browser accessibility semantics, Vietnamese formatting/long row wrapping, terminology and current in-context verification: PASSED within executed scope.

## Verification
43 unit tests; 47 emulator tests; 30 component checks; 16 actual app-route checks (mocked public callable); mobile/table/desktop/200% zoom images. Key response tests use synthetic identities and do not prove real provider ticket delivery. Initial screenshot captured header transition frame; final mobile recaptured after navigation animation settled. Google/FedCM issues in shared app are outside scoped shipping change.

## Decision
Product Language Gate PASSED for scoped local implementation. Online production remains NOT_READY: absent callable/deployment outside approved plan. Physical screen-reader speech and commercial freshness remain explicit residual limitations.
