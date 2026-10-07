# CICD-108 quality evidence

Source baseline: `caeec532a77176f7412551ab6621fe9df1d5da48`; scoped uncommitted workflow/helpers/tests/documents reviewed. Intelligence DEGRADED: indexes stale after concurrent release commit; bounded CI, package, Firebase CLI and source inspection used. The previous index refresh succeeded before that concurrent commit; complete indexed impact coverage is not claimed.

Selected profiles: universal, infrastructure, TypeScript/JavaScript. Node 22 is configured in Actions/Functions; local validation used Node 25.9.0, Python 3.14.4. Node 22 runner execution is NOT_RUN.

| Gate | Result | Evidence / limits |
| --- | --- | --- |
| Compilation | PASSED | `npm run typecheck` (root TypeScript + Functions build); `npm run build` (TypeScript/Vite/public asset generation) |
| Unit tests | PASSED | Clean-CI public configuration overrides: 108 test files, 914 tests passed after sandbox escalation for an ephemeral telemetry listener. No application changes were made to get this result. |
| Release helper tests | PASSED | `node --test tests/unit/release108.test.mjs`: 24 cases; SemVer, production auth identity, notes completeness, manifest tampering, archive/source ZIP rejection, dependency parity, recovery, tag conflicts, publication/receipt checks |
| Public configuration tests | PASSED | `npm run test:release-config`: 13/13 |
| Static analysis | PASSED | Root `npm run lint`; focused ESLint on all new JS/helpers/tests; `actionlint` on both workflows; `git diff --check` |
| Architecture / dependency impact | PASSED | Validation/build/deploy split; no app/domain/schema edits; standalone Functions lock derived offline from tested root graph; version/integrity drift rejected |
| Artifact smoke | PASSED | Real local compiled output: create → archive → safely unpack → verify; 271 hashed files, inventory 69 Functions. No deployment performed. |
| Production configuration guard | PASSED locally | Existing public-config guard passed; existing preflight local checks passed and inventoried 69 source Functions. These are not provider acceptance. |
| Dependency audit | PASSED existing high threshold | Root: 15 existing low/moderate findings; derived Functions deployment lock: 13 moderate findings. Neither scan reported high/critical; this is not a zero-vulnerability claim. No dependency upgrade in scope. |
| Security review | PASSED code scope | Exact production target; pinned Actions; no cloud credential in test job; OIDC only at deploy; no dotenv packaging; no `--force`; immutable asset/tag conflicts fail; source archives never extracted or printed |
| Integration (rules/HTTP/restore) | NOT_RUN locally | Shared runtime preserved; local isolated/duplicate emulator servers not authorized. All three remain mandatory, blocking CI gates before release build. |
| GitHub runner / provider deployment | NOT_RUN | No GitHub production environment/variables or GCP WIF pool; no commit/push/remote activation in this task |
| Rollback execution | NOT_RUN | Operator procedure prepared; real rollback is a production mutation and requires named authorization |
| Database / API migration | NOT_APPLICABLE | No schema/data/public API changes; rules/indexes excluded from automatic deploy |
| UI / localization / SEO / motion / product language | NOT_APPLICABLE | App UI and product data presentation unchanged. Generated release notes are technical delivery documentation and workflow summary is operator output; copy/verification semantics reviewed in requirement/error-handling dimensions. |
| Final review | BLOCKED for production | Two cycles; in-scope code findings fixed and reverified. Missing integration/runner/provider evidence prevents a successful production handoff. See cycle JSON and completion report. |

The initial plain `npm test` loaded ignored local production Firebase configuration and failed seven import suites (`document is not defined`). A clean-CI configuration run then exposed sandbox `listen EPERM`; its approved escalated rerun passed 914/914. Neither failure was hidden or treated as an application fix.

Build warnings about existing large frontend chunks/ineffective dynamic imports remain outside scope. The local build regenerated `functions/generated/public-assets.json` (two asset-name changes); recovery of that validation output was rejected by command approval review and remains pending explicit recovery authorization. Existing unrelated output/browser directories remain untouched.
