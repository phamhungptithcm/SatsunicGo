# Real payment scenarios and corrective validation v2

Date: 2026-10-09. Owner: chat 01a120df-2ef2-79b2-a108-1bc1f32012a7.

## Authority and scope

Continuation of the approved local-first SePay sandbox plan. Human authority is
recorded in ../APPROVAL-v1.md and the latest request to write realistic happy and
negative scenarios, test and fix business, backend, security and performance
failures. This is corrective work inside that approval, not production activation.

The shared checkout is dirty and concurrent. Preserve unrelated edits. Reuse
frontend 5207 and the existing demo-satsunicgo backend at 19207/18207/15207/19208.
Each test writes only uniquely named synthetic customers, products and payments;
no shared policy replacement, reset, real email, real payment, provider credentials,
public IPN, deployment, commit or push. Export demo data after test writes.

## Current evidence and limitations

- Repository Intelligence Gate: DEGRADED. CodeGraph queried before CocoIndex,
  critical paths verified in source. One incremental refresh succeeded, but the
  gate still reports stale indexes; no repeated recovery or blanket coverage claim.
- Current baseline: 317 unit assertions passed; frontend typecheck and backend
  compilation passed. These are not authenticated browser or provider evidence.
- Previous CUA localhost denial remains binding. No alternate browser, CDP,
  navigation workaround or delegated attempt. Full authenticated rendered payment
  UI acceptance remains NOT_RUN.
- Target Node 22 and actual SePay/public-IPN acceptance remain separate gates.
- Existing reports remain historical; this directory records the new candidate.

## Impact and implementation plan

1. Add concrete Given/When/Then scenarios with exact automated test mappings and
   expected money, order, cart, evidence, receipt and security outcomes. Split
   backend evidence from browser/provider assertions instead of claiming a whole
   composite journey passed from a partial test.
2. Extend tests/rules/purchase-sepay.test.ts for missing IPN, configuration outage,
   finite retry exhaustion, stale worker fencing, parallel readback bounds,
   mixed-cart corruption and private receipt download failures. Use the existing
   adapter injection, real handlers and shared emulators. Add orphan receipt
   coverage to the scoped runner, without starting another server.
3. Extend tests/unit/purchase-sepay.test.ts for invalid clock normalization.
   If reproduced, reject invalid clock components in
   packages/domain/purchase-sepay.ts before Date.parse. Valid Vietnam SQL dates,
   explicit ISO offsets and all valid existing signing/proof behavior remain.
4. Fix only reproduced, in-scope defects at their first incorrect state. A
   materially broader fix requires a separate delta plan. Do not edit another
   owner's notification sender/preferences or product design.
5. Run unit/typecheck, scoped emulator tests, existing HTTP business regressions
   and bounded resource checks. Preserve failure output and subsequent reruns.
   Capture source hashes and freshness before recording results.
6. Complete fresh security/code-quality/final review cycles. Report unresolved
   browser/provider/production gates explicitly; do not label the entire system
   complete from local tests.

## Risks and rollback

High integrity risk: duplicate/reordered proof, partial allocation and stale
worker writes. Tests must assert exact ledger/order counts and amounts, not merely
HTTP success. New tests and evidence are additive. A clock-validation correction
is isolated and reversible; no persisted data migration or financial correction.
Product copy/design is unchanged; domain timestamp meaning must retain Vietnam
timezone and reject malformed values without silently changing a payment date.

## Acceptance

Every scenario has an explicit execution status and bounded evidence. New negative
tests demonstrate no unintended order, ledger, receipt, real send or second charge.
Any fix has a red reproduction followed by a passing regression and fresh review.
Missing required dimensions remain BLOCKED/NOT_RUN, never counted as passed.

## Corrective finding v2-02

The broader unchanged HTTP race assertions reproduced a terminal-cancellation
reconcile failure (RACE-1). Root cause: applySettlement rejects an already
cancelled checkout before recognizing a repeat of the same server-confirmed
unpaid cancellation. Add a deterministic emulator regression and allow a no-write
return only after existing owner/provider/link/status validation, for the same
cancelled checkout, outcome cancelled, trusted link and no received evidence.
Retain rejection of pending/unknown/paid or mismatched links. This is a correction
in the approved shared settlement extraction, not a provider/API expansion.
