# Final scoped code/security/quality review

Decision: APPROVED for local approved continuation; production NOT_READY. Self-review, not independent attestation. Reviewed source against approved PLAN/APPROVAL after fixes. CodeGraph impact re-queried; stale graph's fixture auth mapping is not trusted. Actual source imports firebase/auth, subscription UID/generation fences and callable dependency verified directly. Intelligence remains DEGRADED; no clean full-repository gate claimed.

Stack: TypeScript6.0.3, React19.3, Firebase12.19, Vite8.3.2, Vitest4.1.11, Node25.9.0; web/customer ecommerce. Profiles universal, typescript-javascript, web-app, concurrency, memory, product-content. Security review composed. Backend/API/database unchanged in this continuation; backend regression executes existing private/public boundaries.

## Verified findings and fixes

| ID | Severity | Defect/impact | Correction | Evidence |
|---|---|---|---|---|
| ADVERSE-1 | MEDIUM | null/undefined SDK rejection dereference bypasses specific safe recovery | Read error code only from non-null object | RED-COMPONENT.log → GREEN-COMPONENT.log |
| ADVERSE-2 | MEDIUM | async guest response steals keyboard focus | Respect focus moved to another control | RED-COMPONENT.log, FOCUS-A11Y.json |
| ADVERSE-3 | MEDIUM | scrollable log cannot receive keyboard focus; axe serious violation | tabindex0 on log; named language group | RED-A11Y.log, TIMEOUT-A11Y.json, keyboard Tab/scroll |
| ADVERSE-4 | MEDIUM | retry on cancelled guest submits redacted question rather than code | Honest re-entry guidance; no private purchase CTA or fake retry | RED-RECOVERY.log, VI/EN component cases and browser |
| ADVERSE-5 | MEDIUM | Stop disables focused button and strands focus | Restore composer focus on guest interruption, except close | RED-STOP-FOCUS.log, STOP-FOCUS.json |

## Architecture, compatibility, security and integrity

Only production module edited is Ask.tsx (already dirty with unrelated concurrent work preserved). No public contract/schema/backend/rules/config/package changes. Non-sensitive guestLookup flag carries recovery intent; capability is never added to Turn. Existing private owner query path, transaction/quotas/AppCheck controls and additive DTO allowlist preserved. Generic catch never prints diagnostic/message. Rejected DTO containing private field never renders. No new HTML injection, URL capability, logs, browser storage or AI/analytics/history dispatch. Component sink assertions and34 emulator security/rules cases pass. No production credentials/data accessed.

## Lifecycle, concurrency, failure handling and performance

Request identity includes active sequence, auth generation, UID and conversation identity. Auth A→B→A therefore cannot revive A1. Existing AbortSignal deadline settles hung SDK; late response after timeout/cancel/unmount/auth change ignored. Requests A1→B→A2 tested old-first and old-last with different status payloads; browser native Enter tested3calls/2stopped/1card. Same-UID initial event preserves current request. Pending auth changes erase turns/input and selected capability. Stop focuses current input; close/unmount still abort and unsubscribe. Added flag is bounded by existing12turn cap. No extra network calls/timers/listeners/runtime dependencies in production. Native deadline tested at15000ms. No new performance benchmark warranted for constant-time guards/attributes; provider throughput/SLO NOT_RUN.

## UI, content, accessibility and browser behavior

Native dialog/log/forms/VI-EN controls kept. Keyboard Enter/Tab/Escape, scroll focus, Stop focus, preserved EN focus and320px VI/EN checked through CUA on shared5207. Dialog292px/log266px, no horizontal overflow. axe zero violations in exercised states; clipped mobile English history gives color-contrast incomplete, manually checked computed color pairs min4.71:1 (CONTRAST.json). Reduced-motion branch is exercised in DOM component environment; actual OS preference, hardware screen reader and200% browser zoom NOT_RUN. Product content gate PASSED with current in-context evidence; no claim of full WCAG certification.

## Quality, observability, deployment and limitations

25 component +65 unit regression +34 backend security=124 passing tests. Strict root types, scoped ESLint, git diff --check and application Vite build pass. Existing chunk-size/mixed static-dynamic import warnings remain. Fixture Vite build includes test-only axe; application dist search confirms fixture SDK/canaries absent. Test tooling installed temporarily with scripts disabled, no app dependency changes. Test fixture uses controlled auth/SDK, not actual sign-in/network disconnection; no browser network interception capability used. No new sensitive logging. Existing production AppCheck/secret/proxy/TTL/load/monitoring gates remain unverified; no deploy authorized or performed. Revert only scoped Ask/test/document delta, preserve shared WIP; no persisted-data rollback required. Shared server/emulators not restarted/reset; test fixtures cleaned in unique demo project by existing suite.

No known unresolved bug within executed scope. Remaining risks are verification limits, not claims of complete-system correctness. No independent reviewer. Memory candidates: None. Provider token usage and actual cost: Unavailable.
