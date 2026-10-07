# SATSUNICGO-CATALOG-029 — Catalog sản phẩm thật

Status: APPROVED v1 — Human user replied `approved` on 2026-10-05; evidence: docs/approvals/SATSUNICGO-CATALOG-029.md.

## Yêu cầu và quyết định đã có

- 27 dòng đầu vào, 26 sản phẩm duy nhất; dedupe Sports Research 150 viên.
- Người dùng chọn production, chỉ giá tham khảo, xác nhận quyền dùng ảnh hãng/nhà cung cấp.
- Tìm thông tin đúng SKU, chuẩn bị ảnh, nhập nội dung và loại mock khỏi catalog.
- Quyết định về môi trường/giá/quyền ảnh chưa thay thế approval kế hoạch thay đổi theo repository.

## Intelligence brief và source evidence

HEAD: `3bd0d093255963a2cbf66ddd80d27456da7076e0`. Worktree nhiều WIP có sẵn; không sửa WIP của chat khác.

Repository Intelligence Gate ban đầu DEGRADED do index stale. `check-repository-intelligence.py --refresh-if-stale --json` exit 0, READY, cả CodeGraph/CocoIndex Current và health Passed. Đã query CodeGraph cho contentSchema/workspaceCommand/uploadContentImage/catalogProductSchema và CocoIndex cho catalog/fixture/giá/ảnh. Kiểm tra trực tiếp source để xác nhận kết luận. Symbol-impact không chứng minh coverage test đầy đủ.

- `functions/src/workspace.ts`: `contentSchema`, `workspaceCommand/saveContent`; OWNER/CONTENT_EDITOR; idempotency, expectedVersion, contentSlugs, versions và audit. `referencePrice` khác `listedPrice`. Không thay schema/API.
- `functions/src/media.ts`: `uploadContentImage`; ảnh PNG/JPEG/WebP <=2 MB, verifyImage, quyền biên tập và rightsConfirmed; contentMedia liên kết một nội dung. Không public token Storage.
- `packages/domain/catalog-checkout.ts`: chỉ orderable=true với listedPrice/termsVersion và schema đầy đủ mới checkout. Giữ orderable=false và không listedPrice theo yêu cầu giá tham khảo.
- `src/features/content/Content.tsx`, `src/features/content/ContentEditor.tsx`: catalog public/chi tiết và giao diện staff có sẵn. Không sửa React/CSS để nhập content nếu luồng production hoạt động.
- `scripts/seed-demo.mjs`: fixture `products/e2e005-product` chỉ emulator, không phải bằng chứng mock trong production. Giữ fixture kiểm thử; không reset/reseed shared emulator.
- Production được đọc công khai tại `https://satsunicgo.web.app/products`: beta chưa mở catalog và đăng nhập bị disabled. Chưa có session biên tập hoặc inventory database production được xác minh. Không tự mở beta/deploy chỉ để import.

Stack: TypeScript/React/Vite, Firebase Functions, Firestore, Storage, Zod. Phạm vi chủ yếu content/database publication. Profile: product-content, public-web/SEO, database/data-protection, security; không thay dependency, auth, payment hoặc infrastructure.

## Hồ sơ review được

- `docs/catalog/SATSUNICGO-CATALOG-029/research.json`: 26 định danh, quy cách, nguồn, giá tham khảo ứng viên, thiếu dữ liệu, draft nội dung tối thiểu và provenance ảnh.
- `docs/catalog/SATSUNICGO-CATALOG-029/RESEARCH.md`: bảng đối chiếu và blockers từng SKU.
- `docs/catalog/SATSUNICGO-CATALOG-029/images/*`: ảnh đã tải, chưa upload.
- `docs/catalog/SATSUNICGO-CATALOG-029/VALIDATION.json`: số lượng, SHA-256 và productionWrites=0.

Hồ sơ này chưa là payload import hoàn chỉnh. Không tự đưa field research vào contentSchema strict. Ingredient/usage/origin/HSD cần nguồn nhãn đúng SKU. Giá null không đưa thành 0. Nguồn search/page chưa checkout không được mô tả là giá bán hiện hành được bảo đảm.

## Kế hoạch nhỏ nhất sau khi được duyệt

1. Xác nhận URL quản trị/backend production đang hoạt động. Dùng session OWNER/CONTENT_EDITOR bình thường; không lấy token, nâng quyền hoặc dùng fixture account. Nếu chỉ beta đang khóa, ghi BLOCKED và yêu cầu chủ sở hữu xác định backend; không tự deploy hoặc mở đăng nhập.
2. Hoàn thiện thông tin nhãn, thương hiệu/quy cách/màu và ảnh đúng SKU. L'Oréal thiếu màu/dung tích, Azelaic thiếu thương hiệu/dung tích, CinSulin thiếu số viên cần xác nhận; không tự đoán. One A Day Healthy Advantage/Complete cần đối chiếu phiên bản.
3. Đọc inventory chỉ sản phẩm, contentSlugs và media cần thiết; đối chiếu 26 SKU bằng ID/slug/brand/quy cách. Lập manifest create/update/unchanged/archive và expectedVersion. Không đọc dữ liệu khách hàng. Nếu mock chưa xác minh chắc chắn, bỏ qua và báo ID cho chủ sở hữu.
4. Qua uploadContentImage, upload từng ảnh sạch đã duyệt và rightsConfirmed=true. Lưu mediaId/op-result để resume; không upload logo/banner/ảnh sai quy cách. MIME thật, <=2 MB, alt mô tả nhãn sản phẩm, không claim sức khỏe.
5. Qua workspaceCommand/saveContent, insert hoặc update đúng SKU, có title tiếng Việt tự nhiên + tên hãng chuẩn, body ngắn đầy đủ thông tin xác minh, category, referenceUrl, referencePrice khi có, priceCheckedAt khi kiểm tra trực tiếp lại, origin chỉ khi nhãn xác nhận, functions/usage có nguồn, SEO trung thực, mediaId. Không listedPrice, không invent stock/expiry, orderable=false. Không đoán termsVersion. Sản phẩm thiếu xác nhận giữ draft, không tạo nội dung placeholder công khai.
6. Mock đã xác minh chuyển archived qua saveContent/expectedVersion; giữ versions/media và lịch sử liên quan. Không hard-delete, không thay order snapshots, không động orders/payments/users/posts/fixtures.
7. Kiểm tra readback ID/version/slug/media/pricing và trạng thái mỗi operation. Khi lỗi một phần, resume bằng cùng operationId phù hợp, không duplicate SKU. Audit/readback thất bại không gọi thành công. Rollback bằng nội dung trước và expectedVersion hiện tại, có ledger; không ghi đè concurrent edits.
8. Mở catalog/chi tiết production kiểm tra ảnh, quy cách, VND hiển thị rõ giá tham khảo, SEO, không checkout giá thị trường, mock không còn hiển thị, mobile/desktop/keyboard và empty/error state. Hoàn tất Product Language Gate, quality gates và final-implementation-review trên dữ liệu/source hiện tại.

## Phạm vi file/function

Mặc định không sửa application file hoặc backend function. Cập nhật riêng hồ sơ catalog029, plan/approval/review/catalog publication receipts (không token/PII). Dùng function hiện có `uploadContentImage`, `workspaceCommand.saveContent` và API readback được ủy quyền. Nếu API/backend production thiếu khả năng cần thiết: delta plan trước code, database script, config hoặc deploy. Không tạo bulk Admin SDK script để bypass auth/version/audit.

## Rủi ro, vận hành và rollback

Rủi ro MEDIUM cho content; HIGH nếu ghi production thiếu inventory/approval. Tên giống nhưng SKU khác, giá khuyến mại hết hạn, health claims sai, hình promotional và concurrent edits là các rủi ro thực tế. Không lấy giá nhiều biến thể làm giá đúng SKU. Không công bố hiệu quả điều trị/liều dùng suy diễn hoặc cam kết hàng chính hãng/tồn kho từ người bán thứ ba. Cần xác nhận điều kiện cung cấp sản phẩm chăm sóc sức khỏe trước publication phù hợp; không sửa policy để cho qua.

Archive giữ khả năng khôi phục; hard delete loại khỏi scope. Không đổi schema, API, payment, CI, config hoặc infra. Nếu backend không hoạt động, import/publication BLOCKED, không coi file nghiên cứu là kết quả production.

## Acceptance và checks sau approval

- 26 SKU phân biệt; duplicate=0; tất cả item có trạng thái và nguồn rõ.
- Nhãn/thành phần/usage/quy cách đúng SKU và ảnh <=2 MB; không banner/logo/hình sai; giá VND có nguồn và ngày kiểm tra, missing không thành zero.
- Chỉ giá tham khảo; published chưa orderable; incomplete draft.
- Exact mock IDs archived; đơn hàng và lịch sử không thay đổi.
- Provider readback và catalog/ảnh production xác minh; retry/version conflict không overwrite.
- Product content review all eight principles + browser evidence; latest final review PASSED trước successful handoff.

Approval cần ghi plan ID này, approver human/task reference, scope và constraints. Approval cho plan không bao gồm mở beta, deploy, nâng quyền, hard delete hoặc thay payment.
