# Finance privacy and transport lease delta — proposed, no implementation

Human authorization: persistent all-CRM fix and UI/UX hardening approval; source ownership remains subject to integration lead's exclusive lease. No additional human approval requested. Source/test/report files remain frozen.

Baseline verified 2026-10-06:
- src/features/payments/Finance.tsx: b272e5eb2b8816578746e019dcd9eeb2ed38df1d9afab9cc7db6b764e287e742
- src/features/payments/FinancialReview.tsx: 6b577c926dd993d302c8da9280424c7083129d380a2a0e21deb310e6d5b050ef

Observed: queue load uses fail-fast Promise.all and drops rejection identity; preflight orderHistory catches also drop cause. Actual permission-denied/unauthenticated mutation failures leave parent financial records and child drafts displayed. State-only locks are not synchronous and child cleanup releases them before pending transport settles.

Scope: those two frontend files, an explicitly leased focused native spec and new content/review documents. No backend, shared CSS/helper, permissions, financial contract, provider, singleton configuration, timeout or dependency change.

Implementation contract:
1. One parent-owned synchronous exact-token logical lease excludes every queue reader, recovery and consequential mutation. Acquire before first await; state reflects the ref. No cleanup-based release. A stale completion cannot release a later token.
2. Child mutation owns preflight, command and internal readback under the same lease. Preflight ordinary failure releases transport/lease while retaining draft. Known CAS/MFA/validation rejection retains editable draft. UNKNOWN freezes identical command/operation/version/payload and retains logical lease; only exact-token replay may start, with separate transport-in-flight exclusion.
3. Grouped queue readers await allSettled. Preserve tuple types, prioritize actual known auth failures even if ordinary failure settles first. Stage results and publish only all-success/current generation. Ordinary errors do not claim empty data. LoadNext also preserves actual cause.
4. Known auth signal raises a provisional parent privacy fence, invalidates reader generations, hides all cached IDs/amounts/forms and discards child drafts by unmount. Discard parent membership confirmation and sensitive old notices/errors too; no private identifier may remain in status, ARIA or hidden DOM. It does not claim universal role revocation. Exclusivity prevents a separate command/reader remaining concurrent when this signal is processed. Do not erase a still-running transport lease.
5. ACK is committed before internal readback; readback failure cannot demote ACK to UNKNOWN or resend command. Privacy may fence after ACK, with recovery limited to reads.
6. Explicit recovery acquires the same lease, resets cursors and reads all three permitted queues. Reveal only all-success/current-generation. Any failed recovery, including ordinary network failure, keeps the fence closed; enable only explicit retry once all readers settle. Restoration of the actor profile alone cannot reveal cached state.
7. Normal parent navigation unmount retains existing durability limitations; do not claim durable recovery across navigation/reload. No sensitive localStorage or hidden DOM.
8. When the active form unmounts, move keyboard focus to the generic fence heading/recovery control. Announce recovery loading/error and send focus to the freshly authorized queue heading after successful recovery. Do not focus hidden or stale content; no added animation.

New user-facing strings, subject to in-context product review:
- 'Cần kiểm tra lại quyền truy cập.' — provisional auth fence, no assertion of permanent or global revocation.
- 'Kiểm tra lại quyền' — explicit fresh read recovery.
- 'Đang kiểm tra quyền truy cập…' — recovery loading only.
Existing network/CAS/MFA and uncertainty copy retained where behavior is unchanged. Inventory every changed string/state before implementation.

Validation under integration lead's serial runner:
- Same-tick double submission starts one actual preflight/command only.
- Early ordinary queue failure plus held sibling actual auth failure keeps lease until all settle and fences; no stale snapshot publishes.
- Actual committed lost response keeps immutable command and blocks refresh/page/scope/other mutation; exact replay has one financial effect/audit.
- ACK plus failed/auth-denied readback never replays acknowledged command.
- Separate actual auth-denied orderHistory preflight, command rejection and ACK readback cases; ordinary preflight network/CAS/MFA retains draft and never fabricates a command.
- Fresh task-owned Google-linked FINANCE actor; only its users.locked toggled. Actual backend denial hides owned identifiers/amounts/forms; restored actor alone does not reveal; explicit fresh read recovery does. No shared role/config writes.
- 390/768/1440 overflow, keyboard focus, status/error announcement and reduced motion/zoom checks; scoped lint/typecheck and fresh independent final review.

Evidence status: design reviewed conditionally; source/native/product acceptance NOT_RUN. Eight product principles require actual current-context evidence; source-only mapping is not acceptance. Production readiness NOT_READY. Token/cost unavailable. Memory candidates: None.

Exclusive integration-lead lease granted 2026-10-06 via current chat message; implement only Finance.tsx, FinancialReview.tsx and new release-finance-privacy032.spec.ts. Persistent human approval docs/approvals/SATSUNICGO-CRM-UX-028.md applies. No other source/spec/service changes.
