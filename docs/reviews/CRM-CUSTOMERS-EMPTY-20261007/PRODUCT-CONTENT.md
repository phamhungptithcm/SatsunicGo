# Product Content Review

Scope: Vietnamese web CRM customer empty state. Approval: user `apporved` after docs/plans/CRM-CUSTOMERS-EMPTY-20261007.md. Target: existing web design system, no Apple-specific interaction. Source verification and actual component/browser evidence; synthetic list service only, no production writes.

## Inventory and meaning

Customer empty state retains “Chưa có khách hàng phù hợp”; search description retains “Kiểm tra tên hoặc mã khách hàng rồi tìm lại.”; default description retains “Danh sách hiện tại chưa có khách hàng. Bạn có thể thử tải lại.” Heading “Danh sách khách hàng”, zero count and page-size footer are suppressed only for empty customers without a next cursor. Existing person icon is decorative. Zero means current result page, not all customers in the system. Existing query, privacy, permissions and retry remain authoritative.

## State coverage

Default empty, filtered empty, populated table, next-cursor navigation, service error and retry: PASSED via real component mounted in a MemoryRouter on shared5207 with mocked service data. Mobile 320/390 and desktop1440 screenshots and computed alignment/overflow checks passed. Loading unchanged and source reviewed; request fencing unchanged. Unauthorized/offline behavior unchanged, no new message claims. Success/destructive/financial behavior: NOT_APPLICABLE. Existing CRM whole-route browser suite: BLOCKED at demo login; no authenticated acceptance claimed.

## Mandatory principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Explicit empty result title and relevant context-specific description. |
| Agency | PASSED | Search and reload retained; next cursor retained when supplied. |
| Responsibility | PASSED | Empty differs from error; no global customer-count claim or success icon. |
| Familiarity | PASSED | Existing person icon, typography and shipping-derived spacing. |
| Flexibility | PASSED | Actual component wraps at320/390; no empty-block overflow. |
| Simplicity | PASSED | Redundant heading, zero count and irrelevant footer removed. |
| Craft | PASSED | Centered icon/title/description verified in current desktop/mobile screenshots. |
| Delight | PASSED | Calm consistent visual hierarchy with no distracting motion. |

Accessibility/localization: icon is aria-hidden through CrmIcon; heading remains visible text, filters retain accessible labels, no focus-changing controls added. Complete Vietnamese strings retained. Font/text wrap verified using application global stylesheet. Semantic heading substitutes existing strong label; no icon-only meaning. Data units/time/currency: NOT_APPLICABLE.

Evidence: /private/tmp/crm-empty-ui.cjs, /private/tmp/crm-empty-1440.png, /private/tmp/crm-empty-390.png, /private/tmp/crm-empty-320.png. This is rendered component proxy evidence, not authenticated end-to-end/provider/production evidence.

Decision: PASSED for scoped customer presentation.
