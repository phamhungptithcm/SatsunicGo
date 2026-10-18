# Staff invitations, directory and departure — local implementation report

Scope: approved STAFF-INVITATION-20261017-v1 plus user-approved directory, separate departure and compact UI refinements and Google name/avatar. Source HEAD `99822aae502cc75406184ee345e4527c6e0db66d`; extensive pre-existing dirty worktree preserved. Task changes are sealed in SOURCE-MANIFEST.json. Protected preimages in BASELINE.json; existing-file diffs checked against saved preimages, not an unrelated clean HEAD.

## Acceptance and progress

| Criterion | Weight | Local result |
| --- | ---: | --- |
| Email invitation → explicit matching Google account acceptance → owner assignment | 30 | PASSED: unit/integration/browser; acceptance alone creates no access |
| Privilege, identity, replay, concurrency and delivery safety | 25 | PASSED within tested source/emulator boundary |
| Whole employee directory: Google name/avatar, email, joined date, departure date, role | 15 | PASSED: paginated legacy grants plus accepted unassigned staff; missing dates remain unknown |
| Separate departure stops access; temporary lock remains distinct | 10 | PASSED: backend transactions and browser readback |
| Compact responsive UI, content and recovery | 10 | PASSED: 320/390/1440, zoom200%, keyboard/ARIA tree, uncertain-save/retry |
| Current final independent review and evidence | 10 | PASSED: independent cycle3,15 current manifest hashes verified |

All approved local acceptance criteria are complete (100/100 weighted points). Independent final cycle3 PASSED on the current manifest; weights are explicit manual accounting, not a runtime-ledger claim. No real email, push, deploy, secret access, dependency change or shared-runtime restart occurred.

## Validation evidence

- `npx tsc --noEmit && npx tsc --noEmit -p functions/tsconfig.json`: PASSED, frontend and backend compilation.
- Scoped ESLint over changed feature/domain/handler and four test modules: PASSED.
- `VITE_FIREBASE_API_KEY='' npx vitest run tests/unit/staff-invitations.test.ts tests/unit/staff-access-contextual.test.ts tests/unit/auth-guards.test.ts tests/unit/verified-google.test.ts`: 26/26 PASSED. Empty API key prevents local unit execution from initializing browser AppCheck; no runtime authorization weakened.
- `FIRESTORE_EMULATOR_HOST=127.0.0.1:18207 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:19207 GCLOUD_PROJECT=demo-satsunicgo FUNCTIONS_EMULATOR=true npx vitest run --config .ai/local/staff-invitation/vitest.config.ts`: 19 integration + 2 rules = 21/21 PASSED. Direct real Firestore handler transactions, synthetic callable claims/MFA, stub email adapter. Rules tests exercise shared emulator's deny behavior (existing default deny), not a reload of this checkout's explicit new deny rules.
- Same demo environment, `npx playwright test --config .ai/local/staff-invitation/playwright.config.ts`: 7/7 PASSED on final workflow/UI; see browser-results.json. Current source mounted through request routing on existing5207, actual CRM scoped CSS, no extra server. Full workflow, wrong account/expiry/revoke/invalid links, ambiguous create/save retry, all requested table columns, lock/departure, keyboard/ARIA tree, narrow/zoom, safe cleanup. Shared profile hashes verified unchanged after tests.
- Provider dispatch/inbox/live Google/real MFA/AppCheck/callable HTTP deployment: NOT_RUN by approved local boundary. Full repository test suite and release bundle: NOT_RUN; unrelated dirty worktree is not certified.

## Review cycles and fixes

1. Independent reviewer requested changes: expired superseded invitation could be resent; worker authorized original inviter rather than current resend owner; switching selected employee could discard an uncertain role-save operation. Fixed with email-lock fence, per-job requestedBy and parent pending guard. Added backend/browser regressions.
2. Integration/UI self-review: discovered fixture cleanup tracked every document read, which could delete shared profiles. Stopped tests, disclosed incident, replaced cleanup with fixture identity/path allowlist and preservation hashes. User approved reconstructing exactly two missing synthetic demo profiles from verified Auth; create-only transaction and readback passed. Original preimages were unavailable; do not claim byte-for-byte restoration. See DEMO-RECOVERY.json. StaffAccess records remained unchanged by reconstruction. Cleanup rejection regression added.
3. Browser review: fixed table min-width/page overflow; clarified TTL starts at enqueue (maximum seven days), removed false invitation claim for legacy staff; disabled row actions during refresh to avoid departure using stale version immediately after role save; departure errors now name the employee operation. Test timezone explicitly Asia/Ho_Chi_Minh. Full suite passed after fixes.
4. User UI refinement: compact one-row email form, table above collapsed invitation history, smaller textual status/actions, remove repetitive guide card. Correct workspace CSS cascade and rerun browser cases with current screenshots.
5. Independent cycle2 PASSED all dimensions on the then-current 15-file manifest; see REVIEW-CYCLES.json.
6. User then requested Google name/avatar: directory now prefers google.com identity from Auth, displays validated Google photo beside name, and falls back to initials. Added URL-host unit tests, synthetic Auth identity precedence integration and browser image/failure case. Independent final cycle3 PASSED on the updated manifest with no remaining actionable findings.

## Quality gates

| Gate | Status | Evidence / rationale |
| --- | --- | --- |
| Compilation / unit / integration / static analysis | PASSED | Commands and counts above |
| Architecture, API compatibility | PASSED | Additive callables/private collections; intentionally gated initial grant; legacy existing grants editable; original auth/MFA/version/self-protection retained; baseline diff reviewed |
| Language/version + platform/domain profiles | PASSED | TypeScript6/React19/Firebase; universal, typescript-javascript, frontend-html-css, web-app, api, database, concurrency |
| Visual/product content | PASSED | PRODUCT-CONTENT-REVIEW.md, CONTENT-INVENTORY.json, current screenshots and browser tests |
| Security | PASSED within scope | Verified Google/exact-email; owner recent MFA before mutations/replays; AppCheck production wrappers; private rules; quota; immutable operation hashes; no real credentials/output |
| Database migration | NOT_APPLICABLE | Additive collections/optional dates; no backfill of historical employment dates |
| Observability | PASSED review | Audit events for create/resend/revoke/accept/depart, durable mail job outcomes/attempts/claim/provider identity, safe incomplete-worker warning; production alerts NOT_VERIFIED |
| SEO/GEO/crawler/structured data | NOT_APPLICABLE | Private operational flow, no public discovery content change |
| Animation/reduced motion | NOT_APPLICABLE | No animation introduced |
| Diff self-review | PASSED | Scoped baseline diff and source/test inspection |
| Final implementation review | PASSED | FINAL-REVIEW.json / REVIEW-CYCLES.json, current15-file manifest verified |

## Operational boundary and remaining work

Production readiness: NOT_READY. This implementation is in the current workspace. Shared5207 serves `/Users/hunpeo97/.codex/worktrees/ask-semantic-checkout/SatsunicGo`; it was not overwritten or restarted. Browser evidence uses current-source routed modules/handlers and does not establish that opening the ordinary shared staff screen now serves these changes. Publishing to that runtime requires coordinated source integration/runtime reload. No alternate frontend was started.

Mail dispatch defaults off unless STAFF_INVITATION_EMAIL_ENABLED=true plus existing production/provider/release gates. Existing sender and Resend adapter are reused. Provider acceptance means request accepted, not inbox delivery. Unknown outcomes require reconciliation, never blind resend. Real mail configuration/delivery remains a separately authorized task. Deploy backend/rules before UI; rollback by disabling entry/dispatch while retaining records/audit and accepted-invitation guard. No new dependencies or destructive migration.

Accepted local trade-offs: directory and invitations use bounded pagination; legacy dates may be absent; Google provider identity is synchronized by Firebase Auth on sign-in; this does not poll the Google profile live. Avatar URLs are restricted to HTTPS Google hosts, with no-referrer/lazy rendering; missing/broken photos use initials. Auth identity lookup may fail and then list surfaces an error rather than fabricated data. Dates display in the viewer's browser timezone. Departure is recorded now; backdating and rehire are outside scope. Existing employee records retain history; active=true cannot silently undo departure.

Governance: ai-agent-kit runtime CLI unavailable, so manual evidence files replace runtime check/review/report receipts; no fabricated ledger execution. Repository intelligence refreshed for final review; any stale index is treated as DEGRADED with bounded source checks. Token usage: Unavailable. API-equivalent cost: Unavailable. Actual billed cost: Unavailable. Memory candidates: None.

Final closure: 26 unit +19 integration +2 rules +7 browser =54 passing local tests; frontend/backend typecheck and scoped ESLint passed. Independent review cycles1 CHANGES_REQUESTED →2 PASSED →3 PASSED after Google identity delta. Current source manifest SHA-256: `638284e570731a60a8bef99b4ebd20c2bc4187a51750796f2fb6a70d8eeaa529`. Existing CSP permits primary lh3.googleusercontent.com photos; alternate Google hosts may use initials fallback without widening hosting policy. Production remains NOT_READY; no email, push or deploy.
