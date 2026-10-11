# Product Content Review

## Scope

- Surface/component: release-preflight CLI JSON `limits` diagnostic, read by engineers/operators. No application UI or customer answer changed.
- Changed files: scripts/release/preflight.mjs; tests/unit/release-preflight067.test.ts.
- Audience and primary task: release operator checks the current source inventory and understands what that check proves before preparing an artifact.
- Business outcome: truthful release evidence and preserved approval boundaries.
- Locale and target platform: existing English technical CLI on Node22, plain stdout/stderr JSON/text; no interactive web/Apple control.
- Applicable conventions: stable JSON keys, array diagnostics, exit0 for a local source check and exit1 for rejected input/failure. Existing NOT_READY and PREPARED_NOT_DEPLOYED are retained.
- Apple HIG: NOT_APPLICABLE to this non-Apple CLI. Bundled human interface principles are used as a quality reference; no current Apple HIG compliance claimed.
- Reviewer/date: root,2026-10-08; independent TL content review follows.

## Context And Evidence

### Verified facts

- Current script SHA2f80ce7fcd20963be28c814f948a6d0dad3534d987630ef31a48476cc43eb57c.
- PREFLIGHT-FINAL.json is actual current CLI output: localChecks PASSED,93 source entries, errors[], readiness NOT_READY, compiledLibraryFreshness UNVERIFIED_NO_SOURCE_BUILD_MANIFEST, cloud/publicConfiguration NOT_CHECKED.
- Parser uses static AST/source reads only. Imported options are bounded; mutable/dynamic/unknown escapes are rejected in covered grammar. It does not execute source modules or prove effects in every runtime dependency.
- PREFLIGHT-REJECTED-PROJECT.json/CLI-INVALID-ARGS.log are current actual invocation evidence; exit1 and sanitized REJECTED/usage wording verified. Focused46/current fullunit1245/current Node consumer43 cases passed. CHECKS-r2.json binds receipts/current hashes.

### Assumptions

- Intended technical audience is inferred from scripts/release/artifact.mjs and existing release commands; ordinary shoppers do not see this diagnostic.
- CLI consumers may read or parse the same existing JSON. New sentence is additive in `limits`; keys and status meanings are preserved.

### Unknowns or blockers

- Full-program side effects, compiled-source binding, provider/authenticated production acceptance and approved release candidate remain unverified; the diagnostic explicitly limits these claims.
- Native screen-reader audio is NOT_RUN; output is plain terminal text with no hidden/color-only meaning. No browser/visual/Apple conformity is claimed.
- Production retention/corpus/layout and rollout decisions remain pending, independent of this scoped language check.

## Content Inventory

Current-content column refers to baseline; proposed-content is the applied candidate. New internal error identifiers are caught by the existing generic FUNCTION_INVENTORY_INVALID path and are not exposed directly; no customer strings changed.

| Location | State | Current content | Proposed content | User job | Behavior/data evidence |
| --- | --- | --- | --- | --- | --- |
| preflight result.limits | Local source check, including failure | No corresponding limit sentence | Static option uses checked only in parsed modules; no whole-program side-effect or runtime proof | Understand the exact boundary before using inventory as release evidence | PREFLIGHT-FINAL.json; current staticBinding/regionOf; focused mutation/shadow/cycle cases |

## State Coverage

| State | Applicable | Content or rationale | Evidence |
| --- | --- | --- | --- |
| Default/action | Yes | One source-check invocation; no new action/confirmation | Current CLI source and receipts |
| Loading/pending/disabled | No | Synchronous CLI adds no progress or UI state | Source; no timers/subscriptions |
| Empty/no result/true zero | Yes | errors[] means no detected local gate error; it does not mean zero production risks | PREFLIGHT-FINAL.json; tests verify no deployment certification |
| Success | Yes | PASSED refers to local checks; NOT_READY/PREPARED_NOT_DEPLOYED remain visible | Current final JSON |
| Error/recovery | Yes | Rejected project/invalid args preserve existing sanitized failure/usage output and exit1 | Current negative CLI receipts; unit missing/unsafe/dynamic options |
| Offline/stale/partial | Yes,source qualification | No network access; buildFreshness UNVERIFIED and provider NOT_CHECKED remain explicit; parsed-module limit is present | Current result fields and immutable tests |
| Unauthorized/forbidden | Input target rejection only | Incorrect production target rejected; no supplied target echoed | Current rejected-project JSON |
| Confirmation/destructive | No | This check writes no production data/deploys no Function; application/rollout authority remains outside CLI success | Source/approval/consumer handoff |

## Data Semantics

- Metric/field: inventory contains statically detected source export name/kind/region/source;93 is source count, not deployed count.
- Source of truth: source bytes recorded in result hashes; AST/static options; selected module and file budgets remain unchanged.
- Unknown/unavailable: compiledLibraryFreshness UNVERIFIED, cloud/publicConfiguration NOT_CHECKED, production NOT_READY are preserved. Missing/unresolved exports fail rather than becoming synthetic zero/pass.
- Units/currency/timezone: none added; no price, cost, date, retention or duration promise in this sentence.
- Freshness: current CLI uses current filesystem bytes; this does not prove compiled/package/provider equivalence or a whole runtime dependency graph.
- Privacy/authorization: read() rejects unsafe paths/symlink escapes/credential-like paths. No authentication, IAM, consent or paid-call authority added. No secrets/PII displayed; incorrect target input is masked.

## Mandatory Human Interface Principles

| Principle | Status | Current evidence or rationale |
| --- | --- | --- |
| Purpose | PASSED | Current output states the boundary operators need when interpreting a passing source check |
| Agency | PASSED | No forced action/new prompt; existing separate approval and deployment paths remain under human control |
| Responsibility | PASSED | Current JSON retains NOT_READY, UNVERIFIED and NOT_CHECKED; the sentence prevents unsupported runtime assurance |
| Familiarity | PASSED | Existing limits array/English Node CLI terminology and exit-code contract preserved |
| Flexibility | PASSED | Plain JSON/text supports terminal or parser use without color/hover/graphical dependencies; wrong-input path verified; no new locale-sensitive values |
| Simplicity | PASSED | One concise limit sentence, no duplicate status/action or extra interaction |
| Craft | PASSED | Actual current stdout plus two failure invocations inspected; mutation/shadowing regressions and consumer tests are current; fields/wording remain consistent |
| Delight | PASSED | Quiet factual diagnostics reduce operator guesswork without forced reassurance/celebration; no invented production success |

## Platform Fit

- Target: non-Apple technical CLI, not a visual/customer product surface.
- Conventions: stdout JSON array diagnostics and stderr usage line, exit code and stable structured keys; current positive/negative invocations verify them.
- Product design boundary: no application styling/component/localization change; existing SatsunicGo UI retained.
- Apple-only expression risk: none; no copied controls/assets/trade dress.
- Platform-fit result: PASSED for current Node22 CLI contract; screen-reader audio NOT_RUN is recorded separately.

## Human Interface Pattern Checks

| Pattern | Applicable | Result | Evidence or rationale |
| --- | --- | --- | --- |
| Writing,labels,controls | Diagnostic writing | PASSED | One factual technical limit in actual CLI context; no customer control |
| Feedback/interruption | Yes | PASSED | Synchronous existing result/exit behavior; no added interruption |
| Alerts/consequential choices | No | NOT_APPLICABLE | No alert, confirm, delete or deploy action |
| Onboarding/contextual help | Existing usage only | PASSED | Current invalid-argument invocation retains implementable usage line |
| Permission/privacy/accounts | No new permission | PASSED | Wrong project sanitized; source check grants no production/retention authority |
| Inclusion/accessibility/localization/RTL | Plain technical text | PASSED | No new visual-only meaning or locale-sensitive values; terminal/JSON conventions retained; audio not claimed |

## Gate Results

| Dimension | Status | Evidence or rationale |
| --- | --- | --- |
| Human Interface principles | PASSED | All8 mapped above to actual output/behavior |
| Target-platform fit | PASSED | Node22 CLI positive/negative receipts |
| Meaning matches behavior | PASSED | Static parsed-module check matches explicit limit; runtime/build/provider not implied |
| Audience/business context | PASSED | Existing artifact/release consumers, operator interpretation task |
| Natural,respectful tone | PASSED | Calm factual technical wording; no blame, pressure or promise |
| Concise without meaning loss | PASSED | One decision-relevant sentence |
| Actions/state coverage | PASSED | Success/reject/usage/unverified fields verified; inapplicable UI states explicitly excluded |
| Data semantics/privacy | PASSED | Source inventory and missing proof distinguished; no raw private target echo |
| Accessibility | PASSED | Plain textual information; no new color/icon/hidden dependency; audio NOT_RUN, not asserted |
| Localization/text expansion | NOT_APPLICABLE | Existing technical English CLI, no new localized region/date/currency or fixed-width UI |
| Terminology consistency | PASSED | Source/static/parsed-module terminology matches implementation and existing limits |
| In-context verification | PASSED | PREFLIGHT-FINAL.json, rejected-project JSON and invalid-args log are actual current invocations |

## Verification Evidence

- Rendered surface: actual current terminal JSON/text receipts; no browser viewport applies.
- States/data: current repository source93 entries, wrong project, invalid argument; synthetic unit/consumer failure fixtures.
- Keyboard/AT: shell invocation uses existing CLI input; audio NOT_RUN. No focus/gesture/animation component changed.
- Localization/scaling: no visual layout or locale formatting changed.
- Automated: focused46/46, fullunit1245/1245, Node43/43, scoped/full lint and compiler0; see CHECKS-r2.json.
- Not available: runtime effects/build/provider/live identity and production proof, native audio.

## Decision

- Product Language Gate: PASSED for the single operator-facing limit sentence only, pending independent TL confirmation.
- Findings fixed: parsed-module/runtime boundary now explicit; original machine statuses preserved.
- Residual risks: technical static check remains conservative and incomplete for full runtime effects. Actual production gates remain NOT_READY.
- Required owner decision: none for this already approved operator diagnostic; separate policy/retention/layout/rollout decisions remain pending.
