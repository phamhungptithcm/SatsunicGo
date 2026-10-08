# Product Content Review — PRODUCTS112

## Scope
Product workspace/sidebar/navbar, list toolbar and scroll-loading states. Audience: Vietnamese CRM staff managing products. Task: find/edit/add products and import/export the correct inventory scope. Target: web, locale vi-VN. React 19 / TypeScript 6; existing CRM blue/white system, native buttons/selects, semantic table and mobile row cards. Reviewer: implementing agent, 2026-10-07. Apple-platform contract not applicable; repository Human Interface principles used as a web quality reference, without Apple-only expression.

## Context and evidence
Source: ContentEditor.tsx, ProductSpreadsheet.tsx, CrmPresentation.tsx, Workspace.tsx, functions/src/workspace.ts, product-spreadsheet.ts. BROWSER-EVIDENCE.json: actual components with synthetic staff/inventory and backend writes blocked. Screenshots in output/playwright/products112: desktop 1440, tablet 768, mobile 390. Scoped source hashes in SOURCE-HASHES.json.
Assumption: product route remains /crm/content to preserve links; Blog Studio is the separate article destination. No product/post deletion, backend rename or changes to public blog.
Blocker: shared Vite optimized ExcelJS URL returns HTTP 504; real installed ExcelJS browser bundle used as a disclosed fixture dependency proxy for export/download. Live shared-runtime XLSX module loading is BLOCKED. No authenticated/provider/production evidence.

## Content inventory
| Location/state | Previous | Current | Job and behavior evidence |
| --- | --- | --- | --- |
| Sidebar/default | Sản phẩm & bài viết | Sản phẩm | Names fixed products-only route; separate Blog Studio retained. |
| List heading/selector | Dynamic Sản phẩm/Bài viết; Loại nội dung dropdown | Sản phẩm; selector removed | listWork and save payload always products. |
| Reload/action and disabled | Làm mới among page actions | Navbar reload icon; Tải lại sản phẩm accessible name / Tải lại tooltip | Existing CrmHeading reload contract; disabled during loading/save. |
| Create/action | Thêm sản phẩm/Thêm bài viết above toolbar | Thêm sản phẩm, plus icon, first spreadsheet action | Existing edit(null), no implied persistence. |
| Export/import | Xuất dữ liệu; Nhập Excel | Same labels with decorative download/upload icons | XLSX/CSV both retained; selected/filtered loaded/all inventory scopes unchanged. |
| Search/accessible name | Dynamic Tìm sản phẩm/Tìm bài viết | Tìm sản phẩm | Persistent visible loaded-list label retained. |
| List loading | Đang tải nội dung… | Đang tải sản phẩm… / Đang tải thêm sản phẩm… | Initial loading panel; append inline status preserves old rows. |
| List errors | Raw exception message | Không tải được sản phẩm. Thử lại để tiếp tục. / Không thể tải tiếp danh sách. Làm mới để tải lại. | Recoverable error retains cursor/rows; repeated or empty-page cursor stops, retry reloads initial page. |
| Empty/no match | Không có nội dung khớp bộ lọc. / Chưa có nội dung. Thêm mới hoặc nhập Excel để bắt đầu. | Không có sản phẩm khớp bộ lọc trong danh sách đã tải. / Chưa có sản phẩm. Thêm sản phẩm hoặc nhập Excel để bắt đầu. | Explicit loaded-only scope; does not claim all inventory absent when a filter hides loaded rows. |
| List footer | nội dung đã tải / Còn nội dung chưa tải / Tải thêm | sản phẩm đã tải / Còn sản phẩm chưa tải / Tải thêm or Thử lại | Counts loaded unique IDs only; no fabricated total. |
| Table/heading | Dynamic Sản phẩm/Bài viết and conditional price columns | Sản phẩm; product price columns always present | Product-only table; currency and missing-price distinctions retained. |
| Editor title/field/identity | Sửa nội dung / dynamic add title / dynamic Tên sản phẩm or Tiêu đề / Mã nội dung | Sửa sản phẩm / Thêm sản phẩm / Tên sản phẩm / Mã sản phẩm | Product form and ID meanings unchanged. |
| Editor confirmation/success/save | mở nội dung khác / Xuất bản nội dung này công khai trên website? / Đã lưu nội dung. / Lưu nội dung | mở sản phẩm khác / Xuất bản sản phẩm này công khai trên website? / Đã lưu sản phẩm. / Lưu sản phẩm | Dirty warning and publish confirmation retained; success follows workspaceCommand response. |
| SEO placeholder | Để trống dùng tên nội dung | Để trống dùng tên sản phẩm | Existing fallback semantics, no new promise. |

## State coverage
Default/action, loading/pending/disabled, empty/no-match, error/recovery and partial: PASSED in browser fixture. Offline read failure uses same recoverable message (network-offline transport separately NOT_RUN). Success and consequential editor confirmation: preserved source path, state unit tests; actual save/publish deliberately NOT_RUN because fixture blocks writes. Forbidden/authentication: server access control unchanged; synthetic browser does not prove real auth. Hover/focus: existing CSS retained, keyboard focus and manual Enter fallback checked. No deletion added.

## Data semantics
Filters/search apply only to loaded rows. Automatic append pauses during active filters to avoid eager full scan; manual load stays available. Footer reports visible/loaded counts, not total inventory. Refresh reconciles selected IDs to refreshed rows, appends deduplicate by ID. Undefined reference price remains Chưa có giá; undefined listed price remains Chưa niêm yết; VND uses vi-VN. Export all traverses inventory cursor separately; loaded filtered/selected export retains its existing scope. No new private logging or public cache.

## Mandatory Human Interface principles
| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Fixed product-only menu/heading; create action first in actual screenshots. |
| Agency | PASSED | Manual button/Enter fallback, retry and existing dirty-form cancel warning; filters don't cause eager full scan. |
| Responsibility | PASSED | Loaded-only wording and missing prices preserved; errors stop auto retries; actual success follows command. |
| Familiarity | PASSED | Existing CrmHeading reload slot, plus/download/upload icons with text, native web selects. |
| Flexibility | PASSED | 390/768/1440 layouts, wrapping actions, keyboard fallback and observer-unavailable check. |
| Simplicity | PASSED | Removes irrelevant post selector; one create/import/export row; inline append loading. |
| Craft | PASSED | Screenshot review found collapsed mobile export selectors; corrected to >=200px scope / >=70px format and reran tests. |
| Delight | PASSED | Scroll append reduces repetitive clicks; no decorative animation or fake progress; reduced motion preserved. |

## Platform fit and pattern checks
Web platform fit PASSED: semantic buttons/selects/table, labeled controls, live append status, decorative aria-hidden SVGs. No Apple-only control, asset or motion introduced. Existing brand retained; density 7/10, variance 2/10, motion 1/10. Labels/control/feedback/alerts/inclusion patterns PASSED within executed checks. New onboarding/permission flows NOT_APPLICABLE. Full screen-reader, RTL and automated axe audit NOT_RUN; Vietnamese and long titles/text expansion verified visually and with overflow checks, no claim of full accessibility certification.

## Gate results
Human principles, platform fit, behavior meaning, audience, natural tone, brevity, state coverage, loaded-data privacy, terminology, keyboard/ARIA names, Vietnamese long text, and in-context verification: PASSED for scoped local implementation. Live shared-runtime ExcelJS availability: BLOCKED, separately disclosed; dependency-proxy export is not promoted to live runtime proof.
Product Language Gate: PASSED (current rendered component proxy explicitly disclosed).
