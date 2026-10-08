# Invoice product-content review — 2026-10-07

Decision: BLOCKED pending actual rendering. Audience: Vietnamese CRM staff; platform: web, native controls and existing SatsunicGo components. Bundled principles and surface patterns applied; no Apple platform compliance claim.

## Verified meaning and inventory
Invoice remains an internal statement, not a tax invoice. Issued values remain historical snapshots; ledger and second-payment rules untouched. Authentication and authorization checks remain unchanged.
- Seller accordion → icon action “Thông tin người bán” with title, accessible label and expanded state; opens existing WorkbenchComposer095 with Escape/close and retained unsaved form.
- “Tên doanh nghiệp/người bán” → “Tên người bán”; “Thông tin liên hệ” → “Liên hệ”; “Lưu thông tin người bán” → “Lưu thông tin”. Persistent labels retain required * and input min/max bounds.
- Composer title “Tạo bản nháp từ đơn hàng” → “Tạo bản nháp”; “Mã đơn đã chốt tổng cuối” → “Mã đơn”; hint still requires approved final total. Submit label shortened to “Tạo bản nháp”; createDraft API untouched.
- Empty message “Chưa có hóa đơn trong trang này.” → “Chưa có hóa đơn ở trang này”; retains current-page scope rather than falsely asserting no invoices anywhere.
- Loading, error, uncertain-operation recovery, issue/void/share consequences and account descriptions unchanged.

## States and data
Default seller action respects canConfigure; create respects canIssue. Busy/pending lock entry and close. Failure preserves forms; no new success promise. Reopening composer retains fields unless server version changes as before. VND locale formatting, missing ID fallback and snapshot wording preserved. Unauthorized page observed through normal browser; form/default/narrow/keyboard and live success rendering NOT_RUN due missing role. Core invoice tests8 passed, including draft/issued/void print semantics and request-race recovery. Browser print preview NOT_RUN.

## Eight principles
| Principle | Status | Evidence / gap |
|---|---|---|
| Purpose | NOT_RUN | Source consolidates invoice task; staff rendering blocked |
| Agency | NOT_RUN | Shared close/Escape and draft retention source verified; actual focus untested |
| Responsibility | PASSED | Non-tax disclosure and snapshot/payment meanings preserved; 8 invoice tests pass |
| Familiarity | NOT_RUN | Reuses existing CRM heading/composer; in-context staff screen unavailable |
| Flexibility | NOT_RUN | Native labels and44px action;960/600/480 breakpoints; narrow/keyboard untested |
| Simplicity | NOT_RUN | One seller composer, short labels; density requires visual readback |
| Craft | NOT_RUN | CSS consolidation, print exclusion and focused lint pass; actual print/mobile missing |
| Delight | NOT_RUN | Calm direct copy; current interaction not observed |

## Gate and limitations
Source checks passed for domain meaning, respectful Vietnamese, required field labels, no privacy/API changes. Rendered context, text expansion, keyboard focus restoration, mobile overflow and print remain NOT_RUN. Thus Product Language Gate BLOCKED; do not certify accessibility, final visual quality or production readiness. No production data or credentials in evidence. Apple-only styling/terminology not applied.
