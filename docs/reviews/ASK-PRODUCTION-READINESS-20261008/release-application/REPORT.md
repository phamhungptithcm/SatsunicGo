# Ask — áp dụng bản vá release

**Production: NOT_READY.** Approval mới đã được thực hiện trong đúng hai file parser/tests. Source preflight thực tế đã pass; review độc lập mới nhất xác nhận phần code trong phạm vi **PASSED**. Đây là báo cáo áp dụng bản vá local, không phải xác nhận đã phát hành Ask.

## Thay đổi

Áp dụng đúng combined patch đã review trước đó vào `scripts/release/preflight.mjs` và thêm21 ca regression vào `tests/unit/release-preflight067.test.ts`. 25 ca cũ/helper giữ byte-identical. Parser nhận đúng module/kind cho Firestore triggers; resolve direct relative imported static options; giữ region, Hosting HTTP-kind, path, cycle và mutation/escape guards. Không execute source modules.

Lint trực tiếp script phát hiện8 lỗi baseline do globals process/console chưa import. Thêm đúng hai import `node:process` và `node:console` trong cùng file. Đây là correction nhỏ trong phạm vi đã duyệt, được technical lead xác nhận; không thêm package, contract, permission hoặc thay đổi output/activation. Không sửa rule/validator để làm gate xanh.

Final script SHA `2f80ce7fcd20963be28c814f948a6d0dad3534d987630ef31a48476cc43eb57c`; test SHA `e6081cc47b0874c8d30ecff04a228249044e5e2dbdc5c7024ea0f4a3491edfc5`. Bỏ đúng hai import mới sẽ khôi phục candidate được duyệt `9b23678d…`. [APPROVAL.md](APPROVAL.md), [APPLICATION.json](APPLICATION.json), [TEAM-BRIEF-r3.json](TEAM-BRIEF-r3.json) và [QUALITY-FIX.patch](QUALITY-FIX.patch) ghi provenance.

## Kiểm chứng source cuối cùng

| Kiểm tra | Kết quả | Giới hạn |
| --- | --- | --- |
| Source preflight thực tế | **PASS**,93 Functions,errors[] | Source inventory; build/provider/public config vẫn chưa được chứng minh |
| Regression preflight | **46/46 PASS** | Gọi actual repo script/tests;25 cũ+21 mới |
| Unit toàn repo | **1.245/1.245 PASS**,129files | 209 là aggregate suites kể cả nested groups; không phải209files |
| Node release/artifact/public-config | **43/43 PASS** | Synthetic fixture; không tạo current production artifact hoặc gọi provider |
| Scoped/full lint | **PASS** | Script/tests và toàn src/domain/functions/tests, không suppress lỗi |
| Compiler/syntax/whitespace | **PASS** | Frontend tsc,Node --check,git diff --check exit0 |
| CLI sai project/argument | **Từ chối đúng** | Exit1; project REJECTED, không echo input; usage message giữ nguyên |

Current full-unit run: `output/ask-hardening/2026-10-08T17-08-48-188Z`; sourceStable=true,680files post-run drift[]. Snapshot này không bao gồm release script, nên có hash hai file riêng chụp ngay sau dispatch và đối chiếu sau chạy; không khẳng định đó là pre-dispatch freeze toàn script. [CHECKS-r2.json](CHECKS-r2.json) là receipt hiện tại; r1 giữ nguyên với correction giải thích nhầm count209suites/129files. Lần assertion post-apply đầu nhầm script có trong unit snapshot đã được sửa bằng intersection đúng và protected-hash snapshot riêng; hai candidate hashes luôn khớp, không rewrite source để che failure.

Câu diagnostic mới trong CLI `limits` có [PRODUCT-CONTENT-REVIEW.md](PRODUCT-CONTENT-REVIEW.md): đủ tám principle, target Node CLI và actual positive/reject/usage context. Không đổi customer UI/locale/layout; không claim Apple HIG, AT audio, browser/device hoặc live quality.

57ca demo và4ca browser ở wave trước không chạy lại vì backend/UI source giữ hash; chúng là evidence lịch sử có phạm vi, không phải43/1245 ca mới hay production proof. Fullunit46 là subset trong1245, không cộng lại thành số unique tests.

## Review và ranh giới phát hành

Root là sole writer/executor; backend review consumer read-only; technical lead review độc lập. Các handoff frontend/business/UX trước được giữ nguyên, không ghi họ vừa chạy lại tests. Không còn executor giữ runtime. [CONSUMER-REVIEW.json](CONSUMER-REVIEW.json) xác nhận inventory contract, artifact guard và verify-production consumers tương thích với Firestore kinds.

Cycle1 [REVIEW-r1.json](REVIEW-r1.json) ghi finding8 lỗi lint baseline và correction hai import; current checks đã rerun. Fresh [REVIEW-r2.json](REVIEW-r2.json) đã review complete current diff/hashes, đủ bảy dimension và tám principle cho operator-content. TL-APP-01 lint và TL-APP-DOC-01 count files/suites đã được sửa, kiểm chứng. Không còn actionable finding trong scoped implementation; overall vẫn BLOCKED vì production gates còn thiếu. Parent directory giữ nguyên bốn cycle proposal, ba finding mutation/shadow/fixture và meaningful red/green proof; không sửa lịch sử.

**Gate production bổ sung, confidence HIGH:** `askFeedbackCleanup` hiện không nằm trong seven `HELD_EXPORTS`. Nếu deploy current source inventory, scheduler sẽ gọi purge các record hết hạn mỗi60phút. Không có settings.enabled guard ở scheduler; batch có update-time checks nhưng điều đó chưa cung cấp retention/rollout authority. Vì vậy cần candidate/hold/retention decision riêng trước phát hành. Không chỉnh holds/lifecycle trong approval chỉ dành cho parser/tests; không push/main hoặc deploy từ dirty WIP. Parser pass chỉ gỡ local inventory blocker.

Các gate trước vẫn còn: official policy/corpus/holdout admission; điều kiện đổi trả/hủy/hoàn tiền/privacy; retention30ngày; live authenticated/AppCheck/web/LLM/task acceptance; exact tested artifact/source/provider binding; reviewed rollout/rollback; pending action-window/waypoint/contextual-consent layout. Human `Approved` được gắn với câu hỏi release patch gần nhất, không được suy thành phê duyệt mọi câu hỏi khác. Xem [quyết định còn thiếu](../OWNER-DECISIONS.md).

## Governance, Git và usage

Repository Intelligence **DEGRADED**: healthy nhưng stale; bounded refresh thất bại ở quyền daemon.log. CodeGraph/CocoIndex được query trước/sau; source/compiler/actual tests/hash là critical truth. Không forge READY. Legacy approval validator vẫn hardcode READY nên trả fail dù có human approval; record lỗi và manual exact-path/hash/human check theo explicit AGENTS.md/workflow cho phép tiếp tục DEGRADED. Không sửa governance tooling hoặc coi validator đã pass.

Quality profiles: universal,typescript-javascript,devops; product-content cho một operator-visible sentence. Node22.23.3/TypeScript6.0.3/Vitest4.1.11 lấy từ local runtime/package. Không đổi dependencies/CI/runtime config/API/DB hoặc generated files. Synchronous AST/read path là CLI, không thêm vào latency-sensitive request handler;128-module/4MiB-file bounds giữ nguyên. Không claim speedup/full-program effect proof.

HEAD `53d59bd88fa7da9d1243692336ecd09b6540ea31`. Concurrent dirty WIP được giữ; scoped source drift chỉ đúng hai file đã duyệt. Không commit/push/PR, production artifact build/deploy, restart/reseed, production settings/data/payment hoặc secret access. Gemini ledger thật hash không đổi; **paid calls thêm:0**, actual billed cost **Unavailable**.

Runtime ledger adapter/token usage/actual cost/API-equivalent estimate/weighted-progress weights: **Unavailable**. Tool receipts/manual report ghi kết quả thật; không dựng runtime ledger hoặc phần trăm. Completed criterion: applied parser/tests, local preflight, regression/consumer/fullunit/static checks. Independent final review của scope đã hoàn thành/PASSED; remaining criteria là các production gates liệt kê trên. Memory candidates: **None**; không ghi durable memory.
