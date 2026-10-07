# Product Content Review — SHIPPING-RATES-030

## Scope
Standalone proposed public web mockup, Vietnamese, customers estimating freight. Reviewer: Codex, 2026-10-06. Artifact: docs/previews/shipping-rates030/index.html. Browser rendering blocked by browser file-URL policy; no claim of rendered verification or Apple HIG compliance.

## Context and evidence
Source verified: freight only, exact VN weight marks, US minimum 1 kg, Oregon confirmation, VND/USD separated, conditions and reference prices copied from current source. No network calls or persistence in mockup. Actual tariff freshness and backend failure cause unknown. Default 2 kg is design assumption. Mock request explicitly says simulation.

## Content inventory
All visible strings are inventoried in the single HTML: header/preview marker, heading/intro, state selector, route tabs, warehouse/service options, weight label/help/presets, product label/placeholder/options, result heading/amount/explanation, route/chargeable weight, exclusions, request CTA/dialog/summary/textarea/example/simulation receipt/close, table heading/caption/rows/source, conditions, footer, loading/error/offline/unpublished and retry. Dynamic row values/conditions come from reference.json; both files are frozen in SOURCE_MANIFEST.json. No application string changed.

## State coverage
| State | Proposed behavior | Evidence |
| --- | --- | --- |
| Default/selected | Route tabs, dependent fields, calculator and table | HTML source |
| Loading | Shell/input retained, no displayed numeric cước | HTML source; browser NOT_RUN |
| Empty/unpublished | Chưa có bảng giá công khai; no numeric estimate | HTML source |
| Success | Numeric freight only; simulation receipt explicitly says not sent/saved | HTML source |
| Error/recovery | Chưa tải được bảng giá; inputs retained, retry | HTML source |
| Offline | No claim that source prices are current | HTML source |
| Stale/partial | Source reference marked unverified; missing price → needs quote | HTML source |
| Unauthorized | NOT_APPLICABLE: isolated public mockup, no auth/admin |
| Confirmation/destructive | NOT_APPLICABLE: no destructive or durable action |

## Data semantics
Integer VND or USD cents; source reference not published/live. Weight kg displayed, grams used in calculation. Invalid weight distinct from quote-required and unavailable. No exchange rates, zero-as-unavailable or delivery guarantees. No customer PII collected or transmitted. Source conditions are detailed guidance, not live commercial verification.

## Mandatory principles
| Principle | Status | Evidence / missing evidence |
| --- | --- | --- |
| Purpose | PASSED | Single freight estimation task |
| Agency | PASSED | Route/weight editable; native dialog close/Escape available by source |
| Responsibility | PASSED | Freight-only, exclusions, reference and simulation disclosed |
| Familiarity | PASSED | Native web inputs, selects, buttons, details |
| Flexibility | NOT_RUN | Responsive CSS exists; rendered mobile, zoom and keyboard unverified |
| Simplicity | PASSED | Core input/result first, conditions collapsed |
| Craft | NOT_RUN | Syntax passed; in-context rendering and all interactions unverified |
| Delight | NOT_RUN | Intended quick choices/recovery; usability unverified |

## Platform fit and pattern checks
Web-native controls, no Apple-only assets or interaction copied. Royal blue/white adapted within product identity. Labels and state wording reviewed against source. No forced account creation or transmission. Keyboard and focus CSS, labels, table scopes, live regions present by source; assistive technology behavior NOT_RUN. Vietnamese locale formatting implemented; English localization, long-text, 200% zoom and text expansion NOT_RUN for prototype. Permission/destructive flows NOT_APPLICABLE. Current platform-fit review remains unverified in rendered context.

## Gate results and verification
Meaning, context, tone, terminology, data semantics and privacy: source-reviewed PASSED. Accessibility, localization/text expansion, full state interactions, in-context verification: NOT_RUN. JavaScript syntax PASSED; no network calls static check PASSED; existing domain tests 36/36 PASSED. No screenshot exists. Browser rejected file:// by URL policy; no circumvention attempted.

## Decision
Product Language Gate BLOCKED for implementation handoff due to missing rendered evidence. This is a reviewable design proposal, not a repaired/deployed application. Required next steps: human plan approval, safe approved rendering environment and implementation validation.

## Revision 2 — requested simplification
User authorized refinement of the standalone mockup only. New heading: Cước vận chuyển. Removed hero, explanatory introduction, redundant form title, repeated source/result prose and default visible state tools. Default flow retains route/service/kg/result; VN warehouse and US cargo service are hidden because each is a single choice. Source data and calculation unchanged. Table and conditions collapsed; review-only state control below footer. Price-reference and fee exclusions remain visible. CTA Nhờ xác nhận cước still opens simulation dialog; no transmission. Dynamic errors shortened while preserving recovery. Quick-weight selection now has aria-pressed feedback. Result uses 180ms fade/4px shift; route indicator 240ms; reduced-motion disables both. Fixed single-choice warehouse layout to full width. Current JS syntax/no-network static checks PASSED. Browser render, keyboard, text scaling, screen reader and motion appearance NOT_RUN; newest content gate remains BLOCKED for implementation handoff. User screenshot is evidence of previous revision, not current render. All strings/current artifact bound by updated manifest.
