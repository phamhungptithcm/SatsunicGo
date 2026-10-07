# Product Content Review — CART-107

Scope: cart, add-to-cart, navbar accessible name and checkout prefill/reconciliation. Vietnamese public web, existing white/blue SatsunicGo design. Reviewer: Codex, 2026-10-07. Apple platform compliance is not applicable; native web controls and repository web/visual/product-content profiles apply.

Verified facts: guest storage is browser-local; signed cart belongs to authenticated owner; merging requires a user action; listed price is a temporary total; authoritative catalog checkout rechecks product version and price. Creating an order does not collect money. Each product creates a separate full-upfront order using the existing payment flow. Assumption: existing approved catalog price semantics remain authoritative. Unknown: live payment provider and production behavior have not been tested.

Content inventory: [all source strings and locations](CONTENT-INVENTORY.md). Existing surrounding text is included to check terminology consistency. Every changed control, status and displayed field is covered below.

| State | Content and meaning | Evidence |
| --- | --- | --- |
| Default/action | Mẫu sản phẩm, Số lượng, Thêm vào giỏ, Xóa, Xem lại để đặt mua; explicit selection and bounded quantities | AddToCart/Cart and browser tests |
| Loading/pending/disabled | Đang tải giỏ hàng, Đang kiểm tra sản phẩm và giá, Đang lưu; unavailable navbar accessible name avoids false zero | cart-store/SiteChrome source; cart-retry.png |
| Empty | Giỏ hàng đang trống only when a readable empty cart exists; read error shows Chưa hiển thị được giỏ | cart-320.png; browser remove/sign-out checks |
| Success | Đã thêm vào giỏ; Giỏ đã lưu trong tài khoản follows confirmed server data | browser merge and cart test |
| Error/recovery | Kiểm tra lại lần cập nhật replays the same operation; checkout failure preserves exact order attempt | lost-response browser test; rules idempotency test |
| Offline/stale/partial | Prices explicitly unverified; checkout disabled until online and server confirmation; unknown totals are Chưa xác định | cart-offline.png; offline browser test |
| Unauthorized | verified Google and owner read enforced server-side; locked account cannot mutate | rules tests |
| Consequential choices | Gộp vào giỏ tài khoản is explicit; price changes require review; remove affects a cart selection, not an order | checkout-price-change.png; consume tests |

Data: badge counts summed item quantities, capped visually at 99+ with full accessible count; distinct variants remain distinct lines. VND shown as ₫ with Vietnamese formatting. Total is temporary, unavailable when any item lacks a valid price. Public previews are allowlisted, limited to 100 products; server fetch on navigation and after five minutes. Private cart state/listeners are reset at account changes. No global persistent Firestore caching is enabled.

| Mandatory principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Clear cart heading, quantity and temporary total; cart-1440.png |
| Agency | PASSED | Explicit variant, merge, removal and changed-price acknowledgement; browser tests |
| Responsibility | PASSED | Honest offline, unknown price and ambiguous retry states; cart-offline/cart-retry screenshots |
| Familiarity | PASSED | Existing navbar, cart icon, native select/input and existing per-product checkout |
| Flexibility | PASSED | Guest/account, second-tab sync, reload, narrow width and scaling browser tests |
| Simplicity | PASSED | One summary and per-product checkout action; separate orders stated in context |
| Craft | PASSED | 320/390/1440 layouts, long name and 200% scaling; no horizontal overflow |
| Delight | PASSED | Immediate quantity badge, unobtrusive status, retained offline choices; observed browser tests |

Platform fit: PASSED for web scope. Native buttons/links/selects/inputs, associated labels, explicit accessible icon name, role=status/alert, visible keyboard focus and 44px controls. Review action moves focus to the first checkout link. No Apple-only expression copied. No new animation; reduced-motion behavior retained. No new public SEO claims or metadata. Account merge asks for no new permissions. Destructive action is reversible selection removal; no financial deletion.

Gate dimensions: Human Interface principles, target-platform fit, meaning/behavior, audience/business context, natural respectful tone, concise wording, action/state coverage, semantics/privacy, scoped keyboard/label accessibility, Vietnamese text expansion, terminology and in-context verification: PASSED. RTL localization is not applicable to the current Vietnamese surface. Full assistive-technology/WCAG certification: NOT_TESTED and not claimed.

Evidence: cart-1440.png, cart-390.png, cart-320.png, cart-scaled.png, cart-offline.png, cart-retry.png and checkout-price-change.png; 7 Playwright scenarios on actual restored demo runtime. Keyboard and accessible locator checks passed. Real screen-reader session not available. No owner decision required for local scoped delivery.

Product Language Gate: PASSED. Fixed misleading zero/unavailable navbar semantics. Residual risks: production provider behavior and full screen-reader certification remain unverified.

## Clean copy delta — 2026-10-07
Current user authorization and plan: docs/plans/SATSUNICGO-CART-107-CLEAN.md. Supplied screenshot identified excessive default explanations. Current rendered cart-390.png inspected after cleanup; 7 browser scenarios rerun and PASSED (23.7 seconds), plus TypeScript and scoped ESLint PASSED.

Changed-string inventory:
- Removed MUA HỘ QUỐC TẾ eyebrow and Xem lại mẫu và số lượng trước khi đặt mua subtitle.
- Giỏ hàng của bạn → Giỏ hàng; Tóm tắt giỏ hàng → Tóm tắt.
- Removed routine guest/account storage confirmations and in-memory duplicate; actionable storage warning retained.
- Đang lưu giỏ → Đang lưu; unconfirmed server copy → Giỏ chưa được cập nhật. Kết nối để tải lại. Shown only while saving/unconfirmed.
- Removed default price/fees explanation; Tạm tính still marks estimate and existing checkout retains authoritative price confirmation.
- Removed default per-product payment paragraph; at review action, retained Chọn sản phẩm để tạo từng đơn riêng. No aggregate-payment promise.
- Removed duplicated tutorial at review; per-product link still explicitly names the purchase action.
- Removed default refresh button; product fetch failure retains actual recovery button and automatic refresh continues.

Current principle evidence: Purpose PASSED (heading, product, quantity and action); Agency PASSED (merge/remove/review unchanged); Responsibility PASSED (offline/error/price change and per-order meaning retained when consequential); Familiarity PASSED (native web controls unchanged); Flexibility PASSED (320/390/1440, scaling and keyboard scenarios); Simplicity PASSED (removed redundant prose); Craft PASSED (rendered 390 screenshot inspected, no overflow in browser suite); Delight PASSED (shorter reading path, preserved recovery).
Platform-fit, data semantics, tone, brevity, state coverage, scoped accessibility, Vietnamese expansion and current in-context evidence PASSED. Full screen-reader session remains NOT_TESTED. Product Language Gate PASSED for delta.
