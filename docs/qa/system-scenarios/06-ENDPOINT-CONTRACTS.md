# ENDPOINT-CONTRACT — 63 scenarios

Mọi case hiện NOT_RUN. Expected là test oracle để kiểm chứng, không là kết luận implementation đã đúng. Áp dụng [README](README.md) về fixture/reset/invariants và evidence. Mỗi variant cần result con riêng.

## ASKFLOW — Ask workflow, draft và commerce handoff

### SG-API-001 — askWorkflow — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer A/B
- Điều kiện/fixture: Ask conversation versioned; custom/catalog draft; recipient; accepted quote.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của askWorkflow tại functions/src/ai/ask-workflow.ts:46; tạo fixture tối thiểu theo nhóm ASKFLOW.
2. Invoke askWorkflow với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-002 — currentAskConversation — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer A/B
- Điều kiện/fixture: Ask conversation versioned; custom/catalog draft; recipient; accepted quote.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của currentAskConversation tại functions/src/ai/ask-workflow.ts:370; tạo fixture tối thiểu theo nhóm ASKFLOW.
2. Invoke currentAskConversation với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## ASK — Ask AI, retrieval, quota và ngôn ngữ

### SG-API-003 — ask — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: guest/customer theo từng read path, fake AI adapter
- Điều kiện/fixture: Published/draft knowledge; vi/en prompts; fake generation; AI paid gate đóng.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Mở source functions/src/ai/ask.ts:52 và gate capability của ask; chuẩn bị fixture đúng schema.
2. Invoke ask trong local harness với gate đóng; ghi số lần network attempts.
3. Thử settings/client flag bật capability; so sánh trước/sau.

**Mong đợi:** Gate code-owned chặn provider/spend; maintenance chỉ được chạy non-provider ở exact canonical demo. Không báo gửi/thanh toán/AI thành công từ fixture. Live provider branch BLOCKED, cần approval/candidate riêng.

**Đối chiếu source:** [functions/src/ai/ask.ts](../../../functions/src/ai/ask.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## COMMENT — Blog comments, replies và moderation

### SG-API-004 — blogCommentSubmit — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer A/B, editorial moderator, guest public read
- Điều kiện/fixture: Published/unpublished parent posts; top-level/replies/deleted comments; report fixtures.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của blogCommentSubmit tại functions/src/blog-comments.ts:115; tạo fixture tối thiểu theo nhóm COMMENT.
2. Invoke blogCommentSubmit với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-005 — blogCommentList — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer A/B, editorial moderator, guest public read
- Điều kiện/fixture: Published/unpublished parent posts; top-level/replies/deleted comments; report fixtures.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của blogCommentList tại functions/src/blog-comments.ts:249; tạo fixture tối thiểu theo nhóm COMMENT.
2. Invoke blogCommentList với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-006 — blogCommentCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer A/B, editorial moderator, guest public read
- Điều kiện/fixture: Published/unpublished parent posts; top-level/replies/deleted comments; report fixtures.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của blogCommentCommand tại functions/src/blog-comments.ts:375; tạo fixture tối thiểu theo nhóm COMMENT.
2. Invoke blogCommentCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-007 — blogCommentReport — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer A/B, editorial moderator, guest public read
- Điều kiện/fixture: Published/unpublished parent posts; top-level/replies/deleted comments; report fixtures.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của blogCommentReport tại functions/src/blog-comments.ts:443; tạo fixture tối thiểu theo nhóm COMMENT.
2. Invoke blogCommentReport với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## STUDIOADV — Studio taxonomy, members, reports và export

### SG-API-008 — studioAdvancedRead — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: Editorial manager/publisher/writer theo source
- Điều kiện/fixture: Members active/revoked; taxonomy accents/case duplicates; reports open/resolved; paginated posts.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của studioAdvancedRead tại functions/src/blog-studio-advanced.ts:386; tạo fixture tối thiểu theo nhóm STUDIOADV.
2. Invoke studioAdvancedRead với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/blog-studio-advanced.ts](../../../functions/src/blog-studio-advanced.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-009 — studioAdvancedCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: Editorial manager/publisher/writer theo source
- Điều kiện/fixture: Members active/revoked; taxonomy accents/case duplicates; reports open/resolved; paginated posts.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của studioAdvancedCommand tại functions/src/blog-studio-advanced.ts:739; tạo fixture tối thiểu theo nhóm STUDIOADV.
2. Invoke studioAdvancedCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/blog-studio-advanced.ts](../../../functions/src/blog-studio-advanced.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## STUDIO — Blog Studio editor và xuất bản

### SG-API-010 — studioCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của studioCommand tại functions/src/blog-studio.ts:487; tạo fixture tối thiểu theo nhóm STUDIO.
2. Invoke studioCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-011 — studioRead — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của studioRead tại functions/src/blog-studio.ts:499; tạo fixture tối thiểu theo nhóm STUDIO.
2. Invoke studioRead với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-012 — studioMediaUpload — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của studioMediaUpload tại functions/src/blog-studio.ts:778; tạo fixture tối thiểu theo nhóm STUDIO.
2. Invoke studioMediaUpload với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-013 — studioMediaRead — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của studioMediaRead tại functions/src/blog-studio.ts:907; tạo fixture tối thiểu theo nhóm STUDIO.
2. Invoke studioMediaRead với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## BANNER — Website banners, preview và publish

### SG-API-014 — websiteBannerCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, CONTENT_EDITOR theo handler, guest
- Điều kiện/fixture: Banner draft/published, schedule windows; desktop/mobile asset fixtures.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của websiteBannerCommand tại functions/src/campaign-banners.ts:67; tạo fixture tối thiểu theo nhóm BANNER.
2. Invoke websiteBannerCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/campaign-banners.ts](../../../functions/src/campaign-banners.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-015 — websiteBannerAdmin — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, CONTENT_EDITOR theo handler, guest
- Điều kiện/fixture: Banner draft/published, schedule windows; desktop/mobile asset fixtures.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của websiteBannerAdmin tại functions/src/campaign-banners.ts:257; tạo fixture tối thiểu theo nhóm BANNER.
2. Invoke websiteBannerAdmin với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/campaign-banners.ts](../../../functions/src/campaign-banners.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-016 — campaignBannersPublic — onRequest contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, CONTENT_EDITOR theo handler, guest
- Điều kiện/fixture: Banner draft/published, schedule windows; desktop/mobile asset fixtures.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Tạo fixture Banner draft/published, schedule windows; desktop/mobile asset fixtures. cho HTTP handler campaignBannersPublic.
2. Gửi request method/path/query hợp lệ lấy từ handler; đối chiếu status/content-type/body/caching.
3. Thử thiếu/sai input và parent bị unpublish/revoke nếu có parent; kiểm tra không lộ dữ liệu.

**Mong đợi:** HTTP response và publication/share/media authority đúng source; input lỗi không leak nội dung. Không áp Google/AppCheck cho public HTTP nếu source không yêu cầu. Chứng minh bằng body/status và dữ liệu, không chỉ HTTP200.

**Đối chiếu source:** [functions/src/campaign-banners.ts](../../../functions/src/campaign-banners.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-017 — websiteBannerPreview — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, CONTENT_EDITOR theo handler, guest
- Điều kiện/fixture: Banner draft/published, schedule windows; desktop/mobile asset fixtures.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của websiteBannerPreview tại functions/src/campaign-banners.ts:441; tạo fixture tối thiểu theo nhóm BANNER.
2. Invoke websiteBannerPreview với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/campaign-banners.ts](../../../functions/src/campaign-banners.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## CAT — Catalog, tìm kiếm và checkout

### SG-API-018 — catalogCheckout — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, CONTENT_EDITOR
- Điều kiện/fixture: P1 published/orderable version=1 price=100001 VND options=[S,M]; P2 draft; A/B.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của catalogCheckout tại functions/src/catalog-checkout.ts:15; tạo fixture tối thiểu theo nhóm CAT.
2. Invoke catalogCheckout với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## CHANGE — Đổi hàng, hủy một phần và customer consent

### SG-API-019 — changeCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order hai dòng, line0 đã mua=2, line1 chưa mua=3; versions cố định.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của changeCommand tại functions/src/changes.ts:12; tạo fixture tối thiểu theo nhóm CHANGE.
2. Invoke changeCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/changes.ts](../../../functions/src/changes.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## BATCH — Gom kiện và phân bổ cước

### SG-API-020 — consolidationCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, OPERATIONS_MANAGER, WAREHOUSE
- Điều kiện/fixture: Batch 3 parcels, weights=[1,1,1], freight=100001; owners A/B; hold fixture.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của consolidationCommand tại functions/src/consolidation.ts:16; tạo fixture tối thiểu theo nhóm BATCH.
2. Invoke consolidationCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/consolidation.ts](../../../functions/src/consolidation.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## CRM — Khách hàng, notes và follow-up

### SG-API-021 — listCustomers — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của listCustomers tại functions/src/crm.ts:42; tạo fixture tối thiểu theo nhóm CRM.
2. Invoke listCustomers với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-022 — listFollowUps — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của listFollowUps tại functions/src/crm.ts:111; tạo fixture tối thiểu theo nhóm CRM.
2. Invoke listFollowUps với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-023 — listCrmStaff — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của listCrmStaff tại functions/src/crm.ts:162; tạo fixture tối thiểu theo nhóm CRM.
2. Invoke listCrmStaff với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-024 — readCustomer — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của readCustomer tại functions/src/crm.ts:221; tạo fixture tối thiểu theo nhóm CRM.
2. Invoke readCustomer với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-025 — saveCustomerNotes — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của saveCustomerNotes tại functions/src/crm.ts:333; tạo fixture tối thiểu theo nhóm CRM.
2. Invoke saveCustomerNotes với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-026 — operationalDashboard — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của operationalDashboard tại functions/src/crm.ts:415; tạo fixture tối thiểu theo nhóm CRM.
2. Invoke operationalDashboard với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## SHIP — Kiện, tracking và ngày giao

### SG-API-027 — customerOrderTracking — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: WAREHOUSE, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order lines=[2,3] đủ mua/nhận; parcel P1/P2; timeline synthetic.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của customerOrderTracking tại functions/src/customer-order-tracking.ts:66; tạo fixture tối thiểu theo nhóm SHIP.
2. Invoke customerOrderTracking với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/customer-order-tracking.ts](../../../functions/src/customer-order-tracking.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## EMAIL — Outbox, retry và unknown delivery

### SG-API-028 — deliverEmail — onSchedule contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, FINANCE, scheduled worker
- Điều kiện/fixture: Synthetic outbox jobs pending/leased/sent/unknown/dead; fake mail adapter; email gate đóng.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Mở source functions/src/email.ts:10 và gate capability của deliverEmail; chuẩn bị fixture đúng schema.
2. Invoke deliverEmail trong local harness với gate đóng; ghi số lần network attempts.
3. Thử settings/client flag bật capability; so sánh trước/sau.

**Mong đợi:** Gate code-owned chặn provider/spend; maintenance chỉ được chạy non-provider ở exact canonical demo. Không báo gửi/thanh toán/AI thành công từ fixture. Live provider branch BLOCKED, cần approval/candidate riêng.

**Đối chiếu source:** [functions/src/email.ts](../../../functions/src/email.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## FIN — Đối soát, reversal và exceptions

### SG-API-029 — financeReview — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: FINANCE, OWNER
- Điều kiện/fixture: Pending transfer reviews; bank IDs synthetic unique; ledger before/after; MFA fixture.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của financeReview tại functions/src/finance-review.ts:11; tạo fixture tối thiểu theo nhóm FIN.
2. Invoke financeReview với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/finance-review.ts](../../../functions/src/finance-review.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## REQ — Yêu cầu custom và dữ liệu đầu vào

### SG-API-030 — command — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer
- Điều kiện/fixture: Custom request A, markets US/JP/KR; items 1–30; hai dòng quantity=[2,3].; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của command tại functions/src/index.ts:45; tạo fixture tối thiểu theo nhóm REQ.
2. Invoke command với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## DOC — Hóa đơn, chứng từ và chia sẻ

### SG-API-031 — invoiceShare — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của invoiceShare tại functions/src/invoice-share.ts:9; tạo fixture tối thiểu theo nhóm DOC.
2. Invoke invoiceShare với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-032 — invoiceCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của invoiceCommand tại functions/src/invoices.ts:44; tạo fixture tối thiểu theo nhóm DOC.
2. Invoke invoiceCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/invoices.ts](../../../functions/src/invoices.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-033 — invoiceList — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của invoiceList tại functions/src/invoices.ts:292; tạo fixture tối thiểu theo nhóm DOC.
2. Invoke invoiceList với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/invoices.ts](../../../functions/src/invoices.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-034 — invoiceDetail — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của invoiceDetail tại functions/src/invoices.ts:338; tạo fixture tối thiểu theo nhóm DOC.
2. Invoke invoiceDetail với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/invoices.ts](../../../functions/src/invoices.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## REM — Reminder, notifications và scheduled maintenance

### SG-API-035 — maintenance — onSchedule contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, OWNER, worker
- Điều kiện/fixture: A/B notifications; reminder policies active/inactive; canonical demo-satsunicgo clock fixture.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Mở source functions/src/jobs.ts:7 và gate capability của maintenance; chuẩn bị fixture đúng schema.
2. Invoke maintenance trong local harness với gate đóng; ghi số lần network attempts.
3. Thử settings/client flag bật capability; so sánh trước/sau.

**Mong đợi:** Gate code-owned chặn provider/spend; maintenance chỉ được chạy non-provider ở exact canonical demo. Không báo gửi/thanh toán/AI thành công từ fixture. Live provider branch BLOCKED, cần approval/candidate riêng.

**Đối chiếu source:** [functions/src/jobs.ts](../../../functions/src/jobs.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-036 — readNotification — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, OWNER, worker
- Điều kiện/fixture: A/B notifications; reminder policies active/inactive; canonical demo-satsunicgo clock fixture.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của readNotification tại functions/src/jobs.ts:256; tạo fixture tối thiểu theo nhóm REM.
2. Invoke readNotification với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/jobs.ts](../../../functions/src/jobs.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## MEDIA — Ảnh hàng và content media

### SG-API-037 — uploadContentImage — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của uploadContentImage tại functions/src/media.ts:9; tạo fixture tối thiểu theo nhóm MEDIA.
2. Invoke uploadContentImage với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/media.ts](../../../functions/src/media.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-038 — publicImage — onRequest contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Tạo fixture Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft. cho HTTP handler publicImage.
2. Gửi request method/path/query hợp lệ lấy từ handler; đối chiếu status/content-type/body/caching.
3. Thử thiếu/sai input và parent bị unpublish/revoke nếu có parent; kiểm tra không lộ dữ liệu.

**Mong đợi:** HTTP response và publication/share/media authority đúng source; input lỗi không leak nội dung. Không áp Google/AppCheck cho public HTTP nếu source không yêu cầu. Chứng minh bằng body/status và dữ liệu, không chỉ HTTP200.

**Đối chiếu source:** [functions/src/media.ts](../../../functions/src/media.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## REM — Reminder, notifications và scheduled maintenance

### SG-API-039 — membershipReminderPolicy — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, OWNER, worker
- Điều kiện/fixture: A/B notifications; reminder policies active/inactive; canonical demo-satsunicgo clock fixture.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của membershipReminderPolicy tại functions/src/membership-reminder-policy.ts:29; tạo fixture tối thiểu theo nhóm REM.
2. Invoke membershipReminderPolicy với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/membership-reminder-policy.ts](../../../functions/src/membership-reminder-policy.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## MEM — Membership, gia hạn và quyền lợi

### SG-API-040 — membershipCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, OWNER, FINANCE
- Điều kiện/fixture: Plan published price=100001 periodDays=30; active/expired subscriptions; server clock fixed.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của membershipCommand tại functions/src/membership.ts:49; tạo fixture tối thiểu theo nhóm MEM.
2. Invoke membershipCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/membership.ts](../../../functions/src/membership.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## SUP — Support tickets và hội thoại order

### SG-API-041 — readOrderConversation — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, SUPPORT, assigned staff
- Điều kiện/fixture: Ticket A/B; order A/B; private note and public message fixtures.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của readOrderConversation tại functions/src/order-conversation.ts:49; tạo fixture tối thiểu theo nhóm SUP.
2. Invoke readOrderConversation với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/order-conversation.ts](../../../functions/src/order-conversation.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-042 — orderConversationCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, SUPPORT, assigned staff
- Điều kiện/fixture: Ticket A/B; order A/B; private note and public message fixtures.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của orderConversationCommand tại functions/src/order-conversation.ts:149; tạo fixture tối thiểu theo nhóm SUP.
2. Invoke orderConversationCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/order-conversation.ts](../../../functions/src/order-conversation.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## HISTORY — Lịch sử order, activity và audit

### SG-API-043 — orderHistory — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer own, operational roles theo handler
- Điều kiện/fixture: Orders có quote, acceptance,payment,changes,shipment; audit events synthetic.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của orderHistory tại functions/src/order-history.ts:5; tạo fixture tối thiểu theo nhóm HISTORY.
2. Invoke orderHistory với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/order-history.ts](../../../functions/src/order-history.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## MEDIA — Ảnh hàng và content media

### SG-API-044 — uploadOrderImage — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của uploadOrderImage tại functions/src/order-media.ts:81; tạo fixture tối thiểu theo nhóm MEDIA.
2. Invoke uploadOrderImage với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/order-media.ts](../../../functions/src/order-media.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-045 — listOrderImages — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của listOrderImages tại functions/src/order-media.ts:199; tạo fixture tối thiểu theo nhóm MEDIA.
2. Invoke listOrderImages với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/order-media.ts](../../../functions/src/order-media.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-046 — readOrderImage — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của readOrderImage tại functions/src/order-media.ts:227; tạo fixture tối thiểu theo nhóm MEDIA.
2. Invoke readOrderImage với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/order-media.ts](../../../functions/src/order-media.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## EMAIL — Outbox, retry và unknown delivery

### SG-API-047 — outboxCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, FINANCE, scheduled worker
- Điều kiện/fixture: Synthetic outbox jobs pending/leased/sent/unknown/dead; fake mail adapter; email gate đóng.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của outboxCommand tại functions/src/outbox-command.ts:20; tạo fixture tối thiểu theo nhóm EMAIL.
2. Invoke outboxCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/outbox-command.ts](../../../functions/src/outbox-command.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## PAY — Payment intent, webhook và reconcile

### SG-API-048 — createPaymentLink — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, provider sandbox, FINANCE
- Điều kiện/fixture: Catalog/custom order; fake provider adapter; release gate hiện đóng; bank fixture synthetic.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Mở source functions/src/payments/payos.ts:160 và gate capability của createPaymentLink; chuẩn bị fixture đúng schema.
2. Invoke createPaymentLink trong local harness với gate đóng; ghi số lần network attempts.
3. Thử settings/client flag bật capability; so sánh trước/sau.

**Mong đợi:** Gate code-owned chặn provider/spend; maintenance chỉ được chạy non-provider ở exact canonical demo. Không báo gửi/thanh toán/AI thành công từ fixture. Live provider branch BLOCKED, cần approval/candidate riêng.

**Đối chiếu source:** [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-049 — payosWebhook — onRequest contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, provider sandbox, FINANCE
- Điều kiện/fixture: Catalog/custom order; fake provider adapter; release gate hiện đóng; bank fixture synthetic.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Mở source functions/src/payments/payos.ts:354 và gate capability của payosWebhook; chuẩn bị fixture đúng schema.
2. Invoke payosWebhook trong local harness với gate đóng; ghi số lần network attempts.
3. Thử settings/client flag bật capability; so sánh trước/sau.

**Mong đợi:** Gate code-owned chặn provider/spend; maintenance chỉ được chạy non-provider ở exact canonical demo. Không báo gửi/thanh toán/AI thành công từ fixture. Live provider branch BLOCKED, cần approval/candidate riêng.

**Đối chiếu source:** [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-050 — reconcilePayments — onSchedule contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer, provider sandbox, FINANCE
- Điều kiện/fixture: Catalog/custom order; fake provider adapter; release gate hiện đóng; bank fixture synthetic.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Mở source functions/src/payments/payos.ts:375 và gate capability của reconcilePayments; chuẩn bị fixture đúng schema.
2. Invoke reconcilePayments trong local harness với gate đóng; ghi số lần network attempts.
3. Thử settings/client flag bật capability; so sánh trước/sau.

**Mong đợi:** Gate code-owned chặn provider/spend; maintenance chỉ được chạy non-provider ở exact canonical demo. Không báo gửi/thanh toán/AI thành công từ fixture. Live provider branch BLOCKED, cần approval/candidate riêng.

**Đối chiếu source:** [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## PUBLIC — Website, nội dung public và discovery

### SG-API-051 — publicPage — onRequest contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: guest
- Điều kiện/fixture: Published/draft/archived products/posts/pages; slug hợp lệ, không tồn tại; 3 trang dữ liệu.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Tạo fixture Published/draft/archived products/posts/pages; slug hợp lệ, không tồn tại; 3 trang dữ liệu. cho HTTP handler publicPage.
2. Gửi request method/path/query hợp lệ lấy từ handler; đối chiếu status/content-type/body/caching.
3. Thử thiếu/sai input và parent bị unpublish/revoke nếu có parent; kiểm tra không lộ dữ liệu.

**Mong đợi:** HTTP response và publication/share/media authority đúng source; input lỗi không leak nội dung. Không áp Google/AppCheck cho public HTTP nếu source không yêu cầu. Chứng minh bằng body/status và dữ liệu, không chỉ HTTP200.

**Đối chiếu source:** [functions/src/public.ts](../../../functions/src/public.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-052 — publicDiscovery — onRequest contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: guest
- Điều kiện/fixture: Published/draft/archived products/posts/pages; slug hợp lệ, không tồn tại; 3 trang dữ liệu.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Tạo fixture Published/draft/archived products/posts/pages; slug hợp lệ, không tồn tại; 3 trang dữ liệu. cho HTTP handler publicDiscovery.
2. Gửi request method/path/query hợp lệ lấy từ handler; đối chiếu status/content-type/body/caching.
3. Thử thiếu/sai input và parent bị unpublish/revoke nếu có parent; kiểm tra không lộ dữ liệu.

**Mong đợi:** HTTP response và publication/share/media authority đúng source; input lỗi không leak nội dung. Không áp Google/AppCheck cho public HTTP nếu source không yêu cầu. Chứng minh bằng body/status và dữ liệu, không chỉ HTTP200.

**Đối chiếu source:** [functions/src/public.ts](../../../functions/src/public.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## REFUND — Yêu cầu hoàn tiền và reservation

### SG-API-053 — refundCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: OWNER, FINANCE
- Điều kiện/fixture: Order collected=100001 refunded=10000; pending reservation=20000.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của refundCommand tại functions/src/refunds.ts:11; tạo fixture tối thiểu theo nhóm REFUND.
2. Invoke refundCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/refunds.ts](../../../functions/src/refunds.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## RETURN — Nhận, kiểm tra và đóng hàng trả

### SG-API-054 — returnCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: WAREHOUSE, OWNER, OPERATIONS_MANAGER
- Điều kiện/fixture: Parcel returned; inspected/uninspected return fixtures; quantity lineage.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của returnCommand tại functions/src/returns.ts:18; tạo fixture tối thiểu theo nhóm RETURN.
2. Invoke returnCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/returns.ts](../../../functions/src/returns.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## RATES — Biểu phí vận chuyển và ước tính

### SG-API-055 — shippingRatesPublic — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: guest/customer reads, OWNER admin
- Điều kiện/fixture: Reference/published/unavailable rate snapshots; VN_US, US_VN; vietnam,texas_cali,oregon.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của shippingRatesPublic tại functions/src/shipping-rates.ts:76; tạo fixture tối thiểu theo nhóm RATES.
2. Invoke shippingRatesPublic với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/shipping-rates.ts](../../../functions/src/shipping-rates.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-056 — shippingRatesAdmin — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: guest/customer reads, OWNER admin
- Điều kiện/fixture: Reference/published/unavailable rate snapshots; VN_US, US_VN; vietnam,texas_cali,oregon.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của shippingRatesAdmin tại functions/src/shipping-rates.ts:82; tạo fixture tối thiểu theo nhóm RATES.
2. Invoke shippingRatesAdmin với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/shipping-rates.ts](../../../functions/src/shipping-rates.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## SHIP — Kiện, tracking và ngày giao

### SG-API-057 — shippingCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: WAREHOUSE, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order lines=[2,3] đủ mua/nhận; parcel P1/P2; timeline synthetic.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của shippingCommand tại functions/src/shipping.ts:22; tạo fixture tối thiểu theo nhóm SHIP.
2. Invoke shippingCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/shipping.ts](../../../functions/src/shipping.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## PROFILE — Profile, địa chỉ và snapshot người nhận

### SG-API-058 — listWork — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của listWork tại functions/src/workspace.ts:22; tạo fixture tối thiểu theo nhóm PROFILE.
2. Invoke listWork với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-059 — workspaceCommand — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của workspaceCommand tại functions/src/workspace.ts:298; tạo fixture tối thiểu theo nhóm PROFILE.
2. Invoke workspaceCommand với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-060 — readOwnerConfiguration — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của readOwnerConfiguration tại functions/src/workspace.ts:730; tạo fixture tối thiểu theo nhóm PROFILE.
2. Invoke readOwnerConfiguration với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-061 — ticketMessages — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của ticketMessages tại functions/src/workspace.ts:762; tạo fixture tối thiểu theo nhóm PROFILE.
2. Invoke ticketMessages với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-062 — readStaffAccess — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của readStaffAccess tại functions/src/workspace.ts:810; tạo fixture tối thiểu theo nhóm PROFILE.
2. Invoke readStaffAccess với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-API-063 — readOrderOperations — onCall contract

- Priority: **P0** · Status: **NOT_RUN** · Environment: `HARNESS_LOCAL`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.; payload/schema cụ thể từ source handler. Đây là contract envelope, không thay ca business của nhóm.

**Các bước**

1. Đọc schema và guards của readOrderOperations tại functions/src/workspace.ts:849; tạo fixture tối thiểu theo nhóm PROFILE.
2. Invoke readOrderOperations với identity/quyền hợp lệ và payload source-valid; snapshot response/DB state đã redact.
3. Invoke bằng input ngoài schema và identity/quyền không hợp lệ nếu handler yêu cầu; đối chiếu trước/sau.

**Mong đợi:** Hợp lệ trả đúng projection/state theo source; invalid/unauthorized không mutate hoặc leak private data. Public callable giữ public-read semantics; action có financial/version/idempotency guards phải kiểm tra cùng ca module tương ứng.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.
