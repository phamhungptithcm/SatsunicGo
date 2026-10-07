# Product Content Review — CRM-UX028

Decision: BLOCKED pending current rendered verification. Vietnamese web staff CRM; human-centered principles adapted to web. This document does not claim complete CRM language approval.

Changed string inventory in Workbench: “Quay lại danh sách”; “Chọn một đơn để xem chi tiết”; “Thông tin và thao tác của đơn sẽ hiển thị tại đây.”; hold explanation; wrong-stage explanation; unavailable-payment explanation with reload instruction; insufficient catalog full-payment explanation; insufficient custom deposit explanation. Exact source strings are in claimPurchaseBlockReason and the selected/list panels. Each prerequisite reflects purchaseAmount, stage, hold, collected, refunded and reserved refund amounts; server command remains authoritative. No refund request is described as completed money transfer.

| Principle | Current status | Evidence and remaining work |
|---|---|---|
| Purpose | Pending rendered verification | Selection prompt and direct mobile detail implemented; native three-width browser PASS |
| Agency | Source and unit verified | Disabled claim explains unmet prerequisite; 4 new tests pass; browser PASS |
| Responsibility | Partial | No invented payment availability; unavailable projection blocks; financial recovery NOT_RUN |
| Familiarity | Partial | Plain Vietnamese list/detail labels; ratio settings remain an open all-screen finding |
| Flexibility | Pending rendered verification | Mobile Back restores position and mounted draft; keyboard/reduced motion browser scenarios PASS |
| Simplicity | Partial | Mobile list/detail separation implemented; repeated forms elsewhere remain open |
| Craft | Partial | Scoped spacing, focus target and decorative icon; all-page contrast/zoom/AT NOT_RUN |
| Delight | Pending rendered verification | 160ms scoped entry transition; reduced-motion override; observed smoothness NOT_RUN |

State coverage: before-fix rendered list, selected detail, loading, customer-detail empty related records. After-fix source and SSR prerequisite states verified; native list/detail/back/draft/reduced motion at three widths PASS with controlled list projection. Save/success/error/timeout/offline/forbidden/destructive confirmation and full staff workflows NOT_RUN by this task. Current root integration loading issue reported separately.

Platform fit: semantic web buttons/forms, visible text and decorative icons, keyboard focus, responsive layout. No Apple-only control or expression mandated. Target staff study, screen-reader, localization expansion, full keyboard, zoom and all-page mobile evidence remain outstanding. Existing scope/freshness/financial disclosures are retained.

Current rendered evidence: BROWSER_ROUND1.json verifies three widths with reduced motion, focus, first/last selection, Back and preserved draft. after-list-390/768/1440.png captures returned-list state; does not show selected detail. Full-motion smoothness and complete state/principle coverage remain NOT_RUN. Frozen source hashes unchanged after run.
