# Implementation approval — NAV-PERF-087

Plan ID/version: SATSUNICGO-NAV-PERF-087, docs/plans/SATSUNICGO-NAV-PERF-087.md
Repository intelligence gate status: DEGRADED — both installed indexes passed health queries but remained stale after one refresh attempt; current source inspection is authoritative.
Approval status: APPROVED
Approver: Human user in this chat
Approval timestamp or task reference: User message “apporved”, following presentation of NAV-PERF-087; client date 2026-10-06.

Approved paths:
- `src/app/App.tsx`
- `src/app/route-modules.ts`
- `src/app/SiteChrome.tsx`
- `src/features/account/AccountRail.tsx`
- `src/styles/account.css`
- `src/styles/global.css`
- `src/shared/Loading.tsx`
- `src/shared/loading.css`
- `src/shared/Toast.tsx`
- `src/features/ask/Ask.tsx`
- `src/features/ask/Ask.module.css`
- `tests/unit/navigation-performance087.test.ts`
- `tests/browser/navigation-performance087.spec.ts`
- `docs/reviews/NAV-PERF-087-*`

Scope: Local implementation and validation of stable public/account navigation and loading as described in the plan. Optional intent preloading and Ask persistence only when justified and safely verifiable. Preserve unrelated WIP, authentication, identity isolation, order/commerce authority and operation progress. No dependencies, backend, infrastructure, deployment or new frontend servers authorized.

Compatibility note: The approval validator currently hardcodes READY while the repository intelligence policy explicitly allows DEGRADED source-based work. Do not falsify READY or edit the validator to bypass that mismatch. Human approval above is the implementation authority under the preferred-with-degraded-fallback policy.
