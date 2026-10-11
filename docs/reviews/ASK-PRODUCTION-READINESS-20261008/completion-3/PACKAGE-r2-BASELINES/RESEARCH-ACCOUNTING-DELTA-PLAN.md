# Ask · Ngân sách tìm web

Đề xuất để review, chưa sửa source hoặc cấu hình. Giữ tổng ngân sách Gemini **50.000₫** và toàn bộ evidence của hai attempts cũ. Actual billed cost vẫn Unavailable.

## Vấn đề đã xác minh

Production runWebDiscovery yêu cầu importedReservedVnd tối thiểu 50.000 và reservedVnd không thấp hơn importedReservedVnd. researchReservation cần thêm 25.000 trong ceiling 50.000. Vì vậy không có lượt production mới nào qua admission hiện tại, kể cả sau khi đối chiếu được charge thấp hơn. Không thể sửa bằng bật settings, xóa ledger hoặc giảm import. Cùng đường emulator dùng minimum 0; kết quả emulator không chứng minh production admission.

## Phạm vi delta nhỏ nhất

Source cần review nếu quyết định triển khai: functions/src/ai/research-live.ts, research-gemini.ts; helper/import ledger hiện có được xác minh trước khi sửa; tests/unit/ask-research-budget.test.ts và tests hiện có cho live admission/recovery. Tên test/helper phải lấy từ source thực tế khi freeze patch; danh sách này chưa là approved patch. Không thay merchant/payment/auth/App Check/public API hoặc tăng budget.

- Giữ lịch sử import bất biến và từng attempt identity. Tách lịch sử reservation đã nhập khỏi mức exposure đang còn giữ; không biến imported total thành current exposure.
- Chỉ đối chiếu settlement có bằng chứng được phép. Settled charge, credits/currency conversion và remaining uncertainty cần quy tắc owner review; không tự xem BLOCKED/timeout là miễn phí.
- Admission dựa trên settled spending cộng mọi unsettled reservation cộng reservation mới, không vượt ceiling 50.000₫. Charge chưa rõ tiếp tục giữ đủ exposure. Nếu thiếu bằng chứng cho cả hai attempts, path tiếp tục đóng.
- Reservation/settlement phải atomic, idempotent theo attempt và chống concurrent dispatch. Cùng settlement không release hai lần; lost response chỉ readback đúng identity.
- Bản import hiện có không tự migrate hay ghi lại trong kế hoạch này. Đường vận hành/cấu hình và mọi production write cần phạm vi, quyền, rollback và evidence riêng.
- Pricing/model/region hiện hành phải xác minh trước paid dispatch. Không tự thay model hoặc kéo dài pricing expiry.
- [Tài liệu chính thức đã đối chiếu](PUBLIC-PROVIDER-CHECK.md): model hiện dùng retirement20-10-2026. Thêm lifecycle/migration vào review trước rollout dài hạn; không suy endpoint/project health từ public docs hoặc silent fallback sang model khác.

## Happy và bad cases bắt buộc

| Trường hợp | Oracle |
| --- | --- |
| Cả hai attempts settled, bằng chứng đầy đủ | Tính exposure đúng; reservation mới chỉ khi tổng trong ceiling |
| Một attempt unknown hoặc billing chưa đầy đủ | Giữ reservation tương ứng; không mở capacity bằng phỏng đoán |
| Settlement trùng/lost response/retry | Chỉ một kết quả trên cùng identity; tổng không giảm lần hai |
| Hai lượt reserve đồng thời | Atomic ceiling, tối đa số lượt hợp lệ; không vượt 50.000₫ |
| Charge/credits/currency không được duyệt | Từ chối reconciliation; không nhận số âm hoặc số quy đổi giả |
| Sai import/hash/project/model/region/attempt | Fail closed; không gọi provider |
| Budget đủ nhưng pricing/merchant policy hết hạn | Fail closed trước credential acquisition/dispatch |
| Provider timeout sau dispatch | Giữ exposure và outcome unknown; không tạo attempt mới để retry mù |

Chạy unit/local admission trước, rồi môi trường synthetic được phép; readback exact ledger/attempt/hash. Paid provider acceptance chỉ sau settled evidence, reviewed delta, current pricing và capacity thật. Hiện chưa có accounting delta áp dụng, migration, settlement, reservation mới hoặc paid call từ kế hoạch này.
