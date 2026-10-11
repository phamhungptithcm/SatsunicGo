# Ask acceptance scenarios

Synthetic policy data is explicitly QA-only. SOURCE_LOCAL verifies functions/contracts. Actual-handler demo verifies handler logic/Firestore, using crafted callable auth. Fixture browser verifies actual components with synthetic auth/API. None replaces live provider/App Check/production acceptance.

This inventory covers the full target journey and exposes remaining implementation gaps. A missing capability is NOT_RUN/NOT_IMPLEMENTED, never converted to PASS by fixtures. Read REAL-SCENARIOS.json for exact test/plan references. No completion percentage is inferred.

## Run the current executable loop

Use installed Node22 with `scripts/ask-hardening-scenarios.mjs --all-local`, `GCLOUD_PROJECT=demo-satsunicgo`, `FUNCTIONS_EMULATOR=true`, `FIRESTORE_EMULATOR_HOST=127.0.0.1:18207`. Shared frontend must already be running on 5207. Runner never starts/restarts/reseeds it. Individual phases: --unit, --demo, --browser. Provider and production are excluded explicitly.

Each run writes source.json (SHA256 code/test/config snapshot), unit.json, demo.json, browser.json and summary.json in a unique output/ask-hardening/run timestamp. Source drift invalidates a phase as STALE. Failure stops dependent phases, whose status stays NOT_RUN. Fix reproduced findings, rerun affected phase, then a fresh bounded review. Avoid unbounded repeat runs after the candidate has passed unless a change/failure justifies them.

## Inventory

| ID | Trigger, happy or bad case | Required behavior | Current proof scope |
|---|---|---|---|
| LANG-01 | Có dấu, không dấu, NFD, hoa/thường | Trả nguồn cùng chủ đề; giữ câu hỏi gốc | SOURCE_LOCAL |
| LANG-02 | Lỗi gõ một ký tự | Chỉ mở rộng khi một cách sửa; ưu tiên từ chính xác | SOURCE_LOCAL |
| LANG-03 | Viết tắt hoặc chỉ nói “cái đó” | Không giả vờ có nguồn; cần làm rõ tham chiếu | SOURCE_LOCAL |
| LANG-04 | Hai mục đích: shipping và membership | Giữ nguồn của cả hai việc | SOURCE_LOCAL |
| CHUNK-01 | Đoạn dài, emoji, dấu tổ hợp | Bounded, tiến về trước, không khoảng trống; source offsets nguyên bản | SOURCE_LOCAL |
| CHUNK-02 | Dòng bảng nhiều trường dài | Header/unit đi cùng dòng; không mảnh overlap mất header | SOURCE_LOCAL |
| CHUNK-03 | Điều kiện và ngoại lệ nhiều đoạn | Không viết lại nội dung; kiểm đủ spans có liên quan | SOURCE_LOCAL |
| CHUNK-04 | Hơn 100 nguồn/20k ký tự, maximum không hợp lệ | Giữ giới hạn; no-match không chứng minh không có policy | SOURCE_LOCAL |
| AUTHORITY-01 | OWNER+MFA duyệt rồi Ask hỏi | Chỉ quote nguồn hiện hành, citations đúng, không phát sinh đơn/thanh toán | ACTUAL_HANDLERS_DEMO_FIRESTORE_SYNTHETIC_AUTH |
| AUTHORITY-02 | Nguồn đổi nội dung, draft hoặc bị xóa | Hash/revision cũ không dùng được | ACTUAL_HANDLERS_DEMO_FIRESTORE_SYNTHETIC_AUTH |
| AUTHORITY-03 | Future/expired/revoked/corrupt/locale khác | Không dùng làm nguồn hiện hành | ACTUAL_HANDLERS_DEMO_FIRESTORE_SYNTHETIC_AUTH |
| AUTHORITY-04 | Hai publication cùng citation khác nội dung | Loại nguồn mơ hồ, không tự chọn chính sách | ACTUAL_HANDLERS_DEMO_FIRESTORE_SYNTHETIC_AUTH |
| AUTHORITY-05 | Guest/password/unverified/locked/MFA thiếu | Từ chối ở server | ACTUAL_HANDLERS_DEMO_FIRESTORE_SYNTHETIC_AUTH |
| AUTHORITY-06 | Input lớn, scope giả, quota, cancel | Không dispatch/không trả evidence sai; quota được kiểm tra | ACTUAL_HANDLERS_DEMO_FIRESTORE_SYNTHETIC_AUTH |
| STREAM-01 | Enter/nút gửi; lặp Enter | Một request; không trùng submit | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| STREAM-02 | Stream có answer nhưng final sai/provider lỗi | Không hiện answer chưa xác minh; có retry | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| STREAM-03 | Đóng panel/cancel khi pending | Dừng generation; không tuyên bố rollback tác vụ đã commit | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| STREAM-04 | Soạn lượt tiếp khi pending, reduced motion, mobile | Giữ bản nháp, hoạt động bàn phím và layout | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| PROFILE-01 | Lưu bình thường; response mất; exact retry | Một ghi/audit, đúng owner/version | DEMO_AND_FIXTURE_BROWSER |
| PROFILE-02 | Reload khi đã commit hoặc chưa commit | Đối chiếu explicit, không tự ghi lại; chặn request cũ đến muộn | DEMO_AND_FIXTURE_BROWSER |
| PROFILE-03 | Hai lần đồng thời, storage hỏng/deny, lock | Admission fail closed; không tạo duplicate | DEMO_AND_FIXTURE_BROWSER |
| PROFILE-04 | Đổi account và callback tới muộn | Không hiển thị private state user trước | DEMO_AND_FIXTURE_BROWSER |
| MEMBER-01 | Paid/free và replay | Paid chỉ invoice pending; free không kéo dài term qua replay | DEMO_AND_FIXTURE_BROWSER_WITH_RELOAD_GAP |
| MEMBER-02 | Renewal response mất, snapshot đổi intent | Retry nguyên action/opId, không tự đổi tác vụ | DEMO_AND_FIXTURE_BROWSER_WITH_RELOAD_GAP |
| MEMBER-03 | Foreign/paid cancel, privileged action, locked | Server từ chối | DEMO_AND_FIXTURE_BROWSER_WITH_RELOAD_GAP |
| MEMBER-04 | Plan/result/date/state sai; snapshot fail | Không giá giả/entitlement giả; clear private state và chặn writes | DEMO_AND_FIXTURE_BROWSER_WITH_RELOAD_GAP |
| MEMBER-05 | Reload toàn trang sau kết quả chưa rõ | Durable membership recovery chưa triển khai; ca này NOT_RUN | DEMO_AND_FIXTURE_BROWSER_WITH_RELOAD_GAP |
| DRAFT-01 | SaveDraft submit custom một lần, resume completed | One operation/order, không tạo tiền paid | ACTUAL_HANDLERS_DEMO_FIRESTORE_SYNTHETIC_AUTH |
| DRAFT-02 | Tampered replay/stale version/foreign resource/corrupt recovery | Từ chối và không thay đổi domain state | ACTUAL_HANDLERS_DEMO_FIRESTORE_SYNTHETIC_AUTH |
| DRAFT-03 | Account lock sau thành công | Không replay dữ liệu private | ACTUAL_HANDLERS_DEMO_FIRESTORE_SYNTHETIC_AUTH |
| CONTEXT-01 | “Còn cái đó?”, nhiều đối tượng đang chọn | Hỏi rõ nếu mơ hồ; bind object+turn provenance | PARTIAL_SOURCE_LOCAL_FULL_CONVERSATION_NOT_RUN |
| CONTEXT-02 | Khách sửa thị trường/quantity ở lượt sau | Correction thắng intent cũ; tính lại live facts | PARTIAL_SOURCE_LOCAL_FULL_CONVERSATION_NOT_RUN |
| CONTEXT-03 | Đổi đơn, account, pending approval | Không mang private facts/approval qua phạm vi khác | PARTIAL_SOURCE_LOCAL_FULL_CONVERSATION_NOT_RUN |
| CONTEXT-04 | History dài hoặc chứa “ignore rules” | Compaction giữ pending task/citations, không trao quyền từ history | PARTIAL_SOURCE_LOCAL_FULL_CONVERSATION_NOT_RUN |
| CATALOG-01 | SKU/variant/orderable/current price | Đúng product/version; một payment upfront | SOURCE_LOCAL_DOMAIN_ONLY_FULL_ASK_NOT_RUN |
| CATALOG-02 | Không match trong bounded catalog | Không suy ngoài catalog; hướng về catalog hoặc làm rõ | SOURCE_LOCAL_DOMAIN_ONLY_FULL_ASK_NOT_RUN |
| CATALOG-03 | Cart nhiều sản phẩm/revision đổi/checkout response mất | Không gom payment sai; one operation per accepted command | SOURCE_LOCAL_DOMAIN_ONLY_FULL_ASK_NOT_RUN |
| SHIPPING-01 | Có route+weight hợp lệ | Tính bằng rate hiện hành, unit/currency rõ | SOURCE_LOCAL_DOMAIN_ONLY_PROVIDER_NOT_RUN |
| SHIPPING-02 | Thiếu route/weight/rate unavailable | Clarify/quote_required, không giá 0 giả | SOURCE_LOCAL_DOMAIN_ONLY_PROVIDER_NOT_RUN |
| SHIPPING-03 | Estimate/missing tracking | Không ETA/delivery guarantee giả | SOURCE_LOCAL_DOMAIN_ONLY_PROVIDER_NOT_RUN |
| OWN_ORDER-01 | Chọn đúng order của khách | Current owner-scoped state/paymentDue | SOURCE_LOCAL_FULL_AUTHENTICATED_FLOW_NOT_RUN |
| OWN_ORDER-02 | Quên ID, nhiều ID, ID Unicode/confusable | Picker hoặc clarify; không chọn gần giống | SOURCE_LOCAL_FULL_AUTHENTICATED_FLOW_NOT_RUN |
| OWN_ORDER-03 | Order/account switch khi read in flight | Discard late result, không private leak | SOURCE_LOCAL_FULL_AUTHENTICATED_FLOW_NOT_RUN |
| PAYMENT-01 | Accept quote/final đúng version rồi checkout | Domain state và provider workflow quyết định | LIVE_PROVIDER_NOT_RUN |
| PAYMENT-02 | Quote thay đổi/duplicate webhook/out-of-order/lost response | Không double charge; reconcile unknown | LIVE_PROVIDER_NOT_RUN |
| PAYMENT-03 | Chat nói đã trả hoặc gửi receipt | Không tự đánh dấu paid; không yêu cầu secret/receipt trong chat | LIVE_PROVIDER_NOT_RUN |
| SUPPORT-01 | Gửi/reply theo đúng owner/context | Persist message một lần, không suy thành staff đã xử lý | SOURCE_LOCAL_FULL_PANEL_FLOW_NOT_RUN |
| SUPPORT-02 | Foreign ticket/order, locked, duplicate/lost response | Server access+idempotency; recovery rõ | SOURCE_LOCAL_FULL_PANEL_FLOW_NOT_RUN |
| CHANGE-01 | Khách yêu cầu hỗ trợ hoặc phản hồi proposal hợp lệ | Đúng owner/stage, preview consequences | SOURCE_LOCAL_FULL_ASK_ACTION_NOT_RUN |
| CHANGE-02 | Gọi staff refund/return/apply hoặc state đổi | Từ chối; request không bằng refund đã xong | SOURCE_LOCAL_FULL_ASK_ACTION_NOT_RUN |
| DOCUMENT-01 | Đọc/mở/tải hóa đơn của mình | Issued/current access, đúng amount/currency | SOURCE_LOCAL_FULL_PANEL_FLOW_NOT_RUN |
| DOCUMENT-02 | Draft/foreign/revoked link/request chưa issued | Không giả hóa đơn đã phát hành; quyền kiểm tại server | SOURCE_LOCAL_FULL_PANEL_FLOW_NOT_RUN |
| STAFF-01 | Quote/procurement/warehouse theo assigned role | Server role+assignment+recent MFA đúng | FULL_ASK_STAFF_FLOW_NOT_RUN |
| STAFF-02 | Customer giả role, role thu hồi giữa approval/execute | Không cấp quyền từ LLM; deny/review lại | FULL_ASK_STAFF_FLOW_NOT_RUN |
| MEMORY-01 | Opt-in preference, sửa/xóa, history dài | Purpose/provenance/TTL rõ; pending không mất | NOT_IMPLEMENTED_NOT_RUN |
| MEMORY-02 | Không opt-in, đổi account, user correction | Không suy gender/wealth/health; không memory leak | NOT_IMPLEMENTED_NOT_RUN |
| ANALYTICS-01 | Đủ events, cohort và định nghĩa metric | Aggregate có coverage/definitionVersion/staff review | NOT_IMPLEMENTED_NOT_RUN |
| ANALYTICS-02 | Missing/duplicate/out-of-order/opt-out/small cohort | Không synthetic zero/dropoff, không tiết lộ PII | NOT_IMPLEMENTED_NOT_RUN |
| PROVIDER-01 | Model/region/countTokens/grounded answer valid | Budget reserve, citations-to-revision, factual support eval | PROVIDER_AND_PRODUCTION_NOT_RUN |
| PROVIDER-02 | Timeout/transient/uncertain billing/expired budget | Fail closed; không blind retry/spend | PROVIDER_AND_PRODUCTION_NOT_RUN |
| PROVIDER-03 | Semantic retrieval/index incomplete/stale/revoked | No stale policy, calibrated benchmark và tombstone | PROVIDER_AND_PRODUCTION_NOT_RUN |
| PROVIDER-04 | Authenticated App Check production canary/rollback | Exact source-artifact; guard trước recovery; retain fences | PROVIDER_AND_PRODUCTION_NOT_RUN |
| MEMBER-RELOAD-01 | Mất phản hồi mua gói có phí rồi reload | Khôi phục cùng operation/action/planId; không tự gửi hoặc tạo yêu cầu mới | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-02 | Mất phản hồi kích hoạt miễn phí rồi reload | Giữ operation cũ, không cộng thêm kỳ hạn hay báo đã chuyển tiền | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-03 | Mất phản hồi gia hạn rồi reload | Retry ý định gốc, không tự thu tiền hoặc mở rộng kỳ hạn | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-04 | Mất phản hồi hủy yêu cầu mua gói rồi reload | Retry cùng invoiceId và operation, không hủy yêu cầu khác | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-05 | Retry trả state không hợp lệ | Giữ pending, không thành công hoặc tạo command mới | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-06 | Lần đầu không rõ kết quả; retry bị từ chối quyền | Không xóa operation vì có thể lần đầu đã commit | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-07 | Kết quả gia hạn thuộc UID khác | Không nhận thành công, giữ pending | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-08 | Envelope lưu bị lỗi hoặc có dữ liệu ngoài schema | Chặn command mới; không xóa record lỗi | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-09 | Trình duyệt không cho truy cập localStorage | Chặn dispatch, hiển thị đường xử lý | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-10 | Web Locks không có | Không dispatch khi chưa reserve bền vững | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-11 | Tab thứ hai mở khi tab một còn pending | Khôi phục operation gốc, không phát sinh operation mới | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-12 | Đổi tài khoản khi request đang chạy rồi quay lại | Không thông báo cho UID khác; UID gốc vẫn khôi phục được | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-13 | Live plan bị thay ID/tên/giá sau reload | Retry vẫn dùng original planId/operation; không lấy gói mới từ UI | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-14 | Khôi phục trên 390×844 | Recovery và retry đọc được; không overflow ngang | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-15 | Hai tab gửi yêu cầu đồng thời | Một reservation và một command; tab sau retry đúng operation | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-16 | Khôi phục sau reload ở CSS zoom 200% | Đặt lại zoom sau reload, assert mức thực và overflow, native Enter vẫn dùng được | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |
| MEMBER-RELOAD-17 | Reply hợp lệ nhưng không xóa được local pending | Không thông báo thành công hoặc giải phóng lệnh mới; exact retry sau reload | ACTUAL_COMPONENTS_SYNTHETIC_AUTH_API |

Current continuation: see SCENARIOS.md research/context/feedback matrix, REAL-SCENARIOS.json.latestContinuation and REPORT.md cycles26-30. Provider-only validation exists now, but general grounded service Q&A, automatic merchant research and production acceptance remain incomplete. The earlier inventory rows are historical target status; they are not a current full-pass claim.
