# Customer empty state alignment

Status: PLAN_READY; awaiting explicit reviewed-plan approval. No application edits made.

## Request and evidence

Use the supplied shipping empty-state screenshot as the visual reference for an empty customer list; remove the redundant customer-list heading in that state.

Repository intelligence is DEGRADED: CodeGraph is stale; CocoIndex is stale and unhealthy. Conclusions below are verified through bounded source reads, not current indexes. Shared context repository-map/build-test-commands files are placeholders; source remains authoritative.

- `Customers.tsx` renders the results heading and pagination even when `page.rows` is empty.
- `customer-workspace095.css` hides the empty-state icon; existing shared state layout does not reproduce the shipping vertical layout.
- `Shipping.tsx` and `shipping-workbench.css` provide the reference: centered icon, heading and description, 44px vertical padding, 32px muted icon, white rounded border.
- Customers and follow-ups share the component; follow-ups must retain existing behavior.

## Smallest implementation

1. `src/features/crm/Customers.tsx`, customer results branch: for successfully loaded empty customer results only, render a dedicated customer empty block with the existing customer icon, heading and existing context-specific description. Omit the result heading/count and pagination footer in that state. Preserve pagination if a next cursor exists so navigation is not lost. Keep loading, error, filters, populated customer table and follow-ups behavior unchanged.
2. `src/features/crm/customer-workspace095.css`: add locally scoped styles matching the shipping empty-state visual hierarchy, spacing, muted icon and description. Keep narrow screens and text wrapping safe. Do not change shared `CrmState` or global styles.
3. Record current product-content review and final implementation review after approval and validation.

No API, query, permissions, persistence, backend, dependency, release configuration or production data changes. Existing copy distinguishes filtered results from the current empty page; do not claim the system contains no customers globally. No success/check icon for an empty result.

## Validation and completion

Check the scoped diff, TypeScript/lint as supported by package scripts, and rendered customer empty state at desktop/mobile widths on the existing shared frontend at port 5207. Verify search-empty, normal empty, populated rows, pagination, loading/error and follow-ups boundaries using current browser coverage where practical. Do not start another frontend or restart shared emulators. Complete the required eight-principle product-content review and fresh final implementation review before successful handoff. Deployment is outside this UI implementation plan.

Risk: low, local presentation only. Rollback: revert these two scoped application-file changes. Concurrent unrelated work must be preserved.
