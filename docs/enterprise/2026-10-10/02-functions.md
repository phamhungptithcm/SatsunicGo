# Đặc tả chức năng

SatsunicGo • Phiên bản 1.1 • 10/10/2026

## Các nhóm chức năng

Chức năng khách hàng gồm xem nội dung công khai, chọn sản phẩm, gửi yêu cầu mua hộ, quản lý giỏ, xác nhận thông tin, theo dõi thanh toán, đơn và kiện hàng. Hồ sơ cá nhân, địa chỉ, chứng từ, membership, hỗ trợ và lựa chọn thông báo có đường dữ liệu riêng.

Nhân viên xử lý báo giá, mua hàng, tiếp nhận, đóng gói, phân bổ kiện, đối soát tiền, hồ sơ hoàn và ngoại lệ. Nội dung, hình ảnh, bài viết, đánh giá và chiến dịch được quản lý theo quyền biên tập. Ask hỗ trợ thông tin và chuẩn bị thao tác, không thay quyền quyết định của máy chủ.

## Đầu vào, đầu ra và quyền

Một chức năng cần có người thực hiện, điều kiện bắt đầu, dữ liệu gửi, kết quả và cách xử lý lỗi. Với thao tác ghi, các trường như `operationId`, `expectedVersion` hoặc revision của giỏ giúp nhận diện lần gửi và phát hiện dữ liệu đã đổi.

Kết quả `{id, version}` xác nhận một thao tác theo hợp đồng của hàm. Nó không mặc nhiên là bằng chứng tiền đã vào, hàng đã mua hoặc email đã đến. Mỗi kết quả ngoài hệ thống cần bằng chứng tương ứng từ ngân hàng, nhà cung cấp hoặc hoạt động thực tế.

## Trạng thái giao diện

Phải xử lý đầy đủ đang tải, không có dữ liệu, dữ liệu chưa đủ, lỗi nhập, mất kết nối, phiên hết hạn, bị từ chối quyền và chưa rõ kết quả. Không thay thông tin chưa đọc được bằng số 0. Khi giỏ hoặc chính sách đã đổi, khách cần xem lại tổng quan trước khi xác nhận.

Đơn mở bằng liên kết trực tiếp phải được đọc và kiểm tra quyền riêng, kể cả khi không nằm trong trang danh sách hiện tại. Khi đổi tài khoản hoặc bị khóa, dữ liệu riêng không còn được phép phải được xóa khỏi phần hiển thị thích hợp.

## Tham chiếu triển khai

Danh mục export ghi các hàm được entrypoint tham chiếu. Chương 37 mô tả hợp đồng theo từng module; chương 38 mô tả schema và kiểu dữ liệu. Export trong nguồn không chứng minh hàm đã triển khai hoặc đã được bật ở môi trường thực tế.

## Bảng tham chiếu chi tiết

| Nhóm | Actor | Đầu vào và xử lý | Kết quả / đường lỗi |
| --- | --- | --- | --- |
| Catalog/content | Visitor, content editor | Published content, biến thể, giá, ảnh | Chỉ nội dung công khai; ảnh kiểm tra publication; không đặt hàng bằng referencePrice |
| Cart/checkout | Customer | Cart revision, recipient, preview, confirm, operationId | Snapshot server; stale revision/draft/product chặn commit; retry giữ identity |
| Custom request/quote | Customer, operations | Request schema tối đa 30 dòng; quote và terms version | Versioned acceptance; quote hết hạn/tỷ giá sai bị chặn |
| Buying/warehouse | Buyer, warehouse | Claim, purchase evidence, receive quantities, pack | Timeline và internal operations; không để lộ chứng từ nội bộ cho khách |
| Shipping/consolidation | Operations, warehouse | Parcels, allocations, freight, dispatch | Khóa quantity/weight; thiếu tiền/hold chặn gửi; parcel status tách order status |
| Finance | Finance | Reference duy nhất, amount, reason, evidence | Ledger và audit; duplicate/over-refund/context mismatch bị từ chối |
| Membership/invoices | Customer, finance | Plan snapshot, subscription, invoice issue | Lịch sử phát hành; receipts membership tách order payment |
| Support/CRM | Customer, support | Owned thread, staff notes, follow-up | Customer projection và notes nội bộ tách nhau |
| Tracking | Customer / holder share code | Own order hoặc mã chia sẻ có expiry | Own full projection; guest projection hạn chế, quota, revoke; không tra cứu bằng order ID để mở dữ liệu riêng |
| Ask | Visitor/customer/staff theo policy | Conversation, approved knowledge, proposed action | Câu trả lời/draft; không thay thế ledger hoặc quyền command |
| Notification/email | Customer, worker | Purpose preferences, verified recipient, queued event | Delivery có gating; accepted không đồng nghĩa inbox delivered |
| Analytics | Consenting user, staff | Consent và event hợp lệ | Bounded projections; định nghĩa KPI phải thống nhất trước công bố |
