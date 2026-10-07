# SATSUNICGO-REQUEST-FORM-014 — Pending approval

Request: navbar Mua hộ opens the purchase request form directly; widen and polish the form, exposing necessary fields.

Repository intelligence: DEGRADED, bounded current source evidence. SiteChrome.tsx headerRequest already links directly to /request. App.tsx routes /request to RequestForm. RequestForm.tsx currently hides quantity/variant/condition in itemOptions details, and notes/store/budget/date/CSV in another details. public-ux.css caps quickRequestPage at 690px. ProductComposer is shared; avoid changing its behavior globally.

Plan:
- src/app/SiteChrome.tsx and src/app/App.tsx: verify existing direct /request navigation in browser; retain it if already correct. No intermediate modal or authentication redirect before input; existing sign-in-on-submit retained.
- src/features/requests/RequestForm.tsx: keep market selection at top. Each numbered product card shows a persistent product label, composer/attachments, quantity, variant and condition together. Replace collapsed item options with visible grid. Show optional store, budget (VND), desired date and notes in an explicit visible secondary section. Keep CSV as a secondary collapsed bulk-import affordance. Preserve actual field constraints and optionality, submission/auth flow, draft handoff, frozen state, retries and image handling.
- src/styles/public-ux.css: scope to quickRequestPage; width min(available,1120px), with roughly 2:1 product/optional-information columns on desktop, stacked below 850px. Product list left, optional details right, submit underneath product list. White cards, thin neutral borders, navy labels and royal-blue primary button. 24–32px desktop spacing, 18px mobile. Visible image-upload affordance and existing image constraints as concise helper text; no new upload API.
- ProductComposer.tsx only if a scoped optional presentation prop is necessary for persistent attachment label; retain current shared default and all upload limits. Prefer parent markup/CSS to avoid this edit.

Copy: heading `Bạn muốn mua gì?`; sections `Món hàng`, `Thông tin thêm` with `Không bắt buộc`; product field `Tên hoặc link sản phẩm`; attachment affordance `Thêm ảnh sản phẩm`; image hint `PNG, JPEG hoặc WebP · Tối đa 2 MB mỗi ảnh, 6 ảnh mỗi yêu cầu`; date retains `Cần nhân viên xác nhận.`. No new delivery promise or mandatory contact/address field.

Risk: low-to-medium UI form restructuring; preserve payload/schema and account isolation. No backend, auth policy, storage, database, dependencies or deployment changes. All existing input handlers and disabled/readonly rules preserved. Existing app WIP remains untouched outside approved delta.

Validation after approval: navbar click reaches rendered /request; anonymous input before login; visible fields and keyboard labels; multi-item add/remove; optional field payload and validation; upload/reading/error presentation; pending/retry frozen states; desktop1440/mobile390 no overflow; typecheck and focused existing request-input tests. Product language/profile and current final review required. Live sign-in/provider submission only if configured and authorized; distinguish local evidence.

Rollback: revert scoped form layout JSX/CSS changes only.

Other outstanding plans: footer012 and timeline013 remain pending; this request adds form014 and does not approve prior changes.
