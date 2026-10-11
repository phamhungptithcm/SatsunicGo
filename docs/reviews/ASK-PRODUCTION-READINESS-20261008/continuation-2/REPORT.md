# Ask

**Production: NOT_READY.** Bản vá giữ feedback cleanup ngoài artifact đã qua vòng review → sửa → test → review độc lập. Proposal sẵn để duyệt, chưa áp dụng vào hai file release/tests thực tế. Parser được duyệt ở vòng trước vẫn giữ nguyên; preflight nhận diện93 Functions.

## Kết quả

| Kiểm tra | Kết quả | Phạm vi |
| --- | --- | --- |
| Node release/artifact/public-config | **58/58 PASS** | 43 ca hiện có+15 ca mới; synthetic fixtures, không phải58 luồng khách hàng live |
| Lint, syntax, apply-check | **PASS**, exit0 | Candidate riêng; chưa git apply |
| TypeScript backend | **PASS**, exit0 | Output ra tmp riêng; diagnostic compile, không phải release artifact |
| Hold trên compiled output hiện tại | **PASS**, 8 held, 85 remaining/93 | Giữ lifecycle import và withdraw/inbox/evaluation; không thực thi backend module |
| Source fence | **PASS**, 16 paths không drift | Dirty WIP và Gemini ledger giữ nguyên |
| Review độc lập | **PASSED_APPROVAL_READY_NOT_APPLIED** | Exact hai-file proposal; overall vẫn BLOCKED |

Reviewer xác minh lại exact patch và các hash. Chỉ đổi expected hold count7→8 ở một test cũ;30 test blocks cũ trong release suite giữ nguyên, thêm15 block mới. Combined58cases còn gồm13 public-config cases. Không cộng các lần chạy thành số case unique.

Năm lần chạy helper local: 25.083/9.208/5.589/4.936/3.749ms. Đây không phải benchmark so sánh, frontend/provider latency hoặc production load. Full unit 1245 và các demo/browser ở vòng trước không chạy lại vì không sửa app; chúng vẫn là bằng chứng lịch sử có phạm vi.

## Các lỗi đã tái hiện và sửa

1. Export cleanup trực tiếp hoặc qua module.exports có thể lọt khi inventory thiếu tên.
2. Getter lồng trong block/function có thể còn lại dù kết quả báo đã giữ export.
3. Static template keys xử lý không nhất quán.
4. Ngoặc quanh object/key có thể làm guard bỏ qua cleanup.
5. Spread của object literal chứa cleanup có thể lọt.

Mỗi lỗi có reproduction và replay red trước sửa. Candidate r1→r6 lần lượt đạt 49/51/53/55/57/58 cases; các review trước vẫn giữ nguyên. r5 là intermediate proposal, không có separate independent clean review. Review cuối xác nhận cả năm finding đã sửa trong phạm vi static shapes đã nêu.

Guard kiểm tra các export dạng literal rõ ràng; không chứng minh dynamic aliases, indexed expressions, computed calls hay toàn bộ side effects. Packaging hold không tắt một scheduler nếu nó đã được deploy. Các kiểm tra inventory production hiện có vẫn chặn xóa function ngầm.

[Review cuối](TL-HOLD-REVIEW-r6.json) và [Product Content Review](PRODUCT-CONTENT-HOLD-r6.md) đủ bảy nhóm review/tám nguyên tắc cho operator metadata proxy. Không chứng nhận customer layout, Apple HIG hay screen-reader audio.

## Knowledge và live

Đã đọc lại ba trang công khai. [Terms](https://satsunicgo.web.app/terms) vẫn ghi điều kiện đổi trả/hủy/hoàn tiền chưa duyệt; [Privacy](https://satsunicgo.web.app/privacy) vẫn chờ chính sách lưu trữ và liên hệ. Publication/extraction hash không thay thế knowledge approval hash. Chưa admit nguồn mới.

Đã chuẩn bị [12 câu đề xuất](KNOWLEDGE-CASES-r1.json) về cách nói thường ngày, typo, không dấu, tiền đề thanh toán sai, injection, ngôn ngữ và quyền đọc đơn. Chẩn đoán trên ba fixture sections đạt 6/7 top-1 matches. Câu catalog có tiền đề đặt cọc của mua hộ lấy custom section trước; default 8 trả cả ba phần, gồm catalog. Chưa kết luận generated answer sai; cần answer-level test với corpus/holdout được duyệt. Không tự đổi expected để làm test xanh.

Backend đọc metadata an toàn: billing/API enabled, ba endpoint Ask ở asia-southeast1 vẫn ACTIVE. Không chứng minh current source binding, mọi region, AppCheck/authenticated task hay Gemini quality. **50.000₫ vẫn dự phòng đủ; paid calls thêm: 0; chi phí thực tế: Unavailable.** Hai receipt cũ thiếu billing/correlation/completeness để giải phóng dự phòng.

## Cần chốt để tiếp tục

[DECISIONS.md](DECISIONS.md) có đúng plan/preview và nguồn cần chọn. Parser cũ đã được áp dụng; pending record lịch sử được supersede bằng [register hiện tại](DECISION-REGISTER-r2.json), không viết lại lịch sử.

- Duyệt exact cleanup-hold patch trước khi áp dụng hai file và chạy actual checks/review lại. Câu hỏi đã gửi; accepted:true chỉ xác nhận gửi câu hỏi, chưa phải approval.
- Official corpus và chính sách giao dịch/privacy; OWNER có MFA gần đây admit đúng normalized hash, ngôn ngữ/thời hạn và frozen holdout.
- Feedback retention, vận hành cleanup/backups; layout action window/waypoints/contextual consent vẫn chờ các quyết định đã hỏi.
- Bằng chứng billing scoped cho hai attempts trước; sau đó xác nhận ngân sách còn dùng được.
- Candidate được duyệt, exact tested artifact/source/provider binding, authenticated live web/LLM/task acceptance, rollout/rollback rồi mới deploy được phép. Không gom concurrent Analytics/other WIP tự ý.

## Governance và usage

Intelligence DEGRADED: indexes khỏe nhưng stale; CodeGraph trước, CocoIndex sau, critical facts kiểm tra bằng current source/hash/compiler/tests. Không forge READY. Node 22/TypeScript 6.0.3; profiles universal, TypeScript/JavaScript, DevOps, product-content, concurrency/memory; security review cho packaging boundary.

Root sole writer/executor; BA đối chiếu nguồn/decisions, backend kiểm tra metadata, technical lead review độc lập. Các lease đã trả. Frontend/UX handoff cũ được giữ, không nhận là năm specialists vừa chạy lại mọi UI/test.

HEAD 53d59bd88fa7da9d1243692336ecd09b6540ea31; concurrent dirty WIP giữ nguyên. Không commit/push/PR, deploy/restart/reseed, production write/payment/deletion, secret access hoặc paid call. Không sửa dependency/API/schema/CI/generated source.

Runtime adapter, weighted progress, token usage, actual cost và API-equivalent estimate: Unavailable; hashed receipts thủ công, không tạo bằng chứng runtime giả hoặc phần trăm. Memory candidates: None; không ghi durable memory. Overall review/production vẫn BLOCKED/NOT_READY, đây không phải successful production handoff.
