# Các tình huống thực tế và bằng chứng kiểm thử thanh toán mua hộ

Phạm vi: frontend dùng chung 5207, Auth/Functions/Firestore/Storage demo hiện có; dữ liệu khách và sản phẩm kiểm thử. Cổng demo có liên kết riêng, trạng thái, thông báo ký bằng SDK PayOS, đối chiếu server và kết quả không rõ. Không gọi API PayOS hoặc ngân hàng, không gửi email thật, không tạo quyền nhân viên mới. Bản này hoàn tất luồng cục bộ; không chứng nhận production.

## Những hành trình khách hàng và nhân viên

1. **Mua cả món niêm yết lẫn món chưa có trong catalog.** Khách thêm một tai nghe giá 1.650.000 đồng từ sản phẩm; ở form Mua hộ hiện có, nhập 2 tai nghe giá nghiên cứu 58 USD/chiếc, rồi thêm vào giỏ. Món mua hộ được ghi là cần tìm mua. Giỏ vẫn dùng UI hiện có. Với cấu hình demo 25.000 đồng/USD và phí 5%, giá hàng mua hộ là 2.900.000, phí 145.000, tổng lần đầu 4.695.000 đồng. Chưa tạo đơn ở bước thêm giỏ hay tổng quan. Thanh toán có bằng chứng hợp lệ mới tạo hai đơn và hai phân bổ khớp từng dòng. Bằng chứng: GATEWAY-BUSINESS-E2E.json và unit purchase-checkout.
2. **Xem lại người nhận trước khi trả tiền.** Khách nhập người nhận, điện thoại, tỉnh/thành và phường/xã từ danh mục Việt Nam, số nhà/đường và ghi chú tùy chọn. Tổng quan hiển thị lại món, địa chỉ, giá hàng, phí và cước dự tính chưa thu. Nút thanh toán bị khóa khi chưa xác nhận. Chọn sửa địa chỉ rồi trở về tổng quan phải xác nhận lại. Browser hiện tại đã thực hiện hành trình này; backend cũng chặn country/phone/street/region không hợp lệ. Google Maps không được kích hoạt hoặc dùng để suy ra địa chỉ.
3. **Khách quay lại thấy URL báo trả tiền thành công.** Giá trị status=PAID hoặc code=00 trong URL không có quyền ghi tiền. Browser thật vẫn hiện đang chờ thanh toán trước khi cổng xác nhận; HTTP G004/G008 xác minh thông báo hoặc đối chiếu server mới tạo đơn.
4. **Mất phản hồi lúc trả tiền.** Giữ nguyên mã checkout và liên kết; giỏ vẫn khóa. Tải lại hoặc kiểm tra lại cùng lượt. Không coi hết hạn là chưa thu, không tạo lượt khác. Browser đã thấy trạng thái đối chiếu; HTTP G009–G012 kiểm tra giữ khóa, chặn hủy và hồi phục. Tình huống lỗi này mô phỏng trạng thái provider, không phải phép đo mất mạng thật.
5. **Nhân viên tìm được món với giá cao hơn.** Đơn cần tìm mua đã được thu đủ lần đầu. Nhân viên nhận việc, đề xuất chênh lệch; khách duyệt khoản mới. Đúng 200.000 đồng được trả thêm trong fixture trước khi được ghi nhận mua. Sau khi mua, nhận kho, đóng gói và chốt chi phí cuối 3.500.000, đã thu 3.245.000, khách trả thêm 255.000. Chặn gửi trước khi đủ tiền; đủ tiền mới chuyển sang gửi. Món niêm yết giữ chính sách trọn gói. Bằng chứng: 17 ca nghiệp vụ qua HTTP, không thay bằng nút UI tự đặt state.
6. **Ngân hàng báo nhận thiếu/thừa.** Mock lưu số thực nhận khác số yêu cầu 1 đồng, tạo thông báo ký hợp lệ rồi chạy chung đường phân bổ. Hệ thống giữ tiền ở review_required, lưu bằng chứng thực nhận, không tạo đơn hoặc PDF giả, không tự đổi giá, không tự hoàn tiền. Gửi lại thông báo vẫn không phân bổ thêm. Bằng chứng MONEY-underpay/MONEY-overpay.
7. **PDF đang chạy nền lúc khách bấm tải.** Tiền và đơn đã được ghi nhận độc lập với worker. UI vẫn cho biết thành công, có trạng thái chứng từ và đường thử tải lại. Test chờ hữu hạn rồi yêu cầu PDF ready, đối chiếu bytes/hash và outbox demo. Không đổi assert để chấp nhận processing. Ba PDF lần đầu/chênh lệch/chi phí cuối đã render và kiểm tra lề. Native sự kiện tải file trong Chrome chưa được công cụ xác nhận; file bytes qua API/Storage đã được kiểm tra.
8. **Hai worker hoặc hai tiến trình nhận cùng một việc.** Hàng đợi trong một instance có giới hạn; giao dịch, claim và dữ liệu provider trong Firestore là thẩm quyền giữa các instance. Hai tiến trình Node độc lập xử lý cùng thông báo hợp lệ và chỉ sinh một đơn, một phân bổ, một chứng từ. Hai lần xử lý cùng receipt chỉ tăng attempts theo lần claim thật. Lease cũ và job thiếu receipt không chiếm batch phục hồi mãi.

## 69 ca qua HTTP thực trên emulator

Tiền đề chung: từng fixture có khách Google đã xác minh, giỏ/tổng quan hợp lệ và mã thao tác mới; các ca lệch giá, khóa tài khoản, hết hạn và drift chỉ sửa fixture thuộc test. Không reset dữ liệu dùng chung. Cột kết quả dưới đây lấy từ lần chạy đã hoàn tất trong GATEWAY-SCENARIOS-E2E.json, không dùng suy luận từ source để gán PASSED.

| Mã | Tình huống và kết quả phải có | Kết quả |
| --- | --- | --- |
| G001 | Bấm mở thanh toán hai lần đồng thời: nhận cùng một liên kết, không tạo hai lượt thu. | PASSED |
| G002 | Thông tin liên kết gửi về trình duyệt chỉ có 7 trường; không có email, khóa ký hay danh tính riêng. | PASSED |
| AUTH-createLink | Khách khác dùng mã lượt của chủ giỏ để gọi createLink: bị từ chối, không vượt quyền sở hữu. | PASSED |
| AUTH-linkStatus | Khách khác dùng mã lượt của chủ giỏ để gọi linkStatus: bị từ chối, không vượt quyền sở hữu. | PASSED |
| AUTH-pay | Khách khác dùng mã lượt của chủ giỏ để gọi pay: bị từ chối, không vượt quyền sở hữu. | PASSED |
| AUTH-cancel | Khách khác dùng mã lượt của chủ giỏ để gọi cancel: bị từ chối, không vượt quyền sở hữu. | PASSED |
| AUTH-reconcile | Khách khác dùng mã lượt của chủ giỏ để gọi reconcile: bị từ chối, không vượt quyền sở hữu. | PASSED |
| AUTH-payWithoutWebhook | Khách khác dùng mã lượt của chủ giỏ để gọi payWithoutWebhook: bị từ chối, không vượt quyền sở hữu. | PASSED |
| AUTH-loseResponse | Khách khác dùng mã lượt của chủ giỏ để gọi loseResponse: bị từ chối, không vượt quyền sở hữu. | PASSED |
| AUTH-NONE | Không đăng nhập: không được thao tác thanh toán. | PASSED |
| AUTH-PROVIDER | Danh tính Facebook: không vượt yêu cầu Google đã xác minh. | PASSED |
| AUTH-UNVERIFIED | Tài khoản Google chưa xác minh email: không được thao tác thanh toán. | PASSED |
| G003 | Gọi nút giả lập cũ sau khi có liên kết: bị chặn; phải đi qua trạng thái của cổng. | PASSED |
| INPUT-amount | Trình duyệt gửi thêm số tiền: schema chặn, hợp đồng thanh toán do server quyết định. | PASSED |
| INPUT-redirect | Trình duyệt gửi thêm địa chỉ chuyển hướng: schema chặn, hợp đồng thanh toán do server quyết định. | PASSED |
| INPUT-outcome | Trình duyệt gửi thêm kết quả tự khai: schema chặn, hợp đồng thanh toán do server quyết định. | PASSED |
| INPUT-ID | Mã chứa đường dẫn ../: bị từ chối trước khi đọc tài liệu. | PASSED |
| G004 | Cổng đã nhận tiền nhưng chưa báo về: chưa tạo đơn hay ghi sổ khi chưa có bằng chứng hợp lệ. | PASSED |
| WH-amount-low | Sửa số tiền thấp hơn dữ liệu cổng trong thông báo: không được ghi tiền, kể cả khi các trường còn lại đúng. | PASSED |
| WH-amount-high | Sửa số tiền cao hơn dữ liệu cổng trong thông báo: không được ghi tiền, kể cả khi các trường còn lại đúng. | PASSED |
| WH-order-code | Sửa mã thanh toán trong thông báo: không được ghi tiền, kể cả khi các trường còn lại đúng. | PASSED |
| WH-link-id | Sửa mã liên kết trong thông báo: không được ghi tiền, kể cả khi các trường còn lại đúng. | PASSED |
| WH-reference | Sửa mã giao dịch trong thông báo: không được ghi tiền, kể cả khi các trường còn lại đúng. | PASSED |
| WH-payment-time | Chữ ký hợp lệ nhưng thời gian khác giao dịch đã lưu: bị chặn, không ghi tiền. | PASSED |
| WH-invalid-time | Chuỗi thời gian không đọc được: bị chặn dù có chữ ký. | PASSED |
| WH-currency | Sửa đơn vị tiền trong thông báo: không được ghi tiền, kể cả khi các trường còn lại đúng. | PASSED |
| WH-account | Sửa số tài khoản giả lập trong thông báo: không được ghi tiền, kể cả khi các trường còn lại đúng. | PASSED |
| WH-signature | Sửa chữ ký trong thông báo: không được ghi tiền, kể cả khi các trường còn lại đúng. | PASSED |
| WH-success | Sửa cờ thành công trong thông báo: không được ghi tiền, kể cả khi các trường còn lại đúng. | PASSED |
| WH-METHOD | Gửi GET vào webhook: HTTP 405, không ghi tiền. | PASSED |
| WH-SIZE | Gửi body hơn 16 KiB: HTTP 413, không xử lý phân bổ. | PASSED |
| G005 | Ba thông báo hợp lệ đến đồng thời: chỉ phân bổ đúng một lần. | PASSED |
| G006 | Gửi lại thông báo và đối chiếu lại: số tiền, số bản ghi và thời điểm trả tiền không đổi. | PASSED |
| G007 | Tiền đã nhận ở cổng: không cho hủy như một lượt chưa trả tiền. | PASSED |
| G008 | Thông báo bị mất: đối chiếu server khôi phục cùng lượt, giữ đúng thời gian giao dịch trên checkout/PDF, không yêu cầu thanh toán lại. | PASSED |
| G009 | Mất phản hồi: giữ đúng mã lượt và khóa giỏ, không coi là thất bại chưa thu. | PASSED |
| G010 | Kết quả chưa rõ: chặn hủy để tránh giải phóng giỏ khi tiền có thể đã nhận. | PASSED |
| G011 | Lượt chưa rõ vượt hạn: không tự mở khóa theo thời gian. | PASSED |
| G012 | Quay lại cùng liên kết đang đối chiếu: xác minh tiền rồi hoàn tất cùng đơn. | PASSED |
| G013 | Hủy được xác nhận là chưa thu: mở khóa giỏ, giữ nguyên các món. | PASSED |
| G014 | Liên kết đã hủy: yêu cầu trả tiền đến sau bị từ chối. | PASSED |
| G015 | Liên kết chưa thu đã hết hạn: đối chiếu trạng thái hết hạn trước khi mở giỏ. | PASSED |
| G016 | Checkout hết hạn trước khi mở cổng: vẫn có đường đối chiếu, giỏ không mắc kẹt. | PASSED |
| RACE-0 | Khách bấm trả tiền và hủy cùng lúc, vòng 0: chỉ có một kết quả tài chính, giỏ và đơn khớp kết quả đó. | PASSED |
| RACE-1 | Khách bấm trả tiền và hủy cùng lúc, vòng 1: chỉ có một kết quả tài chính, giỏ và đơn khớp kết quả đó. | PASSED |
| RACE-2 | Khách bấm trả tiền và hủy cùng lúc, vòng 2: chỉ có một kết quả tài chính, giỏ và đơn khớp kết quả đó. | PASSED |
| LOCKED-CALLBACK | Tài khoản bị khóa sau khi cổng nhận tiền: giữ bằng chứng để đối chiếu, không bỏ mất tiền hoặc tạo đơn. | PASSED |
| LOCKED-REPLAY | Gửi lại thông báo của khoản đang đối chiếu: được xác nhận đã nhận, không tạo phân bổ mới. | PASSED |
| ALLOC-DRIFT | Chủ giỏ bị thay đổi sau khi cổng nhận tiền: giữ khoản nhận để đối chiếu, không cấp đơn cho người khác. | PASSED |
| STALE-PRICE | Giá hoặc phiên bản sản phẩm đổi sau tổng quan: không thu theo tổng quan cũ. | PASSED |
| STALE-CART | Giỏ đổi sau tổng quan: phải xem và xác nhận lại. | PASSED |
| STALE-TIME | Tổng quan hết hạn: chặn commit, không tạo lượt thanh toán. | PASSED |
| CONSENT | Chưa xác nhận tổng quan: backend chặn commit dù gửi API trực tiếp. | PASSED |
| ADDRESS-CANONICAL | Gửi tên tỉnh/xã giả nhưng mã đúng: dùng tên trong danh mục server. | PASSED |
| ADDRESS-country | Chọn quốc gia ngoài Việt Nam: bị chặn theo phạm vi giao hàng hiện tại. | PASSED |
| ADDRESS-phone | Số điện thoại không hợp lệ: không cho checkout. | PASSED |
| ADDRESS-street | Thiếu địa chỉ đường: không cho checkout. | PASSED |
| ADDRESS-region | Mã phường/xã không thuộc danh mục: yêu cầu chọn lại. | PASSED |
| CUSTOM | Giỏ chỉ có món cần tìm mua: thu đủ giá nghiên cứu quy đổi và phí mua hộ; đơn có requiresSourcing=true. | PASSED |
| SHIP-JP | Món từ Nhật: giữ cước ở trạng thái cần báo giá, không dùng biểu cước Mỹ. | PASSED |
| MAX-LINES | 30 dòng mua hộ: đúng 30 đơn và 30 khoản phân bổ; tổng các khoản bằng số đã thu. | PASSED |
| CUSTOM-zero | Giá nghiên cứu bằng 0: từ chối thêm món. | PASSED |
| CUSTOM-negative | Giá nghiên cứu âm: từ chối thêm món. | PASSED |
| CUSTOM-too-many | 31 dòng vượt giới hạn: từ chối cả yêu cầu, không chia nhỏ âm thầm. | PASSED |
| MONEY-underpay | Cổng thực sự nhận thiếu 1 đồng: lưu số thực nhận, giữ đối chiếu, không tạo đơn/PDF và không cho hủy. | PASSED |
| MONEY-overpay | Cổng thực sự nhận thừa 1 đồng: giữ đối chiếu, không tự cộng giá hay tự hoàn tiền. | PASSED |
| PROVIDER-FAILED | Cổng xác nhận thất bại chưa thu: chỉ mở giỏ sau khi server đối chiếu. | PASSED |
| PRIVATE-PDF | Khách khác biết mã chứng từ: vẫn không đọc/tải được PDF. | PASSED |
| PERF-READS | Đọc trạng thái 10 lần nối tiếp và 5 lần đồng thời: kết quả vẫn đúng, không ghi lại tiền. | PASSED |

## Các lớp kiểm thử bổ sung

| Tình huống | Thẩm quyền và kết quả | Bằng chứng |
| --- | --- | --- |
| Body amount=0, âm, lẻ hoặc vượt safe integer | Schema chặn trước lưu trữ | purchase-provider unit |
| Body có thuộc tính ngoài hợp đồng | Strict schema chặn cả envelope/data | purchase-provider unit |
| Provider còn PENDING/PROCESSING/CANCELLED/EXPIRED nhưng callback nhận tiền | Không vượt ràng buộc trạng thái đã xác minh | purchase-provider unit |
| Chữ ký đúng nhưng reference/order/link/currency khác | Không gắn tiền cho lượt khác | unit và HTTP WH-* |
| Chữ ký đúng nhưng ngày giờ sai/không đọc được | Thời gian trên chứng từ phải khớp giao dịch đã xác minh; callback muộn không đổi paidAt | unit, WH-payment-time/invalid-time, G008 |
| Provider báo số thực nhận, nhưng callback khai số yêu cầu | Binding chặn; actual paidAmount là thẩm quyền | purchase-provider unit |
| Giỏ cùng revision nhưng thuộc người khác | Chặn trước mọi ghi draft/cart/idempotency | purchase-owner-guard unit |
| Giỏ cùng chủ đã có món | Thêm mua hộ giữ món cũ và đúng revision | purchase-owner-guard unit |
| Backend trả acknowledgement sai id hoặc field | Không bỏ dấu vết commit chưa rõ | purchase-acknowledgement unit |
| Đơn cũ dùng cọc, đơn mới trả đủ ban đầu | Tracking không đổi nghĩa tiền của đơn cũ | purchase-checkout, order-tracking unit |
| Giá niêm yết trả đủ | Không tạo bước trả thêm không hợp lệ | purchase-checkout unit |
| PDF số lượng, đơn giá, phí, thành tiền, tổng | Khớp snapshot tiền đã thu, không dùng giá catalog đang đổi | purchase-pdf unit và geometry |
| Đơn giá suy ra không nguyên | Giữ tổng dòng chính xác, không tự làm tròn giá | purchase-pdf unit |
| 30 tên/biến thể dài trong PDF | Mã đơn không mất; đầu bảng được lặp qua trang | purchase-pdf unit |
| Chứng từ trả thêm | Tổng đã duyệt = đã trả trước + lần này; liên kết chứng từ trước | business E2E và unit |
| Hai commit khác mã cùng giỏ | Chỉ một checkout được đặt giữ | rules purchase-checkout |
| Hai bằng chứng đến cùng lúc | Một phân bổ và giỏ được tiêu thụ một lần | rules và cross-process |
| Client ghi draft/evidence/receipt/outbox | Mọi ghi trực tiếp bị rules chặn | rules purchase-checkout |
| Client đọc/ghi merchant/link/index/counter/financial/jobs | Owner, khách khác và không đăng nhập đều bị chặn ở các collection riêng tư | 11 rules provider cases |
| Chạy demo với project production-like | Fail closed dù bật cờ emulator | rules purchase-checkout |
| Lease worker hết hạn | Claim mới, đúng số attempts và một attachment hash | rules purchase-checkout |
| Không có email người nhận | pending_recipient, không khai là đã gửi | rules purchase-checkout |
| PDF tổng bị lệch | Retry giới hạn rồi failed, không có outbox và sổ tiền không đổi | rules purchase-checkout |
| Có nhiều job đang chạy và queued | Recovery vẫn tìm lease hết hạn, không xử lý hết queue không giới hạn | rules purchase-checkout |
| Job không có receipt | failed/RECEIPT_MISSING, không tạo dữ liệu chứng từ giả | rules purchase-receipt-orphans |
| Job ready/failed còn lease | Xóa lease cũ, giữ nội dung receipt | rules purchase-receipt-orphans |
| 17 waiter cùng khóa | Có giới hạn 16; trả lỗi thử lại, capacity được giải phóng | purchase-mutation-queue unit |
| 65 khóa cùng hoạt động | Giới hạn 64, không tăng Map không giới hạn | purchase-mutation-queue unit |
| Một việc bị reject ở giữa hàng | Thứ tự FIFO tiếp tục, không kẹt capacity | purchase-mutation-queue unit |
| 640 việc thành công/thất bại luân phiên | 10 vòng đều phục hồi hết capacity | purchase-mutation-queue unit |
| Raw timeout/unavailable/internal ở UI | Lời hướng dẫn tiếng Việt; không mất ý nghĩa lỗi giá đã đổi | 9 purchase-feedback unit cases |
| 3.200 việc queue và 50 PDF 30 dòng | Ghi heap/external/RSS sau GC và capacity thực; không tuyên bố production không rò rỉ | GATEWAY-RESOURCES.json |
| Link đơn hàng từ card thành công | Mở đúng sản phẩm, số đã thu, trạng thái cần tìm mua và PDF | Browser screenshot/order-320 |
| Link gateway sai | Có alert và link quay lại cùng lượt; không tạo tiền | Browser invalid-link-320 |
| Card success CSS 320/390 | Không tràn ngang; nút PDF khoảng 44x44; keyboard đến đúng link đơn | Browser checks |

## Chưa chạy hoặc nằm ngoài phạm vi

PayOS API thật, webhook do PayOS phát thật, đối soát ngân hàng, QR/chuyển khoản thật, SMTP/inbox thật, hóa đơn thuế, Maps, Node 22 trên Cloud Functions, trigger/scheduler Eventarc deployed, load nhiều instance production, Web Vitals thực địa và soak memory dài hạn: NOT_RUN. Native download completion Chrome: NOT_VERIFIED (công cụ hết thời gian chờ; chrome://downloads bị policy chặn, không dùng đường vòng). MFA nhân viên trong browser không bị vượt; nghiệp vụ staff được kiểm tra HTTP với quyền demo đã có. Không dùng thiếu bằng chứng để ghi zero, PASSED hoặc READY cho production.

TTL trong luồng này chỉ là hạn dùng tổng quan/liên kết và lease phục hồi. Không cấu hình TTL xóa checkout có tiền, bằng chứng, ledger hoặc chứng từ. Retention production cần quyết định chủ hệ thống khi tích hợp thật.

Rules chạy qua `scripts/purchase-gateway-rules.config.mjs`: fixture dùng chung giữ năm nhóm assertion gốc và timeout 15s, thêm 11 ca provider và ba ca orphan. Chọn đúng mã chứng từ gốc để dữ liệu âm tính không lẫn vào ca phục hồi. Fixture CI hiện tại cần Storage riêng 9298: NOT_RUN tại đây; không mở thêm server để thay thế bằng chứng dùng chung.
