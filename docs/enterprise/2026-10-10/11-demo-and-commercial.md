# Kịch bản demo và hồ sơ giới thiệu

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Nội dung giới thiệu

SatsunicGo nối quá trình chọn hàng, yêu cầu mua hộ, xử lý giá, tiền, kho và theo dõi giao trong cùng hệ thống. Nhân viên thực hiện mua và vận hành; AI hỗ trợ thông tin và chuẩn bị thao tác. Tính năng được giới thiệu phải nói đúng phần đã có và phần đã được nghiệm thu.

Bản trình bày là tài liệu tóm tắt. Bộ hồ sơ kỹ thuật và nghiệp vụ giữ chi tiết về điều kiện, ngoại lệ, dữ liệu và vận hành. Không dùng số slide thay độ đầy đủ của hồ sơ sản phẩm.

## Chuẩn bị buổi demo

Dùng dữ liệu giả lập được phép, tài khoản có vai trò rõ và môi trường đã kiểm tra. Không tạo giao dịch thật hoặc gửi email cho khách để trình diễn. Nếu dùng sandbox, ghi đúng sandbox; nếu dùng bản quay trước, ghi đúng thời điểm và phiên bản.

Kịch bản theo hành trình: danh mục → giỏ → tổng quan → xác nhận; tiếp theo là nhân viên xử lý, kho, kiện gửi và theo dõi. Cần có một tình huống chưa rõ kết quả hoặc xung đột để thể hiện cách khôi phục, không chỉ trình diễn đường thuận lợi.

## Sau buổi demo

Ghi môi trường, phiên bản, những cảnh thực sự chạy, kết quả và vấn đề còn mở. Không biến một buổi demo thành chứng nhận thanh toán, tải hoặc vận hành. Các cam kết thương mại được đưa vào proposal và tiêu chí nghiệm thu riêng.

## Dữ liệu gọi vốn

Doanh thu, số khách, tỷ lệ mua lại, margin, chi phí và thị trường phải có nguồn. Không dùng dữ liệu demo, số module hoặc số test làm bằng chứng tăng trưởng. Định giá, số vốn và kế hoạch dùng vốn do founder cung cấp và phê duyệt.

## Bảng tham chiếu chi tiết

| Thời gian | Cảnh | Điều cần chứng minh | Điều kiện / fallback |
| --- | --- | --- | --- |
| 0–2 phút | Catalog và sản phẩm | Biến thể, giá niêm yết, phân biệt yêu cầu riêng | Synthetic content approved; không dùng dữ liệu khách thật |
| 2–5 phút | Cart, recipient, preview, confirm | Server total/snapshot và recovery cùng operation | Shared demo có sẵn; nếu unavailable dùng deck và ghi prerecorded/source walkthrough |
| 5–7 phút | Staff queue và operations | Phân vai, buying/receiving/packing, audit | Synthetic staff, không giả MFA thật đã đạt |
| 7–9 phút | Order/parcel tracking | Partial delivery và owner projection | Không show share code thật hoặc PII |
| 9–11 phút | Payment/notification exception | Pending khác paid; unknown cần reconcile | Ghi rõ demo payment/sandbox; không tạo giao dịch thật |
| 11–12 phút | Readiness và next milestone | Những gì đã thấy và bằng chứng cần hoàn thiện | Trả lời theo candidate, không hứa roadmap có deadline chưa duyệt |
