# Ask

**Bản vá cleanup đã áp dụng và qua review độc lập. Gói review phần còn lại đã chuẩn bị. Production: NOT_READY.**

Xem [gói review chung](APPROVAL-PACKET.md) trước; có thiết kế VI/EN, nội dung knowledge, feedback, context/learning và kế hoạch live/artifact/rollback. Các mục owner cần chốt được ghi cụ thể, không hỏi lại theo từng agent.

## Code đã hoàn thành

Chỉ sửa scripts/release/artifact.mjs và tests/unit/release108.test.mjs, đúng patch r6 đã review: thêm cleanup vào hold, giữ bảy holds cũ và các endpoint feedback còn lại.15regressions mới, một expected hold count7→8. Baseline16paths không có drift ngoài đúng hai file;493source/config/test diagnostic inputs hiện vẫn khớp.

| Kiểm tra | Kết quả | Giới hạn |
| --- | --- | --- |
| Actual Node contracts |58/58PASS |45release+13public config; synthetic package/shapes |
| Related unit suites |155/155PASS,8files | Local source logic, không live/backendE2E |
| Scoped lint/syntax |PASS,exit0 | Hai file applied |
| Backend diagnostic compile |PASS,exit0 | Output private tmp, no generated-source mutation |
| Frontend typecheck |PASS,exit0 | Không application layout change |
| Source preflight |PASS,93exports | Production readiness của preflight vẫn NOT_READY |
| Current compiled transform |8held/85remaining,6feedback endpoints giữ nguyên | No module/scheduler invocation, no release archive |
| Independent applied review |PASSED_APPLIED_TWO_FILE_IMPLEMENTATION | Seven scoped dimensions/eight operator principles; overall BLOCKED |

[Application receipt](APPLICATION-r1.json), [checks r4](CHECKS-r4.json), [review](REVIEW-r1.json), [operator output](OPERATOR-OUTPUT-r1.json), [Product Content](PRODUCT-CONTENT-HOLD-r1.md), [code-quality review](CODE-QUALITY-REVIEW.md).

Không claim helper giải quyết dynamic aliases/computed calls/whole-program effects. Packaging hold không tắt scheduler đã deploy. Một diagnostic first attempt dùng sai tên endpoint; harness được sửa sau đối chiếu inventory, không phải lỗi application. Approval validator vẫn chỉ nhận READY; policy cho DEGRADED fallback. Đã giữ truthful state, xác minh paths/baselines/patch/candidate thủ công; không sửa guard hoặc forge READY.

## Panel để duyệt

R4prototype riêng giữ bản gốc/r2/r3 nguyên vẹn. Hai lỗi đầu là locale switch xóa history guard và waypoint Review details trỏ tới câu hỏi giá. Review độc lập tiếp tục tìm hai lỗi: chat tạo first review bị ẩn sau đóng form và placeholder EN bị cắt ở320px. R4mở đúng review trước khi consent, chặn hidden approval và dùng Ask anything…. [Thiết kế và bản xem](PANEL-DESIGN-r4.md).

Root chạy30distinct scenarios×4widths×2locales=240runs,240/240PASS; no page/console errors, GET-only. Bảy expected baseline assertions tái hiện năm prototype defects; candidate errors0, baseline native focus errors giữ riêng. Lượt r3a đầu bị harness setup failure sau12partial passes; giữ receipt/log riêng, không tính vào completed run. Form scroll giữ composer/footer/chat; chat edits giữ notes; native validation, current/history/decline/question/conditional/mixed/duplicate và closed-view flows đã kiểm tra.

[Browser receipt](PANEL-BROWSER-r4.json), [fresh screenshots](PANEL-SCREENSHOTS-r4.json), [Product Content proxy](PRODUCT-CONTENT-PANEL-r4.md). Root xem ảnh actual320EN/1440VI; specialist chỉ đọc source/ảnh theo phạm vi. Review cycle2 tìm form invalid bị kiểm tra khi còn ẩn; r4mở editing trước validation, giữ notes/stage và focus đúng field,96additionalclosed-invalid casesPASS. Không thêm/restart server. Đây không phải actual app/LLM/provider/order/payment/integration/performance acceptance; native zoom, AT audio, other browsers/device chưa chạy.

[Addendum tích hợp](PANEL-INTEGRATION-ADDENDUM.md) đóng năm khoảng trống frontend-plan: owner-bound draft riêng với version/auth authority; admission trong queue/saveTurn; shared pending recovery/task switching; history guard tới embedded controls; focus và scroll ownership. Đây là kế hoạch đã bổ sung, không phải runtime bugs đã fix/test. Application source không đổi.

## Knowledge, context và learning

[Business packet](BUSINESS-PACKET-r1.md) chuẩn bị exact ba đoạn VI từ source về catalog/custom/pending-refund, metadata admission và feedback30days scoped. Chưa có publication/hash/version/effective window thật, chưa owner-approved corpus/policy. Không invent điều kiện legal, phí, ETA, seller assurance hay hiện trạng payment.

Source thực tế: customer guidance trả4excerpts, evaluator dùng8và chỉ checks IDs/text; pilot context OWNER giữ typed snapshot/stamp và exact serialized provider counting. [Kế hoạch context](KNOWLEDGE-CONTEXT-PLAN.md) tách retrieval, generated answer và command authority, colloquial/typo/corrections/false-premise cases. Feedback review/evaluation manual, không train hoặc auto-promote.12KPcases còn synthetic candidates; trước đo phải bind approved corpus và frozen oracle. Max1diagnostic6/7 ở đợt trước không được nhận là LLM/production bug hoặc full PASS.

## Live và production

Gemini thêm0paid calls; ledger50.000₫reserved giữ nguyên; actual billed cost Unavailable. Old provider333tokens không chứng minh chi phí hoặc current app acceptance. Metadata provider17:26 ở đợt trước là evidence lịch sử, không fresh readback đợt này. Backend review xác định production admission vẫn fail-closed sau reconciliation: import tối thiểu50.000₫và reservation mới25.000₫không thể cùng nằm trong ceiling50.000₫. 50.000₫là ngân sách thử live, không cấp ongoing customer paid budget/replenishment. Muốn dùng ngân sách còn lại sau settlement cần delta accounting/admission riêng được review; chưa áp dụng, không reset/release dự phòng.

Shared frontend5207alive; Auth19207/Functions15207không listener ở check đợt này, không tự restart/reseed. Full actual-handler/authenticated E2E chưa chạy. WIP đồng thời chưa được chọn vào release candidate; chưa tạo immutable release artifact, provider source binding hoặc deployment.

[Live/release plan](LIVE-RELEASE-PLAN.md) bao gồm154existing scenario targets(79platform+75purchase), tiered execution, billing windows, accounting/admission delta, identity/configuration/holds, candidate selection, build-once/checksum, provider inventory/readback, rollback/reconciliation.154là inventory, không completion score. Current app/domain/live/policy gates chưa được thay bằng prototype hoặc unit results.

## Review cycles và governance

Previous cleanup proposal r1→r6 sửa5defects, preserved red/green receipts. Applied cycle1 độc lập PASSED, exact patch hashes unchanged. Static preview baseline2fail→r2candidate88pass; package cycle1 CHANGES_REQUESTED cho hidden first review, clipped EN placeholder và settlement≠admission. Đã sửa proposal/plan, tái hiện red và chạy r3candidate144pass; cycle2 CHANGES_REQUESTED cho hidden-invalid recovery và verification-only budget scope. Root xác minh2red và r4candidate240pass, cập nhật budget proposal; cycle2record trước green không bị sửa. Product proxy r4 có8principles. Fresh package review ghi riêng theo current frozen inputs; overallNOT_READY giữ nguyên.

Repository Intelligence DEGRADED: initial healthy/stale, một refresh0, CodeGraph/CocoIndex queries và native source/hash/compilers/tests. Không nâng stale evidence thành current assurance. Profiles/language/platform được ghi trong code-quality review. Root sole protected-source writer/executor; BA nguồn/nghiệp vụ, UX source observations only/formalQA NOT_RUN, frontend source integration-plan audit, backend source/budget audit và TL independent review. Năm specialists có handoff riêng; không gán root jobs cho họ. Agent handoffs có bounded hashes/leases; không gán root tests cho agent chưa chạy.

HEAD53d59bd88fa7da9d1243692336ecd09b6540ea31, dirty WIP preserved. Không commit/push/PR/Jira/deploy, production write/payment/deletion, secret access, paid dispatch, runtime restart/reseed, dependency/schema/API/CI/generated-source edit. Proposed HTML được serve local để review, không nhập application.

Runtime adapter/weighted progress/provider token usage/API-equivalent cost/actual billed cost: Unavailable. Root dùng hashed manual receipts; không suy zero hoặc completion percentage. Memory candidates: None; không ghi memory. Đây là completed applied slice + reviewable preparation, không phải successful production handoff.

Phạm vi tiếp theo cần review theo [final-implementation-review](../../../../.ai/skills-src/final-implementation-review/SKILL.md): “Stop and request delta approval for material scope drift.” Panel/context/accounting/activation rộng hơn exact applied two-file patch cần bind quyết định với plan/candidate thật; policy và metadata chưa biết không được tự điền. Gói hiện đã chuẩn bị các quyết định cùng một lần, không mở lại câu hỏi cleanup.

Capture evidence: lượt r4đầu target-crash trước trang thứ8, giữ7ảnh thật và failure receipt; chỉ chụp lại1440EN còn thiếu. PANEL-SCREENSHOTS-r4.json đối chiếu đủ8capture/hashes; copies lưu dưới screenshots-r4. Không tính failed capture attempt là một lượt thành công hoặc suy lỗi application từ lỗi newPage.
