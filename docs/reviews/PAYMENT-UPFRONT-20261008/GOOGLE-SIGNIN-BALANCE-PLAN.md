# Balance inline Google sign-in — 2026-10-09

Approval: current human request “làm cân đối”, following the accepted compact inline cart Google action. Implement the bounded presentation refinement directly under this approval and the existing cart/purchase UI approval. Preserve unrelated work.

Intelligence: CodeGraph first confirms PurchaseSignIn has three callers (cart and two direct purchase fallbacks); CocoIndex second supplies cart CSS evidence. Current repository checker remains DEGRADED; critical selectors and cart context verified in source. Index limitations do not imply complete impact coverage.

Impact/plan: only add a cart-summary-specific rule in purchase-sign-in.css to center the existing compact Google button with symmetric horizontal margins and consistent spacing below totals. Keep item rows, summary text, authenticated primary button, direct-link fallbacks, auth callback, routing, cart merge, prices and backend untouched. No new text, dependency, state or runtime change.

Validation: CSS formatting/diff check and actual shared5207 cart at desktop and 320px; measure horizontal centering, 44px target, overflow and keyboard focus. No implementation-mirroring tests for a reversible CSS alignment change. Fresh scoped product content and final implementation review; no live OAuth, payment or deployment claim.
