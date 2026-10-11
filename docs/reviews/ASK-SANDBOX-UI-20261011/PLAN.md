# Ask sandbox UI admission repair

Base: 444379ffceea6b85139e6a0bbbf02cdc6367ae83. Intelligence DEGRADED: stale CodeGraph/CocoIndex; critical facts verified directly in Ask.tsx, Commerce.tsx, currentAskConversation and existing component tests.

Approval: human explicitly authorized merge all MRs, enable AI/sandbox, automatically fix/review/test to production completion. This is a scoped blocker repair within that approval; no expansion of customer eligibility, budgets or payment authority.

Observed blocker: production build lacks VITE_ASK_COMMERCE_ENABLED, so authenticated conversation admission never runs and approved sandbox UI cannot activate. Backend transaction admission remains authoritative.

Implementation: probe currentAskConversation on authentication without a build flag; enable purchase UI only with current authenticated owner and a successfully hydrated, owner-verified server conversation. Use the same admission state in published-answer fallback rendering. Reject null/malformed admission responses instead of inventing a conversation ID. Missing/malformed/wrong-owner snapshot or listener failure cannot admit purchase UI. Plain Ask remains usable while admission is pending, denied, offline or timed out. Preserve existing generation/UID fences, drafts, layout, labels and backend security. No new dependency/module/public input/CI or global feature flag.

Risk: authenticated read probe once per auth transition; conversation restoration can race with ordinary chat and account switching. Test production-flag independence, successful admission, pending/denied/offline/timeout fallback, null/malformed/foreign snapshots, A-B-A callbacks and snapshot error recovery. Run focused components, full unit/typecheck/lint, CI, immutable artifact and provider verification, independently review, then hosted acceptance. Product Content Gate applies to visibility/state semantics; no new wording or styling. Rollback via prior immutable release; revoke sandbox policy independently if needed. No real payments.
