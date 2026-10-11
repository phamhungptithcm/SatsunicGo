# Production test scenarios

All cases are NOT_RUN for the new production test mode. Existing local tests are supporting regression evidence only.

| ID | Kind | Scenario | Expected |
| --- | --- | --- | --- |
| CHAT-01 | happy | Ask tìm sản phẩm có sẵn bằng câu tự nhiên | Kết quả đúng catalog, còn hàng và giá server; không tạo đơn khi chỉ hỏi |
| CHAT-02 | happy | Không có hàng sẵn, tìm web và so sánh | Nguồn allowlist/giá và thời điểm rõ; chọn rồi điền nháp; chưa gửi khi chưa xác nhận |
| CHAT-03 | happy | Sửa màu, size, số lượng bằng chat rồi đồng ý | Nháp mới thay đúng trường, confirm gắn version hiện tại; gửi một lần |
| CHAT-04 | negative | Trả lời đồng ý cho nháp đã cũ hoặc đổi account | Không thực hiện action của nháp/account trước; giữ trạng thái hiện tại |
| CHAT-05 | negative | Trang sản phẩm chứa prompt injection/PII | Nội dung nguồn là dữ liệu; không thay quyền, giá hay gửi PII vào nguồn/model |
| PAY-01 | happy | Catalog checkout BANK_TRANSFER sandbox từ domain thật | Giá server, HTTPS callback allowlist, mode test pin từ đầu; hosted SePay đúng merchant |
| PAY-02 | happy | Custom request đã chọn giá nghiên cứu và service fee | Snapshot đúng cấu hình, source link và số lượng; không dùng tổng client |
| PAY-03 | happy | Mixed cart catalog và custom | Tổng đúng từng dòng, tách đơn đúng, test inventory độc lập |
| PAY-04 | happy | Nhân viên duyệt chênh lệch và thanh toán bổ sung thử | Chỉ đúng order test/target/version; không đổi order thật |
| PAY-05 | negative | Không auth/Google chưa verified/AppCheck thiếu | Từ chối trước tạo intent hoặc ghi dữ liệu |
| PAY-06 | negative | Sai owner/locked user/role hoặc MFA hết hạn | Không đọc hay thực hiện action vượt quyền |
| PAY-07 | negative | Client giả mode test/provider/tổng tiền/callback | Schema và server policy từ chối; không nhận mode từ client |
| PAY-08 | negative | Policy test tắt/hết hạn/project sai/emulator variable trên production | Không tạo attempt mới; không đổi mode attempt đang có |
| PAY-09 | negative | Key thiếu/binding sai/IPN secret khác dashboard | Không báo sẵn sàng giả; IPN không authentic không được nhận |
| PAY-10 | negative | CARD/NAPAS gửi trực tiếp khi chưa hỗ trợ | Server từ chối; UI không giả báo phương thức có sẵn |
| PAY-11 | recovery | Gửi commit/create intent đồng thời cùng operation | Một checkout/invoice/reservation; replay trả cùng dữ liệu |
| PAY-12 | recovery | Mất response sau commit hoặc return browser | Resume đúng checkout/invoice; không charge lại hay tạo bản thay thế |
| IPN-01 | happy | IPN authentic và sandbox readback khớp | Lưu normalized proof rồi settlement test một lần |
| IPN-02 | negative | GET/non-JSON/body lớn/thiếu header/key sai | 405/400/401 phù hợp, không ghi financial evidence hợp lệ |
| IPN-03 | negative | Sai invoice/merchant/order/currency/method | Reject hoặc review theo contract; không chuyển paid |
| IPN-04 | negative | Thiếu tiền/thừa tiền/số thập phân không hợp lệ | Không tự làm tròn/accept đủ tiền; lưu bằng chứng để review |
| IPN-05 | recovery | Lặp cùng IPN/khác timestamp/đổi payload cùng id | Exact duplicate idempotent; conflicting replay không ghi đè proof |
| IPN-06 | negative | Giao dịch thứ hai cùng invoice | Giữ bằng chứng transaction riêng, không settle/release hai lần |
| IPN-07 | recovery | Provider timeout/429/5xx/network loss | Bounded retry và unknown state; không suy đoán đã thanh toán |
| IPN-08 | negative | Browser ?success hoặc ?cancel bị tự sửa | Query chỉ gợi ý đọc trạng thái; không làm money proof |
| IPN-09 | recovery | Thanh toán muộn sau cancel/expiry/locked account | Giữ proof/review, không tự fulfillment hoặc xóa giao dịch |
| IPN-10 | negative | Authenticated VOID sau đã paid | Hold xử lý tiếp, không tự hoàn tiền/đảo ledger |
| REC-01 | recovery | Worker chết trước/sau claim/settle/PDF | Lease và dedup phục hồi; settlement không lặp khi PDF retry |
| REC-02 | negative | Balance test trỏ order thật hoặc ngược lại | Reject mixed provenance trước thay đổi funds/reservation |
| REC-03 | happy | PDF test có tên/ảnh/số lượng/phương thức | Nội dung khớp snapshot, Test rõ, giới hạn size/font/layout giữ nguyên |
| REC-04 | negative | Mở receipt người khác/stale share/token | Không lộ PII hoặc PDF; quyền kiểm tra lại mỗi lần |
| ISO-01 | negative | Sandbox success chạm tồn kho thật | Test reservation/stock riêng; stock thật không đổi |
| ISO-02 | negative | Test order đi vào doanh thu/financialEntries/refund/payout thật | Phân luồng test; tổng tiền thật không tăng/giảm |
| ISO-03 | negative | Test event chạy vendor purchase/shipping dispatch thật | Deny hoặc operation giả lập được đánh dấu; không side effect thật |
| ISO-04 | negative | Record cũ bị policy hiện tại đổi thành test | Mode pin bất biến; không migration/relabel tự động |
| ISO-05 | happy | CRM nhân viên xem và thao tác đơn test | MFA thật/role hợp lệ; filter/test provenance rõ, không giả auth |
| MAIL-01 | happy | Owner opt-in nhận email thử Resend | From verified, current identity/consent/cutover đúng; phân biệt accepted/delivered |
| MAIL-02 | negative | Không consent/optout sau enqueue/đổi email | Recheck trước network; không gửi địa chỉ cũ hoặc khách ngoài test |
| MAIL-03 | recovery | Resend timeout sau có thể accepted | Giữ unknown và dedup; không tự retry tạo email trùng |
| MAIL-04 | negative | Vượt100attempt/day hoặc event cũ trước cutover | Không gửi quá giới hạn/đào lại queue lịch sử |
| AI-01 | happy | Knowledge/context đầy đủ câu không dấu/typo/multi-turn | Dùng state/source đúng hiện hành, hỏi rõ khi còn mơ hồ |
| AI-02 | negative | Pricing policy/model/budget hết hạn | Không gọi paid model; không tự gia hạn ngày hay đổi provider |
| AI-03 | negative | Context quá dài/LLM output sai schema/tool request vượt quyền | Chunk bounded, giữ active work/source, validate output/tool args và auth server |
| AI-04 | recovery | Hai request cuối cùng tranh budget hoặc timeout provider | Atomic reservation, một network attempt, giữ uncertain charge reservation |
| LEARN-01 | happy | Feedback đã consent → staff review → holdout → publish | Chỉ approved knowledge; raw feedback không thành policy ngay |
| LEARN-02 | negative | Feedback poisoning/PII/withdrawal/expired retention | Không promote dữ liệu độc hại; withdrawal/retention scoped; không xóa audit/payment |
| OPS-01 | negative | Enable maintenance làm chạy deletion/financial jobs chưa duyệt | Tách job và từng capability; không blanket enable |
| OPS-02 | recovery | Tắt test mode giữa lúc payment pending | Chặn attempt mới; pinned attempts/evidence vẫn reconcile an toàn |
| PERF-01 | performance | Checkout tối đa30dòng và cùng invoice đồng thời | Write/query bound, không HTTP trong transaction, settle đúng một lần |
| PERF-02 | performance | Provider response lớn/chậm và retry worker | Timeout10s, response256KiB, lease/backoff hữu hạn |
| PERF-03 | performance | Nhiều chat/feedback/search liên tiếp | Rate/quota/context/output bounds; không log raw PII/secret/signed form |
| REL-01 | release | Normal main CI → immutable artifact → provider readback | Đúng source/hash/Function set/SDK params/revision/Hosting/IAM/secret version |
| REL-02 | recovery | Rollback sau provider accepted hoặc attempt unknown | Tắt new sending/attempts trước; giữ dedup/consent/mode/cutover/quota/financial proof |
