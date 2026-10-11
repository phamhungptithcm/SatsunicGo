# Customer emails v2 — local implementation handoff

Approved A+B implementation and final v2 design: **COMPLETE for the bounded local scope**. Final implementation review: **PASSED, cycle 3**. Production readiness: **NOT_READY / NOT_ACTIVATED**.

## Delivered

- Canonical typed catalog and deterministic renderer for all **42** approved Vietnamese subject/text/HTML templates. Actual SatsunicGo branding and existing authenticated account/support/membership/document destinations. No client HTML, arbitrary URLs, LLM calls, image/font dependency or open pixel.
- **37 connected producer/explicit-document paths; 5 deliberately dormant**. See RUNTIME-COVERAGE.md. Upfront checkout emits one payment confirmation per checkout, independent of PDF completion. Receipt-ready defaults to inbox. A sourcing proposal is atomic with its notification; a formatting failure cannot abort the business change.
- Owner/parcel grouping, customer-safe allocation snapshots, partial/full shipping states, refund request/cancel/recorded distinction, net collections and held/reserved balance guards. Financial authorization, proof/allocation/ledger/state transitions and code-owned provider holds are unchanged.
- Event-driven idempotent inbox projection plus bounded scheduled recovery. Inbox uses the approved heading and validated destination. Internal packing/claim/batch noise is suppressed from customer delivery while audit records remain.
- SMTP seam renders the typed template, checks policy/cutover/owner/current resource, rechecks confirmed **optional orderEmail** preference and current verified destination, pins recipient/body hashes and retains claim/late-result fencing. Missing/revoked/pending consent is blocked; promotions never substitute. Provider acceptance is recorded separately from actual delivery. Unknown outcomes require reconciliation; historical untyped backlog cannot send on configuration enablement.

## Verification

| Gate | Result | Evidence |
| --- | --- | --- |
| Whole-repository TypeScript | PASSED | `npx tsc --noEmit`; fresh successful run after parallel owners fixed transient errors |
| Backend compilation | PASSED | `npx tsc -p functions/tsconfig.json --noEmit`; isolated emitted build under `/private/tmp/satsunicgo-customer-emails-check` |
| Frontend + changed tests compilation | PASSED | `npx tsc -p .ai/local/customer-emails-tsconfig.json --noEmit` |
| Focused and domain regression | PASSED | **309 tests / 17 files**, Vitest with canonical demo environment; includes template/security, membership, changes, shipping/refund, purchase/provider/SePay/PDF contracts |
| Emulator integration | PASSED | **15 assertions**, 8 concurrent projectors → one inbox item; immutable hash, ownership, rollback, no email queue; disposable synthetic rows cleaned. `scripts/customer-notification-emulator-check.mjs` reuses 18207, never starts a server |
| Static analysis | PASSED | ESLint on changed renderer/policy/producers/inbox/tests; no new dependencies |
| Formatting/diff | PASSED | Scoped Prettier and `git diff --check` |
| Architecture/security/data | PASSED within scope | No network inside business transactions, event and inbox transaction fences, integer VND, owner-only projection, unchanged release gate; automatic indexes suffice for unchanged bounded queries |
| Product/visual | PASSED within browser proxy | IMPLEMENTATION-PRODUCT-CONTENT-REVIEW.md; 42 runtime HTML/text pairs, all 42 at 320px, desktop screenshot, keyboard Tab, long unbroken content regression; max fixture HTML **5536 bytes** |
| Final review | PASSED | IMPLEMENTATION-FINAL-REVIEW.json, three cycles with findings/fixes preserved |
| Intelligence | DEGRADED | IMPLEMENTATION-INTELLIGENCE.json; tools queried, source/tsc/tests verify bounded conclusions; freshness not claimed for entire shared worktree |
| Public SEO / animation / DB migration | NOT_APPLICABLE | No public indexed page, motion feature, schema migration or new client write permission |
| Actual email clients/provider delivery/load/deployment | NOT_RUN | Separate C/D activation acceptance; no customer sending or production changes in this task |

Validation environment used `VITE_USE_EMULATORS=true`, project `demo-satsunicgo`, Auth 19207, Firestore 18207, Functions 15207. Initial broadened Node-only runs hit App Check without DOM, then a missing demo-project setting; rerun used the real canonical demo configuration, with no control weakened. Transient errors in parallel tracking/preferences modules were recorded and their owners fixed them; final whole-repo checks passed. The first sandboxed emulator attempt could not connect and was stopped; the permitted local emulator run passed.

## Review fixes

Canonical hash independent of Firestore key order; 320px overflow under very long text/large amounts; safe projection failure wrapper; exact parcel membership/owner link; stale refund/warehouse/proposal suppression; known-unsent preflight failure separate from provider unknown; concurrent canonical optional order-email preference guard; own fixture typing/lint corrections. Each has executable or browser regression evidence. No unresolved high finding was identified within these executed scoped checks.

## Remaining activation boundaries

Conditional action-required/unread/material ETA/progress policy remains closed. Five dormant templates are explicitly listed in RUNTIME-COVERAGE.md. Membership service notices remain separate from order/promotional consent; no membership marketing is introduced. No backlog migration, webhook/deliverability acceptance, native mail-client acceptance, queue-age SLA or production activation is certified. Scheduled email/recovery remains every 30 minutes; inbox is event driven. Actual load and provider quota checks are deferred to C/D.

No shared server restart, reseed or new frontend. No secrets, customer mail, commit, push, PR or deployment. Rollback disables the new delivery capability and retains business events/inbox/financial records; never delete ledger entries to roll back a notification.

Git worktree is dirty with unrelated concurrent work preserved. Evidence is bound to IMPLEMENTATION-SOURCE-MANIFEST.json and the current commit recorded there; this is not a repository-wide release certification. No PR/Jira update was requested or created.

Acceptance: 42/42 content-render cases verified; 37 connected paths + 5 explicitly held by policy; local A+B complete. Review cycle 1 blocked findings → fixes → fresh cycle 3 passed. Weighted numeric progress is not fabricated without configured runtime weights. Mandatory runtime CLI is unavailable; equivalent review/check files are recorded here, not a claimed runtime receipt.

Token usage: Unavailable. Actual billed cost: Unavailable. API-equivalent estimate: Unavailable. Memory candidates: None.

Final coordination cycle 3: reused the parallel subscription task’s canonical notification-order-policy.ts for optional/required classification; optional preference checked before rendering and immediately before provider I/O. Required financial/action mail is preserved; the broad first-draft opt-in guard was removed. Added explicit regressions for both behaviors. Final current check: 309/309 tests in 17 files; previous transient snapshots are superseded.
