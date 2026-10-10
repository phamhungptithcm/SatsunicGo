# Product Content Review · Dashboard required dates

## Scope

- Surface: `AnalyticsOverview` custom UTC range in `src/features/crm/Dashboard.tsx`.
- Audience/task: Vietnamese CRM staff selecting the start and end dates for a read-only statistics view.
- Business outcome: make the two existing mandatory dates visible as required before Apply.
- Locale/platform: Vietnamese labels in a web form; native browser date controls. Chromium fixture uses its default en-US native date display.
- Conventions: persistent wrapping labels, native `required`, shared decorative `requiredMark`, keyboard navigation. Apple principles are a human-centered reference; Apple-platform HIG compliance is not claimed.
- Reviewer: frontend_engineer, 2026-10-08. Scope is the two marker additions, not the concurrent Analytics implementation.

## Context and evidence

Verified: both date inputs were already native required; the original source and 320px baseline render lacked markers. The source-approved delta adds one `aria-hidden="true"` star per label, with an inline wrapper. Removing these exact two decorated label fragments reconstructs the current pre-edit baseline byte for byte (`SOURCE-MANIFEST.json`, `owned-dashboard.patch`). Values, UTC interpretation, events, API calls and validation remain the existing implementation.

Rendered evidence: `screenshots/current-{320,390,1440,720}-fields.png` and matching context screenshots, `current-*-readback.json`, `current-*-ax.yaml`, `current-*-native-ax.json`, and `current-*-interaction.json`. All four browser cases passed (`browser-after.log`). Native input and label bounds remain inside each viewport; document scroll width equals client width. The 720 CSSpx view is a 1440px-at-200% layout proxy, not native browser zoom.

Assumption: the established repository star convention communicates an existing mandatory field. No new domain requirement is inferred from decoration.

Limitations: screen-reader audio, native zoom, cross-browser/device and deployed staff flow were not run. Chromium153 native Date nodes preserve the exact normalized field names but omit a required-state property both before and after; DOM `required` and native `valueMissing` blocking are verified separately. The fixture bypasses authentication and supplies synthetic analytics reads; it does not prove staff authorization, live analytics or production readiness.

## Content inventory

| Location | State | Before | After | User job | Behavior evidence |
| --- | --- | --- | --- | --- | --- |
| Custom start label | Shown, filled, focus, empty | Từ ngày (UTC) | Từ ngày (UTC) plus decorative * | Supply the mandatory UTC start date | Existing input `required`; empty submission blocks a new analytics read |
| Custom end label | Shown, filled, focus | Đến ngày (UTC) | Đến ngày (UTC) plus decorative * | Supply the mandatory UTC end date | Existing input `required`; keyboard reaches and edits the field |
| Both accessible names | All visible field states | Từ ngày (UTC); Đến ngày (UTC) | Unchanged; star hidden from AX | Recognize the persistent field name | Exact `getByRole` names and native CDP Date names; current AX YAML |

## State coverage

| State | Applicable | Content/rationale | Evidence |
| --- | --- | --- | --- |
| Default/action | Yes | Custom range opens with keyboard; both labels identify UTC and their markers | Four layouts, screenshots, keyboard assertions |
| Loading/pending/disabled | No changed content | Marker patch does not change fetch state or controls | Exact owned patch |
| Empty/no result/true zero | Empty date applies | Native missing-value validation blocks Apply and preserves the other value | Four interaction JSON files |
| Success | Filled-range Apply | Same-day range applies with URL/date values preserved; no new success message | Browser suite and interaction JSON |
| Error/recovery | Native required error | Date can be refilled; no marker-induced field reset or extra read | Browser suite; applied-range hydration settled before next edit |
| Offline/stale/partial | No changed content | Existing analytics states remain outside this two-marker review | Exact owned patch |
| Unauthorized/forbidden | No changed content | Marker patch changes no access check; fixture does not verify access | Source diff and stated fixture boundary |
| Confirmation/destructive | Not applicable | Read-only date filter has no new consequential action | Source diff |

## Data semantics

Start/end are ISO date values interpreted by the existing UTC `resolvePeriod` contract. It validates ordering, at most 31 days and no future UTC end date. Dates are filter inputs, not timestamps, payment evidence or a guarantee that analytics coverage exists. No metric, currency, freshness, aggregation, zero/unavailable or privacy meaning is changed. Tests use synthetic reads; screenshots are not actual business statistics.

## Mandatory Human Interface principles

| Principle | Status | Current evidence |
| --- | --- | --- |
| Purpose | PASSED | Each marker identifies the already mandatory date needed to apply the range; no additional task or message |
| Agency | PASSED | Keyboard opens the optional custom range, reaches both inputs and Apply, and edits/refills them; no automatic submission added |
| Responsibility | PASSED | Stars match native required fields; UTC remains visible; no invented validation, save, financial or coverage claim |
| Familiarity | PASSED | Existing Vietnamese date terminology, native web date controls and the repository's shared decorative star pattern |
| Flexibility | PASSED | 320/390/1440 and720 layout proxy fit without overflow; keyboard works; native semantics and normalized accessible names remain unchanged |
| Simplicity | PASSED | Two concise markers; no new instruction, interruption, step, API or control |
| Craft | PASSED | Real current component, field screenshots, native AX and DOM readbacks, required-label unit, keyboard/empty-value checks, compiler and scoped lint |
| Delight | PASSED | The requirement is visible before entry and does not add redundant star speech to the field name; calm utility without extra animation or celebration |

## Platform fit and pattern checks

Web conventions and the existing product system govern this delta. No Apple-only component, terminology or expression is added. Persistent labels, native validation, keyboard use and current field rendering pass. Feedback/interruptions, alerts, onboarding, permission/account flows and destructive controls are unchanged or not applicable. Labels are Vietnamese and the star is locale neutral; no English translation was added. Native browser date localization is preserved, not reformatted by this patch. RTL and screen-reader audio were not run and are not claimed.

## Gate results

| Dimension | Status | Evidence |
| --- | --- | --- |
| All eight principles | PASSED | Mapping above for this two-marker slice |
| Target-platform fit | PASSED | Native web labels/date controls and current browser evidence |
| Meaning matches behavior | PASSED | Required before and after; marker follows that same requirement |
| Audience/business context | PASSED | Existing CRM staff date filter; source and frozen task brief |
| Natural, respectful tone | PASSED | Unchanged familiar Vietnamese labels; no new prose |
| Concise without meaning loss | PASSED | Star beside each existing UTC label |
| Actions/state coverage | PASSED | Shown/filled/focus/empty and Apply exercised; other content unchanged |
| Data semantics/privacy | PASSED | No value, UTC, API, metric or permission change; synthetic data clearly qualified |
| Accessibility of marker delta | PASSED | Hidden star, native required DOM/validation, persistent native AX names and keyboard; native AX required-property/audio limitations disclosed |
| Localization/text expansion | PASSED | Labels unchanged; four current widths and720 layout proxy; native locale limitation disclosed |
| Terminology consistency | PASSED | Same date/UTC labels and shared marker class |
| In-context verification | PASSED | Current cropped fields/context screenshots and readbacks |

## Decision

Product Language Gate: **PASSED for the two-marker delta**. Missing markers fixed; no whole-Dashboard, cross-browser, AT-audio, provider, deployed or production certification follows. Root owns the fresh independent final review and broader production-readiness decision.
