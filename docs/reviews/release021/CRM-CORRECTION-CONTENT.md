# CRM021 correction product review — 2026-10-05
Vietnamese web operations. Exact files/hashes: CRM-CORRECTION-SOURCE.json. Intelligence DEGRADED; bounded source/compiler/test fallback. Current native acceptance remains owned by root021 harness; this review does not promote source to browser evidence.

Changed strings: purchasing queue option “Chờ thanh toán / cần mua” replaces universal deposit label. Meaning: catalog full upfront and custom quote/deposit/balance policy remains backend-owned; no payment amounts or actions changed. No other displayed strings added. Loading/reload now clears rows/detail/cursor; pending command keeps form inputs mounted and disabled; support with zero permitted actions sees no action form. Failed warehouse data refresh removes cached private details.

|Principle|Status|Evidence|
|---|---|---|
|Purpose|PASSED|Queue label covers both approved buying flows|
|Agency|PASSED|Explicit submission, disabled pending fieldset; server-render regression|
|Responsibility|NOT_RUN|Generation guards/source reviewed; native interrupted command and permission-loss cases pending|
|Familiarity|PASSED|Native form/select/fieldset retained|
|Flexibility|NOT_RUN|Keyboard and assistive technology on corrected candidate pending|
|Simplicity|PASSED|Empty unauthorized action form removed; regression passes|
|Craft|NOT_RUN|Responsive/contrast rendered acceptance pending|
|Delight|NOT_RUN|Animation/reduced motion runtime acceptance pending|

Default/empty/pending: SSR/source evidence. Success/error/timeout/retry/revocation: current native validation pending. No destructive/provider action was performed. Decision BLOCKED, production NOT_READY. Root native support evidence was received as coordination data, not independently rerun here.

## Profile correction — 2026-10-05
Manifest PROFILE-CORRECTION-SOURCE.json. New contextual strings: “Đang tải hồ sơ…” (pending), “Chưa tải được hồ sơ. Kiểm tra kết nối và thử lại.” / “Chưa tải được địa chỉ. Kiểm tra kết nối và thử lại.” (errors), “Tải lại thông tin” (explicit recovery). Failed profile resets displayName/businessName/consent/version and disables profile save; failed address removes addresses and disables new-address save. Snapshot recovery clears its own error; account change resets private state and stale mutation completions are suppressed. No promise of consent save until command success; no mail/provider action. Four reducer transition tests pass. Native consent/account/fault injection and accessibility remain pending; all previously NOT_RUN Human Interface principle statuses remain NOT_RUN.
