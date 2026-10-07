# CRM026 task inventory and bounded first delta

Source-backed inventory from Workspace route registry/imports and targeted task components. Gate DEGRADED: stale structural/semantic indexes, CodeGraph health passed, CocoIndex health failed. Repository map placeholder supplies no business facts. This is source inspection, not current rendered acceptance. SharedWIP preserved; root owns serial tests. No source/test changes yet.

| Route/task | Implementation | Primary work / current progressive disclosure | Review priority |
| --- | --- | --- | --- |
| overview | crm/Dashboard.tsx | Explicit UTC date-range snapshot, count links to queues | Role-aware destination audit; preserve bounded/nonlive caveats |
| orders | operations/Workbench.tsx | Select order, explicit action form, subordinate conversation/change/images/tools disclosures | Preserve required business actions; current-next-action review |
| purchasing | same Workbench purchasing queue | Funded purchase operations through same action form | Catalog/custom funding distinction |
| warehouse | same Workbench warehouse queue | Receive/inspect/pack with subordinate details | Avoid collapsing required evidence |
| returns | operations/Returns.tsx | Returned-line receive/inspect workflow with order link | Empty/loading/recovery clarity |
| shipping | shipping/Shipping.tsx | Select packed lines, create internal parcel, handoff/tracking updates | Internal parcel != carrier handoff |
| changes | orders/Changes.tsx ChangeQueue | Review customer-authorized proposals and apply/reject | Explicit consequences and no purchased-line drift |
| documents | invoices/Documents.tsx | List/open draft, issue/share/void/replacement/print | Immutable issued records; saved-but-detail-failed recovery |
| refunds | payments/Refunds.tsx | Create request disclosure, review/confirmed payout evidence | Request != money out |
| finance | payments/Finance.tsx | Membership/payment exceptions and reconciliation forms | Authority/currency/evidence clarity |
| customers | crm/Customers.tsx | Explicit name-prefix/exact-ID search, profile links | Confirmed blank area after filter edits |
| follow-ups | same Customers distinct keyed instance | Due/7-day/all + mine filters and profile links | Same explicit-filter next-action gap |
| customers/:id | crm/Customer.tsx | CRM notes/tags/assignee/follow-up, order/ticket links | Internal notes != customer messages; consent/membership projection |
| support | support/Thread.tsx StaffSupport | Ticket disclosure, reply and optional resolution | Preserve unknown-result/idempotency/context guards |
| content | content/ContentEditor.tsx | Edit/save content, saved preview disclosure | Draft/publication and visibility gates |
| campaigns | content/Campaigns.tsx | Campaign fields, selection/copy caption/link | Save != external publication |
| membership | membership/PlanEditor.tsx | Plan management and explicit complimentary grant | Gift != payment; preserve evidence |
| staff | settings/StaffAccess.tsx | Privileged staff/roles disclosure | Explicit privileged effects; no role weakening |
| activity | crm/Activity.tsx | Read-only audit or outbox, retry/reconciliation disclosure | Unknown email requires reconciliation, no blind resend |
| settings | settings/Settings.tsx | Exchange-rate/terms policy disclosure | Policy approval/effective window; no invented values |

Every registered task mapped; deeper per-state/runtime checks pending. Header level/empty state variation in non-crm-folder modules observed, not automatically authorized for broad redesign. Changes outside proposed path list require explicit coordinator ownership agreement to avoid conflicts.

## First proposed delta (before edits)

Paths: src/features/crm/Customers.tsx; Workspace.css only if source-backed layout need arises; NEW tests/browser/release-crm-taskflow.spec.ts; private026 docs. Existing specs untouched. No global styles/App/Ask/backend/index/contract edits.

Confirmed source behavior: change(filter) invalidates pending request and clears page; when not busy/no error/page null, result region is blank. Users see no distinction between a cleared filter result and loaded empty list. Add explicit filter-pending instruction to press existing Xem danh sách, plus loading role-status; preserve explicit submit, filter payloads, limit/cursor/asOf, auth and distinct-route keys. No auto-query on typing, debounce, extra button or pagination.

Test-first: native customer/follow-up filter edit must show apply instruction and no stale rows; click existing apply holds actual current list response, must show loading then actual result/empty recovery. Root runs before/after; existing lifecycle/navigation tests remain. One new guidance string/loading string inventory requires current screenshots and 390/768/1440 keyboard/loading/error/offline/unauthorized/stale evidence proportional to delta. Eight principles: Purpose identifies pending filter, Agency explicit apply remains, Responsibility no fake empty/count, Familiarity existing button name, Flexibility semantic status/native controls, Simplicity brief guidance, Craft real pending/loaded states, Delight clear next action. Final acceptance pending native evidence.

Risk low-to-moderate displayed-state meaning; no writes/business changes. New explicit filterDirty state vs derived page-null must distinguish initialload from edited filters (implementation plan: boolean set true only in change, cleared only when explicit current load begins; guard stale requests as today). Proposed scope awaits coordinator path acknowledgment; no protected edits yet. Full inventory acceptance NOT_RUN, production NOT_READY; actualAT/provider/performance unknown; memory candidates None, usage/cost unavailable.
