# Ask panel compact revision — current evidence

Task `ASK-RELEASE-20261008`; local date2026-10-08 America/Chicago. **Design-only revision; application layout approval PENDING. Production NOT_READY.** Weighted acceptance progress, provider token usage, actual billed cost and API-equivalent cost estimate: **Unavailable**.

This report supersedes only the presentation slice of [TASK-REPORT-r5](TASK-REPORT-r5.md). The user requested four changes to the preview before application implementation: remove History/VI/EN controls, place compact blue form actions together, show an item with a photo like the cart, and reduce button size and routine explanatory prose. The [r3 preview](../../../previews/ASK-PANEL-CONTINUOUS-r3-20261009.html) implements that scope. All conversation, item details, editing and the composer remain inside the existing Ask panel footprint. This is a design review handoff, not application or production completion.

## Current acceptance

| Criterion | Status | Evidence and limits |
| --- | --- | --- |
| Remove the three toolbar controls | VERIFIED bounded prototype | Controls and handlers absent; only Close remains. EN preview uses documented `?lang=en` |
| Compact adjacent blue form actions | VERIFIED bounded prototype | Về chat/Cập nhật immediately after fields; no stretched footer. Native button semantics retained |
| Cart-style item with product image | VERIFIED bounded prototype | Photo, name, variant, quantity, unit price and total visible; black selection uses a truthful neutral missing-image fallback |
| Smaller balanced action buttons and natural copy | VERIFIED bounded prototype | Compact primary paint and adjacent Edit/Terms; routine coaching/no-payment prose removed. Consequential unknown/not-sent states retained |
| Desktop/mobile/short-height containment | VERIFIED bounded prototype | Nine fresh current captures;390×844mobile and320×480keyboard form actions/composer remain inside Ask; no horizontal overflow |
| Pointer/keyboard and edit continuity | VERIFIED bounded prototype | First pointer click sends once; malformed-5/1.5/1000 retain2/980000VND; native0 invalid, black3/1470000VND, draft/Escape, EN/text200 and unknown recovery verified |
| Protected application layout integration | PENDING human approval | User previously selected “Chỉnh thêm trước khi triển khai”; no application presentation edit authorized or made in this slice |
| Native AT, actual browser zoom, authenticated/private/provider acceptance | NOT_RUN/BLOCKED | AX/native-keyboard and text200 fixture observations are not native speech, browser zoom or business acceptance |
| Full production readiness | NOT_READY | Existing knowledge/retention/live/backend/artifact/billing gates remain in TASK-REPORT-r5 |

## Review and fix loop

Previous independent review cycles1–4 remain immutable in the prior report and FINAL-REVIEW-r4. Current cycle5 covers the new preview and its evidence:

1. Human design feedback superseded r2. Source-derived cart composition and exact prototype-only scope were recorded in [the r3 plan](PANEL-REDESIGN-r3-PLAN.md). Repository intelligence is **DEGRADED**: healthy installed indexes are stale; bounded source fallback was used. No formal READY claim.
2. Static, BA and Technical Lead source review found no actionable blocking wording/source issue in the precursor. Root live pointer execution then found `R3-COMPOSER-FOCUS-SHIFT`: a hidden notice collapsed during blur, moving Send25.047px before pointer-up and missing the first click.
3. Frontend appended one CSS rule reserving the invisible notice row; submit timing, script and locale content stayed unchanged. Root re-executed the actual pointer/Enter/edit/recovery cases and recaptured all nine screenshots against the final HTML. Send and composer positions now remain stable; the first click clears input and produces one clarification reply. Hidden notice is absent from AX. No pointer-down submission workaround.
4. Independent reviewer viewed all nine current captures and verified executor/source/inventory hashes. The reviewer found one documentation overstatement:44px target height applies to the new action buttons and mobile fields, not every desktop field or inherited Send. Root narrowed the platform/accessibility wording; no source change was required. The final independent receipt is recorded below after save/readback.

No additional actionable defect was found within those bounded executed checks. This does not establish that the system has no issues.

## Quality gates and source closure

| Gate | Status | Boundary |
| --- | --- | --- |
| Prototype syntax/static | PASSED | Node22 syntax;51unique IDs;55matching VI/EN keys; removed toolbar IDs absent |
| Product inventory/meaning/tone | PASSED bounded |46retained,3added,6updated and18removed keys versus r2; exact source correspondence independently verified |
| Responsive/keyboard/focus/native validation | PASSED bounded | Current source-bound pixels and actual root UI actions; no real-device/AT claim |
| Product Language/accessibility completion | BLOCKED | Flexibility/Craft/Delight and complete required states lack native/authenticated/human acceptance; formal UX QA NOT_RUN under its READY-only role restriction |
| Integration/performance/production acceptance | NOT_RUN this slice | Prototype has no transport; prior demo backend19/21 failure remains unresolved. No production performance claim |
| App/compiler/unit/build/browser regression | REUSED prior unchanged candidate evidence |1366unit,58release-contract and139mock browser cases passed previously; not rerun or promoted to current live/provider evidence for this CSS/doc-only slice |
| Database/public SEO/dependency/API/infrastructure delta | NOT_APPLICABLE this slice | No such change |
| Final implementation/application handoff | BLOCKED | Layout approval and required application/production gates remain missing; scoped proposal review does not clear them |

[Executor receipt](PANEL-r3-EXECUTOR-r1.json) SHA256 `d1afafa82a16bcc60bd619525b88ed62805943453c04d646d974c70fa51bee8b` binds current HTML `8071ceecc7e8e7a9456d38684cea318f6f1bc80ebf40f99670d087b5aab76548`, plan, image, inventory and nine fresh captures. Root final readback checked13preview references with zero drift and104selected candidate source hashes with zero drift. No precursor screenshot is counted as current. [Content review](PANEL-r3-PRODUCT-CONTENT-REVIEW.md) final SHA256 `8eb3f91ce9ba264086f545a57e57bd4b54d2ccf4dae897057cab0d7776257b87` includes the resolved44px claim-scope finding.

The unmodified public reference image and sample price/terms are design examples, not stock, licensing, current SKU, published policy or real order proof. No global cart session, order, payment or private data was created or sent.

## Remaining work and governance

After exact layout approval, the planned six-file application presentation delta still requires integration and affected verification. No app, candidate, dependency, backend, CI, runtime, production function, provider or held cleanup control changed in this slice. Shared HEAD remains `53d59bd88fa7da9d1243692336ecd09b6540ea31` with concurrent dirty WIP preserved; no stage, commit, push, restart, reseed, deployment or rollback.

Official source admission, feedback retention/backup deletion, current backend acceptance, native AT, authenticated live business flow, actual billing confirmation and an immutable configured production artifact remain outstanding as detailed in TASK-REPORT-r5. Gemini50000VND remains reserved; no new paid-provider call. Actual cost is Unavailable.

The runtime reporting CLI is unavailable and its previously attempted fail-open wrapper produced no ledger report. This manual report derives bounded counts from verified receipts; it supplies no invented weighted progress or usage estimate. Memory files were not updated. Memory candidates: **None**.

## Final review readback

Independent [FINAL-REVIEW-r5.json](FINAL-REVIEW-r5.json) saved and read back; SHA256 `e3410487b54aad99dd2139672c63d759d3b12ce850bffb5f0087c12ab0977e16`, cycle5. The reviewer independently viewed all nine current captures and checked22references before/after with zero drift. Both the pointer finding and documentation claim-scope finding are resolved; no open actionable proposal finding. Scoped proposal: **PASSED_REVIEWABLE_PREPARATION**. Actual candidate review is explicitly reused from immutable r4. Formal overall/Product Language review: **BLOCKED**. Production: **NOT_READY**. Application layout integration and human approval remain pending. All specialist leases are released; no application/production success claim is authorized by this report.
