# Ask customer AI — production rollout evidence

Human authorization: plan v1, 50,000 VND total cap, test-only fixture clock delta, public push/draft PR, then “Approve native release after green CI”. Native full-artifact delta documented in RELEASE-DELTA.md and PR #4 body.

- Required PR CI: run 38053761162 SUCCESS on f262d3b0c11b45b9f8994e7b27b67294fdcc905f. Node 22 typecheck/lint/unit, release-helper/config, isolated emulator rules/HTTP/restore, production dependency audit and build passed. Optional advisory AI review skipped by existing default-off configuration.
- PR: https://github.com/phamhungptithcm/SatsunicGo/pull/4 — MERGED at 2026-10-10T13:05:03Z.
- Merge SHA: b5c0a1c285c07faeacf1d3b8ba544f76d885ceb6.
- Tested candidate and merged source tree hash: 9f84f099e58cf963b7cbf3ba412621f4eeca9598; exact equality verified after fetch.
- Native production release: https://github.com/phamhungptithcm/SatsunicGo/actions/runs/38054366988 — IN_PROGRESS; repeats required quality, builds immutable artifact, deploys, verifies provider source/Hosting and publishes only after receipt.
- Previous verified rollback release: v0.10.0 at c4230014959389c3c23b44cdb11c5fe846f815fe; receipt status VERIFIED, bundle SHA256 107861dbf9dfb633099f6aa1f8e062b56c0f71d67f14d5ac7bc34f606f954416.
- No manual deploy, IAM change, production datafix, fixture, ledger reset or paid generation request performed by this task.
- Production canary/promotion/customer acceptance NOT_RUN until verified deployment.

Live controls must use the actual hosted OWNER session, App Check and recent MFA. Any challenge is completed by the human in the site; no credentials or OTPs in chat. Reserve at most 1,000 VND for the single text canary under the fixed 50,000 VND lifetime cap. Validate actual answer, current reservation and canary proof before promotion; retain unknown reservations and do not blind-retry. Independent authenticated non-OWNER customer smoke remains a required acceptance criterion.

Current overall readiness NOT_READY pending immutable deployment receipt and hosted acceptance. Token usage/actual billed cost Unavailable. Memory candidates: None.

Frozen native artifact: v0.11.0, artifact ID 11670394648, 98 Functions. SHA256 `6fe542074f17b830afdc2387423aea11fe744ea6894ee931073cd8bdf1bfeab3`; independently recomputed from downloaded native archive and matched bundle.sha256. candidate.json SHA equals b5c0a1c285c07faeacf1d3b8ba544f76d885ceb6. Manifest contains ask/workspaceCommand/readOwnerConfiguration with expected sources. Merged-commit native quality passed; build passed; deploy IN_PROGRESS. Human confirmed they will open an existing non-OWNER verified customer session when prompted after the OWNER canary.

Pre-activation sanitized Firestore readback: customer policy absent, lifetime budget absent, attempts empty. Existing application-default credentials used through Firebase Admin for read-only metadata; no credentials, UIDs, prompts or conversation contents emitted. This baseline does not prove provider generation.

Direct Cloud Functions readback during deployment: ask ACTIVE revision ask-00013-win updated 13:19:39Z; workspaceCommand ACTIVE revision workspacecommand-00015-sug updated 13:19:34Z; readOwnerConfiguration ACTIVE revision readownerconfiguration-00015-vos updated 13:19:29Z. These are partial deployment observations; native full artifact verification is still required.

Native release SUCCESS. deployment-evidence artifact 11670976303: VERIFIED at 2026-10-10T13:25:11.455Z; exact frozen SHA and bundle hash matched. 194 Hosting files and 98 Functions verified. Hosting version sites/satsunicgo/versions/d2f5cdfc379eaab2, releaseTime 13:22:27.486Z. Public release-version.json independently matches v0.11.0 / merge SHA / run. OWNER customer card reads connection checked, cap50000/reserved0/off before activation; canary confirmation submitted via hosted control.

Hosted OWNER activation blocked by actual recent-MFA dialog. Google continuation did not open a popup in the automated tab; human handoff requested and tab preserved. No blind retry or alternate auth/API path. Canary/promotion/non-OWNER smoke still NOT_RUN; deployment VERIFIED independently.

Follow-up 2026-10-10: human reported OWNER authentication complete twice; actual hosted tab still displayed ActionMfa blocked-Google dialog and sanitized Firestore readback still had no customer policy/budget/attempts. Activation not verified, no generation or promotion performed. Separate RAG administration request now has proposed plan ASK-RAG-ADMIN-20261010 v1; no application changes or extension of production authority.
