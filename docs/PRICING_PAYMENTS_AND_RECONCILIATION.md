# Money and reconciliation

Domain money is integer VND with bounded safe integers; FX uses rational arithmetic and BigInt intermediates. Deposit rounds up to 50% of accepted quote. Membership discounts apply to eligible service fees, not goods. Final balance uses approved final charge minus net collections; refunds, overpayment and provider context are guarded. Fixture 2,000,000 / 1,000,000 / 2,160,000 yields 1,160,000 balance.

A reported bank transfer remains pending. Authorized finance confirmation binds unique trimmed bank reference, current order version, immutable entry and optional pending review atomically. Membership receipts are separate from order collections. Refund commands require evidence/reason and cannot exceed collected funds; full refund/reversal exception management remains incomplete.

payOS amounts come from server state; browser returns cannot mark paid. SDK verifies signatures before allocation. Receipt/context deduplication prevents double collection. Uncertain link creation requires authenticated provider readback matching order code/amount; it is not blindly retried. Contract fixtures and fake HMAC tests pass; merchant configuration, real callbacks and reconciliation are NOT_RUN.

Physical batch freight uses deterministic integer allocations and quantity/weight guards. Final approval is invalidated when relevant amounts change. Underfunded or held orders cannot dispatch, including batch paths. Commercial rates, mandatory costs, membership and refund terms still require owner approval. Never use fixture prices for live transactions.
