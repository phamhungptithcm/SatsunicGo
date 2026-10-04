# Cách dùng bộ master prompt

Bộ này chứa **đặc tả triển khai dành cho coding agent**, không phải source code ứng dụng đã được xây hoặc phát hành.

## Các file

- `MASTER_PROMPT.md`: toàn bộ prompt triển khai bằng tiếng Việt.
- `docs/references/homepage-chat-reference.png`: ảnh người dùng cung cấp, làm tham chiếu cho composer dài, fixed và căn giữa dưới viewport.
- `OFFICIAL_REFERENCES.md`: các tài liệu kỹ thuật chính thức làm cơ sở cho những quyết định quan trọng.

## Chạy trong repository

Giải nén và đưa nội dung bên trong thư mục này vào root repository đích. Không ghi đè file đang có cùng tên mà chưa kiểm tra. Mở Codex hoặc coding agent tại root repository rồi gửi:

```text
Đọc đầy đủ MASTER_PROMPT.md và ảnh docs/references/homepage-chat-reference.png.
Thực hiện hợp đồng triển khai trong file này, không chỉ trả về kế hoạch.

Bắt đầu bằng khảo sát repository, giữ nguyên thay đổi không liên quan, lập
requirements matrix rồi triển khai luồng yêu cầu mua hộ -> báo giá -> cọc 50%
-> mua hàng -> nhận/đóng gói -> thanh toán phần còn lại -> xuất gửi -> theo dõi.
Tiếp tục hoàn thành CRM, membership, phân quyền, CMS/quảng bá và AI composer.
Ask Anything phải giống 100% UI/UX, behavior và animation/transition của
Ask HunpeoLabs theo baseline source và bảng parity ở mục 14; chỉ đổi thương hiệu,
nội dung và nghiệp vụ thành SatsunicGo.

Sau mỗi luồng, chạy kiểm thử, sửa lỗi và cập nhật bằng chứng. Khi một dịch vụ ngoài
chưa có credentials, ghi BLOCKED_EXTERNAL, khóa an toàn đường chưa xác minh
và tiếp tục những phần có thể làm. Không tạo giao dịch thật hoặc public launch
khi chưa được chủ dự án ủy quyền rõ.
```

Cách khác: mở `MASTER_PROMPT.md`, copy toàn bộ nội dung vào coding agent và đính kèm ảnh tham chiếu. Khi hết context, yêu cầu phiên mới đọc lại master prompt, requirements matrix và test evidence trong repo; không yêu cầu bắt đầu lại hoặc ghi đè toàn bộ dự án.

## Giả định cần xác nhận trước vận hành thật

Tên SatsunicGo là tên tạm. Khách ở Việt Nam và tiền thu VND là giả định của bản thiết kế, không phải thông tin người dùng đã xác nhận. Nguồn mua US/JP/KR, cọc 50%, React + Firebase và composer fixed dưới trang chủ là yêu cầu gốc.

Mặc định thu số dư trước xuất gửi từ kho nguồn. Chủ doanh nghiệp cần xác nhận thời điểm thu còn lại theo quy trình vận hành thực tế. Chỉ thu cọc sau khi xác định đúng sản phẩm và khách chấp nhận báo giá.

Trước nhận tiền thật cần chốt: pháp nhân/đơn vị vận hành và thị trường phục vụ; tài khoản nhận tiền/provider; bảng phí/tỷ giá; kho/tuyến/dịch vụ vận chuyển; giá/quyền lợi membership; điều khoản cọc/đổi trả/hoàn tiền/hàng hạn chế; giờ nhân viên hỗ trợ; owner/nhân viên; Firebase project/domain/billing; email sender và model access.

Agent phải tiếp tục triển khai phần độc lập với các thông tin trên. Không tự bịa các dữ liệu thương mại còn thiếu để bật bán hàng.
