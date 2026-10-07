# Workbench next-action hierarchy — source-backed owner handoff

Read-only biz review. Root owns Workbench; no biz source/test edits. Existing ActionForm allows role actions independent of stage and defaults first enum entry (OWNER custom: issueQuote regardless stage; OWNER catalog: claimPurchase regardless stage). Minimal simplification: move ActionForm immediately after compact identity/status/hold/items/money, before conversation/proposal/evidence/tools. Reorder/default actions by next eligible step but retain all currently permitted action options, server remains authoritative. Avoid new stage filter removing assertions or recovery/admin actions.

| Stage | Preferred existing action when role permits | Decision caveat |
| --- | --- | --- |
| REQUESTED/QUOTED custom | issueQuote | QUOTED is update quote; customer acceptance remains customer action |
| QUOTE_ACCEPTED | claimPurchase when verified available funds meet purchaseAmount and no hold; otherwise verifyTransfer for OWNER/FINANCE | Catalog full payment; custom accepted deposit. Transfer form is evidence reconciliation, never automatic money confirmation |
| PURCHASING | recordPurchase | Partial quantities/line ceilings; OWNER/BUYER only |
| PURCHASED | receive | OWNER/WAREHOUSE; partial receipt during PURCHASING also permitted by evolve |
| ORIGIN_RECEIVED | pack | No hold, receivedQuantity matches item total |
| PACKED custom | finalize | OWNER/OPERATIONS_MANAGER; changed total may require explicit customer approval before remaining collection |
| PACKED catalog | no finalize; inspect hold/packing/funds | Catalog skips finalize; no surcharge/deposit/balance |
| READY_TO_SHIP | dispatch | OWNER/WAREHOUSE; canDispatch authority includes available final money/freight/packing/hold |
| IN_TRANSIT | track | OWNER/OPERATIONS_MANAGER; tracking delivery is not customer receipt |
| DELIVERED | customer receipt pending (no staff completion action) | Keep secondary staff controls available, don't fabricate staff confirmReceipt |
| COMPLETED/CANCELLED | no highlighted lifecycle action | Existing finance/history/recovery remain secondary |

Role choice must be intersection with existing ActionForm actions; OPERATIONS_MANAGER cannot claimPurchase/recordPurchase even though navigation includes purchasing, WAREHOUSE no money fields, FINANCE no buying. SUPPORT no ActionForm. Unpaid BUYER receives truthful awaiting payment status rather than verifyTransfer. Hold may highlight existing hold action for OWNER/OPERATIONS_MANAGER, but absence of hold does not authorize any transition. Do not use reduced warehouse money projection for catalog purchaseAmount/orderStageLabel decisions; role/data-specific safe status needed.

Secondary groups: (1) conversation, (2) change proposal, (3) purchase/receiving/packing records and images, (4) tools/history/documents. OperationsDetails and ProposeChange already have details; don't wrap them in redundant nested details. Conversation OrderConversation defaultOpen is false in existing component; preserve lazy loading/focus/in-flight state when moving. Keep component keys unique per selected order. Native selectors/labels should stay intact unless content review approved; existing browser assertions depend on exact actions and field labels.

## Native proposal journey using existing UI and commands

Use separate fixture actor identities OWNER + customer in emulator, two custom item lines, quote terms emulator-v1; seed via submitRequest → issueQuote(q verified rate) → customer acceptQuote({quoteVersion:1}) → OWNER verifyTransfer(accepted deposit unique bankTransactionId/evidence/reason) → claimPurchase → recordPurchase({quantity:1,lines:[{line:0,quantity:1}],supplierOrder,evidence,actualSourceMinor}). Stage PURCHASING purchasedLines[1,0].

Native OWNER /crm/orders?order=ID → open summary 'Đề xuất thay đổi để khách duyệt'; kind substitution; leave purchased line0 name/variant/cancel untouched; line1 replacementName nonempty + replacementVariant; cancellation0; reason≥5; finalPayable from verified fixture quote or approved ≤catalog cap (this fixture custom); actualCosts≤finalPayable; evidence≥5. Submit 'Gửi đề xuất và tạm giữ xử lý'. Assert order hold, pending proposal, bought line0 unchanged, collected/refunded unchanged.

Customer /account order detail → CustomerChanges sees pending proposal, terms/payable, no private evidence → click 'Đồng ý thay đổi và tổng phải trả'. Assert accepted, not applied; before customer acceptance direct apply must reject (existing integration covers). OWNER /crm/changes → 'Áp dụng quyết định đã duyệt'. Assert proposal applied, line1 replaced, line0 name/variant/purchased count untouched, hold restored according to resolveHold/previousHold, financialAdjustment exactly1; collected/refunded unchanged. Reload and ensure no second apply card. Optional separate pending proposal customer reject preserves items and restores prior hold. Requires native browser window, not run by biz.

Native purchased-variant bypass regression cannot be submitted by this UI alone: ProposeChange filters lines by cancelQuantity>0 or replacementName, drops variant-only lines. Keep existing server integration rejection test for crafted multi-line payload. Don't claim native scenario covers crafted bypass. CustomerChanges renders substitution as 'hủy0' before replacement, a copy concern for UI owner; does not alter funds but should describe replacement directly under Product Language Gate.
