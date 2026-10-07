# CRM-UX028 — Review CRM UI/UX

Date: 2026-10-05 America/Chicago. Decision: NEEDS_CHANGES; approved Workbench slice implemented; browser verification pending; release NOT_READY.

Evidence: current source, live IAB localhost:5187 synthetic fixtures, desktop1280×720 and mobile390×844. Existing browser session restored staff access; no credentials read, writes submitted, provider actions, seed/reset/build/service restart. 19 navigation screens captured plus customer detail. Screenshots are viewport captures; not complete state acceptance. Some initial captures contain loading; documents-settled.jpg is follow-up. Historical memory used only for identifying owners, then live coordination verified. SOURCE_MANIFEST read-time hashes are not an immutable release candidate.

Repository gate DEGRADED: both indexes stale, CodeGraph health passed; CocoIndex gate health failed but semantic query returned results. Index output is supporting context, source verifies conclusions. No claim of complete graph impact. One independent agent supplied bounded factual source inventory; no substantive independent UX approval. Apple HIG is a quality reference for this web CRM; no Apple affiliation or native visual imitation.

## Main findings

- P1 UX028-01: Workbench mobile selected detail is below the whole list. At390×844, first of30 selected records yields h2 top6435px, focus remains selected card. Screen remains at list. Workbench.tsx renders crmList before selected panel inside workColumns; narrow CSS stacks columns. Fix mobile list/detail mode with clear Back to list and preserved position/filter; desktop selected panel focus/reveal without unexpected scrolling. Preserve pending/error drafts and stale-response guards.
- P1 UX028-02: Unpaid catalog order final240000/net0 offers enabled Nhận việc mua hàng. ActionForm filters role and purchase kind, not stage/payment/hold. Domain index.ts claimPurchase requires QUOTE_ACCEPTED, net minus refundReserved >= purchaseAmount and no hold. This is a misleading affordance, not evidence of server bypass. Show prerequisite explanation and disable invalid action locally; domain remains authority. Do not change money rules or broadly duplicate command state machine.
- P2 UX028-03: Desktop Workbench dedicates detail column even before selection, leaving large unexplained blank area; cards consume vertical height for long IDs. Provide explicit select-order state, compact aligned metadata, full ID available in details/copy mechanism with accessible label. Do not fabricate short unique IDs.
- P2 UX028-04: Shipping/Consolidation and Refunds show repeated editable forms for every record; long scroll mixes queue browsing and decisions. Keep compact summaries, expand selected record only. Refund confirm/cancel fields and button label should match action; preserve bank evidence and financial confirmation semantics.
- P2 UX028-05: Settings opens collapsed panel without page h1; fraction entry requires mathematical interpretation. Keep rational storage, add read-only conversion preview from actual currency minor-unit definitions and explicit effective period; do not change FX values or policy approval.
- P2 UX028-06: Customers grid uses raw assignee ID despite roster names in detail. Labels should prefer verified display name with full-ID fallback, never invent identity. Tag comma entry and generic Từ khóa need contextual help; search is prefix/name or exact ID, no promised global fuzzy search.
- P2 UX028-07: Sidebar groups are useful, but box icon repeats across most operational tasks; small secondary text weakens scan hierarchy. Differentiate semantic icons with visible labels. Keep role-based navigation, security access, independent mobile dialog.
- P2 UX028-08: Campaigns places a long create/edit form before list; Membership list can push editing/granting far below. Separate browse versus edit context, retain plan identity/status/version, make unsaved changes explicit.
- P3 UX028-09: Scope/freshness disclaimers are accurate but long or repetitious. Present concise visible scope and optional explanation; preserve UTC filters, device-time output,100/30-record limitations, partial-data and offline meaning.
- P3 UX028-10: Smoothness cannot be certified from screenshots. Introduce restrained route/panel opacity/translate transitions only after navigation/focus fixes; reduced motion immediate, no wait for cosmetic completion, no content-height animation on long financial forms.

## Screen-by-screen assessment

| Screen | Observation | Recommended change |
|---|---|---|
| Overview | Coherent heading/filter; initially asks user to load; scope paragraph precedes work | Retain explicit snapshot semantics; clearer primary work grouping and refresh context |
| Orders | Master/detail with long cards; action prerequisites unclear | UX028-01/02/03 |
| Purchasing | Queue includes waiting-payment catalog fixtures | Clarify waiting payment versus actionable procurement; preserve service filtering unless separately approved |
| Warehouse | Same master/detail; received/packed context in detail | Mobile detail mode and stage-appropriate action |
| Returns | Clear quantities table and separation from refund | Compact summary and contextual fields per action |
| Shipping | Pack, consolidation, dispatch and tracking share long page | Browse/pack/consolidate modes, selected record form |
| Changes | Clear customer-approved badge; repeated primary buttons | Keep decision summary visible before apply; do not silently apply |
| Customers | Logical table and explicit filters; IDs dominate secondary content | Name-aware assignee, compact reference, contextual search label |
| Follow-ups | Explicit overdue/7-day/mine filters | Keep date timezone clear; use customer table improvements |
| Customer detail | Good summary plus care/related two-column layout | Keep privacy and consent boundaries; clearer tag input and related empty next step |
| Support | Compact expandable rows but little prioritization context | Add verified last update/assignee only if supplied; don't invent unread/SLA |
| Documents | Clear draft/issued/cancelled semantics; manual order ID creation | Contextual entry from order; owner-coordinated compact list; full editor states NOT_RUN |
| Refunds | Accurate actual-money disclaimer; repeated decision forms | Selected decision, action-specific bank field and explicit submit label |
| Finance | Three serial groups, independent pagination | Optional tabs with visible current scope, no synthetic totals |
| Content | List/editor split and sections; initially creates blank draft | Explicit browse/create/edit context, unsaved protection and validation focus |
| Campaigns | Long form above list; automatic publication correctly off | Browse/edit split; Vietnamese explanation for UTM terms |
| Membership | Multiple similar plans and edit buttons | Compact plan table plus edit panel, distinct gift flow |
| Staff | Collapsed inspection form; source requires ready record before roles | h1 and human-readable identity; preserve inspect-before-change/security gates |
| Activity | Read-only table, audit/outbox selector | Distinguish object refs/action names with source-backed mappings |
| Settings | Fraction forms; no expanded header hierarchy | h1, derived conversion preview, validity summary |

No numeric usability score: no observed staff study/task-time baseline. Usability findings above are heuristic/live observations, not employee success rates. Duplicate plans and epoch dates are synthetic fixture properties, not asserted production defects.

## Required review loop after approval

Implement scoped batch → freeze owned file hashes → desktop/mobile/200% zoom and keyboard workflows → error/retry/permission/stale-context checks → independent source+rendered review → fix approved findings → rerun affected checks → fresh final review. Each cycle records findings, fixes, source hashes and evidence. No done/release success while mandatory states or review remain blocked.

References checked: https://developer.apple.com/design/human-interface-guidelines/layout and https://developer.apple.com/design/human-interface-guidelines/motion .
