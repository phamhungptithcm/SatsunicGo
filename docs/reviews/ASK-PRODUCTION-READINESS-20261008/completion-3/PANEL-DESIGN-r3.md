# Ask · Panel

Bản để duyệt: [VI / EN](../../../previews/ASK-PANEL-WORKCELL-20261008-r3.html). Chưa tích hợp vào ứng dụng. Giữ phạm vi [kế hoạch ban đầu](../../ASK-PANEL-WORKCELL-20261008/DESIGN-PLAN.md), bổ sung các sửa đổi đã kiểm chứng dưới đây. Bản gốc và r2 được giữ nguyên để đối chiếu.

Hội thoại nằm bên trái, cửa sổ tác vụ bên phải trên desktop. Trên mobile, khách chuyển giữa hội thoại và tác vụ; bản nháp được giữ. Form dài cuộn trong cửa sổ riêng, không kéo theo thanh chat hay các nút cuối form. Các điểm hội thoại dẫn về đúng nội dung đã trao đổi.

| Vấn đề đã tái hiện | Sửa trong r3 | Kiểm chứng |
| --- | --- | --- |
| Đổi ngôn ngữ khi xem lịch sử có thể mất chốt xác nhận | Giữ trạng thái lịch sử và banner; lịch sử chỉ để đọc | Bản gốc thất bại; r3 đạt |
| Nhãn “Kiểm tra thông tin” dẫn tới câu hỏi về giá | Đổi thành “Giá và thanh toán” / “Price and payment” | Nhãn và nội dung đích khớp |
| Đóng form đang sửa rồi nhắn đồng ý hoặc tiếp tục tạo bản kiểm tra vẫn bị ẩn | Mở bản kiểm tra và nội dung hệ quả trước; cần xác nhận thêm khi bản đó đang hiển thị | r2 thất bại; r3 đạt cho nút đóng, Để sau và Escape |
| Placeholder tiếng Anh bị cắt trên màn hình 320px | Dùng “Ask anything…”; giữ hướng dẫn và accessible name | Đo độ rộng, DOM và ảnh VI/EN |

Root thực thi 18 kịch bản × 4 kích thước (320, 390, 768, 1440) × 2 ngôn ngữ: **144/144 đạt**. Gồm 11 kịch bản trước, 6 kết hợp đóng form/nhắn tiếp và 1 kiểm tra placeholder. Không có lỗi console/page hoặc request khác GET. Năm lượt tái hiện ở bản cũ thất bại đúng kỳ vọng; chúng chứng minh bốn vấn đề trên, không phải năm lỗi ứng dụng.

Lượt chạy r3 đầu chưa hoàn thành vì script thiết lập bấm nút trở về khi nút đã ẩn. Đã giữ log/receipt riêng, sửa script rồi chạy đầy đủ; không tính 12 assertion của lượt dở dang vào kết quả 144/144. [Receipt hiện tại](PANEL-BROWSER-r3.json) và [ảnh đúng ngôn ngữ](PANEL-SCREENSHOTS-r3.json) bind với source trong [candidate](PANEL-CANDIDATE-r3.json).

Ngôn ngữ giao diện không thay nội dung khách đã nhập hoặc quyền thực hiện tác vụ. Prototype vẫn tạo lại hội thoại minh họa khi đổi ngôn ngữ; ứng dụng thật phải giữ transcript, task và vị trí đọc theo kế hoạch ban đầu. Không đưa hành vi minh họa này vào tích hợp.

Sau khi duyệt, slice đầu gồm submitRequest, acceptQuote, approveFinal, confirmReceipt và tạo đơn catalog. Profile/Membership giữ các nút hiện có trong slice đầu. Chat và button dùng cùng handler với preview bất biến: owner, conversation, target, payload/hash, revision và thời hạn còn hiệu lực. Sửa dữ liệu, đổi tài khoản/đích/version, hết hạn hoặc xem lịch sử làm mất consent. Tiếp tục chỉ mở bước kiểm tra; pending/unknown giữ operation identity để đối chiếu, không retry mù. Thông tin liên hệ riêng tư nằm ở form được bảo vệ.

Bản xem chỉ minh họa draft: không gửi yêu cầu, tạo đơn hay thanh toán. Kiểm thử ứng dụng có đăng nhập/App Check/backend, LLM, thanh toán, loading/offline/auth states, performance, native zoom, AT audio và thiết bị/browser khác chưa chạy. UX specialist chỉ đọc source; root là người chạy browser. Layout gate của ứng dụng vẫn **PENDING_REVIEW / NOT_IMPLEMENTED**.
