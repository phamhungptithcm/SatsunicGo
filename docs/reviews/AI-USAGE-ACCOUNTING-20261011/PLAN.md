# AI-USAGE-ACCOUNTING-20261011 v1

Base: 9f52b2fdd26b82266fd5953f2f1e247e1bc8fbea (published v0.15.0).
Approval evidence: human instruction in this task, "if any issue auto fix review fix until production complete", plus explicit enable AI/sandbox and production release authorization. This is an in-scope canary defect repair, not an increase in paid limits or authentication scope.
Repository intelligence: DEGRADED (stale CodeGraph; unhealthy/stale CocoIndex); bounded verified source, exact artifact and independent reviewer diagnosis used. No index repair or shared runtime restart.

Observed: hosted canary reached generateCustomerAi and failed on positive usageMetadata.thoughtsTokenCount. Actual thought count is unavailable. Source/artifact request thinkingBudget=0. Current customer validator additionally omits thoughts from total accounting. Keep owner-canary, retain the 1000 VND reservation, and do not promote or replay that turn.

Plan, before protected edits:
1. functions/src/ai/ask-production.ts: retain maxOutputTokens=800 and thinkingBudget=0; accept only nonnegative integral thought counters within the SAME combined candidate+thought 800 envelope; reject nonzero tool-use; require total=prompt+candidate+thought, prompt<=10000, total<=10800. Capture only validated numeric usage counters in existing attempt ledger; never thought text, prompts or tokens/credentials. Keep strict content/STOP, all authorization, budgets, replay and policy/version fences.
2. functions/src/ai/ask-pilot.ts: apply matching numeric accounting and zero-tool constraint; preserve existing owner authority and lifetime ceiling.
3. tests/unit/ask-production-admission.test.ts and ask-pilot106.test.ts: exercise nonzero thoughts within cap, exact boundary, over-cap, inconsistent totals, nonzero tools, negative/fractional/missing counts, and original no-thought responses; reservations remain on rejection and replay remains denied.
4. Focused tests, typecheck, targeted lint; independent full-diff review. No new dependency, module, public API, UI string or database schema. Profiles: universal, TypeScript/JavaScript, API, database/concurrency/security.
5. Approved PR -> CI -> native immutable artifact release; verify deployed exact source. Only then one new hosted canary, read numeric usage ledger and validate actual outcome. Failure cannot promote. Provider billing is not claimed from parser checks; invoice remains unavailable. Rollback by original native artifact / policy kill switch, never refund/reset uncertain reservations.

Risk: provider behavior differs from requested no-thinking configuration. This repairs accounting only inside the existing 800-token total envelope; it does not prove a provider hard billing limit. Remain NOT_READY until live canary and review pass. AI fixed pricing expires 2026-10-12T00:00:00Z; no extension in this change.

Pricing/sandbox separately: approved FX markup is 4% on USD/JPY/KRW. Official VCB sell rates observed 2026-10-12 00:20:04 UTC+7: 26070, 168.47, 20.12 VND/major unit. Candidate marked rates: 27112.8,175.2088,20.9248. No double service markup. Published terms currently say returns/refunds unapproved; do not represent research as an approved commercial contract. No live money transaction.
