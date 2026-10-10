# Email integration and domain verification

Current receipt: 2026-10-09. Baseline `0d6e721698608eebb36b0b2f68021c3054d97d1c`; shared dirty checkout. **Production NOT_READY; no push or deployment.**

The approved v1, v1.1 and v1.2 changes now connect both existing email workers to the shared Resend transport. They retain current consent and ownership checks, immutable request identity, claim fencing, bounded retries and unknown-outcome reconciliation. Only events after cutover can enqueue. The shared limit is at most 100 attempts/day and one actual provider start/second under trusted synchronized clocks. No secret payload was accessed.

## Current acceptance

| Criterion | Weight | Status | Evidence |
| --- | ---: | --- | --- |
| Concrete delta approvals | 10 | PASSED | EMAIL-RELEASE-APPROVAL-v1.md; direct human v1/v1.1/v1.2 replies |
| Approved transport, consent, identity and failure handling | 20 | PASSED in reviewed source scope | Independent current cycle3; all six findings fixed and verified |
| Scoped regression and fresh independent review | 20 | PASSED in reviewed source scope | 181 independent tests; current source hashes unchanged |
| Product language and local rendered states | 5 | PARTIAL | Fresh actual checkout/Profile and three-width footer evidence independently reviewed; historical25-case proxy remains historical; broader save/token outcomes and AT not certified |
| Safe sending DNS and authenticated domain status | 10 | PASSED | Resend verified hunpeolabs.com; three additions, 28 existing records unchanged |
| Complete stable candidate, global quality, artifact and audit | 15 | PARTIAL / BLOCKED | Pre-footer full suite2311/2311; fresh clean install/build/package/audit verifies footer delta; catalog owner active, committed CI artifact pending |
| Authenticated checkout UI acceptance | 5 | PARTIAL / BLOCKED | Desktop and owner mobile390/320 checks passed; customer CRM denial and staff MFA fence passed; candidate CRM recipient rendering unverified |
| Normal CI release, production configuration and live acceptance | 15 | NOT_RUN | No commit/push/deploy or live email in this integration turn |

Weighted prerequisite progress:60/100. This measures only the listed acceptance criteria; it is not a production-readiness percentage. Remaining required criteria block release.

## Verification and fix cycles

Current independent email review: **PASSED_WITHIN_REVIEWED_SOURCE_SCOPE**. Whole release review: **BLOCKED**. The immutable review and SHA-bound receipts are archived in `EMAIL-EVIDENCE/`; the current `EMAIL-VERIFICATION-LEDGER.json` records source hashes, checks, history, domain receipt and limitations.

The review reproduced and closed six findings: per-job dependency failure isolation; expiry after waiting; attempted429 history lost on deferral; reservation cadence differing from actual provider starts; live daily cap changes; and replay of pinned token/body work that cannot be reconstructed. Additional fix cycles cover invoice read outage, seven mutable job fields,24h boundaries, UTC rollover, clock rollback, lease takeover/release faults and recovery races. Every previously open email finding is fixed within the executed checks. Unknown outcomes remain terminal for reconciliation; provider acceptance is never called inbox delivery.

Current scoped checks passed: 163 customer/security/gate tests;227 adapter/auth/outbox/subscription tests;53 dispatch tests; six actual Firestore transaction tests;99 artifact tests;199 preflight tests. These suites overlap and must not be summed into independent business journeys. Frozen compiled SDK discovery found 98/98 expected endpoints, including both 30-minute email schedules in asia-southeast1; seven unrelated holds and five demo exports remain absent. Discovery observed zero network attempts. Scoped strict compile, lint and diff checks passed.

The first broad root Node22 Vitest run passed2309/2311 with two failures in `required-labels092.test.ts`: the reusable autocomplete's required input and visible labels lived in separate components. The checkout owner moved the existing visible label and decorative marker into the autocomplete, preserved native required behavior and layout, and strengthened the SSR association contract. The global required-label audit was not changed, removed or skipped. The subsequent full Node22 run passed2311/2311 with zero pending tests; all869 snapshotted source/test/config files remained unchanged during that run. The earlier failing run and its source drift remain recorded as historical fix-cycle evidence. Checkout-dependent email product screenshots/25-case proxy acceptance predate this latest source; they are explicitly stale until refreshed.

The previous1879-test full-suite result and the older integration report are historical. They do not certify this candidate. The prior payment integration receipt39/39 precedes newer checkout edits and emitted four MaxListenersExceededWarning messages; no blanket cleanup or current full-payment claim is made.

## Isolated production build

The earlier853-file production build used linked dependencies and predates the footer CSS fix. A subsequent isolated clean validation included that fix: root `npm ci` installed1531 packages, and standalone packaged Functions `npm ci --omit=dev` installed668. Locks remained byte-identical; no external/broken dependency links remained. The normal Node22 release build passed in29.3s with exact public production configuration,105 preflight exports and zero errors. Packaging verified350 immutable files and byte equality of all152 runtime application files. SDK discovery ran outside the root dependency ancestry with its own fresh dependencies, no NODE_PATH or external module-cache entries:98/98 endpoints, both email schedules, seven unrelated holds/five demos absent, zero network attempts. The854-file source snapshot and public configuration did not drift during that check. Evidence and independent scoped review are archived as `satsunicgo-clean-release-{evidence,review}.json`. Synthetic v0.0.0/zero-SHA metadata still makes this local validation, not a committed CI release artifact. Later catalog work is outside this frozen snapshot.

Anonymous audit of that exact packaged production Functions graph passed the existing high threshold: zero High/Critical. It still reports13 affected package entries for one unique Moderate advisory, GHSA-8988-4f7v-96qf, in nested OpenTelemetry Core1.25.1/1.30.1. The direct nested Core finding reports fixAvailable=false, while some propagated package entries report true. No remediation has been validated or approved for the pinned graph. No dependency scope was expanded. This residual is recorded, not described as a clean vulnerability audit.

## Actual demo acceptance and production metadata

Fresh human authorization enabled real Chrome checks on the shared demo project only. Product→cart→recipient→review worked. Empty submit focused the required recipient and displayed field errors. Unaccented province/commune search, province-code search, Arrow/Enter selection, Escape, clearing the commune after changing province, retained address on edit, and resetting review acknowledgement passed. Current33-file checkout manifest matched with no source drift. No warning/error was captured in that checkout tab. Screenshots and per-check evidence are archived in `EMAIL-EVIDENCE/satsunicgo-actual-demo-ui-20261009.json`.

An authenticated customer was denied CRM access. The separately owned WAREHOUSE fixture reached the mandatory MFA gate and exposed no order/recipient content. TOTP enrollment cannot complete in the installed Firebase Auth Emulator; no role grant, MFA flag, skip or live-auth switch was used. Recipient wrapping inside authenticated candidate CRM remains unverified, despite passing actualHTTP authorization/projection checks. The checkout owner verified cleanup of owned temporary fixture records and identities; shared counters were not rewound. After the human unlock reply, actual390/320px responsive checks completed in IAB, with measured DOM widths. Checkout owner reports unaccented/code lookup, parent reset, pointer/keyboard selection, free-text rejection, popup-only scrolling and long-address review without overflow; its refreshed source-bound mobile handoff is pending the new catalog scope. The original failed viewport override remains historical and is not used as mobile evidence.

Firebase's own [Auth SDK integration-test documentation](https://github.com/firebase/firebase-js-sdk/blob/main/packages/auth/README.md#integration-testing-with-the-production-backend) confirms TOTP is not supported by the emulator. No security control was weakened to obtain a screenshot.

The actual Profile notification tab also rendered both email topics and SMS as “Chưa sẵn sàng”. Keyboard Space toggled the optional email choice and enabled save while retaining the unavailable status; restoring the initial unchecked choice disabled save again. No preference was saved, no provider send occurred and console warnings/errors remained empty. These three bounded profile checks and cart/sign-out cleanup are recorded separately in `EMAIL-EVIDENCE/satsunicgo-demo-notifications-cleanup-20261009.json`; saving, confirmation and revocation outcomes are not certified by this browser phase.

The actual profile screenshot exposed inherited global footer padding that crushed the privacy links. Within existing r5 approval, `.profilePrivacy` now sets `padding:18px 0 0`. No strings or business behavior changed. Actual1280×720,390×844 and320×740 checks found document width equal to viewport width, both links18px high and within the content bounds; Tab reaches the next privacy link. Fresh screenshot/geometry evidence and the14-hash independent product supplement are archived. IAB viewport reset and Chrome device-toolbar/DevTools cleanup were verified. A later VoiceOver state-read attempt was blocked by Mac relock before any toggle; actual AT remains NOT_RUN. DevTools showed a favicon404 during responsive setup, so the earlier empty checkout console result is not promoted to a blanket console-clean claim.

The human authorized using production for the MFA check. The existing production session shows two-step verification enabled and can open the CRM dashboard; no new TOTP challenge/enrollment was performed, no order was opened, no customer PII was stored and no production write occurred. This certifies only that observed deployed session, not the new local recipient UI. A public release-version read was blocked by the browser client and no alternate access was attempted. Shared demo notification endpoint/service compiled bytes also differ from the clean candidate; broad browser save/token outcomes cannot certify the current candidate from that runtime.

Read-only production metadata confirms `SFTP_PASSWORD:1` is ENABLED and the secret resource grants secretAccessor to the default compute service account. Both `deliverEmail` and `deliverSubscriptionEmail` currently return404 in asia-southeast1. These facts do not establish a future deployed runtime identity/version binding or sending activation. No secret payload was accessed; no settings or IAM were changed. Metadata is archived in `EMAIL-EVIDENCE/satsunicgo-email-provider-preflight-metadata-20261009.json`.

## Domain and website

Authenticated Resend now reports **verified** for `hunpeolabs.com`, domain ID `14fa13e9-9c65-42b9-b5f9-501c78cb7b8f`. GoDaddy readback shows exactly three new sending records: TXT `resend._domainkey`, CNAME `rsend` and CNAME `send`. Values match the authenticated provider page. All28 pre-existing records, including root/www A records, nameservers, Outlook root MX, SPF, DKIM and DMARC, remain unchanged. Receiving is disabled on Resend; no inbound MX was added.

Post-change public readback: root website loads; `www.hunpeolabs.com` returns301 to `https://hunpeolabs.com/` and then200. Domain sending readiness is distinct from application sending activation. Customer sending has not been activated by this integration turn.

![Verified sending domain](EMAIL-EVIDENCE/satsunicgo-resend-domain-verified.jpg)

## Remaining work and rollback

The checkout owner has new human-requested catalog action-row/quantity work in progress. Await its final handoff, incorporate its current mobile evidence and freeze final canonical hashes. Revalidate affected checks after that scope lands; the pre-footer full-suite and pre-catalog clean-build receipts remain explicitly bounded. Complete candidate-bound notification/CRM acceptance through a legitimate coordinated runtime, then run the normal release workflow on the final committed candidate. Verify its immutable artifact, deployed source/revisions and approved secret version/IAM/scheduler/runtime settings; activate the approved forward cutover and verify an authorized canary/provider outcome. Preserve unrelated holds and do not drain historical jobs. No additional human approval is pending for the already approved email/footer scope.

Rollback first disables both sending flags, then restores the reviewed immutable application artifact. Preserve quota history and accepted/unknown job states. Do not alter financial records or automatically remove pre-existing DNS. The three dedicated DNS additions can remain without changing website routing.

Repository intelligence was genuinely READY before protected implementation; concurrent edits later made indexes degraded. Canonical hashes and bounded executable evidence are recorded explicitly. The ai-agent-kit runtime executable is unavailable, so these files are an explicit local reporting fallback, not native runtime ledger receipts.

Provider token usage: Unavailable. API-equivalent estimated cost: Unavailable. Actual billed cost: Unavailable. No real email, Gemini call, secret payload read or deployment occurred in this integration turn. Memory candidates: None.
