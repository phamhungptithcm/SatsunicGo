# Thanh toán mua hộ — bàn giao kiểm thử cục bộ

Đã hoàn tất luồng mock theo mô hình tạo liên kết → trả tiền ở cổng → thông báo ký/đối chiếu server → phân bổ tiền → tạo đơn → PDF chạy nền. Giữ form mua hộ, giỏ hiện có và tổng quan xác nhận. Đây là luồng trên demo dùng chung5207; PayOS/ngân hàng/mail thật và triển khai production chưa được kiểm chứng.

## Kết quả và bằng chứng

| Lớp | Kết quả hiện tại |
| --- | --- |
| Unit | 132/132,10 files |
| Rules/worker | 19/19,3 files; fixture dùng chung, nguyên timeout15s |
| HTTP happy/negative | 69/69,171 HTTP calls |
| Nghiệp vụ mua hộ | 17/17; mixed4.695.000đ, chênh giá200.000đ, chi phí cuối255.000đ, chặn gửi khi thiếu tiền |
| Callback giữa instance | Hai tiến trình Node độc lập, một đơn/ledger/receipt |
| PDF | Ba chứng từ lần đầu/chênh giá/chi phí cuối, hash khớp API/Storage, ba trang không chữ vượt lề, đã xem PNG |
| UI |11 nhóm; form → cart → nhận hàng → tổng quan/consent reset → gateway → unknown → trả tiền/thông báo muộn → server đối soát → success → đúng đơn; CSS320/390 không tràn, PDF44px/bàn phím |
| Build/static | Frontend/functions build, scoped ESLint/Prettier, git diff --check passed |
| Tài nguyên |3200 việc queue,1600 reject dự kiến,50 PDF30 dòng; năm mẫu sau GC; heap delta340968 bytes |

Kịch bản chi tiết: [GATEWAY-SCENARIOS.md](GATEWAY-SCENARIOS.md). Từng hành trình có tiền đề, kết quả và nơi kiểm chứng; không cộng các vòng chạy lại thành số lượng ca mới. [PDF mẫu](../../../output/pdf/payment-gateway-business-20261008/receipt-e2e-initial.pdf).

## Các sửa chữa trong vòng review

1. Cổng demo có intent/link riêng và thông báo ký bằng SDK PayOS2.0.5; binding owner/link/orderCode/VND/reference/số thực nhận/thời điểm. URL trả về không ghi tiền; nhánh giả lập cũ không vượt liên kết.
2. Retry/concurrent callback phân bổ một lần bằng giao dịch Firestore. Trả thiếu/thừa và drift/khóa sau nhận tiền giữ actualAmount để đối chiếu, không tạo đơn/PDF giả hay tự hoàn tiền. Hết hạn không giải phóng tiền chưa rõ.
3. GetAll giảm vòng đọc, queue giới hạn64 khóa/16 việc theo khóa, cleanupfinally; claim/retry PDF riêng, job orphan/lease terminal không chiếm batch mãi.
4. Lỗi mạng có hướng dẫn tiếng Việt; mục tiêu bấm44px, giữ địa chỉ và lượt chưa rõ.
5. Callback muộn giữ thời gian trả tiền thực của provider trên checkout/PDF, tách thời gian xử lý. Red assertion lệch28ms; green và G008 khớp. Chứng từ cũ không bị sửa.
6. Fixture chọn đúng mã receipt gốc thay vì dòng đầu theo owner; đã chứng minh ca âm tính200001/200000 gây flake. Background PDF trở thành assertion bắt buộc. Nguyên assertion tài chính, quyền và timeout được giữ.

[Final review](GATEWAY-FINAL-REVIEW.json): PASSED cho scope cục bộ, vòng7. Tất cả các vòng lỗi và sửa được giữ; không có blocking finding còn biết trong những phép kiểm tra đã chạy. Một lần race HTTP trước đó cả hai call reject mà chưa thu được mã lỗi; nguyên nhân chưa chốt. Hai suite sau và các tiến trình độc lập đều qua; không dùng kết quả này suy ra production ổn định.

## Code, bảo mật và tương thích

[Code quality review](GATEWAY-CODE-QUALITY.md), [Product content review](GATEWAY-PRODUCT-CONTENT.md), [Quality gates](GATEWAY-QUALITY-GATES.md), [Source manifest](GATEWAY-SOURCE-MANIFEST.json). TypeScript6/React19/router7/Firebase/Firestore/Storage; thực thi Node25.9, target Functions22 chưa chạy. Profile universal/TS-JS/HTML-CSS/web/API/database/concurrency/memory/visual/product được áp dụng. CodeGraph rồi CocoIndex, critical source/test verification trong DEGRADED. Không thêm dependency hay sửa quyền/rules để test qua.

Các file thay đổi ứng dụng: index.ts chỉ thêm export emulator webhook; purchase-checkout/receipts quản lý giao dịch, batch và PDF lease; domainpurchase-checkout thêm metadata optional; modules provider/gateway/queue; payment UI và transport feedback. Scripts/test mới và inventory nằm trong manifest. Whole-file hashes không gán quyền sở hữu mọi dòng của file dùng chung. Shared cart/request CSS và công việc Ask/analytics/release khác được giữ.

Chỉ thêm contract demo và metadataoptional; chưa có migration/backfill/TTL xóa tài chính. PDF có từng món, số lượng, đơn giá/fee/thành tiền, tổng, phương thức và giờ Việt Nam; là chứng từ khoản đã thu, không phải hóa đơn thuế. Trước adapter thật phải có cấu hình phí/FX/địa chỉ/cước đã duyệt. Quyền tải PDF kiểm lại sau I/O, Storage private/hash/3MB. Key giả lập chỉ nằm trong cấu hình demo riêng tư; không credential merchant thật, raw webhook hoặc PII logging. Observability có audit/evidence/lease/attempt/failure categories/outbox; alerts/SLIs production chưa xác minh.

## Đo lường và giới hạn

HTTP171 call trên shared inspect emulator: p5017ms, p953741ms, max6098ms. Đây là số đo của bộ ca hỗn hợp, không phải năng lực tải production. Batching/queue là tối ưu tranh chấp; giao dịch/lease bền vững mới là thẩm quyền giữa instance. Probe GC hữu hạn không chứng minh không rò rỉ; soak/load/heap snapshot và device/AT matrix chưa chạy. Bundle warnings cũ còn nguyên.

Native file-save Chrome NOT_VERIFIED: công cụ không nhận download event; browser policy chặn trang downloads, không đi đường vòng. Bytes/hash/render PDF qua API/Storage PASSED. Fixture CI hiện hành cần Storage9298 NOT_RUN tại đây; shared variant giữ năm nhóm assertion gốc và source hiện tại đã qua. Native scheduler/trigger registration không được hub dùng chung chứng minh; runnerwatch gọi chính recovery handler có giới hạn, không phải deployed Eventarc proof.

Native ai-agent-kit CLI unavailable: criterion/check/review/task receipt NOT_RUN, báo cáo file-backed. Approval validator đã thử nhưng trả ERROR vì chỉ nhận READY; workflowrepo cho phép DEGRADED, approval humanv3/latest đầy đủ. Không giả mạo receipt hay hạ gate.

## Vận hành và bước production còn lại

Không reset/reseed runtime hay tạo frontend khác; worker do task quản lý được tạm dừng cho lease test rồi khôi phục. HMAC demo theo [tài liệu PayOS](https://payos.vn/docs/api/); mock mô phỏng các giai đoạn, không chứng nhận PayOS thật hoặc chỉ cần điền key là xong. Khi setup xong cần adapterAPI/merchant/time/account/redirect thật, callbacks/đối soát ngân hàng, manual review tiền, SMTP/inbox, Node22, deployed scheduler/IAM/AppCheck, retention/monitoring/load và release readback. Rollback tắt exposuredemo, giữ bằng chứng/ledger/chứng từ; không financial datafix hay phát hành lại chứng từ cũ.

## Báo cáo hoàn tất

Năm tiêu chí cục bộ có trọng số20/25/20/15/20 đều PASSED:100% scope mock đã duyệt. Không phải100% mọi tình huống/production. Remaining scoped criteria: None; production readiness: NOT_READY với các tích hợp/kiểm chứng nêu trên. HEAD0d6e721698608eebb36b0b2f68021c3054d97d1c; manifestdf6bcc5170c527da1ca28e6120d566ba3d5d44fa6d1531326a6a1654483c7663; worktree dirty do source hiện tại và WIP đồng thời. Commit/push/deploy cho vòng payment này: NOT_RUN. Native reporting unavailable. Token usage provider: Unavailable; API-equivalent estimate và billed cost: Unavailable. Memory candidates: None.
