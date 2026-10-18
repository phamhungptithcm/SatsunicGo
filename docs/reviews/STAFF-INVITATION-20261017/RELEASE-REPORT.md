# Staff feature release candidate

Authorized by user: “làm xong release lên production”. Scoped branch hunpeolabs/staff-invitation-release, base fff83392e79a7dc8628cc76a06e1febe443e6082 (verified production v0.16.1, run39081674898 succeeded). Original dirty checkout was not committed or deployed. Current code/test hashes: RELEASE-SOURCE-MANIFEST.json (17 paths). LOCAL-* files and SOURCE-MANIFEST.json are historical implementation evidence, not current release approval.

## Implemented behavior

Owner queues invitation to exact Google account email; recipient explicitly accepts with matching verified Google identity; owner then grants roles/scopes. Acceptance grants no access. Existing employee grants remain editable. Paginated directory includes Google name/avatar, email, joined/departed dates, role and status. Separate departure disables work access; temporary lock does not invent departure. Unknown historic dates remain unknown. Compact owner form and collapsible invitation history.

## Exact candidate validation

- Node22 npm ci from lockfile: PASSED, no dependency changes.
- npm run typecheck: PASSED frontend and Functions.
- npm run lint: PASSED. Changed final label/config files checked again.
- Full unit suite: 193 files,3104 tests PASSED. First run found missing required marker plus3 timeouts. Fixed marker; full run with1worker passed without changed timeouts. Final inline label wrapper: required-label and staff-domain10tests PASSED.
- Release/deep-review/public-config contracts:189 PASSED.
- Integration/rules:21 PASSED on existing demo18207/19207. CI rules spec now also accepts exact isolated baseline8181/9199 only with GITHUB_ACTIONS=true, baseline group, FUNCTIONS_EMULATOR=true and demo project. No pipeline changes or skipped tests.
- Browser:7 PASSED, final responsive/keyboard/recovery case rerun1PASSED after inline label change. Current-source route proxy on existing5207 and direct real Firestore transactions; Google/MFA/callable transport/email simulated. No new server or shared runtime restart. Shared profiles preserved by hashes and fixture allowlists.
- Production dependency audit:0 vulnerabilities.
- Migration:NOT_APPLICABLE (additive collections/optional fields, no historical backfill). Public SEO/motion:NOT_APPLICABLE (private operational UI/no motion added).
- API/security/observability: independent source review PASSED (RELEASE-FINAL-REVIEW.json); verified Google/exactemail, owner/recentMFA, AppCheck, version/idempotency, bounded queries/quota, audit, delivery-unknown reconciliation retained.

## Review and operational boundaries

Historical independent cycles1→3 and fixes are in LOCAL-REPORT/REVIEW-CYCLES. Release self-review found/fixed CI emulator compatibility and missing required marker. Initial legacy reviewer returned NOT_RUN because its role requires both indexes READY. CodeGraph initialized and query passed; CocoIndex timed out. Repository permits bounded DEGRADED review; fresh independent candidate review PASSED with bounded fallback, no fabricated READY evidence. Semantic-index completeness unproven. Runtime-ledger CLI unavailable; manual evidence only.

Production email settings/email authenticated read returned404. STAFF_INVITATION_EMAIL_ENABLED remains unset/off; no secret read, provider setting mutation or real email test. Code rollout and mail activation are distinct: actual invitation delivery NOT_READY. Provider verification, trusted sender policy and explicit activation remain necessary. Existing avatar CSP permits lh3.googleusercontent.com; other allowed Google URLs can use initials fallback. Live Google/MFA/AppCheck and inbox acceptance NOT_VERIFIED by local proxy.

## Rollout and rollback

Use existing main push workflow: quality→immutable build→deploy→Hosting/Functions provider readback→publish. Recheck main unchanged before normal fast-forward push. No direct duplicate deploy. Previous rollback artifact: v0.16.1. Rollback only through existing immutable-artifact runbook; retain production records/audit and do not roll back unrelated changes. Firebase workflow deploys Functions+Hosting; explicit new collection denies are equivalent to existing default deny, so no rules migration is required. No destructive data changes.

Current release status: final review PASSED; release:build and preflight PASSED, awaiting push/CI/provider readback. Full provider/inbox readiness remains NOT_READY. Token usage, API-equivalent cost, billed cost:Unavailable. Memory candidates:None.

Final candidate build with exact workflow public variables PASSED; preflight errors=[] and all7 new exports resolved. Subsequent incremental index refresh completed and both health queries passed; final metadata remains stale after review-document writes, so DEGRADED disclosure retained. Direct production Rules source read returned403; no rule mutations made. No application-source edits after manifest seal.

## Current-main reconciliation

Before push, main advanced to095250f2 (catalog card width and Ask relative quantities). Pre-push guard stopped the old candidate. Clean rebase preserves all12 incoming paths byte-for-byte with zero overlap/conflicts; all17 feature source/config hashes unchanged. Fresh independent cycle6 PASSED. Post-rebase frontend/Functions typecheck and139tests across7affected suites PASSED. Original manifest base records its initial verification baseline; integrated base is095250f2bd5426a528f760a34bbef3364574982a. No staff commit was pushed before this reconciliation. Existing production workflow serializes rollout and rejects superseded source.
