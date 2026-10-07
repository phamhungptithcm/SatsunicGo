# PERFORMANCE — 23 scenarios

Mọi case hiện NOT_RUN. Expected là test oracle để kiểm chứng, không là kết luận implementation đã đúng. Áp dụng [README](README.md) về fixture/reset/invariants và evidence. Mỗi variant cần result con riêng.

## PERF — Performance, capacity và resource lifecycle

### SG-PERF-001 — Core Web Vitals public

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Đo home/products/post ở mobile slow profile và desktop
2. 5 cold/warm runs

**Mong đợi:** Ghi LCP/CLS/INP đo thật; so với budget đề xuất; lab không giả field p75.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-002 — Private route startup

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Đo account/order/CRM lazy chunks với cold cache
2. refresh deep link

**Mong đợi:** Không spinner vô hạn; p50/p95 và payload/chunk bytes có evidence; private data không SSR public.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-003 — Query size bounded

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Seed 10k customers/orders và 50k events/comments
2. đọc một page và filter

**Mong đợi:** Số docs/response bounded theo source; không tải toàn collection để paginate client.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-004 — Cursor depth

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Đi page1,10,100 với stable synthetic dataset
2. compare latency/read counts

**Mong đợi:** Không tăng cost tuyến tính bởi offset/full scans; no duplicate/missing IDs.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-005 — Listener lifecycle

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Mount/unmount/đổi order/account 100 lần
2. đo active subscriptions và heap

**Mong đợi:** Listener/timer được cleanup; không growth liên tục hoặc callbacks UID cũ.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-006 — Cache scope và kích thước

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Tìm1000 queries unique
2. đổi filter/account
3. expire cache

**Mong đợi:** Cache có TTL/eviction theo source; không private cross-UID cache; không unbounded heap.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-007 — Concurrent commands

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Load 20 rồi50 concurrent operations trên orders khác nhau ở harness
2. đo p95/error/transactions

**Mong đợi:** Không violate money/quantity/idempotency; ghi throttling và actual capacity, không assume concurrency config là throughput.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-008 — Hot-order contention

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. 20 clients mutate cùng expectedVersion
2. retry bounded đúng protocol

**Mong đợi:** Một version winner; conflict rate có evidence; không retry storm/duplicate effects.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-009 — Payment dedupe throughput

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Fake applyVerifiedPayment 100 duplicate deliveries
2. race với reconcile

**Mong đợi:** Một bank receipt; latency/reads bounded; no unbounded reservation/job growth.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-010 — Media decode memory

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Upload sát byte/pixel limit và bomb fixture vào local sanitizer
2. đo peak RSS/time

**Mong đợi:** Bounds được enforce; không crash/hang hoặc memory growth sau cleanup.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-011 — Studio typing large doc

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Soạn document/body gần schema maximum cótable/code/mermaid
2. đo key latency và autosave requests

**Mong đợi:** Không freeze typing; requests được kiểm soát; no lost draft trong debounce/unmount.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-012 — Ask streaming backpressure

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Fake stream nhiều chunks/lớn
2. cancel giữa chừng
3. network slow

**Mong đợi:** Không rerender/pending buffer không giới hạn; cancel cleanup; provider paid vẫn gate đóng.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-013 — Schedulers batch size

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Seed 10k outbox/reminder/scheduled posts fixture
2. run approved demo bounded scan

**Mong đợi:** Batch/lease/query limits đúng source; no provider dispatch; thời gian và remaining work rõ.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-014 — Cold function latency

- Priority: **P1** · Status: **NOT_RUN** · Environment: `APPROVED_STAGING`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.
- Điều kiện chưa đủ: `STAGING_AUTHORIZATION_AND_SAFE_FIXTURES_REQUIRED`

**Các bước**

1. Ở approved staging đo cold/warm auth read và mutation không provider
2. record region/network

**Mong đợi:** Có distribution p50/p95/p99; emulator timing không thay cold cloud proof.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-015 — Slow/offline/timeouts

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Throttle RTT và fail requests từng nhóm
2. thử retry 10 clients đồng thời

**Mong đợi:** Timeout/retry/cancel có giới hạn; no duplicate order/ledger; user không kẹt busy.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-016 — Long session heap

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Dùng Ask/CRM/Studio60 phút bằng synthetic driver
2. GC snapshots đầu/cuối

**Mong đợi:** Không retained object/listener growth không giải thích được; report raw measurement đã redact.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-017 — Bundle budget

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Đọc local build artifact stats đã có hoặc build riêng được phép
2. compare public vs lazy CRM/Studio

**Mong đợi:** Public chunk không kéo editor/CRM không cần thiết; ghi bytes/hash, không gọi build cũ là candidate mới.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-018 — HTML/cache efficiency

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Đo public endpoints ETag/cache/status theo source bằng local fixture
2. unpublish và re-read

**Mong đợi:** Cache giảm repeated payload trong boundary; không cache private response/shared authority trái source.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-019 — Export bounded resources

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Export synthetic max page/data theo source
2. đo memory/time
3. thử canceled download

**Mong đợi:** Scope/limit rõ, không unbounded DB read; formula safety giữ nguyên.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-020 — Failure recovery saturation

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Inject dependency errors 30% local load
2. đo queues/retries sau healthy

**Mong đợi:** Không retry thác lũ hoặc queue không thoát; không giảm security checks để phục hồi nhanh.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-021 — Money arithmetic extremes

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Run integer FX/freight/balance sát safeMoney max với property fixtures
2. đo correctness/time

**Mong đợi:** Conserve exact đồng; invalid reject bounded; BigInt không overflow hoặc drift.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-022 — Throughput vs business correctness

- Priority: **P1** · Status: **NOT_RUN** · Environment: `LOAD_LOCAL`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.

**Các bước**

1. Ramp local load5→20→50→100 users
2. reconcile final ledger/quantities/audit

**Mong đợi:** Budget latency không đổi lấy sai tiền/hàng; mọi invariant I1–I10 vẫn giữ; saturation ghi rõ.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-PERF-023 — Performance provider boundary

- Priority: **P1** · Status: **NOT_RUN** · Environment: `APPROVED_PROVIDER_SANDBOX`
- Vai trò: tester local load, operator approved staging
- Điều kiện/fixture: Data/load synthetic; harness isolated; cold/warm runs; network profiles; thresholds PROPOSED trong README, không chạy load production.
- Điều kiện chưa đủ: `CURRENT_CODE_OWNED_PROVIDER_HOLD; AUTHORIZATION_AND_CANDIDATE_REQUIRED`

**Các bước**

1. Chỉ sau approval đo PayOS/Gemini/SMTP sandbox latency/cost và rate limits riêng

**Mong đợi:** Hiện BLOCKED; fake latency không là provider SLA/cost; không tự mở gate để benchmark.

**Đối chiếu source:** [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/jobs.ts](../../../functions/src/jobs.ts), [functions/src/payments/payos.ts](../../../functions/src/payments/payos.ts), [src/shared/live-cache.ts](../../../src/shared/live-cache.ts), [src/features/ask/transport.ts](../../../src/features/ask/transport.ts), [src/features/content/studio/source-editor.tsx](../../../src/features/content/studio/source-editor.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.
