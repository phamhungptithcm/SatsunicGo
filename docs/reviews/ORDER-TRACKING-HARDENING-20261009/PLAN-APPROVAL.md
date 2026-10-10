# Tracking hardening — 2026-10-09

Authorization: the user explicitly requested real happy/negative scenarios, testing and bug fixes across tracking business, logic, backend, security and performance, following approved tracking implementation. This is the concrete bounded execution plan for that authorization.

Intelligence: DEGRADED; CodeGraph/CocoIndex evidence was checked, but indexes are stale and contain snapshot duplicates. Critical claims verified against current source. Preserve concurrent WIP and reuse shared 5207/18207; use unique synthetic emulator project, no restart or baseline reset.

Observed flow: shippingCommand transaction → owner shipment projection → owner-only customerOrderTracking → validated Account request → shared Account/Ask renderer. Tests cover domain aggregation and redacted callable boundaries. Three gaps: downstream dispatch alone cannot distinguish initial/final transfer; future parcel times survive DTO validation; shipping writes omit public activity time.

Risk: medium. TypeScript/React/Firebase/Zod. Approved edits: domain/order-tracking milestone payment evidence, customer-order-tracking projection timestamp guard, account-tracking-request timestamp validation, shipping.ts projection updatedAt only; related tests and evidence documents. No financial decisions, auth relaxation, new API, dependency, deployment, schema migration or new server. Legacy missing times remain unknown; future invalid projections become disclosed partial data. Timestamp addition is optional/backward compatible. Rollback is scoped source revert, no data migration.

Sequence: add failing regressions; verify failure; apply minimal fixes; add synthetic real transaction scenarios (ETA recording/replay/conflict/roles, failed retry/return, multi-parcel delivery and owner redaction); run related unit/backend suites, types/lint/build; measure bounded domain workload; inspect current rendered surface; complete content and final review cycles, record runtime report.

Acceptance: (1) reproduced bugs fixed with regressions; (2) realistic happy/negative business and security scenarios pass; (3) performance and UI evidence recorded with honest limitations and fresh review. Provider App Check, production load and deployment are outside local evidence.
