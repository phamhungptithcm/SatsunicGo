# Ask · Tích hợp panel

Bổ sung kế hoạch để review; chưa sửa ứng dụng. Frontend specialist đọc source, root đối chiếu các đường quan trọng. Năm mục dưới đây là khoảng trống của kế hoạch tích hợp, không phải năm bug đã được kiểm thử runtime. Giữ phạm vi first slice của DESIGN-PLAN ban đầu; không mở chat confirmation cho Profile/Membership trong slice này.

## Giữ bản nháp nhưng không giữ quyền cũ

CommercePanelContext hiện có key theo UID, conversation, order/version và auth epoch. Giữ chốt này cho command child/callback; không bỏ key để tránh mất form. Draft view có owner riêng theo UID, conversation và task/target identity; có revision cục bộ. Trong cùng identity, đổi view không unmount draft. Account hoặc conversation thay đổi thì dừng hiển thị dữ liệu cũ, hủy authority và xóa view draft trong phiên; A→B→A không phục hồi consent hoặc callback cũ. Không lưu dữ liệu riêng tư vào transcript, LLM hay localStorage mới.

Order version thay đổi trong cùng target làm preview hết hiệu lực. Giữ phần người dùng đang sửa dưới trạng thái chưa lưu và đối chiếu server snapshot; không tự ghi đè dirty fields hoặc coi chúng đã được lưu. Recipient chỉ verified sau save/readback khớp đúng identity/revision. ACK muộn không xác nhận draft mới.

## Một đường admission ở thời điểm thực thi

Button, named chat command và contextual yes/no đi qua một handler; không gọi trực tiếp các nhánh catalogCheckout/customerChatAction cũ để né preview. Preview bất biến bind owner/CID/auth epoch/target/action/payload hash/local revision/conversation and order versions/expiry/history. Khi job vào queue thực thi, kiểm tra lại toàn bộ binding và synchronous readiness rồi consume đúng một lần trước dispatch. Server vẫn giữ expectedVersion và operation UUID hiện có; không tin UI thay server.

Commerce.resolved có thể saveDraft/saveTurn qua cùng mutation queue. Ordinary answered turn làm conversation version thay đổi phải invalidate preview; chỉ tạo bản kiểm tra mới sau ACK/readback ổn định. Không rebase một consent cũ sang version mới. Confirmation handler phải admission/consume trước dispatch của chính action, không đưa message xác nhận qua generic answered-turn persistence trước action. Transcript persistence của kết quả xảy ra sau outcome theo đường đã được review; lỗi lưu transcript không tạo action hoặc retry mới. Cần trace toàn bộ caller và test queue khi freeze patch; nếu cần đổi command/server contract thì dừng ở delta-impact riêng.

Preview chỉ hiển thị sau save/readback cần thiết đã xác nhận. Mở review không phải gửi tác vụ. Bản kiểm tra bị đóng cần mở lại trước contextual confirmation, như r3 prototype. Mixed edit+approve chỉ sửa draft hợp lệ và yêu cầu review lại; dispatch bằng 0.

## Pending và đổi tác vụ

ActionWindow có trạng thái editing, reviewing, executing, unknown, verified result. Shared task-switch admission nhận cả commerce và dedicated account pending. Khi executing/unknown, không mở một mutation xung đột; vẫn cho đọc hội thoại và xem recovery. Back/Later/Escape chỉ đổi view, không cancel tác vụ đã gửi hoặc xóa pending identity. “Chưa gửi” chỉ bỏ preview chưa dispatch; sau dispatch phải mô tả đúng trạng thái đang đối chiếu. Membership invoice chưa rõ không được bỏ qua để bắt đầu mutation khác.

Unknown giữ đúng operation identity/envelope theo recovery hiện có, dùng readback trước retry. Không thêm private contact vào pending persistence. Reload, account switch và tab khác không chuyển ownership của envelope; scope của UID/CID cũ không được chạy trong scope mới.

## Lịch sử chỉ để đọc

History mode truyền rõ xuống mọi embedded selection, retry, feedback và form/command handler, không suy current authority từ latest numerical turn. Waypoint tới turn mới nhất vẫn là history nếu chưa return current task. History và đổi locale không phục hồi consent. Nếu người dùng muốn action liên quan nội dung cũ, trước hết trở về tác vụ hiện tại, đọc state mới và tạo preview mới. Bản xem lịch sử không reseed transcript, không thay draft hoặc operation.

## Focus và vùng cuộn

ActionWindow là region nonmodal có tên trong outer Ask dialog hiện có; transcript role=log chỉ chứa hội thoại. Giữ một chuỗi height/min-height:0 có giới hạn, một scroller cho transcript và một scroller cho form. Không giữ thêm scroller55dvh của account form lồng bên trong nếu gây cuộn lồng; thay đổi phải ở wrapper được duyệt, không đổi form domain behavior.

Trên mobile, vùng không hoạt động dùng hidden/inert thật và không nằm trong tab order. Giữ mount của draft cùng identity. Đổi view chuyển focus tới action heading hoặc composer/trigger hợp lệ; Escape từ tác vụ về chat trước, chỉ đóng outer dialog theo hierarchy hiện có. Không tự kéo transcript xuống khi khách đang xem history hoặc task view; trở về giữ reading position. Shell locale đổi nhưng child form tiếng Việt hiện có vẫn lang=vi, không giả đã dịch toàn bộ.

## Scenarios phải chạy trên ứng dụng

| ID | Happy / bad case | Oracle |
| --- | --- | --- |
| PI01 | Dirty recipient, order revision, delayed save ACK | Draft chưa lưu được giữ đúng owner; preview/recipient readiness mất hiệu lực; ACK cũ không pass |
| PI02 | UID A→B→A; đổi CID rồi trở lại | Không leak fields/consent/callback; operation recovery không chạy sai owner |
| PI03 | Review → ordinary answer/saveTurn → yes | Preview cũ hết hiệu lực; không dispatch trước review mới |
| PI04 | Confirmation queue sau version advance; button/chat đồng thời | Admission ở trong job; tối đa một dispatch hợp lệ, không rebasing consent |
| PI05 | Chat sửa quantity/variant rồi đồng ý trong cùng câu | Cập nhật draft hợp lệ; dispatch0; giữ notes và private form scope |
| PI06 | Unknown commerce → mở profile; unknown membership → custom task | Không mutation xung đột; recovery còn hiển thị và đúng identity |
| PI07 | Close/Later/Escape/reopen/reload lúc executing/unknown | Chỉ đổi view; không claim cancel/success hoặc retry identity mới |
| PI08 | History tới latest turn, locale switch, embedded selection/retry/feedback/yes | Dispatch0 đến khi return current và admission mới |
| PI09 | Form dài,320/390/desktop, keyboard task↔chat | Không page overflow/scroll lồng sai/focus ẩn; composer/footer tiếp cận được |
| PI10 | New answer trong lúc đọc history, đổi locale | Reading position/draft/task được giữ; không reseed transcript |

Native zoom, AT audio, IME, mobile keyboard và browser/device khác cần receipt riêng. Performance dùng measurements thật cùng candidate: warm interaction p95≤100ms, không long task lặp lại do Ask>50ms là budgets đề xuất, chưa đo. Local prototype144/144 không thay các assertions ứng dụng này.

Source anchors: Ask.tsx:1113/1493/2299; Commerce.tsx:455/588/803; CatalogChat.tsx:37; CatalogSearch.tsx:37/163/192; CustomerWorkspace.tsx:21/35/55/83; Ask.module.css:137/192; customer-workspace.css:1. Hash các file nguồn nằm trong diagnostic freeze và frontend source receipt; không có application source thay đổi trong addendum.
