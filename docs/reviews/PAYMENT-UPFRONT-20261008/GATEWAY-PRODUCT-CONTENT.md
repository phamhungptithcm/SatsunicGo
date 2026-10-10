# Product Content Review — payment gateway hardening

## Scope

Surface: preserved cart/request/overview and existing payment route, added local gateway and payment recovery feedback. Audience: Vietnamese mua hộ customers and staff inspecting funded orders. Outcome: review exact goods and service fees, receive a reliable payment result and find the correct order/PDF. vi-VN web SPA (React19/router7), Chrome observed; browser/platform expression is native HTML, not Apple UI. Apple HIG used only through repository human-centered principles; no Apple platform contract applies. Reviewer: Codex, 2026-10-09.

Design read: a narrow centered white card, navy hierarchy and Satsunic blue actions, requested amount above a single payment action, safe recovery text close to that action. Existing R4 connected journey and cart appearance retained. Layout variance 2/10 (existing commerce conventions), motion intensity 1/10 (no new decorative animation), density 5/10 (short meaningful payment details; fault scenarios secondary disclosure). Source and fresh browser screenshots support this direction.

## Context and evidence

Verified: price and currency come from server snapshots; owner controls require verified Google and unlocked identity; browser query has no payment authority; provider PAID alone waits for signed proof or server reconciliation; under/overpaid actual money is held for review; PDF failures do not reverse money. 69 HTTP,17 business,19 rules,132 unit and independent-process evidence available. Current screenshots show pending demo gateway, paid320/390, funded order and wrong-link recovery. Existing shared UI uses #163cff, #111c35, thin borders and semantic controls.

Assumptions: these synthetic products/address strings illustrate commerce behavior. Demonstration fees/FX are not production prices. Unknown: real provider settlement, SMTP/inbox, deployed workers/Node22, screen reader OS and sustained production load.

## Inventory

GATEWAY-CONTENT-INVENTORY.json records every current Vietnamese text literal/JSX/template in affected checkout/payment/gateway/feedback/worker files with location and state, including retained business errors. Dynamic order IDs, recipient values and VND amounts are separately reviewed below. This inventory supplements rendered evidence; it is not the sole content gate.

| Location | State | Text/meaning | User task | Behavior evidence |
| --- | --- | --- | --- | --- |
| Gateway | Default | Thanh toán đơn hàng; requested VND and Mã thanh toán | Recognize merchant and amount before action | pending screenshot/server projection |
| Gateway | Action | Xác nhận thanh toán demo; Hủy thanh toán | Deliberate test choice | Both call authenticated provider transition; cancel only PENDING |
| Gateway | Disclosure | Cổng thanh toán demo · không thu tiền thật | Understand this is simulated | strict exact-demo guard; no PayOS API call |
| Gateway | Pending | Đang mở liên kết/Đang kiểm tra/Đang chờ thanh toán | Wait with disabled repeated actions | busy + flight + generation lifecycle |
| Gateway | Ambiguous | Kết quả đang được đối chiếu. Giữ nguyên lượt thanh toán này. | Avoid a second payment attempt | PROCESSING, no cancel; HTTP G009–G012 |
| Gateway | Fault disclosure | Mất phản hồi; Đã trả tiền, thông báo đến chậm; thiếu/thừa1đ; thất bại | Exercise realistic dependency outcomes | signed provider state through same allocation path |
| Gateway | Error | Liên kết chưa khớp… Quay lại để kiểm tra | Recover from wrong link | invalid-link320 and same-attempt return |
| Payment | Success | Thanh toán thành công; amount; linked order IDs; PDF icon | Confirm payment and open order | server paid only; paid320/390 and order320 |
| Payment | Review | Đã nhận actualAmount… cần đối chiếu trước khi phân bổ | Recognize money received but not yet funded order | MONEY-* actual evidence, no fabricated order/PDF |
| Checkout | Transport failure | Chưa tải được tổng quan… thông tin nhận hàng vẫn được giữ | Retry without retyping or paying again | caught failure only sets error, earlier timeout retained form; feedback unit9 |
| Receipt worker | Email demo/no recipient/config | demo_delivered/pending_recipient/pending_configuration | No claim of real inbox delivery | outbox transport demo_sink or unconfigured; rules |
| PDF | Collected statement | Real row amounts, method demo, paid timestamp GMT+7; not fiscal tax invoice | Understand exactly this receipt and linked earlier payments | PDF hashes, text tests, geometry and rendered PNG |

## State coverage

| State | Applicable | Result and evidence |
| --- | --- | --- |
| Default/action | Yes | Real browser gateway has merchant/amount/action; existing recipient->overview remains coherent |
| Loading/pending/disabled | Yes | Busy disables duplicates; status text, bounded receipt polls and manual retry remain |
| Empty/no result/true zero | Yes | Missing link has recoverable unavailable text, never amount=0 substitute; freight unknown is Chưa tính, not0 |
| Success | Yes | Authoritative paid card, real child link, exact amount; compact green icon |
| Error/recovery | Yes | Wrong link browser plus transport feedback tests; reviewed money holds receipt/order until reconciled |
| Offline/stale/partial | Yes | Timeout retained address; same pending command retained on ambiguous commit; drift/expiry HTTP checks; gateway fault is a simulated outcome, not a real offline network test |
| Unauthorized/forbidden | Yes | Signed out UI; owner API/rules deny cross-user access, locked capture goes to private review |
| Confirmation/cancellation | Yes | Checkbox must be checked anew after edit; provider cancellation only verified unpaid; no destructive financial deletion |

## Data semantics

Money is integer VND formatted vi-VN. Researched source prices, FX and fees are frozen by the server; catalog is full listed price. Freight is separate estimate/unavailable/quote_required and not included as a fictitious settled charge. Partial provider receipts use actual paidAmount, never requested amount. Null/unknown/expired have explicit states. Receipt dates come from the verified provider's frozen paidAt, display Vietnam GMT+7; delayed webhook processing does not replace the actual payment time. G008 plus signed-time mismatch tests verify this correction; new rendered PDFs show method/time/rows/totals, previously issued receipts remain immutable. Private provider key, email, ledger and outbox never appear in the link projection. Order UUIDs are links with descriptive accessible names. Subject/body of demo outbox are receipts, not real-email delivery proof.

## Mandatory Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Amount -> explicit demo action -> linked order/PDF; fresh gateway and paid cards |
| Agency | PASSED | Explicit overview confirmation, edit resets it, unpaid cancel and recovery links; unknown cannot silently create a new payment |
| Responsibility | PASSED | Demo disclosed, actual received money held safely, no fake zero/freight/inbox/real PayOS claims |
| Familiarity | PASSED | Existing commerce labels, Vietnamese VND, connected journey, native links/buttons/details/selects |
| Flexibility | PASSED | Mixed/custom-only/30-line cart, same-link reload/reconcile, keyboard route and manual retry; preserved business forms |
| Simplicity | PASSED | One main action, narrow card and secondary fault disclosure, icon PDF with accessible name |
| Craft | PASSED | CSS320/390 no overflow, measured44px PDF, wrapper safeguards and Vietnamese PDF glyph/layout checks |
| Delight | PASSED | Immediate clear green success, matching linked order and compact receipt control without extra mandatory form steps |

## Platform and pattern fit

Cross-platform transactional web; semantic headings/status/alert, native details/summary, buttons for mutation and links for navigation. Known brand blue on white, navy body and #64748b hints preserve contrast hierarchy. Gateway controls corrected to minimum44px; PDF about44x44. Keyboard Tab from PDF moved to Xem đơn hàng. No new animation delays payment; no added listeners/observers in gateway. Receipt timer max12 polls and cleanup, per-user generation checks and finite objectURL revocation reviewed. Dialog/focus trap/RTL not applicable to these Vietnamese routes. Full screen reader OS, text zoom/device browser matrix and automated axe/Lighthouse NOT_RUN, not a compliance certificate.

| Gate | Status | Evidence |
| --- | --- | --- |
| Eight principles | PASSED | All8 current rows above |
| Target platform | PASSED | Real Chrome semantic controls and source; native web, no Apple-only expression |
| Meaning and business agreement | PASSED | Actual callback/state/ledger/receipts and shipped strings; no browser-query authority |
| Audience/tone/brevity | PASSED | Natural Vietnamese retry instructions; raw deadline-exceeded replaced with guidance |
| Actions/state coverage | PASSED | Browser default/success/recovery + executed HTTP negative states |
| Data and privacy | PASSED | Owner/rules gates, server amounts, unknown estimates clearly named |
| Scoped accessibility/localization | PASSED | Keyboard, named controls,44px target,320/390 wrapping, vi-VN and GMT+7 PDF |
| In-context verification | PASSED | Fresh GATEWAY-BROWSER-CHECKS.json screenshots and PDF renders; no source-only UI pass |

Decision: Product Language Gate PASSED for this scoped demo change. Fixed raw transport text and small gateway secondary targets. Browser native download completion NOT_VERIFIED; no claim of actual file-save success from clicking. API/Storage bytes/hash and PDF render are verified separately. Native screen reader, real email and production/provider deployment remain outside this local handoff.
