# SatsunicGo — bộ scenarios toàn hệ thống

Bộ thiết kế QA có **477 scenarios**: 286 ca độc lập theo chức năng/nghiệp vụ, 46 integration, 33 security, 26 UI/UX, 23 performance và 63 endpoint contracts. Danh mục đối chiếu gồm **63 Firebase handlers**, **41 route wiring entries**, **235 source/config files** và **210 test files**. Tất cả scenarios và test references đang **NOT_RUN**. Đây là thiết kế kiểm thử theo source hiện tại, chưa chứng minh exhaustive branch coverage, ứng dụng đúng, provider hoạt động hoặc production sẵn sàng.

## Tài liệu và cách dùng

| File | Nội dung |
|---|---|
| [01-INDEPENDENT.md](01-INDEPENDENT.md) | Auth, public, catalog, custom request, báo giá, procurement, finance, changes, shipping, consolidation, returns, refunds, invoices, outbox, membership, reminders, profile, CRM, workspace, support, media, Ask, rates, content, banners, Studio, comments, audit, ops và helpers |
| [02-INTEGRATION.md](02-INTEGRATION.md) | Luồng xuyên UI → API → domain → transaction → projections → background workers; success, partial failure, concurrent và recovery |
| [03-SECURITY.md](03-SECURITY.md) | Rules/Admin SDK, auth, owner/role/assignment, MFA/AppCheck, injection, replay, privacy, abuse và provider holds |
| [04-UI-UX.md](04-UI-UX.md) | Responsive, keyboard/focus, screen reader, trạng thái, ngôn ngữ, consent, motion, print và eight principles |
| [05-PERFORMANCE.md](05-PERFORMANCE.md) | Latency, capacity, queries, memory, cache/listeners, contention, media, editor, stream và schedulers |
| [06-ENDPOINT-CONTRACTS.md](06-ENDPOINT-CONTRACTS.md) | Một contract envelope cho từng exported handler; không thay thế assertion của các action riêng |
| [07-ACTION-MATRIX.md](07-ACTION-MATRIX.md) | Từng command action được nhận diện từ schema/switch; variants và nhóm scenarios cần chạy |
| [TRACEABILITY.md](TRACEABILITY.md) | Routes/endpoints, module sources, test references và giới hạn inventory |
| [SCENARIOS.json](SCENARIOS.json) | Registry cố định của thiết kế, conditions/steps/oracle/source refs |
| [EXECUTION.csv](EXECUTION.csv) | Sheet ghi thực thi; thêm actual/evidence/owner/candidate/run_at, giữ registry gốc |
| [SOURCE_MANIFEST.json](SOURCE_MANIFEST.json) | Candidate commit cộng SHA256 từng source/test trong shared worktree |
| [validate.py](validate.py) | Kiểm tra IDs, CSV/JSON/Markdown, refs, action coverage và freshness; không chạy ứng dụng |
| [REVIEW.json](REVIEW.json), [TASK_REPORT.md](TASK_REPORT.md) | Review scoped tài liệu và bằng chứng validation; không là application acceptance |

## Phạm vi và căn cứ

Candidate ban đầu: commit `1d9c5824e5d0647948a1986dabc7480c4b7b8cb2` cộng hashes của dirty shared worktree. Framework đọc từ manifests: TypeScript 6.0.3, React 19.3.0, Vite 8.3.2, Firebase client 12.19.0, Functions v2, Zod 4.6.5, Vitest và Playwright. Versions là source snapshot, không là kết luận phiên bản mới nhất.

Repository Intelligence Gate vẫn **DEGRADED** sau một refresh: CodeGraph health passed nhưng metadata stale; CocoIndex search có response nhưng gate health failed/stale. Đã dùng CodeGraph structural query, CocoIndex semantic query, bounded source/Rules/schema reads và inventory hashes. Các `.ai/context` về map/architecture/build/ownership vẫn placeholder; dữ liệu nghiệp vụ chưa có source phải để owner chốt. Không sử dụng index stale làm bằng chứng completeness.

Documentation-only: tạo thư mục QA này; không sửa runtime, generated assets, Rules, tests hành vi hoặc release config. Không cần approval implementation để viết bộ scenarios. Nếu execution tìm defect cần đổi existing system, chuẩn bị impact plan và approval theo repository trước sửa. Không gửi thông báo, chạy cloud mutations, cấp quyền, mở provider gates hoặc deploy trong tác vụ này.

## Mô hình một scenario độc lập

Mỗi ID có priority, vai trò, environment, fixture/preconditions, bước và expected. Expected là **test oracle cần kiểm chứng**, không phải assertion đã PASS. Source refs là căn cứ để chuẩn bị fixture và đối chiếu contract; khi source chưa đáp ứng oracle, ghi `FAILED`/`BLOCKED` hoặc `NOT_IMPLEMENTED` trong actual cùng requirement gap, không sửa expected để làm suite xanh.

Mỗi scenario chạy trong dataset riêng. Các variants như 0/1/100/101 hoặc multiple roles phải có sub-results riêng: `SG-CAT-002/v-qty-0`, `.../v-qty-1`. Một parent case chỉ PASS khi mọi variant áp dụng đã chạy và PASS. Action matrix và route sweeps là tham số mở rộng, **không cộng vào số 477**. Envelope handler chưa là coverage toàn bộ private/local helpers hoặc mọi branch.

### Fixture chuẩn

1. Tạo namespace `qa-083-<run>-<case>` trong emulator/database test cô lập. UID là synthetic như `qa-a`, `qa-b`; bank transaction IDs, tên, địa chỉ, email và ảnh đều synthetic. Không dùng dữ liệu production.
2. Chuẩn bị guest; verified-Google auth fixtures A/B; từng staff role OWNER, OPERATIONS_MANAGER, BUYER, WAREHOUSE, FINANCE, SUPPORT, CONTENT_EDITOR; variants multi-role, inactive, locked, revoked, malformed role metadata. UID trong credential thực không được lưu vào tài liệu công khai.
3. Buyer fixtures có assigned/unassigned `orderIds`. Giá/tiền integer VND; product P1 `published`, `orderable=true`, `version=1`, price `100001`, options `S/M`, termsVersion hợp lệ. Custom O1 gồm hai lines quantities `[2,3]`, US/JP/KR chạy các biến thể market.
4. Quote total `100001` với breakdown hợp lệ, expiry future; cọc source hiện tại `ceil(total/2)=50001`. O-CAT qty2 payable `200002`. Fixtures cho collected 0, thiếu 1, đủ, overpaid; refunded và refundReserved khác nhau. Không gọi giả lập đó là bank verification thật.
5. Seed accepted quote/recipient snapshots, purchase/receipt lines, parcels và allocations theo đúng thứ tự nguồn. Không tự set stage để né invariant của integration happy path. Ca invalid-state có thể seed state trái điều kiện trong harness để kiểm tra rejection; ghi rõ.
6. Thiết lập clock cố định và variants expiry/MFA/schedule; riêng real auth/AppCheck dùng approved staging. Payload đầy đủ theo schema trong source; không lấy tên action làm bằng chứng fields/version hợp lệ.
7. Snapshot entities liên quan trước ca. Thực hiện action; đọc authoritative DB/response/UI; đối chiếu ledger/history/projections. Reset chỉ dataset của chính run sau khi giữ evidence đã redact. Không restart/reset shared emulator hoặc dịch vụ của chat khác.

### Invariants bắt buộc

| ID | Invariant |
|---|---|
| I1 | Owner/current-role/current-assignment quyết định quyền; UI/menu/AI/token cache không tự cấp quyền. |
| I2 | Cùng operationId+payload chỉ có một effect; payload khác không reuse; replay phải recheck authority theo contract. |
| I3 | State/version đúng order; conflict không partial commit hoặc silent overwrite. |
| I4 | Tiền integer: ledger/collected/refunded/reserved và available net funds được đối chiếu; không double bank allocation. |
| I5 | Catalog snapshot all-inclusive, full verified payment trước mua, không báo giá lại hoặc thu balance lần hai. |
| I6 | Custom có accepted quote/terms version, cọc theo domain hiện tại, final approval và đủ balance trước dispatch. |
| I7 | Purchased/received/packed/allocated/delivered quantities không vượt nguồn từng line; giao thiếu không hoàn tất cả order. |
| I8 | Holds/refund reservations/freight approval version được recheck trước mua/dispatch; batch fail atomic. |
| I9 | Issued financial/document/history snapshots bất biến; correction/replacement có lineage; pending/unknown không là completed. |
| I10 | Public chỉ publication scope; private child/media/notes/cache không leak; providers code-held không bị settings/client mở khóa. |

Áp dụng invariant phù hợp từng path. Read/pure helpers không có DB effect ghi N/A, vẫn kiểm tra authorization/data meaning/precision áp dụng.

## Role × action × entity matrix

Với **mỗi action** ở 07-ACTION-MATRIX và endpoint private ở TRACEABILITY, chạy authorized role/owner cùng guest, customer khác owner, role thiếu, inactive, locked, revoked, malformed roles và BUYER ngoài assignment khi có BUYER guard. Không blanket-deny guest/public cho `publicPage`, discovery, published media/comments/rates hoặc share-token reads mà source cho phép.

Test cả direct Firestore/Storage Rules và callable Admin SDK guard. Rules không bảo vệ Admin SDK. `users/{uid}` own get có policy riêng trong current Rules: không suy ra mọi locked-user read đều deny; profile/access reads có thể phục vụ recovery. Customer owns-order đồng thời có staff role phải kiểm tra không bị leak staff-only notes khi handler coi họ là customer.

## Environments và provider holds

| Mức | Ý nghĩa bằng chứng |
|---|---|
| HARNESS_LOCAL | Pure/domain/server adapter tests; identity/provider fake, không là Firebase runtime/provider thật. |
| EMULATOR | Firebase auth/DB/functions/rules fixture đúng `demo-satsunicgo`, localhost; không chứng minh MFA/AppCheck thật, IAM hoặc deployed Rules. |
| BROWSER_LOCAL | Render và workflow local; ghi rõ auth/data synthetic; không chứng minh live Google/bank/mail/AI. |
| LOAD_LOCAL | Load synthetic trong process/test environment riêng; không suy ra cloud capacity. |
| APPROVED_STAGING | Auth/MFA/AppCheck/deployed handlers cần staging được phép, fixture test và candidate đúng. |
| APPROVED_PROVIDER_SANDBOX | Provider account/test mode thật cùng approval và release candidate đã được review; readback từng provider. |

Current `releaseCapabilities` giữ `ai/email/payments/scheduledMaintenance=false`. `assertPaidAskReadiness` luôn ném unavailable kể cả policy hợp lệ. Non-provider maintenance chỉ được phép ở canonical demo với project/host/actual database identity đúng. Vì thế các ca provider positive hiện **BLOCKED để chạy**, còn trạng thái thực thi vẫn **NOT_RUN**. Ca kiểm tra gate đóng có thể chạy local. Không mở khóa gate để làm test PASS. Test mode PayOS, SMTP recipient sandbox và paid Gemini đều cần scope/authorization/cost bounds riêng.

## UI/UX và performance acceptance

UI sweep mọi routes, nested IDs/slugs và từng data state applicable: loading, empty, error, retry, partial, unavailable, permission-denied, conflict, pending, unknown, disabled, success. Critical flows cần screenshot/video hoặc accessibility evidence hiện tại ở mobile/tablet/desktop; không dùng screenshot cũ. Eight principles được đánh giá cho từng flow: Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight. Web behavior phải phù hợp browser; không sao chép expression chỉ dành Apple.

**Budgets dưới đây là PROPOSED, chưa có SLA owner approval hoặc measurements**; xác nhận trước dùng làm release criteria:

| Chỉ số | Budget đề xuất | Điều kiện |
|---|---|---|
| LCP/INP/CLS | ≤2.5s / ≤200ms / ≤0.1 | Đo lab để điều tra; field p75 mobile/desktop phải thu riêng. |
| Warm local API read/mutation p95 | ≤1s / ≤2s | Dataset, hardware, RTT, sample size ghi rõ; không thay cloud/provider SLA. |
| Visible route-ready p95 | ≤3s | Mobile profile đã định nghĩa, data fixture; cold/warm tách riêng. |
| Saturation/capacity | Không có threshold cố định | Ramp5→20→50→100 synthetic clients; tìm điểm saturation, errors/queue/reads và invariants. |
| Memory/listeners | Không tăng liên tục không giải thích được | Baseline/post-GC; 100 navigation cycles, long session; không đặt MB tùy ý. |
| Provider latency/cost | TODO(owner) | Bị hold, NOT_RUN; chỉ đo với approval/provider readback. |

Mỗi performance run cần warmup, ≥100 request samples khi đo percentiles API, ≥5 navigation cold/warm lab samples, hardware/OS/browser/network, dataset size/concurrency/duration, time series và p50/p95/p99. Stress fail không được làm giảm auth/validation để tăng throughput. Functional invariants có ưu tiên hơn latency.

## Thực thi và evidence

`SCENARIOS.json` và Markdown giữ thiết kế gốc. Ghi run vào bản sao EXECUTION.csv hoặc run directory riêng; không tự đánh dấu PASS từ test references. Một test reused phải đọc assertion, kiểm tra candidate hash và liên kết case/variant thật. Các trường bắt buộc khi có kết quả: owner, actual, evidence path đã redact, evidence_level, run_at, candidate, issue khi failed/blocked. Một case hỗn hợp local/provider phải có sub-results và môi trường riêng, không gộp local PASS thành provider PASS.

Trạng thái được dùng: `NOT_RUN`, `PASSED`, `FAILED`, `BLOCKED`, `NOT_APPLICABLE`; evidence_level tách `SOURCE_ONLY`, `HARNESS_LOCAL`, `EMULATOR`, `BROWSER_LOCAL`, `APPROVED_STAGING`, `APPROVED_PROVIDER_SANDBOX`. `NOT_APPLICABLE` cần rationale cụ thể; skip không là PASS. `NOT_IMPLEMENTED` ghi trong actual/issue để giữ gap. Không xuất token, share-token, MFA secrets, webhook secrets hoặc PII trong request dumps/screenshots.

Lệnh kiểm tra **tài liệu** có thể chạy ngay:

```sh
python3 docs/qa/system-scenarios/validate.py
python3 docs/qa/system-scenarios/validate.py --check-source
```

Commands application được xác nhận tồn tại từ package.json, **không chạy trong tác vụ viết scenarios**:

```sh
npm run test
npm run test:rules
npm run test:http
npm run test:restore
npm run typecheck
npm run lint
```

Chọn focused runner theo test refs và đọc `scripts/emulator-test.mjs` trước khởi động: identity/ports và isolation phải đúng, không chạm shared running service. Playwright runner/config phải kiểm tra trước execution; suite này không cung cấp fake test scripts thay cho automation thật. Không chạy `release:build`, deploy, cloud reset/seed hoặc privileged bootstrap để viết tài liệu.

## Release decision

P0 bắt buộc trước candidate release cùng mọi action variants/role combinations applicable. P1 theo owner acceptance; thiếu security/auth/financial/quantity/provider evidence vẫn **NOT_READY** bất kể số case local PASS. Failed invariant I1–I10, missing evidence, stale hashes hoặc unknown financial state là blocker. Review tài liệu PASSED chỉ xác nhận chất lượng thiết kế trong phạm vi đã kiểm tra; application/runtime/production acceptance **NOT_RUN / NOT_READY**.

## Trạng thái cuối của snapshot

Document consistency PASSED; current source freshness STALE do RequestForm.tsx/request-form.css thay đổi thêm trong shared worktree. Latest review **BLOCKED** (cycle2), xem VALIDATION_SOURCE.json/REVIEW.json/TASK_REPORT.md. 477 ca vẫn NOT_RUN; cần đối chiếu delta và manifest khi source ổn định trước execution. Không diễn giải review cycle1 trước đó là approval cho source mới.
