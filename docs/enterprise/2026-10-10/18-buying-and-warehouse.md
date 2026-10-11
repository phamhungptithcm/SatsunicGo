# Mua hàng, tiếp nhận và vận hành kho

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Mua và ghi nhận

Nhân viên mua hàng bắt đầu khi đúng loại đơn đạt điều kiện tiền và trạng thái. Thông báo chuyển khoản chưa xác minh không đủ. Trước thao tác phải đọc phiên bản mới, khoản khả dụng và hold.

Bằng chứng mua gắn đúng đơn, dòng, biến thể và lượng. Chứng từ người bán hoặc ghi chú riêng thuộc dữ liệu nội bộ; không tự đưa vào phần khách xem.

## Nhận theo dòng

Lượng yêu cầu, đã mua, đã nhận và đã đóng gói là các giá trị khác nhau. Tổng lượng đúng chưa đủ nếu từng dòng sai. Hàng thiếu, nhầm hoặc hỏng cần bằng chứng và xử lý ngoại lệ; không ghi đủ để chuyển bước.

Quy trình vận hành cần ghi tình trạng đến kho, lượng thực và người nhận. Những yêu cầu này cần được nghiệm thu cùng màn hình/hàm thực hiện, không chỉ đọc schema.

## Kiện và phân bổ

`packParcel` nhận allocations, cân nặng, kho, tuyến, ba kích thước, checklist và bằng chứng. Nguồn giới hạn tối đa 100 allocations và tối đa 10 order liên quan trong một kiện; các order phải tương thích thị trường theo guard.

Phân bổ cộng phần có sẵn và phần đề xuất để chặn vượt lượng mỗi dòng. Điều kiện packingComplete, packedQuantity và hold vẫn phải đúng. Allocation record cấp order giúp phát hiện hai thao tác cạnh tranh cùng hàng.

## Xuất kho và sai lệch

Kiện packed chưa có nghĩa được xuất. Kiểm tiền khả dụng, final approval, freight phiên bản và hold của mọi đơn. Kiện thuộc batch dùng đường batch phù hợp.

Khi phiên bản đổi, dừng và đọc lại. Khi thiếu bằng chứng hoặc ảnh chưa xử lý xong, không coi hồ sơ đầy đủ. Chênh lệch kiểm kê cần incident/ngoại lệ có thẩm quyền; không sửa database trực tiếp chỉ để số báo cáo khớp.
