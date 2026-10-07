# UI-UX — 26 scenarios

Mọi case hiện NOT_RUN. Expected là test oracle để kiểm chứng, không là kết luận implementation đã đúng. Áp dụng [README](README.md) về fixture/reset/invariants và evidence. Mỗi variant cần result con riêng.

## UX — UI, UX, accessibility và product language

### SG-UX-001 — Responsive public/account/CRM

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Mở mọi route trong traceability ở 320,390,768,1440
2. thêm text dài,table và money

**Mong đợi:** Không overflow page hoặc mất CTA; table có scroll kiểm soát; panel/Ask không che nội dung.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-002 — Keyboard toàn flow

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Chỉ Tab/ShiftTab/Enter/Space/Escape qua checkout,request,finance,studio,dialogs

**Mong đợi:** Focus visible và thứ tự hợp lý; không keyboard trap; action được kích hoạt đúng một lần.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-003 — Dialog focus

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Mở account/CRM menu,confirm,preview
2. close bằng Escape/button
3. thử busy dialog

**Mong đợi:** Focus vào dialog và trả trigger phù hợp; background không tương tác trái modal.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-004 — Zoom và reflow

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Zoom200%,400% ở checkout/CRM/details/security
2. thao tác mọi action cần thiết

**Mong đợi:** Nội dung/labels/errors đọc và dùng được; không che nút hoặc thông tin tiền.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-005 — Screen reader trạng thái

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Đọc labels,hints,validation,toasts,loading,empty,error,conflict,pending/unknown

**Mong đợi:** Tên/trạng thái accessible đúng; live announcements không spam hoặc giấu lỗi.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-006 — Loading khác empty

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Trì hoãn reads ở orders,profile,finance,studio,tracking,rates
2. sau đó trả zero rows

**Mong đợi:** Loading không hiện chưa có dữ liệu; empty chỉ sau response hợp lệ.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-007 — Error khác zero

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Fail amounts/dashboard/tracking/invoice fetch
2. retry

**Mong đợi:** Không hiển thị 0 VND hoặc healthy thay unavailable; next action dễ hiểu.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-008 — Pending khác success

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Transfer report,refund request,queued email,Ask draft,quote proposal chưa accepted

**Mong đợi:** Copy đúng business state; không nói đã trả/đã mua/đã gửi/đã duyệt trước authoritative ack.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-009 — Catalog/custom language

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. So sánh checkout/account/Ask/CRM/docs cho catalog và custom

**Mong đợi:** Catalog nói full payment all-inclusive; custom nói quote/deposit/balance; không nhầm stage chung.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-010 — Money/units chính xác

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Hiển thị 100001 VND,USD minor,grams/kg và amount lớn
2. đọc bằng screen reader

**Mong đợi:** Không mất đồng/đơn vị hoặc FX ngầm; format nhất quán, currency rõ.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-011 — Vietnamese tự nhiên

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Review mọi string trong flow,error,empty,confirm ở ngữ cảnh

**Mong đợi:** Ngắn rõ, có hành động phù hợp; không jargon nội bộ hoặc cam kết vượt source.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-012 — English parity

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Đổi ngôn ngữ Ask nhiệm vụ tương đương
2. so sánh source labels,trạng thái và money

**Mong đợi:** Không đổi meaning hoặc quyền; fallback ngôn ngữ không làm sai nghiệp vụ.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-013 — Eight principles in context

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Với từng critical flow ghi Purpose,Agency,Responsibility,Familiarity,Flexibility,Simplicity,Craft,Delight và screenshot states

**Mong đợi:** Mỗi principle có evidence thực; không chấm generic hoặc chỉ string file; web platform fit.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-014 — Consent trước tiền/hàng

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Mở accept quote,final/change,refund/dispatch dialogs
2. back/cancel rồi confirm

**Mong đợi:** Thấy rõ amount/entity/consequence trước action; cancel không mutate; không AI auto-consent.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-015 — Validation giữ draft

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Submit invalid form 2 dòng
2. sửa field
3. backend conflict/error
4. retry

**Mong đợi:** Lỗi đúng field, focus hữu ích; giữ dữ liệu; không reset form vì network fail.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-016 — Double click và busy

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Double click pay,submit,send,issue,dispatch
2. keyboard Enter liên tục

**Mong đợi:** UI busy rõ; một operation intent; server dedupe; không silently bỏ ý định khác.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-017 — Reduced motion

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. prefers-reduced-motion=true ở home timeline,loading,banner,Ask,dialogs

**Mong đợi:** Chuyển động giảm theo nhu cầu; không mất thông tin hoặc thao tác.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-018 — Contrast và noncolor

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Light/dark OS nếu app hỗ trợ
2. states success,error,held,pending và focus

**Mong đợi:** Thông tin không chỉ màu; contrast measured theo agreed accessibility target, ghi ratio thực.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-019 — Touch và mobile keyboard

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Tap controls
2. mở keyboard trên form/Ask
3. rotate
4. safe area

**Mong đợi:** Không che input/CTA; touch target đo được; scroll không bị khóa sai.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-020 — Back/forward và deep links

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Đi account→order→docs/CRM rồi back/forward
2. reload direct URL

**Mong đợi:** Selection/context đúng URL; no private cache leak; recovery cho missing target.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-021 — Pagination và filter language

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Đổi page/filter ở customers,work queues,comments,docs
2. đọc counts

**Mong đợi:** Nêu page/scope rõ; subtotal không giả total; selected entity không nhảy sai.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-022 — Return focus sau error

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Fail mutation,close toast/dialog
2. retry
3. đọc kết quả bằng keyboard

**Mong đợi:** Focus vẫn ở action liên quan; error actionable, toast không auto-hide thông tin cần quyết định.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-023 — Long data và missing fields

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Tên200 chars,30 items,empty image,legacy missing purchaseKind
2. mở mọi critical detail

**Mong đợi:** Không crash/cắt money; legacy semantics đúng; unknown data hiển thị thật.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-024 — Print document

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Print nhiều trang với long line items,void/replacement và amount lớn

**Mong đợi:** Không mất tổng/sign/status; page breaks không che data; bản in đúng issued snapshot.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-025 — Private identity display

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Đổi A→B và guest với account menu/rail/security đang mở

**Mong đợi:** Tên/email current, không mix account; không expose private metadata không cần thiết.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.

### SG-UX-026 — Recovery lỗi chunk/runtime

- Priority: **P1** · Status: **NOT_RUN** · Environment: `BROWSER_LOCAL`
- Vai trò: guest, customer, từng staff role
- Điều kiện/fixture: Browser local candidate; viewport 320/390/768/1440; keyboard, screen reader; fixture loading/empty/error/partial.

**Các bước**

1. Fail lazy import CRM/Studio
2. throw render error fixture
3. retry ErrorBoundary

**Mong đợi:** Có fallback an toàn và khả năng phục hồi; không spinner vô hạn hoặc raw stack/secret.

**Đối chiếu source:** [src/app/App.tsx](../../../src/app/App.tsx), [src/features/crm/Workspace.tsx](../../../src/features/crm/Workspace.tsx), [src/features/account/AccountRail.tsx](../../../src/features/account/AccountRail.tsx), [src/shared/Loading.tsx](../../../src/shared/Loading.tsx), [src/shared/Toast.tsx](../../../src/shared/Toast.tsx), [src/styles/global.css](../../../src/styles/global.css), [src/features/ask/Ask.tsx](../../../src/features/ask/Ask.tsx).

**Bằng chứng cần lưu:** candidate/hash, fixture namespace, từng variant, response/UI đã redact và DB before/after/invariants applicable. Pure/read không có mutation ghi N/A phần DB effect.
