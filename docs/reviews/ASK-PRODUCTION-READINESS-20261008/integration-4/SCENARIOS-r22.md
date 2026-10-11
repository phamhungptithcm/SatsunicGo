# Ask · Scenarios

Current candidate: SOURCE-r22, CHECKS-r22.350logic tests in15files and83browser cases (58workcell+25legacy), no workcell skip/flaky and no browser retry. Actual React/hooks/domain/approved-knowledge caller execute against declared synthetic Auth/Firestore/provider/transport. These are local success/failure scenarios, not live customer, payment, native AT or production proof.

| Family | Happy behavior exercised | Bad behavior exercised |
| --- | --- | --- |
| Request | Chat prepares/edits draft; button/chat review same immutable payload; exact contextual yes sends once | First yes opens review only; conditional/mixed/quoted yes does not consent; hidden/history/expired/source-changed review rejected |
| Draft editing | Manual notes retained while chat changes quantity; prepared item refreshes name/link | Quantity/variant/market ABA cannot resurrect old overrides; guest may view draft but has no durable command authority |
| Catalog | Fresh typed public product snapshot/version/variant/price/terms review; full-payment semantics | No cached/fabricated LLM price authority; stale changed source/version or tampered payload fails closed |
| Custom quote/final | Reviewed owned quote/deposit/final amount and source terms | Unrepresentable date/unsafe amounts, expired quote, wrong order identity/version cannot proceed |
| Receipt | Exact owned order, all items and completion consequence reviewed | Partial/uncertain receipt language cannot consent; no blind duplicate operation |
| Pending/recovery | Owned verified outcome settles after locale/view change; unknown keeps envelope and reconciliation reachable | Wrong owner/auth epoch/CID callbacks rejected; no_operation unlocks editing but requires fresh preview |
| Context/knowledge | Bounded heading+paragraph excerpts, accent-folding, multi-topic source coverage and original citations | Unpublished/stale/locale/private/hash-changed sources rejected; transaction caller rechecks authorization/revision/quota/abort; ambiguous follow-up asks topic |
| UI/navigation | One current task outside log, scroll, mobile chat/task, history waypoints, Escape/keyboard/reduced motion | History inert/read only, no hidden review consent; long form/200%text/static-sticky controls reachable and navigation ancestor clipping rejected |
| Performance | Ten warm two-rAF task/chat switch samples, stable bounded DOM/window/waypoints | Browser errors checked; no load/concurrency/provider latency or real-user benchmark claimed |

Executable current workcell cases:

1. first request reviews, exact yes sends once VI
2. native button and chat share reviewed payload VI
3. first request reviews, exact yes sends once EN
4. native button and chat share reviewed payload EN
5. closed review must reopen before yes; Escape returns to chat first
6. history including latest turn stays read only across locale changes
7. ordinary answer invalidates consent and yes requests a fresh review
8. unknown action retains identity and exposes reconciliation outside locked form
9. dirty recipient survives order revision and remains unsaved
10. auth A B A cannot resurrect reviewed consent or private draft
11. long forms have bounded independent scroll and reachable composer at 320
12. long forms have bounded independent scroll and reachable composer at 390
13. long forms have bounded independent scroll and reachable composer at 768
14. long forms have bounded independent scroll and reachable composer at 1440
15. verified acceptQuote reviews exact order and amount before contextual consent
16. verified approveFinal reviews exact order and amount before contextual consent
17. verified confirmReceipt reviews exact order and amount before contextual consent
18. edit and approval in one sentence only edits VI
19. edit and approval in one sentence only edits EN
20. expired quote and updated order cannot reuse consent
21. profile task preserves typed values across chat view and history prevents account editing
22. warm task/chat switches remain bounded with keyboard and reduced motion
23. locale change during dispatch settles owned verified outcome and never resends
24. catalog chat selection reviews server-read price and terms VI
25. catalog chat selection reviews server-read price and terms EN
26. chat edit opens current task from conversation and never auto-submits
27. mobile quote monetary summary is visible before confirming VI
28. mobile quote monetary summary is visible before confirming EN
29. anonymous chat draft opens owned view without durable action authority
30. chat quantity merges with unsaved manual notes across task switches
31. ABA manual quantity-0 cannot replace latest chat edit in saved review
32. ABA manual variant-0 cannot replace latest chat edit in saved review
33. ABA manual market cannot replace latest chat edit in saved review
34. a fresh prepared item replaces dirty name and link while keeping unsaved notes
35. 200% text long-form VI 390
36. 200% text quote VI 390
37. 200% text receipt VI 390
38. 200% text long-form VI 1280
39. 200% text quote VI 1280
40. 200% text receipt VI 1280
41. 200% text long-form EN 390
42. 200% text quote EN 390
43. 200% text receipt EN 390
44. 200% text long-form EN 1280
45. 200% text quote EN 1280
46. 200% text receipt EN 1280
47. short-height reflow and keyboard long-form VI 450
48. short-height reflow and keyboard long-form VI 650
49. short-height reflow and keyboard quote VI 450
50. short-height reflow and keyboard quote VI 650
51. short-height reflow and keyboard receipt VI 450
52. short-height reflow and keyboard receipt VI 650
53. short-height reflow and keyboard long-form EN 450
54. short-height reflow and keyboard long-form EN 650
55. short-height reflow and keyboard quote EN 450
56. short-height reflow and keyboard quote EN 650
57. short-height reflow and keyboard receipt EN 450
58. short-height reflow and keyboard receipt EN 650

Native AT execution checklist remains NOT_RUN (locked Mac): VI/EN quote target/currency/deposit and consequence; task heading focus; Edit/back/history/restored composer; receipt order/all items/completion; sending/unknown announcements, reachable reconciliation and actual disabled controls. AX tree and text200 proxy files are source-bound in SCREENSHOTS-r22, but do not close this checklist.

Live release checks remain NOT_RUN: authenticated owner/role/AppCheck/MFA and Firestore isolation; real research→options→selected draft→staff-reviewed quote→customer payment readback; wrong-owner/stale quote/unknown provider/duplicate operation recovery; official corpus admission/readback; runtime retention and cleanup/backups; clean artifact deployed/source comparison and rollback/restore. Completion-3 LIVE-RELEASE-PLAN carries the concrete live packet.50000VND remains fully reserved and actual bills unavailable; no extra paid calls here.
