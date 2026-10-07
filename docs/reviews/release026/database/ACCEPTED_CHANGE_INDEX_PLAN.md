# Accepted-change queue index delta plan

Status: PLAN ONLY, waiting for root before-verification completion. Database owns firestore.indexes.json only. Backend owns workspace query; root owns ChangeQueue UI/runners. No source/rules/migration/datafix/deployment ownership here.

Observed source: listWork currently bounds orderChanges by document ID before UI state filtering (workspace.ts:18-107). changes.ts:130-131 writes accepted/rejected state and reviewedAt = now together in the accept/reject transaction. Existing index file has only ownerId/orderId composite for orderChanges; no state/reviewedAt/name composite.

Proposed exact addition, preserving all existing indexes/fieldOverrides:

```json
{"collectionGroup":"orderChanges","queryScope":"COLLECTION","fields":[{"fieldPath":"state","order":"ASCENDING"},{"fieldPath":"reviewedAt","order":"DESCENDING"},{"fieldPath":"__name__","order":"ASCENDING"}]}
```

This matches the proposed server query state == accepted, reviewedAt descending, document ID ascending, limit 31 with 30 displayed and a sentinel/cursor. State filtering before bounding prevents nonaccepted rows consuming the first page; document ID tie-break makes equal reviewedAt ordering deterministic. Pagination implementation/authorization remains backend/root responsibility.

Data/history risk: canonical accept writes reviewedAt, but imported/legacy/manual accepted records with missing reviewedAt are not proven absent. The ordered query may omit these; mixed/null/malformed reviewedAt can break chronological meaning or cursor validation. Do not silently fabricate dates or perform data repair. Root must keep historical completeness UNKNOWN until a separately authorized read audit establishes coverage, or define an approved fallback. No production reads performed here.

Operational risk: local index declaration is not deployed index availability. Deployment/build completion must precede use on a target environment; emulator success does not certify production index support. Additional composite adds index storage/write maintenance, not application document writes. No index deployment authorized by this delta. Rollback is removal of this single addition paired with query rollback; do not autonomously delete deployed indexes.

Validation after root before-complete: parse JSON, verify exactly one matching composite/no duplicate, compare existing entries unchanged, verify backend exact query/cursor directions from source. Root alone runs accepted>30/timestamp ties/cursor, permissions and runtime regressions. Provider/whole-system/production readiness not covered. Intelligence DEGRADED, direct source fallback. Memory candidates None.
