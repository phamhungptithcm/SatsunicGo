# Subscription hardening — 2026-10-09

Authority: approved r5 implementation plus user's explicit request for real happy/negative scenarios, full business/client/backend/security/performance testing and in-scope bug fixes. No provider activation, deployment, payment behavior, runtime restart, unrelated WIP or cross-chat messaging.

Repository intelligence: CodeGraph located domain/preferences and callers; delivery symbol coverage incomplete. CocoIndex returned unrelated manifest matches. DEGRADED semantic coverage; targeted current source, tests and compiler are authoritative. Stack: TypeScript strict, React 19, Firebase Admin/Firestore transactions, Vitest. Reuse existing shared demo backend only; synthetic random owners and exact cleanup.

Trace: checkout/profile → authenticated callable → atomic preference/operation/quota/audit/job → identity + claim → consent preflight → provider boundary → fenced outcome → hashed public token → scoped confirmation/opt-out. Financial mail stays independent. SMS delivery remains unavailable.

Concrete plan before changes:
1. Extend subscription unit scenarios for post-claim account lock, revocation, corrupt/missing consent, dependency failure, lost claim before and after provider, rejection/replay, quota concurrency, partial topic confirmation, expiry boundaries, SMS preparation and worker contention. Prove failures before fixing.
2. In subscription-delivery-service only, reread job + preferences + user immediately before sending; require owned sending claim and unlocked account; preserve newer job state; handle preflight failures conservatively without provider I/O; return a suppressed result if finish ownership was lost. No schema/index/provider change.
3. Extend existing real-Firestore integration with contention, version conflict and quota/opt-out assertions. Add server-only collection rules checks if shared emulator access supports them; no rules weakening.
4. Inventory existing tests into a scenario matrix with explicit layers, assertions and evidence. Run relevant regression, frontend/Functions strict compiler and scoped lint. Record bounded resource/call counts and observed duration, not a production SLA.
5. Review complete scoped diff for requirements/security/correctness/failure handling/performance/product language/readiness. Record review→fix→verify cycles, source hashes and residual NOT_VERIFIED/NOT_RUN.

Risk: medium (consent race/security and exactly-once external side effects). Revocation can still race after final check and before provider acceptance; no atomic transaction across external provider. Auth is verified at start; changes after identity read require provider/action boundary policy and are not instantaneously atomic. Unknown delivery must never automatically resend. Preserve all financial/business order operations.

No user-visible strings or layout changes planned. Existing product-content review applies to unchanged approved UI; browser-to-live-callable and real email/SMS acceptance are separate, unverified gates. No new dependencies.

Client finding reproduced in actual React/browser harness: calling load during a save increments epoch before the in-flight guard, invalidating completion and leaving busy stuck. In-scope fix in use-notification-preferences.ts: check flight/pending first, then increment epoch. Pending uncertain mutations must be retried with the same operation before load can discard visible state. No text or schema changes. Validate actual hook with lost response, reload during save, double click, version conflict, sign-out during save and invalid SMS.

Worker validation adds subscription-email.ts scheduled handler mocks: release hold before DB/secrets, disabled configuration, bounded queries/cleanup, and isolated per-job database failure. If one job fails, continue other selected jobs and emit a sanitized job-id-only warning; keep unknown/claimed jobs protected by existing reconciliation. No activation change.
