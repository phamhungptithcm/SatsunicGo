# Product Content Review — CRM-STEPPER-098

Current verdict: PASSED for the local web scope after direct cross-chat coordination. This is a local web review; no Apple-platform HIG compliance claim. Review date 2026-10-06. Bundled human-interface principles used as a human-centered quality reference, not an Apple visual template.

## Scope, audience and context

CRM operational staff, accounting, editors and owners enter staged operational or configuration data. Business goal: reduce input overload and expose the real consequence before sending a command. Native web forms, Vietnamese copy, Request083 brand/progress pattern. Shared source component owns navigation and validation; original page handlers own persistence, permissions, versions, uncertain results and retry.

Verified: 17 form instances use StepForm; all fields remain mounted; original native/form field names and named command handlers retained. Browser fixtures intercept reads and writes; no business writes reach the shared emulator. Exact strings/stages are inventoried in STRING_INVENTORY.json. Customer form location is Customer.tsx, not list Customers.tsx. Single-field filters/lookup/receipt/reply forms and Studio canvas do not become artificial wizards.

Assumption: existing business groups define the stage boundaries; no new business research or completion-rate claims. Unknowns: screen-reader users and live provider workflows have not been observed. ContentEditor uses the shared rail and full-width header slot; compact title/icons remain owned by the content task. Keyboard focus now falls back to the active stage when no separate h3 exists.

## Content inventory and meaning

| Surface/state | Text inventory | User job and behavior |
| --- | --- | --- |
| Progress navigation | All per-form step labels in STRING_INVENTORY.json; Các bước nhập thông tin | Identify current input group, previous validated groups and unavailable future groups. |
| Current/completed | Đang nhập / Đã kiểm tra; number/check | Indicates local field validation, never saved data, approved content, received funds or completed shipment. Icon, text and aria-current carry state together. |
| Navigation | ← Quay lại / Tiếp tục → | Back retains inputs; Continue validates this stage only and sends no business command. Existing final consequence-specific button is retained. |
| Review | Thông tin trước khi gửi; all copied actual field labels and entered/selected values | Actual mounted controls are the source. Number fields display vi-VN numbers, original unit/currency/date/time-zone labels remain. Review refreshes on final-field editing and when reentering. |
| Empty optional fields | Chưa nhập / Chưa chọn / Đã chọn | Do not turn absent fields into zero, saved results or invented defaults. These are local input states, not database availability states. |
| Long review content | Xem toàn bộ | Short excerpt expands to the entire input via native disclosure; data submitted is never truncated. |
| Native validation | Kiểm tra thông tin của bước này. plus native validation message | Stay in/return to invalid stage, open containing disclosure and focus/report the invalid field. |
| Shipping domain validation | Exact eligibility/positive-item/allocation messages in STRING_INVENTORY.json | Selected eligible objects and correct weight sum required before progressing; shipping/cost implications remain adjacent to final action. |
| Permissions and money | Existing final action, bank evidence, owner/MFA and no-payment caveats | Stepper does not perform grants, banking or persistence. Original handlers and guards retained. |

## State coverage

| State | Status and evidence |
| --- | --- |
| Default, current, checked, future, focus | PASSED: browser stage assertions, future-disabled state and focus after navigation; screenshots desktop/390/320, including current ContentEditor. |
| Pending/disabled | Original disabled flags propagated; policy unknown-outcome browser disables back; shipping shared lock blocks tabs. |
| Invalid/error/recovery | Browser rejects required title/empty parcel selection/bad allocation, returns to a prior invalid field on final submit, preserves inputs. Existing retry sends same command and operation ID. |
| Empty/loading/read error | Existing source states retained; Shipping regression exercises empty, read delay, read error/reconcile. No invented total counts. |
| Success | Shipping intercepted acknowledged readback focuses existing result; local fixture only, not proof of real shipment. |
| Unauthorized | Shipping fixture permission denial hides protected work panels; original role/version/MFA constraints retained. |
| Offline/stale/partial | Existing uncertain/reconcile guards retained; synthetic UNAVAILABLE verifies recovery. Actual offline provider behavior NOT_TESTED. |
| Destructive/publish | Original cancellation/publication/delete buttons and confirmation handlers retained, and final-stage action labels remain explicit. No new guarantee or auto-publication. |

## Mandatory principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Groups separate object selection, details/evidence and final consequence, following actual domain actions. Short actions bypass staging. |
| Agency | PASSED | Back, editable drafts and previous-step navigation; no mutation during Continue; native reset clears progress only when original form reset occurs. |
| Responsibility | PASSED | No checkmark implies persistence; finance/payment, publication and permission caveats remain; fixture commands intercepted and original guard/payload evidence retained. |
| Familiarity | PASSED | Request083 circles/rail, persistent labels and native inputs/buttons/details; web behavior and terminology preserved. |
| Flexibility | PASSED | All covered groups, including ContentEditor, at 320/390/desktop and keyboard pass; shared integrated rail, full-width compact header and retained draft. |
| Simplicity | PASSED | One group visible, short action forms unchanged, duplicate campaign section titles removed; long review text expands only when needed. |
| Craft | PASSED | Current compiler/lint, rendered state assertions and inspected ContentEditor desktop/390, staff390, batch390 screenshots pass. Duplicate CSS rail ownership resolved. |
| Delight | PASSED | Draft retention, focus guidance and explicit consequences reduce avoidable mistakes; no animation, celebration or fake success added. |

## Platform fit, data and limitations

Web conventions; no Apple-only components/assets/gestures. Clear focus outlines, aria-current, hidden future panels removed from keyboard/accessibility flow while inputs remain mounted. Native field validation retains localized browser messages. Existing bank evidence and internal notes remain inside protected CRM; no external messages/provider writes. Locale-aware numbers; original money units and device/Vietnam-time labels retained. Device/other-engine/screen-reader certification NOT_TESTED. Data and render evidence are synthetic local, current candidate hashes recorded separately.
