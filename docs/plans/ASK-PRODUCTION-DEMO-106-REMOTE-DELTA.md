# Remote publication delta plan

Status: APPROVED by repository owner, 2026-10-07 current chat reply Approved. Scoped predeploy review: docs/reviews/REMOTE106-REVIEW.md.

Observed root cause: src/features/content/ProductSpreadsheet.tsx save() uses window.confirm before executeImportRows. The Chrome native confirmation cannot be accepted while the Mac is locked. Existing owner authorization is present; this is a computer-control limitation, not missing publish permission.

Proposed scope: replace only this spreadsheet publication confirmation with an explicit in-page second confirmation. Show pending publication/scheduling/archive counts and the existing consequence wording. Provide Cancel and Confirm actions; keyboard/focus management and Escape cancel; bind confirmation to the validated preview and invalidate it on file/sheet/mapping/preview changes. Execute the existing import function exactly once only after confirmation; preserve operation IDs, expected versions, permissions, App Check, partial-failure recovery and readback. No automatic approval or removal of confirmation.

Files: src/features/content/ProductSpreadsheet.tsx; existing content CSS only if necessary for the inline panel; focused spreadsheet/browser regression test; product-content and final-review evidence. Do not edit unrelated auth/MFA WIP, backend rules or generated files directly.

Validation: confirm Cancel sends no rows, confirm sends once, duplicate clicks are blocked, changed preview revokes confirmation, partially saved rows retain recovery behavior, keyboard focus/Escape work. Use shared frontend port 5207 only. Run relevant unit tests, typecheck and existing-system/product-language/final-review gates. Record current source/artifact hashes, isolate approved frontend candidate from concurrent auth WIP, build through normal generator and deploy Hosting only after release review passes.

Operational limitation: existing tab is still blocked by the old native dialog. The new build must be opened in a fresh tab, authenticated owner session reused, workbook reloaded and revalidated against current versions. Never assume pending rows were committed. No credential extraction or direct privileged database bypass.

Rollback: restore prior Hosting version; content changes remain versioned and require normal CRM recovery. Paid AI, real payments and product selling prices remain outside this confirmation delta.

Approval required: .ai/workflows/plan-existing-system-change.md step 15 and implementation-approval-gate.yaml material-plan-deviation rule. Previous catalog approval authorizes publication; this delta adds application behavior change plus Hosting release so requires explicit delta approval.
