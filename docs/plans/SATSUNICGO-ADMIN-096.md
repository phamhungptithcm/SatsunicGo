# SATSUNICGO-ADMIN-096 — Admin task-focused redesign

Status: PLAN_READY / AWAITING_HUMAN_APPROVAL. No application edits authorized by this plan yet.
Date: 2026-10-06. Candidate baseline: 269aca833a748ac08b4152aa7de5a23d6cc4900a plus concurrent dirty worktree.

## Intelligence brief
Gate run: CodeGraph installed, health passed, index stale; CocoIndex installed, index stale, health failed. DEGRADED. One incremental refresh attempted. Use bounded source evidence; no claim of complete graph coverage.
Source verified: Workspace.tsx routes membership to PlanEditor (not public Membership), staff to StaffAccess, activity to Activity, fees to ShippingRates staff, settings to Settings. Existing CrmPresentation supplies headings, state panels, icons and references. React 19, TypeScript 6, Vite 8, Firebase 12, Vitest and Playwright from package.json.
Shared frontend listener exists at 127.0.0.1:5207. No restart, seed or extra frontend.

## Problem and design direction
Screens supplied by user show oversized headings, unbounded fields, scattered actions, collapsed task entry points and excessive unused space. Source confirms details-based editors and uneven heading/actions/state presentation. Business tasks must remain discoverable, with one clear primary action per task.
Use existing royal blue and navy, white cards, neutral canvas, 8px spacing rhythm, compact 24–28px headings, 14–16px body, persistent labels, 40–44px controls. Inspired by enterprise data-first composition; preserve SatsunicGo identity. Max width 1200px, form columns capped around 560px; mobile one column. No new UI dependencies.
Static proposal: docs/designs/admin096/prototype.html. It contains intentionally empty data and disabled persistence controls; it is not runtime evidence.

## File-by-file implementation
1. src/features/membership/PlanEditor.tsx: heading “Gói thành viên”; colocate Tạo gói and refresh. Display plan list with name, VND price, duration, discount and status. Hide empty table when no rows. Switch tasks through accessible button groups: Danh sách gói, Cấp tặng, Nhắc gia hạn. Explicit inline editor, labelled groups (Thông tin gói, Quyền lợi, Trạng thái) and footer actions; keep name enum FREE/PLUS/BUSINESS. Preserve bps integers and ranges; explain 100 bps = 1%. Do not silently change payload units. Preserve pagination, selected version, pending operation, uncertain outcome and gift eligibility.
2. src/features/membership/ReminderSettings.tsx: align labels, inline guidance, status and save footer without changing policy/consent behavior.
3. src/features/settings/StaffAccess.tsx: two visible stages: Kiểm tra tài khoản → Cập nhật quyền. Bounded UID input with persistent label/hint, role checkbox grid, separate active/locked controls, order assignment section, target reference beside save. Never infer identity/name/email from UID. Keep OWNER, recent auth/MFA, version checks, target fencing and pending retry intact.
4. src/features/crm/Activity.tsx: consistent selected button group for audit/outbox; compact readable table or mobile cards; timestamp, action and wrap-safe full resource identifier. No fabricated friendly identity. Isolate outbox reconciliation action from schedule-retry action. Preserve read-only audit, pagination and unknown email outcome semantics. No new server filtering.
5. src/features/shipping/ShippingRates.tsx: staff-only admin composition: header, draft/published state, read error/permission state, existing tariff selection and bounded editing area, save versus publish/delete actions clearly separated. Keep public branch layout out of scope. Preserve reference-origin disclosure, validation, ownership, confirmation, request fencing and idempotency.
6. src/features/settings/Settings.tsx: rename heading “Tỷ giá & điều khoản”; show verified policy status and effective/expiry times; explicit bounded editor with terms, three currency rows, validity and approval. Keep numerator/denominator per smallest source-currency unit, expectedVersion and accepted-quote snapshot semantics. No conversion to market exchange-rate shortcuts.
7. New src/features/settings/admin-workbench096.css scoped via admin096 class on these pages; no global selector overrides. Reuse CrmHeading/CrmState/CrmReference. If shared components require edits, coordinate exact owner first and obtain delta approval if outside this scope.
8. Existing focused unit/browser tests: extend only for material changed interactions, keyboard task switching and state visibility. Add docs/reviews/ADMIN-096 evidence and content inventory after approval.

## Shared ownership and coordination
User explicitly requested sync. Sent scope to five active UI chats (01a11453-fe0e, 01a11453-7c4f, 01a11451-c488, 01a1144f-3c32, 01a11450-748d). Await ownership responses; do not claim agreement. Preserve App.tsx, auth, catalog, shipping operations and all unrelated WIP. Shared CrmPresentation, Workspace.css, crm-ux028.css and global.css require coordinated owner; page-specific CSS preferred. Recheck status/diff before every edit.

## Impact, risk and boundaries
Medium UI risk because these interfaces control permissions, pricing, gifting and publication. Backend, schemas, Firebase/IAM, secrets, deployment, dependencies, global shell, auth and commercial rules excluded. Retain callable names, payloads, authority enforcement, integer bounds, operationId reuse, expectedVersion, stale-response fences and uncertainty locks. No fake totals, synthetic revenue, invented notifications, auto-retry or implied delivery guarantee. Existing dirty work prevents certifying an unrelated full-repository candidate.
Rollback: revert only this task's approved hunks; preserve other work. Alternative: CSS-only tightening is smaller but leaves task discovery unresolved. New component library has larger integration cost and is deferred.

## Product language and validation contract
Apply write-product-content and product-content profile. Inventory every changed visible/accessibility string after diff. Purpose: task-specific header. Agency: explicit edit/cancel and task controls. Responsibility: permissions, uncertainty and publication consequences visible. Familiarity: native web controls. Flexibility: responsive/keyboard/reduced motion. Simplicity: bounded forms and one task at a time. Craft: all states verified. Delight: predictable focus and calm feedback. These are acceptance requirements, NOT_RUN until implemented/rendered.
Check loading, first-empty, pagination-empty, denied access, invalid input, saving, success only after durable response, failed request, uncertain result, version conflict, long IDs and offline/partial states. No unavailable data rendered as zero.
Use shared 5207 only. Verify 390px and desktop, 200% zoom, keyboard focus/return, labels, live errors, no horizontal page overflow, no input loss on failure. Test membership gift/reminder, staff target fencing, settings units, activity reconciliation and shipping staff/public separation. Commands: npx tsc --noEmit; targeted ESLint; relevant Vitest files; existing browser admin/staff/finance tests only after confirming fixture isolation (no shared seed/reset). Finish fresh final-implementation-review, quality gate, product-content review and completion report; production remains NOT_TESTED.

## Approval requested
Approve implementation of the file-scoped UI plan above with unchanged backend and business contracts, coordinated shared primitives and preserved concurrent WIP. Initial redesign request is not represented as reviewed-plan approval.
