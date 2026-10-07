# OWNER075 v1 — first production OWNER and TOTP setup

Status: APPROVED by direct user response `Approved` on2026-10-06; see docs/approvals/SATSUNICGO-OWNER-075.md. Target identity: the single Google account explicitly supplied by the owner in this conversation; do not persist the email/UID or authentication payload in tracked evidence.

## Intelligence and source evidence

Repository intelligence DEGRADED: stale CodeGraph, stale/unhealthy CocoIndex; bounded native evidence used. HEAD remains `1d9c5824e5d0647948a1986dabc7480c4b7b8cb2` with shared WIP.

Targeted Firebase Auth account lookup HTTP200 returned zero matching users. Identity Platform v2 config HTTP200 reports MFA DISABLED. Current production HTML is `0.1.0-beta.1`, not the prepared current candidate; real login capability on that deployed bundle is UNVERIFIED.

Application authority comes from `staffAccess/{uid}`, not custom claims. `functions/src/auth/guards.ts` requires verified Google sessions. `workspace.ts:saveStaffAccess` requires an existing OWNER and recent MFA; therefore first OWNER needs a separately reviewed one-time administrative bootstrap. Client writes to staffAccess are denied by firestore.rules. `src/features/auth/Security.tsx` already supports TOTP enrollment. No existing production bootstrap script found; seed-demo is emulator-only and must remain so.

## Proposed exact scope and impact

High-risk authorization change limited to project satsunicgo, number278913913091, default Firestore Singapore and Web app `1:278913913091:web:e40355cd8ad5abe00f9936`.

1. Add a guarded operator script `scripts/release/bootstrap-owner.mjs` and pure validation unit tests. Default read-only mode; mutation requires explicit apply and expected exact UID. Reject emulator environment, wrong project, duplicate/missing account, disabled/unverified account, absent Google link, unenrolled TOTP, locked profile, existing unrelated staff rights and any existing different OWNER. Never create an Auth user or mark an email verified administratively.
2. Read full Identity Platform config in memory and patch only MFA to OPTIONAL with TOTP enabled using official API contract. Preserve providers, domains and all unrelated settings; verify metadata afterward. OPTIONAL permits customers to enroll without globally requiring MFA; existing server checks continue requiring recent MFA for privileged commands. No SMS/provider expansion or security weakening.
3. Provide the designated human an approved real Google login and TOTP enrollment path. Current hosted beta is not assumed capable. If a separate minimal enrollment surface is needed, prepare its impact and obtain delta approval before creation/deployment. Existing full application deployment gates remain in force.
4. After authoritative account lookup and human enrollment, create exactly one staffAccess document plus one auditEvents document in an atomic Firestore transaction with no overwrite: roles[OWNER], active true, locked false, orderIds[], version1, timestamps and operator/bootstrap provenance. Derive UID from server account metadata and compare the expected UID; retain sensitive identity only in ignored operator evidence. Revalidate user state immediately before commit; fail on concurrent conflicting document creation.
5. Read back only target role metadata and audit receipt; require fresh Google+MFA session for a real protected action after approved application deployment. Do not claim that an admin write itself proves live authorization acceptance.

No IAM change, custom claims, secrets, commercial defaults, customer fixtures, provider activation, money operations, customer sends or production financial correction. No demo script bypass. One target role creation is the only proposed production data write beyond its audit record.

## Validation and rollback

Pure validation tests cover wrong identity/project, unverified/disabled/non-Google user, absent MFA, lock, existing owner, idempotency/conflict. Isolated emulator transaction tests prove atomic creation and refusal to overwrite. Run under Node22; preserve shared services and WIP. Confirm provider MFA metadata and exact target account before execution. Record current source/artifact hashes and fresh final review before any mutation.

Rollback is separately reviewed disabling of the exact newly created role, retaining audit/history; never delete Auth users, commercial/financial documents or remove another OWNER. Record prior MFA config; do not disable MFA after enrollment without reviewing account lockout implications.

Approved scope: implementing the guarded script/tests, enabling voluntary TOTP, and one audited first-OWNER bootstrap only after the above identity/enrollment preconditions pass. REST representation of voluntary MFA is `mfa.state=ENABLED`; OPTIONAL describes behavior and is not a valid provider enum. Full release continues separately and remains blocked until its required gates pass.
