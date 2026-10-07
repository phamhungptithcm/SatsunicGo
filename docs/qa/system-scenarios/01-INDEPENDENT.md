# INDEPENDENT — 286 scenarios

Mọi case hiện NOT_RUN. Expected là test oracle để kiểm chứng, không là kết luận implementation đã đúng. Áp dụng [README](README.md) về fixture/reset/invariants và evidence. Mỗi variant cần result con riêng.

## AUTH — Đăng nhập, phiên và MFA

### SG-AUTH-001 — Google đã xác thực

- Priority: **P0** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer A/B, staff
- Điều kiện/fixture: Google test identities A/B; clock cố định; MFA fixture riêng; không dùng production account.

**Các bước**

1. Mở One Tap
2. đăng nhập identity Google email_verified=true
3. mở account

**Mong đợi:** Phiên đúng UID, dữ liệu của UID hiện hành; không tạo quyền staff từ email.

**Đối chiếu source:** [src/features/auth/OneTap.tsx](../../../src/features/auth/OneTap.tsx), [src/features/auth/one-tap-controller.ts](../../../src/features/auth/one-tap-controller.ts), [src/features/auth/Security.tsx](../../../src/features/auth/Security.tsx), [src/features/auth/mfa.ts](../../../src/features/auth/mfa.ts), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-AUTH-002 — Sai provider hoặc email chưa xác thực

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, customer A/B, staff
- Điều kiện/fixture: Google test identities A/B; clock cố định; MFA fixture riêng; không dùng production account.

**Các bước**

1. Gọi requireVerifiedGoogle với missing auth, email_verified=false, provider password
2. lặp với linked Google nhưng phiên password

**Mong đợi:** Từ chối từng biến thể; liên kết Google không thay thế provider của phiên.

**Đối chiếu source:** [src/features/auth/OneTap.tsx](../../../src/features/auth/OneTap.tsx), [src/features/auth/one-tap-controller.ts](../../../src/features/auth/one-tap-controller.ts), [src/features/auth/Security.tsx](../../../src/features/auth/Security.tsx), [src/features/auth/mfa.ts](../../../src/features/auth/mfa.ts), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-AUTH-003 — Hủy và lỗi One Tap

- Priority: **P0** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer A/B, staff
- Điều kiện/fixture: Google test identities A/B; clock cố định; MFA fixture riêng; không dùng production account.

**Các bước**

1. Mở đăng nhập
2. hủy popup
3. giả lập script/network failure
4. thử lại

**Mong đợi:** Không kẹt busy; thông báo có hành động phục hồi; không giả trạng thái đã đăng nhập.

**Đối chiếu source:** [src/features/auth/OneTap.tsx](../../../src/features/auth/OneTap.tsx), [src/features/auth/one-tap-controller.ts](../../../src/features/auth/one-tap-controller.ts), [src/features/auth/Security.tsx](../../../src/features/auth/Security.tsx), [src/features/auth/mfa.ts](../../../src/features/auth/mfa.ts), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-AUTH-004 — Đổi account khi request đang chạy

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, customer A/B, staff
- Điều kiện/fixture: Google test identities A/B; clock cố định; MFA fixture riêng; không dùng production account.

**Các bước**

1. Đăng nhập A
2. trì hoãn tải orders
3. đổi sang B
4. cho response A hoàn tất

**Mong đợi:** Không hiển thị orders/profile/chat A cho B; listener A được hủy.

**Đối chiếu source:** [src/features/auth/OneTap.tsx](../../../src/features/auth/OneTap.tsx), [src/features/auth/one-tap-controller.ts](../../../src/features/auth/one-tap-controller.ts), [src/features/auth/Security.tsx](../../../src/features/auth/Security.tsx), [src/features/auth/mfa.ts](../../../src/features/auth/mfa.ts), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-AUTH-005 — Biên recentMfa

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, customer A/B, staff
- Điều kiện/fixture: Google test identities A/B; clock cố định; MFA fixture riêng; không dùng production account.

**Các bước**

1. Kiểm tra auth_time now−299999ms, now−300000ms, now+30000ms, now+30001ms
2. thử thiếu factor và thời gian không nguyên

**Mong đợi:** Guard chấp nhận đúng biên source; quá 5 phút, quá tolerance tương lai hoặc thiếu factor bị từ chối.

**Đối chiếu source:** [src/features/auth/OneTap.tsx](../../../src/features/auth/OneTap.tsx), [src/features/auth/one-tap-controller.ts](../../../src/features/auth/one-tap-controller.ts), [src/features/auth/Security.tsx](../../../src/features/auth/Security.tsx), [src/features/auth/mfa.ts](../../../src/features/auth/mfa.ts), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-AUTH-006 — Enrollment và hủy MFA

- Priority: **P0** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer A/B, staff
- Điều kiện/fixture: Google test identities A/B; clock cố định; MFA fixture riêng; không dùng production account.

**Các bước**

1. Mở Security
2. bắt đầu TOTP
3. thử code sai, code đúng và hủy giữa chừng

**Mong đợi:** Chỉ hoàn tất sau verifier xác nhận; không lộ secret trong log/evidence; hủy không báo enabled giả.

**Đối chiếu source:** [src/features/auth/OneTap.tsx](../../../src/features/auth/OneTap.tsx), [src/features/auth/one-tap-controller.ts](../../../src/features/auth/one-tap-controller.ts), [src/features/auth/Security.tsx](../../../src/features/auth/Security.tsx), [src/features/auth/mfa.ts](../../../src/features/auth/mfa.ts), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-AUTH-007 — Đăng xuất trong tác vụ

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, customer A/B, staff
- Điều kiện/fixture: Google test identities A/B; clock cố định; MFA fixture riêng; không dùng production account.

**Các bước**

1. Mở modal và private listener
2. sign out trong lúc save chờ
3. hoàn tất request cũ

**Mong đợi:** UI riêng tư được xóa; phản hồi cũ không tái dựng private state.

**Đối chiếu source:** [src/features/auth/OneTap.tsx](../../../src/features/auth/OneTap.tsx), [src/features/auth/one-tap-controller.ts](../../../src/features/auth/one-tap-controller.ts), [src/features/auth/Security.tsx](../../../src/features/auth/Security.tsx), [src/features/auth/mfa.ts](../../../src/features/auth/mfa.ts), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-AUTH-008 — Phiên hết hạn

- Priority: **P0** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer A/B, staff
- Điều kiện/fixture: Google test identities A/B; clock cố định; MFA fixture riêng; không dùng production account.

**Các bước**

1. Hết hạn token khi submit
2. thực hiện lại sau reauth

**Mong đợi:** Yêu cầu đăng nhập lại an toàn; giữ draft phù hợp; không nhân đôi thao tác đã commit.

**Đối chiếu source:** [src/features/auth/OneTap.tsx](../../../src/features/auth/OneTap.tsx), [src/features/auth/one-tap-controller.ts](../../../src/features/auth/one-tap-controller.ts), [src/features/auth/Security.tsx](../../../src/features/auth/Security.tsx), [src/features/auth/mfa.ts](../../../src/features/auth/mfa.ts), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## PUBLIC — Website, nội dung public và discovery

### SG-PUBLIC-001 — Điều hướng public

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest
- Điều kiện/fixture: Published/draft/archived products/posts/pages; slug hợp lệ, không tồn tại; 3 trang dữ liệu.

**Các bước**

1. Mở home, products, posts và trang public
2. mở trực tiếp URL
3. reload

**Mong đợi:** Route đúng nội dung và canonical; không cần private session để đọc published content.

**Đối chiếu source:** [src/features/content/Content.tsx](../../../src/features/content/Content.tsx), [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/public.ts](../../../functions/src/public.ts), [src/shared/public-content.ts](../../../src/shared/public-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PUBLIC-002 — Không tồn tại và chưa publish

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest
- Điều kiện/fixture: Published/draft/archived products/posts/pages; slug hợp lệ, không tồn tại; 3 trang dữ liệu.

**Các bước**

1. Mở slug thiếu, draft và archived
2. thử public HTTP renderer

**Mong đợi:** Không lộ bản nháp; trạng thái không tìm thấy phù hợp; không trả nội dung của slug khác.

**Đối chiếu source:** [src/features/content/Content.tsx](../../../src/features/content/Content.tsx), [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/public.ts](../../../functions/src/public.ts), [src/shared/public-content.ts](../../../src/shared/public-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PUBLIC-003 — Phân trang danh sách

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest
- Điều kiện/fixture: Published/draft/archived products/posts/pages; slug hợp lệ, không tồn tại; 3 trang dữ liệu.

**Các bước**

1. Seed hơn 2 page
2. next/back
3. thay filter
4. xóa item cuối trang

**Mong đợi:** Không trùng/thiếu do cursor; filter mới reset cursor; empty khác error.

**Đối chiếu source:** [src/features/content/Content.tsx](../../../src/features/content/Content.tsx), [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/public.ts](../../../functions/src/public.ts), [src/shared/public-content.ts](../../../src/shared/public-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PUBLIC-004 — Ảnh bị thu hồi

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest
- Điều kiện/fixture: Published/draft/archived products/posts/pages; slug hợp lệ, không tồn tại; 3 trang dữ liệu.

**Các bước**

1. Mở published parent/image
2. unpublish parent
3. tải lại public image

**Mong đợi:** Recheck publication, không tiếp tục phục vụ media private do URL cũ.

**Đối chiếu source:** [src/features/content/Content.tsx](../../../src/features/content/Content.tsx), [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/public.ts](../../../functions/src/public.ts), [src/shared/public-content.ts](../../../src/shared/public-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PUBLIC-005 — HTML và metadata

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest
- Điều kiện/fixture: Published/draft/archived products/posts/pages; slug hợp lệ, không tồn tại; 3 trang dữ liệu.

**Các bước**

1. Seed tiêu đề có dấu, quotes và ký tự HTML
2. đọc server response và hydrated page

**Mong đợi:** Escaping đúng; title/description/link phù hợp entity; không thi hành HTML độc hại.

**Đối chiếu source:** [src/features/content/Content.tsx](../../../src/features/content/Content.tsx), [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/public.ts](../../../functions/src/public.ts), [src/shared/public-content.ts](../../../src/shared/public-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PUBLIC-006 — Sitemap và robots

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest
- Điều kiện/fixture: Published/draft/archived products/posts/pages; slug hợp lệ, không tồn tại; 3 trang dữ liệu.

**Các bước**

1. Gọi publicDiscovery cho từng loại được source hỗ trợ
2. kiểm tra published URLs

**Mong đợi:** Chỉ URL được phép, canonical nhất quán; XML hợp lệ; không suy ra Google đã index.

**Đối chiếu source:** [src/features/content/Content.tsx](../../../src/features/content/Content.tsx), [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/public.ts](../../../functions/src/public.ts), [src/shared/public-content.ts](../../../src/shared/public-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PUBLIC-007 — Lỗi public fetch

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest
- Điều kiện/fixture: Published/draft/archived products/posts/pages; slug hợp lệ, không tồn tại; 3 trang dữ liệu.

**Các bước**

1. Fail một request danh sách
2. retry
3. mở route khác trong lúc chờ

**Mong đợi:** Phân biệt loading/empty/error; response route cũ không thay nội dung route mới.

**Đối chiếu source:** [src/features/content/Content.tsx](../../../src/features/content/Content.tsx), [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/public.ts](../../../functions/src/public.ts), [src/shared/public-content.ts](../../../src/shared/public-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PUBLIC-008 — Fallback app và route lồng

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest
- Điều kiện/fixture: Published/draft/archived products/posts/pages; slug hợp lệ, không tồn tại; 3 trang dữ liệu.

**Các bước**

1. Mở deep link account, crm, product checkout và URL lạ qua hosting fixture

**Mong đợi:** App shell/404 đúng cấu hình; không lộ private payload trong public HTML.

**Đối chiếu source:** [src/features/content/Content.tsx](../../../src/features/content/Content.tsx), [src/app/App.tsx](../../../src/app/App.tsx), [functions/src/public.ts](../../../functions/src/public.ts), [src/shared/public-content.ts](../../../src/shared/public-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## CAT — Catalog, tìm kiếm và checkout

### SG-CAT-001 — Checkout hợp lệ

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, CONTENT_EDITOR
- Điều kiện/fixture: P1 published/orderable version=1 price=100001 VND options=[S,M]; P2 draft; A/B.

**Các bước**

1. Chọn P1 size M quantity=2
2. xác nhận catalogCheckout
3. đọc orders

**Mong đợi:** Snapshot product/version/terms/variant được cố định; finalTotal=200002; purchaseKind=catalog; không cần báo giá custom.

**Đối chiếu source:** [packages/domain/catalog-checkout.ts](../../../packages/domain/catalog-checkout.ts), [packages/domain/catalog-search.ts](../../../packages/domain/catalog-search.ts), [src/features/content/ProductsCatalog.tsx](../../../src/features/content/ProductsCatalog.tsx), [src/features/ask/CatalogPurchase.tsx](../../../src/features/ask/CatalogPurchase.tsx), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CAT-002 — Biên số lượng

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, CONTENT_EDITOR
- Điều kiện/fixture: P1 published/orderable version=1 price=100001 VND options=[S,M]; P2 draft; A/B.

**Các bước**

1. Checkout quantity=1,100,0,101,1.5
2. thử null/string

**Mong đợi:** 1 và 100 hợp lệ; các giá trị ngoài schema bị từ chối; không tạo order rác.

**Đối chiếu source:** [packages/domain/catalog-checkout.ts](../../../packages/domain/catalog-checkout.ts), [packages/domain/catalog-search.ts](../../../packages/domain/catalog-search.ts), [src/features/content/ProductsCatalog.tsx](../../../src/features/content/ProductsCatalog.tsx), [src/features/ask/CatalogPurchase.tsx](../../../src/features/ask/CatalogPurchase.tsx), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CAT-003 — Variant hợp lệ và giả mạo

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, CONTENT_EDITOR
- Điều kiện/fixture: P1 published/orderable version=1 price=100001 VND options=[S,M]; P2 draft; A/B.

**Các bước**

1. Gửi S,M,L
2. dùng product không options rồi gửi variant khác rỗng

**Mong đợi:** Chỉ option công bố hợp lệ; không chấp nhận variant tự do hoặc options thiếu.

**Đối chiếu source:** [packages/domain/catalog-checkout.ts](../../../packages/domain/catalog-checkout.ts), [packages/domain/catalog-search.ts](../../../packages/domain/catalog-search.ts), [src/features/content/ProductsCatalog.tsx](../../../src/features/content/ProductsCatalog.tsx), [src/features/ask/CatalogPurchase.tsx](../../../src/features/ask/CatalogPurchase.tsx), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CAT-004 — Giá và version cũ

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, CONTENT_EDITOR
- Điều kiện/fixture: P1 published/orderable version=1 price=100001 VND options=[S,M]; P2 draft; A/B.

**Các bước**

1. Giữ checkout v1
2. editor đổi giá/v2
3. submit v1
4. thử sửa listedPrice trong payload

**Mong đợi:** Giá server quyết định; version cũ báo cập nhật; không bán theo giá client tự đặt.

**Đối chiếu source:** [packages/domain/catalog-checkout.ts](../../../packages/domain/catalog-checkout.ts), [packages/domain/catalog-search.ts](../../../packages/domain/catalog-search.ts), [src/features/content/ProductsCatalog.tsx](../../../src/features/content/ProductsCatalog.tsx), [src/features/ask/CatalogPurchase.tsx](../../../src/features/ask/CatalogPurchase.tsx), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CAT-005 — Product không bán được

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, CONTENT_EDITOR
- Điều kiện/fixture: P1 published/orderable version=1 price=100001 VND options=[S,M]; P2 draft; A/B.

**Các bước**

1. Checkout draft, archived, orderable=false và product thiếu termsVersion

**Mong đợi:** Không tạo catalog order; UI giải thích trạng thái, có đường gửi yêu cầu custom.

**Đối chiếu source:** [packages/domain/catalog-checkout.ts](../../../packages/domain/catalog-checkout.ts), [packages/domain/catalog-search.ts](../../../packages/domain/catalog-search.ts), [src/features/content/ProductsCatalog.tsx](../../../src/features/content/ProductsCatalog.tsx), [src/features/ask/CatalogPurchase.tsx](../../../src/features/ask/CatalogPurchase.tsx), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CAT-006 — Retry checkout

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, CONTENT_EDITOR
- Điều kiện/fixture: P1 published/orderable version=1 price=100001 VND options=[S,M]; P2 draft; A/B.

**Các bước**

1. Gửi cùng operationId và payload 2 lần đồng thời
2. gửi ID đó với quantity khác

**Mong đợi:** Một order/result; reuse với payload khác bị từ chối; current identity được recheck.

**Đối chiếu source:** [packages/domain/catalog-checkout.ts](../../../packages/domain/catalog-checkout.ts), [packages/domain/catalog-search.ts](../../../packages/domain/catalog-search.ts), [src/features/content/ProductsCatalog.tsx](../../../src/features/content/ProductsCatalog.tsx), [src/features/ask/CatalogPurchase.tsx](../../../src/features/ask/CatalogPurchase.tsx), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CAT-007 — Tìm kiếm và cache

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, CONTENT_EDITOR
- Điều kiện/fixture: P1 published/orderable version=1 price=100001 VND options=[S,M]; P2 draft; A/B.

**Các bước**

1. Tìm theo tên có dấu/không dấu
2. đổi market và query nhanh
3. delay response cũ

**Mong đợi:** Kết quả khớp filter hiện hành; cache có scope; response cũ không ghi đè.

**Đối chiếu source:** [packages/domain/catalog-checkout.ts](../../../packages/domain/catalog-checkout.ts), [packages/domain/catalog-search.ts](../../../packages/domain/catalog-search.ts), [src/features/content/ProductsCatalog.tsx](../../../src/features/content/ProductsCatalog.tsx), [src/features/ask/CatalogPurchase.tsx](../../../src/features/ask/CatalogPurchase.tsx), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CAT-008 — Giới hạn tiền

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, CONTENT_EDITOR
- Điều kiện/fixture: P1 published/orderable version=1 price=100001 VND options=[S,M]; P2 draft; A/B.

**Các bước**

1. Tính unitPrice×quantity ở sát money max và vượt max
2. thử số lẻ/âm

**Mong đợi:** Tổng nguyên VND chính xác, không overflow hoặc âm; invalid input không commit.

**Đối chiếu source:** [packages/domain/catalog-checkout.ts](../../../packages/domain/catalog-checkout.ts), [packages/domain/catalog-search.ts](../../../packages/domain/catalog-search.ts), [src/features/content/ProductsCatalog.tsx](../../../src/features/content/ProductsCatalog.tsx), [src/features/ask/CatalogPurchase.tsx](../../../src/features/ask/CatalogPurchase.tsx), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CAT-009 — Snapshot sau edit

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, CONTENT_EDITOR
- Điều kiện/fixture: P1 published/orderable version=1 price=100001 VND options=[S,M]; P2 draft; A/B.

**Các bước**

1. Checkout P1
2. editor đổi title/terms/price
3. đọc order và invoice

**Mong đợi:** Order đã tạo giữ snapshot; nội dung public mới không đổi nghĩa vụ khách.

**Đối chiếu source:** [packages/domain/catalog-checkout.ts](../../../packages/domain/catalog-checkout.ts), [packages/domain/catalog-search.ts](../../../packages/domain/catalog-search.ts), [src/features/content/ProductsCatalog.tsx](../../../src/features/content/ProductsCatalog.tsx), [src/features/ask/CatalogPurchase.tsx](../../../src/features/ask/CatalogPurchase.tsx), [functions/src/catalog-checkout.ts](../../../functions/src/catalog-checkout.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## REQ — Yêu cầu custom và dữ liệu đầu vào

### SG-REQ-001 — Gửi custom request

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer
- Điều kiện/fixture: Custom request A, markets US/JP/KR; items 1–30; hai dòng quantity=[2,3].

**Các bước**

1. Nhập market, item, variant, condition, notes và URL HTTP(S)
2. submitRequest

**Mong đợi:** Một order REQUESTED purchaseKind=custom ownerId từ auth; quantities được giữ.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-002 — Biên items

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer
- Điều kiện/fixture: Custom request A, markets US/JP/KR; items 1–30; hai dòng quantity=[2,3].

**Các bước**

1. Gửi 0,1,30,31 items
2. mỗi item quantity=0,1,100,101

**Mong đợi:** Schema nhận đúng 1–30 dòng và 1–100 quantity; lỗi trỏ đúng input.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-003 — Biên chuỗi

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer
- Điều kiện/fixture: Custom request A, markets US/JP/KR; items 1–30; hai dòng quantity=[2,3].

**Các bước**

1. Gửi name dài 1/2/200/201 ký tự
2. notes 2000/2001
3. whitespace

**Mong đợi:** Trim/name boundaries đúng schema; không silent truncate thay đổi hàng mua.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-004 — URL không an toàn

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer
- Điều kiện/fixture: Custom request A, markets US/JP/KR; items 1–30; hai dòng quantity=[2,3].

**Các bước**

1. Gửi javascript:, data:, file:, URL sai và HTTP(S) hợp lệ

**Mong đợi:** Chỉ HTTP(S) hợp lệ; không thực thi hoặc fetch URL nguy hiểm.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-005 — Giả owner và trường dư

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer
- Điều kiện/fixture: Custom request A, markets US/JP/KR; items 1–30; hai dòng quantity=[2,3].

**Các bước**

1. Gửi ownerId=B, stage=COMPLETED hoặc collected trong payload

**Mong đợi:** Strict schema từ chối trường dư; identity/stage/financial fields do server đặt.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-006 — Draft và lỗi mạng

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer
- Điều kiện/fixture: Custom request A, markets US/JP/KR; items 1–30; hai dòng quantity=[2,3].

**Các bước**

1. Điền nhiều dòng
2. fail submit trước response
3. retry bằng operationId cũ

**Mong đợi:** Input không bị xóa do lỗi; không tạo request thứ hai khi response bị mất.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-007 — Budget và ngày mong muốn

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer
- Điều kiện/fixture: Custom request A, markets US/JP/KR; items 1–30; hai dòng quantity=[2,3].

**Các bước**

1. Thử budget âm/lẻ/vượt money max
2. desiredAt sai kiểu hoặc không dương

**Mong đợi:** Phù hợp schema; ngày mong muốn không được trình bày như cam kết giao.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-008 — Request cùng ID order

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer
- Điều kiện/fixture: Custom request A, markets US/JP/KR; items 1–30; hai dòng quantity=[2,3].

**Các bước**

1. Gửi submitRequest vào orderId đã tồn tại với operationId mới

**Mong đợi:** Không ghi đè request cũ; trả lỗi, giữ nguyên lịch sử và owner.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-009 — Đặt lại từ đơn cũ

- Priority: **P0** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: customer
- Điều kiện/fixture: Fixture request own/B, draft/session storage synthetic, upload fake adapter và network fault; cùng isolation README.

**Các bước**

1. Mở /request?reorder=ownOrder
2.  thử ID B,ID invalid và đọc bị fail

**Mong đợi:** Chỉ copy own valid items thành draft mới; không rewrite order cũ; failure có đường tạo mới, không lộ B.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-010 — Prefill cần agency

- Priority: **P0** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: customer
- Điều kiện/fixture: Fixture request own/B, draft/session storage synthetic, upload fake adapter và network fault; cùng isolation README.

**Các bước**

1. Đã có draft
2.  mở /request với name/url/market prefill
3.  chọn hoặc bỏ Replace draft

**Mong đợi:** Không thay draft đang có trước explicit action; input source được giới hạn; không coi prefill là purchase consent.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-011 — CSV import request

- Priority: **P0** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: customer
- Điều kiện/fixture: Fixture request own/B, draft/session storage synthetic, upload fake adapter và network fault; cùng isolation README.

**Các bước**

1. Import header name,url,quantity,variant đúng
2.  thử quote/newline,31 lines,bad header và >50000 chars

**Mong đợi:** Parser nhận tối đa30 items theo schema; lỗi không mất draft; không nhập quantity/URL sai.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-012 — Ảnh anonymous qua đăng nhập

- Priority: **P0** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: customer
- Điều kiện/fixture: Fixture request own/B, draft/session storage synthetic, upload fake adapter và network fault; cùng isolation README.

**Các bước**

1. Guest thêm synthetic images
2.  sign in
3.  submit
4.  đổi account trước upload chờ hoàn tất

**Mong đợi:** Handoff chỉ trong scope đúng phiên/request; ảnh không leak sang B; upload cần own authoritative order.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-013 — Order saved nhưng ảnh lỗi

- Priority: **P0** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: customer
- Điều kiện/fixture: Fixture request own/B, draft/session storage synthetic, upload fake adapter và network fault; cùng isolation README.

**Các bước**

1. Submit order thành công
2.  fail ảnh thứ2/3
3.  reload
4.  Continue upload
5.  mở account order

**Mong đợi:** Một order, chỉ retry ảnh chưa uploaded theo hash/operationId; UI count đúng, không nói toàn bộ ảnh đã tải.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-014 — Pending session bị corrupt

- Priority: **P0** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: customer
- Điều kiện/fixture: Fixture request own/B, draft/session storage synthetic, upload fake adapter và network fault; cùng isolation README.

**Các bước**

1. Set request-pending UID fixture JSON invalid hoặc missing operationId
2.  reload
3.  thử submit

**Mong đợi:** PendingUnreadable chặn gửi mới mù; user kiểm tra account trước; không duplicate order.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-015 — Draft UID và storage failure

- Priority: **P0** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: customer
- Điều kiện/fixture: Fixture request own/B, draft/session storage synthetic, upload fake adapter và network fault; cùng isolation README.

**Các bước**

1. A lưu draft
2.  B login
3.  lỗi sessionStorage quota/security
4.  guest chuyển from=ask

**Mong đợi:** Không lộ draft/private order A; lỗi lưu draft rõ; fallback anonymous cần scope hợp lệ, không overwrite data ngầm.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REQ-016 — Market và payload frozen

- Priority: **P0** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: customer
- Điều kiện/fixture: Fixture request own/B, draft/session storage synthetic, upload fake adapter và network fault; cùng isolation README.

**Các bước**

1. Bắt đầu submit lost-ack hoặc order đã saved
2.  thử đổi market,items và thêm images

**Mong đợi:** Market/payload đã bound không đổi khi chưa resolve operation; upload recovery không tạo order với market khác.

**Đối chiếu source:** [packages/domain/request-input.ts](../../../packages/domain/request-input.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/requests/RequestForm.tsx](../../../src/features/requests/RequestForm.tsx), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/requests/ProductComposer.tsx](../../../src/features/requests/ProductComposer.tsx), [src/features/requests/request-form.css](../../../src/features/requests/request-form.css).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## QUOTE — Báo giá, FX và chấp thuận

### SG-QUOTE-001 — Phát hành và nhận báo giá

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, BUYER assigned, customer
- Điều kiện/fixture: Custom order REQUESTED, quote total=100001; thời gian cố định; versions 1/2.

**Các bước**

1. issueQuote hợp lệ
2. customer mở breakdown
3. acceptQuote current version

**Mong đợi:** Tổng thành phần đúng; quoteVersion/terms/accepted snapshot khớp; deposit=50001.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-QUOTE-002 — FX làm tròn

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, BUYER assigned, customer
- Điều kiện/fixture: Custom order REQUESTED, quote total=100001; thời gian cố định; versions 1/2.

**Các bước**

1. convertFx sourceMinor=1 numerator=3 denominator=2
2. thử denominator=0 và overflow

**Mong đợi:** Kết quả ceil=2; zero/invalid/overflow bị từ chối; không dùng floating drift.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-QUOTE-003 — Discount vượt phạm vi

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, BUYER assigned, customer
- Điều kiện/fixture: Custom order REQUESTED, quote total=100001; thời gian cố định; versions 1/2.

**Các bước**

1. Đặt discount bằng và lớn hơn service+internationalShipping

**Mong đợi:** Biên cho phép nhận; vượt phạm vi bị từ chối; goods không bị giảm tùy ý.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-QUOTE-004 — Báo giá hết hạn

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, BUYER assigned, customer
- Điều kiện/fixture: Custom order REQUESTED, quote total=100001; thời gian cố định; versions 1/2.

**Các bước**

1. Accept tại expiresAt−1, expiresAt và expiresAt+1 theo evolve source

**Mong đợi:** Chấp thuận chỉ trong hạn source cho phép; không mutate khi đã hết hạn.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-QUOTE-005 — Khách accept bản cũ

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, BUYER assigned, customer
- Điều kiện/fixture: Custom order REQUESTED, quote total=100001; thời gian cố định; versions 1/2.

**Các bước**

1. Issue quote v2 trong lúc A đang đọc v1
2. accept v1

**Mong đợi:** Conflict/version failure; yêu cầu đọc lại; không dùng terms cũ.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-QUOTE-006 — Thay quote sau accept

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, BUYER assigned, customer
- Điều kiện/fixture: Custom order REQUESTED, quote total=100001; thời gian cố định; versions 1/2.

**Các bước**

1. Accept v1
2. staff thử issueQuote khác trên order đó

**Mong đợi:** Không âm thầm thay báo giá đã chấp thuận; giữ acceptance/history.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-QUOTE-007 — Buyer chưa được phân công

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, BUYER assigned, customer
- Điều kiện/fixture: Custom order REQUESTED, quote total=100001; thời gian cố định; versions 1/2.

**Các bước**

1. BUYER issueQuote/claimPurchase vào order ngoài orderIds
2. lặp khi assigned

**Mong đợi:** Ngoài phạm vi bị deny; assignment đúng mới được phép theo grants.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-QUOTE-008 — Catalog bị ép luồng quote

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, BUYER assigned, customer
- Điều kiện/fixture: Custom order REQUESTED, quote total=100001; thời gian cố định; versions 1/2.

**Các bước**

1. Tạo catalog
2. gọi issueQuote/acceptQuote như custom

**Mong đợi:** Không thêm lần báo giá/deposit mới cho catalog; snapshot giá vẫn nhất quán.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## LIFE — State machine và procurement

### SG-LIFE-001 — Thiếu tiền mua

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: BUYER assigned, WAREHOUSE, OWNER, customer
- Điều kiện/fixture: Custom accepted total=100001 deposit=50001; lines=[2,3]; available funds khác nhau.

**Các bước**

1. claimPurchase với collected=50000 rồi 50001
2. thử catalog còn thiếu 1 VND

**Mong đợi:** Chặn thiếu tiền; nhận đủ verified funds mới mua; catalog cần đủ payable.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/operations/Workbench.tsx](../../../src/features/operations/Workbench.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-LIFE-002 — Mua từng phần

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: BUYER assigned, WAREHOUSE, OWNER, customer
- Điều kiện/fixture: Custom accepted total=100001 deposit=50001; lines=[2,3]; available funds khác nhau.

**Các bước**

1. recordPurchase line0=1
2. line0=1
3. line1=3
4. đọc purchasedLines

**Mong đợi:** Cộng đúng số lượng; chỉ hoàn tất mua khi đủ các dòng.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/operations/Workbench.tsx](../../../src/features/operations/Workbench.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-LIFE-003 — Mua vượt hoặc trùng dòng

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: BUYER assigned, WAREHOUSE, OWNER, customer
- Điều kiện/fixture: Custom accepted total=100001 deposit=50001; lines=[2,3]; available funds khác nhau.

**Các bước**

1. recordPurchase vượt ceiling, duplicate line indexes, line không tồn tại

**Mong đợi:** Reject atomic; không tăng tổng hay thêm evidence/audit thành công.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/operations/Workbench.tsx](../../../src/features/operations/Workbench.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-LIFE-004 — Nhận tại kho đúng dòng

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: BUYER assigned, WAREHOUSE, OWNER, customer
- Điều kiện/fixture: Custom accepted total=100001 deposit=50001; lines=[2,3]; available funds khác nhau.

**Các bước**

1. receive đúng từng line
2. thử tổng đúng nhưng gán vào line chưa mua

**Mong đợi:** Không nhận vượt purchasedLines; aggregate không che lỗi sai dòng.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/operations/Workbench.tsx](../../../src/features/operations/Workbench.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-LIFE-005 — Nhận thiếu tạo hold

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: BUYER assigned, WAREHOUSE, OWNER, customer
- Điều kiện/fixture: Custom accepted total=100001 deposit=50001; lines=[2,3]; available funds khác nhau.

**Các bước**

1. receive một phần
2. thử pack và dispatch

**Mong đợi:** Hold/nghiệp vụ thiếu hàng được giữ; không đóng gói hoặc xuất gửi đủ giả.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/operations/Workbench.tsx](../../../src/features/operations/Workbench.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-LIFE-006 — Đóng gói đủ

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: BUYER assigned, WAREHOUSE, OWNER, customer
- Điều kiện/fixture: Custom accepted total=100001 deposit=50001; lines=[2,3]; available funds khác nhau.

**Các bước**

1. Nhận đủ
2. pack quantity đủ và checklist
3. kiểm tra packingComplete

**Mong đợi:** Đúng state và quantities; thiếu checklist hoặc thiếu lượng không được ready.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/operations/Workbench.tsx](../../../src/features/operations/Workbench.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-LIFE-007 — Chốt chi phí custom

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: BUYER assigned, WAREHOUSE, OWNER, customer
- Điều kiện/fixture: Custom accepted total=100001 deposit=50001; lines=[2,3]; available funds khác nhau.

**Các bước**

1. finalize số tiền khác quote
2. approveFinal current version
3. kiểm tra due

**Mong đợi:** Cần chấp thuận tăng nghĩa vụ theo source; không dispatch trước final approval.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/operations/Workbench.tsx](../../../src/features/operations/Workbench.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-LIFE-008 — Hủy và hold

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: BUYER assigned, WAREHOUSE, OWNER, customer
- Điều kiện/fixture: Custom accepted total=100001 deposit=50001; lines=[2,3]; available funds khác nhau.

**Các bước**

1. Customer cancel ở từng stage cho phép
2. staff hold rồi thử claim/dispatch

**Mong đợi:** Chuyển state đúng điều kiện; đã mua/đang vận chuyển không hủy tùy ý; hold chặn thao tác nhạy cảm.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/operations/Workbench.tsx](../../../src/features/operations/Workbench.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-LIFE-009 — State không hợp lệ

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: BUYER assigned, WAREHOUSE, OWNER, customer
- Điều kiện/fixture: Custom accepted total=100001 deposit=50001; lines=[2,3]; available funds khác nhau.

**Các bước**

1. Thử track trước dispatch, confirmReceipt trước delivered, recordPurchase sau cancelled

**Mong đợi:** Không nhảy state trái evolve; không ghi timeline thành công khi reject.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/operations/Workbench.tsx](../../../src/features/operations/Workbench.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-LIFE-010 — Version concurrent

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: BUYER assigned, WAREHOUSE, OWNER, customer
- Điều kiện/fixture: Custom accepted total=100001 deposit=50001; lines=[2,3]; available funds khác nhau.

**Các bước**

1. Hai staff gọi command cùng expectedVersion với payload khác

**Mong đợi:** Một commit hợp lệ; bên còn lại conflict; không mất cập nhật.

**Đối chiếu source:** [packages/domain/index.ts](../../../packages/domain/index.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/operations/Workbench.tsx](../../../src/features/operations/Workbench.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## PAY — Payment intent, webhook và reconcile

### SG-PAY-001 — Release gate payments

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, provider sandbox, FINANCE
- Điều kiện/fixture: Catalog/custom order; fake provider adapter; release gate hiện đóng; bank fixture synthetic.

**Các bước**

1. Gọi createPaymentLink và webhook khi capability payments=false
2. chỉnh settings enabled

**Mong đợi:** Gate code vẫn chặn provider; settings không mở khóa; không gọi network thanh toán.

**Đối chiếu source:** [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [packages/domain/payment-qr.ts](../../../packages/domain/payment-qr.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PAY-002 — Purpose full/deposit/balance

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, provider sandbox, FINANCE
- Điều kiện/fixture: Catalog/custom order; fake provider adapter; release gate hiện đóng; bank fixture synthetic.

**Các bước**

1. Tính paymentDue cho catalog, custom trước final, custom sau final
2. gửi purpose sai

**Mong đợi:** Đúng mục đích source; catalog không phát sinh lần thu thứ hai; purpose sai bị deny.

**Đối chiếu source:** [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [packages/domain/payment-qr.ts](../../../packages/domain/payment-qr.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PAY-003 — Không đồng nhất QR với tiền

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, provider sandbox, FINANCE
- Điều kiện/fixture: Catalog/custom order; fake provider adapter; release gate hiện đóng; bank fixture synthetic.

**Các bước**

1. Tạo QR/fake redirect/report transfer
2. đọc collected trước callback verified

**Mong đợi:** Không thay collected hoặc cho phép mua chỉ từ QR/redirect/lời khách.

**Đối chiếu source:** [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [packages/domain/payment-qr.ts](../../../packages/domain/payment-qr.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PAY-004 — Signature sai

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, provider sandbox, FINANCE
- Điều kiện/fixture: Catalog/custom order; fake provider adapter; release gate hiện đóng; bank fixture synthetic.

**Các bước**

1. Ở harness gọi verifier với signature thiếu/sai và body bị sửa

**Mong đợi:** Không apply payment; không lộ secret; response không ghi payment verified.

**Đối chiếu source:** [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [packages/domain/payment-qr.ts](../../../packages/domain/payment-qr.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PAY-005 — Webhook trùng

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, provider sandbox, FINANCE
- Điều kiện/fixture: Catalog/custom order; fake provider adapter; release gate hiện đóng; bank fixture synthetic.

**Các bước**

1. Harness gửi cùng verified transaction 3 lần
2. race với reconcile

**Mong đợi:** Một receipt và ledger entry; tổng collected tăng một lần.

**Đối chiếu source:** [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [packages/domain/payment-qr.ts](../../../packages/domain/payment-qr.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PAY-006 — Sai số tiền hoặc context

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, provider sandbox, FINANCE
- Điều kiện/fixture: Catalog/custom order; fake provider adapter; release gate hiện đóng; bank fixture synthetic.

**Các bước**

1. Harness callback sai orderCode, amount, currency hoặc payment intent đã hết hiệu lực

**Mong đợi:** Không allocate nhầm order; exception/deny theo source, audit đủ để đối soát.

**Đối chiếu source:** [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [packages/domain/payment-qr.ts](../../../packages/domain/payment-qr.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PAY-007 — Mất response create intent

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, provider sandbox, FINANCE
- Điều kiện/fixture: Catalog/custom order; fake provider adapter; release gate hiện đóng; bank fixture synthetic.

**Các bước**

1. Fake provider tạo link rồi timeout
2. retry cùng operationId

**Mong đợi:** Không tạo nhiều liability/intent không quản lý; xác định unknown và reconcile đúng contract.

**Đối chiếu source:** [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [packages/domain/payment-qr.ts](../../../packages/domain/payment-qr.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PAY-008 — Callback sau hủy order

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, provider sandbox, FINANCE
- Điều kiện/fixture: Catalog/custom order; fake provider adapter; release gate hiện đóng; bank fixture synthetic.

**Các bước**

1. Harness apply verified payment cho cancelled order

**Mong đợi:** Không hồi sinh order; tiền đi qua exception/handling theo source, không tự fulfillment.

**Đối chiếu source:** [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [packages/domain/payment-qr.ts](../../../packages/domain/payment-qr.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PAY-009 — Provider sandbox trực tiếp

- Priority: **P0** · Status: **NOT_RUN** · Environment: `APPROVED_PROVIDER_SANDBOX`
- Vai trò: customer, provider sandbox, FINANCE
- Điều kiện/fixture: Catalog/custom order; fake provider adapter; release gate hiện đóng; bank fixture synthetic.
- Điều kiện chưa đủ: `CURRENT_CODE_OWNED_PROVIDER_HOLD; AUTHORIZATION_AND_CANDIDATE_REQUIRED`

**Các bước**

1. Sau approval mở provider sandbox
2. tạo link và trả callback thật
3. đọc provider và DB

**Mong đợi:** Chỉ PASS khi có sandbox readback, signature và amount thực; hiện BLOCKED bởi release gate.

**Đối chiếu source:** [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [packages/domain/payment-qr.ts](../../../packages/domain/payment-qr.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## FIN — Đối soát, reversal và exceptions

### SG-FIN-001 — Xác minh chuyển khoản

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: FINANCE, OWNER
- Điều kiện/fixture: Pending transfer reviews; bank IDs synthetic unique; ledger before/after; MFA fixture.

**Các bước**

1. verifyTransfer đúng order/amount/reviewId với reason/evidence
2. đọc bank và ledger

**Mong đợi:** Một allocation bất biến; review khớp owner/order/amount; collected tăng đúng.

**Đối chiếu source:** [functions/src/finance-review.ts](../../../functions/src/finance-review.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/payments/Finance.tsx](../../../src/features/payments/Finance.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-FIN-002 — Bank transaction tái sử dụng

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: FINANCE, OWNER
- Điều kiện/fixture: Pending transfer reviews; bank IDs synthetic unique; ledger before/after; MFA fixture.

**Các bước**

1. Allocate bank ID vào order A
2. thử vào B với operationId mới

**Mong đợi:** Từ chối double allocation xuyên orders; A/B totals không sai.

**Đối chiếu source:** [functions/src/finance-review.ts](../../../functions/src/finance-review.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/payments/Finance.tsx](../../../src/features/payments/Finance.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-FIN-003 — Review context lệch

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: FINANCE, OWNER
- Điều kiện/fixture: Pending transfer reviews; bank IDs synthetic unique; ledger before/after; MFA fixture.

**Các bước**

1. Gửi reviewId của B vào A
2. thay amount hoặc review đã xử lý

**Mong đợi:** Reject atomic; không đóng review khác hoặc tạo ledger.

**Đối chiếu source:** [functions/src/finance-review.ts](../../../functions/src/finance-review.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/payments/Finance.tsx](../../../src/features/payments/Finance.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-FIN-004 — Hoàn tiền vượt available

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: FINANCE, OWNER
- Điều kiện/fixture: Pending transfer reviews; bank IDs synthetic unique; ledger before/after; MFA fixture.

**Các bước**

1. Gọi refund lớn hơn collected−refunded−refundReserved
2. thử biên đúng available

**Mong đợi:** Vượt bị chặn; đúng available giữ tổng không âm và reserved nhất quán.

**Đối chiếu source:** [functions/src/finance-review.ts](../../../functions/src/finance-review.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/payments/Finance.tsx](../../../src/features/payments/Finance.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-FIN-005 — Reversal có version

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: FINANCE, OWNER
- Điều kiện/fixture: Pending transfer reviews; bank IDs synthetic unique; ledger before/after; MFA fixture.

**Các bước**

1. Reverse ledger hợp lệ
2. retry
3. thử reverse lần hai bằng operationId mới

**Mong đợi:** Không đảo hai lần; entry nguồn immutable; counter và audit đúng.

**Đối chiếu source:** [functions/src/finance-review.ts](../../../functions/src/finance-review.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/payments/Finance.tsx](../../../src/features/payments/Finance.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-FIN-006 — Exception allocate/close

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: FINANCE, OWNER
- Điều kiện/fixture: Pending transfer reviews; bank IDs synthetic unique; ledger before/after; MFA fixture.

**Các bước**

1. Tạo unallocated exception fixture
2. allocate đúng order
3. close với reason
4. thử stale version

**Mong đợi:** Không coi close là nhận tiền; allocation giữ uniqueness; stale conflict.

**Đối chiếu source:** [functions/src/finance-review.ts](../../../functions/src/finance-review.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/payments/Finance.tsx](../../../src/features/payments/Finance.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-FIN-007 — Thiếu MFA gần đây

- Priority: **P0** · Status: **NOT_RUN** · Environment: `APPROVED_STAGING`
- Vai trò: FINANCE, OWNER
- Điều kiện/fixture: Pending transfer reviews; bank IDs synthetic unique; ledger before/after; MFA fixture.
- Điều kiện chưa đủ: `STAGING_AUTHORIZATION_AND_SAFE_FIXTURES_REQUIRED`

**Các bước**

1. Trong staging được phép thử verifyTransfer/refund/reverse không factor hoặc expired auth_time

**Mong đợi:** Không commit tài chính; emulator bypass không được dùng làm bằng chứng MFA thật.

**Đối chiếu source:** [functions/src/finance-review.ts](../../../functions/src/finance-review.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/payments/Finance.tsx](../../../src/features/payments/Finance.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-FIN-008 — Mất kết nối finance UI

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: FINANCE, OWNER
- Điều kiện/fixture: Pending transfer reviews; bank IDs synthetic unique; ledger before/after; MFA fixture.

**Các bước**

1. Load finance
2. fail page request
3. retry
4. đổi filter trong request cũ

**Mong đợi:** Không hiện số 0 thay unknown; retry giữ scope và không trùng hàng.

**Đối chiếu source:** [functions/src/finance-review.ts](../../../functions/src/finance-review.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/payments/Finance.tsx](../../../src/features/payments/Finance.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## CHANGE — Đổi hàng, hủy một phần và customer consent

### SG-CHANGE-001 — Đề xuất đổi dòng chưa mua

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order hai dòng, line0 đã mua=2, line1 chưa mua=3; versions cố định.

**Các bước**

1. Propose variant khác cho line1
2. customer accept
3. staff apply

**Mong đợi:** Chỉ đổi phần chưa mua được đồng ý; financial/history ghi đủ reason và versions.

**Đối chiếu source:** [functions/src/changes.ts](../../../functions/src/changes.ts), [packages/domain/changes.ts](../../../packages/domain/changes.ts), [src/features/orders/Changes.tsx](../../../src/features/orders/Changes.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CHANGE-002 — Đổi dòng đã mua

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order hai dòng, line0 đã mua=2, line1 chưa mua=3; versions cố định.

**Các bước**

1. Propose sửa variant line0 hoặc multi-line chứa line0 đã mua

**Mong đợi:** Chặn cả proposal/apply không hợp lệ; line đã mua không bị rewrite.

**Đối chiếu source:** [functions/src/changes.ts](../../../functions/src/changes.ts), [packages/domain/changes.ts](../../../packages/domain/changes.ts), [src/features/orders/Changes.tsx](../../../src/features/orders/Changes.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CHANGE-003 — Đổi quantity ngầm

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order hai dòng, line0 đã mua=2, line1 chưa mua=3; versions cố định.

**Các bước**

1. Substitution thay quantity từ 3 lên 4 không qua contract cho phép

**Mong đợi:** Reject; không tăng nghĩa vụ hay purchased ceiling ngầm.

**Đối chiếu source:** [functions/src/changes.ts](../../../functions/src/changes.ts), [packages/domain/changes.ts](../../../packages/domain/changes.ts), [src/features/orders/Changes.tsx](../../../src/features/orders/Changes.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CHANGE-004 — Hủy phần chưa mua

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order hai dòng, line0 đã mua=2, line1 chưa mua=3; versions cố định.

**Các bước**

1. Propose cancel quantity chưa mua
2. accept
3. apply

**Mong đợi:** Giữ số đã mua; chi phí thực tế và refund eligibility đúng domain.

**Đối chiếu source:** [functions/src/changes.ts](../../../functions/src/changes.ts), [packages/domain/changes.ts](../../../packages/domain/changes.ts), [src/features/orders/Changes.tsx](../../../src/features/orders/Changes.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CHANGE-005 — Customer reject

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order hai dòng, line0 đã mua=2, line1 chưa mua=3; versions cố định.

**Các bước**

1. Propose hợp lệ
2. customer reject
3. staff thử apply

**Mong đợi:** Không thay order/tiền; proposal ở rejected; hold cleanup theo source.

**Đối chiếu source:** [functions/src/changes.ts](../../../functions/src/changes.ts), [packages/domain/changes.ts](../../../packages/domain/changes.ts), [src/features/orders/Changes.tsx](../../../src/features/orders/Changes.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CHANGE-006 — Apply trước accept

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order hai dòng, line0 đã mua=2, line1 chưa mua=3; versions cố định.

**Các bước**

1. Staff apply pending proposal
2. B accept proposal của A

**Mong đợi:** Không apply chưa consent; cross-owner deny.

**Đối chiếu source:** [functions/src/changes.ts](../../../functions/src/changes.ts), [packages/domain/changes.ts](../../../packages/domain/changes.ts), [src/features/orders/Changes.tsx](../../../src/features/orders/Changes.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CHANGE-007 — Proposal cũ

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order hai dòng, line0 đã mua=2, line1 chưa mua=3; versions cố định.

**Các bước**

1. Thay order.version sau propose
2. accept/apply stale version
3. retry sau reload

**Mong đợi:** Conflict rõ; không áp dụng proposal trên state mới chưa review.

**Đối chiếu source:** [functions/src/changes.ts](../../../functions/src/changes.ts), [packages/domain/changes.ts](../../../packages/domain/changes.ts), [src/features/orders/Changes.tsx](../../../src/features/orders/Changes.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CHANGE-008 — Retry apply

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order hai dòng, line0 đã mua=2, line1 chưa mua=3; versions cố định.

**Các bước**

1. Apply cùng operationId nhiều lần
2. đọc history, refundReserved, finalTotal

**Mong đợi:** Một lần thay state/tiền; không nhân đôi giảm giá hoặc event.

**Đối chiếu source:** [functions/src/changes.ts](../../../functions/src/changes.ts), [packages/domain/changes.ts](../../../packages/domain/changes.ts), [src/features/orders/Changes.tsx](../../../src/features/orders/Changes.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## SHIP — Kiện, tracking và ngày giao

### SG-SHIP-001 — Pack từng kiện

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order lines=[2,3] đủ mua/nhận; parcel P1/P2; timeline synthetic.

**Các bước**

1. packParcel line0=2,line1=1 rồi P2 line1=2
2. đọc allocations

**Mong đợi:** Tổng alloc đúng ceilings; không cần gói mọi hàng trong một kiện.

**Đối chiếu source:** [functions/src/shipping.ts](../../../functions/src/shipping.ts), [packages/domain/shipping.ts](../../../packages/domain/shipping.ts), [functions/src/customer-order-tracking.ts](../../../functions/src/customer-order-tracking.ts), [packages/domain/order-tracking.ts](../../../packages/domain/order-tracking.ts), [src/features/orders/AccountTracking.tsx](../../../src/features/orders/AccountTracking.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SHIP-002 — Over-allocation

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order lines=[2,3] đủ mua/nhận; parcel P1/P2; timeline synthetic.

**Các bước**

1. Hai staff pack cùng số hàng đồng thời
2. thử duplicate line và parcel ID

**Mong đợi:** Không cấp phát vượt hoặc double-count; conflict atomic.

**Đối chiếu source:** [functions/src/shipping.ts](../../../functions/src/shipping.ts), [packages/domain/shipping.ts](../../../packages/domain/shipping.ts), [functions/src/customer-order-tracking.ts](../../../functions/src/customer-order-tracking.ts), [packages/domain/order-tracking.ts](../../../packages/domain/order-tracking.ts), [src/features/orders/AccountTracking.tsx](../../../src/features/orders/AccountTracking.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SHIP-003 — Dispatch thiếu điều kiện

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order lines=[2,3] đủ mua/nhận; parcel P1/P2; timeline synthetic.

**Các bước**

1. dispatchParcel khi hold, thiếu tiền, thiếu finalApproved hoặc thiếu packing

**Mong đợi:** Deny từng biến thể; không tạo customerShipment in_transit giả.

**Đối chiếu source:** [functions/src/shipping.ts](../../../functions/src/shipping.ts), [packages/domain/shipping.ts](../../../packages/domain/shipping.ts), [functions/src/customer-order-tracking.ts](../../../functions/src/customer-order-tracking.ts), [packages/domain/order-tracking.ts](../../../packages/domain/order-tracking.ts), [src/features/orders/AccountTracking.tsx](../../../src/features/orders/AccountTracking.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SHIP-004 — Tracking update

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order lines=[2,3] đủ mua/nhận; parcel P1/P2; timeline synthetic.

**Các bước**

1. Update parcel lần lượt in_transit, delivered
2. customer xem projections

**Mong đợi:** Chỉ kiện đúng owner; source event/timestamp đúng; timeline không đảo nghĩa.

**Đối chiếu source:** [functions/src/shipping.ts](../../../functions/src/shipping.ts), [packages/domain/shipping.ts](../../../packages/domain/shipping.ts), [functions/src/customer-order-tracking.ts](../../../functions/src/customer-order-tracking.ts), [packages/domain/order-tracking.ts](../../../packages/domain/order-tracking.ts), [src/features/orders/AccountTracking.tsx](../../../src/features/orders/AccountTracking.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SHIP-005 — Giao một phần

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order lines=[2,3] đủ mua/nhận; parcel P1/P2; timeline synthetic.

**Các bước**

1. P1 delivered, P2 in_transit
2. customer confirmReceipt

**Mong đợi:** Order không COMPLETED khi còn hàng chưa giao; UI nêu rõ phần còn lại.

**Đối chiếu source:** [functions/src/shipping.ts](../../../functions/src/shipping.ts), [packages/domain/shipping.ts](../../../packages/domain/shipping.ts), [functions/src/customer-order-tracking.ts](../../../functions/src/customer-order-tracking.ts), [packages/domain/order-tracking.ts](../../../packages/domain/order-tracking.ts), [src/features/orders/AccountTracking.tsx](../../../src/features/orders/AccountTracking.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SHIP-006 — Giao lỗi và trả về

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order lines=[2,3] đủ mua/nhận; parcel P1/P2; timeline synthetic.

**Các bước**

1. Parcel failed rồi returned
2. mở return workflow

**Mong đợi:** Không mô tả đã giao thành công; giữ quantities và dấu vết để tiếp nhận hàng trả.

**Đối chiếu source:** [functions/src/shipping.ts](../../../functions/src/shipping.ts), [packages/domain/shipping.ts](../../../packages/domain/shipping.ts), [functions/src/customer-order-tracking.ts](../../../functions/src/customer-order-tracking.ts), [packages/domain/order-tracking.ts](../../../packages/domain/order-tracking.ts), [src/features/orders/AccountTracking.tsx](../../../src/features/orders/AccountTracking.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SHIP-007 — Estimate thủ công

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order lines=[2,3] đủ mua/nhận; parcel P1/P2; timeline synthetic.

**Các bước**

1. setDeliveryEstimate hợp lệ
2. nhập khoảng ngày đảo, timezone khác hoặc note quá dài

**Mong đợi:** Khoảng ngày source-valid; hiển thị ước tính có nguồn, không cam kết chắc chắn.

**Đối chiếu source:** [functions/src/shipping.ts](../../../functions/src/shipping.ts), [packages/domain/shipping.ts](../../../packages/domain/shipping.ts), [functions/src/customer-order-tracking.ts](../../../functions/src/customer-order-tracking.ts), [packages/domain/order-tracking.ts](../../../packages/domain/order-tracking.ts), [src/features/orders/AccountTracking.tsx](../../../src/features/orders/AccountTracking.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SHIP-008 — Tracking lookup ngoài quyền

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order lines=[2,3] đủ mua/nhận; parcel P1/P2; timeline synthetic.

**Các bước**

1. A tra ID/code của B
2. guest thử dữ liệu private

**Mong đợi:** Không lộ người nhận, địa chỉ, nội dung hoặc tồn tại đơn ngoài quyền.

**Đối chiếu source:** [functions/src/shipping.ts](../../../functions/src/shipping.ts), [packages/domain/shipping.ts](../../../packages/domain/shipping.ts), [functions/src/customer-order-tracking.ts](../../../functions/src/customer-order-tracking.ts), [packages/domain/order-tracking.ts](../../../packages/domain/order-tracking.ts), [src/features/orders/AccountTracking.tsx](../../../src/features/orders/AccountTracking.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SHIP-009 — Tracking cùng tên nhiều đơn

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OPERATIONS_MANAGER, customer
- Điều kiện/fixture: Order lines=[2,3] đủ mua/nhận; parcel P1/P2; timeline synthetic.

**Các bước**

1. A có nhiều order và parcel
2. đổi selection nhanh với response delay

**Mong đợi:** State gắn đúng order; không nối tracking/estimate của đơn cũ sang đơn mới.

**Đối chiếu source:** [functions/src/shipping.ts](../../../functions/src/shipping.ts), [packages/domain/shipping.ts](../../../packages/domain/shipping.ts), [functions/src/customer-order-tracking.ts](../../../functions/src/customer-order-tracking.ts), [packages/domain/order-tracking.ts](../../../packages/domain/order-tracking.ts), [src/features/orders/AccountTracking.tsx](../../../src/features/orders/AccountTracking.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## BATCH — Gom kiện và phân bổ cước

### SG-BATCH-001 — Bảo toàn cước

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, WAREHOUSE
- Điều kiện/fixture: Batch 3 parcels, weights=[1,1,1], freight=100001; owners A/B; hold fixture.

**Các bước**

1. allocateFreight 100001 cho weights bằng nhau và lệch
2. cộng các phần

**Mong đợi:** Tổng phân bổ đúng 100001, integer, deterministic; không mất đồng làm tròn.

**Đối chiếu source:** [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [packages/domain/consolidation.ts](../../../packages/domain/consolidation.ts), [packages/domain/index.ts](../../../packages/domain/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BATCH-002 — Weight không hợp lệ

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, WAREHOUSE
- Điều kiện/fixture: Batch 3 parcels, weights=[1,1,1], freight=100001; owners A/B; hold fixture.

**Các bước**

1. Seal weights=0/âm/lẻ/thiếu
2. mismatch cân thực

**Mong đợi:** Từ chối; không seal batch bằng dữ liệu vật lý sai.

**Đối chiếu source:** [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [packages/domain/consolidation.ts](../../../packages/domain/consolidation.ts), [packages/domain/index.ts](../../../packages/domain/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BATCH-003 — Seal trùng parcel

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, WAREHOUSE
- Điều kiện/fixture: Batch 3 parcels, weights=[1,1,1], freight=100001; owners A/B; hold fixture.

**Các bước**

1. Gom cùng parcel vào 2 batch hoặc lặp member

**Mong đợi:** Không double allocation; batch/version nhất quán.

**Đối chiếu source:** [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [packages/domain/consolidation.ts](../../../packages/domain/consolidation.ts), [packages/domain/index.ts](../../../packages/domain/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BATCH-004 — Member chưa sẵn sàng

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, WAREHOUSE
- Điều kiện/fixture: Batch 3 parcels, weights=[1,1,1], freight=100001; owners A/B; hold fixture.

**Các bước**

1. Dispatch batch có một order held, unfunded hoặc chưa final freight approval

**Mong đợi:** Chặn toàn batch atomically; không gửi các member còn lại trước.

**Đối chiếu source:** [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [packages/domain/consolidation.ts](../../../packages/domain/consolidation.ts), [packages/domain/index.ts](../../../packages/domain/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BATCH-005 — Freight version mới

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, WAREHOUSE
- Điều kiện/fixture: Batch 3 parcels, weights=[1,1,1], freight=100001; owners A/B; hold fixture.

**Các bước**

1. Seal/change freight làm version tăng
2. dùng approval version cũ để dispatch

**Mong đợi:** Phải đồng ý freight version hiện hành; không thu cước mới ngầm.

**Đối chiếu source:** [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [packages/domain/consolidation.ts](../../../packages/domain/consolidation.ts), [packages/domain/index.ts](../../../packages/domain/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BATCH-006 — Catalog trong batch

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, WAREHOUSE
- Điều kiện/fixture: Batch 3 parcels, weights=[1,1,1], freight=100001; owners A/B; hold fixture.

**Các bước**

1. Gom catalog với custom
2. ghi freight nội bộ
3. đọc payable catalog

**Mong đợi:** Catalog không tăng giá all-inclusive hoặc tạo balance charge mới.

**Đối chiếu source:** [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [packages/domain/consolidation.ts](../../../packages/domain/consolidation.ts), [packages/domain/index.ts](../../../packages/domain/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BATCH-007 — Projection theo owner

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, WAREHOUSE
- Điều kiện/fixture: Batch 3 parcels, weights=[1,1,1], freight=100001; owners A/B; hold fixture.

**Các bước**

1. Dispatch batch mixed A/B
2. A/B đọc customerShipments

**Mong đợi:** Mỗi người thấy kiện của mình; không thấy manifest/địa chỉ người khác.

**Đối chiếu source:** [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [packages/domain/consolidation.ts](../../../packages/domain/consolidation.ts), [packages/domain/index.ts](../../../packages/domain/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BATCH-008 — Race seal/dispatch

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, OPERATIONS_MANAGER, WAREHOUSE
- Điều kiện/fixture: Batch 3 parcels, weights=[1,1,1], freight=100001; owners A/B; hold fixture.

**Các bước**

1. Hai staff seal hoặc dispatch cùng expectedVersion
2. retry lost response

**Mong đợi:** Một kết quả; không tạo duplicate shipments/history hoặc phân bổ cước.

**Đối chiếu source:** [functions/src/consolidation.ts](../../../functions/src/consolidation.ts), [packages/domain/consolidation.ts](../../../packages/domain/consolidation.ts), [packages/domain/index.ts](../../../packages/domain/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## RETURN — Nhận, kiểm tra và đóng hàng trả

### SG-RETURN-001 — Receive return

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OWNER, OPERATIONS_MANAGER
- Điều kiện/fixture: Parcel returned; inspected/uninspected return fixtures; quantity lineage.

**Các bước**

1. Receive đúng parcel returned
2. đọc return record và event

**Mong đợi:** Gắn đúng nguồn và lượng; không giả refund đã hoàn tất.

**Đối chiếu source:** [functions/src/returns.ts](../../../functions/src/returns.ts), [src/features/operations/Returns.tsx](../../../src/features/operations/Returns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RETURN-002 — Inspect condition

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OWNER, OPERATIONS_MANAGER
- Điều kiện/fixture: Parcel returned; inspected/uninspected return fixtures; quantity lineage.

**Các bước**

1. Inspect accepted và damaged với condition/reason hợp lệ

**Mong đợi:** Trạng thái kiểm tra đúng; dữ liệu vật lý/audit đủ trước close.

**Đối chiếu source:** [functions/src/returns.ts](../../../functions/src/returns.ts), [src/features/operations/Returns.tsx](../../../src/features/operations/Returns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RETURN-003 — Sai action fields

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OWNER, OPERATIONS_MANAGER
- Điều kiện/fixture: Parcel returned; inspected/uninspected return fixtures; quantity lineage.

**Các bước**

1. receive kèm condition
2. inspect thiếu condition
3. ID không tồn tại

**Mong đợi:** Schema/flow từ chối; không tạo return không có lineage.

**Đối chiếu source:** [functions/src/returns.ts](../../../functions/src/returns.ts), [src/features/operations/Returns.tsx](../../../src/features/operations/Returns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RETURN-004 — Close trước inspect

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OWNER, OPERATIONS_MANAGER
- Điều kiện/fixture: Parcel returned; inspected/uninspected return fixtures; quantity lineage.

**Các bước**

1. Close return mới receive chưa inspect

**Mong đợi:** Không hoàn tất return thiếu bước kiểm tra bắt buộc.

**Đối chiếu source:** [functions/src/returns.ts](../../../functions/src/returns.ts), [src/features/operations/Returns.tsx](../../../src/features/operations/Returns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RETURN-005 — Close return hợp lệ

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OWNER, OPERATIONS_MANAGER
- Điều kiện/fixture: Parcel returned; inspected/uninspected return fixtures; quantity lineage.

**Các bước**

1. Receive rồi inspect rồi close
2. mở customer order và finance

**Mong đợi:** Đúng state, không phát sinh tiền ngoài financial authority.

**Đối chiếu source:** [functions/src/returns.ts](../../../functions/src/returns.ts), [src/features/operations/Returns.tsx](../../../src/features/operations/Returns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RETURN-006 — Version conflict và retry

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OWNER, OPERATIONS_MANAGER
- Điều kiện/fixture: Parcel returned; inspected/uninspected return fixtures; quantity lineage.

**Các bước**

1. Hai warehouse inspect cùng version
2. replay close operationId

**Mong đợi:** Một commit; không nhân đôi return quantity hoặc close history.

**Đối chiếu source:** [functions/src/returns.ts](../../../functions/src/returns.ts), [src/features/operations/Returns.tsx](../../../src/features/operations/Returns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RETURN-007 — Vai trò không được phép

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OWNER, OPERATIONS_MANAGER
- Điều kiện/fixture: Parcel returned; inspected/uninspected return fixtures; quantity lineage.

**Các bước**

1. Customer/BUYER gọi receive,inspect,close
2. staff locked thử lại

**Mong đợi:** Deny server dù tự mở route returns.

**Đối chiếu source:** [functions/src/returns.ts](../../../functions/src/returns.ts), [src/features/operations/Returns.tsx](../../../src/features/operations/Returns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RETURN-008 — Hàng trả khác order

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: WAREHOUSE, OWNER, OPERATIONS_MANAGER
- Điều kiện/fixture: Parcel returned; inspected/uninspected return fixtures; quantity lineage.

**Các bước**

1. Gửi parcel/order mismatch và quantity vượt nguồn

**Mong đợi:** Không quy sai hàng trả hoặc giải phóng nghĩa vụ nhầm order.

**Đối chiếu source:** [functions/src/returns.ts](../../../functions/src/returns.ts), [src/features/operations/Returns.tsx](../../../src/features/operations/Returns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## REFUND — Yêu cầu hoàn tiền và reservation

### SG-REFUND-001 — Request refund

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE
- Điều kiện/fixture: Order collected=100001 refunded=10000; pending reservation=20000.

**Các bước**

1. request amount hợp lệ với reason
2. đọc refund và reserved

**Mong đợi:** Tạo pending request/reservation; chưa tăng refunded hoặc báo đã trả tiền.

**Đối chiếu source:** [functions/src/refunds.ts](../../../functions/src/refunds.ts), [src/features/payments/Refunds.tsx](../../../src/features/payments/Refunds.tsx), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REFUND-002 — Refund dùng tiền reserved

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE
- Điều kiện/fixture: Order collected=100001 refunded=10000; pending reservation=20000.

**Các bước**

1. Sau request thử claimPurchase/dispatch dựa trên collected tổng

**Mong đợi:** Chỉ available net funds tài trợ; reservation chặn sử dụng tiền đó.

**Đối chiếu source:** [functions/src/refunds.ts](../../../functions/src/refunds.ts), [src/features/payments/Refunds.tsx](../../../src/features/payments/Refunds.tsx), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REFUND-003 — Hai request race

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE
- Điều kiện/fixture: Order collected=100001 refunded=10000; pending reservation=20000.

**Các bước**

1. Request cùng available amount đồng thời bằng ID khác

**Mong đợi:** Không reserve quá available; reject/serialize an toàn.

**Đối chiếu source:** [functions/src/refunds.ts](../../../functions/src/refunds.ts), [src/features/payments/Refunds.tsx](../../../src/features/payments/Refunds.tsx), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REFUND-004 — Cancel pending

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE
- Điều kiện/fixture: Order collected=100001 refunded=10000; pending reservation=20000.

**Các bước**

1. Cancel pending refund
2. thử cancel sau confirmed

**Mong đợi:** Pending release đúng reservation; confirmed không rollback tiền bằng cancel.

**Đối chiếu source:** [functions/src/refunds.ts](../../../functions/src/refunds.ts), [src/features/payments/Refunds.tsx](../../../src/features/payments/Refunds.tsx), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REFUND-005 — Confirm khớp request

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE
- Điều kiện/fixture: Order collected=100001 refunded=10000; pending reservation=20000.

**Các bước**

1. Finance refund đúng refundRequestId/amount/bank evidence

**Mong đợi:** Reserved giảm và refunded tăng đúng một lần; bank uniqueness.

**Đối chiếu source:** [functions/src/refunds.ts](../../../functions/src/refunds.ts), [src/features/payments/Refunds.tsx](../../../src/features/payments/Refunds.tsx), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REFUND-006 — Confirm sai request

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE
- Điều kiện/fixture: Order collected=100001 refunded=10000; pending reservation=20000.

**Các bước**

1. Refund ID của order khác, amount mismatch, state cancelled

**Mong đợi:** Deny atomic; không tiêu reservation khác.

**Đối chiếu source:** [functions/src/refunds.ts](../../../functions/src/refunds.ts), [src/features/payments/Refunds.tsx](../../../src/features/payments/Refunds.tsx), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REFUND-007 — Retry lost response

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE
- Điều kiện/fixture: Order collected=100001 refunded=10000; pending reservation=20000.

**Các bước**

1. Replay request,cancel,confirm với operationId cũ

**Mong đợi:** Một effect; counter reserved không âm; event không trùng.

**Đối chiếu source:** [functions/src/refunds.ts](../../../functions/src/refunds.ts), [src/features/payments/Refunds.tsx](../../../src/features/payments/Refunds.tsx), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REFUND-008 — Refund sau ready

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE
- Điều kiện/fixture: Order collected=100001 refunded=10000; pending reservation=20000.

**Các bước**

1. Reserve/confirm refund trên order READY_TO_SHIP
2. thử dispatch

**Mong đợi:** Funds được recheck; không xuất gửi order thiếu tiền sau refund.

**Đối chiếu source:** [functions/src/refunds.ts](../../../functions/src/refunds.ts), [src/features/payments/Refunds.tsx](../../../src/features/payments/Refunds.tsx), [functions/src/index.ts](../../../functions/src/index.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## DOC — Hóa đơn, chứng từ và chia sẻ

### SG-DOC-001 — Draft từ order

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.

**Các bước**

1. createDraft current source
2. đối chiếu goods,fees,discount,payments,balance và snapshot

**Mong đợi:** Tổng/loại đơn/owner chính xác; draft không xuất hiện như issued cho khách.

**Đối chiếu source:** [functions/src/invoices.ts](../../../functions/src/invoices.ts), [packages/domain/invoices.ts](../../../packages/domain/invoices.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [src/features/invoices/Documents.tsx](../../../src/features/invoices/Documents.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-DOC-002 — Refresh draft

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.

**Các bước**

1. Order thay đổi
2. refreshDraft current version
3. thử refresh issued

**Mong đợi:** Chỉ draft được cập nhật; issued snapshot không thay ngầm.

**Đối chiếu source:** [functions/src/invoices.ts](../../../functions/src/invoices.ts), [packages/domain/invoices.ts](../../../packages/domain/invoices.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [src/features/invoices/Documents.tsx](../../../src/features/invoices/Documents.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-DOC-003 — Issue concurrent

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.

**Các bước**

1. Hai finance issue current draft cùng expectedVersion
2. replay operationId

**Mong đợi:** Một issuance/number; history bất biến; không duplicate sequence.

**Đối chiếu source:** [functions/src/invoices.ts](../../../functions/src/invoices.ts), [packages/domain/invoices.ts](../../../packages/domain/invoices.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [src/features/invoices/Documents.tsx](../../../src/features/invoices/Documents.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-DOC-004 — Void và replacement

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.

**Các bước**

1. Void issued có reason
2. tạo replacement theo contract
3. mở cả hai

**Mong đợi:** Bản cũ thể hiện void; liên kết replacement đúng; không xóa dấu vết.

**Đối chiếu source:** [functions/src/invoices.ts](../../../functions/src/invoices.ts), [packages/domain/invoices.ts](../../../packages/domain/invoices.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [src/features/invoices/Documents.tsx](../../../src/features/invoices/Documents.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-DOC-005 — Seller config

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.

**Các bước**

1. OWNER configure seller
2. FINANCE thử configure
3. thiếu seller fields

**Mong đợi:** Chỉ owner được cấu hình; schema đầy đủ; document đã issue giữ snapshot.

**Đối chiếu source:** [functions/src/invoices.ts](../../../functions/src/invoices.ts), [packages/domain/invoices.ts](../../../packages/domain/invoices.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [src/features/invoices/Documents.tsx](../../../src/features/invoices/Documents.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-DOC-006 — Share hợp lệ và revoke

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.

**Các bước**

1. createShare
2. đọc invoiceShare bằng token runtime
3. revokeShare
4. đọc lại

**Mong đợi:** Chỉ document được share; sau revoke không đọc; token không xuất hiện trong logs/evidence.

**Đối chiếu source:** [functions/src/invoices.ts](../../../functions/src/invoices.ts), [packages/domain/invoices.ts](../../../packages/domain/invoices.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [src/features/invoices/Documents.tsx](../../../src/features/invoices/Documents.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-DOC-007 — List quyền và pagination

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.

**Các bước**

1. A/B invoiceList
2. thử detail draft/issued/void
3. next/back/filter

**Mong đợi:** Chỉ dữ liệu được quyền; issued/void semantics rõ; cursor không trùng.

**Đối chiếu source:** [functions/src/invoices.ts](../../../functions/src/invoices.ts), [packages/domain/invoices.ts](../../../packages/domain/invoices.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [src/features/invoices/Documents.tsx](../../../src/features/invoices/Documents.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-DOC-008 — Email queue gate

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.

**Các bước**

1. queueEmail khi release email=false
2. đọc outbox/UI

**Mong đợi:** Không gửi SMTP; queued/requested khác delivered; gate không thể bypass bằng settings.

**Đối chiếu source:** [functions/src/invoices.ts](../../../functions/src/invoices.ts), [packages/domain/invoices.ts](../../../packages/domain/invoices.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [src/features/invoices/Documents.tsx](../../../src/features/invoices/Documents.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-DOC-009 — In và export

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, customer, share recipient
- Điều kiện/fixture: Seller fixture; order catalog/custom; draft/issued/void documents; token synthetic chỉ trong runtime.

**Các bước**

1. Mở issued statement
2. print desktop/mobile
3. kiểm tra số tiền dài và nhiều lines

**Mong đợi:** Không cắt nội dung/số tiền; status/seller/source snapshot giữ nguyên; không gọi là hóa đơn thuế khi chưa có contract pháp lý.

**Đối chiếu source:** [functions/src/invoices.ts](../../../functions/src/invoices.ts), [packages/domain/invoices.ts](../../../packages/domain/invoices.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [src/features/invoices/Documents.tsx](../../../src/features/invoices/Documents.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## EMAIL — Outbox, retry và unknown delivery

### SG-EMAIL-001 — Gate gửi mail

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, scheduled worker
- Điều kiện/fixture: Synthetic outbox jobs pending/leased/sent/unknown/dead; fake mail adapter; email gate đóng.

**Các bước**

1. Run deliverEmail harness khi capability đóng
2. thử settings bật email

**Mong đợi:** Không gọi SMTP hoặc báo delivered; metadata không chứa secret.

**Đối chiếu source:** [functions/src/email.ts](../../../functions/src/email.ts), [functions/src/outbox-command.ts](../../../functions/src/outbox-command.ts), [functions/src/email-content.ts](../../../functions/src/email-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-EMAIL-002 — Retry job thất bại

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, scheduled worker
- Điều kiện/fixture: Synthetic outbox jobs pending/leased/sent/unknown/dead; fake mail adapter; email gate đóng.

**Các bước**

1. outboxCommand retry job đủ điều kiện
2. worker fake fail rồi success

**Mong đợi:** Attempt/backoff/state đúng source; retry có audit; không tăng attempt vô hạn.

**Đối chiếu source:** [functions/src/email.ts](../../../functions/src/email.ts), [functions/src/outbox-command.ts](../../../functions/src/outbox-command.ts), [functions/src/email-content.ts](../../../functions/src/email-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-EMAIL-003 — Unknown outcome

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, scheduled worker
- Điều kiện/fixture: Synthetic outbox jobs pending/leased/sent/unknown/dead; fake mail adapter; email gate đóng.

**Các bước**

1. Fake provider nhận mail rồi disconnect trước ack
2. worker ghi unknown
3. retry trực tiếp

**Mong đợi:** Không gửi lại mù khi có thể đã gửi; cần resolveUnknown theo evidence.

**Đối chiếu source:** [functions/src/email.ts](../../../functions/src/email.ts), [functions/src/outbox-command.ts](../../../functions/src/outbox-command.ts), [functions/src/email-content.ts](../../../functions/src/email-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-EMAIL-004 — Resolve unknown đã gửi

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, scheduled worker
- Điều kiện/fixture: Synthetic outbox jobs pending/leased/sent/unknown/dead; fake mail adapter; email gate đóng.

**Các bước**

1. resolveUnknown confirmed_sent kèm evidence hợp lệ
2. scheduler quét lại

**Mong đợi:** Job kết thúc đúng outcome; không gửi bản thứ hai.

**Đối chiếu source:** [functions/src/email.ts](../../../functions/src/email.ts), [functions/src/outbox-command.ts](../../../functions/src/outbox-command.ts), [functions/src/email-content.ts](../../../functions/src/email-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-EMAIL-005 — Resolve unknown chưa gửi

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, scheduled worker
- Điều kiện/fixture: Synthetic outbox jobs pending/leased/sent/unknown/dead; fake mail adapter; email gate đóng.

**Các bước**

1. resolveUnknown confirmed_not_sent
2. thực hiện retry được phép

**Mong đợi:** Chỉ retry sau kết luận xác minh; evidence/reason không bị bỏ.

**Đối chiếu source:** [functions/src/email.ts](../../../functions/src/email.ts), [functions/src/outbox-command.ts](../../../functions/src/outbox-command.ts), [functions/src/email-content.ts](../../../functions/src/email-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-EMAIL-006 — Lease concurrent

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, scheduled worker
- Điều kiện/fixture: Synthetic outbox jobs pending/leased/sent/unknown/dead; fake mail adapter; email gate đóng.

**Các bước**

1. Hai worker claim cùng job
2. lease expiry trong fake clock

**Mong đợi:** Một quyền gửi tại một thời điểm; lease cleanup theo contract.

**Đối chiếu source:** [functions/src/email.ts](../../../functions/src/email.ts), [functions/src/outbox-command.ts](../../../functions/src/outbox-command.ts), [functions/src/email-content.ts](../../../functions/src/email-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-EMAIL-007 — Recipient snapshot

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, scheduled worker
- Điều kiện/fixture: Synthetic outbox jobs pending/leased/sent/unknown/dead; fake mail adapter; email gate đóng.

**Các bước**

1. Đổi profile email sau queue
2. đối chiếu recipient trong job và document owner

**Mong đợi:** Dùng recipient/snapshot theo source; không gửi sang owner khác.

**Đối chiếu source:** [functions/src/email.ts](../../../functions/src/email.ts), [functions/src/outbox-command.ts](../../../functions/src/outbox-command.ts), [functions/src/email-content.ts](../../../functions/src/email-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-EMAIL-008 — Template an toàn

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, FINANCE, scheduled worker
- Điều kiện/fixture: Synthetic outbox jobs pending/leased/sent/unknown/dead; fake mail adapter; email gate đóng.

**Các bước**

1. Email content chứa HTML hostile, Unicode và document number dài

**Mong đợi:** Escape/format đúng; link không chứa PII thừa; bằng chứng dùng fake recipient.

**Đối chiếu source:** [functions/src/email.ts](../../../functions/src/email.ts), [functions/src/outbox-command.ts](../../../functions/src/outbox-command.ts), [functions/src/email-content.ts](../../../functions/src/email-content.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## MEM — Membership, gia hạn và quyền lợi

### SG-MEM-001 — Purchase và confirm

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, FINANCE
- Điều kiện/fixture: Plan published price=100001 periodDays=30; active/expired subscriptions; server clock fixed.

**Các bước**

1. Customer purchase
2. finance confirm đúng amount/bank evidence
3. đọc subscription

**Mong đợi:** Invoice pending chưa active; verified confirm kích hoạt kỳ hạn từ server.

**Đối chiếu source:** [functions/src/membership.ts](../../../functions/src/membership.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/membership/Membership.tsx](../../../src/features/membership/Membership.tsx), [src/features/membership/PlanEditor.tsx](../../../src/features/membership/PlanEditor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEM-002 — Gia hạn cùng gói

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, FINANCE
- Điều kiện/fixture: Plan published price=100001 periodDays=30; active/expired subscriptions; server clock fixed.

**Các bước**

1. Active same plan endsAt tương lai
2. confirm renewal

**Mong đợi:** Kéo dài từ endsAt cũ, giữ thời gian trả trước và startsAt theo source.

**Đối chiếu source:** [functions/src/membership.ts](../../../functions/src/membership.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/membership/Membership.tsx](../../../src/features/membership/Membership.tsx), [src/features/membership/PlanEditor.tsx](../../../src/features/membership/PlanEditor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEM-003 — Đổi gói khi còn hạn

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, FINANCE
- Điều kiện/fixture: Plan published price=100001 periodDays=30; active/expired subscriptions; server clock fixed.

**Các bước**

1. Active plan A
2. purchase/confirm plan B

**Mong đợi:** Không tự đổi benefits giữa kỳ; cần commercial migration policy riêng.

**Đối chiếu source:** [functions/src/membership.ts](../../../functions/src/membership.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/membership/Membership.tsx](../../../src/features/membership/Membership.tsx), [src/features/membership/PlanEditor.tsx](../../../src/features/membership/PlanEditor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEM-004 — Biên kỳ hạn

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, FINANCE
- Điều kiện/fixture: Plan published price=100001 periodDays=30; active/expired subscriptions; server clock fixed.

**Các bước**

1. periodDays=1,366,0,367
2. startsAt/endsAt corrupt

**Mong đợi:** Chỉ 1–366 và timestamps integer hợp lệ; không cấp gói vô hạn hoặc kỳ âm.

**Đối chiếu source:** [functions/src/membership.ts](../../../functions/src/membership.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/membership/Membership.tsx](../../../src/features/membership/Membership.tsx), [src/features/membership/PlanEditor.tsx](../../../src/features/membership/PlanEditor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEM-005 — Grant authority

- Priority: **P0** · Status: **NOT_RUN** · Environment: `APPROVED_STAGING`
- Vai trò: customer, OWNER, FINANCE
- Điều kiện/fixture: Plan published price=100001 periodDays=30; active/expired subscriptions; server clock fixed.
- Điều kiện chưa đủ: `STAGING_AUTHORIZATION_AND_SAFE_FIXTURES_REQUIRED`

**Các bước**

1. OWNER grant có MFA
2. FINANCE/customer grant
3. owner thiếu MFA staging

**Mong đợi:** Grant đúng quyền; không vượt authority; emulator không chứng minh MFA.

**Đối chiếu source:** [functions/src/membership.ts](../../../functions/src/membership.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/membership/Membership.tsx](../../../src/features/membership/Membership.tsx), [src/features/membership/PlanEditor.tsx](../../../src/features/membership/PlanEditor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEM-006 — Cancel/request renewal

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, FINANCE
- Điều kiện/fixture: Plan published price=100001 periodDays=30; active/expired subscriptions; server clock fixed.

**Các bước**

1. Bật rồi cancel renewal intent
2. thử cancelInvoice pending và đã confirmed

**Mong đợi:** Ý định gia hạn khác subscription/payment; không hủy quyền lợi đã trả bằng cancel invoice.

**Đối chiếu source:** [functions/src/membership.ts](../../../functions/src/membership.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/membership/Membership.tsx](../../../src/features/membership/Membership.tsx), [src/features/membership/PlanEditor.tsx](../../../src/features/membership/PlanEditor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEM-007 — Discount boundaries

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, FINANCE
- Điều kiện/fixture: Plan published price=100001 periodDays=30; active/expired subscriptions; server clock fixed.

**Các bước**

1. membershipDiscount bps=0,10000,10001
2. cap/minService
3. hết hạn snapshot

**Mong đợi:** Discount đúng cap/minimum/scope; hết hạn không nhận lợi ích ngoài source.

**Đối chiếu source:** [functions/src/membership.ts](../../../functions/src/membership.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/membership/Membership.tsx](../../../src/features/membership/Membership.tsx), [src/features/membership/PlanEditor.tsx](../../../src/features/membership/PlanEditor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEM-008 — Snapshot quote

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, FINANCE
- Điều kiện/fixture: Plan published price=100001 periodDays=30; active/expired subscriptions; server clock fixed.

**Các bước**

1. Accept quote dùng membership
2. đổi published plan benefits
3. đọc accepted quote

**Mong đợi:** Snapshot quote không bị thay lợi ích/giá ngầm.

**Đối chiếu source:** [functions/src/membership.ts](../../../functions/src/membership.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/membership/Membership.tsx](../../../src/features/membership/Membership.tsx), [src/features/membership/PlanEditor.tsx](../../../src/features/membership/PlanEditor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEM-009 — Retry bank confirmation

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, FINANCE
- Điều kiện/fixture: Plan published price=100001 periodDays=30; active/expired subscriptions; server clock fixed.

**Các bước**

1. Confirm cùng invoice/bank bằng nhiều operationId
2. race với grant

**Mong đợi:** Không nhân đôi kỳ hạn/history/allocation; quyền hiện hành được recheck.

**Đối chiếu source:** [functions/src/membership.ts](../../../functions/src/membership.ts), [packages/domain/index.ts](../../../packages/domain/index.ts), [src/features/membership/Membership.tsx](../../../src/features/membership/Membership.tsx), [src/features/membership/PlanEditor.tsx](../../../src/features/membership/PlanEditor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## REM — Reminder, notifications và scheduled maintenance

### SG-REM-001 — Reminder policy

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, worker
- Điều kiện/fixture: A/B notifications; reminder policies active/inactive; canonical demo-satsunicgo clock fixture.

**Các bước**

1. Save valid reminder preferences
2. set invalid values
3. reload account

**Mong đợi:** Lưu đúng owner và schema; không thay billing consent.

**Đối chiếu source:** [functions/src/membership-reminder-policy.ts](../../../functions/src/membership-reminder-policy.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [src/features/notifications/Notifications.tsx](../../../src/features/notifications/Notifications.tsx), [src/features/membership/ReminderSettings.tsx](../../../src/features/membership/ReminderSettings.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REM-002 — Mark read

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, worker
- Điều kiện/fixture: A/B notifications; reminder policies active/inactive; canonical demo-satsunicgo clock fixture.

**Các bước**

1. readNotification của A
2. replay
3. B dùng ID A

**Mong đợi:** Chỉ A được cập nhật; idempotent/read state đúng; cross-owner deny.

**Đối chiếu source:** [functions/src/membership-reminder-policy.ts](../../../functions/src/membership-reminder-policy.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [src/features/notifications/Notifications.tsx](../../../src/features/notifications/Notifications.tsx), [src/features/membership/ReminderSettings.tsx](../../../src/features/membership/ReminderSettings.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REM-003 — Notification pagination

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, worker
- Điều kiện/fixture: A/B notifications; reminder policies active/inactive; canonical demo-satsunicgo clock fixture.

**Các bước**

1. Seed hơn một page
2. next
3. có event mới
4. mark read trong page cũ

**Mong đợi:** Không mất selection hoặc count giả; empty/error được phân biệt.

**Đối chiếu source:** [functions/src/membership-reminder-policy.ts](../../../functions/src/membership-reminder-policy.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [src/features/notifications/Notifications.tsx](../../../src/features/notifications/Notifications.tsx), [src/features/membership/ReminderSettings.tsx](../../../src/features/membership/ReminderSettings.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REM-004 — Link notification

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, worker
- Điều kiện/fixture: A/B notifications; reminder policies active/inactive; canonical demo-satsunicgo clock fixture.

**Các bước**

1. Mở notification đơn/invoice/comment
2. target thiếu hoặc bị thu quyền

**Mong đợi:** Đi đúng entity; target revoked không lộ dữ liệu; có fallback rõ.

**Đối chiếu source:** [functions/src/membership-reminder-policy.ts](../../../functions/src/membership-reminder-policy.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [src/features/notifications/Notifications.tsx](../../../src/features/notifications/Notifications.tsx), [src/features/membership/ReminderSettings.tsx](../../../src/features/membership/ReminderSettings.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REM-005 — Maintenance demo identity

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, worker
- Điều kiện/fixture: A/B notifications; reminder policies active/inactive; canonical demo-satsunicgo clock fixture.

**Các bước**

1. Run harness với project demo-satsunicgo và localhost emulator
2. đổi host/project/actual DB identity từng trường

**Mong đợi:** Chỉ canonical demo được phép chạy non-provider maintenance; mismatch deny.

**Đối chiếu source:** [functions/src/membership-reminder-policy.ts](../../../functions/src/membership-reminder-policy.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [src/features/notifications/Notifications.tsx](../../../src/features/notifications/Notifications.tsx), [src/features/membership/ReminderSettings.tsx](../../../src/features/membership/ReminderSettings.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REM-006 — Reminder dedupe

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, worker
- Điều kiện/fixture: A/B notifications; reminder policies active/inactive; canonical demo-satsunicgo clock fixture.

**Các bước**

1. Quét hai lần cùng time window
2. concurrent worker
3. subscription đã renew

**Mong đợi:** Không notify trùng hoặc nhắc hết hạn sai sau renew.

**Đối chiếu source:** [functions/src/membership-reminder-policy.ts](../../../functions/src/membership-reminder-policy.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [src/features/notifications/Notifications.tsx](../../../src/features/notifications/Notifications.tsx), [src/features/membership/ReminderSettings.tsx](../../../src/features/membership/ReminderSettings.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REM-007 — Published schedule gate

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, worker
- Điều kiện/fixture: A/B notifications; reminder policies active/inactive; canonical demo-satsunicgo clock fixture.

**Các bước**

1. Scheduled post đến hạn trong approved demo
2. ngoài demo capability đóng

**Mong đợi:** Chỉ execution được gate cho phép; không suy ra lịch production đang hoạt động.

**Đối chiếu source:** [functions/src/membership-reminder-policy.ts](../../../functions/src/membership-reminder-policy.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [src/features/notifications/Notifications.tsx](../../../src/features/notifications/Notifications.tsx), [src/features/membership/ReminderSettings.tsx](../../../src/features/membership/ReminderSettings.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-REM-008 — Locked user reminder

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, OWNER, worker
- Điều kiện/fixture: A/B notifications; reminder policies active/inactive; canonical demo-satsunicgo clock fixture.

**Các bước**

1. Khóa account trong khi job chờ
2. worker quét lại

**Mong đợi:** Áp dụng policy hiện hành; không lộ dữ liệu private qua notification delivery.

**Đối chiếu source:** [functions/src/membership-reminder-policy.ts](../../../functions/src/membership-reminder-policy.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts), [src/features/notifications/Notifications.tsx](../../../src/features/notifications/Notifications.tsx), [src/features/membership/ReminderSettings.tsx](../../../src/features/membership/ReminderSettings.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## PROFILE — Profile, địa chỉ và snapshot người nhận

### SG-PROFILE-001 — Save profile

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.

**Các bước**

1. A sửa tên hợp lệ
2. reload
3. đọc CRM customer projection

**Mong đợi:** Tên được normalize theo source; projection đồng nhất; email identity không sửa bằng tên.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/profile/Profile.tsx](../../../src/features/profile/Profile.tsx), [src/features/profile/profile-state.ts](../../../src/features/profile/profile-state.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PROFILE-002 — Biên tên

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.

**Các bước**

1. Tên trắng, quá dài, Unicode tổ hợp và dấu Việt
2. thử trường không cho phép

**Mong đợi:** Validation đúng; không overwrite email_verified/roles/locked.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/profile/Profile.tsx](../../../src/features/profile/Profile.tsx), [src/features/profile/profile-state.ts](../../../src/features/profile/profile-state.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PROFILE-003 — Save address

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.

**Các bước**

1. Tạo và cập nhật address hợp lệ
2. nhập thiếu trường bắt buộc

**Mong đợi:** Đúng owner/address version; input lỗi không mất dữ liệu nhập.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/profile/Profile.tsx](../../../src/features/profile/Profile.tsx), [src/features/profile/profile-state.ts](../../../src/features/profile/profile-state.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PROFILE-004 — Address của người khác

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.

**Các bước**

1. A save/read address B qua ID
2. thử ownerId spoof

**Mong đợi:** Server/Rules deny; không leak địa chỉ B.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/profile/Profile.tsx](../../../src/features/profile/Profile.tsx), [src/features/profile/profile-state.ts](../../../src/features/profile/profile-state.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PROFILE-005 — Recipient snapshot

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.

**Các bước**

1. Gắn recipient vào order/Ask
2. thay address gốc sau accept

**Mong đợi:** Snapshot order không đổi ngầm; thay người nhận cần đúng workflow.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/profile/Profile.tsx](../../../src/features/profile/Profile.tsx), [src/features/profile/profile-state.ts](../../../src/features/profile/profile-state.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PROFILE-006 — Switch account đang save

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.

**Các bước**

1. Save profile A bị delay
2. sign in B
3. resolve A

**Mong đợi:** Không gán tên/address A cho B hoặc hiển thị toast success sai context.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/profile/Profile.tsx](../../../src/features/profile/Profile.tsx), [src/features/profile/profile-state.ts](../../../src/features/profile/profile-state.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PROFILE-007 — Load fail và retry

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.

**Các bước**

1. Fail profile/address fetch
2. sửa draft
3. retry load

**Mong đợi:** Không ghi đè draft bằng null/empty hoặc profile cũ; error khác chưa có địa chỉ.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/profile/Profile.tsx](../../../src/features/profile/Profile.tsx), [src/features/profile/profile-state.ts](../../../src/features/profile/profile-state.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PROFILE-008 — Concurrent profile edit

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: A có profile/address; B profile khác; recipient attached order fixture.

**Các bước**

1. Hai tab save cùng version theo workspace contract
2. reload loser

**Mong đợi:** Conflict được xử lý; không silently mất fields đã commit.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/profile/Profile.tsx](../../../src/features/profile/Profile.tsx), [src/features/profile/profile-state.ts](../../../src/features/profile/profile-state.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## CRM — Khách hàng, notes và follow-up

### SG-CRM-001 — List và search

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.

**Các bước**

1. listCustomers theo query có dấu, filter và cursor
2. mở customer

**Mong đợi:** Đúng khách/phạm vi; tổng số và summary chỉ từ dữ liệu có authority.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts), [packages/domain/crm.ts](../../../packages/domain/crm.ts), [src/features/crm/Customers.tsx](../../../src/features/crm/Customers.tsx), [src/features/crm/Customer.tsx](../../../src/features/crm/Customer.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CRM-002 — Notes nội bộ

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.

**Các bước**

1. saveCustomerNotes hợp lệ
2. đọc customer staff
3. A đọc profile/order của mình

**Mong đợi:** Notes chỉ staff được cấp; không lộ trong customer projections hoặc Ask.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts), [packages/domain/crm.ts](../../../packages/domain/crm.ts), [src/features/crm/Customers.tsx](../../../src/features/crm/Customers.tsx), [src/features/crm/Customer.tsx](../../../src/features/crm/Customer.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CRM-003 — Version notes

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.

**Các bước**

1. Hai staff save notes cùng expectedVersion
2. replay

**Mong đợi:** Một commit; conflict giữ draft; audit đúng actor/version.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts), [packages/domain/crm.ts](../../../packages/domain/crm.ts), [src/features/crm/Customers.tsx](../../../src/features/crm/Customers.tsx), [src/features/crm/Customer.tsx](../../../src/features/crm/Customer.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CRM-004 — Follow-up assignee

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.

**Các bước**

1. Tạo follow-up hợp lệ
2. chọn staff inactive/locked hoặc role không phù hợp

**Mong đợi:** Chỉ assignee đúng policy hiện hành; không phân công dựa metadata cũ.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts), [packages/domain/crm.ts](../../../packages/domain/crm.ts), [src/features/crm/Customers.tsx](../../../src/features/crm/Customers.tsx), [src/features/crm/Customer.tsx](../../../src/features/crm/Customer.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CRM-005 — Follow-up pagination

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.

**Các bước**

1. Nhiều lịch cùng timestamp
2. next/back
3. filter overdue
4. event mới

**Mong đợi:** Cursor ổn định theo source; không bỏ/trùng item do timestamp tie.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts), [packages/domain/crm.ts](../../../packages/domain/crm.ts), [src/features/crm/Customers.tsx](../../../src/features/crm/Customers.tsx), [src/features/crm/Customer.tsx](../../../src/features/crm/Customer.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CRM-006 — Read partial failure

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.

**Các bước**

1. Fail một order/summary request ở detail
2. retry section

**Mong đợi:** Không đổi null/unknown thành zero hoặc đánh dấu healthy sai.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts), [packages/domain/crm.ts](../../../packages/domain/crm.ts), [src/features/crm/Customers.tsx](../../../src/features/crm/Customers.tsx), [src/features/crm/Customer.tsx](../../../src/features/crm/Customer.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CRM-007 — Staff list tối thiểu

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.

**Các bước**

1. listCrmStaff/listFollowUps với role hợp lệ
2. thử customer và staff revoked

**Mong đợi:** Server deny ngoài quyền; projection không lộ metadata/PII ngoài cần thiết.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts), [packages/domain/crm.ts](../../../packages/domain/crm.ts), [src/features/crm/Customers.tsx](../../../src/features/crm/Customers.tsx), [src/features/crm/Customer.tsx](../../../src/features/crm/Customer.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CRM-008 — Dashboard scope

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: SUPPORT, OWNER, OPERATIONS_MANAGER theo endpoint
- Điều kiện/fixture: A/B customers; public profile, private notes; orders/financial aggregates; assignee active/inactive.

**Các bước**

1. operationalDashboard trên dữ liệu nhiều trạng thái và page
2. compare source totals

**Mong đợi:** Không trình bày page subtotal như toàn hệ thống; lỗi một source thể hiện unavailable.

**Đối chiếu source:** [functions/src/crm.ts](../../../functions/src/crm.ts), [packages/domain/crm.ts](../../../packages/domain/crm.ts), [src/features/crm/Customers.tsx](../../../src/features/crm/Customers.tsx), [src/features/crm/Customer.tsx](../../../src/features/crm/Customer.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## WORK — CRM workspace, queues và quyền hiện hành

### SG-WORK-001 — Menu theo vai trò

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: 7 staff roles, customer
- Điều kiện/fixture: OWNER, OPERATIONS_MANAGER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR; locked/inactive variants.

**Các bước**

1. Mở CRM từng role và multi-role
2. so sánh workspacePages

**Mong đợi:** Chỉ work được grant; defaultPage hợp lệ; customer không có CRM authority.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/staff-route.ts](../../../packages/domain/staff-route.ts), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/shared/staff-access.ts](../../../src/shared/staff-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-WORK-002 — Deep link ngoài quyền

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: 7 staff roles, customer
- Điều kiện/fixture: OWNER, OPERATIONS_MANAGER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR; locked/inactive variants.

**Các bước**

1. Nhập trực tiếp mỗi /crm route bằng role thiếu
2. gọi handler trực tiếp

**Mong đợi:** UI denial rõ; server deny độc lập việc hide menu.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/staff-route.ts](../../../packages/domain/staff-route.ts), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/shared/staff-access.ts](../../../src/shared/staff-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-WORK-003 — Legacy staff redirect

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: 7 staff roles, customer
- Điều kiện/fixture: OWNER, OPERATIONS_MANAGER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR; locked/inactive variants.

**Các bước**

1. Mở /staff deep links và route không tồn tại

**Mong đợi:** Redirect được kiểm soát sang CRM; không loop hoặc mở page ngoài quyền.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/staff-route.ts](../../../packages/domain/staff-route.ts), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/shared/staff-access.ts](../../../src/shared/staff-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-WORK-004 — ListWork queues

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: 7 staff roles, customer
- Điều kiện/fixture: OWNER, OPERATIONS_MANAGER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR; locked/inactive variants.

**Các bước**

1. Gọi listWork với kind/filter/cursor hợp lệ của orders,purchasing,warehouse,finance,activity

**Mong đợi:** Bounded results đúng queue và current roles; private fields chỉ đúng scope.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/staff-route.ts](../../../packages/domain/staff-route.ts), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/shared/staff-access.ts](../../../src/shared/staff-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-WORK-005 — Read operations

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: 7 staff roles, customer
- Điều kiện/fixture: OWNER, OPERATIONS_MANAGER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR; locked/inactive variants.

**Các bước**

1. readOrderOperations với staff được phép, BUYER assigned/unassigned và customer

**Mong đợi:** Không lộ internal notes/evidence ngoài quyền; BUYER phạm vi assignment đúng.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/staff-route.ts](../../../packages/domain/staff-route.ts), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/shared/staff-access.ts](../../../src/shared/staff-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-WORK-006 — Thu quyền khi đang xem

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: 7 staff roles, customer
- Điều kiện/fixture: OWNER, OPERATIONS_MANAGER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR; locked/inactive variants.

**Các bước**

1. Load queue
2. revoke/inactive/lock staff
3. page tiếp và submit bằng token cũ

**Mong đợi:** Current staffAccess chặn thao tác và private reads; không tin role cache/client.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/staff-route.ts](../../../packages/domain/staff-route.ts), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/shared/staff-access.ts](../../../src/shared/staff-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-WORK-007 — Role metadata sai kiểu

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: 7 staff roles, customer
- Điều kiện/fixture: OWNER, OPERATIONS_MANAGER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR; locked/inactive variants.

**Các bước**

1. roles string, object, mixed array và unknown role
2. thử read và mutation

**Mong đợi:** Fail closed; không gọi includes trên string để cấp quyền giả.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/staff-route.ts](../../../packages/domain/staff-route.ts), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/shared/staff-access.ts](../../../src/shared/staff-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-WORK-008 — Owner settings

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: 7 staff roles, customer
- Điều kiện/fixture: OWNER, OPERATIONS_MANAGER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR; locked/inactive variants.

**Các bước**

1. readOwnerConfiguration/savePricingPolicy với OWNER và FINANCE/SUPPORT

**Mong đợi:** Chỉ role theo source; version/reason/schema đúng; không lộ secrets.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/staff-route.ts](../../../packages/domain/staff-route.ts), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/shared/staff-access.ts](../../../src/shared/staff-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-WORK-009 — Staff access management

- Priority: **P0** · Status: **NOT_RUN** · Environment: `APPROVED_STAGING`
- Vai trò: 7 staff roles, customer
- Điều kiện/fixture: OWNER, OPERATIONS_MANAGER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR; locked/inactive variants.
- Điều kiện chưa đủ: `STAGING_AUTHORIZATION_AND_SAFE_FIXTURES_REQUIRED`

**Các bước**

1. saveStaffAccess grant/revoke/lock
2. target UID sai
3. MFA staging hết hạn

**Mong đợi:** Chỉ owner được phép; target/current metadata được kiểm tra; thay quyền có audit.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/staff-route.ts](../../../packages/domain/staff-route.ts), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/shared/staff-access.ts](../../../src/shared/staff-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## SUP — Support tickets và hội thoại order

### SG-SUP-001 — Open ticket

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, SUPPORT, assigned staff
- Điều kiện/fixture: Ticket A/B; order A/B; private note and public message fixtures.

**Các bước**

1. A openTicket purchase/data-export/data-deletion với nội dung hợp lệ

**Mong đợi:** Ticket đúng owner/purpose; yêu cầu privacy chưa đồng nghĩa đã export/delete dữ liệu.

**Đối chiếu source:** [functions/src/order-conversation.ts](../../../functions/src/order-conversation.ts), [packages/domain/order-conversation.ts](../../../packages/domain/order-conversation.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/support/Support.tsx](../../../src/features/support/Support.tsx), [src/features/support/OrderConversation.tsx](../../../src/features/support/OrderConversation.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SUP-002 — Reply và message

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, SUPPORT, assigned staff
- Điều kiện/fixture: Ticket A/B; order A/B; private note and public message fixtures.

**Các bước**

1. A và authorized staff gửi replyTicket/orderConversation message

**Mong đợi:** Thread đúng entity; actor/time đúng; text validation; một message mỗi operation.

**Đối chiếu source:** [functions/src/order-conversation.ts](../../../functions/src/order-conversation.ts), [packages/domain/order-conversation.ts](../../../packages/domain/order-conversation.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/support/Support.tsx](../../../src/features/support/Support.tsx), [src/features/support/OrderConversation.tsx](../../../src/features/support/OrderConversation.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SUP-003 — Private note

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, SUPPORT, assigned staff
- Điều kiện/fixture: Ticket A/B; order A/B; private note and public message fixtures.

**Các bước**

1. Staff note nội bộ
2. customer đọc conversation/messages

**Mong đợi:** Không lộ notes qua callable, Rules, cache hoặc realtime.

**Đối chiếu source:** [functions/src/order-conversation.ts](../../../functions/src/order-conversation.ts), [packages/domain/order-conversation.ts](../../../packages/domain/order-conversation.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/support/Support.tsx](../../../src/features/support/Support.tsx), [src/features/support/OrderConversation.tsx](../../../src/features/support/OrderConversation.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SUP-004 — Assign conversation

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, SUPPORT, assigned staff
- Điều kiện/fixture: Ticket A/B; order A/B; private note and public message fixtures.

**Các bước**

1. Assign active staff phù hợp
2. thử revoked/missing target

**Mong đợi:** Assignment hợp lệ và có version/audit; target sai bị deny.

**Đối chiếu source:** [functions/src/order-conversation.ts](../../../functions/src/order-conversation.ts), [packages/domain/order-conversation.ts](../../../packages/domain/order-conversation.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/support/Support.tsx](../../../src/features/support/Support.tsx), [src/features/support/OrderConversation.tsx](../../../src/features/support/OrderConversation.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SUP-005 — Messages bounded window và older-history gap

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, SUPPORT, assigned staff
- Điều kiện/fixture: Ticket A/B; order A/B; private note and public message fixtures.

**Các bước**

1. Seed 60 order-conversation messages cùng timestamp; gọi readOrderConversation.
2. Đối chiếu newest bounded window/ordering; thử cursor field ngoài schema.
3. Nếu ticketMessages hỗ trợ paging, chạy pagination riêng theo source; ghi gap older order-conversation history.

**Mong đợi:** Current readOrderConversation đọc limit51 và trả tối đa50 messages, không cursor paging. Window phải đúng ordering/owner; cursor ngoài schema bị từ chối. Không gọi window là toàn bộ lịch sử; older-history paging ghi NOT_IMPLEMENTED nếu acceptance cần, không giả đã có.

**Đối chiếu source:** [functions/src/order-conversation.ts](../../../functions/src/order-conversation.ts), [packages/domain/order-conversation.ts](../../../packages/domain/order-conversation.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/support/Support.tsx](../../../src/features/support/Support.tsx), [src/features/support/OrderConversation.tsx](../../../src/features/support/OrderConversation.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SUP-006 — Cross-owner thread

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, SUPPORT, assigned staff
- Điều kiện/fixture: Ticket A/B; order A/B; private note and public message fixtures.

**Các bước**

1. A mở/reply ticket B
2. sửa orderId/conversationId
3. try direct Rules

**Mong đợi:** Deny toàn bộ; không leak existence hoặc nội dung.

**Đối chiếu source:** [functions/src/order-conversation.ts](../../../functions/src/order-conversation.ts), [packages/domain/order-conversation.ts](../../../packages/domain/order-conversation.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/support/Support.tsx](../../../src/features/support/Support.tsx), [src/features/support/OrderConversation.tsx](../../../src/features/support/OrderConversation.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SUP-007 — Retry send

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, SUPPORT, assigned staff
- Điều kiện/fixture: Ticket A/B; order A/B; private note and public message fixtures.

**Các bước**

1. Gửi cùng operationId khi ack mất
2. gửi khác text với ID cũ

**Mong đợi:** Một message; payload mismatch bị từ chối; draft có thể phục hồi.

**Đối chiếu source:** [functions/src/order-conversation.ts](../../../functions/src/order-conversation.ts), [packages/domain/order-conversation.ts](../../../packages/domain/order-conversation.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/support/Support.tsx](../../../src/features/support/Support.tsx), [src/features/support/OrderConversation.tsx](../../../src/features/support/OrderConversation.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SUP-008 — Dependency fail

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, SUPPORT, assigned staff
- Điều kiện/fixture: Ticket A/B; order A/B; private note and public message fixtures.

**Các bước**

1. Fail load hoặc send
2. navigate order khác
3. retry

**Mong đợi:** Không gửi nội dung sang thread mới; error/retry giữ context và không báo success giả.

**Đối chiếu source:** [functions/src/order-conversation.ts](../../../functions/src/order-conversation.ts), [packages/domain/order-conversation.ts](../../../packages/domain/order-conversation.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [src/features/support/Support.tsx](../../../src/features/support/Support.tsx), [src/features/support/OrderConversation.tsx](../../../src/features/support/OrderConversation.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## MEDIA — Ảnh hàng và content media

### SG-MEDIA-001 — Upload order image

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.

**Các bước**

1. Upload synthetic image đúng owner/order
2. list/read server

**Mong đợi:** Ảnh gắn đúng order và scope; không public hóa private object.

**Đối chiếu source:** [functions/src/order-media.ts](../../../functions/src/order-media.ts), [functions/src/media.ts](../../../functions/src/media.ts), [packages/domain/media.ts](../../../packages/domain/media.ts), [functions/src/ai/product-images.ts](../../../functions/src/ai/product-images.ts), [src/features/orders/OrderImages.tsx](../../../src/features/orders/OrderImages.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEDIA-002 — Cross-owner media

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.

**Các bước**

1. A list/read/upload ảnh order B
2. guest đọc URL private

**Mong đợi:** Deny không leak bytes/path; Storage direct luôn deny theo rules hiện hành.

**Đối chiếu source:** [functions/src/order-media.ts](../../../functions/src/order-media.ts), [functions/src/media.ts](../../../functions/src/media.ts), [packages/domain/media.ts](../../../packages/domain/media.ts), [functions/src/ai/product-images.ts](../../../functions/src/ai/product-images.ts), [src/features/orders/OrderImages.tsx](../../../src/features/orders/OrderImages.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEDIA-003 — MIME và magic mismatch

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.

**Các bước**

1. Upload MIME JPEG nhưng bytes HTML/SVG/polyglot/truncated

**Mong đợi:** Verifier/sanitizer reject hoặc normalize an toàn; không thực thi payload.

**Đối chiếu source:** [functions/src/order-media.ts](../../../functions/src/order-media.ts), [functions/src/media.ts](../../../functions/src/media.ts), [packages/domain/media.ts](../../../packages/domain/media.ts), [functions/src/ai/product-images.ts](../../../functions/src/ai/product-images.ts), [src/features/orders/OrderImages.tsx](../../../src/features/orders/OrderImages.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEDIA-004 — Size và dimension limit

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.

**Các bước**

1. Ảnh tại/ngoài giới hạn byte và pixels của schema/decoder
2. decoded bomb fixture

**Mong đợi:** Từ chối vượt giới hạn trước chi phí quá lớn; lỗi an toàn.

**Đối chiếu source:** [functions/src/order-media.ts](../../../functions/src/order-media.ts), [functions/src/media.ts](../../../functions/src/media.ts), [packages/domain/media.ts](../../../packages/domain/media.ts), [functions/src/ai/product-images.ts](../../../functions/src/ai/product-images.ts), [src/features/orders/OrderImages.tsx](../../../src/features/orders/OrderImages.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEDIA-005 — Metadata

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.

**Các bước**

1. Upload image có EXIF GPS/comment fixture
2. read normalized output

**Mong đợi:** Metadata không cần thiết được xử lý theo sanitizer; evidence không giữ PII.

**Đối chiếu source:** [functions/src/order-media.ts](../../../functions/src/order-media.ts), [functions/src/media.ts](../../../functions/src/media.ts), [packages/domain/media.ts](../../../packages/domain/media.ts), [functions/src/ai/product-images.ts](../../../functions/src/ai/product-images.ts), [src/features/orders/OrderImages.tsx](../../../src/features/orders/OrderImages.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEDIA-006 — Unpublish parent

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.

**Các bước**

1. Upload content image
2. publish parent
3. unpublish
4. tải publicImage lại

**Mong đợi:** Public media recheck parent, không phục vụ draft bằng URL cũ.

**Đối chiếu source:** [functions/src/order-media.ts](../../../functions/src/order-media.ts), [functions/src/media.ts](../../../functions/src/media.ts), [packages/domain/media.ts](../../../packages/domain/media.ts), [functions/src/ai/product-images.ts](../../../functions/src/ai/product-images.ts), [src/features/orders/OrderImages.tsx](../../../src/features/orders/OrderImages.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEDIA-007 — Retry upload

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.

**Các bước**

1. Làm mất response upload
2. retry theo operation contract
3. kiểm tra references

**Mong đợi:** Không tạo liên kết ảnh sai hoặc orphan không có khả năng xử lý; không báo uploaded trước ack.

**Đối chiếu source:** [functions/src/order-media.ts](../../../functions/src/order-media.ts), [functions/src/media.ts](../../../functions/src/media.ts), [packages/domain/media.ts](../../../packages/domain/media.ts), [functions/src/ai/product-images.ts](../../../functions/src/ai/product-images.ts), [src/features/orders/OrderImages.tsx](../../../src/features/orders/OrderImages.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-MEDIA-008 — AI image intake fail

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer, staff theo handler, CONTENT_EDITOR
- Điều kiện/fixture: Ảnh synthetic JPEG/PNG/WebP hợp lệ, oversized, polyglot, metadata EXIF; parent published/draft.

**Các bước**

1. ImageIntake nhận ảnh lỗi hoặc unsupported
2. thử lại với ảnh hợp lệ

**Mong đợi:** Không hallucinate hàng đã xác minh; ảnh/reference không trở thành purchase consent.

**Đối chiếu source:** [functions/src/order-media.ts](../../../functions/src/order-media.ts), [functions/src/media.ts](../../../functions/src/media.ts), [packages/domain/media.ts](../../../packages/domain/media.ts), [functions/src/ai/product-images.ts](../../../functions/src/ai/product-images.ts), [src/features/orders/OrderImages.tsx](../../../src/features/orders/OrderImages.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## ASK — Ask AI, retrieval, quota và ngôn ngữ

### SG-ASK-001 — Paid AI luôn đóng hiện tại

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer theo từng read path, fake AI adapter
- Điều kiện/fixture: Published/draft knowledge; vi/en prompts; fake generation; AI paid gate đóng.

**Các bước**

1. Gọi assertPaidAskReadiness với policy hợp lệ và 2 pilot UID
2. gọi ask paid path

**Mong đợi:** Vẫn unavailable; không gọi paid provider hoặc coi server settings là approval.

**Đối chiếu source:** [functions/src/ai/ask.ts](../../../functions/src/ai/ask.ts), [functions/src/ai/ask-paid-gate.ts](../../../functions/src/ai/ask-paid-gate.ts), [functions/src/ai/knowledge-retrieval.ts](../../../functions/src/ai/knowledge-retrieval.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASK-002 — Retrieval published

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer theo từng read path, fake AI adapter
- Điều kiện/fixture: Published/draft knowledge; vi/en prompts; fake generation; AI paid gate đóng.

**Các bước**

1. Retrieve câu hỏi khớp products/posts/pages published
2. seed draft matching mạnh hơn

**Mong đợi:** Chỉ kiến thức công bố; trả nguồn có thể kiểm chứng, không lấy private notes.

**Đối chiếu source:** [functions/src/ai/ask.ts](../../../functions/src/ai/ask.ts), [functions/src/ai/ask-paid-gate.ts](../../../functions/src/ai/ask-paid-gate.ts), [functions/src/ai/knowledge-retrieval.ts](../../../functions/src/ai/knowledge-retrieval.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASK-003 — Không có nguồn

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer theo từng read path, fake AI adapter
- Điều kiện/fixture: Published/draft knowledge; vi/en prompts; fake generation; AI paid gate đóng.

**Các bước**

1. Hỏi thông tin ngoài knowledge hoặc nguồn đã unpublish

**Mong đợi:** Không tự bịa giá/cam kết; phân biệt thiếu nguồn với lỗi dịch vụ; dẫn đường phù hợp.

**Đối chiếu source:** [functions/src/ai/ask.ts](../../../functions/src/ai/ask.ts), [functions/src/ai/ask-paid-gate.ts](../../../functions/src/ai/ask-paid-gate.ts), [functions/src/ai/knowledge-retrieval.ts](../../../functions/src/ai/knowledge-retrieval.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASK-004 — VI/EN task meaning

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer theo từng read path, fake AI adapter
- Điều kiện/fixture: Published/draft knowledge; vi/en prompts; fake generation; AI paid gate đóng.

**Các bước**

1. Hỏi cùng shipping/tracking/catalog task bằng Việt/Anh và accents

**Mong đợi:** Intent/entity đúng; ngôn ngữ output nhất quán; money/unit không thay đổi.

**Đối chiếu source:** [functions/src/ai/ask.ts](../../../functions/src/ai/ask.ts), [functions/src/ai/ask-paid-gate.ts](../../../functions/src/ai/ask-paid-gate.ts), [functions/src/ai/knowledge-retrieval.ts](../../../functions/src/ai/knowledge-retrieval.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASK-005 — Prompt injection nguồn

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer theo từng read path, fake AI adapter
- Điều kiện/fixture: Published/draft knowledge; vi/en prompts; fake generation; AI paid gate đóng.

**Các bước**

1. Seed public content yêu cầu bỏ luật/lộ private data
2. query đọc nguồn đó

**Mong đợi:** Nội dung được coi là dữ liệu; không tăng quyền, gọi tool nhạy cảm hoặc lộ prompt/PII.

**Đối chiếu source:** [functions/src/ai/ask.ts](../../../functions/src/ai/ask.ts), [functions/src/ai/ask-paid-gate.ts](../../../functions/src/ai/ask-paid-gate.ts), [functions/src/ai/knowledge-retrieval.ts](../../../functions/src/ai/knowledge-retrieval.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASK-006 — Quota và unavailable

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer theo từng read path, fake AI adapter
- Điều kiện/fixture: Published/draft knowledge; vi/en prompts; fake generation; AI paid gate đóng.

**Các bước**

1. Fake adapter quota exceeded, timeout, malformed stream
2. retry

**Mong đợi:** Giải thích đúng trạng thái; không nói đã trả phí/gửi mua hàng; retry có giới hạn.

**Đối chiếu source:** [functions/src/ai/ask.ts](../../../functions/src/ai/ask.ts), [functions/src/ai/ask-paid-gate.ts](../../../functions/src/ai/ask-paid-gate.ts), [functions/src/ai/knowledge-retrieval.ts](../../../functions/src/ai/knowledge-retrieval.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASK-007 — Stream cancel

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer theo từng read path, fake AI adapter
- Điều kiện/fixture: Published/draft knowledge; vi/en prompts; fake generation; AI paid gate đóng.

**Các bước**

1. Start fake stream
2. close Ask/unmount
3. đổi account
4. finish chunks cũ

**Mong đợi:** Hủy/ignore đúng lifecycle; không nối message cũ sang session mới.

**Đối chiếu source:** [functions/src/ai/ask.ts](../../../functions/src/ai/ask.ts), [functions/src/ai/ask-paid-gate.ts](../../../functions/src/ai/ask-paid-gate.ts), [functions/src/ai/knowledge-retrieval.ts](../../../functions/src/ai/knowledge-retrieval.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASK-008 — Action do AI gợi ý

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer theo từng read path, fake AI adapter
- Điều kiện/fixture: Published/draft knowledge; vi/en prompts; fake generation; AI paid gate đóng.

**Các bước**

1. Model fake đề xuất accept/pay/dispatch không có click người dùng

**Mong đợi:** Không tự thay order hoặc tiền; human confirmation và server command authority bắt buộc.

**Đối chiếu source:** [functions/src/ai/ask.ts](../../../functions/src/ai/ask.ts), [functions/src/ai/ask-paid-gate.ts](../../../functions/src/ai/ask-paid-gate.ts), [functions/src/ai/knowledge-retrieval.ts](../../../functions/src/ai/knowledge-retrieval.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASK-009 — Citations links

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer theo từng read path, fake AI adapter
- Điều kiện/fixture: Published/draft knowledge; vi/en prompts; fake generation; AI paid gate đóng.

**Các bước**

1. Fake result URL javascript hoặc slug unpublished
2. kiểm tra composer và click

**Mong đợi:** Link an toàn/đúng nguồn; không nâng unsupported source thành verified.

**Đối chiếu source:** [functions/src/ai/ask.ts](../../../functions/src/ai/ask.ts), [functions/src/ai/ask-paid-gate.ts](../../../functions/src/ai/ask-paid-gate.ts), [functions/src/ai/knowledge-retrieval.ts](../../../functions/src/ai/knowledge-retrieval.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASK-010 — Context order bị stale

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer theo từng read path, fake AI adapter
- Điều kiện/fixture: Published/draft knowledge; vi/en prompts; fake generation; AI paid gate đóng.

**Các bước**

1. A hỏi order O1
2. chuyển O2
3. delay O1 response
4. đổi sang B

**Mong đợi:** Không trả context O1/B sai; private context chỉ từ authorized read.

**Đối chiếu source:** [functions/src/ai/ask.ts](../../../functions/src/ai/ask.ts), [functions/src/ai/ask-paid-gate.ts](../../../functions/src/ai/ask-paid-gate.ts), [functions/src/ai/knowledge-retrieval.ts](../../../functions/src/ai/knowledge-retrieval.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## ASKFLOW — Ask workflow, draft và commerce handoff

### SG-ASKFLOW-001 — Draft đến order

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: Ask conversation versioned; custom/catalog draft; recipient; accepted quote.

**Các bước**

1. saveDraft
2. saveRecipient
3. submit request bằng action workflow
4. resume

**Mong đợi:** Một conversation liên kết đúng một authoritative order; không tạo order khi chỉ saveDraft.

**Đối chiếu source:** [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [packages/domain/ask-workflow.ts](../../../packages/domain/ask-workflow.ts), [packages/domain/ask-task-frame.ts](../../../packages/domain/ask-task-frame.ts), [src/features/ask/Commerce.tsx](../../../src/features/ask/Commerce.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASKFLOW-002 — Catalog chat checkout

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: Ask conversation versioned; custom/catalog draft; recipient; accepted quote.

**Các bước**

1. Chọn product/variant/qty
2. catalogCheckout workflow
3. mở account và CRM

**Mong đợi:** Cùng order ID/snapshot; không biến catalog thành custom hoặc bắt acceptQuote lại.

**Đối chiếu source:** [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [packages/domain/ask-workflow.ts](../../../packages/domain/ask-workflow.ts), [packages/domain/ask-task-frame.ts](../../../packages/domain/ask-task-frame.ts), [src/features/ask/Commerce.tsx](../../../src/features/ask/Commerce.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASKFLOW-003 — Recipient bắt buộc

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: Ask conversation versioned; custom/catalog draft; recipient; accepted quote.

**Các bước**

1. acceptQuote khi chưa recipientSaved
2. lưu recipient rồi thử lại

**Mong đợi:** Không chấp thuận thiếu delivery context; address snapshot owner đúng.

**Đối chiếu source:** [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [packages/domain/ask-workflow.ts](../../../packages/domain/ask-workflow.ts), [packages/domain/ask-task-frame.ts](../../../packages/domain/ask-task-frame.ts), [src/features/ask/Commerce.tsx](../../../src/features/ask/Commerce.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASKFLOW-004 — Resume và hydrate

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: Ask conversation versioned; custom/catalog draft; recipient; accepted quote.

**Các bước**

1. Reload browser
2. currentAskConversation/resume current conversation
3. đổi account

**Mong đợi:** Khôi phục đúng version/context cho current owner; không lấy cache UID cũ.

**Đối chiếu source:** [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [packages/domain/ask-workflow.ts](../../../packages/domain/ask-workflow.ts), [packages/domain/ask-task-frame.ts](../../../packages/domain/ask-task-frame.ts), [src/features/ask/Commerce.tsx](../../../src/features/ask/Commerce.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASKFLOW-005 — Workflow version race

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: Ask conversation versioned; custom/catalog draft; recipient; accepted quote.

**Các bước**

1. Hai tab saveDraft/action với conversation version cũ
2. payload khác

**Mong đợi:** Conflict không merge sai hoặc bỏ consent; reload giữ draft để người dùng quyết định.

**Đối chiếu source:** [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [packages/domain/ask-workflow.ts](../../../packages/domain/ask-workflow.ts), [packages/domain/ask-task-frame.ts](../../../packages/domain/ask-task-frame.ts), [src/features/ask/Commerce.tsx](../../../src/features/ask/Commerce.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASKFLOW-006 — Handoff to support

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: Ask conversation versioned; custom/catalog draft; recipient; accepted quote.

**Các bước**

1. Ask chuyển sang support của order
2. gửi message
3. xem staff thread

**Mong đợi:** Đúng order/conversation; không tạo ticket trùng chỉ do open/close.

**Đối chiếu source:** [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [packages/domain/ask-workflow.ts](../../../packages/domain/ask-workflow.ts), [packages/domain/ask-task-frame.ts](../../../packages/domain/ask-task-frame.ts), [src/features/ask/Commerce.tsx](../../../src/features/ask/Commerce.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASKFLOW-007 — Read task và write task

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: Ask conversation versioned; custom/catalog draft; recipient; accepted quote.

**Các bước**

1. Hỏi invoice/tracking/rates
2. kiểm tra reads
3. thử text mô tả như đã thanh toán

**Mong đợi:** Read không mutate; lời chat không verify funds/consent.

**Đối chiếu source:** [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [packages/domain/ask-workflow.ts](../../../packages/domain/ask-workflow.ts), [packages/domain/ask-task-frame.ts](../../../packages/domain/ask-task-frame.ts), [src/features/ask/Commerce.tsx](../../../src/features/ask/Commerce.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASKFLOW-008 — Bound order draft

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: Ask conversation versioned; custom/catalog draft; recipient; accepted quote.

**Các bước**

1. Conversation đã có orderId
2. cố saveDraft thay hàng mới

**Mong đợi:** Không rewrite order đã bound; dùng workflow mới/đúng change contract.

**Đối chiếu source:** [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [packages/domain/ask-workflow.ts](../../../packages/domain/ask-workflow.ts), [packages/domain/ask-task-frame.ts](../../../packages/domain/ask-task-frame.ts), [src/features/ask/Commerce.tsx](../../../src/features/ask/Commerce.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-ASKFLOW-009 — Operation replay context

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B
- Điều kiện/fixture: Ask conversation versioned; custom/catalog draft; recipient; accepted quote.

**Các bước**

1. Replay action sau revoke/lock hoặc đổi owner fixture

**Mong đợi:** Recheck current authority trước trả prior result; không lộ result cũ.

**Đối chiếu source:** [functions/src/ai/ask-workflow.ts](../../../functions/src/ai/ask-workflow.ts), [packages/domain/ask-workflow.ts](../../../packages/domain/ask-workflow.ts), [packages/domain/ask-task-frame.ts](../../../packages/domain/ask-task-frame.ts), [src/features/ask/Commerce.tsx](../../../src/features/ask/Commerce.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## RATES — Biểu phí vận chuyển và ước tính

### SG-RATES-001 — Publish versioned rates

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer reads, OWNER admin
- Điều kiện/fixture: Reference/published/unavailable rate snapshots; VN_US, US_VN; vietnam,texas_cali,oregon.

**Các bước**

1. Owner save valid config rồi publish
2. public đọc snapshot

**Mong đợi:** Version/source/conditions đúng; draft không xuất hiện như published.

**Đối chiếu source:** [functions/src/shipping-rates.ts](../../../functions/src/shipping-rates.ts), [packages/domain/shipping-rates.ts](../../../packages/domain/shipping-rates.ts), [src/features/shipping/ShippingRates.tsx](../../../src/features/shipping/ShippingRates.tsx), [src/features/ask/ShippingQuote.tsx](../../../src/features/ask/ShippingQuote.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RATES-002 — Không có giá công bố

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer reads, OWNER admin
- Điều kiện/fixture: Reference/published/unavailable rate snapshots; VN_US, US_VN; vietnam,texas_cali,oregon.

**Các bước**

1. Public đọc khi config null/unavailable
2. Ask shipping quote

**Mong đợi:** Nêu không đủ dữ liệu; không thay bằng zero hoặc cam kết cước.

**Đối chiếu source:** [functions/src/shipping-rates.ts](../../../functions/src/shipping-rates.ts), [packages/domain/shipping-rates.ts](../../../packages/domain/shipping-rates.ts), [src/features/shipping/ShippingRates.tsx](../../../src/features/shipping/ShippingRates.tsx), [src/features/ask/ShippingQuote.tsx](../../../src/features/ask/ShippingQuote.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RATES-003 — VN exact bracket

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer reads, OWNER admin
- Điều kiện/fixture: Reference/published/unavailable rate snapshots; VN_US, US_VN; vietnam,texas_cali,oregon.

**Các bước**

1. VN_US total row 1000g
2. thử 999g,1000g,1001g

**Mong đợi:** Chỉ exact published bracket cho estimate; không tự nội suy/làm tròn bậc.

**Đối chiếu source:** [functions/src/shipping-rates.ts](../../../functions/src/shipping-rates.ts), [packages/domain/shipping-rates.ts](../../../packages/domain/shipping-rates.ts), [src/features/shipping/ShippingRates.tsx](../../../src/features/shipping/ShippingRates.tsx), [src/features/ask/ShippingQuote.tsx](../../../src/features/ask/ShippingQuote.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RATES-004 — US minimum 1kg

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer reads, OWNER admin
- Điều kiện/fixture: Reference/published/unavailable rate snapshots; VN_US, US_VN; vietnam,texas_cali,oregon.

**Các bước**

1. US_VN chọn rowId texas_cali per_kg
2. thử weight=1,999,1000,1001g

**Mong đợi:** Chargeable tối thiểu 1000g; freight integer hoặc quote_required; currency USD không tự FX.

**Đối chiếu source:** [functions/src/shipping-rates.ts](../../../functions/src/shipping-rates.ts), [packages/domain/shipping-rates.ts](../../../packages/domain/shipping-rates.ts), [src/features/shipping/ShippingRates.tsx](../../../src/features/shipping/ShippingRates.tsx), [src/features/ask/ShippingQuote.tsx](../../../src/features/ask/ShippingQuote.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RATES-005 — Oregon ambiguity

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer reads, OWNER admin
- Điều kiện/fixture: Reference/published/unavailable rate snapshots; VN_US, US_VN; vietnam,texas_cali,oregon.

**Các bước**

1. Quote warehouse oregon với row giá hợp lệ

**Mong đợi:** Luôn quote_required theo current domain; không tự cộng ghi chú $2/kg.

**Đối chiếu source:** [functions/src/shipping-rates.ts](../../../functions/src/shipping-rates.ts), [packages/domain/shipping-rates.ts](../../../packages/domain/shipping-rates.ts), [src/features/shipping/ShippingRates.tsx](../../../src/features/shipping/ShippingRates.tsx), [src/features/ask/ShippingQuote.tsx](../../../src/features/ask/ShippingQuote.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RATES-006 — Schema rate config

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer reads, OWNER admin
- Điều kiện/fixture: Reference/published/unavailable rate snapshots; VN_US, US_VN; vietnam,texas_cali,oregon.

**Các bước**

1. Duplicate row IDs, max<min, direction/warehouse/currency mismatch, quote có amount

**Mong đợi:** Reject từng biến thể; không publish bảng sai hoặc mập mờ.

**Đối chiếu source:** [functions/src/shipping-rates.ts](../../../functions/src/shipping-rates.ts), [packages/domain/shipping-rates.ts](../../../packages/domain/shipping-rates.ts), [src/features/shipping/ShippingRates.tsx](../../../src/features/shipping/ShippingRates.tsx), [src/features/ask/ShippingQuote.tsx](../../../src/features/ask/ShippingQuote.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RATES-007 — Nguồn rate URL

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer reads, OWNER admin
- Điều kiện/fixture: Reference/published/unavailable rate snapshots; VN_US, US_VN; vietnam,texas_cali,oregon.

**Các bước**

1. Save URL HTTP, hostname khác, userinfo và www.vietcargo.vn HTTPS

**Mong đợi:** Chỉ nguồn HTTPS hostname đúng không credential; không có SSRF từ URL tùy ý.

**Đối chiếu source:** [functions/src/shipping-rates.ts](../../../functions/src/shipping-rates.ts), [packages/domain/shipping-rates.ts](../../../packages/domain/shipping-rates.ts), [src/features/shipping/ShippingRates.tsx](../../../src/features/shipping/ShippingRates.tsx), [src/features/ask/ShippingQuote.tsx](../../../src/features/ask/ShippingQuote.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-RATES-008 — Concurrent publish

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest/customer reads, OWNER admin
- Điều kiện/fixture: Reference/published/unavailable rate snapshots; VN_US, US_VN; vietnam,texas_cali,oregon.

**Các bước**

1. Hai owner save/publish expectedVersion cũ
2. reload customer quote

**Mong đợi:** Một config/version; quote ghi scope/source hiện hành; không update draft vào public.

**Đối chiếu source:** [functions/src/shipping-rates.ts](../../../functions/src/shipping-rates.ts), [packages/domain/shipping-rates.ts](../../../packages/domain/shipping-rates.ts), [src/features/shipping/ShippingRates.tsx](../../../src/features/shipping/ShippingRates.tsx), [src/features/ask/ShippingQuote.tsx](../../../src/features/ask/ShippingQuote.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## CONTENT — Sản phẩm, posts và campaigns

### SG-CONTENT-001 — Save content draft

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: CONTENT_EDITOR, OWNER
- Điều kiện/fixture: Published/draft products/posts/campaigns; config variants và scheduling fixtures.

**Các bước**

1. Editor saveContent đúng schema
2. public đọc
3. publish có version

**Mong đợi:** Draft private; published projection đúng loại/slug/version.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/public-content.ts](../../../packages/domain/public-content.ts), [src/features/content/ContentEditor.tsx](../../../src/features/content/ContentEditor.tsx), [src/features/content/Campaigns.tsx](../../../src/features/content/Campaigns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CONTENT-002 — Product fields bán hàng

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: CONTENT_EDITOR, OWNER
- Điều kiện/fixture: Published/draft products/posts/campaigns; config variants và scheduling fixtures.

**Các bước**

1. Save product thiếu price/terms/options hoặc orderable với variants ambiguous

**Mong đợi:** Không cho checkout sản phẩm không đủ contract; UI chỉ trạng thái đúng.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/public-content.ts](../../../packages/domain/public-content.ts), [src/features/content/ContentEditor.tsx](../../../src/features/content/ContentEditor.tsx), [src/features/content/Campaigns.tsx](../../../src/features/content/Campaigns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CONTENT-003 — Slug trùng và version

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: CONTENT_EDITOR, OWNER
- Điều kiện/fixture: Published/draft products/posts/campaigns; config variants và scheduling fixtures.

**Các bước**

1. Hai editor tạo cùng slug
2. edit bản stale

**Mong đợi:** Không ghi đè nội dung khác; conflict/version history đúng source.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/public-content.ts](../../../packages/domain/public-content.ts), [src/features/content/ContentEditor.tsx](../../../src/features/content/ContentEditor.tsx), [src/features/content/Campaigns.tsx](../../../src/features/content/Campaigns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CONTENT-004 — Campaign lifecycle

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: CONTENT_EDITOR, OWNER
- Điều kiện/fixture: Published/draft products/posts/campaigns; config variants và scheduling fixtures.

**Các bước**

1. saveCampaign draft/published/inactive với targets hợp lệ
2. public refresh

**Mong đợi:** Visibility đúng trạng thái, thời gian và audience contract; không lộ draft.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/public-content.ts](../../../packages/domain/public-content.ts), [src/features/content/ContentEditor.tsx](../../../src/features/content/ContentEditor.tsx), [src/features/content/Campaigns.tsx](../../../src/features/content/Campaigns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CONTENT-005 — Role content

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: CONTENT_EDITOR, OWNER
- Điều kiện/fixture: Published/draft products/posts/campaigns; config variants và scheduling fixtures.

**Các bước**

1. CONTENT_EDITOR sửa pricing policy/staff access
2. FINANCE sửa content

**Mong đợi:** Deny ngoài grants; không lấy menu làm security proof.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/public-content.ts](../../../packages/domain/public-content.ts), [src/features/content/ContentEditor.tsx](../../../src/features/content/ContentEditor.tsx), [src/features/content/Campaigns.tsx](../../../src/features/content/Campaigns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CONTENT-006 — HTML sanitize

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: CONTENT_EDITOR, OWNER
- Điều kiện/fixture: Published/draft products/posts/campaigns; config variants và scheduling fixtures.

**Các bước**

1. Save content có script, javascript link, dangerous iframe và SVG

**Mong đợi:** Published HTML an toàn theo sanitizer; không executable injection.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/public-content.ts](../../../packages/domain/public-content.ts), [src/features/content/ContentEditor.tsx](../../../src/features/content/ContentEditor.tsx), [src/features/content/Campaigns.tsx](../../../src/features/content/Campaigns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CONTENT-007 — Parent image consistency

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: CONTENT_EDITOR, OWNER
- Điều kiện/fixture: Published/draft products/posts/campaigns; config variants và scheduling fixtures.

**Các bước**

1. Đổi cover/media
2. publish
3. retire old content
4. load image URL cũ

**Mong đợi:** Projection và image authority nhất quán; không orphan public media từ draft.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/public-content.ts](../../../packages/domain/public-content.ts), [src/features/content/ContentEditor.tsx](../../../src/features/content/ContentEditor.tsx), [src/features/content/Campaigns.tsx](../../../src/features/content/Campaigns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-CONTENT-008 — Load/save failure

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: CONTENT_EDITOR, OWNER
- Điều kiện/fixture: Published/draft products/posts/campaigns; config variants và scheduling fixtures.

**Các bước**

1. Fail upload/save/version request
2. retry
3. đổi entity

**Mong đợi:** Giữ draft; không flash success hoặc overwrite content entity mới.

**Đối chiếu source:** [functions/src/workspace.ts](../../../functions/src/workspace.ts), [packages/domain/public-content.ts](../../../packages/domain/public-content.ts), [src/features/content/ContentEditor.tsx](../../../src/features/content/ContentEditor.tsx), [src/features/content/Campaigns.tsx](../../../src/features/content/Campaigns.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## BANNER — Website banners, preview và publish

### SG-BANNER-001 — Admin và public snapshot

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR theo handler, guest
- Điều kiện/fixture: Banner draft/published, schedule windows; desktop/mobile asset fixtures.

**Các bước**

1. websiteBannerAdmin đọc
2. websiteBannerCommand save/publish theo schema
3. campaignBannersPublic đọc

**Mong đợi:** Public chỉ bản được công bố/đến hạn theo contract; admin giữ draft state riêng.

**Đối chiếu source:** [functions/src/campaign-banners.ts](../../../functions/src/campaign-banners.ts), [packages/domain/campaign-banners.ts](../../../packages/domain/campaign-banners.ts), [src/features/content/WebsiteBanners.tsx](../../../src/features/content/WebsiteBanners.tsx), [src/features/content/CampaignBanner.tsx](../../../src/features/content/CampaignBanner.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BANNER-002 — Preview quyền

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR theo handler, guest
- Điều kiện/fixture: Banner draft/published, schedule windows; desktop/mobile asset fixtures.

**Các bước**

1. websiteBannerPreview với staff hợp lệ
2. guest/A thử preview private ID

**Mong đợi:** Preview không trở thành public endpoint bypass; identity hiện hành được check.

**Đối chiếu source:** [functions/src/campaign-banners.ts](../../../functions/src/campaign-banners.ts), [packages/domain/campaign-banners.ts](../../../packages/domain/campaign-banners.ts), [src/features/content/WebsiteBanners.tsx](../../../src/features/content/WebsiteBanners.tsx), [src/features/content/CampaignBanner.tsx](../../../src/features/content/CampaignBanner.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BANNER-003 — Schedule boundary

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR theo handler, guest
- Điều kiện/fixture: Banner draft/published, schedule windows; desktop/mobile asset fixtures.

**Các bước**

1. Clock trước start, đúng start, đúng end và sau end

**Mong đợi:** Visibility đúng boundary source; không chạy provider job ngoài release gate.

**Đối chiếu source:** [functions/src/campaign-banners.ts](../../../functions/src/campaign-banners.ts), [packages/domain/campaign-banners.ts](../../../packages/domain/campaign-banners.ts), [src/features/content/WebsiteBanners.tsx](../../../src/features/content/WebsiteBanners.tsx), [src/features/content/CampaignBanner.tsx](../../../src/features/content/CampaignBanner.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BANNER-004 — Link unsafe

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR theo handler, guest
- Điều kiện/fixture: Banner draft/published, schedule windows; desktop/mobile asset fixtures.

**Các bước**

1. Banner target javascript/data hoặc external URL không hợp lệ

**Mong đợi:** Reject/disable link an toàn; không click chạy code.

**Đối chiếu source:** [functions/src/campaign-banners.ts](../../../functions/src/campaign-banners.ts), [packages/domain/campaign-banners.ts](../../../packages/domain/campaign-banners.ts), [src/features/content/WebsiteBanners.tsx](../../../src/features/content/WebsiteBanners.tsx), [src/features/content/CampaignBanner.tsx](../../../src/features/content/CampaignBanner.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BANNER-005 — Version conflict

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR theo handler, guest
- Điều kiện/fixture: Banner draft/published, schedule windows; desktop/mobile asset fixtures.

**Các bước**

1. Hai editor save draft rồi publish stale

**Mong đợi:** Không publish nhầm draft mới; yêu cầu reload/confirm đúng version.

**Đối chiếu source:** [functions/src/campaign-banners.ts](../../../functions/src/campaign-banners.ts), [packages/domain/campaign-banners.ts](../../../packages/domain/campaign-banners.ts), [src/features/content/WebsiteBanners.tsx](../../../src/features/content/WebsiteBanners.tsx), [src/features/content/CampaignBanner.tsx](../../../src/features/content/CampaignBanner.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BANNER-006 — Fallback media

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR theo handler, guest
- Điều kiện/fixture: Banner draft/published, schedule windows; desktop/mobile asset fixtures.

**Các bước**

1. Ảnh banner fail
2. desktop/mobile thay viewport
3. nội dung dài

**Mong đợi:** Không che CTA hoặc mất nghĩa; fallback đủ contrast và không layout jump lớn.

**Đối chiếu source:** [functions/src/campaign-banners.ts](../../../functions/src/campaign-banners.ts), [packages/domain/campaign-banners.ts](../../../packages/domain/campaign-banners.ts), [src/features/content/WebsiteBanners.tsx](../../../src/features/content/WebsiteBanners.tsx), [src/features/content/CampaignBanner.tsx](../../../src/features/content/CampaignBanner.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BANNER-007 — Unpublish

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR theo handler, guest
- Điều kiện/fixture: Banner draft/published, schedule windows; desktop/mobile asset fixtures.

**Các bước**

1. Unpublish đang public
2. refresh cache/route
3. kiểm tra image access

**Mong đợi:** Visibility được thu hồi theo contract cache; private preview không leak.

**Đối chiếu source:** [functions/src/campaign-banners.ts](../../../functions/src/campaign-banners.ts), [packages/domain/campaign-banners.ts](../../../packages/domain/campaign-banners.ts), [src/features/content/WebsiteBanners.tsx](../../../src/features/content/WebsiteBanners.tsx), [src/features/content/CampaignBanner.tsx](../../../src/features/content/CampaignBanner.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-BANNER-008 — Reduced motion banner

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR theo handler, guest
- Điều kiện/fixture: Banner draft/published, schedule windows; desktop/mobile asset fixtures.

**Các bước**

1. Bật reduced motion
2. hover/focus carousel nếu có
3. unmount

**Mong đợi:** Theo UI thực tế, animation không bắt người dùng theo chuyển động; cleanup đúng.

**Đối chiếu source:** [functions/src/campaign-banners.ts](../../../functions/src/campaign-banners.ts), [packages/domain/campaign-banners.ts](../../../packages/domain/campaign-banners.ts), [src/features/content/WebsiteBanners.tsx](../../../src/features/content/WebsiteBanners.tsx), [src/features/content/CampaignBanner.tsx](../../../src/features/content/CampaignBanner.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## STUDIO — Blog Studio editor và xuất bản

### SG-STUDIO-001 — Draft và save

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.

**Các bước**

1. Tạo draft
2. sửa title/slug/body/cover
3. save
4. reload

**Mong đợi:** Nội dung đúng schema và owner/editorial authority; không auto-publish draft.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts), [packages/domain/blog-studio.ts](../../../packages/domain/blog-studio.ts), [src/features/content/studio/Studio.tsx](../../../src/features/content/studio/Studio.tsx), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIO-002 — Review và publication

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.

**Các bước**

1. Submit review/publish theo action source
2. reader mở posts slug

**Mong đợi:** Chỉ publisher được phép publish; public snapshot khớp bản đã duyệt.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts), [packages/domain/blog-studio.ts](../../../packages/domain/blog-studio.ts), [src/features/content/studio/Studio.tsx](../../../src/features/content/studio/Studio.tsx), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIO-003 — Autosave conflict

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.

**Các bước**

1. Hai editor cùng draft
2. save stale version
3. reload recovery

**Mong đợi:** Không overwrite bản khác; conflict/unsaved state rõ; phục hồi không tự publish.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts), [packages/domain/blog-studio.ts](../../../packages/domain/blog-studio.ts), [src/features/content/studio/Studio.tsx](../../../src/features/content/studio/Studio.tsx), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIO-004 — Rich editor roundtrip

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.

**Các bước**

1. Nhập heading,table,code,link,image,mermaid
2. save và reopen/public preview

**Mong đợi:** Cấu trúc roundtrip đúng; code không thi hành; Mermaid/SVG được sanitize.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts), [packages/domain/blog-studio.ts](../../../packages/domain/blog-studio.ts), [src/features/content/studio/Studio.tsx](../../../src/features/content/studio/Studio.tsx), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIO-005 — Schedule và cancel

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.

**Các bước**

1. Schedule future hợp lệ
2. cancelSchedule
3. clock qua hạn ở approved demo

**Mong đợi:** Canceled không publish; schedule timezone/version chính xác; production schedule hiện gate đóng.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts), [packages/domain/blog-studio.ts](../../../packages/domain/blog-studio.ts), [src/features/content/studio/Studio.tsx](../../../src/features/content/studio/Studio.tsx), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIO-006 — Archive và slug

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.

**Các bước**

1. Archive published
2. đổi slug hợp lệ rồi publish theo contract
3. mở URL cũ/mới

**Mong đợi:** Không lộ archived draft; route/slug collision đúng policy source.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts), [packages/domain/blog-studio.ts](../../../packages/domain/blog-studio.ts), [src/features/content/studio/Studio.tsx](../../../src/features/content/studio/Studio.tsx), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIO-007 — Media upload/read

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.

**Các bước**

1. studioMediaUpload valid bytes
2. studioMediaRead đúng editorial rights
3. invalid/oversized

**Mong đợi:** Sanitize/limits đúng; role/parent permission đúng.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts), [packages/domain/blog-studio.ts](../../../packages/domain/blog-studio.ts), [src/features/content/studio/Studio.tsx](../../../src/features/content/studio/Studio.tsx), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIO-008 — Preview safe

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.

**Các bước**

1. Mở preview có external link/popup
2. deny popup
3. hủy editor

**Mong đợi:** Preview không mutate; link an toàn; có fallback khi popup blocked.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts), [packages/domain/blog-studio.ts](../../../packages/domain/blog-studio.ts), [src/features/content/studio/Studio.tsx](../../../src/features/content/studio/Studio.tsx), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIO-009 — Empty/error recovery

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: OWNER, CONTENT_EDITOR và editorial roles theo studioAuthority
- Điều kiện/fixture: Draft/review/published/archived; 2 writers; media/code/table/mermaid synthetic.

**Các bước**

1. Fail studio list/save/media
2. retry và recover draft
3. switch identity

**Mong đợi:** Phân biệt trạng thái; không rò dữ liệu editorial của phiên cũ.

**Đối chiếu source:** [functions/src/blog-studio.ts](../../../functions/src/blog-studio.ts), [packages/domain/blog-studio.ts](../../../packages/domain/blog-studio.ts), [src/features/content/studio/Studio.tsx](../../../src/features/content/studio/Studio.tsx), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## STUDIOADV — Studio taxonomy, members, reports và export

### SG-STUDIOADV-001 — Taxonomy normalize

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: Editorial manager/publisher/writer theo source
- Điều kiện/fixture: Members active/revoked; taxonomy accents/case duplicates; reports open/resolved; paginated posts.

**Các bước**

1. categoryCreate tên có dấu/case/NFC khác nhưng cùng taxonomyKey
2. catalogUpdate

**Mong đợi:** Không duplicate key normalized; version conflict đúng; public category không hỏng.

**Đối chiếu source:** [functions/src/blog-studio-advanced.ts](../../../functions/src/blog-studio-advanced.ts), [packages/domain/blog-studio-advanced.ts](../../../packages/domain/blog-studio-advanced.ts), [functions/src/blog-studio-access.ts](../../../functions/src/blog-studio-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIOADV-002 — Member save/revoke

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: Editorial manager/publisher/writer theo source
- Điều kiện/fixture: Members active/revoked; taxonomy accents/case duplicates; reports open/resolved; paginated posts.

**Các bước**

1. memberSave scope hợp lệ
2. memberRevoke
3. member cũ gọi studioRead/Command

**Mong đợi:** Authority hiện hành được recheck; revocation không xóa public posts tùy ý.

**Đối chiếu source:** [functions/src/blog-studio-advanced.ts](../../../functions/src/blog-studio-advanced.ts), [packages/domain/blog-studio-advanced.ts](../../../packages/domain/blog-studio-advanced.ts), [functions/src/blog-studio-access.ts](../../../functions/src/blog-studio-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIOADV-003 — Last manager policy

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: Editorial manager/publisher/writer theo source
- Điều kiện/fixture: Members active/revoked; taxonomy accents/case duplicates; reports open/resolved; paginated posts.

**Các bước**

1. Revoke/change manager hoặc chính mình với fixture theo guard source

**Mong đợi:** Không vượt invariant quản trị nguồn; nếu source thiếu policy ghi requirement gap để owner quyết định.

**Đối chiếu source:** [functions/src/blog-studio-advanced.ts](../../../functions/src/blog-studio-advanced.ts), [packages/domain/blog-studio-advanced.ts](../../../packages/domain/blog-studio-advanced.ts), [functions/src/blog-studio-access.ts](../../../functions/src/blog-studio-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIOADV-004 — Advanced reads

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: Editorial manager/publisher/writer theo source
- Điều kiện/fixture: Members active/revoked; taxonomy accents/case duplicates; reports open/resolved; paginated posts.

**Các bước**

1. studioAdvancedRead kinds list,summary,catalog,members,assignable,export,reports

**Mong đợi:** Từng kind đúng authority/projection; summary không giả total từ page.

**Đối chiếu source:** [functions/src/blog-studio-advanced.ts](../../../functions/src/blog-studio-advanced.ts), [packages/domain/blog-studio-advanced.ts](../../../packages/domain/blog-studio-advanced.ts), [functions/src/blog-studio-access.ts](../../../functions/src/blog-studio-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIOADV-005 — Cursor invalid

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: Editorial manager/publisher/writer theo source
- Điều kiện/fixture: Members active/revoked; taxonomy accents/case duplicates; reports open/resolved; paginated posts.

**Các bước**

1. Gửi cursor malformed/base64 dài
2. timestamp sai
3. id có separators

**Mong đợi:** Reject an toàn, không crash/fallback đọc toàn bộ database.

**Đối chiếu source:** [functions/src/blog-studio-advanced.ts](../../../functions/src/blog-studio-advanced.ts), [packages/domain/blog-studio-advanced.ts](../../../packages/domain/blog-studio-advanced.ts), [functions/src/blog-studio-access.ts](../../../functions/src/blog-studio-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIOADV-006 — Report resolve

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: Editorial manager/publisher/writer theo source
- Điều kiện/fixture: Members active/revoked; taxonomy accents/case duplicates; reports open/resolved; paginated posts.

**Các bước**

1. reportResolve current report version
2. retry
3. wrong role

**Mong đợi:** Một resolution có reason/history theo schema; deny role sai.

**Đối chiếu source:** [functions/src/blog-studio-advanced.ts](../../../functions/src/blog-studio-advanced.ts), [packages/domain/blog-studio-advanced.ts](../../../packages/domain/blog-studio-advanced.ts), [functions/src/blog-studio-access.ts](../../../functions/src/blog-studio-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIOADV-007 — CSV export

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: Editorial manager/publisher/writer theo source
- Điều kiện/fixture: Members active/revoked; taxonomy accents/case duplicates; reports open/resolved; paginated posts.

**Các bước**

1. Export fields có dấu, newline, quotes, =,+,@,- ở đầu

**Mong đợi:** CSV escape đúng; không formula injection; export chỉ scope có authority.

**Đối chiếu source:** [functions/src/blog-studio-advanced.ts](../../../functions/src/blog-studio-advanced.ts), [packages/domain/blog-studio-advanced.ts](../../../packages/domain/blog-studio-advanced.ts), [functions/src/blog-studio-access.ts](../../../functions/src/blog-studio-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-STUDIOADV-008 — Avatar identity

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: Editorial manager/publisher/writer theo source
- Điều kiện/fixture: Members active/revoked; taxonomy accents/case duplicates; reports open/resolved; paginated posts.

**Các bước**

1. Bind Google avatar đúng host
2. thử userinfo, port, hostname suffix giả

**Mong đợi:** Chỉ URL theo googleStudioAvatar guard; không tin avatar tự gửi là identity.

**Đối chiếu source:** [functions/src/blog-studio-advanced.ts](../../../functions/src/blog-studio-advanced.ts), [packages/domain/blog-studio-advanced.ts](../../../packages/domain/blog-studio-advanced.ts), [functions/src/blog-studio-access.ts](../../../functions/src/blog-studio-access.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## COMMENT — Blog comments, replies và moderation

### SG-COMMENT-001 — Submit và list

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B, editorial moderator, guest public read
- Điều kiện/fixture: Published/unpublished parent posts; top-level/replies/deleted comments; report fixtures.

**Các bước**

1. A submit comment trên published parent
2. public list

**Mong đợi:** Đúng author từ identity; parent/status hợp lệ; không public private identity fields.

**Đối chiếu source:** [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [packages/domain/blog-comments.ts](../../../packages/domain/blog-comments.ts), [src/features/content/BlogComments.tsx](../../../src/features/content/BlogComments.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-COMMENT-002 — Reply lineage

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B, editorial moderator, guest public read
- Điều kiện/fixture: Published/unpublished parent posts; top-level/replies/deleted comments; report fixtures.

**Các bước**

1. Reply vào comment đúng post
2. thử parent ở post khác hoặc missing

**Mong đợi:** Chặn cross-post/invalid nesting; không nối thread sai.

**Đối chiếu source:** [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [packages/domain/blog-comments.ts](../../../packages/domain/blog-comments.ts), [src/features/content/BlogComments.tsx](../../../src/features/content/BlogComments.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-COMMENT-003 — Edit/delete owner

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B, editorial moderator, guest public read
- Điều kiện/fixture: Published/unpublished parent posts; top-level/replies/deleted comments; report fixtures.

**Các bước**

1. A edit/delete own
2. B edit/delete A
3. replay operation

**Mong đợi:** Chỉ author/authority theo contract; delete state giữ lineage phù hợp.

**Đối chiếu source:** [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [packages/domain/blog-comments.ts](../../../packages/domain/blog-comments.ts), [src/features/content/BlogComments.tsx](../../../src/features/content/BlogComments.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-COMMENT-004 — Moderation status

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B, editorial moderator, guest public read
- Điều kiện/fixture: Published/unpublished parent posts; top-level/replies/deleted comments; report fixtures.

**Các bước**

1. Moderator ẩn/duyệt comment theo current roles
2. list public

**Mong đợi:** Hidden/unapproved không xuất hiện public; không tin role cache.

**Đối chiếu source:** [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [packages/domain/blog-comments.ts](../../../packages/domain/blog-comments.ts), [src/features/content/BlogComments.tsx](../../../src/features/content/BlogComments.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-COMMENT-005 — Reports dedupe

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B, editorial moderator, guest public read
- Điều kiện/fixture: Published/unpublished parent posts; top-level/replies/deleted comments; report fixtures.

**Các bước**

1. A report comment
2. retry
3. report target bị xóa/không tồn tại

**Mong đợi:** Không duplicate report sai context; reason/schema đúng.

**Đối chiếu source:** [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [packages/domain/blog-comments.ts](../../../packages/domain/blog-comments.ts), [src/features/content/BlogComments.tsx](../../../src/features/content/BlogComments.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-COMMENT-006 — Pagination replies

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B, editorial moderator, guest public read
- Điều kiện/fixture: Published/unpublished parent posts; top-level/replies/deleted comments; report fixtures.

**Các bước**

1. List newest/oldest và cursor nhiều ties
2. load replies

**Mong đợi:** Không trùng/bỏ; page bounded; không trộn parent filters.

**Đối chiếu source:** [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [packages/domain/blog-comments.ts](../../../packages/domain/blog-comments.ts), [src/features/content/BlogComments.tsx](../../../src/features/content/BlogComments.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-COMMENT-007 — Parent unpublish

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B, editorial moderator, guest public read
- Điều kiện/fixture: Published/unpublished parent posts; top-level/replies/deleted comments; report fixtures.

**Các bước**

1. Post published có comments
2. unpublish
3. list/submit bằng ID cũ

**Mong đợi:** Không leak comment/post private qua endpoint cũ.

**Đối chiếu source:** [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [packages/domain/blog-comments.ts](../../../packages/domain/blog-comments.ts), [src/features/content/BlogComments.tsx](../../../src/features/content/BlogComments.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-COMMENT-008 — Hostile comment text

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer A/B, editorial moderator, guest public read
- Điều kiện/fixture: Published/unpublished parent posts; top-level/replies/deleted comments; report fixtures.

**Các bước**

1. Submit HTML/script/link giả và Unicode dài sát boundary

**Mong đợi:** Render text/sanitize an toàn; validate length; không chạy script.

**Đối chiếu source:** [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [packages/domain/blog-comments.ts](../../../packages/domain/blog-comments.ts), [src/features/content/BlogComments.tsx](../../../src/features/content/BlogComments.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## HISTORY — Lịch sử order, activity và audit

### SG-HISTORY-001 — Order history projection

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer own, operational roles theo handler
- Điều kiện/fixture: Orders có quote, acceptance,payment,changes,shipment; audit events synthetic.

**Các bước**

1. A orderHistory
2. staff đúng scope
3. compare timeline/source references

**Mong đợi:** Lịch sử đúng order và actor/time/state; private operational notes không lộ khách.

**Đối chiếu source:** [functions/src/order-history.ts](../../../functions/src/order-history.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/crm/Activity.tsx](../../../src/features/crm/Activity.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HISTORY-002 — History pagination

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer own, operational roles theo handler
- Điều kiện/fixture: Orders có quote, acceptance,payment,changes,shipment; audit events synthetic.

**Các bước**

1. Seed nhiều events cùng timestamp
2. next/back
3. concurrent event

**Mong đợi:** Cursor giữ deterministic order; không trả unbounded history.

**Đối chiếu source:** [functions/src/order-history.ts](../../../functions/src/order-history.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/crm/Activity.tsx](../../../src/features/crm/Activity.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HISTORY-003 — Reject không ghi success

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer own, operational roles theo handler
- Điều kiện/fixture: Orders có quote, acceptance,payment,changes,shipment; audit events synthetic.

**Các bước**

1. Gọi mutation invalid/forbidden/conflict
2. đọc timeline và audit

**Mong đợi:** Không có event business thành công hoặc ledger do reject; security audit tùy policy nguồn.

**Đối chiếu source:** [functions/src/order-history.ts](../../../functions/src/order-history.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/crm/Activity.tsx](../../../src/features/crm/Activity.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HISTORY-004 — Financial immutability

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer own, operational roles theo handler
- Điều kiện/fixture: Orders có quote, acceptance,payment,changes,shipment; audit events synthetic.

**Các bước**

1. Sau verify/refund/reverse thử direct update/delete financial entry

**Mong đợi:** Rules deny và business flow append correction; không rewrite entry gốc.

**Đối chiếu source:** [functions/src/order-history.ts](../../../functions/src/order-history.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/crm/Activity.tsx](../../../src/features/crm/Activity.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HISTORY-005 — Activity context

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer own, operational roles theo handler
- Điều kiện/fixture: Orders có quote, acceptance,payment,changes,shipment; audit events synthetic.

**Các bước**

1. Mở activity link order/return/invoice
2. record bị revoke/removed

**Mong đợi:** Link đúng entity, fallback safe; không mở entity ngoài rights.

**Đối chiếu source:** [functions/src/order-history.ts](../../../functions/src/order-history.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/crm/Activity.tsx](../../../src/features/crm/Activity.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HISTORY-006 — Actor spoof

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer own, operational roles theo handler
- Điều kiện/fixture: Orders có quote, acceptance,payment,changes,shipment; audit events synthetic.

**Các bước**

1. Gửi actor/name/createdAt client trong command strict hoặc evidence

**Mong đợi:** Actor/time do server; không giả staff/customer identity.

**Đối chiếu source:** [functions/src/order-history.ts](../../../functions/src/order-history.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/crm/Activity.tsx](../../../src/features/crm/Activity.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HISTORY-007 — Sensitive log

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer own, operational roles theo handler
- Điều kiện/fixture: Orders có quote, acceptance,payment,changes,shipment; audit events synthetic.

**Các bước**

1. Force validation/provider error bằng synthetic payload
2. inspect captured logs đã redact

**Mong đợi:** Không token,secret,share URL,địa chỉ đầy đủ hoặc raw AI private transcript.

**Đối chiếu source:** [functions/src/order-history.ts](../../../functions/src/order-history.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/crm/Activity.tsx](../../../src/features/crm/Activity.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HISTORY-008 — Audit reconstruction

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: customer own, operational roles theo handler
- Điều kiện/fixture: Orders có quote, acceptance,payment,changes,shipment; audit events synthetic.

**Các bước**

1. Thực hiện quote→accept→payment→shipment
2. đối chiếu versions/history

**Mong đợi:** Có lineage đủ đối soát thay đổi; thiếu evidence ghi FAILED thay vì suy diễn.

**Đối chiếu source:** [functions/src/order-history.ts](../../../functions/src/order-history.ts), [functions/src/index.ts](../../../functions/src/index.ts), [src/features/crm/Activity.tsx](../../../src/features/crm/Activity.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## OPS — Environment, backup/restore và release boundary

### SG-OPS-001 — Demo identity fail closed

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: operator test environment, OWNER
- Điều kiện/fixture: Emulator canonical demo-satsunicgo; local snapshot synthetic; staging chỉ khi có authorization riêng.

**Các bước**

1. Run demo check/harness với wrong project, nonloopback host và conflicting project vars

**Mong đợi:** Không seed/reset/maintenance vào cloud hoặc database khác.

**Đối chiếu source:** [scripts/emulator-test.mjs](../../../scripts/emulator-test.mjs), [tests/http/restore-fixture.mjs](../../../tests/http/restore-fixture.mjs), [scripts/release/preflight.mjs](../../../scripts/release/preflight.mjs), [scripts/release/bootstrap-owner.mjs](../../../scripts/release/bootstrap-owner.mjs), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-OPS-002 — Bootstrap owner preview

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: operator test environment, OWNER
- Điều kiện/fixture: Emulator canonical demo-satsunicgo; local snapshot synthetic; staging chỉ khi có authorization riêng.

**Các bước**

1. Chạy CLI help/dry-run theo source với UID fixture
2. thử target/project không hợp lệ

**Mong đợi:** Không grant cloud quyền bằng mặc định; authorization và target binding được kiểm tra.

**Đối chiếu source:** [scripts/emulator-test.mjs](../../../scripts/emulator-test.mjs), [tests/http/restore-fixture.mjs](../../../tests/http/restore-fixture.mjs), [scripts/release/preflight.mjs](../../../scripts/release/preflight.mjs), [scripts/release/bootstrap-owner.mjs](../../../scripts/release/bootstrap-owner.mjs), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-OPS-003 — Backup restore synthetic

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: operator test environment, OWNER
- Điều kiện/fixture: Emulator canonical demo-satsunicgo; local snapshot synthetic; staging chỉ khi có authorization riêng.

**Các bước**

1. Ở emulator tạo fixture orders/ledger/allocations
2. chạy restore fixture
3. compare IDs/hash/counts

**Mong đợi:** Lineage và totals giữ đúng; không coi restore fixture là backup production proof.

**Đối chiếu source:** [scripts/emulator-test.mjs](../../../scripts/emulator-test.mjs), [tests/http/restore-fixture.mjs](../../../tests/http/restore-fixture.mjs), [scripts/release/preflight.mjs](../../../scripts/release/preflight.mjs), [scripts/release/bootstrap-owner.mjs](../../../scripts/release/bootstrap-owner.mjs), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-OPS-004 — Restore partial failure

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: operator test environment, OWNER
- Điều kiện/fixture: Emulator canonical demo-satsunicgo; local snapshot synthetic; staging chỉ khi có authorization riêng.

**Các bước**

1. Inject failure giữa các bước restore vào database demo cô lập
2. kiểm tra resumability

**Mong đợi:** Không báo hoàn tất khi partial; không làm mất source snapshot; phục hồi có kiểm tra.

**Đối chiếu source:** [scripts/emulator-test.mjs](../../../scripts/emulator-test.mjs), [tests/http/restore-fixture.mjs](../../../tests/http/restore-fixture.mjs), [scripts/release/preflight.mjs](../../../scripts/release/preflight.mjs), [scripts/release/bootstrap-owner.mjs](../../../scripts/release/bootstrap-owner.mjs), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-OPS-005 — Preflight release gate

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: operator test environment, OWNER
- Điều kiện/fixture: Emulator canonical demo-satsunicgo; local snapshot synthetic; staging chỉ khi có authorization riêng.

**Các bước**

1. Chạy check-public-config offline fixture và preflight harness trên candidate manifest

**Mong đợi:** Provider disabled vẫn được ghi rõ; build/HTTP200 không thành provider readiness.

**Đối chiếu source:** [scripts/emulator-test.mjs](../../../scripts/emulator-test.mjs), [tests/http/restore-fixture.mjs](../../../tests/http/restore-fixture.mjs), [scripts/release/preflight.mjs](../../../scripts/release/preflight.mjs), [scripts/release/bootstrap-owner.mjs](../../../scripts/release/bootstrap-owner.mjs), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-OPS-006 — Environment UI isolation

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: operator test environment, OWNER
- Điều kiện/fixture: Emulator canonical demo-satsunicgo; local snapshot synthetic; staging chỉ khi có authorization riêng.

**Các bước**

1. Mở build thiếu Firebase config
2. emulator config đúng/sai
3. kiểm tra login demo visibility

**Mong đợi:** Không hiện demo login cho non-demo; UI lỗi cấu hình không lộ values nhạy cảm.

**Đối chiếu source:** [scripts/emulator-test.mjs](../../../scripts/emulator-test.mjs), [tests/http/restore-fixture.mjs](../../../tests/http/restore-fixture.mjs), [scripts/release/preflight.mjs](../../../scripts/release/preflight.mjs), [scripts/release/bootstrap-owner.mjs](../../../scripts/release/bootstrap-owner.mjs), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-OPS-007 — Rollback rehearsal

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: operator test environment, OWNER
- Điều kiện/fixture: Emulator canonical demo-satsunicgo; local snapshot synthetic; staging chỉ khi có authorization riêng.

**Các bước**

1. Dùng local artifact trước/sau và synthetic data
2. kiểm tra source-artifact identity/restore path

**Mong đợi:** Rollback plan có artifact identity và tác động data; cloud rollback NOT_RUN khi chưa cấp quyền.

**Đối chiếu source:** [scripts/emulator-test.mjs](../../../scripts/emulator-test.mjs), [tests/http/restore-fixture.mjs](../../../tests/http/restore-fixture.mjs), [scripts/release/preflight.mjs](../../../scripts/release/preflight.mjs), [scripts/release/bootstrap-owner.mjs](../../../scripts/release/bootstrap-owner.mjs), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-OPS-008 — Secret boundary artifact

- Priority: **P1** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: operator test environment, OWNER
- Điều kiện/fixture: Emulator canonical demo-satsunicgo; local snapshot synthetic; staging chỉ khi có authorization riêng.

**Các bước**

1. Scan tài liệu QA/artifact manifest keys và data fixture
2. kiểm tra chỉ hashes/path metadata

**Mong đợi:** Không lưu credentials/raw PII; manifest không hash hoặc đọc file secrets/env.

**Đối chiếu source:** [scripts/emulator-test.mjs](../../../scripts/emulator-test.mjs), [tests/http/restore-fixture.mjs](../../../tests/http/restore-fixture.mjs), [scripts/release/preflight.mjs](../../../scripts/release/preflight.mjs), [scripts/release/bootstrap-owner.mjs](../../../scripts/release/bootstrap-owner.mjs), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

## HELP — Domain helpers và transport contracts

### SG-HELP-001 — CSV parsing roundtrip

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: unit harness, customer UI
- Điều kiện/fixture: Pure function fixtures synthetic; schemas/limits lấy từ current source; không database/provider network.

**Các bước**

1. Parse/export comma,quotes,newline,Unicode và formula prefixes
2. thử thiếu/sai header

**Mong đợi:** Bảo toàn cell; errors theo schema; không đổi quantity/money hoặc chạy formula.

**Đối chiếu source:** [packages/domain/csv.ts](../../../packages/domain/csv.ts), [packages/domain/chat-action.ts](../../../packages/domain/chat-action.ts), [packages/domain/product-selection.ts](../../../packages/domain/product-selection.ts), [packages/domain/ask-stream.ts](../../../packages/domain/ask-stream.ts), [packages/domain/ask-images.ts](../../../packages/domain/ask-images.ts), [packages/domain/ask-read-task-plan.ts](../../../packages/domain/ask-read-task-plan.ts), [packages/domain/ask-hybrid-policy.ts](../../../packages/domain/ask-hybrid-policy.ts), [packages/domain/notification-content.ts](../../../packages/domain/notification-content.ts), [packages/domain/customer-order-filter.ts](../../../packages/domain/customer-order-filter.ts), [packages/domain/rich-content-html.ts](../../../packages/domain/rich-content-html.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/shared/service-error.ts](../../../src/shared/service-error.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HELP-002 — Product selection ambiguity

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: unit harness, customer UI
- Điều kiện/fixture: Pure function fixtures synthetic; schemas/limits lấy từ current source; không database/provider network.

**Các bước**

1. Chọn hai products gần tên và variants khác
2. query không có đủ thông tin

**Mong đợi:** Không chọn ngầm sản phẩm/size sai; cần user clarify đúng domain contract.

**Đối chiếu source:** [packages/domain/csv.ts](../../../packages/domain/csv.ts), [packages/domain/chat-action.ts](../../../packages/domain/chat-action.ts), [packages/domain/product-selection.ts](../../../packages/domain/product-selection.ts), [packages/domain/ask-stream.ts](../../../packages/domain/ask-stream.ts), [packages/domain/ask-images.ts](../../../packages/domain/ask-images.ts), [packages/domain/ask-read-task-plan.ts](../../../packages/domain/ask-read-task-plan.ts), [packages/domain/ask-hybrid-policy.ts](../../../packages/domain/ask-hybrid-policy.ts), [packages/domain/notification-content.ts](../../../packages/domain/notification-content.ts), [packages/domain/customer-order-filter.ts](../../../packages/domain/customer-order-filter.ts), [packages/domain/rich-content-html.ts](../../../packages/domain/rich-content-html.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/shared/service-error.ts](../../../src/shared/service-error.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HELP-003 — Chat action parser

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: unit harness, customer UI
- Điều kiện/fixture: Pure function fixtures synthetic; schemas/limits lấy từ current source; không database/provider network.

**Các bước**

1. Parse action hợp lệ
2. extra fields,malformed JSON,wrong action và links unsafe

**Mong đợi:** Chỉ action có schema; không thực thi text tự do thành mutation.

**Đối chiếu source:** [packages/domain/csv.ts](../../../packages/domain/csv.ts), [packages/domain/chat-action.ts](../../../packages/domain/chat-action.ts), [packages/domain/product-selection.ts](../../../packages/domain/product-selection.ts), [packages/domain/ask-stream.ts](../../../packages/domain/ask-stream.ts), [packages/domain/ask-images.ts](../../../packages/domain/ask-images.ts), [packages/domain/ask-read-task-plan.ts](../../../packages/domain/ask-read-task-plan.ts), [packages/domain/ask-hybrid-policy.ts](../../../packages/domain/ask-hybrid-policy.ts), [packages/domain/notification-content.ts](../../../packages/domain/notification-content.ts), [packages/domain/customer-order-filter.ts](../../../packages/domain/customer-order-filter.ts), [packages/domain/rich-content-html.ts](../../../packages/domain/rich-content-html.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/shared/service-error.ts](../../../src/shared/service-error.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HELP-004 — Stream parser split chunks

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: unit harness, customer UI
- Điều kiện/fixture: Pure function fixtures synthetic; schemas/limits lấy từ current source; không database/provider network.

**Các bước**

1. Chia mỗi byte boundary qua UTF-8/JSON stream
2. malformed/truncated frame
3. done/error

**Mong đợi:** Không mất ký tự Việt hoặc nhân đôi event; error/cancel không trả success giả.

**Đối chiếu source:** [packages/domain/csv.ts](../../../packages/domain/csv.ts), [packages/domain/chat-action.ts](../../../packages/domain/chat-action.ts), [packages/domain/product-selection.ts](../../../packages/domain/product-selection.ts), [packages/domain/ask-stream.ts](../../../packages/domain/ask-stream.ts), [packages/domain/ask-images.ts](../../../packages/domain/ask-images.ts), [packages/domain/ask-read-task-plan.ts](../../../packages/domain/ask-read-task-plan.ts), [packages/domain/ask-hybrid-policy.ts](../../../packages/domain/ask-hybrid-policy.ts), [packages/domain/notification-content.ts](../../../packages/domain/notification-content.ts), [packages/domain/customer-order-filter.ts](../../../packages/domain/customer-order-filter.ts), [packages/domain/rich-content-html.ts](../../../packages/domain/rich-content-html.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/shared/service-error.ts](../../../src/shared/service-error.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HELP-005 — Image intake schema

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: unit harness, customer UI
- Điều kiện/fixture: Pure function fixtures synthetic; schemas/limits lấy từ current source; không database/provider network.

**Các bước**

1. Parse byte/type/name/size boundary và corrupt content metadata

**Mong đợi:** Bounds/media meaning đúng; không coi metadata ảnh là xác nhận hàng từ nhà bán.

**Đối chiếu source:** [packages/domain/csv.ts](../../../packages/domain/csv.ts), [packages/domain/chat-action.ts](../../../packages/domain/chat-action.ts), [packages/domain/product-selection.ts](../../../packages/domain/product-selection.ts), [packages/domain/ask-stream.ts](../../../packages/domain/ask-stream.ts), [packages/domain/ask-images.ts](../../../packages/domain/ask-images.ts), [packages/domain/ask-read-task-plan.ts](../../../packages/domain/ask-read-task-plan.ts), [packages/domain/ask-hybrid-policy.ts](../../../packages/domain/ask-hybrid-policy.ts), [packages/domain/notification-content.ts](../../../packages/domain/notification-content.ts), [packages/domain/customer-order-filter.ts](../../../packages/domain/customer-order-filter.ts), [packages/domain/rich-content-html.ts](../../../packages/domain/rich-content-html.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/shared/service-error.ts](../../../src/shared/service-error.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HELP-006 — Read task plan

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: unit harness, customer UI
- Điều kiện/fixture: Pure function fixtures synthetic; schemas/limits lấy từ current source; không database/provider network.

**Các bước**

1. Compose tracking,invoice,catalog,rates task thiếu order/context hoặc ambiguous

**Mong đợi:** Read plan không phát sinh consent/payment/mutation; unavailable được giữ.

**Đối chiếu source:** [packages/domain/csv.ts](../../../packages/domain/csv.ts), [packages/domain/chat-action.ts](../../../packages/domain/chat-action.ts), [packages/domain/product-selection.ts](../../../packages/domain/product-selection.ts), [packages/domain/ask-stream.ts](../../../packages/domain/ask-stream.ts), [packages/domain/ask-images.ts](../../../packages/domain/ask-images.ts), [packages/domain/ask-read-task-plan.ts](../../../packages/domain/ask-read-task-plan.ts), [packages/domain/ask-hybrid-policy.ts](../../../packages/domain/ask-hybrid-policy.ts), [packages/domain/notification-content.ts](../../../packages/domain/notification-content.ts), [packages/domain/customer-order-filter.ts](../../../packages/domain/customer-order-filter.ts), [packages/domain/rich-content-html.ts](../../../packages/domain/rich-content-html.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/shared/service-error.ts](../../../src/shared/service-error.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HELP-007 — Hybrid policy

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: unit harness, customer UI
- Điều kiện/fixture: Pure function fixtures synthetic; schemas/limits lấy từ current source; không database/provider network.

**Các bước**

1. Input deterministic known task và unknown prompt
2. paid capability disabled

**Mong đợi:** Fallback đúng policy; không gọi paid inference chỉ do deterministic miss.

**Đối chiếu source:** [packages/domain/csv.ts](../../../packages/domain/csv.ts), [packages/domain/chat-action.ts](../../../packages/domain/chat-action.ts), [packages/domain/product-selection.ts](../../../packages/domain/product-selection.ts), [packages/domain/ask-stream.ts](../../../packages/domain/ask-stream.ts), [packages/domain/ask-images.ts](../../../packages/domain/ask-images.ts), [packages/domain/ask-read-task-plan.ts](../../../packages/domain/ask-read-task-plan.ts), [packages/domain/ask-hybrid-policy.ts](../../../packages/domain/ask-hybrid-policy.ts), [packages/domain/notification-content.ts](../../../packages/domain/notification-content.ts), [packages/domain/customer-order-filter.ts](../../../packages/domain/customer-order-filter.ts), [packages/domain/rich-content-html.ts](../../../packages/domain/rich-content-html.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/shared/service-error.ts](../../../src/shared/service-error.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HELP-008 — Customer order filter

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: unit harness, customer UI
- Điều kiện/fixture: Pure function fixtures synthetic; schemas/limits lấy từ current source; không database/provider network.

**Các bước**

1. Filter current/past/status và selected ID với legacy/cancelled/completed rows

**Mong đợi:** Không ẩn selected order trái source; counts phản ánh scope; không leak owner khác.

**Đối chiếu source:** [packages/domain/csv.ts](../../../packages/domain/csv.ts), [packages/domain/chat-action.ts](../../../packages/domain/chat-action.ts), [packages/domain/product-selection.ts](../../../packages/domain/product-selection.ts), [packages/domain/ask-stream.ts](../../../packages/domain/ask-stream.ts), [packages/domain/ask-images.ts](../../../packages/domain/ask-images.ts), [packages/domain/ask-read-task-plan.ts](../../../packages/domain/ask-read-task-plan.ts), [packages/domain/ask-hybrid-policy.ts](../../../packages/domain/ask-hybrid-policy.ts), [packages/domain/notification-content.ts](../../../packages/domain/notification-content.ts), [packages/domain/customer-order-filter.ts](../../../packages/domain/customer-order-filter.ts), [packages/domain/rich-content-html.ts](../../../packages/domain/rich-content-html.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/shared/service-error.ts](../../../src/shared/service-error.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HELP-009 — Rich content HTML

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: unit harness, customer UI
- Điều kiện/fixture: Pure function fixtures synthetic; schemas/limits lấy từ current source; không database/provider network.

**Các bước**

1. Roundtrip headings/tables/code/mermaid
2. script/link hostile
3. empty content

**Mong đợi:** Safe sanitized HTML; code hiển thị dạng code; output không executable.

**Đối chiếu source:** [packages/domain/csv.ts](../../../packages/domain/csv.ts), [packages/domain/chat-action.ts](../../../packages/domain/chat-action.ts), [packages/domain/product-selection.ts](../../../packages/domain/product-selection.ts), [packages/domain/ask-stream.ts](../../../packages/domain/ask-stream.ts), [packages/domain/ask-images.ts](../../../packages/domain/ask-images.ts), [packages/domain/ask-read-task-plan.ts](../../../packages/domain/ask-read-task-plan.ts), [packages/domain/ask-hybrid-policy.ts](../../../packages/domain/ask-hybrid-policy.ts), [packages/domain/notification-content.ts](../../../packages/domain/notification-content.ts), [packages/domain/customer-order-filter.ts](../../../packages/domain/customer-order-filter.ts), [packages/domain/rich-content-html.ts](../../../packages/domain/rich-content-html.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/shared/service-error.ts](../../../src/shared/service-error.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-HELP-010 — Notification/service errors

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: unit harness, customer UI
- Điều kiện/fixture: Pure function fixtures synthetic; schemas/limits lấy từ current source; không database/provider network.

**Các bước**

1. Compose target/status/error cho missing entity,unavailable,conflict,permission-denied

**Mong đợi:** Không raw exception/secret; next action đúng quyền và business meaning.

**Đối chiếu source:** [packages/domain/csv.ts](../../../packages/domain/csv.ts), [packages/domain/chat-action.ts](../../../packages/domain/chat-action.ts), [packages/domain/product-selection.ts](../../../packages/domain/product-selection.ts), [packages/domain/ask-stream.ts](../../../packages/domain/ask-stream.ts), [packages/domain/ask-images.ts](../../../packages/domain/ask-images.ts), [packages/domain/ask-read-task-plan.ts](../../../packages/domain/ask-read-task-plan.ts), [packages/domain/ask-hybrid-policy.ts](../../../packages/domain/ask-hybrid-policy.ts), [packages/domain/notification-content.ts](../../../packages/domain/notification-content.ts), [packages/domain/customer-order-filter.ts](../../../packages/domain/customer-order-filter.ts), [packages/domain/rich-content-html.ts](../../../packages/domain/rich-content-html.ts), [packages/domain/ask-language-query.ts](../../../packages/domain/ask-language-query.ts), [packages/domain/ask-response-composer.ts](../../../packages/domain/ask-response-composer.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/shared/service-error.ts](../../../src/shared/service-error.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.
