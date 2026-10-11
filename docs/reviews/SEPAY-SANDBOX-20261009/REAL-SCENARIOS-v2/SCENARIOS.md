# 95 kịch bản thực tế: giỏ hàng, mua hộ và thanh toán

Mỗi dòng dưới đây là yêu cầu kiểm thử, không phải tất cả đều đã được chứng nhận end-to-end qua trình duyệt. PASSED_LOCAL chỉ xác nhận assertion unit/emulator tương ứng; có thể một test kiểm tra nhiều điều kiện. 87 kịch bản có bằng chứng local; 8 kịch bản browser/provider/runtime dài hạn còn NOT_RUN.

Kết quả chi tiết và tên test đầy đủ: [SCENARIOS.json](SCENARIOS.json). Bằng chứng bất biến nằm trong evidence/. Không dùng email, tiền hoặc dữ liệu khách thật.

## Cart

### RS001 — Khách mua chung hàng niêm yết và hàng cần tìm

- Điều kiện: Giỏ có tai nghe cần tìm mua 2 chiếc và một món niêm yết
- Thao tác: Xác nhận địa chỉ, commit, nhận IPN và readback đúng tiền
- Kết quả cần đạt: Tổng 4.695.000đ; 2 đơn, 2 dòng sổ tiền; giỏ hết món đã thanh toán; một PDF
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `mixed cart → one immutable invoice` (tên đầy đủ trong JSON).

### RS002 — Giữ món mua hộ khi thêm listing

- Điều kiện: Khách đã nhập thông tin món cần tìm mua
- Thao tác: Thêm một sản phẩm có sẵn vào cùng giỏ
- Kết quả cần đạt: Món tùy chỉnh còn nguyên; listing dùng hình dạng dữ liệu giỏ hiện hành
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `preserves legacy catalog shape and custom lines` (tên đầy đủ trong JSON).

### RS003 — Không trộn giỏ giữa tài khoản

- Điều kiện: Giỏ cùng revision nhưng owner khác tài khoản đang dùng
- Thao tác: Thêm yêu cầu mua hộ
- Kết quả cần đạt: Từ chối trước mọi ghi dữ liệu
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects a valid same-revision cart owned by another account` (tên đầy đủ trong JSON).

### RS004 — Thêm yêu cầu vào giỏ đang có món

- Điều kiện: Giỏ thuộc người đang đăng nhập và có sản phẩm
- Thao tác: Thêm yêu cầu mua hộ
- Kết quả cần đạt: Giữ các món trước và owner, thêm yêu cầu vào cùng giỏ
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `adds a request to the same-owner cart` (tên đầy đủ trong JSON).

### RS005 — Giỏ mới nhận đúng chủ

- Điều kiện: Người dùng chưa có giỏ
- Thao tác: Thêm yêu cầu đầu tiên
- Kết quả cần đạt: Giỏ mới có owner là người đã xác thực
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `preserves the authenticated owner default` (tên đầy đủ trong JSON).

## Pricing

### RS006 — Thu đủ ban đầu, không thu cước ước tính

- Điều kiện: Giỏ hỗn hợp với hàng nghiên cứu giá và listing
- Thao tác: Backend tính overview
- Kết quả cần đạt: Giá hàng 2.900.000đ + phí 145.000đ + listing 1.650.000đ; không thu lẫn cước chỉ tham khảo
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `conserves exact money` (tên đầy đủ trong JSON).

### RS007 — Không dùng báo giá lỗi thời

- Điều kiện: Chính sách ngừng duyệt hoặc giá listing đổi
- Thao tác: Khách gửi preview hay snapshot cũ
- Kết quả cần đạt: Không tạo checkout theo giá cũ hoặc snapshot bị sửa
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects unpublished/stale policy` (tên đầy đủ trong JSON).

### RS008 — Không tự làm tròn tiền cổng

- Điều kiện: Provider gửi 1.01 VND
- Thao tác: Đọc giao dịch
- Kết quả cần đạt: Từ chối phần lẻ thay vì làm tròn và cấp vốn
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects without coercion/rounding "1.01"` (tên đầy đủ trong JSON).

### RS009 — Không nhận chuỗi tiền viết tắt

- Điều kiện: Provider gửi 1e5 hoặc có dấu phẩy
- Thao tác: Đọc giao dịch
- Kết quả cần đạt: Từ chối định dạng có thể bị diễn giải thành số khác
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects without coercion/rounding "1e5"` (tên đầy đủ trong JSON).

### RS010 — Không tràn số tiền

- Điều kiện: Provider gửi lớn hơn 1.000.000.000.000 VND
- Thao tác: Đọc giao dịch
- Kết quả cần đạt: Từ chối ngoài giới hạn trước cấp vốn
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects without coercion/rounding "1000000000001"` (tên đầy đủ trong JSON).

### RS011 — Tính đơn vị nhỏ nhất đúng thị trường

- Điều kiện: Đầu vào tiền nghiên cứu theo ngoại tệ
- Thao tác: Tính giá VND và phí
- Kết quả cần đạt: Tính bằng số nguyên và chặn độ chính xác thị trường không hợp lệ
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rounds money once in integer minor units` (tên đầy đủ trong JSON).

## Recipient

### RS012 — Địa chỉ đầy đủ ở Việt Nam

- Điều kiện: Tên, số điện thoại, tỉnh, xã, đường hợp lệ
- Thao tác: Kiểm tra form
- Kết quả cần đạt: Chấp nhận dữ liệu đã trim
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `accepts a complete address` (tên đầy đủ trong JSON).

### RS013 — Bỏ trống thông tin nhận

- Điều kiện: Khách chưa nhập tên, điện thoại, tỉnh, xã, đường
- Thao tác: Nhấn đi tiếp
- Kết quả cần đạt: Xác định từng trường thiếu mà chưa gọi backend
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `identifies every required empty field` (tên đầy đủ trong JSON).

### RS014 — Điện thoại sai

- Điều kiện: Số quá ngắn, chữ hoặc quá dài
- Thao tác: Kiểm tra form
- Kết quả cần đạt: Gắn lỗi vào điện thoại, không gửi thanh toán
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `identifies an invalid phone` (tên đầy đủ trong JSON).

### RS015 — Chọn tỉnh nhưng thiếu tên vùng

- Điều kiện: Mã và tên vùng không đủ
- Thao tác: Kiểm tra form
- Kết quả cần đạt: Lỗi gắn vào selector tỉnh/xã tương ứng
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `associates missing region names` (tên đầy đủ trong JSON).

### RS016 — Địa chỉ ngắn và ghi chú quá dài

- Điều kiện: Tên/đường quá ngắn, ghi chú quá giới hạn
- Thao tác: Kiểm tra form
- Kết quả cần đạt: Từng lỗi có thể xử lý riêng
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `keeps short name, short street` (tên đầy đủ trong JSON).

### RS017 — Quốc gia chưa hỗ trợ

- Điều kiện: Khách sửa country thành ngoài VN
- Thao tác: Kiểm tra form
- Kết quả cần đạt: Không coi là form hợp lệ
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `never treats an unsupported country` (tên đầy đủ trong JSON).

## Methods

### RS018 — Chưa hỗ trợ thẻ/NAPAS

- Điều kiện: Khách sửa payload để chọn CARD hay NAPAS
- Thao tác: Commit sandbox
- Kết quả cần đạt: Từ chối và không tạo checkout
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `rejects unavailable/missing sandbox method` (tên đầy đủ trong JSON).

### RS019 — Thiếu lựa chọn thanh toán

- Điều kiện: Payload sandbox không có paymentMethod
- Thao tác: Commit
- Kết quả cần đạt: Không tự coi phương thức thiếu là được hỗ trợ
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `rejects unavailable/missing sandbox method undefined` (tên đầy đủ trong JSON).

### RS020 — Giao diện chỉ chọn phương thức sẵn sàng

- Điều kiện: Backend trả capability demo hoặc sandbox
- Thao tác: Render nhóm phương thức
- Kết quả cần đạt: 3 radio có nhãn; chỉ QR sẵn sàng được chọn
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `renders three labeled native radios` (tên đầy đủ trong JSON).

### RS021 — Capability chưa có

- Điều kiện: Setup chưa trả khả năng thanh toán
- Thao tác: Render nhóm phương thức
- Kết quả cần đạt: Không phương thức nào enabled hoặc được tự chọn
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `keeps all methods disabled and unselected` (tên đầy đủ trong JSON).

### RS022 — Đang submit

- Điều kiện: Khách đã chọn QR và đang gửi xác nhận
- Thao tác: Render trạng thái gửi
- Kết quả cần đạt: Khóa nhóm, giữ nguyên lựa chọn
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `locks the entire group during submission` (tên đầy đủ trong JSON).

### RS023 — Capability lạ mở thẻ

- Điều kiện: Dữ liệu upstream bất ngờ bật CARD
- Thao tác: Chuẩn hóa lựa chọn
- Kết quả cần đạt: Client vẫn không mở phương thức chưa triển khai
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `keeps NAPAS and card unavailable` (tên đầy đủ trong JSON).

### RS024 — Replay đổi phương thức

- Điều kiện: Operation đang chờ có phương thức đã xác nhận
- Thao tác: Nhận kết quả sai phương thức
- Kết quả cần đạt: Chặn trước khi xóa pending operation
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects a missing or mismatched method` (tên đầy đủ trong JSON).

## Auth

### RS025 — Chủ khác mở thanh toán

- Điều kiện: Checkout thuộc khách A
- Thao tác: B gọi status; khách chưa login hoặc overpost amount
- Kết quả cần đạt: Từ chối owner/guest/payload; không cho dùng đường demo để thanh toán sandbox
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `owner/auth/overposting boundaries` (tên đầy đủ trong JSON).

## IPN

### RS026 — Khách refresh nhiều lần

- Điều kiện: Cùng checkout và cùng số tiền
- Thao tác: Tạo form 4 lần và commit 2 lần đồng thời
- Kết quả cần đạt: Cùng invoice/form; không có đơn trước proof
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `mixed cart → one immutable invoice` (tên đầy đủ trong JSON).

### RS027 — Return đến trước IPN

- Điều kiện: Invoice chưa có provider order ID đã pin
- Thao tác: Khách bấm đối chiếu
- Kết quả cần đạt: Không đoán ID, không gọi provider; vẫn pending, không có đơn/PDF
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `return before IPN cannot guess` (tên đầy đủ trong JSON).

### RS028 — Webhook gửi lặp

- Điều kiện: Provider gửi cùng normalized notification
- Thao tác: Admit và xử lý lại
- Kết quả cần đạt: Một inbox/proof, không nhân đôi sổ tiền/PDF
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `mixed cart → one immutable invoice` (tên đầy đủ trong JSON).

### RS029 — Webhook có thông tin khách không cần thiết

- Điều kiện: Payload thêm customer.name
- Thao tác: Admit và lưu inbox
- Kết quả cần đạt: Không lưu trường PII thừa
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `mixed cart → one immutable invoice` (tên đầy đủ trong JSON).

### RS030 — Kẻ gọi sai HTTP

- Điều kiện: GET, thiếu/sai secret hoặc body 65.537 byte
- Thao tác: Gọi HTTP IPN handler
- Kết quả cần đạt: 405/401/400; chỉ body được xác thực và lưu bền mới ack 200
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `IPN HTTP boundary rejects` (tên đầy đủ trong JSON).

### RS031 — Sửa order ID trong webhook phát lại

- Điều kiện: Invoice đã pin provider order ID
- Thao tác: Gửi ID mới hoặc số tiền khác cùng transaction
- Kết quả cần đạt: Từ chối binding/replay; không ghi đè inbox ban đầu
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `unknown invoice/conflicting replay` (tên đầy đủ trong JSON).

### RS032 — Provider chưa thu tiền

- Điều kiện: Readback status pending/unknown/cancelled
- Thao tác: Đối chiếu
- Kết quả cần đạt: Không coi callback thành proof và không cấp vốn
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `does not settle status` (tên đầy đủ trong JSON).

### RS033 — Sai merchant

- Điều kiện: Intent thuộc merchant khác
- Thao tác: Xác minh readback
- Kết quả cần đạt: Từ chối merchant scope
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects wrong merchant scope` (tên đầy đủ trong JSON).

### RS034 — Sai invoice/order/internal ID

- Điều kiện: Readback trả số đơn khác
- Thao tác: Xác minh
- Kết quả cần đạt: Từ chối binding trước tạo proof
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `readback is the only money proof rejects invoice` (tên đầy đủ trong JSON).

### RS035 — Sai loại giao dịch

- Điều kiện: Readback là refund hoặc giao dịch declined
- Thao tác: Xác minh PAYMENT
- Kết quả cần đạt: Không coi hoàn tiền hay giao dịch từ chối là tiền thu
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `readback is the only money proof rejects refund` (tên đầy đủ trong JSON).

### RS036 — Sai phương thức hoặc tiền tệ

- Điều kiện: Readback là CARD hoặc không phải VND
- Thao tác: Xác minh
- Kết quả cần đạt: Không cấp vốn BANK_TRANSFER/VND từ dữ liệu sai
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `readback is the only money proof rejects method` (tên đầy đủ trong JSON).

### RS037 — Hai giao dịch được duyệt cùng order

- Điều kiện: Readback chứa A và B, notice xác định B
- Thao tác: Xác minh notice
- Kết quả cần đạt: Chọn đúng B; không lấy A hoặc bỏ B vì order đã có giao dịch
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `binds a notice to its own approved transaction` (tên đầy đủ trong JSON).

### RS038 — Transaction ID lặp trong readback

- Điều kiện: Provider trả hai record APPROVED cùng ID
- Thao tác: Xác minh
- Kết quả cần đạt: Từ chối giao dịch không duy nhất
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects duplicate approved transaction IDs` (tên đầy đủ trong JSON).

### RS039 — Notice chọn giao dịch declined

- Điều kiện: Readback có APPROVED A và DECLINED B
- Thao tác: Notice gọi B
- Kết quả cần đạt: Không lấy A thay B
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `cannot select a declined payment` (tên đầy đủ trong JSON).

### RS040 — Thiếu 1đ

- Điều kiện: Provider thu thấp hơn total đúng 1đ
- Thao tác: Xử lý IPN/readback
- Kết quả cần đạt: review_required, không có đơn/PDF; không tự coi đã đủ
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `under/overpayment -1 stays` (tên đầy đủ trong JSON).

### RS041 — Thừa 1đ

- Điều kiện: Provider thu cao hơn total đúng 1đ
- Thao tác: Xử lý IPN/readback
- Kết quả cần đạt: review_required; không tự hoàn tiền hay âm thầm nhận khác total
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `under/overpayment 1 stays` (tên đầy đủ trong JSON).

### RS042 — Giao dịch B đến trong cooldown

- Điều kiện: Đơn đã cấp vốn bằng A, B là giao dịch khác
- Thao tác: Xử lý B trong cooldown, rồi thử lại
- Kết quả cần đạt: B không bị bỏ; được lưu để đối chiếu SECOND_TRANSACTION; sổ tiền không tăng
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `a distinct transaction during cooldown` (tên đầy đủ trong JSON).

### RS043 — Giao dịch B đến khi lease đang giữ

- Điều kiện: Đơn đã trả bằng A nhưng worker khác đang đối chiếu
- Thao tác: Xử lý B rồi lease hết
- Kết quả cần đạt: B vẫn được thử lại và lưu riêng; không cấp vốn hai lần
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `a distinct transaction during lease` (tên đầy đủ trong JSON).

### RS044 — Dùng transaction trả hai checkout

- Điều kiện: Transaction đã gắn checkout A
- Thao tác: Readback checkout B dùng cùng reference
- Kết quả cần đạt: Giữ conflict proof, khóa review B, không tạo đơn B
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `reference reused across checkouts` (tên đầy đủ trong JSON).

### RS045 — Provider báo void sau khi đã trả

- Điều kiện: Đơn đã có tiền và ledger
- Thao tác: Nhận TRANSACTION_VOID xác thực
- Kết quả cần đạt: Giữ tiền/ledger; hold fulfillment và yêu cầu đối chiếu, không tự đảo tiền
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `authenticated void holds fulfillment` (tên đầy đủ trong JSON).

## Time

### RS046 — Server ở múi giờ khác Việt Nam

- Điều kiện: Provider trả ngày SQL không kèm timezone
- Thao tác: Đọc paidAt
- Kết quả cần đạt: Hiểu theo +07:00, không theo múi giờ host
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `interprets an unzoned timestamp in Vietnam` (tên đầy đủ trong JSON).

### RS047 — Ngày không có thật

- Điều kiện: Provider trả 30/02
- Thao tác: Đọc paidAt
- Kết quả cần đạt: Từ chối trước proof
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects ambiguous/invalid dates 2026-02-30` (tên đầy đủ trong JSON).

### RS048 — Giờ bị chuyển ngày

- Điều kiện: Provider trả SQL 24:00:00
- Thao tác: Đọc paidAt
- Kết quả cần đạt: Từ chối, không tự đổi thành ngày mai
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects ambiguous/invalid dates 2026-10-09 24:00:00` (tên đầy đủ trong JSON).

### RS049 — ISO bị chuyển ngày

- Điều kiện: Provider trả ISO 24:00:00+07:00 hoặc Z
- Thao tác: Đọc paidAt
- Kết quả cần đạt: Từ chối dù Date.parse có thể normalize
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects ambiguous/invalid dates 2026-10-09T24:00:00` (tên đầy đủ trong JSON).

### RS050 — Phút/giây vượt giới hạn

- Điều kiện: Provider trả phút hay giây 60
- Thao tác: Đọc paidAt
- Kết quả cần đạt: Từ chối thời gian không hợp lệ
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects ambiguous/invalid dates 2026-10-09 23:60:00` (tên đầy đủ trong JSON).

## Recovery

### RS051 — Provider gián đoạn

- Điều kiện: Readback ném lỗi chứa dữ liệu nhạy cảm
- Thao tác: Xử lý rồi thử lại cùng intent
- Kết quả cần đạt: unknown/queued, không có PDF; không lưu raw lỗi; giữ nguyên lượt
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `timeout/pending and forged return` (tên đầy đủ trong JSON).

### RS052 — Thiếu cấu hình runtime

- Điều kiện: IPN đã lưu nhưng flag đang tắt trong process test
- Thao tác: Worker chạy không có adapter
- Kết quả cần đạt: Giữ nguyên queued và attempts; sau phục hồi xử lý được với 1 lượt
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `missing runtime configuration preserves` (tên đầy đủ trong JSON).

### RS053 — Provider lỗi 5 lần

- Điều kiện: Mỗi lần readback thực sự thất bại
- Thao tác: Worker thử đủ budget rồi tiếp tục được gọi
- Kết quả cần đạt: Chỉ 5 readback; review RETRY_LIMIT, giữ payload/cart lock; không có ledger/PDF
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `five real readback failures` (tên đầy đủ trong JSON).

### RS054 — Worker mất lease giữa readback

- Điều kiện: Worker A đang chờ; B chiếm claim mới
- Thao tác: A trả readback
- Kết quả cần đạt: A không lưu proof, không giải phóng lease B; B có thể phục hồi
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `stale readback worker cannot save` (tên đầy đủ trong JSON).

### RS055 — Khách đối chiếu 9 lần đồng thời

- Điều kiện: Một readback đang chờ dưới lease
- Thao tác: 8 request khác cùng chạy
- Kết quả cần đạt: Chỉ một readback; request còn lại deferred, một ledger
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `concurrent return reconciliation performs one` (tên đầy đủ trong JSON).

### RS056 — Worker chết sau khi lưu proof

- Điều kiện: Proof riêng đã lưu nhưng chưa ghi sổ
- Thao tác: 4 process riêng cùng settlement và thử lại khi provider hỏng
- Kết quả cần đạt: Một allocation, đúng 2 ledger/tổng tiền; phục hồi không cần provider mới
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `cross-process verified proof allocates once` (tên đầy đủ trong JSON).

### RS057 — Inbox worker còn sống

- Điều kiện: Inbox có lease tương lai
- Thao tác: Gọi xử lý rồi làm lease hết hạn
- Kết quả cần đạt: Đầu tiên không cấp vốn; sau hết lease được reclaim và hoàn tất
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `expired inbox lease is reclaimed` (tên đầy đủ trong JSON).

### RS058 — Hủy đã xác nhận rồi refresh

- Điều kiện: Provider đã hủy, khách đã có giỏ mới
- Thao tác: Đối chiếu hủy cũ thêm 2 lần
- Kết quả cần đạt: Trả cancelled, không đổi version, revision, giỏ mới; sai link vẫn bị chặn
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `confirmed unpaid demo cancellation` (tên đầy đủ trong JSON).

## Integrity

### RS059 — Lệch tiền một dòng giỏ hỗn hợp

- Điều kiện: Một line.total bị hỏng trước settlement
- Thao tác: Nhận proof đúng toàn bộ total
- Kết quả cần đạt: Không tạo đơn dở dang; zero ledger/PDF/email; giữ full receivedAmount và giỏ
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `mixed checkout corruption line_total` (tên đầy đủ trong JSON).

### RS060 — Một đơn snapshot mang chủ khác

- Điều kiện: Giỏ 2 món nhưng order thứ hai owner sai
- Thao tác: Nhận proof đúng tiền
- Kết quả cần đạt: Không ghi dù chỉ đơn đầu; giữ proof để review
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `mixed checkout corruption foreign_order` (tên đầy đủ trong JSON).

### RS061 — Khóa khách trước khi có proof

- Điều kiện: Khách vừa trả nhưng tài khoản đã khóa
- Thao tác: Worker nhận proof
- Kết quả cần đạt: Không mất bằng chứng tiền; review, không tạo đơn
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `confirmed money after locked` (tên đầy đủ trong JSON).

### RS062 — Hết hạn khi tiền về

- Điều kiện: Checkout hết hạn trong lúc provider xử lý
- Thao tác: Worker nhận proof
- Kết quả cần đạt: review_required, không bỏ tiền và không cấp vốn
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `confirmed money after expired` (tên đầy đủ trong JSON).

### RS063 — Hủy trước khi nhận tiền

- Điều kiện: Checkout đã cancelled nhưng proof tiền đến trễ
- Thao tác: Worker nhận proof
- Kết quả cần đạt: Giữ review, không tạo đơn
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `confirmed money after cancelled` (tên đầy đủ trong JSON).

## Balance

### RS064 — Giá mua tăng và khách đồng ý

- Điều kiện: Nhân viên claim; giá cửa hàng tăng từ nghiên cứu
- Thao tác: Propose, approve, preview top-up, trả đúng 200.000đ
- Kết quả cần đạt: Chặn mua khi chưa đủ tiền; trả một lần; receipt balance liên kết receipt đầu
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `approved source price top-up is paid exactly once; stale target=false` (tên đầy đủ trong JSON).

### RS065 — Đơn đổi sau preview top-up

- Điều kiện: Khách duyệt báo giá nhưng order version đã đổi
- Thao tác: Provider báo đã thu
- Kết quả cần đạt: Giữ tiền để review, không cộng collected hoặc phát hành receipt balance
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `approved source price top-up is paid exactly once; stale target=true` (tên đầy đủ trong JSON).

### RS066 — Nhân viên mua quá trần

- Điều kiện: Đơn có giới hạn giá nguồn đã duyệt
- Thao tác: Ghi mua vượt trần hoặc chưa đủ vốn
- Kết quả cần đạt: Chặn cho đến khi được khách duyệt và đã trả đủ
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `blocks excess spending until approved and funded` (tên đầy đủ trong JSON).

## Receipt

### RS067 — Nhận PDF sau trả tiền

- Điều kiện: Proof đã được cấp vốn đúng
- Thao tác: Worker render và upload
- Kết quả cần đạt: PDF ready, BANK_TRANSFER, demo_sink; không gửi email thật
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `mixed cart → one immutable invoice` (tên đầy đủ trong JSON).

### RS068 — Hỏng snapshot PDF

- Điều kiện: Đơn đã trả nhưng receipt.lines rỗng
- Thao tác: Worker thử render 3 lần
- Kết quả cần đạt: Job failed/RECEIPT_INVALID; state paid và ledger giữ nguyên
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `receipt rendering failure is bounded` (tên đầy đủ trong JSON).

### RS069 — PDF sai chủ hoặc khách chưa login

- Điều kiện: Receipt thuộc khách A
- Thao tác: B hoặc guest tải
- Kết quả cần đạt: permission-denied/unauthenticated, không trả bytes
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `private PDF is downloadable only` (tên đầy đủ trong JSON).

### RS070 — Khách hoặc staffAccess bị khóa

- Điều kiện: Receipt đã ready, đúng owner
- Thao tác: Bật khóa profile hoặc access rồi tải
- Kết quả cần đạt: Không trả PDF; tiền và ledger không đổi
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `private PDF is downloadable only` (tên đầy đủ trong JSON).

### RS071 — PDF bị đổi digest

- Điều kiện: Object có bytes nhưng digest metadata khác
- Thao tác: Đúng owner tải
- Kết quả cần đạt: failed-precondition, không trả bytes; checkout vẫn paid
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `private PDF is downloadable only` (tên đầy đủ trong JSON).

### RS072 — Job mồ côi

- Điều kiện: Job processing hết lease nhưng không có receipt
- Thao tác: Worker phục hồi
- Kết quả cần đạt: Retire job failed, không tạo receipt/email, không chiếm recovery batch mãi
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `missing receipt retires an orphan lease` (tên đầy đủ trong JSON).

### RS073 — Job terminal còn lease cũ

- Điều kiện: Job ready/failed có lease đã quá hạn
- Thao tác: Worker được gọi lại
- Kết quả cần đạt: Xóa lease, giữ snapshot/attempts; không gửi lại email
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `terminal` (tên đầy đủ trong JSON).

### RS074 — PDF từng món và tổng tiền

- Điều kiện: Receipt có nhiều món và phí
- Thao tác: Tạo layout PDF
- Kết quả cần đạt: Mỗi món có số lượng, tiền hàng, phí và tổng đã thu
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `shows each product, quantities` (tên đầy đủ trong JSON).

### RS075 — PDF giờ và phương thức rõ ràng

- Điều kiện: Receipt demo có reference/paidAt
- Thao tác: Tạo layout
- Kết quả cần đạt: Giờ Việt Nam, phương thức thực tế; không bịa ngân hàng hay người nhận
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `identifies actual demo method` (tên đầy đủ trong JSON).

### RS076 — PDF sandbox không giả tiền thật

- Điều kiện: Receipt SePay sandbox
- Thao tác: Tạo layout
- Kết quả cần đạt: Có sandbox, invoice và BANK_TRANSFER đúng
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `identifies SePay sandbox` (tên đầy đủ trong JSON).

### RS077 — PDF nhiều trang với tên dài

- Điều kiện: Danh sách tên tiếng Việt dài
- Thao tác: Tạo layout nhiều trang
- Kết quả cần đạt: Giữ mã đơn mọi dòng và lặp heading bảng
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `preserves every long product` (tên đầy đủ trong JSON).

### RS078 — Listing đã gộp cước

- Điều kiện: Receipt chỉ có món niêm yết
- Thao tác: Tạo layout
- Kết quả cần đạt: Không thông báo nhầm cước chưa thu
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `does not tell a listing-only customer` (tên đầy đủ trong JSON).

## Security

### RS079 — Không đọc thẳng evidence

- Điều kiện: Guest, owner, người khác và staff OWNER
- Thao tác: Đọc/ghi intent/index/inbox/proof/evidence trực tiếp Firestore
- Kết quả cần đạt: Rules từ chối mọi actor client; chỉ server làm được
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: integration.
- Test đối chiếu: `private purchase` (tên đầy đủ trong JSON).

### RS080 — Form bị đổi nơi nhận

- Điều kiện: Form action là production, evil hoặc javascript
- Thao tác: Client admit signed form
- Kết quả cần đạt: Chỉ cho đúng origin sandbox, không gửi sang đích khác
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects form destination` (tên đầy đủ trong JSON).

### RS081 — Form có field trùng hoặc tùy ý

- Điều kiện: Payload form thêm hidden field
- Thao tác: Admit form
- Kết quả cần đạt: Từ chối thay vì ký/gửi nội dung ngoài hợp đồng
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `rejects duplicate or arbitrary hidden fields` (tên đầy đủ trong JSON).

### RS082 — Chữ ký đúng thứ tự

- Điều kiện: Backend ký form BANK_TRANSFER
- Thao tác: Kiểm tra bằng official SDK
- Kết quả cần đạt: Signature khớp đúng thứ tự và amount/invoice
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `produces SDK-compatible signature` (tên đầy đủ trong JSON).

### RS083 — Không SSRF theo input

- Điều kiện: Provider order ID hợp lệ, backend đọc trạng thái
- Thao tác: Gọi transport với fetch giả
- Kết quả cần đạt: Host sandbox cố định, ID/path và auth chỉ ở server
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `uses the fixed sandbox host` (tên đầy đủ trong JSON).

### RS084 — Response provider HTML/lớn/sai JSON

- Điều kiện: Transport nhận body bất thường
- Thao tác: Đọc phản hồi
- Kết quả cần đạt: Bounded error, hủy/đóng stream; không trả raw dữ liệu
- Ưu tiên: P0. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `redacts and releases` (tên đầy đủ trong JSON).

## Performance

### RS085 — Queue có nhiều lỗi xen kẽ

- Điều kiện: 64 tác vụ/lượt, một nửa thất bại
- Thao tác: Chạy 3.200 operations và 50 PDF 30 món
- Kết quả cần đạt: Queue giải phóng capacity; ghi số đo post-GC, không gọi là leak-free
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: resource.
- Test đối chiếu: `resources` (tên đầy đủ trong JSON).

## UI

### RS086 — Hoàn tất gọn trong card

- Điều kiện: Checkout đã paid có nhiều đơn
- Thao tác: SSR completion
- Kết quả cần đạt: Một amount, link đơn thật và nút PDF có accessible name; chưa chứng nhận browser
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `renders a compact completed group` (tên đầy đủ trong JSON).

### RS087 — PDF lỗi không tạo thanh toán nữa

- Điều kiện: Đơn duy nhất đã paid, receipt lỗi
- Thao tác: SSR completion
- Kết quả cần đạt: Vẫn mở đơn và có phục hồi PDF; không nút trả lần nữa
- Ưu tiên: P1. Trạng thái: **PASSED_LOCAL**. Loại bằng chứng: unit.
- Test đối chiếu: `opens the single paid order directly` (tên đầy đủ trong JSON).

### RS088 — Tải checkout thật ở desktop/mobile

- Điều kiện: Khách đã login trên route payment thật
- Thao tác: Đi đủ giỏ, địa chỉ, overview, pending, paid bằng pointer/keyboard
- Kết quả cần đạt: Layout, focus, errors và thao tác đúng; cần browser được phép
- Ưu tiên: P1. Trạng thái: **NOT_RUN**. Loại bằng chứng: manual.

### RS089 — Đổi tài khoản giữa request

- Điều kiện: Request checkout/PDF còn đang chờ
- Thao tác: Đăng xuất/đổi tài khoản/quay lại
- Kết quả cần đạt: Không hiện response chủ cũ; timer/listener được dọn
- Ưu tiên: P1. Trạng thái: **NOT_RUN**. Loại bằng chứng: manual.

### RS090 — Offline khi đang chuyển cổng

- Điều kiện: Khách đã commit nhưng mất mạng
- Thao tác: Mở lại checkout và retry
- Kết quả cần đạt: Phục hồi cùng lượt, không charge hoặc tạo đơn mới
- Ưu tiên: P1. Trạng thái: **NOT_RUN**. Loại bằng chứng: manual.

### RS091 — Form giữ vị trí khi lỗi

- Điều kiện: Khách bỏ trống địa chỉ ở mobile
- Thao tác: Nhấn xem tổng quan rồi sửa lỗi
- Kết quả cần đạt: CTA bên chi tiết, lỗi đỏ đúng input, dấu * cùng label, không giật màn hình
- Ưu tiên: P1. Trạng thái: **NOT_RUN**. Loại bằng chứng: manual.

## Provider

### RS092 — SePay gửi IPN qua HTTPS thật

- Điều kiện: Có sandbox credential được nạp an toàn và IPN public
- Thao tác: Thanh toán test từ trang SePay rồi quay về
- Kết quả cần đạt: Đối chiếu provider/readback/end-to-end; local mock không thay thế chứng cứ này
- Ưu tiên: P1. Trạng thái: **NOT_RUN**. Loại bằng chứng: manual.

### RS093 — Chạy bằng Node 22 mục tiêu

- Điều kiện: Runtime build target Node 22
- Thao tác: Lặp bộ kiểm thử với đúng Node 22
- Kết quả cần đạt: Không khác hành vi ngày/stream/runtime; host Node 25 không chứng nhận target
- Ưu tiên: P1. Trạng thái: **NOT_RUN**. Loại bằng chứng: manual.

### RS094 — Email thực đến khách

- Điều kiện: Provider gửi email được phép và cấu hình
- Thao tác: Gửi receipt rồi kiểm tra provider/delivery
- Kết quả cần đạt: Có provider readback; demo_sink không phải email thật
- Ưu tiên: P1. Trạng thái: **NOT_RUN**. Loại bằng chứng: manual.

### RS095 — Thông lượng production dài hạn

- Điều kiện: Môi trường test độc lập có telemetry
- Thao tác: Soak/load test thực tế
- Kết quả cần đạt: Đo latency/cost/heap/stream theo thời gian; không suy từ finite local probe
- Ưu tiên: P1. Trạng thái: **NOT_RUN**. Loại bằng chứng: manual.

