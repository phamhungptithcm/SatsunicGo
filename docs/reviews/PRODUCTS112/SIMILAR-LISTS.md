# Similar list audit — 2026-10-07

Source-verified, read-only discovery. No other application screen changed in PRODUCTS112.

| Surface | Current behavior | Follow-up |
| --- | --- | --- |
| Public ProductsCatalog | Existing concurrent WIP now includes an IntersectionObserver sentinel, public-content hook has synchronous active/exhausted/mounted guards and bounded Firestore pages. | Do not duplicate or overwrite this work. Authenticated/public acceptance and performance remain separate evidence. |
| CRM Customers / follow-ups | Remote filters; 30-row cursor pages; next page replaces current data; a failed request clears the old page. Follow-ups carry an asOf boundary. | Preserve explicit server-filter submission and asOf semantics; consider previous-page navigation and retaining old rows after failed navigation. |
| CRM Documents | invoiceList cursor pages; load(after) calls setList(r), replacing old rows. “Trang tiếp” has no corresponding previous control in this list. | Most direct next candidate for scroll loading; preserve invoice selection and actions. |
| Shipping | Existing queue-specific page navigation, selected-order and parcel workflows. | Retain workflow boundaries; scroll conversion requires a separate impact plan. |

## Proposed next plan: INVOICE-SCROLL113 v1 — awaiting approval

Goal: automatically append invoice pages when scrolling, with manual keyboard fallback and recoverable read failures. No invoice creation, payment, issuing, sharing, financial command, API, authentication, or backend changes.

Files/functions:
- src/features/invoices/Documents.tsx: load(after) merges rows by stable invoice ID for cursor reads and replaces rows on refresh/filter change; add in-flight guard, stale request guard, consumed-cursor detection, observer cleanup, and footer retry. Maintain orderFilter boundaries and selected invoice identity.
- src/features/invoices/documents.css: scoped footer/pending layout only if existing primitives are insufficient; preserve print styles.
- Focused browser checks/evidence: auto append, filter/refresh reset, duplicate cursor, failed append preserving current rows, detail selection, no writes, keyboard and narrow layouts.

Impact/risk: medium frontend concurrency and accounting-record navigation. listWork cursor is unrelated to invoiceList cursor; trace invoiceList ordering, authorization and next semantics in functions/src/invoices.ts before implementation. Documents.tsx and documents.css already contain unrelated WIP; freeze pre-task snapshots and preserve them.

Smallest safe implementation: reuse existing invoiceList read contract; no eager full-inventory download. Long-lived DOM/memory grows with visited pages; windowing is a separate trade-off if measured scale requires it.

Repository rule: .ai/workflows/plan-existing-system-change.md step 15 requires developer-team approval of this concrete new-screen plan before edits. PRODUCTS112 approval does not silently cover protected changes to Documents.
