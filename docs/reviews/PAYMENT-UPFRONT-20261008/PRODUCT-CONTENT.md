# Product Content Review

## Scope

- Surfaces: review-only synthetic payment UI and three PDF payment-receipt samples. No application text was changed.
- References: `docs/previews/SATSUNICGO-UPFRONT-PAYMENT-20261008.html`, `docs/previews/payment-upfront-receipts.py`, `output/pdf/payment-upfront-20261008/`; full static/dynamic/PDF text inventory: `CONTENT-INVENTORY.json` (110 contextual entries).
- Audience/task: Vietnamese customer checking the amount before paying for a custom purchase and understanding additional costs; finance/buyer verifying the same breakdown.
- Platform: responsive web, A4 PDF, vi-VN / VND / explicitly labeled source currency / UTC+7 sample time.
- Brand: blue #163cff, navy #111c35, white/light surfaces and thin borders; existing shared CRM/form/payment primitives will govern implementation.
- Apple platform HIG compliance: NOT_APPLICABLE. Eight human-centered principles used as a quality reference; no Apple assets or conventions copied.
- Reviewer/date: root, 2026-10-08; manual artifact review, not independent application acceptance.

## Context and evidence

Verified current app facts: catalog full payment, custom 50% deposit, owner/role-gated server commands, guarded shipping, final-only internal statement and link-only email. The new business behavior is proposed, so all new interactions in the preview say design/sample and do not imply a completed transaction.

Assumptions pending user response: initial goods + known service/fees in full, unpriced shipping collected later; PDF is payment confirmation rather than statutory tax invoice. Sample 5% fee and 25,000 VND/USD are illustrative values, not verified commercial configuration.

Design read: a calm purchase confirmation with the amount and its components visible before the primary action. Inspiration: existing SatsunicGo blue/white/navy product language. Layout variance 2/10 (recognizable form and summary); motion 0/10 (no consequential animations); density 5/10 (compact costs with preserved explanation). No invented seller tax identity, bank QR, payment badge, urgency or shipping promise.

## Content inventory and state coverage

The machine-readable inventory records every HTML text node, explicit dynamic message and each PDF page. The table below maps material state meanings; amounts are typed sample values, not live records.

| Surface/state | Current application meaning | Proposed sample content | Evidence |
| --- | --- | --- | --- |
| Request/default | Request followed by staff quotation/two installments | “Giá bạn đã tìm hiểu / mỗi món”; amount breakdown and 100% initial payment | Initial desktop/mobile images; pricing policy in plan |
| Initial consent/disabled | Legacy acceptance freezes deposit | Explanation of known initial costs and possible additional amount; unchecked disables next | CUA checkbox with Space enabled action; editing price cleared consent |
| Invalid input | Existing request has no structured researched price | Per-field price/quantity error, “Chưa tính được”; no fabricated zero | Negative price kept quantity aria-invalid=false; amount-limit blocks |
| Decimal price | Shared money/FX is integer/rational | 58.25 USD × 2 + 5% sample = 3,058,125 VND | CUA observed rendered amount; sample parser uses string integer cents |
| Additional costs/default | Final aggregate approved after packing | Price +200,000, fee +10,000, new shipping +240,000; total additional 450,000 | Additional mobile screenshot and PDF 02 |
| Additional costs/review hold | Domain hold blocks fulfillment | “Chờ nhân viên kiểm tra chi phí”; approval and payment disabled | Fresh browser check heldApprovalDisabled=true, heldPayDisabled=true |
| Pending | Bank confirmation required | “Đang xác minh… Chưa ghi nhận tiền” | Payment scenario / browser state |
| Unknown/recovery | Provider creation may be ambiguous | Check same pending request before paying again | Unknown screenshot; plan intent recovery |
| Success / partial PDF | Payment and document delivery separate | “Trạng thái mẫu: đã thanh toán. Phiếu đang được xử lý.” | Explicit sample status, no transaction performed |
| PDF/default | Internal statement, final-only; browser print | Branded receipt per transaction; initial receipt does not say shipping/final costs complete | All five rendered PDF pages visually reviewed; extracted text |
| PDF amounts | No issued receipt in this preview | Fixed downloadable examples, clearly independent of editable calculator | In-context note and sample-values.json |
| True zero | No recorded funds vs unavailable must differ | Initial previous paid 0; known remaining 0 with shipping explicitly “Chưa chốt” | Initial PDF; exact sample arithmetic |
| Offline/stale/unauthorized/locked | Distinct safe recovery/authorization needed | Specified in implementation plan; no live backend in prototype | NOT_RUN for app states; cannot accept app Product Language Gate |
| Cancellation/destructive | Cancel checkout differs from cancel order | “Hủy trang thanh toán không tự hủy đơn” | Payment note; no irreversible action in prototype |
| Empty documents / failed email | Not an issued receipt or sent message | Future owner inbox/download/error handling in plan | NOT_RUN for app; no fabricated sent-email state |

## Data semantics and privacy

Price input is a researched estimate. Only the proposed server snapshot will authorize payable; sample calculation cannot do so. 100% means all initially determined goods/fees, with unknown shipping disclosed. Top-up means accepted revised known liability minus already confirmed net payment. Pending refund/ambiguous transfer are holds and must not trigger another full collection.

Receipt time and values are fixed at each verified payment, separate from a future final statement. Sample buyer/order/receipt identifiers are invented and visibly marked demo; no production data, bank details or real contact information were loaded. PDF title and footer explicitly say payment confirmation / not tax invoice. No privacy disclosure is replaced by a transient toast.

## Eight human interface principles

| Principle | Artifact status | Evidence / application limitation |
| --- | --- | --- |
| Purpose | PASSED | Primary amount, item/source price and receipt purpose precede secondary detail. |
| Agency | PASSED | Explicit cost consent, clear cost-review choice, no silent extra payment; demo labels distinguish simulation. |
| Responsibility | PASSED | Unpriced shipping, sample fee/rate, mock funds and non-tax receipt status stated in context. |
| Familiarity | PASSED | Giá hàng, phí mua hộ, vận chuyển, còn phải trả, phiếu xác nhận; avoids backend status jargon in customer controls. |
| Flexibility | NOT_RUN | 390px and desktop visual checks passed; keyboard checkbox works; full 200%/assistive-tech/localization app acceptance not run. |
| Simplicity | PASSED | One price form/summary and clear additional-cost table; no unnecessary modal. |
| Craft | NOT_RUN | Artifact fixes and all PDF pages checked; full real-shell state and accessibility evidence awaits implementation. |
| Delight | PASSED | Calm confirmation and preserved calculation/recovery explanation; no celebratory claim on uncertain funds. |

## Platform/pattern checks

Web buttons/labels/checkboxes, persistent inline role=alert/status, real disabled state, focus-visible outline and locale currency; no Apple-only expression. PDF fonts are embedded/searchable, with repeated table headers and stable totals. Formal PDF/UA compliance is NOT_RUN; implemented accessible HTML document view is required as a companion.

| Pattern / dimension | Status | Evidence |
| --- | --- | --- |
| Meaning, tone, brevity, terminology within sample | PASSED | Demo flags, context inventory, actual UI/PDF renders; shipping pending remains unknown. |
| Feedback/interruption | PASSED | Status local to payment/cost; no success dialog or toast used to hide recovery. |
| Confirmation/consequence | PASSED | Initial and additional amounts named in consent; review hold disables approval. |
| Onboarding/context help | PASSED | Help beside source price and unpriced shipping; no forced tutorial. |
| Permission/privacy/accounts | NOT_RUN | No backend/auth in sample. Full owner/locked/forbidden app tests planned. |
| Accessible controls/keyboard subset | PASSED | Labelled fields, checkbox Space, focus and disabled-state observation. |
| Full accessibility/localization/text expansion | NOT_RUN | 200% zoom, screen reader, EN copy and real app route evidence absent. |
| In-context artifact rendering | PASSED | Desktop + 390px mobile, all five PDF pages; JS syntax and format checks pass. |
| Real app state coverage / data agreement | NOT_RUN | New app/business flow not implemented yet. |

## Verification / decision

Artifacts: desktop/mobile initial, mobile additional-review hold, desktop unknown-status screenshots; no horizontal overflow at 390px (contentWidth=390); no warn/error console entries observed in sample session. Three PDFs contain embedded TrueType/Vietnamese searchable text, correct sample amounts, 30/30 long rows and in-page glyph bounds; pages 1/1/3. The quantity header, truncated mobile name, per-field error, decimal parsing, fixed-PDF sample semantics and review-hold defects were corrected and checked again.

**Product Language Gate for application handoff: BLOCKED**, because application and full accessibility/state evidence is NOT_RUN. This file supports approval of the design/plan only; it cannot certify a shipped payment experience. Need approved plan, implemented server/client agreement, real-shell states, accessible HTML/PDF download and fresh content review before passing.
