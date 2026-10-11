# Thiết kế thanh toán theo code hiện có — r2

Ngày: 2026-10-08. Phạm vi được yêu cầu trong lượt này: điều chỉnh **thiết kế** theo code hiện tại. Đây là phần làm rõ UI của plan v1, không mở rộng nghiệp vụ hoặc tự duyệt thay đổi ứng dụng. Plan v1 vẫn giữ SHA256 `61da191daa407a0e950b508c423fa53cdd32261b741b6db92702caec7617107e`.

[Mẫu tương tác r2](../../previews/SATSUNICGO-UPFRONT-PAYMENT-20261008-r2.html) dùng trực tiếp năm stylesheet hiện có qua frontend chung 5207. Mẫu cần server này để nạp CSS; mở HTML bằng file:// không thay thế bằng chứng render. Không gọi Firebase, backend, PayOS hoặc email. V1 được giữ để đối chiếu; r2 là thiết kế UI hiện hành.

## Thành phần giữ và phần bổ sung

| Luồng | Code làm căn cứ | Giữ lại | Bổ sung có giới hạn trong plan v1 |
| --- | --- | --- | --- |
| Khung web | `src/app/SiteChrome.tsx`, `src/styles/global.css`, `src/styles/public-ux.css` | Logo hộp, Inter/Arial, xanh/trắng/navy, navigation, header và focus/mobile conventions | Không xây shell, hệ màu hoặc bộ component khác. Header mẫu không giả lập tài khoản đã đăng nhập. |
| Mua hộ theo yêu cầu | `src/features/requests/RequestForm.tsx`, `request-form.css`, `ProductComposer.tsx` | Món hàng → Thông tin thêm → Kiểm tra, tên/link/ảnh, số lượng, mẫu, tình trạng, trường tùy chọn và bản nháp | Giá khách tìm được mỗi món và tiền nguồn; tóm tắt server tính ở bước kiểm tra; xác nhận đủ tiền ban đầu. RequestForm hiện dùng stepper riêng: giữ cấu trúc này, không tự chuyển sang StepForm CRM. |
| Listing | `src/features/products/Checkout.tsx`, `packages/domain/catalog-checkout.ts` | Chọn mẫu/số lượng, server kiểm tra phiên bản, tổng niêm yết, trạng thái giá mới và recovery của lần gửi | Dùng chung màn thanh toán/return đã xác minh; không thêm trường giá khách tự nhập hoặc tăng giá trọn gói đã chấp thuận. |
| Chi phí thực tế | `src/features/operations/Workbench.tsx`, `src/features/orders/Changes.tsx`, `functions/src/changes.ts` | Quyền nhân viên, phân công, chứng cứ mua, phê duyệt và hold của đơn | Bản chi phí có phiên bản/từng thành phần, số tiền đã nhận và phần cần trả thêm; giữ tác vụ trong workbench/detail đang có, không tạo dashboard vận hành mới. |
| Thanh toán | `src/features/orders/OrderTools.tsx`, `functions/src/payments/payos.ts`, `src/shared/Loading.tsx` | Quyền owner, intent, đơn và financialEntries là căn cứ; pending/unknown có recovery | Backend mock giới hạn demo và dùng cùng sổ theo plan; UI nhận trạng thái server. Nút xem trạng thái của mẫu chỉ minh họa, không phải backend mock đã triển khai. |
| Chứng từ | `src/features/invoices/Documents.tsx`, `documents.css`, `packages/domain/invoices.ts`, `functions/src/invoices.ts` | `StatementView`, `salesStatement`, bảng món, `statementTotals`, danh sách/detail và quyền đọc | Loại payment receipt bên cạnh internal statement; phiếu riêng mỗi lần nhận tiền, tải PDF riêng tư và email attachment. Giữ nghĩa đã ghi nhận tại thời điểm phát hành. |
| Tabs và staged forms | `src/shared/PageTabs.tsx`, `page-tabs.css`, `StepForm.tsx` | Thanh tab gạch chân mảnh, target 44px, Arrow/Home/End chỉ chuyển focus, Enter/Space kích hoạt | Tab trên mẫu là bộ chọn màn thiết kế, không phải các bước mua hàng. Trong app, chỉ dùng tabs cho các nhóm nội dung độc lập. StepForm chỉ dành cho tác vụ CRM có bước thực sự. |

## Dữ liệu và hành động ở từng điểm

1. **Món hàng:** khách sửa giá nghiên cứu và lựa chọn, giữ bản nháp. Giá nhập là ước tính nguồn; ngân sách tùy chọn là tham khảo, không phải số tiền phải trả. Market quyết định currency; mẫu chỉ chạy USD và ghi rõ hai thị trường còn lại chưa tương tác.
2. **Kiểm tra:** server trả bản giá/tỷ giá/phí có phiên bản. Khách thấy tổng và phần vận chuyển chưa chốt, rồi xác nhận. Thay giá, số lượng hoặc phiên bản làm mất xác nhận cũ. Mẫu dùng 25.000 VND/USD và phí 5% có nhãn minh họa; không dùng làm cấu hình thương mại.
3. **Trả tiền:** sau khi tạo đơn/intent qua server, mở checkout. Return chỉ vào trạng thái đang xác minh. Pending/unknown tiếp tục kiểm tra lần đang chờ; không tạo khoản thu mới. Không thay chữ deposit toàn cục vì đơn cũ vẫn theo hợp đồng đã nhận.
4. **Trả thêm:** hiển thị tổng mới, tiền đã xác nhận, từng chênh lệch và revision. Khách duyệt trước khi trả; yêu cầu kiểm tra tạo hold. Không dùng im lặng, thao tác staff hoặc AI làm sự đồng ý của khách. Tiền đủ vẫn phải qua packing/freight/hold guards trước dispatch.
5. **PDF:** xuất từ snapshot của financialEntry đã xác minh. Worker/PDF/email không nằm trong critical path của webhook. Giữ payment success khi document/email lỗi; cho khôi phục từng job. Chưa gọi PDF nội bộ là hóa đơn thuế; seller/recipient phải đọc từ server đã xác minh.

Mẫu một món không thay thế thử nghiệm thêm 30 món, ảnh upload, login/reload, tài khoản khác, version stale, backend crash, ngân hàng, quyền warehouse hoặc email. Những điều đó vẫn thuộc acceptance của implementation plan v1.

## Review → fix → verify

- R4-01: mẫu v1 dùng font/shell/form/tab tự định nghĩa. R2 nạp CSS nguồn, khôi phục ba bước RequestForm và giữ Checkout/StatementView patterns.
- R4-02: class `panel` đụng selector chung gây thêm khung/padding. Đổi class riêng `previewPanel`; sửa mapping dataset tương ứng, rồi kiểm tra đổi tab và giữ bản nháp.
- R4-03: selector label chung làm checkbox consent xếp dọc. Tăng specificity chỉ trong preview; kiểm tra `display=flex`, checkbox 18px, Space bật nút và sửa giá xóa consent.
- R4-04: PDF cố định có thể bị hiểu là kết quả của calculator/listing vừa sửa. Nút xem PDF luôn mở ví dụ cố định, có thông báo số liệu độc lập; thêm bảng món và `statementTotals` theo Documents.
- R5: review lại source/component mapping, giới hạn hành động, validation, tab/step meanings, tiền/unknown, PDF samples và responsive renders. Không có finding mới trong tập kiểm tra đã chạy. Backend và application review vẫn **BLOCKED / NOT_RUN**, không có independent-agent PASS.

Frontend dùng lại listener PID 33570, port 5207; không khởi động, reset hoặc seed backend. Repository intelligence vẫn DEGRADED do index stale; bounded source reads là căn cứ. Không sửa app code, configuration, database, dependencies hoặc behavior tests trong lượt thiết kế này.
