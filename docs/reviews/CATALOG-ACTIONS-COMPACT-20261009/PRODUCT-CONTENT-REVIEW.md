# Product content review — compact catalog actions

Decision: **PASSED for this three-file local catalog change**, within the checks below. No production or full screen-reader certification.

## Scope, facts and context

Vietnamese customers browse products and choose adding one item, reading details, or the existing purchase route. Web/React19 semantic native controls, SatsunicGo blue/white/navy style; no Apple-specific expression or HIG compliance claim. Source-backed facts: compact mode submits quantity1; detail default retains integer1–100; variants remain mandatory; unavailable products expose only details. Prices and purchase destinations remain unchanged. Reviewer/current evidence:2026-10-09, UI-RESULTS.json and SOURCE-MANIFEST.json.

## Inventory and states

| Surface/state | Content and effect | Evidence |
| --- | --- | --- |
| Catalog quantity | Removed “Số lượng” label/input only in compact mode; each add supplies1 | Actual catalog no spinbutton; cart1 readback |
| Detail quantity | Existing “Số lượng” control remains | Actual0 disables add,2 adds2 |
| Three actions | Existing “Thêm vào giỏ”, “Chi tiết”, “Chọn mua”; internal-link arrow removed | Actual three same-style44px targets, unchanged routes |
| Variant | Existing “Mẫu sản phẩm”, “Chọn mẫu” and canonical options | Disabled before choice; Trắng adds1 |
| Pending/disabled | Existing “Đang lưu…” and busy/pending/loading/account-cache/offline guards | Source unchanged guards; no invented completion |
| Success | Existing “Đã thêm vào giỏ.” and “Xem giỏ hàng” | Actual persistence/cart readback; status below action row |
| Error/recovery | Existing “Chưa thêm được. Mở giỏ để kiểm tra và thử lại.” | Same awaited boolean/recovery path; failure copy unchanged |
| Unavailable/empty/loading/stale | Existing catalog eligibility and messages preserved | Actual unavailable product only details; source contracts unchanged |
| Unauthorized/confirmation/destructive | No new permission, order submission, confirmation or destructive action | Existing authenticated cart path preserved; no payment invoked |

## Data semantics

Compact add means one item per activation, not replacing existing cart quantity. Verified list1 + detail2 =3 on one line, variant Trắng separate line1. Server remains price/variant/quantity authority. Currency VND and displayed prices unchanged. No new analytics, data collection, account/profile write or provider integration.

## Mandatory principles

| Principle | Status | Current in-context evidence |
| --- | --- | --- |
| Purpose | PASSED | Product actions form one compact row; number entry deferred to detail as requested |
| Agency | PASSED | All three destinations/actions retained; success recovery link remains; no automatic payment |
| Responsibility | PASSED | Actual cart quantity reflects add1; variant and unavailable guards retained; no hidden financial action |
| Familiarity | PASSED | Existing Vietnamese labels, native button/link/select roles and established palette |
| Flexibility | PASSED | Actual320/390/1280; keyboard sequence after success; native AX names/disabled states; rendered200percent action-font proxy wraps without overflow |
| Simplicity | PASSED | Quantity input and divider removed from catalog; same-style actions together |
| Craft | PASSED | Same44px targets; success row no displacement; DOM/Tab order matches visual action order; variant label stays navy |
| Delight | PASSED | Routine addition stays inline; feedback/recovery below actions without modal or navigation interruption |

## Platform, pattern and gate results

Target-platform fit, meaning/behavior, audience, natural tone, brevity, terminology, state coverage, privacy/data semantics, accessibility of changed native controls, text expansion and in-context verification: **PASSED within scoped evidence**. No Apple platform compliance claim. Native accessibility tree exposes labels/roles/disabled states/status text; pointer plus Tab/Enter paths were exercised. Actual spoken VoiceOver announcement and OS browser zoom are **NOT_RUN** and are not claimed: text expansion used the explicitly disclosed rendered CSS proxy12→24px, with exact restore. The change does not add a custom accessible widget or alter the existing live-region announcement contract. No full accessibility certification.

Source review covers unchanged offline/cache/loading/failed-mutation guards; no new offline/error behavior is claimed from browser execution. No new empty/data-format/localization contract. Exact current screenshots and results are in UI-RESULTS.json and screenshots/.

## Findings and limits

Fixed initial wrapping at320, feedback displacing the row, and feedback link interrupting Tab order. All rechecked against final composition. Existing CustomerA demo lacks users profile: unchanged product-review actor rejects its automatic review read and shows a toast. Guard remains intact; no fabricated profile. This environment issue is separate from the successful catalog/cart checks. No production deployment or full payment/CRM completion is implied.
