# Knowledge continuation

Approval: current explicit user instruction to harden knowledge/context plus existing full Ask plan continuation authorization. Scope: functions/src/ai/knowledge-retrieval.ts and its unit scenarios only. No provider spending, auth, publication approval, private-state history or financial commands change.

Intelligence: DEGRADED (both indexes stale); verified retrieval source, Ask caller, language-query helper and current tests directly. TypeScript/Node22/Vitest. Preserve raw query, source text, IDs, numbers, budgets and conflicting-publication rejection.

Implementation: conservative single-edit retrieval matching for alphabetic terms length >=5, exact match ranked higher, no numeric correction. Add contiguous overlap only when a chunk hits long-section limits; original positions/text, UTF-16 boundaries and excerpt limits stay valid. Prevent endless progress and avoid overlapping paragraph-only small chunks. Tests cover typo, numeric/short-token isolation, overlap condition/exception, bounds, original spans and existing regressions.

Limits: this does not implement semantic search, authoritative production corpus, conversation-reference resolution or token-budget accounting. Ambiguous questions require clarification, not invented evidence. No deployment. Rollback: revert pure retrieval helpers; no data migration.

Cycle 11 impact: review found per-field fuzzy matching can select competing spellings even when an exact corpus term exists. Resolve search-only typo terms once against the bounded, non-conflicting corpus vocabulary: exact spelling wins; only one distinct eligible near spelling permits fuzzy retrieval; ambiguity yields no fuzzy correction. Preserve question/IDs/content and current budgets. Cache vocabulary per invocation, no new persistence or permissions. Add competing-spelling, exact-corpus dominance and conflicting-publication regressions. Explicit continuation approval remains current.
