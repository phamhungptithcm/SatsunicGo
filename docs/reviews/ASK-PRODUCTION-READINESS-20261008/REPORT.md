# Ask — production readiness

**Production: NOT_READY.** Lỗi required label của Dashboard đã sửa và pass review độc lập. Bản đề xuất sửa preflight đã hoàn tất vòng review → fix → verify → review, sẵn để duyệt nhưng chưa áp dụng. Toàn bộ task vẫn **BLOCKED** vì còn quyết định chính sách, xác nhận live và phát hành.

## Phần đã hoàn thành

Chỉ thêm hai dấu required theo component dùng chung vào các label ngày UTC trong Dashboard. Native `required`, giá trị, handler, ý nghĩa UTC và phần Analytics đang làm song song đều được giữ. Baseline, patch và source manifest có trong [frontend/HANDOFF.md](frontend/HANDOFF.md). Dashboard hiện có SHA `ccca78132db14813cebbbaffc760925cda0bfd628df8760d13c87e1378b510ed`.

Năm specialist dùng cùng brief có hash và ownership rõ ràng: frontend sửa label/chạy browser; backend đọc metadata production và kiểm tra kế hoạch demo; business/product đối chiếu nguồn chính sách; UX đọc source/screenshot/AX độc lập; technical lead review độc lập. Root điều phối và chạy unit, lint, demo. Mỗi wave có tối đa root cùng hai specialist; chỉ một application writer. Tất cả lease đã trả. BA/UX không được ghi formal QA PASS từ index DEGRADED; chỉ những quan sát thực tế của họ được dùng.

## Kết quả kiểm chứng hiện tại

| Kiểm tra | Kết quả | Bằng chứng và giới hạn |
| --- | --- | --- |
| Unit toàn repo | **1.224/1.224 PASS**, 129 files, 22,66 giây | `output/ask-hardening/2026-10-08T15-31-18-551Z`; sourceStable=true, manifest 680 files không drift |
| TypeScript frontend/backend | **PASS** | Compiler exit 0; cùng source đang review |
| ESLint toàn src/domain/functions/tests | **PASS** | Exit 0; formatting phần sửa và `git diff --check` cũng pass |
| Browser cho label Dashboard | **4/4 PASS**, 9,8 giây | 320/390/1440/720 CSSpx; keyboard, native validation, accessible names, overflow |
| Unit required labels | **3/3 PASS** | Trước sửa 1 fail; fixture browser hiện tại cũng fail đúng thiếu hai marker khi replay baseline |
| Handler/rules demo | **57 ca chọn chạy PASS**, 12 ca không chọn | 19 profile/membership, 9 workflow, 10 knowledge, 19 research/context/feedback |
| Proposal preflight riêng | **46/46 PASS** | 25 ca cũ + 21 ca mới; nhận diện 93 source Functions; chưa sửa script repo |

[CHECKS-r2.json](CHECKS-r2.json) ghi hash và kết quả của application/demo. [QUALITY-GATES.json](QUALITY-GATES.json) ghi từng gate, phạm vi và giới hạn. Tests demo gọi actual handlers qua `.run` với auth fixture và Firestore rules đang cài; web transport được inject. Chúng chưa chứng minh Auth/AppCheck qua HTTP, chất lượng Gemini thật, merchant review/giá thật hoặc payment.

Lượt demo đầu trong sandbox bị dừng với exit 130 và không có test report; không tính là pass. Lượt chạy được phép kết nối emulator mới có receipts pass. Source được kiểm tra lại với manifest full-unit sau các checks. Snapshot demo nhỏ đầu tiên chụp ngay sau dispatch, không được dùng để khẳng định đã freeze toàn backend trước dispatch.

Hai-marker Product Language Gate có review đủ tám nguyên tắc và ảnh hiện tại. Root/TL đã xem ảnh; UX đối chiếu các widths và AX/interaction receipts. Chrome Date AX không cung cấp required property ở cả baseline và candidate; DOM required/valueMissing và tên field được kiểm tra. Screen-reader audio, native zoom, device và browser khác: **NOT_RUN**. 720 CSSpx chỉ là layout proxy cho 200%, không phải native zoom proof. Phần sửa này không chứng nhận toàn bộ sản phẩm Analytics.

## Dữ liệu demo và ngân sách

Chỉ tạo policy/ledger/holdout fixture tại năm path demo đang vắng; test vẫn từ chối nếu path đã tồn tại. Sau chạy, cả năm path đều vắng và có readback cleanup. Ba lượt admission knowledge vào quota demo tăng đơn điệu, không reset hoặc xóa counter. `retentionDays: 1` chỉ là fixture test, không duyệt hay bật retention 30 ngày.

Ledger Gemini thật không đổi: ngân sách 50.000₫ hiện đã reserved toàn bộ cho hai lượt thử trước. **Paid calls thêm trong wave này: 0. Chi phí thực tế: Unavailable.** Không giải phóng dự phòng hoặc suy ra khoản tiền còn dùng được khi chưa đối chiếu usage/billing.

## Review và bản vá release

Actual `scripts/release/preflight.mjs` vẫn **FAILED FUNCTION_INVENTORY_INVALID**: nó chưa hiểu Firestore triggers và imported static options của Analytics đang làm song song. Không bỏ các exports đó để làm gate xanh.

Bản vá cụ thể ở [RELEASE-DELTA-PLAN.md](RELEASE-DELTA-PLAN.md) và [RELEASE-APPLICATION.patch](RELEASE-APPLICATION.patch), gồm đúng script parser và 21 ca regression thêm vào test hiện có. `git apply --check` pass. 25 ca cũ/helper vẫn byte-identical. **Chưa áp dụng bản vá; chưa đổi CI, dependency, schema, Functions, generated files hay infrastructure.**

Bốn cycle được lưu nguyên trong [REVIEW-CYCLES.json](REVIEW-CYCLES.json):

1. Review phát hiện parser nhận cấu hình mutable nhưng vẫn đọc region ban đầu — TL-REL-01.
2. Sau fix, review phát hiện constructor bị shadow có thể che mutation — TL-REL-02; hai fixture bỏ mất exports nên có thể pass sai — TL-REL-03.
3. Fixture được sửa để giữ đủ ba public exports. Suite đúng tạo 12 fail trên r2; shadow case tạo 1 fail trên r3; r4 đạt 46/46. Cả ba finding được fix trong proposal riêng.
4. Review mới nhất xác nhận exact combined patch, source không drift và sửa count cũ trong report. Marker **PASSED**; proposal **PASSED_APPROVAL_READY_NOT_APPLIED**; overall vẫn **BLOCKED**, production **NOT_READY**.

Review mới nhất: [TL-REVIEW-r4.json](TL-REVIEW-r4.json). Không còn actionable finding trong phần marker/proposal đã review. Parser chỉ kiểm tra static uses trong các module đã parse; không chứng minh toàn bộ runtime side effects. Output và plan ghi rõ giới hạn này. Bản vá đang chờ câu trả lời duyệt; `accepted:true` của công cụ hỏi chỉ xác nhận câu hỏi đã gửi.

Các cycle trước của Ask được giữ trong `../ASK-PANEL-WORKCELL-20261008/REVIEW-CYCLES.json`. Sáu file Ask đã sửa ở wave trước vẫn cùng hash. 139 ca browser của wave trước là bằng chứng client lịch sử ở cùng owned source, không trở thành production proof.

## Những gì còn thiếu để production ready

| Điều kiện | Trạng thái hiện tại | Bước cần hoàn thành |
| --- | --- | --- |
| Nguồn chính thức cho Ask | **Chưa được owner duyệt/admit** | Chọn đúng nội dung, đưa vào resource hiện có, OWNER/MFA preview và duyệt contentHash/ngôn ngữ/thời hạn; freeze holdout |
| Đổi trả/hủy/hoàn tiền và privacy | **Nội dung công khai vẫn ghi chờ duyệt** | Owner cung cấp và duyệt điều kiện, đơn vị/liên hệ và phạm vi lưu dữ liệu |
| Feedback retention | **30 ngày đang đề xuất** | Trả lời câu hỏi đang pending; sau đó kiểm tra setting được phép và lifecycle live |
| Learning từ feedback | **Chưa chứng minh live** | Review feedback, nguồn/holdout được duyệt, evaluation và admission; không tự promote feedback thành câu trả lời chính thức |
| Release parser | **Actual gate đang fail** | Duyệt combined patch đã review, áp dụng, chạy checks và fresh review |
| Deployed Ask endpoints | **14 exports chưa quan sát ở region mục tiêu** | Chuẩn bị candidate đúng source và rollout được phép; đọc lại từng endpoint |
| Identity/AppCheck và nhiệm vụ live | **Chưa kiểm chứng** | Tài khoản/test data được phép, source/policy/endpoints đầy đủ; kiểm tra HTTP/task/web/LLM trong budget còn được xác nhận |
| Artifact và rollout | **Chưa bind current source** | Freeze đúng candidate, build/test exact artifact, duyệt rollout/rollback và readback |
| Action window, waypoints, contextual consent mới | **Plan/preview đang chờ duyệt** | Áp dụng sau câu trả lời cho câu hỏi đã gửi ở wave trước; kiểm tra UI/UX thực tế |

Metadata read-only tại `asia-southeast1` quan sát ba function `ask`, `askKnowledgeCommand`, `askKnowledgePreview`. 14 exports khác chưa được quan sát trong region đó; ba lượt describe riêng trả 404. Điều này không chứng minh vắng ở mọi region. Hosting đang báo v0.4.0 / b62d5cf. Request knowledge preview không đăng nhập trả 401 UNAUTHENTICATED; đây là một denial fence, không phải authenticated live acceptance. Functions source archive chưa download/so sánh với source hiện tại. [backend/PROVIDER-HANDOFF-r1.json](backend/PROVIDER-HANDOFF-r1.json) ghi evidence và giới hạn.

Đã đọc trực tiếp `/how-it-works`, `/terms`, `/privacy`. Payment-flow sections là candidate, không tự suy ra owner approval. `/terms` còn thiếu điều kiện đổi trả/hủy/hoàn tiền; `/privacy` còn chờ policy/liên hệ. Static HTML/extraction hash không thay thế normalized knowledgeSource approval hash. Source enum hiện chỉ nhận `posts`/`blogPublished`, nên các URL tĩnh chưa tự admit vào Ask. Tám semantic cases đã chuẩn bị và phân loại trong `KNOWLEDGE-HOLDOUT-CANDIDATE.json`; chưa là approved executable holdout hoặc measured LLM quality. [OWNER-DECISIONS.md](OWNER-DECISIONS.md) ghi phần cần chốt.

Cleanup feedback có source implementation nhưng deployment, backlog, physical deletion và backup timing chưa xác nhận. Production pilot và legacy nonproduction model fallback có coverage khác nhau; không khẳng định mọi Ask answer đều dùng corpus đã duyệt. Profile/Membership trong English shell, generic consent và giới hạn price preview ở report trước vẫn giữ nguyên phạm vi.

## Git, runtime và usage

HEAD `53d59bd88fa7da9d1243692336ecd09b6540ea31`; concurrent dirty WIP được giữ. Reuse frontend 5207 và Firestore 18207; không restart, reseed hoặc thêm server. Auth 19207/Functions 15207 không có listener ở preflight; không coi `.run` thành emulator HTTP proof. Không commit/push/PR/deploy, production write, payment, datafix, secret access hoặc permanent deletion.

Repository Intelligence: **DEGRADED**. CodeGraph/CocoIndex queries khỏe nhưng index stale; bounded refresh vướng quyền daemon.log. Đã tiếp tục bằng source, compiler, hash và tests, không đổi DEGRADED thành READY.

Runtime ledger adapter: **Unavailable**; báo cáo dùng tool metadata và hashed receipts, không tạo runtime receipt giả. Weighted progress, provider token usage, actual cost, API-equivalent estimate: **Unavailable**. Completed/remaining criteria thể hiện ở bảng trên; không dựng phần trăm khi chưa có weights. Memory candidates: **None**; không ghi durable memory.

Quy trình existing-system step 15 yêu cầu “Stop and request developer-team approval” cho release delta ngoài phần Ask/marker đã duyệt. Skill `final-implementation-review` ghi “A blocked handoff is not a successful final output.” Báo cáo này vì vậy là kết quả đang BLOCKED, không phải tuyên bố task đã done hoặc được phép deploy.
