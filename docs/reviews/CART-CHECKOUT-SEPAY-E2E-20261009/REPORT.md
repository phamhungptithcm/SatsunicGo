# Cart → checkout → payment → PDF: current evidence report

**Local checkout fix and executed demo/synthetic cases pass. Full genuine SePay sandbox E2E remains BLOCKED; production NOT_READY.** Latest review: cycle 2, source-bound in FINAL-MANIFEST.json. Repository intelligence DEGRADED: stale indexes, bounded source/compiler/test verification. This is a blocked acceptance handoff, not a production sign-off.

## Change and result

One reproduced defect fixed: successful checkout commit increments cart revision and locks the cart to an active checkout. The old frontend effect briefly showed “Giỏ đã đổi” before navigating. CHANGE.patch skips invalidation only when that active checkout already owns navigation. Actual changed-cart review, server revision/hash/owner/expiry/price checks, payment idempotency and UI structure are preserved. Fixed file SHA256: `34b96ced28ab271a230cf50d6882e41f7dca1c1bb28a5833892a927a1f27de4b`.

Two normal UI commits after the fix showed no false alert. Editing the cart in a second tab still invalidated overview and retained recipient data. The normal UI flow used the preserved request form, catalog plus custom items in one cart, searchable province/commune, overview, acknowledgement, demo gateway, completion, order links and actual private PDF download.

Mixed paid amount: 1,650,000 listing + 2,900,000 researched custom goods + 145,000 service fee = 4,695,000 VND. Durable ledger has exactly two rows totaling 4,695,000 after reload. Checkout `02ce826e-b8fa-45c7-a5fe-9c6a9ce8e63e` owns the two paid product orders. Declined checkout stayed cancelled. Underpay checkout `e286d884-9e65-481b-8900-08ca5c6eb508` remains review_required for 3,299,999/3,300,000, with no receipt or allocated order; a forged success URL does not change it. See UI-DURABLE.json.

## Executed verification

Overlapping runs are not added into a unique-test total.

| Evidence | Result | Boundary |
| --- | --- | --- |
| UNIT-INITIAL.json | 288/288 passed | 15 focused unit files; test-only beta environment; initial snapshot. |
| UNIT-POSTFIX.json | 168/168 passed | Checkout, validation, feedback, selection and region regression. |
| SEPAY-REGISTRATION-CURRENT.json | 100/100 passed | Current SePay and exact-demo secret-registration source. |
| SEPAY-INTEGRATION-INITIAL.json and SEPAY-INTEGRATION-TRACE.json | 31/31 each | Real handlers and existing Firestore/Storage; synthetic provider adapter. |
| CROSS-PROCESS-CURRENT.json | 1 selected passed, 30 skipped | Four independent Node 22 settlement processes against current private compilation. |
| PRIVATE-RULES-AND-ORPHANS.json | 8/8 passed | Private collection authorization and bounded receipt-orphan cases. |
| PDF-VISUAL-EXPORT.json | 1 selected passed, 8 skipped | Long-product PDF export case; not nine executed cases. |
| STATIC-CHECKS.json | Exit 0 | Frontend/Functions compilation, scoped ESLint, diff whitespace. |
| SCENARIOS.json | 63 local cases PASSED, 4 NOT_RUN | Manual UI/PDF/probe plus 31 SePay and 8 private/orphan cases. Evidence distinguishes demo, synthetic protocol and genuine provider. |

The initial restricted-network setup failure remains in SEPAY-INTEGRATION-SANDBOX-NETWORK-BLOCKED.json; the scoped local-network rerun passed. Slow Auth Emulator popups failed twice before normal DOM login succeeded. The native download-event watcher timed out, but the actual browser file exists and its hash equals owner Storage bytes; no product download failure was inferred.

Actual downloaded PDF: [receipt](UI-02ce826e-b8fa-45c7-a5fe-9c6a9ce8e63e.pdf), 584,177 bytes, SHA256 `d08c0ae815ceaef5bf4baf5250cef7513e18bc24fd513cb9f59039e06bfa9334`. Visually inspected item rows, quantities, fees, total, method, reference, timestamp, Vietnamese text and tax-document distinction. Synthetic SePay PDF separately inspected. All eight pages of STRESS-30-LINES.pdf inspected: 30 references, repeated headers and final total retained; no overlap or clipping seen.

## Review cycles and residuals

- Cycle 1 BLOCKED: F1 false cart-change alert reproduced; concrete in-scope fix documented and approval guard passed before editing.
- Fix: exact guard and dependency delta in CHANGE.patch; no new text, API, schema, authentication, dependency or runtime setting.
- Cycle 2 fresh review: scoped engineering delta PASSED within executed checks; overall BLOCKED because genuine provider and production acceptance are NOT_RUN. PRODUCT-CONTENT-REVIEW.md records all eight principles and current UI states. QUALITY-GATES.md and FINAL-REVIEW.json retain the acceptance gap.
- Low residual: Storage SDK teeny-request pipeline emits per-request MaxListeners warnings. Ten sequential 584,177-byte downloads took 3–10 ms locally; GC-normalized heap +710,424 bytes and external +60,776 bytes. No uncontrolled growth shown by this probe; no production leak/load certification. No warning suppression or unapproved dependency change.
- Concurrent changes in purchase-sepay.ts and payments/sepay-sandbox.ts were detected separately, preserved and rebound with 100 current unit checks, Functions compilation and the four-process case. They are not this task's edits. Exact hashes are in FINAL-MANIFEST.json; the release owner must preserve approval/provenance.

## Data, runtime and release boundaries

No shared server restart/reseed, duplicate frontend/emulators, production financial writes, real money, real email, secret-value access, public IPN, IAM or deployment. Cleaned only exact owned automated fixtures: 1,201 initial + 31 latest documents, readback remaining zero. Retained this task's isolated UI customer/product/cart/checkouts/receipt for demo review; not migrated to production. Shared settings/counters and unrelated WIP preserved. UI email state demo_delivered is a demo sink, not external delivery.

Shared Git HEAD at manifest time: `99822aae502cc75406184ee345e4527c6e0db66d`; worktree dirty with substantial unrelated concurrent WIP. No commit/push/deploy by this task. Root release chat `01a116b3-a055-7190-b275-a4461826678a` owns integration/release. HANDOFF.json confirms the scoped patch/evidence message was sent there. Integration, new candidate CI and deployment of this follow-up fix are NOT_VERIFIED; older candidate CI does not cover a later fix.

## Remaining required input and gates

Genuine SePay hosted checkout/IPN/readback needs verified app-scoped backend credentials and a public IPN test endpoint. The user previously deferred public IPN. PROVIDER-NEXT-GATE.md specifies the concrete safety/acceptance scope before any future exposure; no secret values should be sent in chat. The current adapter is exact-demo-only and cannot serve production simply by flipping a flag. Real email, production load/soak, exact candidate build/deploy/live payment acceptance are NOT_RUN here. The release owner receives this blocked handoff and must retain payment activation holds.

The mandatory [final-implementation-review](../../../.ai/skills-src/final-implementation-review/SKILL.md) defines BLOCKED when “any required dimension failed or was not run, evidence is insufficient”. This is why local passes do not become a complete provider/production PASS. No repeated permission request is needed for local work already authorized. A pending input question asks only for resource/project names for future binding and IPN, never secret values.

## Evidence-derived task report

Acceptance weights are explicit in TASK-LEDGER.json: **85/100 passed**, including release synchronization; **15/100 genuine provider NOT_RUN**. These are evidence-completion weights, not confidence in defect-free behavior or production readiness. Exact deployment remains a separate required release gate. Reporter CLI unavailable; manual task-local ledger only. Provider-reported token usage: Unavailable. API-equivalent estimated cost: Unavailable. Actual billed cost: Unavailable. Memory candidates: None.
