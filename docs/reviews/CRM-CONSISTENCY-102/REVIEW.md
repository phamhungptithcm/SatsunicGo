# CRM consistency and filter review — 2026-10-07

Coverage: 21 Workspace navigation routes mapped to current components and shared controls. Source review only; NOT a complete visual/user acceptance audit. Intelligence DEGRADED (CodeGraph stale, CocoIndex daemon unavailable). Shared uncommitted work is changing concurrently; findings must be reverified before edits. No source/provider/runtime changes in this review.

## Confirmed cross-page findings

1. Filter application differs: Customers deliberately applies on submit and invalidates results when drafts change; Workbench queue changes URL and loads automatically; ContentEditor filters already-loaded rows immediately. A shared appearance must retain and explain these distinct semantics, not silently change query behavior.
2. ContentEditor search uses lowercase substring against loaded title/brand/category; category options derive from loaded rows. It is not global catalog search and does not implement diacritic-insensitive normalization. “Tất cả danh mục đã tải” already communicates part of this boundary. Keep a compact explicit loaded-data scope next to the results.
3. Workbench queue labels must reflect server stages. Server requests=REQUESTED; quotes=QUOTED; purchasing=QUOTE_ACCEPTED/PURCHASING; warehouse=PURCHASED/ORIGIN_RECEIVED/PACKED; balance=PACKED; ready=READY_TO_SHIP; holds=hold set. Do not equate queue with payment confirmation, shipment completion or ownership. Present useful existing queues; do not invent unsupported assignee/time/status queries.
4. Studio bypasses Workspace shell intentionally; filters q/state/category use URL. Visual consistency should share spacing/labels/control density without forcing CRM shell into editor or losing draft/navigation protection.
5. PageTabs often switches datasets/tasks, not filters (Finance, Membership, Activity, Shipping, Campaigns). Keep navigation tabs distinct from conditions that narrow results.
6. Header wording still differs from navigation labels: Workbench “Đơn hàng” versus “Yêu cầu & báo giá”, warehouse “Kho hàng” versus “Nhận kho & đóng gói”, finance “Đối soát thanh toán” versus “Thanh toán & đối soát”. Normalize list-page vocabulary; preserve detail identities.

## Route inventory and staff-focused recommendation

| Route | Current control/task | Recommended bounded change |
|---|---|---|
| overview | Preset/custom reporting dates, partial-data warnings | Compact date bar, show selected period and source scope; keep UTC/31-day validation |
| orders | Server queue selector and URL state | Clear visible “Hàng đợi”, compact existing options, active condition and reset |
| purchasing | Dedicated purchasing queue | Show queue context; no fake general filters; retain purchase readiness/assignment |
| warehouse | Dedicated receiving/packing queue | Show current work scope; retain receiving and packing distinctions |
| returns | Return intake and checks | Separate list tools from intake form; local filtering only if explicitly labelled loaded scope |
| shipping | Parcels/batches task tabs | Keep tabs, add only supported lookup/status controls after contract verification |
| changes | Accepted proposal work list | Preserve accepted-only scope; avoid misleading all-status filter |
| refunds | Refund requests and review actions | Clear pending work vs request entry; never imply requested refund is paid |
| finance | Transfer/membership/exception task tabs; bounded rows | Compact dataset tabs; retain 30-record and financial allocation caveats |
| documents | Invoice list and order URL context | Make current order condition visible/removable; do not clear creation draft silently |
| customers | Name prefix or exact ID; explicit submit | Visible labels, aligned search/submit, reset, clear applied versus edited conditions |
| follow-ups | Due window and “Việc của tôi” | Compact date/owner controls; preserve overdue/upcoming/all and explicit apply |
| support | Conversation list/detail | Separate selected conversation from list scope; contract-check supported lookup before adding |
| content | Loaded title/brand/category/status filtering | Visible search/status/category labels, reset, compact loaded-results scope |
| campaigns | Channel content/banner task tabs | Distinguish task switch from campaign conditions; preserve draft/publication meaning |
| membership | Plans/gift/reminders task tabs | Keep workflow tabs; no unnecessary filters on small plan list |
| staff | Lookup then protected access edits | Keep identity lookup as form, not decorative filter; preserve confirmation and role safety |
| activity | Audit/outbox dataset tabs | Label dataset and loaded scope; add date/status only if backend supports |
| studio | Independent editor shell, URL q/state/category | Align list filter density and labels, preserve editor-specific layout and unsaved guards |
| shipping-rates | Direction/warehouse/service/product dependencies | Align controls; retain dependent resets and draft/published distinction |
| settings | Protected configuration form | Do not add filters to a settings form; align field spacing and action hierarchy |

## Proposed visual/interaction contract

One compact labelled toolbar: search where useful, then meaningful supported conditions, then apply (server-submit surfaces only). Active applied conditions + “Xóa bộ lọc” only when there is something to clear. Dataset/task tabs remain separate. Consistent input heights, gap, primary action, keyboard focus and mobile wrapping. Search retains visible label and useful hint; placeholder is not its only label. During change/load distinguish draft/applied/current result; no stale result under newly selected conditions. Result count is “trong danh sách đã tải” where local or paginated. Preserve permission errors, partial/stale warnings, mutation locks and retry state.

## Priority

P1: align meaning/application/scope and clear filters in Customers/Follow-ups/Workbench/ContentEditor/Documents. P2: align dataset tabs and toolbars in Shipping/Finance/Activity/Campaigns/Membership. P3: coherent settings/rates/staff forms and Studio list spacing. New global backend searches, assignee/date filters, indexes and saved views need separate impact review.

## Acceptance and remaining evidence

Before success: current source plan approval, focused query/clear/stale/pagination tests, desktop/mobile screenshots of each affected list, keyboard and loading/error/empty states, Product Language Gate and fresh final implementation review. All-route browser audit and production validation NOT_RUN. No claims of employee time savings without observation.
