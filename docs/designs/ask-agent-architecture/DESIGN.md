# SatsunicGo — Ask & Customer Intelligence

Ngày: 2026-10-07. Trạng thái: **DESIGN PROPOSAL — chưa triển khai**.
Source baseline: `700317e226f2a14c163fbbdd176a8d9c654e19f1`.

## Mục tiêu và phạm vi

Học cách phân lớp, biểu diễn quyền và vòng gọi công cụ của hình tham khảo; thiết kế lại theo nghiệp vụ, Firebase/Firestore và luồng Ask thực tế của SatsunicGo. Không sao chép tên công cụ, số lượng công cụ, Postgres, tenant/company hay ngưỡng compaction từ hình. Ask Anything phục vụ hỏi đáp trong phạm vi SatsunicGo; không có nghĩa là AI được thực hiện mọi thao tác.

Deliverables: bản vẽ SVG có thể phóng to, HTML xem độc lập, tài liệu kiến trúc và sơ đồ Mermaid để sửa tiếp. Chỉ tạo tài liệu; không chỉnh app, rules, dữ liệu, cấu hình runtime hoặc bật provider.

## Đọc hình tham khảo

Hình có sáu ý chính: giao diện gửi một run; runner dựng context; model trả lời hoặc yêu cầu tool; permission gate kiểm tra; tool result quay về runner; history/memory/audit nằm ngoài model. Compaction giữ context trong giới hạn. Provider adapter tách model khỏi nghiệp vụ.

Các điểm cần làm rõ khi áp dụng: quyền phải kiểm tra lại trong từng tool backend, không chỉ một gate bên ngoài; approval cần gắn với payload và phiên bản; retry phải đối chiếu kết quả cũ; audit không làm cho mọi giao dịch có thể revert; parallel chỉ áp dụng cho đọc độc lập. Summary không được trở thành bằng chứng thanh toán hoặc nguồn cấp quyền. Ngưỡng 50/70/90% là lựa chọn trong hình, không phải thông số đã chứng minh phù hợp với SatsunicGo.

## Hiện trạng xác minh trực tiếp

| Bề mặt | Điều đã thấy trong source | Giới hạn |
|---|---|---|
| `src/features/ask/Ask.tsx` | Luồng tra cứu, catalog, phí, tracking, shipping và commerce; fence UID/conversation/generation; câu hỏi nhiều ý đọc có giới hạn | Chưa phải một server runner tổng quát |
| `packages/domain/ask-read-task-plan.ts` | Allowlist tracking/catalog/fees/membership; tối đa 4 task; concurrency mặc định 2; snapshot, dedup, abort, partial unavailable | Policy và adapter còn phải được bảo vệ tại backend |
| `functions/src/ai/ask.ts` | Callable App Check ngoài emulator; auth; context đơn theo owner; Genkit/Vertex; 6 tool đọc/nháp; maxTurns 4 và tối đa 4 tool invocation; output schema, citation allowlist | Nhánh provider không chạy qua paid gate hiện tại; không khẳng định đã kiểm chứng model/cloud |
| `functions/src/ai/ask-paid-gate.ts` | Luôn từ chối paid generation, kể cả policy pilot hợp lệ | Không thể bật chỉ bằng đổi settings |
| `functions/src/ai/knowledge-retrieval.ts`, `docs/ASK_KNOWLEDGE.md` | Retrieval lexical có giới hạn, chỉ nội dung published | Không phải vector search; published không chứng minh có approval riêng; không thấy match không chứng minh corpus không có |
| `functions/src/ai/ask-workflow.ts` | Owner, account lock, expectedVersion/orderVersion, operationId + payload hash, pending/resume, feature gate | Không phải capability engine tổng quát |
| `functions/src/index.ts`, `catalog-checkout.ts` | Domain command, role/owner, state transition; outboxJobs | Domain giữ quyền ghi nghiệp vụ |
| `functions/src/payments/payos.ts` | SDK verify webhook, receipt dedup, transaction, timeline/outbox | Source không chứng minh provider production hoạt động |
| `firestore.rules` | Owner-scoped read, nhiều đường write bị cấm cho client | Admin SDK backend vẫn cần tự kiểm tra quyền |
| Search `analytics/behavior/trackEvent` trong src/functions/domain | Chưa tìm thấy pipeline phân tích hành vi chuyên biệt trong phạm vi đọc | Không tuyên bố đã audit toàn repo hoặc hệ thống ngoài repo |

Repository Intelligence: refresh một lần; CodeGraph current/health pass, query xác minh askWorkflow và paid gate. CocoIndex stale/health failed sau refresh; **DEGRADED**. Graph có bản sao dưới output; chỉ dùng kết quả thuộc source chính. Bằng chứng còn lại: bounded rg, đọc domain/callers/backend/rules/spec/tests. Tài liệu spec cũ có câu “No application exists” đã lỗi thời so với source hiện tại, không dùng làm hiện trạng.

## Kiến trúc mục tiêu

1. **Channel và gateway.** Giữ UI hiện có. Client gửi requestId/runId, câu hỏi, ngôn ngữ và context reference; UID/role không lấy từ lời model hoặc request body. Public answer chỉ dùng nguồn public; private lookup/commerce bắt buộc auth và ownership. App Check, schema, quota và account lock kiểm tra ở server. UI dùng generation fence khi đổi tài khoản/conversation.
2. **Router tại server.** Phân loại read / clarify / draft / confirmed action / support. Trả lời bằng domain/tool khi đủ bằng chứng; chỉ dùng model để giải thích hoặc xử lý ngôn ngữ khi paid readiness và ngân sách được chứng minh. Tách thao tác tiền/xác nhận khỏi câu hỏi nhiều ý. Policy candidate `ask-hybrid-policy.ts` không đồng nghĩa đã được nối vào server.
3. **Context builder.** Public knowledge + projection riêng đúng owner + draft + các lượt cần thiết. Mỗi evidence có sourceId, observedAt, version, coverage và phạm vi truy cập. Không đưa toàn bộ CRM, địa chỉ, receipt hoặc transcript vào model. Ảnh là input tạm và không đáng tin; không chứng minh giá, tồn kho hoặc thanh toán.
4. **Runner có giới hạn.** State machine: admitted → routing → reading/generating → waiting_confirmation hoặc completed/partial/failed/cancelled. Timeout, max steps, token/cost reservation, cancellation và circuit breaker thuộc server. Không bắt đầu bằng fleet subagent; mở rộng specialist sau khi có use case, hợp đồng I/O và eval.
5. **Tool policy và registry.** Mỗi tool khai báo input/output schema, read/draft/write/external, required capability, field projection, timeout, idempotency và audit policy. Allowlist tối thiểu; load theo nhóm nghiệp vụ. Authorize trước I/O và kiểm tra lại ngay khi thực thi. Đọc độc lập có thể parallel với giới hạn; ghi một đơn phải serialize. Không cho arbitrary URL/SQL/Firestore path.
6. **Xác nhận và command bus.** Model chỉ trả candidate; UI hiện hành cho khách review. Approval gắn actor + action + orderId + expectedVersion + payloadHash + expiry + operationId; backend đọc lại và từ chối nếu version/quyền thay đổi. Khách xác nhận không thay thế approval của staff/provider. Giao dịch chỉ hoàn tất từ domain state và nguồn có thẩm quyền.
7. **Provider adapter.** Bắt đầu với Genkit/Vertex đang có; provider khác là option tương lai, không cần xây đồng thời. Adapter chuẩn hóa schema, cancellation, usage, billed tokens/chi phí, latency, error. Không tự fallback sang nhà cung cấp khác khi chưa duyệt dữ liệu/region/cost. Paid gate chỉ được mở bằng kế hoạch riêng, live eval và cost enforcement kiểm chứng.
8. **State, memory, audit.** Conversation và operation ledger giữ trạng thái thật. Long-term preference memory là opt-in, sửa/xóa được, có scope/provenance/TTL; không trộn khách và staff. Audit lưu metadata tối thiểu, tránh raw prompt/PII. Memory preference không có quyền thay đổi giá, entitlement hoặc state.

## Compaction chặt chẽ

Hiện workflow giữ tối đa 24 turns; UI và input có giới hạn history riêng. Chưa thấy pipeline clear/summarize/drop như hình. Thiết kế mới đo token của toàn bộ serialized input và chừa output/tool budget. Bỏ tool result cũ sau khi giữ source reference; summarize nội dung cũ khi cần, gắn summaryVersion và provenance. Không dùng summary để authorize hoặc xác nhận giao dịch. Draft đang mở, approval binding, pending operation và unresolved dispute giữ trong structured state, không bị drop. Trước mỗi tác vụ nhạy cảm đọc lại version và domain state. Nếu không đủ context, hỏi lại hoặc tải dữ liệu thay vì đoán. Ngưỡng kích hoạt phải được chọn bằng eval, không sao chép phần trăm.

## Phân tích hành vi khách hàng — nhánh mở rộng

Pipeline bất đồng bộ, không nằm trên critical path của chat/thanh toán:

`UI observations + committed domain events → purpose/consent gate → validate/redact/dedup → event store → aggregate/features → insights → staff review hoặc personalization opt-in`.

- UI events như product_view, search_performed, draft_started chỉ là quan sát, không chứng minh mua hàng. request_submitted, quote_accepted và payment_confirmed phải do server/domain/provider có thẩm quyền phát sau commit.
- Event envelope đề xuất: eventId, schemaVersion, eventType, occurredAt, receivedAt, subjectKey giả danh, purpose, consentVersion khi áp dụng, source, sourceVersion, correlationId và properties allowlisted. Không gửi question text, receipt, email, phone hoặc address sang analytics mặc định. Pseudonym vẫn là dữ liệu cần bảo vệ.
- Domain transaction ghi outbox event cùng mutation. Dispatcher gửi sau commit; consumer dedup theo eventId, hỗ trợ retry, dead-letter, replay, out-of-order và đối chiếu completeness. Không gọi external service từ callback Firestore transaction vì callback có thể chạy lại.
- Tính funnel, điểm rơi bỏ dở, thời gian chờ báo giá, repeat purchase và nhu cầu theo nhóm sản phẩm bằng logic định nghĩa được. Phải có denominator, time window, freshness, coverage, definitionVersion và missing-data state. “Không thấy event” không tự động thành “khách bỏ cuộc”.
- LLM có thể diễn giải aggregate có chứng cứ; nhãn suy luận có confidence/limitations và con người review. Không suy diễn giới tính, sức khỏe, thu nhập hoặc “độ tin cậy” từ câu chat. Không dùng nhãn hành vi để tự quyết refund, giá, quyền truy cập hoặc tài chính.
- Dashboard trả kết quả tổng hợp theo quyền staff; khách chỉ xem/sửa sở thích của mình. Quy định retention, opt-out, erase/recompute, quyền export, ngưỡng chống lộ nhóm nhỏ và quyền service account trước rollout. Không mặc định truyền analytics sang public knowledge hoặc training.
- Chưa chọn BigQuery/vector DB: chọn khi số liệu volume, retention, query latency và chi phí cho thấy cần. Firestore là source of truth nghiệp vụ hiện tại; analytics có read model riêng.

## Luồng ví dụ

**“Đơn của mình tới đâu, và có sản phẩm X không?”** Router chỉ tạo đọc độc lập. Tracking kiểm owner, catalog kiểm published; mỗi panel có observedAt và partial failure riêng. Nếu model không khả dụng, thông tin có cấu trúc vẫn dùng được. Không chuyển lỗi tracking thành dữ liệu của người khác.

**“Mua giúp mình sản phẩm X.”** Kiểm catalog trước. Catalog orderable dùng giá niêm yết và full-upfront checkout; sản phẩm ngoài catalog mới đi custom request → staff quotation → hai đợt thanh toán. Không có match từ search giới hạn chưa đủ để kết luận ngoài catalog. AI chuẩn bị nháp, khách review/xác nhận, command kiểm version, provider xác nhận tiền; chat không tự chứng nhận paid.

**“Khách hay dừng ở đâu?”** Analytics tính funnel từ events đã kiểm chứng và time window. Staff xem số liệu, coverage và thời điểm cập nhật; LLM giải thích trên aggregate. Khuyến nghị can thiệp là candidate cho người duyệt, không tự gửi email hoặc sửa đơn.

## Kế hoạch tác động để duyệt trước implementation

| Pha | Bề mặt dự kiến | Acceptance / rủi ro cần kiểm |
|---|---|---|
| 1. Server routing + tool contracts | ask.ts, domain hybrid/task contracts; module server router mới; Ask.tsx chỉ adapter cần thiết | Giữ deterministic path, catalog/custom, owner fence; denied, locked, ambiguous, partial, stale, cancelled; chưa mở paid gate |
| 2. Run/approval lifecycle | ask-workflow.ts, domain workflow, Commerce.tsx; registry/run-state mới | Approval bị đổi payload, hết hạn, version race; cùng operation không tạo đơn hai lần; mất response có resume |
| 3. Provider admission | paid gate + adapter + atomic budget ledger, telemetry metadata | Full serialized token bounds, billed reasoning/output, retry policy, IAM/App Check, live cost/latency, fail closed; duyệt riêng trước bật |
| 4. Event nền tảng | command/catalog-checkout/PayOS/outbox sau impact review; event schema/consumer; rules nếu thêm dữ liệu | Atomic outbox, duplicate/delayed/out-of-order; không biến view thành conversion; redaction/consent/retention |
| 5. Dashboard insights | CRM read model, aggregate jobs, dashboard và preference controls mới | Denominator, freshness, empty/partial, small-group privacy, staff/customer isolation; product language + accessibility in context |
| 6. Specialist/retrieval mở rộng | Chỉ xác định sau measurement và eval | Không chia sẻ identity/quyền giữa agent; bounded fan-out, chi phí, injection, giải thích có nguồn |

Tất cả pha cần file-level approved implementation plan mới trước sửa existing system, theo `.ai/workflows/plan-existing-system-change.md`. Không tạo queue/worker/vector store hay áp tenant model chỉ vì hình có chúng. Rollback phải giữ operation pending và audit; hoàn/điều chỉnh tiền là compensating workflow được duyệt, không xóa dấu vết để “revert”.

## Tham chiếu kỹ thuật hiện hành

- [Genkit tool calling](https://genkit.dev/docs/js/tool-calling/): model có vòng gọi tool; server chịu trách nhiệm implementation và giới hạn.
- [Genkit interrupts](https://genkit.dev/docs/js/interrupts/): có thể dừng vòng generation để xin approval; không thay thế kiểm quyền/phiên bản trong domain.
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions): callback có thể chạy lại; side effects ngoài transaction cần tách riêng.

## Review / handoff

Documentation/design review cycle 1: PASSED trong phạm vi tài liệu: yêu cầu, source distinction, ranh giới quyền, PII, cost, retry/partial/cancel, tính đúng dữ liệu và trade-offs. Không thấy finding cần sửa trong phạm vi review này. Application compilation, runtime integration, cloud/provider, analytics efficacy: NOT_RUN (chỉ thiết kế). Product Language Gate cho thay đổi UI thực tế: NOT_APPLICABLE; bắt buộc khi triển khai. Không claim app production-ready. Render/visual evidence ghi trong REVIEW.md sau kiểm tra.

Runtime ledger: executable ai-agent-kit không có trong PATH; không có receipt runtime, governed implementation handoff BLOCKED. Bản này là proposal để duyệt, không phải successful implementation handoff. Production: NOT_READY cho kiến trúc đề xuất. Tokens / actual billed cost: Unavailable. Memory candidates: None. WIP sẵn có được giữ nguyên; không commit/push/deploy/restart.
