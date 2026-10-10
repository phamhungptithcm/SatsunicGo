# Product content · Ask correctness slice

Task ASK-PANEL-WORKCELL-20261008. Reviewer root, 2026-10-08. Scope: current real Ask/Commerce render with browser-only synthetic auth, database and command transport; VI/EN web. New action-window design is separate, not integrated. Source and owned tests are frozen; 32/32 actual-component tests passed on the current slice. Product Language Gate: PASSED within the synthetic local browser scope; independent final task review remains separate.

## Context

Customers prepare custom requests, review delivery information and accept quotes through existing exact chat commands or buttons. A custom request asks staff for a quote. Quote acceptance records acceptance/deposit obligation, not payment. Private recipient values are loaded directly into the secure form, never put into model context or transcript. Saved means admitted, owner/schema-validated non-cache readback for the current scope; editable values are separately maintained. Missing/unverified data is unavailable, not empty success or zero.

Verified: current real hook and UI preserve edits on failed/held saves; quote acceptance is blocked while recipient verification/editing is unresolved; manual dirty state is shared by chat and buttons. Normalization uses the existing Zod canonical schema. Unknown operations retain exact operation identity for reconciliation. Tests inject synthetic records, not production/customer data. Assumptions: concise familiar VI/EN instructions reduce ambiguity; no actual customer usability study is claimed. Unknowns: screen-reader audio, deployed auth/AppCheck/provider/payment and pending new design. Existing English-shell Profile/Membership remains partly Vietnamese and outside this correctness slice.

## Changed content inventory

All existing field labels/buttons remain; the saved recipient summary now uses validated saved values instead of current edits. Internal errors map to user messages. Complete VI/EN strings are listed below.

| State/location | Vietnamese | English | Meaning / current verification |
| --- | --- | --- | --- |
| Chat readiness heading | Kiểm tra trước khi tiếp tục | Review before continuing | Read-only explanation, action none; dirty manual VI/EN tests |
| Remote draft conflict | Bản nháp đã thay đổi ở nơi khác. Tải lại và kiểm tra bản mới trước khi lưu hoặc gửi. | The draft changed elsewhere. Reload and review the latest draft before saving or sending. | Old draft cannot be submitted with newer version; English conflict screenshot and real-hook regression |
| Manual unsaved | Thông tin đang sửa chưa được lưu. Lưu bản nháp, kiểm tra lại rồi gửi yêu cầu. | Your edits are not saved. Save the draft, review it, then send the request. | Save/review required; VI/EN chat/button parity |
| Delivery editing | Thông tin nhận hàng đang được sửa. Lưu và kiểm tra lại trước khi tiếp tục. | Delivery details are being edited. Save and review them before continuing. | Saving has not completed; recipient failure/held/newer-edit regressions |
| Delivery loading / unverified | Chưa xác minh được thông tin nhận hàng đã lưu. Chờ tải xong hoặc kiểm tra kết nối. | Saved delivery details are not verified yet. Wait for them to load or check your connection. | Role=status, no false success; delayed-readback screenshot |
| Recipient readback failure | Chưa tải được thông tin nhận hàng. Thử tải lại; phần đang sửa vẫn được giữ. | Delivery details could not load. Retry loading; your edits are kept. | Alert only on failed/invalid authoritative readback; actual retry preserves edits and dispatches no write/provider |
| Read-only retry | Thử tải lại | Retry loading | Re-subscribes under current version and ownership fences; VI/EN failure screenshots + AX + command captures |
| Saved summary | Giao đến · [saved recipient] | Delivery address · [saved recipient] | Summary reveals authoritative saved name/phone/address only; never mutable edit; recipient screenshot/test |
| Pending identity unavailable | Chưa đọc được thao tác đang chờ. Liên hệ hỗ trợ để đối chiếu. | The pending action could not be read. Contact support to reconcile it. | Existing recovery semantics retained; no new identity or blind retry |
| Conversation invalid | Chưa xác minh được hội thoại. Hãy tải lại hoặc liên hệ hỗ trợ. | The conversation could not be verified. Reload or contact support. | Ownership/schema admission; invalid private resource never rendered |
| Result invalid | Chưa xác minh được kết quả. Hãy đối chiếu thao tác đang chờ trước khi thử lại. | The result could not be verified. Recover the pending action before trying again. | No optimistic success; existing admitted envelope required |
| Recovery failure | Chưa đối chiếu được thao tác. Thử lại; không gửi yêu cầu mới. | The pending action could not be recovered. Retry recovery before sending a new request. | Retry recovery only, existing pending UUID retained |
| Other English failure fallback | Existing specific VI message | This step could not finish. Check your connection and retry. | Readiness errors now use specific localized instructions before fallback; durable unknown-result codes use recovery branches |

## State coverage

| State | Result/evidence |
| --- | --- |
| Default/action | Existing request/quote controls, saved summary; named outcomes unchanged |
| Loading/pending/disabled | Unverified delivery status, save operation held, disabled quote; delayed/held/listener error tests |
| Empty/no result/true zero | No changed search/metric empty state; absent saved delivery is unavailable and cannot approve |
| Success | Editor closes only matching readback + admitted acknowledgement + unchanged edit; no new success promise |
| Error/recovery | Failed saves retain visible edit; error-before-ACK regression; existing unknown-result recovery |
| Offline/stale/partial | Listener failure invalidates synchronous and visible verification; remote conflict says reload/review |
| Unauthorized/forbidden | Existing UID/CID/resource fences and auth-reset regression; no private resource existence disclosed |
| Confirmation/destructive | Existing quote/request/receipt meanings retained. No new generic yes/no, payment or destructive authority |

## Eight Human Interface principles

These are current checks of the scoped correctness repair, not a full redesign or Apple HIG compliance claim. Current statuses use the final 32-case run and current source; proxies and limits below are explicit.

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Readiness explanation gives the next step for the customer's current request/address; button/chat share same condition |
| Agency | PASSED | Failed/held saves preserve visible work, newer edits survive; no old-payload submission |
| Responsibility | PASSED | Saved/private/editing meanings distinct; quote acceptance is not payment; unknown-result recovery retains identity |
| Familiarity | PASSED | Existing native fields, named buttons, details disclosure and web status/alert semantics retained |
| Flexibility | PASSED | VI/EN390 and720 CSS-pixel desktop200%-layout-equivalent tested with keyboard, complete message wrapping and no horizontal overflow; native browser zoom/AT audio/device not claimed |
| Simplicity | PASSED | One concise heading and specific next step, no raw ASK_READINESS code or hidden technical workflow |
| Craft | PASSED | Immediate/queued stale quote and direct-payment admission, listener error/retry, missing/wrong-owner/schema-invalid snapshot and own-save/held/newer-edit failures passed; current role/status/alert names verified in AX snapshots |
| Delight | PASSED | Edits survive recoverable failures; calm, practical wording and correct return to latest turn |

## Platform and pattern checks

Web native conventions and canonical white/blue/navy design remain. Persistent field labels and visible button names retained. Text/status carries state, not color alone. New feedback uses role=status and existing alert; no added modal or Apple-only expression. Conversation answers remain read-only when readiness blocks an action. No claim of full multilingual Profile/Membership, screen-reader audio, production accessibility or customer preference research.

Current visuals inspected: output/ask-panel-current/recipient-failure.png (visible edited B, unavailable saved verification, disabled quote); english-conflict.png (specific reload/review, preserved quantity3); delayed-readback.png (chat warns before continuing, no quote action); performance-390.png (long synthetic form, fixed composer, wrapped labels). Current guard images content-{vi,en}-{390,200pct-equivalent}-guard.png and retry-{vi,en}-failure.png show the actual messages and controls; root inspected retry VI, EN390 guard and VI720 guard. JSON metrics confirm keyboardReached, quantity3 retained, statusRoleVerified and equal scrollWidth/clientWidth; YAML accessibility snapshots confirm persistent labels, disabled submit, localized feedback and retry names. Long synthetic questions wrap. Current retry JSON records zero writes/provider dispatches.

Gate dimensions meaning/tone/brevity/audience/data semantics/terminology are PASSED from source + current rendered tests. Accessibility/localization expansion/in-context completeness are PASSED for the executed native-control keyboard/AX and layout-equivalent proxy checks. Product Language Gate: PASSED within this local component scope. Native browser zoom, screen-reader audio, alternative browsers/devices and production accessibility are NOT_RUN; audible announcement or full conformance is not claimed. No new form ownership/layout/generic yes-no capability is admitted by this gate.

## Current source and executed evidence

Ask SHA256 5c6b89732e1395a0d10c0e4de05e4fe689e0d3285629f3b10d5a4a795d8c5709; Commerce e2bc300c632cb8748cb8375d543f0516e6e605e50d86d81e1a4f910fec6fdd7c; owned spec f1b6e22d42e68b7818d0f0666c4e5b08513bf904162120e0eda33968bcef3016. Final 32/32 log output/ask-panel-correctness/review-cycle5-pass-after-final.log,35.3sec. Changed literal copy is fully inventoried above; dynamic saved names/contact/address are synthetic values in tests and private current-authority values in implementation, never official translated facts.
