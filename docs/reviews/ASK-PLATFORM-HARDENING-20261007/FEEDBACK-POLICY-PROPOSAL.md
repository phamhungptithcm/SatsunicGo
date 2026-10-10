# Feedback cho Ask

Đề xuất để chủ doanh nghiệp duyệt; chưa phải chính sách đã công bố, chưa cấu hình production.

Giữ loại góp ý và mã tham chiếu trong **30 ngày**. Không sao chép thêm câu hỏi, câu trả lời, địa chỉ, thông tin liên hệ hay góp ý tự do vào kho feedback. Khách chủ động đồng ý sau khi xem thời hạn hiện hành từ server; lượt gửi gắn với phiên bản chính sách đó.

Khách có thể rút góp ý đã gửi hoặc đang chờ xác nhận ngay trong thẻ góp ý. Server thay bản ghi bằng dấu rút lại tối thiểu, không giữ loại góp ý/nội dung để review. Dấu này ngăn lượt gửi cũ đến muộn; timestamp của yêu cầu ngăn tái tạo từ replay cũ sau khi cleanup.

Bản ghi hết hạn không được đọc trong inbox hay dùng để xem xét. Cleanup định kỳ dùng batch có giới hạn và điều kiện phiên bản; chưa triển khai hay kiểm chứng lịch production. Thời điểm xóa vật lý, xử lý backlog, backup và xóa liên quan cần được xác nhận trước khi công bố cam kết lưu giữ.

OWNER có MFA gần đây xem loại góp ý, ghi nhận cần kiểm tra hướng dẫn, rồi kiểm tra bài viết đã xuất bản/được duyệt/đúng hash và còn hạn trước khi ghi nhận đã xử lý. Kiểm chứng retrieval dùng bộ câu hỏi công khai đã duyệt và đóng băng; không dùng feedback chưa review để đổi nguồn, prompt hoặc model. Kết quả retrieval không chứng minh chất lượng câu trả lời LLM.

Nguồn chính sách chính thức: chỉ nhận bài viết/trang chính sách do SatsunicGo xác nhận và duyệt qua workflow hiện có. Hiện chưa có corpus chính thức/holdout nghiệp vụ được chốt cho integration này. Nội dung synthetic trong test không phải chính sách doanh nghiệp.

Câu hỏi 30/7/90 ngày đã gửi trong phiên này; chưa có câu trả lời, nên thời gian chờ không được coi là chấp thuận. Không tự bật policy/retention/paid search hoặc xuất bản trang pháp lý.
