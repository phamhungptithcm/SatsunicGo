# NOTIFICATIONS080 Product Content Review

Vietnamese web Notifications,2026-10-06. Direct consistency request; optional clarification about brand versus page icons unanswered after60seconds. Scope assumption: page icons, clearly communicated. No shared brand logo changed. Existing content/state/data contract in NOTIFICATIONS-079-CONTENT_REVIEW.md rechecked against current module; no user-visible strings changed. Existing Đã đọc/Chưa đọc accessible labels now reside on named role=img badges; decorative SVGs hidden. Complete current strings inherited unchanged from079 inventory, no missing new user text.

All headers/list rows/loading/empty/error now use one local22pxSVG vocabulary, stroke1.7, blue/pale background and12px rounded badges. Sizes42/38/48 follow header/row/state roles; missing icons on list rows added. Unread marker retained on the row badge. Loading uses same glyph family/spin and reduced-motion static alternative. Empty uses inbox rather than a misleading success tick. No mark-read, query, callable, route, retry or sensitive-data behavior change.

| Principle | Result | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Consistent icon hierarchy supports actual inbox states |
| Agency | PASSED | Existing links/read/retry untouched |
| Responsibility | PASSED | Empty icon no false success; read badge remains snapshot-derived |
| Familiarity | PASSED | Same SVG style and blue palette across page |
| Flexibility | PASSED |390/768/1440, reduced motion/200percent keyboard checks |
| Simplicity | PASSED | Reusable component, no new visible prose |
| Craft | PASSED | Stroke/radius assertions, decorative semantics, unread marker |
| Delight | PASSED | Balanced repeated icon containers, no mixed text glyphs |

State inventory/default/read/unread/pending/empty/error/partial/retry identical to079. Meaning/data/privacy/locale/platform fit/accessibility semantic/terminology/concise copy gates PASSED within scope. Source-reviewed owner query/server mutation preserved. Current synthetic desktop/mobile/error screenshots and8browser tests. Screen reader/live data recovery NOT_TESTED. Product Language Gate PASSED. No broad brand/logo change claimed.
