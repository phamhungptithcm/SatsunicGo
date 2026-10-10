# PDF natural copy refinement

ID/version: PDF-NATURAL-COPY-20261009 v1. Human authorization: current requests for short natural Vietnamese, removing the duplicate Không thu tiền thật line under SePay sandbox, and a sincere thank-you at the end. Refines the previously approved PDF presentation. Risk LOW, reversible copy/presentation only.

Intelligence gate run `/tmp/sepay-pdf-copy-intelligence.json`; CodeGraph then CocoIndex queried; critical current source/test verified. DEGRADED index coverage. Renderer reused by initial/balance receipt worker and resource probe. Existing snapshot fields/payment settlement/receipt worker remain unchanged. Current baseline renderer SHA25628a356aee1c684c706cdbe189be62407be07428ec14e3eb0586300efa14c12cc; unit SHA256ae31eb0a078f15f4819808ec3d1204d70c7950cdd4e03e2695df3d9a5b1bf9f2. Dirty concurrent work preserved; integration owner notified before edits.

Change plan:

- `functions/src/purchase-pdf.ts`: remove redundant no-real-funds helper only for SePay sandbox, retain explicit SePay sandbox method and existing demo disclosure; reduce related metadata padding while keeping timezone/invoice/merchant values clear. Shorten verbose purchase/payment notes without changing paid/unpaid/bundled distinctions. Shorten merchant-code label. Keep tax distinction as a short footer. Add one centered thank-you on the final page: Cảm ơn bạn đã tin tưởng và chọn dịch vụ mua hộ của SatsunicGo.
- `tests/unit/purchase-pdf.test.ts`: adjust existing copy expectations; verify SePay remains labeled sandbox without the removed line, demo retains disclosure, thank-you appears exactly once including multi-page output. Preserve amount/time/row/pagination checks. No new test suite or dependency.
- Generate fresh initial/sourcing/final/catalog-only/30-item PDF samples from the actual renderer in a new output directory; extract text and inspect rendered first/last pages. Record full changed-string inventory, eight principles and final review hashes. Earlier PDF verification remains historical for its hashes.

Validation: scoped PDF and checkout regressions; lint/format/typecheck; render/extract/inspect relevant variants, exact paidAt/timezone/amount semantics, no clipping/overlap including final-page footer. Native ledger unavailable; file-backed evidence retained. No financial/provider/data/runtime/config changes, reset/restart, credential access, commit/push or deploy. Source owner to receive new hashes and test/evidence handoff.
