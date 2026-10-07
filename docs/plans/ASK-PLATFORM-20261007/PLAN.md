# SatsunicGo Ask — implementation and business-flow plan

Ngày: 2026-10-07. **PLAN_READY — chưa cho phép triển khai.**

Yêu cầu: phát triển Ask theo sơ đồ SatsunicGo AI, để khách hỏi về toàn bộ dịch vụ và hoàn thành phần lớn tác vụ được phép ngay trên Ask panel. **Chỉ lập plan; không chỉnh code, dữ liệu hoặc cấu hình.**

## 1. Kết quả cần đạt

Ask trở thành một cửa làm việc với SatsunicGo: hỏi, tìm, so sánh, chuẩn bị, xem lại, xác nhận, theo dõi và tiếp tục công việc. Người dùng không cần biết tên chức năng hay endpoint. Panel dùng cùng domain/backend với các trang hiện có; không tạo một bộ nghiệp vụ riêng cho AI.

“Hỏi bất cứ điều gì” nghĩa là mọi câu hỏi liên quan đến dịch vụ, sản phẩm, chính sách và thông tin tài khoản mà người hỏi được phép xem. Không đồng nghĩa biết mọi đáp án hoặc làm mọi việc. Khi thiếu nguồn, Ask nói rõ phần chưa biết, hỏi thêm hoặc chuyển hỗ trợ. Khi tác vụ chưa có backend hợp lệ, Ask hướng dẫn đến trang đúng; không báo đã làm.

“Hầu hết tác vụ” cần đo bằng capability matrix: số tác vụ khách được phép thực hiện có flow hoàn chỉnh trên panel / toàn bộ tác vụ khách hiện có trong phạm vi đã duyệt. Không lấy số tool làm tỷ lệ hoàn thành. Mục tiêu đề xuất cho release khách hàng: >=90% capability đủ điều kiện và 100% các flow trọng tâm purchase/tracking/support. Đây là mục tiêu để duyệt, chưa có kết quả đo.

Ba chế độ trong cùng panel:

1. **Explain:** trả lời có nguồn, đúng ngôn ngữ, phân biệt điều kiện và ngoại lệ.
2. **Assist:** tra cứu/tính bằng tool và soạn bản nháp để người dùng xem lại.
3. **Act:** chỉ thực hiện action đã xác nhận, đúng quyền, đúng object và đúng version.

Staff Copilot dùng cùng nền tảng nhưng registry và dữ liệu khác theo role. Bản khách không được thừa hưởng quyền staff. Phân tích hành vi là nhánh sau, không phải điều kiện để mua hàng hoạt động.

## 2. Evidence và hiện trạng cần giữ

Baseline HEAD: `22214b64743d6abbcaf4162382b6e53605348adc`, **worktree đang dirty**, gồm Ask/provider pilot, cart, MFA/auth và các phần khác của người đang làm. `SOURCE_MANIFEST.json` ghi hash các file đọc tại thời điểm plan. HEAD không đại diện toàn bộ candidate. Trước từng pha phải so lại hash/diff và xác nhận owner các file shared; không reset/restore WIP.

Repository Intelligence: **DEGRADED** — CodeGraph stale/health pass; CocoIndex stale/health fail. Đã có một lần recovery ở phần thiết kế trước, không tiếp tục retry. Dùng bounded source/domain/tests/spec inspection; không claim đầy đủ blast radius. OS resource-limit xuất hiện ở một lượt đọc, lượt đọc lại tuần tự thành công. `.ai/context/repository-map.md` và build-test context là placeholder; package manifests/source có thẩm quyền hơn.

| Đã đọc trong source hiện tại | Ý nghĩa cho plan |
|---|---|
| `Ask.tsx`, `ask-task-frame`, `ask-read-task-plan`, response composer | Có routing UI và bounded reads; chưa phải server capability platform thống nhất |
| `knowledge-retrieval.ts` | Lexical scan tối đa 100 tài liệu, 20k ký tự/body; windows 1,200 ký tự bước 1,000; tối đa 8 excerpts/12k ký tự; một excerpt tốt nhất/document. Không phải token-aware/semantic/full-corpus search |
| `ask.ts` | Trên project satsunicgo, route vào `pilotAnswer` trước nhánh Genkit cũ; không thể mô tả hiện trạng đơn giản là mọi AI đều bị paid gate chặn |
| `ask-pilot.ts`, `ask-pilot-answer.ts` | Owner-only, text-only, không images/orderId/conversationId; reservation lifetime cap, countTokens, không retry generation; pricing envelope có expiry. Chưa có production readback trong task này |
| `ask-paid-gate.ts` | Nhánh cũ vẫn fail closed. Không xóa gate để mở đại trà; hợp nhất admission bằng plan riêng |
| `ask-workflow.ts`, domain workflow | Có conversation version, order version, hash/operationId, pending/resume, catalogCheckout, draft, submitRequest, recipient, acceptQuote, approveFinal, confirmReceipt |
| `Commerce.tsx`, `CatalogSearch`, `ShippingQuote`, `OrderTracking`, `InlineSupport`, `InvoiceSummary` | Đã có nền inline commerce/lookup/support/document; cần tái sử dụng thay vì viết lại |
| `cart.ts`, `packages/domain/cart.ts`, `src/features/cart/` | Có WIP cart 30 lines, revision, lineId; checkout vẫn theo sản phẩm, không tự gom thành một order/payment |
| `index.ts`, catalog checkout, payments/payos | Domain quyết định state/giá; PayOS link/webhook/reconciliation riêng; lời chat không xác nhận paid |
| membership, invoices, changes, returns, refunds, order-conversation | Có backend theo role; customer return/refund request không đồng nghĩa khách được gọi staff refund/return APIs |
| workspace profile/address/ticket | Có customer commands và marketingConsent; marketingConsent không tự thay consent cho analytics hoặc memory |

Runtime/cloud/provider/billing trong plan: **NOT_VERIFIED**. Báo cáo provider cũ có acceptance BLOCKED; source mới có thêm pilot không biến báo cáo cũ thành bằng chứng live hiện tại. Không dùng expiry/price của pilot làm pricing policy dài hạn.

## 3. Capability matrix và quyền quyết định

Ký hiệu: R = đọc; D = nháp; W = ghi có xác nhận; X = external/privileged workflow. Bảng dưới là **phạm vi mục tiêu**, không phải tuyên bố mọi hàng đã nối vào Ask.

| Tác vụ | Khách trên Ask | Adapter/source | Ai quyết định cuối | Pha |
|---|---|---|---|---|
| Dịch vụ mua hộ US/JP/KR, cách dùng, điều kiện, chính sách | R/Explain có citation | Published knowledge | Nội dung đã duyệt/còn hiệu lực | 2–3 |
| Catalog, variant, listed price/orderable | R, chọn và so sánh | Product query + catalog schema | Backend catalog version | 3, 5 |
| Phí, quote vận chuyển, estimate | R, nhập tham số/clarify | Public fee/shipping-rate tools | Công thức/rate hiện hành; estimate không là cam kết | 3, 5 |
| Đơn của mình, việc tiếp theo, tiền còn phải trả | R + chọn đơn | customerOrderTracking / domain paymentDue | Owner-scoped domain state | 3–5 |
| Tìm đơn chưa nhớ ID | R paginated order picker | Existing order read path/adapt projection | Owner, không toàn bộ CRM | 3 |
| Giỏ hàng: thêm/sửa quantity/variant/bỏ line | W hoặc guest local draft rõ trạng thái | cartCommand + current cart store | Cart revision/backend | 5 |
| Mua catalog | D→W, checkout đúng sản phẩm | catalogCheckout | Listed price, termsVersion, productVersion | 5 |
| Yêu cầu mua hộ ngoài catalog | D→W; thu thập thiếu qua nhiều lượt | askWorkflow→command | Khách gửi, staff báo giá | 4–5 |
| Người nhận/địa chỉ giao hàng | Form riêng→W | saveRecipient / saveAddress | Owner, stage/address constraints | 5–6 |
| Chấp nhận báo giá/duyệt final/nhận hàng | W | askWorkflow / command | Khách đúng chủ đơn + state guard | 5 |
| Thanh toán | Tạo link→mở checkout, trở lại panel | createPaymentLink; verified webhook/reconcile | Provider hoặc authorized finance flow | 5 |
| Hủy đơn đủ điều kiện | W + xem consequence | command cancelRequest | Domain stage; không dùng generic cancel | 6 |
| Xin đổi/đổi trả/hoàn tiền | D hoặc support request; accept/reject proposal đã có | changeCommand, support, owner projections | Staff tạo/apply proposal; finance hoàn tiền | 6 |
| Membership: so sánh, mua/gia hạn, cancelRenewal | R→W khi action hiện có cho khách | membershipCommand | Entitlement/invoice state; finance xác nhận | 6 |
| Hóa đơn/chứng từ của mình | R, mở/tải qua đường được phép | invoiceList/detail/share paths | Issued state và access | 6 |
| Ticket/trao đổi đơn | D→W, gửi/reply theo quyền | workspace/orderConversation commands | Backend ghi message/ticket | 6 |
| Profile/address/consent/preferences | Form→W; xem rõ phần thay đổi | workspaceCommand, memory feature riêng | Chủ tài khoản; opt-in riêng | 6, 8 |
| Export/delete data | W tạo yêu cầu hỗ trợ | openTicket topics có sẵn | Quy trình privacy có người xử lý | 6 |
| CRM quote/procurement/warehouse/finance | Chỉ staff có role; khách thấy trạng thái được phép | command/shipping/invoices/refunds | Role + MFA + approvals hiện hành | 7 |
| “Khách hay dừng ở đâu?” | Staff R/Explain aggregate | Analytics read model | Định nghĩa metric, coverage, staff review | 9 |

Excluded khỏi “customer coverage”: trực tiếp sửa giá/quyền, tự verifyTransfer/refund, tự tạo chứng nhận invoice/tax, tự dispatch kho, arbitrary URL scraping, tự xuất bản, tự xóa dữ liệu vĩnh viễn. Nội dung dịch vụ chưa được chủ nghiệp vụ duyệt là knowledge gap cần owner viết; không dùng model lấp vào.

## 4. Kiến trúc thực thi

`Ask panel → server admission → capability router → context/retrieval hoặc scoped read → answer/draft/action preview → explicit approval → existing domain command → event/readback → panel`.

### Contracts cần xây

- **Task:** taskId, intent, capabilityId, objectRef, validated params, dependencies, status. Intent confidence không thay permission.
- **Tool:** name/version, input/output schema, mode R/D/W/X, role/owner constraints, returned fields, cost/timeout/size limits, freshness, idempotency behavior, execution/recovery adapter. Descriptions nói rõ “draft only”, “owner only”.
- **Evidence:** sourceId/sourceVersion, chunkId khi phù hợp, objectVersion, observedAt, coverage, locale, access scope, excerpt/structured facts. Citation tới nội dung thực người dùng mở được, không link CRM cho guest.
- **Run:** runId, actor from auth, conversationId/version, selected objects, current tasks, bounded results, budget reservation, cancellation generation, pending operation refs. Phân biệt completed/partial/failed/awaiting_input/awaiting_confirmation/awaiting_provider/cancelled.
- **Action proposal:** proposalId, actor, capability/action, objectId, expectedVersions, payloadHash, preview, consequence, expiry, approval status. Confirmation gửi proposalId, backend lấy canonical payload; không nhận lại payload do model tự viết sau approval.
- **Result:** data snapshot và durable outcome; response lost là `unknown/pending`, không `failed` mặc định và không tạo operation mới.

Router xử lý đa ý: chia thành task và dependency graph, đọc độc lập chạy song song có giới hạn; mutation theo thứ tự và xác nhận riêng. “Xem đơn rồi hủy” không chạy cancel trước khi lấy state/preview. “Mua A/B, nếu đủ…” không tạo batch mua mơ hồ. Referential ambiguity (“cái đó”, “đơn trước”) phải hỏi hoặc hiện picker.

LLM được chọn tool để đọc hoặc chuẩn bị, không được gọi executeWrite bằng text approval. Khi model trả tool call, server validate + authorize trước I/O; từng adapter recheck. Người dùng xác nhận bằng control có review cụ thể, không ngầm dựa trên một chữ “ok”. Genkit interrupt có thể dùng cho wait/resume sau khi kiểm version tương thích của dependency; approval/domain contract vẫn nằm ngoài framework.

## 5. Business flow trọng tâm

### A. Hỏi về dịch vụ

Question → phân loại service topic/market/language → truy hồi policy còn hiệu lực → nếu câu hỏi cần số tiền/thời gian thực thì gọi calculator/current read → trả lời ngắn + điều kiện + source → gợi ý action phù hợp. Không có thông tin đủ thì hỏi thêm hoặc support. Đáp án FAQ không tự làm phát sinh đơn.

### B. Catalog purchase và giỏ hàng

Tìm product → chọn kết quả/variant/quantity → server đọc lại orderable/price/version → review card (VND tổng, terms, người nhận nếu cần) → confirm catalogCheckout → readback orderId/state → createPaymentLink → external checkout → verified payment event → next action/tracking.

Giỏ nhiều sản phẩm giữ semantics hiện có: per-product checkout, mỗi order/result riêng. Có batch selection thì trình bày việc nào hoàn tất/đang chờ; chưa gom một payment hoặc một order cho cả cart. Cart line chỉ consume sau order creation xác minh đúng lineId/quantity; payment failure không tự tạo lại order. Guest cart merge vào account chỉ bằng explicit action.

### C. Custom purchase

Kiểm catalog bằng lookup có coverage đúng → xác định nhu cầu ngoài catalog → thu market/item/quantity/variant/store URL/notes; không bịa dữ liệu thiếu → local/structured draft có provenance → customer review → submitRequest → wait staff quotation → nhận quoteVersion → lưu recipient → acceptQuote → thanh toán deposit theo domain → staff mua/nhận/đóng gói → final total → approveFinal → balance payment → dispatch/tracking → confirmReceipt.

Không ép custom request khi search giới hạn không có match. Catalog không orderable phải nói đúng, không âm thầm đổi thành custom quote. Không nói “đã mua” sau submit; chờ domain/procurement events. Giữ nhiều đơn bằng picker và conversation binding; không đổi đơn nền rồi thao tác nhầm.

### D. Hỗ trợ, thay đổi, đổi trả/hoàn tiền

Chọn đơn → đọc state và policy → ghi rõ yêu cầu/lý do → xác nhận gửi ticket/message → nhân viên xử lý. Proposal đã có: hiện before/after/cost/consequence và version → owner accept/reject → staff apply theo domain. Customer không gọi staff-only `refundCommand.request` hoặc `returnCommand` chỉ vì tên action có “request”.

### E. Hồ sơ, membership và chứng từ

Profile/address dùng inline form, dữ liệu PII không đi qua prompt. Consent không preselect hoặc suy từ chat. Membership purchase/requestRenewal/cancelRenewal tái sử dụng invoice/entitlement; “đề nghị gia hạn” không là “đã gia hạn”. Invoice chỉ xem issued/allowed state; customer request invoice là yêu cầu hỗ trợ nếu backend không có customer issue. Email/share là external action cần destination preview và quyền riêng, không tự gửi.

## 6. Chunking cho knowledge

### 6.1 Ba loại dữ liệu, ba đường khác nhau

| Loại | Nguồn/đường | Không dùng |
|---|---|---|
| Tài liệu ổn định: dịch vụ, hướng dẫn, điều kiện, ngoại lệ | Versioned published knowledge → chunks → retrieval | Không lấy raw README/source code làm customer policy |
| Facts động: giá/rate/tồn khả dụng/membership/đơn/thanh toán | Typed live tools/calculators + version/observedAt | Không embed hoặc tin giá/paid state trong article/history |
| Task state: selected product/order, draft, approval, pending op | Structured conversation/run state | Không giao LLM summary làm nguồn cấp quyền hoặc khôi phục số tiền |

Chưa index private orders, recipient, support transcripts hoặc billing vào public vector corpus. Private context qua owner/role projection; nếu cần staff knowledge riêng thì corpus/index scope riêng, prefilter trước retrieval và recheck source sau retrieval.

### 6.2 Ingestion và authoring

1. Inventory các dịch vụ và FAQ thật; business owner xác nhận market, điều kiện, fees reference, refund exceptions, support route, effective dates và người chịu trách nhiệm. TODO(owner) khi thiếu.
2. Tách rich text thành heading/paragraph/list/table sạch, giữ URL, title, language và business terms. Không chỉ regex cắt HTML nếu làm mất table hoặc nested lists.
3. Tạo một document revision bất biến; checksum, contentVersion, publish/effective/expiry status, source owner. Không coi `published` hiện tại là review workflow đã tồn tại: approval metadata cần thiết kế riêng và approved trước bổ sung schema.
4. Chunk theo section và câu hỏi/ý nghĩa; nối heading breadcrumb vào mỗi chunk. Không cắt điều kiện khỏi ngoại lệ, rate table khỏi unit/market, hoặc bước thao tác khỏi prerequisite.
5. Chuẩn hóa search form tiếng Việt không dấu/có dấu và synonyms nhưng giữ nguyên text gốc cho citation. English/VI giữ locale, hỗ trợ query multilingual bằng embedding được kiểm chứng; không tự dịch lại chính sách như nguồn chính thức.
6. Index theo generation, validate số documents/chunks và lỗi. Chỉ activate index generation khi đầy đủ; publication revoke/delete có tombstone và cache invalidation ngay, không chờ embedding job để chặn nội dung cũ.

### 6.3 Kích thước khởi đầu để benchmark

Các số sau là **candidate thử nghiệm**, không phải best practice đã chứng minh cho dữ liệu này.

| Nội dung | Target thử | Rule |
|---|---|---|
| FAQ một câu hỏi | 120–250 tokens | Đủ answer + điều kiện + support route; không pad cho đủ token |
| Hướng dẫn một giai đoạn | 250–450 tokens | Heading + prerequisites + bước + exception liên quan |
| Chính sách/phí/đổi trả | 350–600 tokens | Điều kiện và ngoại lệ cùng chunk; công thức/giá thật vẫn tool |
| Table | Một nhóm rows có cùng headers/units | Không split một row; repeat headers ở mỗi chunk |
| Section dài | Split theo paragraph, max thử 650 tokens | Overlap thử 40–80 tokens khi cần nối mạch; tránh lặp nguyên đoạn |

So sánh 250/400/600-token variants trên cùng bộ câu hỏi; chọn bằng retrieval quality + answer quality + cost/latency. Không cắt theo 1,200 ký tự rồi gọi đó là token-aware. Tokenizer phải khớp embedding/generation model và count toàn serialized prompt. Nguồn dài dùng parent/child: search child rồi mở rộng section quanh đó trong budget, không nạp cả document mặc định.

### 6.4 Metadata tối thiểu

`chunkId, documentId, contentVersion, indexGeneration, contentHash, title, headingPath, text, language, serviceType, market, audience, accessScope, publicationStatus, effectiveFrom/effectiveTo, sourceUrl, owner/reviewerRef, ordinal, tokenCount, embeddingModel/version`.

Metadata nào source hiện chưa có phải được migrate/backfill bằng owner review; không tự đặt effective date hoặc approval. ID ổn định dựa vào document revision + section/chunk checksum; citation luôn truy được đúng revision. Cùng article có thể lấy >1 chunk khi hỏi nhiều điều kiện, nhưng giới hạn diversity để một document không chiếm hết context.

### 6.5 Retrieval pipeline

1. Canonicalize query (locale, market, service terms) và resolve selected entities; preserve câu hỏi gốc.
2. Exact IDs/sku/order → direct scoped tool. General policy → knowledge retrieval. Model không phát query chọn owner khác.
3. Prefilter active/publication, time validity, audience/access, service/market khi biết chắc; không đoán market để loại đáp án đúng.
4. Hybrid: lexical exact terms + multilingual semantic candidates; fuse ranks (candidate RRF), dedup chunks, diversity by section/document. Firestore vector query chỉ cung cấp vector search; lexical retrieval phải xây adapter riêng, không claim có full-text/BM25 sẵn.
5. Rerank khi benchmark chứng minh cần; candidate lấy top20 lexical/top20 semantic, final4–8 chunks, neighbor expansion theo nhu cầu. Threshold từ validation set, không chọn một cosine score cho mọi corpus.
6. Verify active revision/source access lần cuối; gắn evidence coverage. Không match → chưa biết, không “dịch vụ này không tồn tại”. Conflict policies → chọn source authority/date được owner định nghĩa; nếu chưa rõ, expose conflict/support thay vì tự hòa giải.
7. Assemble context giữ claim↔citation mapping. Grounded output schema; kiểm citation tồn tại, đúng locale/access/revision. Cần eval factual support chứ citation-valid không tự chứng minh câu trả lời đúng.

### 6.6 Backend lựa chọn

Đầu tiên abstraction `KnowledgeStore + LexicalRetriever + SemanticRetriever`; benchmark bounded lexical baseline. Firestore vector search là candidate phù hợp hệ sinh thái hiện tại, nhưng chọn chỉ sau kiểm edition/region/index/embedding dimensions/SDK, chi phí và latency. Vertex RAG managed là alternative cần review data/IAM/ops/cost riêng; không triển khai hai hệ song song chỉ để thử.

Triển khai chunking offline/ingestion jobs incremental theo contentHash; không embedding lại corpus mỗi câu hỏi. Build index có bounded batches, checkpoint, retry/dedup, spend cap; không `save` từng row trong loop lớn. Public cache key chứa query/locale/indexGeneration/filter; private result không share cache giữa account/role. Không cần fine-tune để bắt đầu; retrieval + domain tools + eval là nền.

## 7. Context và memory

Tách **knowledge chunking**, **conversation compaction** và **implementation slices**; ba việc khác nhau.

Conversation context ưu tiên: instruction/capability policy → request → structured task state → current tool facts → retrieved excerpts → recent turns → summary. Đếm full request (schema/tool descriptions/JSON/images nếu có/output reserve), không chỉ câu hỏi. Start candidate model limit được freeze; mỗi turn reserve chi phí của mọi provider call/tool/reranker/counting path theo chính sách riêng. Tối đa steps/tokens/concurrency và timeout phải có ở server, không chỉ prompt.

Summary có source turn IDs, summaryVersion và thời điểm; chỉ ghi ý đã xác minh, user corrections thắng extraction cũ. Không drop draft, approval, pending operation, selected object, unresolved issue. UI không làm mất trạng thái task khi scroll/panel close. Cancel generation không có nghĩa rollback mutation đã commit; readback rõ việc đã xảy ra.

Long-term preference memory opt-in, riêng theo UID, sửa/xóa được, có purpose/TTL/provenance. Không lấy gender/wealth/health từ tên, hình hoặc món hàng. Người dùng chọn memory khác với mặc định lưu conversation; retention các loại dữ liệu phải xác định và review riêng.

## 8. Chia implementation thành slices

Mỗi slice phải là một vertical outcome: input→backend→panel→failure/recovery→evidence; không chia chỉ “UI xong”, “AI xong”, “API xong”. Không giao parallel edits cùng Ask.tsx/domain contracts nếu chưa có owner. Tên module NEW bên dưới là candidate, chưa tạo file code trong task này.

| Pha / slices | Phụ thuộc | Outcome và file/function map | Gate để đi tiếp |
|---|---|---|---|
| **0. Baseline** S00 service/capability inventory; S01 shared contract + approval | Không | Freeze WIP/hash; role matrix, tool schemas, knowledge owner, provider policy; docs + schema plan | Owner duyệt capability/financial boundary; current impact plan |
| **1. Runtime nền** S02 server routing; S03 run/registry; S04 read/error envelope | 0 | NEW domain ask-capabilities/run/tool-contracts; NEW ai/router/registry/run-state; `ask.ts`, `index.ts`, `Ask.tsx`, `transport.ts` chỉ adapter cần thiết | Existing paths giữ hoạt động; unknown/denied/mixed intent/timeout/cancel/partial tests |
| **2. Knowledge** S05 approved corpus; S06 section-aware chunker; S07 index/retrieval | 0–1 | `knowledge-retrieval.ts`, NEW ai/knowledge chunker/metadata/retrieval/store; content publication hooks trong workspace/blog-studio **sau impact review**; index/rules candidate; `ASK_KNOWLEDGE.md` | Citation/version/invalidation/ACL; comparative dataset; ingestion spend cap |
| **3. Broad Q&A** S08 grounded service answers; S09 catalog/rates; S10 own-order/invoice reads | 1–2 | `ask.ts`, `CatalogSearch`, `ShippingQuote`, `OrderTracking`, `InvoiceSummary`, public/authorized read adapters; `ask-response-composer` | Multi-intent trả phần đã có; no invented rates/state; >100 documents completeness test |
| **4. Action lifecycle** S11 action preview; S12 approval execute; S13 resume ledger | 1, 3 | `ask-workflow.ts`, domain workflow, `Commerce.tsx`; NEW approval contracts/execution adapter; operation IDs canonical action | Tampered/expired/revoked/stale approvals denied; response loss/concurrent retry one durable mutation |
| **5. Purchase trên panel** S14 catalog+cart; S15 custom draft+submit; S16 quote/payment/receipt | 3–4 | `CatalogPurchase`, `Commerce`, cart store/command, catalogCheckout, command, payments adapter; don't duplicate domain | Full catalog/custom regression; per-product orders; paid only verified provider event; live provider acceptance riêng |
| **6. Customer workspace** S17 support/messages; S18 profile/address; S19 membership; S20 changes/documents/cancel | 4–5 | `InlineSupport`, NEW inline account/membership/change cards; workspace/membership/changes/invoices/order-conversation wrappers | Only customer-owned capabilities; PII form excluded prompt; stage guards, role isolation |
| **7. Staff Copilot** S21 scoped reads/drafts; S22 selected staff writes | 1–6 | CRM entry + staff-only registry adapters; listWork/command/shipping/refunds/returns/invoice/workspace | Role matrix, recent MFA and existing approvals; privilege/financial operations never customer-exposed |
| **8. Memory và UX hoàn thiện** S23 token-aware compaction; S24 opt-in memory; S25 panel continuity/accessibility | 1, 4–6 | ai/context builder/compaction, memory contracts/store/rules, Ask panel state; reuse existing components | Account switch, selected-order fence, retention/erase, 320px/zoom/focus/screen reader, VN/EN states |
| **9. Customer Intelligence** S26 events/outbox; S27 aggregates; S28 insights UI | Stable 5–6 | Versioned event schemas; domain after-commit outbox hook review; worker/read model; CRM analytics view | Purpose/consent/PII/duplicate/delayed/missing coverage; UI≠conversion; async not critical path |
| **10. Release** S29 eval+canary; S30 rollout/runbook | Required customer slices | Deployment allowlist/source artifacts/settings/IAM/App Check/index snapshots; operator controls | Fresh final review, exact candidate hash, provider/production acceptance, rollback rehearsed |

S07 semantic search, S16 paid AI enablement, S22 staff writes và S26 analytics hooks là risk gates có scope/IAM/index/cost riêng; approval cho plan tổng không tự cho phép production mutations hoặc financial corrections. Không hard-code owner pilot UID/budget vào public customer platform.

Phạm vi tối thiểu đáng phát hành: S00–S20 + S23/S25 + S29/S30. Opt-in memory, staff writes và analytics có thể phát hành sau. “Tối thiểu” vẫn gồm failure/recovery của purchase, không chỉ chatbot FAQ.

## 9. Quy tắc UI trên Ask panel

Panel hiển thị answer + task cards cùng thread. Card dùng dữ liệu thật và có rõ selected order/product. Action preview hiển thị object, fields thay đổi, tổng VND nếu có, điều kiện và người xử lý tiếp. Primary CTA gọi backend hiện hành; không chỉ dựng text nói “đã gửi”.

States bắt buộc: cần đăng nhập, cần chọn đối tượng, thiếu input, loading thật theo phase, kết quả một phần, nguồn stale/unavailable, chờ khách, chờ staff/provider, version changed, pending unknown outcome, offline, cancelled, completed. Không % tiến độ/ETA giả. Result đến muộn sau đổi UID/conversation/order phải bị fence. User sửa fields từ form thắng draft extraction cũ.

External checkout/file upload/MFA có thể mở trang phù hợp rồi quay lại resume; không ép mọi tác vụ nằm trong bubble. File/image giữ transient, type/size/sanitization checks; không arbitrary fetch URL; injection trong ảnh/doc/tool result không được thành instruction. Địa chỉ và số điện thoại chỉ trong secure controls, không echo vào model/transcript phân tích.

Áp dụng `write-product-content` + product-content review cho mọi string/state; nguyên tắc Purpose/Agency/Responsibility/Familiarity/Flexibility/Simplicity/Craft/Delight phải có evidence trong rendered web UI, không chỉ file localization. Giữ thuật ngữ AI cần thiết cho docs/staff; customer reply không dùng internals làm heading.

## 10. Eval và acceptance

### Bộ benchmark cần xây, chưa tồn tại

Candidate 360 câu hỏi: 120 dịch vụ/policy/FAQ; 70 catalog/phí/shipping; 70 own-account/order; 50 action intent/multi-turn; 50 unanswerable/conflict/injection/permission. Song ngữ VI/EN, không dấu, lỗi gõ, hỏi dài/nhiều ý; split by topic/document và held-out questions, không tune trên test set. Expected source/action/permission/outcome do owner xác nhận. Dùng synthetic PII/test accounts, không production transcript mặc định.

Retrieval labels: relevant document+section và điều kiện/ngoại lệ bắt buộc. Đo Recall@k, nDCG, coverage và conflict retrieval; answer eval tách claim support/citation validity/answer relevance/abstention. Workflow eval kiểm durable state và actor, không chỉ text/HTTP200. Model-as-judge chỉ hỗ trợ, các flow tiền/quyền phải có deterministic assertions + human review.

Mục tiêu đề xuất để freeze tại S01 (không phải kết quả hiện tại): Recall@8 >=95% bộ policy trọng tâm; correct citation mapping >=98%; zero cross-owner leakage/unauthorized writes/false-paid trên suite; >=95% completion ở happy paths đủ điều kiện; 100% recovery cases critical không duplicate mutation. Latency/cost đặt sau baseline đo trên region/model thật; đo p50/p95 riêng read-only, retrieval, generation và mutation. Không hứa “real time” khi chưa đo.

### Suite cần chạy từng pha

- Unit: chunk boundaries/table/unit/overlap/multi-chunk; VI/EN; router/registry; approval hash/version/expiry; compaction provenance; budget reservation; output schema.
- Rules/API: guest denial, owner/role isolation, locked/revoked role, recent MFA, no direct client writes, cannot guess another object, malicious filters/tool args.
- Integration: wrong stage, price/quote changes, concurrent carts/orders, pending/resume, duplicate webhook/out-of-order events, unauthorized invoice draft, failed one read with other results available.
- Browser: flow reference pages↔Ask parity; account switch while request in flight, two tabs, order switch, refresh, close/reopen, checkout return, 320/390/desktop, keyboard/zoom/reduced motion, empty/error/offline.
- Provider: generation/counting/model-region/usage/billed reasoning/output limits, transient/timeout/uncertain outcomes, cost reservation, App Check/IAM. CountTokens readiness không chứng minh generation/quality/cost success.
- Analytics: UI view không payment; missing events không zero/drop-off; event dedup/order/retention/opt-out; small-cohort privacy; business metric definitionVersion.

Source-verified command families cho implementation: `npm run typecheck`, `npm run lint`, scoped `./node_modules/.bin/vitest run tests/unit/...`, rules/http suite theo config đang được owner runtime duyệt, Playwright theo shared server. Không chạy ở plan này. Không tự dùng emulator helper có thể restart/reseed. Frontend chỉ **5207**, demo backend Auth19207/Firestore18207/Functions15207/Storage19208. Check listener/coordinate runtime trước bất kỳ test mutation hay restart; isolated fixture/runtime cần approval riêng.

## 11. Production, chi phí và rollback

Đánh giá risk: documentation LOW; routing/read MEDIUM; private reads/action approvals HIGH; payment/auth/IAM HIGH; destructive privacy/financial correction CRITICAL, chỉ kế hoạch có review.

Trước enablement: model/region/price envelope có expiry được duyệt, separate embedding/ingestion/generation/reranking budget; atomic reservation toàn app/per-account/run và kill switch. Unknown outcomes không tự release reservation hoặc retry charge; reconciliation policy cần proof. Giữ read-only deterministic paths hoạt động khi model unavailable.

Deploy allowlist từng slice; so exact source vs artifact, không deploy toàn dirty tree. Knowledge generation pointer có rollback nhưng tombstones/unpublish vẫn thắng; rolling back index không được làm policy bị thu hồi xuất hiện lại. Disable capability/paid admission để giảm tải; không xóa pending operations/durable audit. Đã commit giao dịch thì rollback code không đảo giao dịch; compensating action theo domain và người có quyền.

Canary theo tập account đã duyệt, mở read-only trước rồi nhóm customer actions. Mỗi nhóm cần đủ live evidence own flow và error/recovery; audit logging metadata không raw prompt/recipient. Tách concurrent active runs, quota, source freshness, retrieval miss, tool denied, conflict, pending age, budget held và provider errors để operator hiểu.

## 12. Review và điểm cần owner chốt

Những quyết định cần trước code: service/policy owner và effective rules; capability denominator + mục tiêu release; named role matrix; deployment boundary; provider model/region/budget hiện hành; corpus/index backend sau benchmark; consent/retention; service SLO sau đo. Plan đặt default an toàn, không suy approval từ diagram share.

Plan review cycle 1: requirement match, current source/WIP, scope/risk, domain semantics, chunking/retrieval, privacy/approval, failure/recovery, implementation dependencies, validation và rollout đã rà. Findings đã đưa vào plan: pilot mới làm hiện trạng thay đổi; refund request là staff-only; return chỉ qua proposal/staff; cart không combined payment; policy docs chưa có approval/effective metadata; character-window không token bound; metrics/thresholds chỉ là candidate. Chưa có finding chưa xử lý trong phạm vi planning review. Implementation review/provider/browser/tests **NOT_RUN**, implementation handoff **NOT_READY**; runtime ledger receipt không có. Tokens/actual billed cost: Unavailable. Memory candidates: None.

## 13. Tham khảo kỹ thuật đã kiểm tra

- [Firestore vector search](https://firebase.google.com/docs/firestore/vector-search): vector query và prefilter; không tự cung cấp toàn bộ hybrid search hay application authorization.
- [RAG chunk transformations](https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/rag-engine/fine-tune-rag-transformations): chunk size/overlap có thể cấu hình; số khởi đầu trong plan phải benchmark trên corpus SatsunicGo.
- [Genkit interrupts](https://genkit.dev/docs/js/interrupts/): pause/resume cho human input; không thay backend authorization/version checks.

**Approval boundary:** tài liệu này chỉ chuẩn bị kế hoạch. Triển khai phải có approval theo từng phạm vi/file map, delta review nếu đổi nghiệp vụ/API/data/dependency/infra. Không có approval implementation hoặc deployment phát sinh từ lượt “lên plan, không chỉnh code” này.
