# PUBLIC-UX-007 product content review
Scope: Vietnamese web, RequestForm/ProductComposer, shared chrome, products/detail, Membership. Home composition preserved. Reviewed 2026-10-04 against approved PUBLIC-UX-007 and current source. Web conventions apply; Apple-only expression not applicable.

## Evidence and semantics
Current local screenshots: public-ux007/request-mobile.png, product-detail-desktop.png, membership-desktop.png. Browser picker and clipboard image submits created local synthetic orders; private media ready verified for name/link/image. No live provider or commercial-data evidence. Products are owner-curated through featured/featuredOrder, ordered across published catalog; legacy unflagged records remain fallback. Origin is distinct from buying market/source. Prices retain reference status and timestamp; membership benefit is service-fee discount, never goods/tax discount. Images private per order; bytes stay in memory, not session storage.

## Changed content inventory
|Surface/state|Content and behavior|
|---|---|
|Request/default|Bạn muốn mua gì?; Tên, link hoặc ảnh sản phẩm…; accessible attachment/remove names; quantity, variant, condition and optional details|
|Request/action|Gửi yêu cầu → / Đăng nhập để gửi →; Đang gửi…; Thử gửi lại / Tiếp tục tải ảnh|
|Request/recovery|Yêu cầu đã lưu and uploaded count with order link; malformed pending data blocks submit and links account; image/file errors remain contextual|
|Products/default|Những món được chọn.; search, market filters, detail/request actions; published source data only|
|Products/detail|Nguồn gốc / Chức năng, công dụng / Cách dùng; source link, reference price/date, variants; absent fields omitted|
|Membership|Plan name/price/period, current plan, service fee benefits; policy and request/history disclosures preserve commands|
|Chrome|Brand mark/wordmark, Mua hộ, mobile navigation; footer attribution preserved from concurrent approved work|

## State coverage
Default/loading/empty/success: source and local browser evidence. Unauthorized: existing verified-Google/role guards unchanged, scoped emulator test denies customer saveContent. Error/recovery/offline/partial: SOURCE REVIEW ONLY for new composer; browser interrupted upload and auth handoff NOT_RUN. Destructive: image/remove and explicit draft replacement local controls; no irreversible operation added.

## Human interface principles
|Principle|Status|Evidence|
|---|---|---|
|Purpose|PASSED|Single heading and composer, local 390px screenshot|
|Agency|PASSED|Explicit send, attachment removal, product prefill replacement button; no auto order|
|Responsibility|NOT_RUN|Refresh and partial-image-upload rendered recovery incomplete|
|Familiarity|PASSED|Native textarea/file picker/paste; actual clipboard paste observed|
|Flexibility|NOT_RUN|Name/link/picker/paste observed; real file drag/drop not exercised|
|Simplicity|PASSED|No duplicate visible composer labels; advanced options collapsed|
|Craft|PASSED|320/390px document width matches viewport; 62px compact header observed after scroll|
|Delight|NOT_RUN|Smooth transition implemented with reduced-motion CSS; motion/runtime preference not exercised|

Decision: BLOCKED for successful completion. Remaining tests: real file drag/drop, interrupted/reloaded upload, anonymous auth/image handoff, reduced-motion and current selected-query browser refresh. Synthetic fixtures are not launch-ready product data. Screenshot membership state precedes final history disclosure; current screenshot refresh required. Content inventory is grouped by changed surface/state; complete exhaustive current rendered string/state evidence remains required.
