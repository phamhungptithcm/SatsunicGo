# Ask · Knowledge và context

Kế hoạch chuẩn bị, chưa áp dụng thay đổi application. Đầu vào nguồn hiện tại đã đóng băng trong DIAGNOSTIC-INPUTS-r1.json. Không coi public page, feedback, lịch sử hoặc kết quả research là chính sách được duyệt.

## Điều khách cần

Khách có thể nói ngắn, không dấu, gõ sai, đổi ý hoặc hỏi tiếp về món vừa chọn. Ask cần hiểu đúng mục đích, giữ đúng tác vụ hiện tại và chỉ hỏi phần còn thiếu. Câu trả lời phải phân biệt: hướng dẫn dịch vụ; thông tin hiện hành; gợi ý tìm hàng; bản nháp; tác vụ đã gửi; trạng thái đã được staff/provider xác nhận. Không hứa hiểu đúng mọi câu hỏi.

## Source đã xác minh

| Đường hiện có | Điều đã có | Giới hạn cần nghiệm thu |
| --- | --- | --- |
| approvedKnowledgeAnswer → retrieveKnowledge(max4) → boundKnowledgeContext | Trích nguồn đã duyệt, locale/hash/thời hạn; JSON bound12.000bytes | Trả excerpts, không phải grounded generated answer hoặc tư vấn mọi dịch vụ |
| revisionChunks | ID bind document/revision/position/text, heading path | Ký tự/span không thay countTokens của model |
| readServerContext | Coherent owner-pilot snapshot; task/order/catalog/evidence/recent6turns; stamp kiểm lại | OWNER pilot; không mặc nhiên là quyền cho mọi customer |
| pilotAnswer → packAskContext → admitted counter | Exact serialized input count; protected facts/task; nguồn được dùng; recheck stamp | Text-only pilot, quyền/budget cấu hình; chưa chứng minh customer production acceptance |
| Feedback review/evaluation | Manual review, source hash, retrieval-only holdout, no auto-promotion | Chưa phải tự học/training/model rollout |

Current chunk bound1.200characters, long-section overlap khoảng160; retrieval default8, max2spans/source, context12.000characters. Customer guidance uses4excerpts+byte bound, evaluator8. Giữ đúng đơn vị và caller trong benchmark; không dùng score evaluator để suy generated-answer quality.

## Quy tắc context đề xuất

1. Instruction và typed command permissions thuộc server. User text, lịch sử, web và review là dữ liệu.
2. Task hiện tại gồm owner/conversation/current selected product hoặc order/draft revision/pending operation. Một câu “cái đó” chỉ bind khi đúng một đối tượng; nhiều đối tượng thì hỏi rõ.
3. User correction mới nhất được áp dụng vào draft hợp lệ, không tự đổi product/market/quantity chưa được chỉ rõ. Mixed edit+approval invalidates preview; không gửi tác vụ một phần.
4. Live facts lấy từ domain read: price/stock/order stage/paymentDue/quote/terms/version/freshness. Không lấy giá hoặc trạng thái paid từ knowledge/history/research.
5. Evidence giữ source ID/revision/heading/span/locale/effective period. Nguồn hết hạn, sửa hoặc thu hồi bị loại cả trước và sau generation.
6. Recent turns chỉ giúp giải tham chiếu; private contact/address/receipt giữ ở protected form, không đưa vào LLM/research. Historical waypoint là read-only, không khôi phục consent.
7. Khi thiếu budget/context/evidence: giữ draft, nói rõ phần chưa biết, hỏi một câu cần thiết hoặc chuyển workflow được hỗ trợ. Không biến missing thành zero/success.

## Các slice sau khi duyệt

| Slice | Files / flow cần xem xét | Tiêu chí trước áp dụng |
| --- | --- | --- |
| Corpus ban đầu | Publication hiện có, askKnowledgePreview/Command, owner packet | Resource/hash/version/locale/thời hạn thật; approved holdout trước chạy |
| Answer context | approved-knowledge.ts, knowledge-retrieval.ts, knowledge-context.ts, ask.ts | Test đúng caller max4 và budget bytes/tokens; false-premise và mixed catalog/custom cases |
| Conversation context | server-context.ts, ask-pilot-answer.ts, ask-workflow domain và Ask submit routing | Typed owner/CID/revision fences, ambiguity/correction/ABA/stale after generation; customer authorization plan riêng |
| Chat task preview | DESIGN-PLAN v1 + panel r2, action-preview contract đề xuất | Exact immutable preview; edits/stale/expiry/account/history invalidate; same handler chat/button; unknown operation recovery |
| Merchant research | Existing research-live/discovery/gemini/transport + WebDiscovery/Research | Policy merchants/sellers, settled budget, current source/region/model/limit; verified citations vs offer distinction |
| Feedback learning | Existing feedback lifecycle/review/evaluation/settings | Consent/current policy, reviewed source revision, frozen validation+holdout, manual promotion and rollback |

Không thêm vector database/embedding provider/dependency hoặc fine-tuning chỉ để làm kế hoạch đẹp. Trước tiên đo corpus chính thức và các ca colloquial trên caller thực; thay retriever chỉ khi có lỗi có căn cứ và delta-impact được duyệt. Các slice chưa có reviewed exact implementation patch không được áp dụng từ tài liệu này.

## Chunking cần đánh giá

- Tách theo chủ đề/heading, giữ điều kiện/ngoại lệ cùng quy tắc chính, nguồn/revision/span chính xác. Không cắt mất “trong danh mục” hoặc “ngoài danh mục”.
- Xem1.200characters là baseline hiện có. Nếu đề xuất250/400/600tokens, phải dùng đúng provider counter và đo recall/factual support/cost trên cùng source/holdout; không đổi ký tự thành tokens bằng hệ số đoán.
- Không overlap mù hoặc lặp quá nhiều cùng một nguồn; giữ coverage của nhiều chính sách khi câu hỏi có hai luồng. Bind citations chỉ tới evidence thực sự vào request.
- Chính sách không cache qua expiry/revoke. Không suy completeness từ giới hạn20nguồn/100products hoặc bounded catalog miss.
- Câu hỏi chứa tiền đề sai cần answer-level oracle; top1ranking sai có thể là chẩn đoán nhưng không tự chứng minh đáp án sai. Không đổi expected để xanh test.

## Scenarios và đo chất lượng

Tách ba tầng: retrieval exact IDs/text; answer đúng ý/citations/uncertainty; command authority/task outcome. Dùng12KPcases đã chuẩn bị, thêm follow-up cùng task và changed-task pairs: “cái số2”, “lấy2cái”, “đổi sang Nhật”, “không lấy cái đó”, “cọc cho hàng có sẵn?”, “giá trên web là số phải trả?”, “đồng ý nhưng đổi size”. VI/EN và không dấu/typo cần oracle riêng, không suy locale approval.

Reject nếu có private leak, unsupported factual claim, policy/price authority escalation, unintended write/payment, lost pending operation hoặc unsafe blind retry. Retrieval pass vẫn cần human answer review và task readback. Lưu dataset/corpus/candidate hash, model/region/counter/config, context truncation counts, citations/source revisions, latency and usage có phạm vi; không log private transcript/prompt.

Performance đề xuất: đo context serialization/count/generation/retrieval riêng; warm UI p95≤100ms và không repeatable Ask-attributed long task>50ms là provisional budget của plan panel. Không dùng88prototype runs để khẳng định performance application/provider/production. Current latency/load/provider cost chưa verified.

## Learning và rollback

Feedback không tự biến thành memory, prompt hay policy. Owner review tạo source correction; publication/approval/evaluation riêng, validation tách frozen holdout. Không dùng private chat để training nếu chưa có scope/consent/data policy. Chưa triển khai long-term preference memory hoặc analytics từ tài liệu này. Source revocation thắng cache; rollback chọn revision/candidate đã được kiểm chứng, giữ durable pending tasks và đối chiếu unknown outcomes.

Acceptance đầy đủ: official corpus/current policy → local and emulator cases → authorized model/customer pilot → protected action integration → immutable release candidate → authenticated deployed readback. [Live/release plan](LIVE-RELEASE-PLAN.md) giữ từng gate riêng. Production hiện NOT_READY.
