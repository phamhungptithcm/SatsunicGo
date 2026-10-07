# COMMUNICATION-017 validation and scoped engineering review

Goal: local order-bound staff/customer conversation now; no OA/Page yet per user. Approved plan/record: SATSUNICGO-COMMUNICATION-017 v1. Existing general support tickets remain unchanged. Invoice issuance is outside this task.

Stack: TypeScript 6, React 19, Vite 8, Firebase Admin/Functions Node22, Firestore, Zod4, Vitest4. Execution host Node25; production Node22 runtime acceptance has not been rerun for this task. Profiles selected: universal, typescript-javascript, frontend-html-css, web-app, api, database, concurrency, product-content, visual-design. Relevant source, profile reject rules, CodeGraph callers and package manifests reviewed. CocoIndex remained stale/unhealthy after one startup and one post-change refresh; bounded source/compiler/emulator evidence used, confidence scoped rather than exhaustive.

## Evidence and gates

| Gate | Result | Evidence |
| --- | --- | --- |
| TypeScript/client/functions compilation | PASSED | npm run typecheck, actual exit 0 |
| Static analysis | PASSED | npm run lint and focused ESLint exit 0 |
| Unit regression | PASSED | npm test: 27 files / 112 tests at recorded run; latest focused communication/email/target rerun: 3 files / 14 tests passed |
| Emulator integration | PASSED | npx vitest run --config vitest.rules.config.ts tests/rules/order-conversation.test.ts: 4 tests passed (including direct Firestore access denial) |
| Production frontend build | PASSED | npm run build exit 0; existing chunk-size and ineffective-dynamic-import warnings remain |
| Actual local browser | PASSED | Customer→staff→customer exchange, claim/handover, notes excluded from customer, 1280/390 widths, keyboard and explicit label selector |
| Product content | PASSED | COMMUNICATION-017-CONTENT_REVIEW.md and full changed-string inventory |
| API/security/data integrity | PASSED within checks | Auth/App Check retained; owner/eligible staff + lock checks, replay authorization, strict schema, operation hash, transaction revisions; no order/financial writes |
| Database migration | NOT_APPLICABLE | New server-only conversation docs; existing deny-all Firestore rules retained; no backfill/rename |
| Observability/rollback | PASSED design review | Metadata-only audit; existing outbox; rollback hides entry points and stops exports while retaining messages/audit |
| Real OAuth/App Check and SMTP delivery | NOT_RUN | Emulator identities only, no live provider configuration read/send |
| Zalo/Messenger | NOT_APPLICABLE to local release | User has no OA/Page; explicitly unavailable, no fake connector |
| Public deployment | NOT_RUN | Not requested; no push/deploy |

Initial test attempts were not passed: normal test:rules runner encountered an existing emulator hub port; sandboxed localhost calls returned connection failures, direct handler test timed out; escalated demo-only localhost access resolved this. An import through functions/index failed while another chat added catalog-checkout; focused test now initializes the demo admin app itself. Shared frontend build briefly failed while parallel Checkout import existed before its file; later build passed once the parallel source was present. One automatic command-review attempt failed from reviewer-model capacity, then the same local checks succeeded. None of these failures were hidden or treated as passing evidence.

## Review findings and fixes

Implementation self-checks: closing a disclosure during a pending send initially risked dropping completion state; mutation lifetime now uses mounted state, separate from read generation. Polling initially cleared an uncertain-send explanation; read and mutation error states are separated. Staff roster profile reads initially used one read per profile; now tx.getAll batches the bounded roster. Polite message-log announcement added. Explicit label association fixes exact assignment-label automation ambiguity; browser then selected manager and persisted handover successfully.

Final review cycles: first two ledger snapshots BLOCKED while final content/handover verification remained incomplete (same low label-association finding); final fresh review resolves it using current browser evidence and complete content report. Actual final receipt/report lives under .ai-agent-kit/runtime; the source manifest binds task modules and current shared integration files, which also contain unrelated parallel WIP. No whole-repository release certification.

## Compatibility and residual risks

Two additive callables and a server-only collection; existing payment, order lifecycle and support-ticket APIs unchanged. Existing notification label/destination extended, and conversation replies use existing asynchronous notification/email scheduling. Notification enqueue does not prove provider delivery. Customer reply only queues a staff alert when a current eligible assignee exists; unassigned requests require existing staff queue handling. Messages/notes show latest 50 with explicit partial-history text; older messages retained but history pagination is deferred. Staff choices are bounded, with partial-roster disclosure. Polling every 15 seconds trades setup simplicity for reads and delayed updates; large-scale performance and retention policy still require operational review. No chat attachments introduced; existing order-image workflow remains available.

No sensitive configuration accessed or printed, no real messages/payments, no new dependencies, no generated-file hand edits, no protected policy changes. Legacy approval validator hard-requires READY despite repository DEGRADED fallback policy; tracked human approval and fallback evidence are recorded truthfully, not relabeled READY. Runtime ledger is retrospective evidence bookkeeping, not a claim that earlier action-gateway receipts or state transitions were executed.

Git: base 3bd0d093255963a2cbf66ddd80d27456da7076e0, dirty shared worktree; unrelated WIP preserved. Current review covers task edits and relevant integration paths only. Production readiness NOT_READY: no deployment/live auth/provider/operational acceptance. Token usage and actual cost Unavailable. Memory candidates: None.
