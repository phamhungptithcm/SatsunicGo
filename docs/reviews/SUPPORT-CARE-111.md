# Support and appointment empty states — SUPPORT-CARE-111

Approved 2026-10-07: repository owner replied “apporved” to the plan in this chat. Local implementation only; deployment, commit and push are not part of this approval.

## Observed implementation and scope

The support result heading/count rendered for an empty page. Customer/follow-up screens share Customers.tsx; a concurrent customer-empty task changed the customer branch during this work. Its changes (customer icon/state, customer footer visibility, filter-reset visibility and CSS) were preserved. This task touches follow-up presentation, support presentation and status filtering, not customer search behavior.

Thread.tsx now shows a labelled native status select (Tất cả / Đang mở / Đã giải quyết), sends optional supportStatus only for the list, resets pagination on filter changes, and hides filters for an explicitly selected ticket. Existing request sequence, reply locks, errors, retry and reply handlers remain. Empty support has a message icon, centered heading/description, no redundant list heading or zero count. Follow-up empty has a clock icon and centered heading/description; existing time/mine filters remain. Empty follow-up headings/count/footer are hidden, while any next cursor remains reachable.

New support-care-empty.css is scoped to the two custom empty blocks. Shared CrmState and customer styling are unchanged by this task. Borders/white rounded surface come from the existing enclosing surface. Icon size, typography and spacing match the supplied shipping reference, with message/clock icons appropriate to each screen.

listWork accepts optional open/resolved supportStatus for supportTickets only; applies equality before query execution and the existing 30-document limit. Existing roles/transaction checks remain. A cursor with changed/mismatched status is rejected with existing reload guidance. No new persistence, schema, dependencies, index declarations or authorization change. Production index/query availability has not been tested; emulator success is not a production index guarantee.

Repository intelligence: DEGRADED (stale CodeGraph/CocoIndex, unhealthy CocoIndex). Incremental refresh failed on daemon log permission; source reads, compiler, tests and Git provide bounded evidence. No whole-repository confidence claim.

## Product content review

Target: Vietnamese CRM web users finding support tickets or due care appointments. Web-native select, checkbox, button and heading semantics. Apple component guidance is not applicable; bundled Human Interface principles are a human-centered web quality reference. Reviewer: Codex, 2026-10-07.

| String/state | Meaning | Evidence |
| --- | --- | --- |
| Trạng thái; Tất cả; Đang mở; Đã giải quyết | Support filter matching stored open/resolved; all omits filter | Source and callable tests |
| Chưa có hội thoại trong trang này | Successfully loaded empty current page, not global absence | Browser fixture |
| Bạn có thể tải lại để kiểm tra hội thoại mới. | Existing reload action | Browser fixture |
| Chưa có hội thoại phù hợp | Empty selected-status results | Browser status change |
| Thử chọn trạng thái khác hoặc tải lại hội thoại. | Available select and reload, no recovery guarantee | Browser tests |
| Selected-ticket empty title/help | Existing copy retained; filter not applied | Source inspection |
| Chưa có lịch hẹn phù hợp | Existing wording, matched current time/mine criteria | Browser fixture |
| Existing time/mine guidance | User can change time or clear mine | Browser native filter and source |
| Tối đa 30 lịch hẹn mỗi trang | Accurate follow-up pagination unit; replaces customer wording | Populated follow-up browser check |
| Danh sách hội thoại and empty counts/headers | Removed redundant content | Browser absence assertions |

Loading, populated results, filtered empty, unfiltered empty, retry/error, pagination: reviewed/tested. Reply-pending disabling and targeted-ticket behavior: source-reviewed; no reply writes executed. Auth/permissions: callable rejection tested. Destructive, confirmation, monetary data, freshness metrics, save/payment/shipment completion: not applicable. Error is distinct from true empty and never shows empty copy; no success/check icon conveys absence. Native labels are persistent; icons are aria-hidden decorative; text carries meaning. No text truncation, localization fragments or new promise.

| Principle | Result | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Empty result explains absence and next step |
| Agency | PASSED | Native filters, existing retry/clear/mine options |
| Responsibility | PASSED | Current-page/filtered semantics; errors stay errors |
| Familiarity | PASSED | Message/clock icons and ordinary web controls |
| Flexibility | PASSED | 1440/375 viewport and 200% zoom, no horizontal overflow |
| Simplicity | PASSED | Redundant heading/count removed; single status filter |
| Craft | PASSED | Centered icon/title/body, wrapping, existing white bordered surface |
| Delight | PASSED | Calm empty state matching shipping hierarchy without extra motion |

Gate dimensions: platform, meaning, audience, tone, brevity, state coverage, terminology, localization/wrapping, data/privacy, eight principles and in-context rendering PASSED within local proxy scope. Accessibility PASSED for native labels, decorative icons, zoom/wrapping and existing control semantics; real screen-reader speech NOT_RUN. No animation added. Product Language Gate PASSED.

Rendered current screenshots: .ai/local/reviews/support111-support-1440.png, support111-support-375.png, support111-care-1440.png, support111-care-375.png. Browser fixture uses actual screen components and CRM shell/CSS on shared 5207, intercepts callService, and avoids account/customer mutations. This is a disclosed local proxy, not authenticated end-to-end/provider evidence.

## Quality gates and review

- Frontend TypeScript: PASSED — tsc --noEmit.
- Functions compilation: PASSED — npm run build --workspace functions.
- Backend integration: PASSED — 3 support-filter111 tests on existing demo Firestore 18207. Covers 30 matching results despite interleaved statuses, next page, invalid enum/collection/cursor, unauthorized buyer and unfiltered target compatibility. Random-prefix owned fixtures only, cleaned after tests.
- Browser: PASSED — 4 support-care111 tests, desktop/mobile. Empty icon/layout, redundant-heading absence, status selection, filtered results/pagination/reset, follow-up time filter and populated row/footer, error separated from empty, 200% zoom/no overflow.
- Static analysis: scoped ESLint and diff whitespace checks PASSED.
- Language/framework profiles: TypeScript React/Node/Firebase, web UI, product content, visual design, API/filter consistency and transactional authorization reviewed. Persistence migrations/SEO/motion not applicable to this CRM-only change.
- Security/compatibility: optional validated field only; existing role guards, unknown-state labels and mutation locks preserved. No secrets/private data output.
- Observability/error handling: existing errors/reload remain; stale cursor fails closed. No new logs required for this bounded filter.
- Full suite/production/provider/live integrated frontend-backend: NOT_RUN; no runtime restart or deploy.

Review cycle 1: source/diff review caught concurrent customer-branch markup overlap and fixed nested JSX while preserving that task. Test locator incorrectly matched the select by exact label (options contribute to label text); corrected to native combobox accessible role. Initial browser fixture omitted workspaceMain/aside and rendered desktop in the sidebar column; fixed proxy shell and reran current screenshots/tests. Initial sandbox emulator timeout resolved with approved escalation; not counted as pass.

Review cycle 2: final compiler review found new test fixture Window fields and callable union assertions had inaccurate types. Fixed with a named fixture Window interface and inferred/narrowed row assertions; production logic unchanged. Re-ran compiler/lint and both focused test groups.

Review cycle 3: fresh source/diff, compilation, lint, 3 backend tests and 4 corrected browser tests passed. No unresolved actionable finding within approved scope. Production-readiness review PASSED as a boundary assessment; release readiness remains NOT_READY until separately authorized deployment and live verification. Shared repository WIP preserved; rollback scoped code changes and redeploy through normal release process if later released.

Acceptance: support empty alignment/removal/filter and care empty alignment/filter preservation all locally verified. Token usage and actual/API-equivalent cost Unavailable. Memory candidates: None. Exact runtime review count/signature lives in the ignored runtime ledger; shared WIP may require freshness rebinding.
