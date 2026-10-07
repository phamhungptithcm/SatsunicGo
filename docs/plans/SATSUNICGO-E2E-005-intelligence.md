# Repository intelligence brief — E2E-005

Date: 2026-10-04. Commit: `3bd0d093255963a2cbf66ddd80d27456da7076e0`; dirty candidate includes existing App.tsx, SiteChrome.tsx, Content.tsx, global.css and agent/config/UX-AUTH-004 documents. Preserve all pre-existing changes.

Gate: DEGRADED after one refresh; index metadata stale and CocoIndex health failed. Both MCP queries returned results, but source verification is authoritative. CodeGraph traced Staff → Customer/Dashboard/Workbench and App → SiteHeader; CocoIndex retrieval found quality policy rather than customer implementation, so it does not establish CRM completeness.

Observed source: App.tsx Staff mounts permitted modules together; Customer.tsx uses manual UID and clears data after save; missing follow-up default sends zero; crm.ts handles notes transaction/version/idempotency, current-role auth, bounded order/ticket reads; workspace.ts listWork does not list customers; dashboard bounded by createdAt UTC cohort. SiteHeader already has mobile menu and cleanup. Reference: HunpeoLabs site-header and blog-admin/chrome StudioShell.

Call path: React module → shared/firebase callable → Functions current auth/role/resource guards → Firestore transaction → CRM/order/ticket snapshots, idempotencyKeys/auditEvents → authoritative UI readback. Mutable domains also produce timeline/outbox. Customer/private/public projection boundaries must be verified per endpoint rather than inferred from UI role hiding.

Data/contracts affected: crmCustomers followUpAt/assigneeId/version, safe users search projection, paginated orders/tickets, operational queues, Firestore indexes, private uploads, domain monetary/quantity guards. Existing accepted snapshots and ledger preserved. Additional detailed impact is recorded in SATSUNICGO-E2E-005.md.

Tooling: React19/TS6/Vite8/Firebase12; Node22 Functions; Vitest, ESLint, Firebase emulators, Playwright. Baseline typecheck PASS; 14 unit files/42 tests PASS; lint PASS. Rules/HTTP/restore/browser/provider checks NOT_RUN in this audit. No completeness percentage inferred.

Related specs: MASTER_PROMPT sections1–20, requirements matrix, local runbook, external setup, production readiness; existing local approvals 001/004. Source gaps and stale historical evidence distinguished in plan.

Risks: lost schedule, stale request, concurrent updates, permissions/projection leakage, unbounded search, monetary duplicate allocation, partial delivery, navbar overflow. Resolve through targeted regressions, role/cross-owner API tests, cursor/index contracts and current browser evidence.

Unknown: actual provider/service configuration, commercial policy/data, browser parity, all twelve master scenarios. No secret or live customer data was read. No live configuration authority inferred. Confidence high on listed source behavior, limited on unexecuted runtime/integrations.
