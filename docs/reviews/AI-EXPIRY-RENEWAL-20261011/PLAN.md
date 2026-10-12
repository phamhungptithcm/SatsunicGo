# Approved bounded customer-AI renewal

Existing paid activation ends2026-10-12T00:00:00Z. Source pricing expiry and settings policy both enforce this boundary. Production repair CI/deploy/hosted acceptance may run beyond it. No extension is assumed from elapsed time or broad autofix authorization.

Human approved: “Duyệt gia hạn 2 giờ, giữ nguyên ngân sách”. Concrete delta: extend customerAiLimits.pricingExpiresAt only to2026-10-12T02:00:00Z. Preserve existing model, releaseId,10000input/800outputtokens,1000VNDreservation, lifetime50000VND, per-user5000VND, global/user rates, reservation history and no refund/reset. Do not extend pilot/research pricing or budgets. After source CI/artifact/native receipt, require normal fresh OWNER MFA and existing saveAskCustomerPolicy command to renew customers policy; no direct Firestore write or MFA bypass. Existing canary proof remains required by command. Keep one final1000VND acceptance attempt within current owner balance, no blind retries.

Pricing read from official Vertex pricing2026-10-11: Gemini2.5FlashLite standard text input0.10USD/M and output inclreasoning0.40USD/M. Existing conservative100000VND/USD ceiling yields132VND max generation envelope(10000input+800output), below1000 reservation. No tools or Grounding added. Source https://cloud.google.com/vertex-ai/generative-ai/pricing . This is an envelope, not billed cost.

Tests: expiry boundaries immediately before/at02:00; original00:00 no longer hard-pricing stop only after approved update, settings still expire at originaltime until authorized MFA renewal; disabled/expired/malformed/foreign settings never fall through to pilot. Caps/replay/account-lock/reservation negatives unchanged. Independent review, exact CI, original artifact and hosted final canary required. No successful handoff before those checks. If declined or unanswered, retain originalexpiry and fail closed.

Review clarification: an existing disabled/expired/malformed customer policy stays on the customer path. Missing customer policy can select the separate pilot route; this proposal leaves pilot pricing expiry00UTC unchanged, so test zero paid dispatch after00 rather than claiming the route is never selected. No routing change proposed.

Source implementation preserves pilot/research expiry. Production settings renewal remains pending normal fresh OWNER MFA; source changes alone do not renew policy.
