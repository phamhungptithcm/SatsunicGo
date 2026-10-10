# Product Content Review — recipient UX correction

## Scope

- Surface: PurchaseCheckout recipient form and payment-summary action, web/vi-VN.
- Audience/task: customer enters one Vietnamese receiving address, reviews items and payment before consent. Checkout form appearance alone changes; no financial policy, backend contract or permissions change.
- Files: purchase-checkout.tsx/css, purchase-recipient-validation.ts. Evidence: RECIPIENT-UX-SOURCE-MANIFEST.json and output/recipient-ux-20261009/browser.json.
- Reviewer/date: Codex primary reviewer, 2026-10-09. Human Interface principles reference read; non-Apple web contract, no Apple-platform compliance claim.

## Context And Evidence

Verified: required label children used separate grid rows; local schema failure inserted a top alert and focused the heading. Current native form/id association moves its single submit button to the summary. Existing schema controls validation; server schema remains authoritative. Current UI tests use a synthetic demo cart, canonical HCM/Bến Thành selection and no payment commit.

Assumption: per-field two-line error slots balance compact spacing against error layout stability. Unknown: formal OS screen-reader/device matrix; disclosed below. No product meaning depends on that unknown.

## Content Inventory

| Location/state | Content | Job and behavior evidence |
| --- | --- | --- |
| recipient error | Nhập tên người nhận (ít nhất 2 ký tự). | Schema trimmed min2/max120; field-specific red text and aria-describedby. |
| phone error | Nhập số điện thoại Việt Nam hợp lệ. | Existing 0/+84 pattern retained; three invalid-phone unit cases and actual123 UI. |
| province error | Chọn tỉnh / thành phố. | Code/name failures map to this selector; actual selection clears error. |
| commune error | Chọn phường / xã. | Dependent selector enabled by province, clears after canonical commune selection. |
| street error | Nhập địa chỉ cụ thể (ít nhất 5 ký tự). | Existing trimmed min5/max300; actual123 correction. |
| optional note error | Ghi chú tối đa 500 ký tự. | Existing max500 and textarea limit retained; unit501 case. |
| summary invalid | Kiểm tra các ô được đánh dấu để tiếp tục. | Persistent role=status, borderless red text; no invalid data reaches preview call. |
| summary idle/pending | Xem tổng quan → / Đang kiểm tra… | Existing overview destination; loading disables same form-associated button. |
| existing labels | Người nhận; Số điện thoại; Tỉnh / thành phố; Phường / xã; Số nhà, đường, tòa nhà / căn hộ | Label and * in one flex row; required native attribute, decorative star hidden from AX. |
| existing optional label | Ghi chú giao hàng · Không bắt buộc | One label row; no required attribute. |
| existing country | Quốc gia / Việt Nam | Readonly VN; same business restriction. |
| service failure/retry | Existing purchaseFeedback and Kiểm tra lần đã gửi text retained | Red borderless treatment; durable pending recovery is unchanged. |

## State Coverage

| State | Result | Evidence |
| --- | --- | --- |
| Default/action | PASSED | External native submit association, full inner-card width, marks inline. |
| Loading/disabled | PASSED | Actual Đang kiểm tra…; busy/cache/pending/regions guards preserved. |
| Empty | PASSED | Initial empty cart and new blank recipient form observed; five errors appear after attempt. |
| Success | PASSED | Actual Enter reaches Tổng quan đơn hàng with1.522.500₫. |
| Error/recovery | PASSED | Blank, short, partial, corrected input and no-scroll Enter; values preserved. |
| Offline/stale/partial | PASSED, scoped preservation | Existing feedback/session/idempotent recovery source reviewed; no backend/offline fault injection repeated for this frontend delta. |
| Unauthorized | PASSED, scoped preservation | Existing sign-in branch/owner calls unchanged; no authorization change. |
| Confirmation | PASSED | Consent enables payment; edit preserves address and resets consent after preview. No payment committed. |
| Destructive | NOT_APPLICABLE | No destructive action introduced. |

## Data Semantics

Address schema and canonical region membership remain server-controlled. Local errors only explain missing/invalid input, never imply payment creation. Country VN, VND totals and unknown freight remain unchanged. Optional note stays optional. Validation values are component-local, not logged or stored by this delta. Test data and screenshots are synthetic only.

## Mandatory Human Interface Principles

| Principle | Status | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Next action sits directly under payment detail and reaches overview. |
| Agency | PASSED | Edit preserves values; consent explicitly resets; no automatic payment. |
| Responsibility | PASSED | Invalid forms stop before preview; freight remains explicitly unknown/uncollected. |
| Familiarity | PASSED | Native form submission, existing labels, Vietnamese field corrections. |
| Flexibility | PASSED | Enter, focus, native selectors and actual CSS320/390; required name/state associations verified. |
| Simplicity | PASSED | One overview action; no top validation box or duplicate form-level list. |
| Craft | PASSED | Error slots stable, labels/asterisks align; red inputs and described errors clear independently. |
| Delight | PASSED | Smooth correction without clearing valid values or moving to heading. |

## Platform Fit And Pattern Checks

Web conventions: native form/id button association, Enter submission, focus-visible and aria-invalid/describedby, polite role=status; established blue-white-navy brand. No Apple-only controls/assets/expression. Writing/controls, feedback level, inclusion/localization and consequential confirmation: PASSED within current checks. Permission/onboarding/destructive patterns: NOT_APPLICABLE to this delta. Existing session recovery retained.

## Gate Results And Verification

Meaning/behavior, audience/context, natural tone, concision, actions/states, data/privacy, accessibility associations/keyboard, localization/wrapping, terminology, eight principles and in-context verification: PASSED, scoped to this form. Error text #b42318 on white has computed contrast recorded in final report; color is accompanied by field text and invalid semantics. Current screenshots show desktop and CSS320/390. Automated DOM checks verify associated names/descriptions, required states, live status, target sizes and geometry. Formal screen-reader/axe/device matrix NOT_RUN; this is not full WCAG certification.

Product Language Gate: PASSED for this scoped web form correction. Findings fixed: split asterisks, misplaced action, generic boxed validation/heading scroll. Test-harness failures: initial parseFloat unavailable in read-only browser evaluation, corrected with equivalent DOM numeric conversion; watched artifact writes reconnected Vite, final consent flow rerun using ignored output directory. No UI control/security/test assertion weakened. Required owner decisions: None. Residual limitation: optional freight/service failures retain existing business feedback; no new billing or freight validation rules added.
