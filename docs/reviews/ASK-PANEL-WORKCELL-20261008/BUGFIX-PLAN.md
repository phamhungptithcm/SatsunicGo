# Ask correctness repairs · v1

Task: ASK-PANEL-WORKCELL-20261008. Source baseline: TEAM-BRIEF.json revision1, SHA256 466d6255aaa17c9badde09cfff4d156d990bf694060572a28390e719ab595121. HEAD: 53d59bd88fa7da9d1243692336ecd09b6540ea31. Intelligence: DEGRADED; stale optional indexes, bounded current source verification. Dirty concurrent Analytics/Dashboard changes are preserved.

Approval: existing Ask invariant fixes are within the human-approved ASK-PLATFORM-20261007 plan and APPROVAL.md, continued by the current explicit request to test/fix Ask with five specialists. This record does not self-authorize a new panel, contextual generic approval, public backend contract or release. Those are separately pending human review of DESIGN-PLAN.md and the interactive preview.

## Verified current defects

| Finding | Trigger and incorrect result | Independent source checks |
| --- | --- | --- |
| P0-01 / FE-02 | Edit a manual request field without saving; button/exact chat sends the previous draft. Save closes before verification. | BA, UX, FE, BE, TL; Commerce FormData/save/submit and Ask action dispatch |
| P0-02 / FE-03–04 | Delivery edit is displayed as saved; exact chat accepts quote despite editor guard; verified delivery save leaves editor active. | BA, UX, FE, BE, TL; Commerce recipient fields/summary/buttons, Ask dispatch, backend recipientSaved check |
| P0-03 / FE-01 | Remote snapshot advances conversation version while local draft remains older; submit attaches newer version to stale payload. | BA, FE, BE, TL; Commerce snapshot/mutate, askWorkflow expectedVersion, index submitRequest |
| P0-04 / FE-05 | New-question scroll chooses last task panel rather than the turn. | FE; Ask newestTurnId effect and appended CommercePanel |

Severity: P0-01–03 HIGH because reviewed request/address may differ from committed action. BA initially P2; root preserves that assessment and uses impact evidence for HIGH prioritization. Runtime reproduction is required before marking fixed. No backend authorization bypass is inferred.

## Smallest safe implementation

1. `src/features/ask/Commerce.tsx`, `useAskCommerce`: track whether the editable draft still corresponds to its authoritative base. Do not silently bind old local input to a remotely changed saved draft. Synchronize clean local state or conservatively retain it with a conflict/readiness guard; preserve pending-operation recovery, saveTurn ordering, ownership and UID/CID reset. Snapshot fields unrelated to draft must not make ordinary conversation saves conflict. Successful own draft saves establish their verified base; stale remote changes require review before submit/save.
2. `CommercePanelContext`: expose current manual/recipient editor readiness through the shared commerce authority consumed by button and exact chat dispatch. Block old payload submission while the manual editor has unreviewed changes. Await save results; close editors only on verified success for the same context and unchanged edit revision. Preserve visible input on rejected/unknown saves. Render a separately verified saved-recipient snapshot; never label mutable inputs as saved. Saved summary may be unavailable while its readback is unverified.
3. `src/features/ask/Ask.tsx`, existing customer action branch: check the same current readiness as buttons before exact commands; return a concise VI/EN explanation with the correct next step. Do not add generic yes/no yet. Target the newest existing `data-ask-turn` element in scroll, retain reduced-motion and user-scroll cancellation.
4. New owned `tests/browser/ask-panel-correctness.spec.ts` and config: use real Ask/Commerce UI and real hook where needed, local route stubs for synthetic Firebase/Auth/API only. Capture fail-before/pass-after dirty request button/chat, recipient saved/edit/save failure parity, remote draft conflict, clean remote refresh, own save/turn save, context/auth/version fences and new-turn scroll. Reuse only existing 5207. No emulator settings/data mutation, provider calls or runtime restart.

Only one application writer: frontend_engineer after root lease. Root writes review/preview artifacts. No dependency, public schema, financial, knowledge policy, retention, provider, release, global style or Dashboard edits.

## Preserved boundaries and trade-offs

- Keep resource-version keyed child fences until an independently reviewed replacement exists. Do not fix preservation by removing order version from keys.
- Distinguish custom REQUESTED order from catalog QUOTE_ACCEPTED order; acceptance does not pay. Backend computes amount/status through existing typed commands.
- Unknown durable outcomes keep exact UUID and reconcile, never blind retry; no success copy before admitted result.
- Private recipient/profile values stay out of model context, transcript and telemetry.
- An interim editing guard may require Save before exact chat confirmation. That is preferable to dispatching a different payload; seamless contextual continuation belongs to the separately reviewed design.

## Verification and rollback

Frozen full-unit baseline: output/ask-hardening/2026-10-08T13-57-49-493Z, sourceStable=true, 1221/1222 passed, one pre-existing Dashboard required-label failure. Preserve that failure.

Run fail-before browser regressions, focused affected units/browser suites, frontend/backend compiler and touched-file lint. Product Language Gate: inventory changed VI/EN states, source meaning, all eight Human Interface principles, rendered desktop/mobile evidence. Independently review current patch/hashes through TL; fix approved findings and rerun affected checks. No build/deployment claim without executed evidence. Save pre-change sources and a patch to restore only this slice if needed; no git reset or unrelated WIP removal.

## Review delta · TL-R02 · remote recipient revision

Independent source hypothesis (HIGH, runtime reproduction pending): a second tab saves delivery B, advancing conversation.version without changing order.version. The first tab receives the conversation revision before the recipient readback and may accept a quote using the new expectedVersion while still presenting delivery A. Existing phase0 approval requires reviewed delivery and button/chat parity; this correction stays inside that approved invariant. It adds no action, schema, payment authority or new layout.

Before changing application files, FE must reproduce with the real hook/panel and synthetic delayed transport. The smallest correction binds saved-recipient verification to the current conversation revision; any revision mismatch makes the saved summary unavailable and blocks both chat and button until a non-cached, owner/schema-validated current-scope readback. Re-read on revision changes, discard callbacks from older subscriptions, and clear both state and synchronous references on invalidation. Preserve active recipient edits and pending own-save acknowledgement/readback matching across unrelated saveTurn revisions. A version-triggered re-read must not wipe editable fields or remove order-version/auth/resource fences.

Owned files stay Commerce.tsx plus the new correctness spec. Regressions: remote address-before-readback must dispatch zero commands; matching new readback resumes correct summary/readiness; unrelated turn saves preserve edits; old listener callbacks, listener failure and held save acknowledgement remain fenced. Test before/after, freeze hashes and rerun compilation/lint/broad regression before independent review.

## Error recovery delta · ended recipient subscription

Review must verify Firestore listener termination on error. If the listener is ended, waiting/reconnecting alone is not a supported recovery. Within the existing approved failure-handling slice, add a read-only current-recipient reload control only for that failure, localized Thử tải lại / Retry loading. Re-subscribe under the current conversation revision and owner/resource fences, preserve editable fields and pending save matching, and do not issue any write/payment/provider operation. A repeated failure remains unavailable. Guidance must refer to this actual control rather than promise automatic reconnect. Test listener error → retry → fresh readback, old callback rejection and unchanged dirty input; inventory both localized control/message states in Product Language evidence. No new generic chat action or layout authority is added.

## Broad fixture compatibility delta

Observed source: Ask.tsx now imports askReadinessMessage. Entire-module synthetic Commerce stubs in tests/browser/ask-platform.spec.ts and ask109.spec.ts export only useAskCommerce and CommercePanel. Before changing those two fixture bodies, reproduce an ESM import failure on their existing test; then add the missing helper export with an explicit throw if unexpectedly invoked. Their user/order are null and no readiness action should occur. Preserve every assertion, test case, timeout and production guard. Actual readiness remains exercised by the new real-hook correctness suite. Root owns only these fixture contract updates after FE writer/browser lease releases; no application edit, new feature or relaxed test condition. Rerun both focused fixtures and the full existing Ask browser acceptance suite.
