# Product Content Review — revision 2

Scope: Vietnamese web mockup; synthetic custom/upfront order. User requested a cleaner design with animation, then explicit update dates/times under every milestone. Only the HTML prototype and its design evidence changed. No application contract, provider, auth, payment or persistence change.

Evidence: CONTENT-INVENTORY-R2.json captures all 15 rendered fixtures; VERIFICATION-R2.json captures narrow/desktop behavior; r2-desktop.jpg and r2-mobile-390/320.jpg show current layout. Source mappings/unknowns are inherited from PLAN.md, with timestamp rules in REVISION-2-PLAN.md. Target: web; native select/buttons/links, lists/time elements, focus and aria-current. Apple-specific expression is not applicable.

## Content inventory and meaning

Existing 15-state meaning retained. Changed/shared strings: “Đơn hàng của bạn”, “Thời điểm cập nhật từng mốc”, “Giờ Việt Nam · UTC+7”, “Hiện tại”, “Tiếp theo”, “Chưa có cập nhật”, “Lịch sử cập nhật”, “Xem chuyển động”, “Giảm chuyển động”, “Về bước hiện tại”. Inspecting a milestone shows its explanation and recorded timestamp without advancing the order. All accessible milestone names include state and timestamp, or the lack of an update. Dates use day/month/year and 24-hour time. Fixture dates have explicit UTC+7 datetime attributes. ETA remains separate from recorded events and staff-estimated.

Loading/empty/error/unauthorized/partial/stale/failed/returned/hold/cancelled/delivered states are retained and rendered. Retry restores the mock fixture. Destructive and financial actions: not applicable. Nothing sends a request or changes order/payment state. Reduced-motion controls affect only the prototype presentation. Dates, counts and references are illustrative, with no real customer identity.

| Principle | Prototype result | Evidence |
| --- | --- | --- |
| Purpose | PASSED | Current state, ETA and per-milestone dates answer the requested tracking questions. |
| Agency | PASSED | Click/Enter inspects milestones; reset returns focus; preview replay/reduce controls are explicit. |
| Responsibility | PASSED | Future dates remain unknown; ETA is distinguished; no invented location/live movement. |
| Familiarity | PASSED | Existing blue/white brand and account rail; conventional timeline and date formatting. |
| Flexibility | PASSED | 1440/390/320 layouts rendered; all 15 fixtures fit at 320px; sampled keyboard control works. |
| Simplicity | PASSED | Repeated completed/upcoming text removed; next action is immediately below chart. |
| Craft | PASSED | Semantic time elements, date-aware names, current marker, recovery states, finite motion and coherent event times. |
| Delight | PASSED | Finite line/node reveal and 8px content transition clarify the change; no continuous travel animation. |

Platform fit, audience, meaning/behavior, brevity, terminology, natural tone, displayed-data semantics and in-context verification: PASSED for this prototype. State/data inventory is current. Dates are explicit and unknowns are textual. Basic accessibility covers native controls, visible labels/focus, color-independent state, current-step semantics and sampled keyboard focus restoration. Full AT audit, translated text, 200% zoom and real-device coverage remain NOT_RUN; no production accessibility claim is made. Motion is removed by CSS system preference and the tested preview toggle. Actual OS preference was not changed.

Product language design decision: PASSED for the mockup. Formal application Product Language Gate: NOT_READY pending real integration, missing timestamp behavior, authorization/failure evidence and full applicable accessibility/localization validation.
