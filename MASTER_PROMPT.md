# MASTER PROMPT — XÂY DỰNG NỀN TẢNG MUA HỘ MỸ / NHẬT / HÀN

Tên làm việc: **SatsunicGo**, sản phẩm của HunpeoLabs. Đây là tên tạm, có thể đổi trong cấu hình.

## 1. Nhiệm vụ và cách thực hiện

Bạn là kỹ sư phụ trách sản phẩm, phát triển full-stack, bảo mật, kiểm thử và triển khai. Hãy trực tiếp xây dựng ứng dụng trong repository hiện tại. Không chỉ trả về kế hoạch, tài liệu, giao diện mẫu hoặc danh sách việc người dùng phải tự làm.

Sản phẩm giúp khách hàng yêu cầu mua hàng tại Mỹ, Nhật và Hàn Quốc. Nhân viên mua hộ xác minh sản phẩm, báo giá và thực hiện việc mua. Khách hàng thanh toán cọc 50% theo báo giá đã chấp nhận, sau đó thanh toán phần còn lại khi mua hàng và đóng gói hoàn tất, trước khi xuất gửi. Doanh nghiệp quản lý khách hàng, mua hàng, nhận hàng, đóng gói, gom kiện, vận chuyển, thành viên, hỗ trợ và nội dung quảng bá trong một CRM.

Xây phiên bản nhỏ nhất nhưng thực sự hoàn chỉnh của tất cả chức năng được yêu cầu. Triển khai theo từng luồng xuyên suốt từ UI đến dữ liệu, xử lý phía server, phân quyền và kiểm thử. Tiếp tục thực hiện toàn bộ phạm vi; không dừng sau phần khung dự án hoặc giai đoạn đầu tiên.

Khi một dịch vụ ngoài chưa có tài khoản hoặc credentials, hoàn thiện phần code và kiểm thử độc lập có thể thực hiện, vô hiệu hóa an toàn đường tích hợp chưa xác minh, ghi chính xác BLOCKED_EXTERNAL và tiếp tục công việc khác. Không thay tích hợp thiếu bằng thông báo thành công giả.

Dùng đúng trạng thái PASS, FAIL, BLOCKED_EXTERNAL, NOT_RUN. Build thành công không đồng nghĩa sẵn sàng nhận tiền thật. Duy trì bảng đối chiếu yêu cầu → phần triển khai → bài kiểm thử → bằng chứng.

## 2. Giả định mặc định và giới hạn phạm vi

Giả định làm việc: khách hàng chính ở Việt Nam, gồm người mua cá nhân và hộ kinh doanh nhỏ. Giao diện mặc định tiếng Việt, có cấu trúc bản địa hóa tiếng Anh. Tiền thu khách mặc định VND. Thị trường nguồn US, JP, KR; giữ riêng giá gốc bằng đồng tiền của thị trường nguồn. Lưu thời gian UTC và hiển thị theo múi giờ phù hợp. Các giả định này phải thay đổi được bằng cấu hình, không phải quy định pháp lý hoặc cam kết kinh doanh cố định.

“Agent mua hộ” là nhân viên con người. AI hỗ trợ tư vấn, tra cứu và soạn nháp; AI không tự tiêu tiền, mua hàng trên website đối tác, xác nhận thanh toán hoặc quyết định hoàn tiền.

V1 phục vụ một doanh nghiệp vận hành, không phải sàn nhiều người bán hoặc SaaS đa doanh nghiệp. Khách kinh doanh có hồ sơ doanh nghiệp dưới một tài khoản chủ. Không tự thêm hệ thống chia tiền người bán, ví khách hàng, escrow, cho vay, mua trả sau, mobile/desktop native, microservices, Kubernetes, bot tự mua hàng, crawler toàn Internet hoặc nền tảng tìm kiếm/RAG phức tạp.

Tất cả các nhóm chức năng khách hàng, CRM, membership, kho, giao hàng, phân quyền và AI đều thuộc phạm vi phải hoàn thành. Nhân viên mua hàng thủ công, kế toán đối soát chuyển khoản và nhân viên cập nhật vận đơn là các chế độ vận hành hợp lệ; phải ghi rõ đó là thao tác thủ công, không giả là tự động.

## 3. Khảo sát repository và giữ stack đơn giản

Đọc cấu trúc repository, AGENTS.md, package manifests, Firebase config, Git status, tài sản thương hiệu và ảnh tham chiếu trước khi sửa. Giữ nguyên thay đổi không liên quan và chức năng đang hoạt động. Dùng công cụ Firebase/MCP chính thức nếu môi trường đã có, nhưng không tự giả định credentials hoặc quyền truy cập.

Chỉ cần một repository và một ứng dụng React responsive, chia route công khai, khách hàng và nhân viên.

Stack:

- React + TypeScript + Vite; React Router.
- Tailwind CSS và một bộ component có accessibility nhất quán; ưu tiên hệ thống sẵn có của repo.
- React Hook Form + Zod, hoặc thư viện tương đương đang được dùng.
- Firebase Authentication, Firestore Standard edition, Cloud Storage, Firebase Hosting, Cloud Functions viết bằng TypeScript; ưu tiên Functions thế hệ 2 khi phù hợp.
- Firebase App Check, Secret Manager, Emulator Suite; chỉ thêm scheduled Functions khi thực sự cần.
- Genkit + Gemini thông qua Cloud Functions phía server cho AI.
- Vitest, React Testing Library, Firebase Rules tests và Playwright.
- GitHub Actions khi repository được quản lý trên GitHub.

Chọn dependency ổn định, tương thích với nhau và Node runtime được Functions hỗ trợ. Kiểm tra API theo tài liệu chính thức hiện hành; commit lockfile và lệnh cài đặt tái lập được. Không đổi sang Next.js, database khác, Express server riêng, Redis hoặc một nền tảng AI thứ hai nếu không có yêu cầu thực tế và chấp thuận.

Tách tính giá, quyền hạn và chuyển trạng thái thành các hàm domain thuần có thể test không cần React/Firebase. Dùng cấu trúc feature-based gọn như src/features, src/shared, functions/src, tests. Không xây framework riêng hoặc workflow engine tổng quát.

## 4. Màn hình và định hướng giao diện

Thiết kế theo phong cách HunpeoLabs: chữ rõ, nền trắng, trang public thoáng, CRM gọn và tập trung vào công việc, màu nhấn tiết chế, component nhất quán. Ưu tiên brand assets có sẵn. Không bịa testimonial, số khách hàng, số đơn đã giao, đối tác hoặc cam kết giao hàng.

Website công khai có: trang chủ, gửi yêu cầu mua hộ, danh sách/chi tiết sản phẩm, cách hoạt động, biểu phí, membership, bài viết, FAQ, hỗ trợ/liên hệ, điều khoản, quyền riêng tư, đổi trả/hoàn tiền và chính sách hàng hạn chế.

Cổng khách hàng có: tổng quan, yêu cầu/báo giá, chi tiết đơn, timeline, hóa đơn/thanh toán, kiện hàng/vận đơn, địa chỉ, membership, hội thoại hỗ trợ và hồ sơ. Làm nổi bật “Việc cần bạn xử lý”: duyệt báo giá, duyệt thay đổi, cọc, thanh toán phần còn lại, bổ sung thông tin.

CRM có: dashboard vận hành, hàng đợi yêu cầu, soạn báo giá, hàng đợi mua hàng, nhận hàng, đóng gói, gom kiện/vận chuyển, kế toán/đối soát, khách hàng, hỗ trợ, sản phẩm, bài viết/chiến dịch, membership, nhân viên/phân quyền, audit và cấu hình. Ưu tiên bảng dữ liệu, bộ lọc, detail panel và hàng đợi hành động; tránh dashboard trang trí với số liệu vô nghĩa.

Gợi ý nội dung trang chủ: “Mua hàng Mỹ, Nhật, Hàn. Bạn chọn, chúng mình lo phần còn lại.” CTA chính: “Gửi yêu cầu mua hộ”. Giải thích rõ quy trình và các thành phần phí; không ngụ ý hàng có sẵn hoặc có quan hệ đối tác chưa được xác minh.

Ask Anything phải giống 100% UI/UX, behavior, animation và transition của Ask HunpeoLabs hiện tại theo hợp đồng đối chiếu ở mục 14. HunpeoLabs là chuẩn chính cho component, layout, kích thước, responsive và chuyển động. Ảnh docs/references/homepage-chat-reference.png chỉ là tham chiếu bổ sung cho composer dài fixed dưới viewport; khi khác nhau, ưu tiên implementation HunpeoLabs đã chốt làm baseline.

Composer trang chủ bắt đầu bằng ô nhập dài fixed, căn giữa ở đáy viewport. Giữ đúng khả năng thu gọn thành launcher và mở lại của HunpeoLabs; không bỏ các trạng thái này. Chừa khoảng trống để không che nội dung, nút thanh toán, cookie banner hoặc navigation. Áp dụng safe-area, bàn phím mobile, focus, dialog và reduced motion theo reference. Chỉ thêm microphone/attachment khi có chức năng thật đã được kiểm chứng.

## 5. Google One Tap và phân quyền

Tích hợp Google One Tap bằng Google Identity Services hiện hành, đổi credential nhận được thành Firebase session qua luồng Firebase Auth được hỗ trợ. Luôn có nút “Đăng nhập với Google” hoạt động để dự phòng. Xử lý One Tap không xuất hiện/bị đóng, popup bị chặn, chuyển hướng trên mobile, khôi phục phiên và đăng xuất; không tạo vòng lặp tự đăng nhập.

Cho khách xem website và soạn yêu cầu trước đăng nhập. Bắt buộc tài khoản Google đã xác thực khi gửi yêu cầu chính thức, quản lý đơn, thanh toán, mua membership hoặc xem dữ liệu riêng. Giữ bản nháp không nhạy cảm qua bước đăng nhập mà không rò dữ liệu tài khoản khác.

Dùng bộ vai trò nhỏ, rõ: CUSTOMER, OWNER, OPERATIONS_MANAGER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR. Một nhân viên có thể có nhiều nhóm quyền. Membership là quyền lợi thương mại, không phải vai trò nhân viên.

Khách chỉ truy cập dữ liệu của mình. BUYER được xử lý đơn/thị trường được giao. WAREHOUSE chỉ thấy kho và dữ liệu giao nhận cần thiết, không mặc nhiên được xem toàn bộ thông tin tài chính. FINANCE xử lý xác minh thanh toán, đối soát, chứng từ và hoàn tiền. SUPPORT không sửa tiền hoặc âm thầm sửa báo giá. CONTENT_EDITOR không xuất dữ liệu khách hàng hoặc cấp quyền nhân viên. OWNER quản lý cấu hình và quyền truy cập.

Lưu quyền nhân viên trong tài liệu được server quản lý. Không cấp quyền từ input đăng ký, profile khách tự sửa, email domain đơn thuần hoặc quy tắc “người đăng ký đầu tiên là admin”. Có quy trình bootstrap owner bằng công cụ dành cho người vận hành được ủy quyền.

Kiểm tra quyền hiện hành, phạm vi được giao, trạng thái khóa tài khoản và quyền sở hữu tài nguyên trong từng server command và Security Rules. Route guard chỉ phục vụ UI. Xử lý thu hồi quyền và token/claims cũ. Yêu cầu xác thực gần đây cho thao tác nhạy cảm; triển khai hoặc xác minh cơ chế xác thực hai lớp phù hợp cho người có quyền tài chính trước vận hành tiền thật.

## 6. Yêu cầu mua hộ và báo giá

Chấp nhận tên sản phẩm mà không bắt buộc URL. Hỗ trợ URL, ảnh tùy chọn, quốc gia, cửa hàng mong muốn, số lượng, size/màu/model, tình trạng sản phẩm, ngân sách, hạn mong muốn và ghi chú. Giới hạn hợp lý số dòng, số lượng và kích thước dữ liệu. Phải làm rõ biến thể còn thiếu trước khi chốt báo giá.

Sản phẩm trong catalog được dùng để điền trước yêu cầu, không phải bằng chứng giá hoặc tồn kho hiện tại. V1 cho nhiều dòng hàng cùng quốc gia nguồn trong một đơn. Yêu cầu khác quốc gia được tách thành các đơn liên kết dưới cùng khách hàng.

Nhân viên xác minh sản phẩm/cửa hàng/biến thể, tình trạng mua được, điều kiện vận chuyển và soạn báo giá chi tiết. Yêu cầu chỉ có tên sản phẩm không được lập tức thu một khoản cọc tùy ý. Đưa ra kết quả phù hợp và để khách xác nhận đúng sản phẩm.

Mỗi báo giá là một snapshot có version: giá gốc và tiền tệ, số lượng, tỷ giá áp dụng, phí mua hộ, phí/thuế nội địa nguồn dự kiến, cước quốc tế dự kiến, giao nội địa đích dự kiến, khoản thu đã biết, giảm giá, hạn hiệu lực và version điều khoản. Phân biệt rõ ước tính, khoản chưa gồm và thời điểm kiểm tra giá/tồn kho.

Khách phải chấp nhận một version báo giá còn hiệu lực trước khi thanh toán cọc. Lưu người chấp nhận, thời gian, version giá và điều khoản. Báo giá được chấp nhận không bị ghi đè; chỉnh sửa bằng version mới có phê duyệt.

Thay giá, sản phẩm thay thế, thiếu hàng, thay số lượng, đổi tuyến hoặc phát sinh phí đều cần đề xuất thay đổi và chấp thuận trước khi mua thêm hoặc thu thêm. Chấp thuận khách hàng phải là bằng chứng riêng, không phải ghi chú nhân viên tự viết. Ngăn tab cũ chấp nhận báo giá đã bị thay thế.

## 7. Quy tắc tính tiền và cọc 50%

Dùng số nguyên theo đơn vị tiền tệ nhỏ nhất, metadata tiền tệ rõ, giới hạn giá trị an toàn và phép tính decimal/rational cho tỷ giá. Ghi chính sách làm tròn. Không dùng số thực nhị phân cho tổng tiền có thẩm quyền. Giữ riêng số tiền nguồn và số tiền thu khách.

V1 dùng bảng tỷ giá do OWNER/FINANCE quản lý với thời gian hiệu lực và markup công khai nếu có. Snapshot tỷ giá vào báo giá; chưa cần tích hợp dịch vụ tỷ giá trực tiếp. Không gọi tỷ giá nội bộ là tỷ giá thị trường.

Mặc định tính cọc bằng 50% tổng báo giá dự kiến đã được khách chấp nhận, gồm các khoản phí dự kiến đã công bố. Có cấu hình chính sách, nhưng khách không được tự chọn tỷ lệ cọc và không được đổi chính sách hồi tố cho đơn đã chấp nhận.

Định nghĩa:

    requiredDeposit = roundUp(acceptedEstimatedTotal * 50 / 100)
    finalPayable = approvedFinalCharges - approvedDiscounts - approvedCredits
    netCollected = confirmedOrderPayments - confirmedRefunds - confirmedReversals
    remainingDue = max(0, finalPayable - netCollected)
    overpayment = max(0, netCollected - finalPayable)

Khoản thu/hoàn tiền phải được phân bổ rõ cho đơn hoặc hóa đơn membership. Tiền membership không thanh toán dư nợ mua hộ. Không cộng trùng hóa đơn cọc và hóa đơn cuối thành doanh thu hoặc công nợ. Credit giảm nghĩa vụ phải trả; hoàn tiền giảm tiền đã thu. Một sự kiện không được trừ hai lần.

Ví dụ bắt buộc có test: báo giá 2.000.000 VND, cọc 1.000.000 VND. Tổng cuối được duyệt 2.160.000 VND thì còn thu 1.160.000 VND, không mặc định thu thêm đúng 1.000.000 VND. Khi không có thay đổi giá, lần hai chính là 50% còn lại ban đầu.

Nghĩa vụ cọc ban đầu được snapshot. Không tự thay đổi tiền cọc đã thu khi có báo giá điều chỉnh; mọi yêu cầu thu bổ sung phải có lý do và được chấp thuận riêng.

Trước khi yêu cầu thanh toán cuối phải có cân nặng/kích thước đã xác nhận, chi phí, bằng chứng đóng gói và thay đổi được duyệt. Mặc định thu đủ trước xuất gửi từ kho nguồn. Khoản phí thực tế chưa thể xác định phải được công bố đúng là ước tính/chưa gồm; không quảng cáo là trọn gói chắc chắn. Phát sinh đặc biệt sau đó cần chứng từ điều chỉnh và chấp thuận, không sửa âm thầm hóa đơn đã trả.

Dùng nhật ký tài chính append-only, chỉnh sai bằng bút toán/khoản điều chỉnh đối ứng có tham chiếu. Tính balance từ khoản thu đã xác nhận và đối soát. Tách chi phí/lợi nhuận nội bộ khỏi khoản thu khách; không giả đây là hệ thống kế toán pháp định đầy đủ.

## 8. Thanh toán, chứng từ và hoàn tiền

Triển khai hoàn chỉnh phương thức chuyển khoản được nhân viên xác minh, đồng thời triển khai tích hợp payment link payOS sau một interface nhỏ. Chỉ bật payOS thật khi có tài khoản merchant phù hợp đã được kích hoạt. Kiểm tra SDK/API chính thức hiện tại; không giả định có sandbox, thanh toán định kỳ tự động, thanh toán thẻ, API hoàn tiền hoặc quyền chi tiền.

Chuyển khoản: hiển thị người thụ hưởng đã cấu hình, số tiền chính xác và mã tham chiếu duy nhất; nhận bằng chứng khách gửi; FINANCE đối chiếu với giao dịch ngân hàng thực tế. Nút “Tôi đã chuyển khoản” chỉ tạo yêu cầu chờ xác minh, không đánh dấu đã thanh toán. Ảnh chụp đơn thuần không phải xác nhận tiền đã về. Lưu người xác minh, mã giao dịch ngân hàng, số tiền, thời điểm và bằng chứng. Không phân bổ cùng giao dịch ngân hàng hai lần.

Payment provider: tạo yêu cầu thanh toán phía server từ hóa đơn đã kiểm tra quyền. Dùng trang thanh toán được provider lưu trữ khi được hỗ trợ. Cất credentials trong Secret Manager. Return URL trên trình duyệt chỉ hiển thị trạng thái đang xử lý, không tự xác nhận paid.

Webhook phải xác minh chữ ký, merchant context, tham chiếu, số tiền, tiền tệ và định danh giao dịch đúng hợp đồng của provider. Phản hồi callback kiểm tra/đăng ký webhook theo tài liệu nhưng không ghi nhận callback mẫu là tiền thật.

Tạo payment request, xử lý webhook, phân bổ tiền và hoàn tiền đều phải idempotent. Dùng định danh thao tác ổn định và chặn trùng bằng cập nhật nguyên tử. Ghi ý định trước gọi dịch vụ ngoài; khi timeout không rõ kết quả, truy vấn provider để phục hồi thay vì tạo giao dịch mới mù quáng. Không gọi API thanh toán bên trong callback Firestore transaction có thể chạy lại.

Xử lý callback lặp, trễ, thiếu, sai thứ tự; trả thiếu; trả thừa; link hết hạn; báo giá cũ; khách trả sau khi đơn bị hủy; nhiều lần bấm thanh toán; thanh toán thất bại và tiền bị đảo/reversal. Tiền thật vào vẫn phải đưa vào đối soát dù đơn không được tự đi tiếp. Một giao dịch provider không được ghi có cho hai đơn.

Có scheduled reconciliation và hàng đợi ngoại lệ cho kế toán. Tách trạng thái payment request, giao dịch provider, hóa đơn và đơn mua hộ. Hoàn tiền cần quyền và lý do; chỉ hoàn tất khi có bằng chứng ngân hàng/provider thực. Không coi “đã yêu cầu hoàn” là “khách đã nhận lại tiền”. Ngăn hoàn vượt phần có thể hoàn, kể cả yêu cầu đồng thời.

Tạo chứng từ cọc, số dư, membership và điều chỉnh có version, số chứng từ truy vết được, bản in/PDF hiển thị tiếng Việt đúng. Phân biệt yêu cầu thanh toán/biên nhận nội bộ với hóa đơn thuế điện tử hợp lệ. Không tuyên bố có e-invoice pháp định khi chưa tích hợp và xác minh.

Trước launch phải có ít nhất một phương thức nhận tiền thật được cấu hình và kiểm thử. Phương thức chưa cấu hình phải ẩn hoặc báo không khả dụng; tuyệt đối không mô phỏng paid trên production.

## 9. Vòng đời đơn và điều kiện chuyển trạng thái

Tách tiến trình mua hộ, trạng thái tiền và trạng thái vận chuyển. Không dùng một status có thể sửa tùy ý cho tất cả.

Luồng nghiệp vụ tham chiếu:

    DRAFT -> REQUESTED -> QUOTED -> QUOTE_ACCEPTED
    -> PURCHASING -> PURCHASED -> ORIGIN_RECEIVED -> PACKED
    -> READY_TO_SHIP -> IN_TRANSIT -> DESTINATION_RECEIVED
    -> OUT_FOR_DELIVERY -> DELIVERED -> COMPLETED

Xác nhận đủ cọc là mốc tài chính mở khóa PURCHASING. PACKED có thể hiển thị “Chờ thanh toán phần còn lại”. READY_TO_SHIP chỉ hợp lệ khi tổng cuối đã được duyệt, remainingDue bằng 0, đóng gói đạt checklist và không có hold. Khi bàn giao xuất gửi phải kiểm tra lại các điều kiện ngay tại server, không tin trạng thái UI cũ.

Có trạng thái/hold rõ cho thiếu thông tin, báo giá hết hạn, hết hàng, chờ duyệt thay đổi, hàng hỏng, kiểm tra hạn chế vận chuyển, tranh chấp tiền, giao trễ, hủy, trả hàng và hoàn tiền. Mỗi chuyển trạng thái cần xác định quyền, điều kiện đầu vào, thay đổi kèm theo, thông báo và cách phục hồi.

Dùng server commands có expectedVersion, transaction khi cần, idempotency key, timeline bất biến và audit. Ngăn hai nhân viên nhận/mua cùng phần hàng. Không có endpoint “set bất kỳ status nào” hoặc kéo thả bỏ qua điều kiện tài chính.

Hủy trước mua, sau mua và sau xuất gửi cần luồng khác nhau theo điều khoản đã chấp nhận. Không mặc định tịch thu cọc hoặc hứa hoàn vô điều kiện. Giữ lịch sử phần hàng đã xử lý và chi phí thật. Đơn bị hủy và tiền đang chờ hoàn là hai sự kiện khác nhau.

Timeline khách dùng nhãn tiếng Việt dễ hiểu, thời điểm, bước hiện tại, hành động tiếp theo và nguồn cập nhật. Không bịa mốc xử lý, phần trăm tiến độ hoặc thời điểm hoàn tất giao hàng.

## 10. Mua hàng, nhận kho, đóng gói và gom kiện

Nhân viên mua hộ nhận việc, ghi cửa hàng/mã đơn nguồn, sản phẩm/biến thể/số lượng đã mua, giá thật, chứng từ, ngày mua và tracking đầu vào. V1 nhân viên mua bên ngoài hệ thống, không tự động thao tác checkout trên website merchant. Lưu bằng chứng, không giả tích hợp mua hàng.

Kho có: đăng ký hàng đến; ghép với đơn/dòng hàng; ghi số lượng và tình trạng; ảnh kiểm hàng; thiếu/hỏng; cân nặng/kích thước; vị trí kệ; checklist đóng gói; nhãn kiện nội bộ và packing list. Ngăn nhận trùng và phân bổ trùng số lượng. Nhãn nội bộ không được hiển thị như đã mua shipping label của hãng vận chuyển.

Phân biệt đơn của khách, số lượng từng dòng hàng, kiện vật lý và lô gom nội bộ. Một đơn có thể nhiều kiện; nhiều đơn tương thích có thể chung lô gom. Theo dõi số lượng phân bổ để không gửi một sản phẩm hai lần và không coi giao một phần là giao đủ.

Cho nhân viên gom theo kho nguồn, tuyến, hub đích, dịch vụ và cutoff phù hợp. Chưa cần tối ưu tự động. Khách đủ điều kiện có thể yêu cầu giữ hàng/gom đơn; hiển thị thời hạn, phí giữ nếu có và đánh đổi về thời gian.

Rate card vận chuyển có đơn vị cân, công thức khối lượng thể tích, mức tối thiểu, cách làm tròn và hiệu lực. Snapshot quy tắc áp dụng. Phân bổ cước chung theo quy tắc billable weight đã duyệt; chia phần dư làm tròn nhất quán và bảo đảm tổng phân bổ bằng tổng phí lô. Không hứa tiết kiệm một con số khi chưa có dữ liệu.

Trước chốt/xuất lô, kiểm tra các đơn liên quan đều đủ tiền và sẵn sàng. Kiện chưa trả đủ hoặc bị hold phải tách được mà không hỏng phân bổ. Nếu chia lại cước làm tăng khoản thu khách, phải xin duyệt lại.

Manifest lô gom và dữ liệu khách khác chỉ dành cho nhân viên. Khách chỉ thấy phần kiện/vận chuyển của chính mình.

## 11. Vận đơn và giao hàng

Hỗ trợ các chặng: cửa hàng → kho nguồn; vận chuyển quốc tế; hub đích; giao nội địa cuối. Lưu hãng, mã vận đơn, URL theo dõi tin cậy, trạng thái, thời gian sự kiện, lần đồng bộ cuối và nguồn dữ liệu.

Cập nhật thủ công là chức năng bắt buộc, hoạt động hoàn chỉnh và ghi “Cập nhật bởi nhân viên”. Có interface nhỏ cho carrier adapter; chỉ tích hợp hãng cụ thể khi đã chọn và có tài liệu/credentials. Không giả GPS trực tiếp, đồng bộ tự động hoặc tracking bằng crawler chưa được kiểm chứng.

Xử lý đã giao, giao không thành công, chậm, mất/hỏng, trả lại và giao một phần. Trạng thái hoàn tất của đơn được tổng hợp từ kiện/số lượng thật; một kiện đã giao không hoàn tất toàn đơn còn hàng chưa giao.

ETA phải ghi rõ là dự kiến. Quyền lợi giao nhanh chỉ áp dụng tuyến/dịch vụ khả dụng và mức ưu tiên vận hành, không bảo đảm thông quan. Địa chỉ giao là snapshot khi xuất gửi; thay địa chỉ sau đó phải có yêu cầu điều chỉnh được kiểm soát.

## 12. Membership cho người mua thường xuyên và hộ kinh doanh

Có gói cấu hình được FREE, PLUS, BUSINESS. Gói trả phí hỗ trợ kỳ tháng/năm trả trước, thời điểm bắt đầu/kết thúc, gia hạn, nhắc sắp hết hạn, hủy ý định gia hạn và lịch sử quyền lợi. Không tự trừ tiền định kỳ khi chưa có cơ chế provider hỗ trợ và sự đồng ý rõ của khách.

Cấu hình giá gói, giảm phí mua hộ, khoản cước được giảm, gom/giữ hàng, ưu tiên hỗ trợ và điều kiện xử lý nhanh. Giá/tỷ lệ chưa được chủ doanh nghiệp duyệt phải ở trạng thái nháp, không tự bịa đưa lên bán. Chỉ kích hoạt sau thanh toán xác nhận hoặc cấp tặng có quyền, lý do và audit rõ.

Giảm membership thường áp dụng phí dịch vụ hoặc khoản vận chuyển được quy định, không tự giảm giá hàng bên thứ ba hoặc thuế. Hiển thị rõ giảm ở khoản nào. Có trần giảm, phí tối thiểu, quy tắc cộng với mã khuyến mãi và ngày hiệu lực. Không tạo số tiền âm.

Snapshot quyền lợi tại lúc khách chấp nhận báo giá. Gói hết hạn hoặc admin sửa plan không được âm thầm làm thay đổi đơn đã chấp nhận. Yêu cầu mới dùng quyền lợi hiện hành theo thời gian server.

Khách kinh doanh có hồ sơ kinh doanh, yêu cầu nhiều dòng, nhập dòng hàng CSV có validation, đặt lại, yêu cầu gom hàng và xuất đơn/chứng từ. V1 chỉ cần một chủ tài khoản, không tự xây tenancy và đội nhóm khách kinh doanh.

Phân biệt “AI hỗ trợ 24/7” với giờ nhân viên trực và mục tiêu phản hồi. Chỉ quảng cáo nhân viên hỗ trợ 24/7 hoặc cam kết giao nhanh khi doanh nghiệp đã cấu hình một cam kết vận hành có thật.

## 13. CRM, sản phẩm, bài viết và quảng bá

Hồ sơ CRM: thông tin khách, consent/preferences, tag, ghi chú nội bộ, nhân viên phụ trách, đơn, chứng từ, membership, vấn đề đang mở và việc cần theo dõi. Tách tin nhắn khách thấy khỏi ghi chú nội bộ. Hạn chế export hàng loạt và phòng CSV formula injection.

Dashboard có số liệu thật về yêu cầu mới, báo giá chờ phản hồi, cọc chờ xác minh, việc cần mua, sai lệch nhận kho, số dư chờ trả, kiện sẵn sàng, đơn giao trễ, ticket và ngoại lệ tài chính. Query/aggregate có giới hạn, khoảng thời gian và múi giờ rõ.

CMS hỗ trợ tạo/sửa sản phẩm và bài viết, ảnh có quyền sử dụng, phân loại, quốc gia nguồn, link, biến thể, giá tham khảo kèm thời điểm, CTA mua hộ, slug, SEO metadata, nháp/xuất bản/lưu trữ, xem trước, lịch xuất bản và lịch sử thay đổi. Khách public chỉ đọc nội dung đã xuất bản hợp lệ.

Có bản nháp chiến dịch, caption mạng xã hội, mô tả sản phẩm, lịch nội dung, share link và UTM cơ bản. AI soạn/viết lại để người có quyền duyệt. Xuất bản lên chính website là chức năng thật. Auto-post Facebook/mạng xã hội phải tắt khi chưa có tích hợp chính thức, quyền và credentials; copy caption hoặc mở share dialog không được gọi là đăng tự động.

Trang public phải có HTML ban đầu có thể đọc bởi crawler, metadata/Open Graph đúng. Dùng giải pháp prerender hoặc public rendering nhỏ nhất phù hợp Vite + Firebase Hosting. Luồng xuất bản phải đồng bộ nội dung và metadata; test HTML nhận được khi không chạy JavaScript. Không thêm một framework web thứ hai chỉ vì SEO.

Sanitize rich text và upload. Không đưa chứng từ nhà cung cấp, địa chỉ khách, lợi nhuận nội bộ hoặc nội dung chưa xuất bản ra public.

## 14. AI “Ask anything” fixed dưới trang chủ

### Hợp đồng sao chép Ask HunpeoLabs

Mục tiêu: giống 100% toàn bộ giao diện và cơ chế tương tác quan sát được của Ask HunpeoLabs, không chỉ giống screenshot. Chỉ thay thương hiệu, ngôn ngữ mặc định, nội dung/gợi ý và dữ liệu nghiệp vụ thành SatsunicGo; giữ các giới hạn bảo mật và xác nhận hành động phía dưới.

Baseline source tại `/Users/hunpeo97/Desktop/Workspace/Coder/HunpeoLabs`:

- `components/ask-hunpeolabs.tsx`: state, composer, dialog, hội thoại, gửi/dừng/thử lại, focus, cuộn, hủy request và lifecycle.
- `components/ask-hunpeolabs.module.css`: toàn bộ layout, typography, màu, khoảng cách, viền, bóng, icon, breakpoint, hover/focus/disabled, backdrop và motion.
- `components/ask-site.tsx`: hiển thị theo route và reset hội thoại khi điều hướng.
- `tests/e2e/ask.spec.ts`, `tests/unit/ask*.test.ts` và `docs/operations/ask-hunpeolabs.md`: hành vi và failure paths tham chiếu; đọc các helper được component import khi cần.

Trước triển khai, đọc source và chạy reference trong browser, ghi commit và hash các file cùng screenshot/video các trạng thái làm baseline bất biến. Nếu source hoặc browser reference không truy cập được, ghi BLOCKED_EXTERNAL cho đối chiếu còn thiếu; không tự thiết kế thay thế rồi tuyên bố giống 100%.

1. Sao chép đầy đủ trạng thái: composer ban đầu, focus/nhập, gợi ý, mở hội thoại, đang xử lý/streaming, câu trả lời và nguồn/CTA, dừng, lỗi, quota, thử lại, đóng, thu gọn, launcher, hint và mở lại hội thoại. Thay nguồn/CTA bằng dữ liệu mua hộ đã duyệt; không mang nội dung dịch vụ/founder HunpeoLabs sang SatsunicGo.
2. Giữ timing và hình học motion từ source: mở dialog 360ms, đóng 320ms với `cubic-bezier(.22,1,.36,1)`; morph `clip-path` từ capsule composer sang panel và ngược lại, vị trí tính từ DOM thực tế. Thu gọn composer về launcher 320ms; giữ backdrop blur/fade, overlap, micro-transition và hint đúng CSS/state reference. Không thay bằng fade/slide chung hoặc animation lặp liên tục.
3. Giữ cơ chế cuộn đến câu hỏi mới trong 300ms, nhường quyền khi wheel/touch/pointer; streaming/status không kéo người đang đọc xuống. Hint hiện lần đầu sau 5 giây, tồn tại 2,8 giây và lên lịch mỗi 22 giây theo reference, chỉ hiện khi trang visible; hủy timer khi trạng thái đổi/unmount. Reduced motion bỏ chuyển động/hint theo source.
4. Giữ Enter/gửi, chống gửi trùng, dừng request, retry, Escape/backdrop, focus khi mở và trả focus khi đóng, scroll lock/restore, draft và resume theo hành vi reference được kiểm tra. Đóng/đổi route/unmount phải hủy request, animation, timer và listener; phản hồi muộn không ghi vào hội thoại mới.
5. Homepage và public pages dùng composer; bài viết bắt đầu bằng launcher như reference. CRM không gắn composer công khai; hỗ trợ CRM dùng context/quyền riêng ở mục này. Ghi mapping route SatsunicGo → mode và kiểm thử điều hướng, back/forward, reset hội thoại. Không sao chép route Next.js vào React Router.
6. Port sang React + TypeScript + Vite/React Router; thay `next/link`, `next/image`, `next/navigation` bằng cơ chế tương ứng. Giữ behavior, CSS và visual tokens của component; backend vẫn là Genkit/Gemini Cloud Functions với quyền/quota SatsunicGo, không dùng endpoint hoặc dữ liệu HunpeoLabs.
7. Lập bảng parity từng state/control/motion: reference → implementation → test → screenshot/video → PASS/FAIL/BLOCKED_EXTERNAL/NOT_RUN. Đối chiếu cùng viewport 390px, 768px, 1440px, cùng nội dung fixture, theme và font; kiểm tra cả bàn phím mobile, safe-area, keyboard-only, reduced motion, mạng chậm, lỗi và thao tác đóng/mở nhanh. Visual screenshot không thay bằng chứng tương tác/motion. Mọi sai khác phải ghi rõ; chỉ kết luận giống 100% khi toàn bộ tiêu chí parity PASS.

### AI và nghiệp vụ SatsunicGo

Dùng một tích hợp Genkit/Gemini phía server cho composer công khai và hỗ trợ CRM có phân quyền. Chọn model đang được hỗ trợ theo tài liệu chính thức; không copy model ID lỗi thời. Streaming khi được hỗ trợ, có fallback và lỗi rõ khi không streaming được.

Placeholder: “Hỏi bất cứ điều gì… hoặc gửi tên/link sản phẩm”. Gợi ý: tìm sản phẩm, hiểu phí mua hộ, so membership, tạo nháp yêu cầu, kiểm tra đơn của mình, gặp hỗ trợ.

Khách chưa đăng nhập được hỏi thông tin công khai trong anonymous session có kiểm soát. Áp dụng App Check, quota phía server, giới hạn request, tổng mức sử dụng và chống lạm dụng. Dữ liệu đơn riêng/hành động kinh doanh cần đăng nhập Google. Không để model key không giới hạn trên frontend.

Câu trả lời về phí, chính sách, plan và catalog phải dựa dữ liệu đã duyệt/xuất bản. Có tham chiếu trang/nguồn và thời điểm cập nhật khi phù hợp. Câu hỏi chung được trả lời trong phạm vi an toàn; nói rõ khi chưa kiểm chứng giá, tồn kho hoặc thông tin hiện tại. Không giả model đang tìm trực tiếp toàn bộ website bán hàng.

Chỉ cấp các tool hẹp như searchPublishedProducts, getPublicFeePolicy, comparePlans, getMyOrderSummary, preparePurchaseRequestDraft. Mỗi tool kiểm tra danh tính, quyền, ownership, input và tập trường được trả về. Không tin customerId/orderId do model tự đưa ra như bằng chứng quyền truy cập.

Tên, URL, nội dung web, ảnh và tin nhắn đều không đáng tin cậy. Chặn prompt injection và rò dữ liệu khách khác. V1 không tự fetch URL tùy ý: lưu link tham khảo để nhân viên kiểm tra. Nếu bổ sung fetch metadata sau này, phải chặn địa chỉ mạng riêng/link-local/cloud metadata, redirect nguy hiểm, response quá lớn và request quá mức.

AI có thể chuẩn bị yêu cầu mua hoặc ticket; người dùng xem và xác nhận trước khi tạo hành động nghiệp vụ bền vững. AI không tự duyệt báo giá, sửa tiền, xác nhận paid, mua hàng, xuất gửi, cấp quyền, hoàn tiền hoặc xuất bản quảng bá khi chưa có hành động được ủy quyền tương ứng.

Chỉ lưu lịch sử chat cần thiết, có retention, lọc dữ liệu nhạy cảm khỏi log, giới hạn context/output và chuyển nhân viên bằng ticket thật. Model lỗi không được làm hỏng gửi yêu cầu hoặc thanh toán. Attachment cần upload/validation thật; không hiển thị microphone không hoạt động.

## 15. Schema và cách truy cập Firestore

Viết bảng schema/quyền/query ngắn trước triển khai và cập nhật theo code. Dùng collection/subcollection phù hợp, không bắt buộc mỗi danh từ là một collection riêng.

Các miền dữ liệu tham chiếu:

    users, addresses, staffAccess
    orders: items, quoteVersions, customerTimeline
    orderOperations, purchaseRecords, packages, consolidationBatches
    customerShipments, invoices, paymentTransactions, refunds, financialEntries
    membershipPlans, memberships
    products, posts, campaigns
    supportTickets/messages, internalNotes, notifications
    auditEvents, webhookReceipts, idempotencyKeys, outboxJobs, settings

Document khách đọc chỉ có thông tin được phép cho khách đó. Tách margin, receipt nhà cung cấp, ghi chú nhân viên, manifest lô, raw provider payload và private settings sang document/path bảo vệ riêng. Ẩn trường trên React không phải bảo mật.

Entity nghiệp vụ có thể sửa cần createdBy, createdDate, changedBy, changedDate, version; actor/time do server gán hoặc Rules xác minh chặt. Record bất biến giữ identity/time gốc. Báo giá đã chấp nhận, version hóa đơn, consent và địa chỉ giao là snapshot bất biến.

Firestore/Storage Rules mặc định deny. Có allowlist trường, ownership bất biến, kiểu dữ liệu hợp lệ, điều kiện cập nhật và query phù hợp quyền. Khách chỉ sửa profile an toàn, nháp hợp lệ và dữ liệu hỗ trợ được phép. Tiền, trạng thái có thẩm quyền, membership, quyền nhân viên và báo giá chính thức do server quản lý.

Dùng phân trang cursor, giới hạn số bản ghi, indexes trong repo, listener nhỏ theo màn hình đang mở, unsubscribe khi chuyển trang/đăng xuất. Không subscribe toàn bộ khách/đơn. V1 tìm chính xác/prefix theo dữ liệu phù hợp và nói rõ giới hạn, không giả full-text search. Tránh mảng không giới hạn và document đơn khổng lồ.

Dùng uniqueness/version guards nguyên tử cho nhận việc, tiền, nhận kho, đóng gói, cấp số chứng từ và chống lặp. Summary là dữ liệu dẫn xuất; có đối soát và quy trình sửa sai.

## 16. Bảo mật, quyền riêng tư và chính sách vận hành

Mọi command nhạy cảm phải xác thực và kiểm tra quyền trên hành động/tài nguyên cụ thể. Code dùng Admin SDK phải tự kiểm tra quyền; không mặc định Rules của client bảo vệ server. Webhook provider dùng cơ chế xác minh provider, không áp App Check của browser vào webhook.

Áp App Check cho bề mặt phù hợp, rate limits cho AI/public/upload, security headers, CSP tương thích OAuth, input/output validation, URL an toàn và service identity ít quyền. Không để secret trong git, frontend env, log, screenshot hoặc artifact build. Phân biệt Firebase client config với secret đặc quyền.

Tách public media khỏi receipt, địa chỉ, ảnh kiểm hàng và file hóa đơn riêng. Kiểm tra ownership, MIME/nội dung, kích thước/số lượng và tải file an toàn. Không phát long-lived public download token cho tài liệu riêng. Từ chối định dạng nội dung chủ động không cần thiết; sanitize hoặc cách ly upload trước hiển thị.

Audit gồm người thao tác, action, resource, correlation ID, kết quả, thời gian và thay đổi đã lọc nhạy cảm. Người dùng ứng dụng không được sửa/xóa lịch sử tài chính/audit. Không tuyên bố chống sửa tuyệt đối trước chủ project có quyền hạ tầng.

Có cấu hình hàng hạn chế và tuyến vận chuyển, đưa trường hợp chưa rõ vào human-review hold trước thu tiền/mua khi phù hợp. Không kết luận khả năng nhập khẩu, mức thuế, tính hợp pháp hoặc độ an toàn sản phẩm chỉ bằng AI.

Có version điều khoản/consent, marketing opt-in/unsubscribe, yêu cầu xuất/xóa dữ liệu và retention có ngoại lệ chứng từ cần lưu. Chính sách mẫu cần chủ doanh nghiệp/người có chuyên môn duyệt; không bịa nghĩa vụ pháp lý từng quốc gia hoặc tự chứng nhận compliance.

Không mua thật, thu tiền thật, hoàn tiền thật, gửi quảng bá ra ngoài, sửa/xóa production nguy hiểm, bật billing hoặc public launch khi chưa được chủ sở hữu ủy quyền rõ cho hành động/môi trường đó. Chuẩn bị và kiểm thử phần có thể làm mà không tự thực hiện hành động thực tế chưa được cho phép.

## 17. Độ tin cậy, thông báo và kiểm soát chi phí

Thay đổi nghiệp vụ có thẩm quyền nên commit cùng audit/timeline/outbox khi có thể. Trigger, job, webhook và phản hồi ngoài có thể lặp hoặc sai thứ tự. Không thiết kế dựa trên giả định exactly-once.

Dùng retry có giới hạn, operation ID bền vững, trạng thái job phục hồi được và màn hình ngoại lệ/dead-letter. Chỉ thêm scheduled work cần thiết: hết hạn báo giá, đối soát tiền, membership hết hạn/nhắc, follow-up quá hạn, xuất bản theo lịch và gửi lại thông báo. Không xây queue platform lớn.

Có thông báo trong ứng dụng và một email adapter thật dùng provider được ủy quyền hoặc SMTP đã cấu hình. Gửi báo giá, receipt cọc, yêu cầu duyệt thay đổi, số dư cần trả, tracking, membership sắp hết và phản hồi ticket. Chống gửi trùng, theo dõi queued/sent/failed. Email thất bại không đảo ngược giao dịch tiền đã xác nhận. Marketing cần consent riêng.

Lệnh tài chính và xuất gửi phải online và có phản hồi có thẩm quyền. Không optimistic “đã trả tiền” hoặc “đã gửi hàng”. UI offline/stale phải thể hiện thật; hạn chế lưu dữ liệu nhân viên nhạy cảm trên máy dùng chung. Xóa cache phù hợp khi đổi tài khoản/đăng xuất.

Tài liệu hóa điều kiện billing Blaze, region, chi phí reads/writes/storage/Functions/model/email theo giá chính thức và giả định lưu lượng thấp/cơ sở/cao. Thiết lập budget alerts, quota ứng dụng, concurrency/max instances có giới hạn và công tắc AI. Phân biệt cảnh báo với cơ chế chặn chi phí thực sự được hỗ trợ, không giả có hard cap chung cho cả project.

Không để lưu lượng AI làm nghẽn xác minh/đối soát thanh toán; không coi tắt billing toàn project là cách kiểm soát thường nhật. Backup Firestore và Storage riêng, có retention và test khôi phục ở môi trường cô lập, không phát lại tác động thanh toán thật.

## 18. Kiểm thử tự động và kiểm tra trên browser

Unit test tính tiền/tỷ giá/làm tròn, cọc/số dư, giảm giá, hết hạn quyền lợi, điều kiện status, phân bổ cước, số lượng một phần và giới hạn hoàn tiền. Dùng generated/property-style tests cho invariant phù hợp.

Kiểm thử Rules và server authorization với anonymous, hai khách khác nhau, từng vai trò, từng assignment, quyền bị thu hồi và tài khoản bị khóa. Gọi API trực tiếp trái quyền để test; không chỉ kiểm tra nút đã bị ẩn.

Các kịch bản bắt buộc:

1. Tên sản phẩm → nhân viên tìm/chốt/báo giá → khách chấp nhận → cọc 50% xác nhận → mua có bằng chứng → nhận/đóng gói → duyệt tổng cuối → trả số dư → xuất gửi → tracking → giao.
2. Tăng tổng cuối cần khách duyệt; ví dụ 2.000.000/1.000.000/2.160.000 VND ra số dư đúng.
3. Giảm giá, hết hàng, xử lý một phần, hủy, hoàn tiền đang chờ/hoàn tất và trả thừa không làm sai tiền.
4. Webhook lặp/giả, sai tiền/tiền tệ, trả trễ, timeout không rõ kết quả và reconciliation không ghi có hai lần.
5. Hai nhân viên mua/nhận kho/đóng gói/đối soát đồng thời không trùng việc hoặc vượt số lượng/số dư.
6. Kiện thiếu tiền/bị hold không thể xuất gửi kể cả trong lô gom; giao một kiện không hoàn tất đơn còn thiếu.
7. Khách A không đọc được đơn, file, hóa đơn, chat, dữ liệu lô hoặc AI context của khách B khi sửa ID/gọi API.
8. Khách không sửa role, membership, tỷ giá, tiền báo giá, trạng thái tiền hoặc giao hàng. Thu hồi quyền chặn lệnh nhạy cảm.
9. Mua/gia hạn/hết hạn membership và snapshot quyền lợi chạy đúng; giảm phí không vô tình giảm giá hàng.
10. CMS nháp/xuất bản/hẹn giờ/lưu trữ, metadata public, consent quảng bá, chuyển hỗ trợ và retry thông báo hoạt động với dữ liệu thật.
11. AI trả lời theo policy, chống injection, kiểm tra ownership, hết quota, lỗi model và yêu cầu xác nhận trước tạo yêu cầu.
12. Google One Tap fallback, mobile login, logout, quay lại, refresh, mạng chậm và bản nháp hoạt động đúng.

Kiểm tra browser khoảng 390px, 768px, 1440px; xem screenshot và thao tác thật bằng bàn phím. Kiểm tra label, focus, contrast, dialog, bảng và trạng thái lỗi. Composer phải đúng kiểu dài căn giữa ở đáy, không che hành động giao dịch. Test chức năng không thay kiểm tra trực quan.

Dùng emulator và fixture xác định được cho local/CI. Phân biệt provider giả phục vụ contract test với provider thật đã kiểm chứng. OAuth, payment, email, AI, carrier thật cần bằng chứng riêng; thiếu credentials phải BLOCKED_EXTERNAL, không đánh dấu PASS.

Không seed khách/đơn/receipt/paid giả lên production. Dữ liệu demo chỉ ở emulator/dev; script seed/reset phải chặn môi trường production.

## 19. Triển khai, tài liệu và điều kiện launch

Cung cấp local setup tái lập được, env example không secret, lệnh emulator, seed/reset chỉ dev, typecheck/lint/test/build, Firebase config, indexes, Rules, Hosting rewrites/headers và bootstrap theo nguyên tắc ít quyền.

Tách Firebase resources/credentials dev-staging và production. CI chạy clean install, kiểm tra, test và build. Preview không trỏ production data. Ưu tiên deployment credentials ngắn hạn khi hỗ trợ. Deploy production cần môi trường được bảo vệ/phê duyệt và xác định đúng project.

Chuẩn bị smoke test, rollback, schema changes tương thích, đăng ký webhook, đối soát giao dịch đang chờ, thiết lập owner/staff, domain/HTTPS, Google origins/domains, rollout App Check, xác minh email sender, model access, monitoring và backup/restore.

Tối thiểu có:

    docs/REQUIREMENTS_MATRIX.md
    docs/PRODUCT_AND_WORKFLOWS.md
    docs/ARCHITECTURE_AND_DATA.md
    docs/PERMISSIONS_AND_SECURITY.md
    docs/PRICING_PAYMENTS_AND_RECONCILIATION.md
    docs/OPERATIONS_RUNBOOK.md
    docs/DEPLOYMENT_AND_ROLLBACK.md
    docs/TEST_EVIDENCE.md
    docs/PRODUCTION_READINESS.md
    docs/EXTERNAL_SETUP_REQUIRED.md

Tài liệu ngắn gọn, đúng implementation, có lệnh thật, đường dẫn thật, kết quả test, môi trường, quyết định chưa chốt và bằng chứng. Không viết tài liệu như quảng cáo chức năng chưa tồn tại.

Launch blockers gồm thiếu xác minh tiền, sai cách ly khách/phân quyền, chính sách phí/hoàn tiền chưa duyệt, khoản phí bắt buộc chưa xác định, sửa tiền không audit, thiếu credentials bắt buộc, chưa test chặn xuất gửi và chưa có smoke evidence production. Phân biệt rõ vận hành thủ công có kiểm soát với tích hợp tự động chưa khả dụng.

## 20. Thứ tự thực hiện và báo cáo cuối

Thực hiện liên tục theo thứ tự:

A. Nền tảng: khảo sát repo, bảng yêu cầu, schema/quyền tối thiểu, design tokens, emulator, auth và app shells.
B. Luồng giao dịch hoàn chỉnh: yêu cầu → báo giá → duyệt → cọc → mua → nhận/đóng gói → số dư → xuất gửi → tracking, gồm ngoại lệ và đối soát.
C. Membership, tiện ích khách kinh doanh, gom kiện, hỗ trợ, CRM khách hàng và dashboard vận hành.
D. Sản phẩm/bài viết/quảng bá, SEO/xuất bản, thông báo và composer AI fixed dưới trang chủ.
E. Rà bảo mật/lạm dụng, test failure paths, sửa browser/visual, triển khai, xác minh restore/rollback và đánh giá launch.

Đây là thứ tự triển khai, không phải quyền bỏ các phần sau. Mỗi phần phải có UI, dữ liệu bền vững, server command, quyền, validation, lỗi, test và tài liệu trước khi gọi là hoàn thành.

Lặp: inspect → implement → test → tái hiện lỗi → sửa → regression test → ghi bằng chứng. Không kết thúc bằng “bạn nên triển khai” đối với việc có thể thực hiện trong môi trường hiện tại. Thiếu quyền bên ngoài thì hoàn thiện phần độc lập, khóa đường chưa xác minh và ghi rõ còn thiếu gì.

Báo cáo cuối phải nêu phạm vi đã làm, file thay đổi, lệnh kiểm tra/kết quả, browser evidence, chế độ tích hợp và trạng thái xác minh, phát hiện bảo mật/tài chính, bước cấu hình, production target/artifact identity nếu có, blockers và hành động tiếp theo chính xác của chủ dự án.

Tách nhãn IMPLEMENTATION_COMPLETE, VERIFIED_IN_STAGING, READY_FOR_LIVE_TRANSACTIONS. Chỉ dùng nhãn cuối khi mọi điều kiện kỹ thuật, dịch vụ ngoài và chính sách vận hành được chủ sở hữu duyệt có bằng chứng. Nếu chưa đủ, ghi NOT_READY cùng blocker cụ thể.

BẮT ĐẦU NGAY: khảo sát repository và ảnh tham chiếu, tạo requirements matrix, triển khai nền tảng rồi hoàn thành luồng giao dịch đầu tiên. Tiếp tục toàn bộ phạm vi. Không chỉ biến prompt này thành một bản kế hoạch rồi dừng.
