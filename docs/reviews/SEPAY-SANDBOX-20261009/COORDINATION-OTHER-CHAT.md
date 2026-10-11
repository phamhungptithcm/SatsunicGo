# SePay local implementation coordination

Updated: 2026-10-09. No public IPN deployment, live money, secret-value access, production activation, or backend restart/reset is authorized by this handoff.

## Human authorization and plan provenance

- Plan: `SEPAY-SANDBOX-20261009 v1`, refined by the current user's request to show three payment methods and test only bank-transfer QR first.
- Approval: `APPROVED`. Approver: repository owner. Verified directly with `read_thread` on local thread `01a120df-2ef2-79b2-a108-1bc1f32012a7`: user message **“approved sync up vs chat khac de lam dong bo”**. This was checked against the actual human message, not inferred from the other assistant's claim.
- Current user steering: show payment-method selection before payment, supporting bank-transfer QR, NAPAS transfer QR and cards; only the already-ready bank-transfer QR is enabled in this phase.
- V2's earlier pending-approval banner predates discovery of this approval. V1 integration is approved; this UI refinement implements the direct current user request within the same checkout integration. No duplicate approval request is needed for this bounded refinement.
- Intelligence: CodeGraph then CocoIndex queried; critical checkout/commit/overview source verified. Gate `DEGRADED` in `/tmp/sepay-methods-intelligence.json`; no clean-index claim.

## Ownership agreed in both chats

| Owner | Files and responsibility |
| --- | --- |
| Current chat | `src/features/cart/purchase-checkout.tsx`, `purchase-checkout.css`, new `purchase-payment-methods.tsx` and narrowly scoped helper/tests; overview selector, method-aware submit/recovery and UI evidence; static preview and supplemental reports |
| Local thread `01a120df-2ef2-79b2-a108-1bc1f32012a7` | Backend/domain contracts, SePay adapter, settlement/IPN/readback, payment page/completion/PDF, SDK/lockfiles, service exports/CSP and v1 integration tests; reuse the selector if a payment-page caller needs it |

No owner may revert unrelated WIP. Coordinate any contract adjustment before editing the other owner's files. Current chat does not edit `STATUS.md` or backend/domain files while the integration owner is active.

## Contract constraints

- Methods: `BANK_TRANSFER`, `NAPAS_BANK_TRANSFER`, `CARD`.
- Server capability is authoritative; missing/failed capability must not imply readiness. NAPAS/cards remain disabled for this test phase.
- Selected method is pinned to the checkout/intent/idempotency fingerprint and provider form/readback/PDF. Backend rejects unavailable methods even for a manually edited request.
- Initial and balance checkout share the selector. Selecting a method alone creates no checkout, payment attempt, order or external call.
- Pending retries preserve the original method and operation. Legacy persisted demo commands need explicit compatibility treatment, rather than silently changing a pending operation.

## Shared runtime

- Shared frontend only: `127.0.0.1:5207`, strict port, Vite PID `12137`, log `/tmp/satsunicgo5207-method-preview.log`.
- Restart was permitted by the user's prior explicit frontend-5207 approval after the listener was confirmed stopped.
- Demo project `demo-satsunicgo`, emulator Auth `19207`, Firestore `18207`, Functions `15207`, Storage `19208`.
- No backend restart, data reset, secret retrieval, new frontend port or production change performed by this chat.

## Validation boundary

`SCENARIOS.json` contains 67 planned cases; planned is not passed. Current chat validates its UI slice; integration owner records full sandbox flow evidence. Browser proxy evidence must remain labeled as a proxy and cannot prove a provider payment.
