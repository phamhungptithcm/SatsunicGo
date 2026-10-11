# Recipient UX correction — 2026-10-09

Plan/status: APPROVED continuation of PAYMENT-UPFRONT v3/R4. Human approval evidence: current chat request explicitly directs the summary-button relocation, inline required marks, input highlights and stable red validation feedback. Existing v3 approval includes these files and UI review/fix loops. No additional approval requested for these exact reversible fixes.

Intelligence: CodeGraph queried first (PurchaseCheckout/App/schema flow), then CocoIndex (recipient/CSS); gate DEGRADED: stale commit metadata, both health queries passed. Current targeted source verifies conclusions. HEAD 0d6e721698608eebb36b0b2f68021c3054d97d1c, shared dirty worktree, frontend5207 PID33570 reused. No restart/reset, index installation or role changes.

Verified defects: grid label splits requiredMark into a separate row; submit button lives in the left recipient form; schema failures insert a top-level bordered message and focus the heading, causing scroll/layout shift. Existing server schema is authoritative and remains unchanged.

Smallest change:
1. purchase-checkout.tsx: associate a right-summary full-width submit button with the existing recipient form via form/id. Keep Enter submission, busy/cache/pending/regions guards, overview confirmation and backend call unchanged.
2. purchase-recipient-validation.ts: map existing schema issues to six local fields with concise Vietnamese corrections. Show only after attempted submission, update while editing, never send an invalid form to the backend.
3. purchase-checkout.tsx/css: inline label/asterisk spans; persistent error slots, aria-invalid/describedby, red invalid controls and borderless red text. Focus first enabled invalid input with preventScroll instead of the page heading. Preserve values and clear validation on saved-address change. Keep mobile/keyboard and saved-address/province dependencies.
4. tests/unit/purchase-recipient-validation.test.ts plus browser current real shell: blank/invalid/partial/corrected inputs; button/form association and width; required marks; stable geometry/scroll; Enter; responsive320/390; valid overview and consent reset. Scoped typecheck/lint/format/build and regression unit checks.

Impact/risk: frontend-only bounded six-field validation and CSS scoped to purchase checkout. No schema, API, fees, financial state, auth, database, dependency, Maps/PayOS/mail/deployment change. Actual server validation remains mandatory. Backend/long load tests not repeated for this UI-only delta. Global service feedback retains recovery but uses red borderless text; local field errors no longer use the global error block.

Review: write-product-content all eight principles/current in-context evidence, code/code-quality review and final-implementation-review. Record failures/fixes and limits. Prior gateway evidence remains historical for its old source hashes; this delta gets its own source/evidence manifest.
