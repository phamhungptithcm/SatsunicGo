# Biz hardening impact, before edits

Gate: DEGRADED (both indexes stale), native bounded source fallback. Approval: TEAM_CONTEXT.md Hardening023 local confirmed fixes, current human delegated request, validated protected shipping path. Preserve shared dirty WIP.

BIZ-001: functions/src/shipping.ts dispatchParcel calls verifyParcelDispatch for split parcels. packages/domain/shipping.ts permits IN_TRANSIT with a duplicate guard omitting catalogPayable. A catalog snapshot total100/finalTotal101/collected101 passes secondary dispatch; initial dispatch throws INVALID_CATALOG_TOTAL. Impact: inconsistent fixed-price invariant on remaining parcels. Small fix: reuse canDispatch for both eligible stages. Tests: valid split shipment, repriced catalog, hold/reserve/stale freight failures. No policy or UI string changes, schema or dependencies.

BIZ-001 rejected by actual pre-fix unit (4/4 pass): canDispatch eagerly evaluates catalogPayable before stage so ceiling remains enforced. No shipping source edits.

BIZ-002 confirmed source path: checkProposal only blocks replacementName for purchased lines, while functions/src/changes.ts applies replacementVariant independently. A multi-line substitution with replacementVariant on purchased line0 and replacementName on unpurchased line1 passes. Impact: rewrites variant of physically purchased product. Plan: guard either replacement field when processed>0, preserve unrelated/no-replacement lines. Add multi-line regression for purchased rejection, unpurchased acceptance and optional empty-string variant. No commercial rule invention: existing already-purchased substitution restriction extended to actual applied field.
