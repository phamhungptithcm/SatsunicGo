# Ask · Nội dung và quyết định nghiệp vụ

Đề xuất để chủ doanh nghiệp review một lần. Root tổng hợp từ handoff BA/Product; BA chỉ đọc source, không chạy tests hay thao tác dữ liệu. Chưa duyệt corpus, retention, layout hoặc production. Bản vá parser và cleanup hold đã áp dụng cục bộ, không cần duyệt lại.

## Knowledge để duyệt

Đề xuất một tài liệu tiếng Việt, dùng đúng nội dung hiện có trong `packages/domain/public-content.ts`:

**Điều khoản mua hộ**

### Sản phẩm trong danh mục

Bạn thanh toán toàn bộ theo giá niêm yết.

### Sản phẩm ngoài danh mục

Bạn gửi yêu cầu, xem và đồng ý với báo giá trước khi thanh toán. Khoản thanh toán được chia thành hai đợt theo báo giá.

### Đổi trả, hủy đơn và hoàn tiền

Các điều kiện này chưa được duyệt. SatsunicGo cần hoàn tất và công bố điều khoản trước khi nhận giao dịch thực tế.

Việc duyệt nội dung hạn chế này cho phép Ask trích dẫn các ý trên. Nó không tạo điều kiện hoàn tiền, phí, ETA, eligibility hay quyền thu tiền mới. Nguồn công khai `/terms` chưa tự động là corpus được duyệt cho Ask. Source phải là resource thật trong `posts` hoặc `blogPublished` theo workflow hiện có.

| Trường admission | Đề xuất / cách lấy | Trạng thái |
| --- | --- | --- |
| Nội dung | Ba phần trên, owner xác nhận hoặc sửa | PENDING |
| language | vi; không suy approval en | PENDING |
| source / sourceId / slug | Chọn publication thật, không tạo ID từ static page | UNSET |
| documentId | post:<slug thật>, từ source chuẩn hóa | UNSET |
| contentHash / expectedVersion | Authenticated askKnowledgePreview trả về | UNSET |
| effectiveFrom / effectiveTo | Epoch milliseconds, owner chốt thời hạn | UNSET |
| reviewedBy / reviewedAt | Server ghi từ người thực thi | Không tự điền |

Thực thi sau khi được duyệt: publication qua `workspaceCommand/saveContent` cho posts hoặc Blog Studio cho blogPublished; không ghi trực tiếp projection. OWNER active/unlocked, verified Google identity, MFA gần đây dùng `askKnowledgePreview`, kiểm tra toàn bộ body/published/hash/version; `askKnowledgeCommand/approve` bind đúng resource/hash/version/locale/effective times và operationId thật. Readback phải `active=true` và đúng hash; `approved=true` riêng lẻ không đủ. Source sửa, bỏ xuất bản, thu hồi, hết hạn hoặc sai locale phải mất admission cũ. Kết quả chưa rõ phải đối chiếu cùng operation, không blind retry bằng identity mới.

## Feedback để duyệt

Đề xuất giữ **loại góp ý và tham chiếu câu trả lời trong30ngày**, tính từ server nhận góp ý. Đây là đề xuất đang chờ; không phải30ngày cho toàn bộ chat, đơn hàng, chứng từ hoặc backup. Tham chiếu vẫn liên kết hội thoại, nên không gọi là dữ liệu ẩn danh.

Settings schema hiện có chỉ nhận `{enabled, version, retentionDays, expiresAt}`; retentionDays từ1đến90. Human approval giữ trong hồ sơ riêng; không thêm approved/reviewedBy/approvedAt vào schema. Cần owner chốt số ngày, policy version/expiry, người vận hành và môi trường. Bật nhận feedback, publish privacy và cho phép cleanup là các quyết định có hậu quả riêng.

`askFeedbackPolicy` trả policy còn hiệu lực; UI hiển thị ngày từ server. Thiếu/disabled/expired policy thì unavailable. `askFeedback` kiểm tra consent, owner, answer reference, conversation/answer/policy version, timestamp, quota và operation identity. Không lưu thêm question/answer/contact/address/free-text vào feedback record.

`askFeedbackWithdraw` chỉ thuộc namespace người hiện tại, ghi tombstone tối thiểu để chặn submit đến muộn. Inbox/review không dùng record withdrawn/hết hạn. Source cleanup tối đa100records/collection/lượt, update-time precondition, lịch mỗi60phút và retryCount0. Bản vá release hiện giữ cleanup ngoài package; điều đó không tắt scheduler đã deploy.

Đường cấu hình có quyền chưa được xác lập trong source đã đọc; client Firestore writes bị chặn. Không invent callable bật feedback. Chưa cam kết mọi bản sao bị xóa đúng ngày30: cần evidence về lịch thực, backlog, backup và thời hạn xóa vật lý trước công bố.

## Learning từ feedback

Luồng đề xuất: góp ý → OWNER xem xét → đề xuất sửa hướng dẫn → owner duyệt nội dung → publication → preview/approve revision mới → retrieval và answer acceptance → reviewer → rollout được phép.

`askFeedbackInbox`/`askFeedbackReview` yêu cầu OWNER verified, active/unlocked và MFA gần đây. Disposition `acknowledged`, `needs_source_review`, `resolved` không tự sửa source/prompt/model. `resolved` phải bind source version/hash còn active; trạng thái đó không chứng minh câu trả lời đã được sửa hoặc triển khai.

`askFeedbackEvaluation` dùng holdout được duyệt theo locale, tối đa20nguồn. Holdout cần version, approved, expiresAt, unique case IDs, question và expected documentId/requiredText thật. Nó kiểm tra retrieval IDs/text, không chấm LLM hay command success. Pass vẫn `REVIEW_REQUIRED`, `automaticPromotion=false`. Comparator baseline/candidate cũng không tự tạo điểm; unsafe/regression bị REJECTED. Fine-tuning hoặc tự promote model cần scope riêng, chưa thuộc các command này.

## Chunking và context

Hiện có: excerpt tối đa1.200ký tự, ưu tiên đoạn/dòng/câu, overlap khoảng160ký tự cho phần dài; normalized Vietnamese/case, typo một edit cho từ≥5ký tự, bảo vệ số và spelling mơ hồ. Đây là ký tự, không phải tokens.

Retrieval mặc định8excerpts, tối đa2span/source, giới hạn12.000ký tự. Customer guidance answer thực tế dùng maximum4 và bound JSON12.000UTF-8bytes. Holdout evaluator dùng8; điểm của nó không chứng minh customer answer đã chứa đủ ý.

`packAskContext` giữ instruction/question/task/currentFacts, bỏ recentTurns rồi evidence nếu quá budget và fail nếu phần bắt buộc vẫn quá lớn; provider exact counter phải được admit. Có utility không chứng minh mọi caller/live provider đã dùng đúng. [Kế hoạch context và nghiệm thu](KNOWLEDGE-CONTEXT-PLAN.md) xác định phần còn cần nối và kiểm chứng.

## Oracle để duyệt cùng corpus

12câu KP01–KP12 trong `continuation-2/KNOWLEDGE-CASES-r1.json` giữ nguyên câu hỏi/expected: catalog full payment, custom request/quote/two stages, research không đặt/thu tiền, refund còn chờ, policy feedback API, injection, VI/EN admission, private order, không dấu, typo, sửa tiền đề catalog phải cọc, và research price không phải staff quote. Đây là synthetic candidates, chưa phải approved executable holdout hoặc live PASS.

Bad cases bắt buộc: unpublished/sửa body/stale version/revoke/expiry/sai locale, thiếu OWNER/MFA/locked, policy/answer version đổi, consent=false, withdrawn/hết hạn, unknown outcome, account/tab switch, thiếu context, corpus vượt giới hạn. Tách retrieval-only score khỏi answer semantics và command authorization. Contextual “yes/đồng ý” rộng vẫn thuộc layout/behavior proposal; không coi mọi cách nói là command hiện đã hỗ trợ.

## Chính sách còn thiếu

| Nội dung | Việc owner cần chốt |
| --- | --- |
| Đổi trả/hủy/hoàn tiền | Điều kiện, ngoại lệ, phí, thời hạn thật trước giao dịch |
| Phạm vi dịch vụ/hàng hạn chế | Nguồn chính thức; research không tạo eligibility |
| Giá/phí/termsVersion | Theo domain snapshot hiện hành, không lấy từ chunks |
| Giao hàng | Cam kết có căn cứ; không invent ETA |
| Privacy/pháp nhân/liên hệ | Chat, đơn, chứng từ, feedback, backup có phạm vi riêng |
| Membership | Public source còn pending; không coi hướng dẫn là mở bán/quyền lợi |
| Layout/action window | Review thiết kế hiện có và bản xem r2 đã sửa |

Duyệt tài liệu hướng dẫn hạn chế không giải quyết các điều kiện này. Packet không cung cấp điều khoản pháp lý thay chủ doanh nghiệp.

## Live acceptance

Bind mọi receipt với candidate/source hash, môi trường, tài khoản thử được phép và readback. Kiểm tra corpus/locale/MFA/AppCheck, answer/citations, private-state fences, snapshot/quote revisions, idempotency, reload/unknown outcome. Catalog dùng server price và full payment; custom submit chỉ gửi yêu cầu, acceptQuote không thu tiền; chỉ provider event/readback xác nhận paid. Nhận một phần không suy thành hoàn tất nhận toàn bộ. Các release holds hiện có cần quyết định triển khai riêng.

Gemini50.000₫ còn reserved toàn bộ; actual billed cost Unavailable. Không release dự phòng hoặc gọi thêm từ packet. [Kế hoạch live và phát hành](LIVE-RELEASE-PLAN.md) giữ riêng provider, payment, source binding, cleanup/backups và rollout.

Đây là bản tổng hợp nguồn để quyết định, không phải formal QA/Product Language PASS hay production READY. Các trường UNSET phải lấy từ resource/cấu hình thật; không tự điền để làm gate xanh.
