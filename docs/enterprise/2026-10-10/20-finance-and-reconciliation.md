# Thu tiền, đối soát, số dư và hoàn tiền

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Các đối tượng tiền

Khoản phải trả là nghĩa vụ theo giá/điều khoản đã chấp nhận. Khoản thu là tiền đã xác minh và phân bổ. Thông báo chuyển khoản chỉ yêu cầu kiểm tra. Lệnh hoặc liên kết thanh toán tạo đường trả tiền, chưa chứng minh tiền vào. Phần tiền dành cho hồ sơ hoàn làm giảm khoản còn khả dụng.

VND dùng số nguyên; chuyển đổi tỷ giá dùng phép tính tỷ lệ. Ngoài số học còn phải khớp đơn, chủ sở hữu, tiền tệ, trạng thái và phiên bản.

## Đối soát

Finance đối chiếu nguồn ngân hàng/nhà cung cấp với mã tham chiếu duy nhất, số tiền và hồ sơ. Máy chủ ghi phân bổ cùng bút toán trong giao dịch. Mã đã dùng không được phân bổ lần hai. Hồ sơ chờ kiểm tra chỉ được xác nhận khi ngữ cảnh khớp.

Không dùng ảnh QR, chuyển hướng hoặc lời nói trong chat làm bằng chứng khoản thu. Khi chưa rõ giao dịch thuộc đâu hoặc nhà cung cấp chưa xác nhận, giữ trạng thái cần đối soát thay vì phân bổ tạm.

## Số dư và hồ sơ hoàn

`balance()` phân biệt khoản thu ròng, còn phải trả và trả thừa. Điều kiện xuất gửi còn xét `refundReserved`. Ví dụ đã thu 2.000.000, đã hoàn 200.000 và dành hoàn 300.000 VND thì phần khả dụng tương ứng là 1.500.000 VND.

`refundCommand` tạo/hủy hồ sơ pending và điều chỉnh phần tiền dành trước; không tự chứng minh hoàn qua ngân hàng. Xác nhận hoàn thực cần đường tài chính, bằng chứng và mã tham chiếu. Đóng hồ sơ hàng trả không đồng nghĩa khách đã nhận tiền.

## Ngoại lệ và đóng kỳ

Chữ ký sai, số tiền/ngữ cảnh không khớp, phản hồi trùng hoặc chưa rõ kết quả cần xử lý riêng. Đọc lại nhà cung cấp trước khi gửi lại lệnh có thể đã thực hiện.

Đóng kỳ cần đối chiếu sổ giao dịch, khoản chưa phân bổ, trả thừa, hoàn pending và unknown. Doanh thu kế toán khác tổng collected; finance phải duyệt cách ghi nhận trước khi đưa số liệu vào hồ sơ gọi vốn.
