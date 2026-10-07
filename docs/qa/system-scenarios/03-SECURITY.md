# SECURITY — 33 scenarios

Mọi case hiện NOT_RUN. Expected là test oracle để kiểm chứng, không là kết luận implementation đã đúng. Áp dụng [README](README.md) về fixture/reset/invariants và evidence. Mỗi variant cần result con riêng.

## SEC — Security và abuse scenarios

### SG-SEC-001 — Firestore owner reads

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. A/B/guest get,list orders,quotes,acceptances,timeline,addresses,notifications,shipments,salesDocuments

**Mong đợi:** Chỉ reads được rules cho phép; query rộng bị deny; không giả staff direct-read quyền Admin.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-002 — Server collections private

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Client đọc financialEntries,bankTransactions,idempotencyKeys,auditEvents,outboxJobs,aiQuota,orderOperations

**Mong đợi:** Default deny; không leak qua client get/list hay subcollection.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-003 — Firestore writes deny

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Client create/update/delete orders,payments,staffAccess,public products và timeline

**Mong đợi:** Authoritative writes qua server; không bypass bằng direct SDK hoặc REST.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-004 — Storage default deny

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Guest/A/staff trực tiếp read/write/list Storage object

**Mong đợi:** Deny mọi direct path hiện tại; media phải qua authorized handlers.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-005 — Current account locked

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Set users.locked và staffAccess.locked từng biến thể
2. call reads,writes,replay

**Mong đợi:** Fail closed theo endpoint; không chỉ chặn mutation mới.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-006 — Staff inactive

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. roles hợp lệ nhưng active=false
2. gọi listWork,finance,studio,workspace mutations

**Mong đợi:** Không nhận authority từ roles còn lưu khi inactive.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-007 — Wrong identity provider

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Linked Google nhưng sign_in_provider=password
2. email_verified sai kiểu

**Mong đợi:** Google verified guard deny; không tin client email/provider claim.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-008 — Role-array confusion

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. roles='OWNER', {OWNER:true}, ['OWNER',null], [] và unknown strings

**Mong đợi:** Không escalation từ malformed metadata; unknown role không có grants.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-009 — Horizontal IDOR

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. A thay orderId,invoiceId,ticketId,conversationId,addressId của B trong từng handler family

**Mong đợi:** Không đọc/ghi trái owner; không leak tồn tại hoặc private result.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-010 — Vertical escalation

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Mỗi role thử từng privileged mutation trong action inventory, customer thử staff actions

**Mong đợi:** Server grants đúng; mọi denied case giữ data/ledger unchanged.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-011 — Buyer assignment bypass

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Buyer có role hợp lệ nhưng orderIds missing/wrong/malformed
2. replay sau unassign

**Mong đợi:** Deny ngoài assignment; cache/idempotency không bypass current rights.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-012 — MFA privileged boundary

- Priority: **P0** · Status: **NOT_RUN** · Environment: `APPROVED_STAGING`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.
- Điều kiện chưa đủ: `STAGING_AUTHORIZATION_AND_SAFE_FIXTURES_REQUIRED`

**Các bước**

1. Staging test finance/owner actions với missing factor, expired auth, future timestamp

**Mong đợi:** Chặn đúng nguồn; emulator bypass ghi riêng, không được PASS production MFA.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-013 — AppCheck real runtime

- Priority: **P0** · Status: **NOT_RUN** · Environment: `APPROVED_STAGING`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.
- Điều kiện chưa đủ: `STAGING_AUTHORIZATION_AND_SAFE_FIXTURES_REQUIRED`

**Các bước**

1. Staging được phép gọi callable thiếu/invalid AppCheck
2. lặp valid Google nhưng AppCheck sai

**Mong đợi:** Enforcement đúng deployment; source flag và emulator không là runtime proof.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-014 — Mass assignment

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Gửi extra ownerId,roles,locked,stage,collected,bank allocation trong strict payloads

**Mong đợi:** Không nhận fields authority từ client; schema fail hoặc ignore chỉ khi source quy định rõ.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-015 — Idempotency payload collision

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Same UID+operationId payload khác
2. same operationId across UIDs
3. unauthorized replay

**Mong đợi:** Hash/context phân biệt; không cross-user replay hoặc private result leak.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-016 — Version tampering

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. expectedVersion âm,lẻ,string,missing và old version cho từng mutation versioned

**Mong đợi:** Invalid/conflict; không last-write-wins ngầm ở contract có version.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-017 — Path injection

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. IDs chứa ../,slash,%2f,control chars và overlong
2. thử nested document refs

**Mong đợi:** Không truy cập path tùy ý hoặc query unbounded; reject safely.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-018 — Public publication bypass

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Đọc draft post/product/plan,children image/comment bằng ID và slug cũ

**Mong đợi:** Only published projection theo contract; no draft exposure.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-019 — Share token attack

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Token thiếu,random,revoked
2. document draft/void theo share contract
3. rate-limit probe bounded

**Mong đợi:** Không leak document qua guessed ID; revoke enforce; thiếu rate control ghi finding thực, không giả PASS.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-020 — XSS stored/reflected

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Inject script,event handler,SVG,Merm aid URL,unsafe markdown/comment/banner link trong fixture

**Mong đợi:** Sanitize/escape trong editor,preview,SSR/public/client; không executable injection.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-021 — CSV formula injection

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Export customer/taxonomy/content có leading whitespace rồi =,+,-,@ và newline/quotes

**Mong đợi:** Không formula execution khi mở spreadsheet; escape bảo toàn dữ liệu.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-022 — SSRF/external URL

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Thử URL internal/loopback/metadata host trong luồng có server fetch theo source

**Mong đợi:** Allowlist/validation ngăn fetch ngoài scope; nếu không có server fetch ghi N/A path, không fake vulnerability.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-023 — Malicious image parser

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. MIME mismatch,large pixel bomb,SVG/polyglot,EXIF GPS fixture

**Mong đợi:** Bounded decode/sanitize; không public PII hoặc HTML executable.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-024 — Webhook authenticity

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Fake signature/replayed verified bank IDs/wrong orderCode/amount/currency ở provider harness

**Mong đợi:** Không duplicate hoặc false verified allocation; live route vẫn gate đóng.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-025 — Client gate spoof

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Sửa browser/settings/enabled flags để gọi AI,SMTP,PayOS,maintenance

**Mong đợi:** Code-owned hold vẫn enforce; không network/spend ngoài scope.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-026 — Prompt injection và tool authority

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Fake retrieval/AI output yêu cầu đổi owner,lấy staff notes,đánh dấu paid

**Mong đợi:** AI không có quyền financial/authorization, không lộ private context.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-027 — Abuse input limits

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Gửi tối đa/ngoài schema item count,strings,cursor,bytes trong từng handler

**Mong đợi:** Reject bounded; không resource exhaustion không kiểm soát; capture metrics fixture.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-028 — Privacy request authority

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Open ticket data-export/deletion
2. caller cố dùng ticket làm quyền export/delete

**Mong đợi:** Request chỉ ghi nhận; không tự permanent delete hoặc release PII ngoài authorized workflow.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-029 — Error/log redaction

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Capture error responses và local logs từ auth,finance,share,email,AI malformed fixture

**Mong đợi:** Không credentials,raw tokens,private addresses,raw transcript; safe user message.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-030 — Security release artifact

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Kiểm tra local manifest/bundle/public config theo offline scanner
2. thử demo auth route non-demo

**Mong đợi:** Không expose secret; fail config; không claim external security audit.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-031 — Cache private boundary

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. A private reads cached
2. revoke/signout/change UID
3. B thử phục hồi cache/back button

**Mong đợi:** Scope và cleanup đúng; no stale private rendering.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-032 — Race unauthorized replay

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Commit valid mutation
2. revoke role rồi replay same operationId và concurrent private read

**Mong đợi:** Current authz trước idempotent result; không trả dữ liệu hoặc effect trái quyền.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-SEC-033 — Security control outage

- Priority: **P0** · Status: **NOT_RUN** · Environment: `EMULATOR`
- Vai trò: guest, A/B, all staff roles, locked/revoked variants
- Điều kiện/fixture: Môi trường test cô lập; chỉ payload synthetic; không tải secrets hoặc PII production; endpoint inventory trong TRACEABILITY.

**Các bước**

1. Fail access/user read hoặc auth resolver trong fake harness

**Mong đợi:** Deny/ unavailable; không fallback allow chỉ vì dependency không đọc được.

**Đối chiếu source:** [firestore.rules](../../../firestore.rules), [storage.rules](../../../storage.rules), [functions/src/auth/guards.ts](../../../functions/src/auth/guards.ts), [functions/src/workspace.ts](../../../functions/src/workspace.ts), [functions/src/index.ts](../../../functions/src/index.ts), [functions/src/blog-comments.ts](../../../functions/src/blog-comments.ts), [functions/src/invoice-share.ts](../../../functions/src/invoice-share.ts), [functions/src/provider-release-gate.ts](../../../functions/src/provider-release-gate.ts).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.
