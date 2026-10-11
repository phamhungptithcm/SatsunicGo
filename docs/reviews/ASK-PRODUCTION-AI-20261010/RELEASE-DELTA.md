# Concrete release delta — PR #4

Status: APPROVED subject to green required CI. Human reply: “Approve native release after green CI”. Candidate `f262d3b0c11b45b9f8994e7b27b67294fdcc905f`, draft PR https://github.com/phamhungptithcm/SatsunicGo/pull/4. Source baseline is production v0.10.0 (`c4230014959389c3c23b44cdb11c5fe846f815fe`). Local full unit: 2,419 pass; typecheck/full lint/production build pass. Native CI https://github.com/phamhungptithcm/SatsunicGo/actions/runs/38053761162 is running.

The original plan said to deploy only affected callables through the existing release mechanism. Source verification shows the native release pipeline creates and deploys a complete immutable Functions + Hosting artifact. `scripts/release/reviewed-retries.mjs` deploys all manifest function names plus Hosting. It does not support an affected-callable-only artifact. No release workflow or deployment tooling change is proposed.

Proposed approved delta: after every required CI gate passes and fresh review, mark PR ready and merge its exact tested head; allow the existing main-triggered immutable production release to redeploy the complete artifact. Unchanged functions use the current production baseline source; only approved Ask behavior and the test-only clock fix differ. Redeploying unchanged functions may introduce cold starts and takes longer than three callable updates. Preserve native deletion/retry/IAM/asset/hash checks and reject superseded source. No manual deployment bypass.

Then read the release receipt, deployed Functions revisions/source hashes and Hosting manifest. In the actual signed-in OWNER session, complete fresh MFA in the site, enable the customer canary with at most 24 hours and a lifetime 50,000 VND cap, run one clean text Ask request, verify response/provider usage/reservation, and only then promote verified customers and perform an independent non-OWNER authenticated smoke. Never extract browser credentials, grant roles, create production fixtures or reset reservations. No paid image/anonymous/research path.

Rollback: authenticated OWNER disable closes admission and retains lifetime ledger. If code rollback is necessary, restore the previous verified immutable release through the existing governed release procedure. No database deletion/datafix or ledger reset.

Required human scope decision: approve PR #4 merge and the complete native immutable production release, including redeployment of unchanged functions. Existing 50,000 VND ceiling remains unchanged. Fresh MFA/customer session entry may need human interaction after deployment.
