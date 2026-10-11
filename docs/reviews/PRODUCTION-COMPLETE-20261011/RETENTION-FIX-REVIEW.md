# Retention release repair evidence

2026-10-11, source correction review APPROVED by independent production_candidate_review agent, exact two-file diff SHA256 b29c288da67c59573c3ffbfbc7455789f7bbcd363a1700c5dc459e07520ca63e. No actionable source/security findings. Six independently executed targeted regressions PASS; full release/deep-review/public-config contract set 185 PASS. Lint PASS; diff-check PASS. No user-facing text or displayed-data semantics change.

Cycle1: release v0.12.0, native run38114852368, source1dbc701ffdf954eeb7708b60096d952202f03432, artifact bundle600c4b6e2844999a8db512c9129c825d9376e4825482892f78c2808f8f72a215 failed before Firebase deploy at Firestore GET HTTP400 INVALID_ARGUMENT (Only0 supported for pageSize). Original artifact preserved.

Cycle2: default page size correction tested, then real readonly provider readback found all48database-wide indexes returned for every collection-specific GET. Added exact collection-parent filtering with same-project/default-database validation and unique1000-row total budget before filtering. Fixed three outbound collection groups/create-only specs and existing page/body/time/IAM budgets unchanged. Foreign/duplicate/malformed resources fail closed. No new IAM or production data changes.

Provider readback after failure: Hosting remainsv0.11.1/e9d248f331cba92970a6d06c503a3f66eb7d0972;99Functions; target retention indexes absent. Corrected helper live read-only call reaches RETENTION_INDEX_NOT_READY as expected, rather than HTTP/response validation error; no writes attempted.

New source requires a new immutable native artifact. Prior draftv0.12.0 is failure evidence, never rewritten/relabelled. Review approves this bounded repair only; provider deploy/readback, hosted MFA/AI/payment and customer acceptance remain pending. Intelligence DEGRADED under repository-approved bounded source/Git/compiler/tests fallback.
