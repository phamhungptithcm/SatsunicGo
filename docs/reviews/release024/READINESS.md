# CRM redesign and hardening 024

Local CRM improvements are implemented and verified within the executed scope. **Production remains NOT_READY; the aggregate final review is BLOCKED.**

The workspace now has grouped navigation, a compact header, consistent cards and form controls, clear filters and dashboard metrics, and an overview landing page for authorized owners/managers. Other roles keep their permitted fallback. The order's existing primary action appears before secondary panels. Empty customer results avoid irrelevant table headings, and the public website's reserved header space no longer appears inside CRM.

Confirmed defects fixed include stale-version creation, malformed staff access records, incorrect membership expiry display, a stray zero in unknown membership state, misleading “hủy 0” substitution copy, vertically stacked checkbox labels, and insufficient menu-caption contrast. Authority, operation identities, financial history, ownership, role boundaries and catalog/custom payment rules are preserved. Membership correction affects the read projection only, without changing subscriptions or entitlements.

Current verification:

- 178 unit tests and 100 integration tests passed without skips.
- The complete 45-case native browser regression passed, including catalog/custom lifecycle, CRM roles, deferred responses, private images, document retries, printing, and complete native proposal acceptance/application/rejection.
- A final one-property caption-color correction was followed by four affected browser cases, all passing. These recheck navigation at 390/768/1440 px and native 200% zoom. Each of the five group captions measured 4.99:1 contrast. The 45-case run precedes this last color change; combined broad and delta evidence is explicit.
- Final frontend typecheck, lint and build passed. Functions compilation passed on its unchanged frozen source. The current statement PDF has three pages, with print regression assertions passing.

Evidence is in `output/playwright/release024`: `unit-results.json`, `integration-results.json`, `browser-full-results.json`, `browser-post-contrast-results.json`, corresponding logs, screenshots and contrast measurements. Current source/build hashes are bound in `SOURCE_MANIFEST.json`. The failed cycles and corrected test expectations are retained in `CYCLE_JOURNAL.json`; no test assertion was weakened to claim money or provider success.

Remaining release gates: real Google login/MFA/App Check, provider/payment/email/model acceptance, backup/restore/rollback and exact deployment acceptance, actual assistive technology, comprehensive product-state and load/frame profiling, and disposition of prior moderate dependency findings. Dependency manifests are unchanged; the prior audit's 13 moderate entries with no high/critical entries are historical evidence, not a refreshed audit. Image screenshot capture at native 200% remains limited; genuine keyboard/AX/geometry proof is distinguished from image visual acceptance.

Repository intelligence is DEGRADED; source, compiler and executed tests provide bounded evidence. The checkout contains unrelated existing WIP. HEAD alone does not identify this candidate. No production datafix, financial correction, provider activation, customer mail, deployment or push occurred.
