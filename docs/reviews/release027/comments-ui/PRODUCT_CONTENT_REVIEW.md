# Product content review — comments parity

Decision: BLOCKED pending root native in-context evidence. Target: responsive web, Vietnamese, public article readers. Source: HunpeoLabs Comments exact mechanics/layout adapted to Go callable/Google/manual-review policy. Apple principles are a web quality reference; no Apple platform-compliance claim.

## Complete changed string inventory

### Default

- Bình luận
- Mới nhất trước
- Tên hiển thị công khai
- Bình luận (tối đa 2.000 ký tự)
- Viết bình luận…
- Tối đa 2.000 ký tự.
- Gửi bình luận để duyệt
- Đăng nhập để bình luận
- Bình luận được duyệt trước khi đăng. Không gửi thông tin đơn hàng, số điện thoại hoặc chứng từ công khai.

### Reply

- Đang trả lời bình luận
- Hủy trả lời
- Trả lời
- Xem trả lời
- Xem thêm trả lời
- Chưa có trả lời.

### Own

- Bình luận của bạn ({count})
- Sửa
- Xóa
- Đã đăng
- Chờ duyệt
- Đã ẩn
- Không được duyệt
- Đã xóa
- Chưa xác định
- Nội dung đã xóa

### Public

- Bình luận được chia sẻ
- Liên kết
- Báo cáo
- Biên tập viên
- Tác giả
- Bình luận đã xóa
- Chưa có bình luận. Bạn nghĩ sao về bài viết?
- Bài viết này đã đóng bình luận.
- Xem thêm bình luận

### Loading

- Đang tải bình luận…
- Đang tải…
- Đang gửi…

### Failure

- Chưa tải được bình luận. Thử tải lại.
- Tải lại bình luận
- Chưa đăng nhập được. Thử lại sau.
- Chưa tải được trả lời.
- Thử lại
- Cần gửi lại thao tác đang chờ để đối chiếu kết quả.
- Bình luận đã thay đổi. Tải lại trước khi sửa hoặc xóa.
- Bạn gửi quá nhanh. Chờ một lúc rồi thử lại.
- Thao tác chưa hoàn tất. Nội dung của bạn vẫn được giữ lại.
- Chưa nhận được kết quả. Nội dung vẫn được giữ lại; thử lại nguyên thao tác để đối chiếu.
- Chưa xác nhận được kết quả của thao tác trước.
- Thử lại thao tác đang chờ

### Dialogs

- Sửa bình luận
- Bản sửa sẽ được duyệt trước khi đăng.
- Nội dung bình luận
- Gửi bản sửa để duyệt
- Xóa bình luận này?
- Nội dung bình luận sẽ bị xóa. Các trả lời có thể vẫn hiển thị bên dưới thông báo đã xóa.
- Xác nhận xóa
- Báo cáo bình luận
- Giúp giữ cuộc trò chuyện tôn trọng mọi người.
- Lý do báo cáo
- Gửi báo cáo
- Đóng

### Durable success

- Đã gửi bình luận, đang chờ duyệt trước khi hiển thị công khai.
- Đã gửi bản sửa để duyệt.
- Đã xóa bình luận.
- Đã gửi báo cáo.

### Shared toast accessibility

- Ẩn thông báo
- Đếm ngược đang tạm dừng
- Tự ẩn thông báo

## Meaning and state coverage

Authoritative count comes from the server; unloaded count is blank, never invented zero. Newest-first explicitly requests server descending order. Dates use vi-VN dates and ISO datetime attributes; count means backend public discussion count. User name is explicitly public, never read from private profile. Own rows only come from current authenticated backend projection. Send/edit success means submitted for manual review, not published. Delete requires native dialog and preserves replies; report confirms only successful backend result. Unknown writes preserve operation ID and original payload and block conflicting writes. Terminal errors retain draft and allow correction. Login errors, closed comments, empty threads, pagination, stale revision, rate limit and loading all have distinct messages.

## Mandatory principles

| Principle | Status | Evidence |
|---|---|---|
| Purpose | NOT_RUN | Source implementation places composer and discussion in one section; rendered task verification pending. |
| Agency | NOT_RUN | Reply cancellation, dialog close, explicit delete confirmation, retry original operation; keyboard verification pending. |
| Responsibility | NOT_RUN | Public-name label/privacy note, manual review and tombstone consequences are explicit; native verification pending. |
| Familiarity | NOT_RUN | Source discussion/thread/dialog/toast patterns retained; native verification pending. |
| Flexibility | NOT_RUN | Persistent labels, wrapped actions, vi-VN dates and textarea; narrow/zoom/focus evidence pending. |
| Simplicity | NOT_RUN | One composer, collapsed own comments, lazy thread loading; interaction evidence pending. |
| Craft | NOT_RUN | Count/null semantics, auth generations, race cleanup, retry identity inspected; native state coverage pending. |
| Delight | NOT_RUN | Source pausable toast and reduced-motion styles, non-disruptive focus; native proof pending. |

## Validation and limits

Targeted lint PASS. Pure retry/hash/status tests 3 PASS. Native rendered UI, keyboard/focus, screen-reader, 390/768/1440 screenshots, bad-network and account-switch race: NOT_RUN in this worker. Root owns native runner and runtime evidence. This is not 100% parity certification or production-readiness evidence.
